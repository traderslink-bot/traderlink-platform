// @vitest-environment node
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { PlatformErasureHistory, ERASURE_HISTORY_RETENTION_MS, type ErasureHistoryRow } from "./platform-erasure-history";
import { platformErasureRecoverySchemaStatements } from "./platform-erasure-recovery-schema";
import { PlatformErasureRecovery, type ErasureObjectStore } from "./platform-erasure-recovery";

function fixture() {
  const db = new Database(":memory:");
  for (const sql of platformErasureRecoverySchemaStatements) db.exec(sql);
  let now = Date.now();
  const history = new PlatformErasureHistory(db, () => new Date(now));
  const accept = (id: string) => db.transaction(() => history.accept({ receiptId: id,
    memberUserId: "synthetic_member", displayName: "Synthetic member", action: "traderlink_account" })).immediate();
  const row = (id: string) => db.prepare<[string], ErasureHistoryRow>("SELECT * FROM platform_erasure_history WHERE receipt_id=?").get(id)!;
  const noObjects: ErasureObjectStore = { identity: () => "synthetic", verify() {}, exists: () => false, purge() {}, syncDirectory() {} };
  const recovery = new PlatformErasureRecovery(db, noObjects);
  return { db, history, accept, row, recovery, advance: (ms: number) => { now += ms; }, now: () => new Date(now).toISOString() };
}

describe("30-day explicit member-linked erasure history", () => {
  it("stores only contracted metadata and fixes expiry at acceptance", () => {
    const f = fixture();
    try {
      f.accept("receipt"); const before = f.row("receipt");
      expect(before.phase).toBe("accepted");
      expect(Date.parse(before.expires_at_utc) - Date.parse(before.accepted_at_utc)).toBe(ERASURE_HISTORY_RETENTION_MS);
      expect(Object.keys(before).sort()).toEqual(["receipt_id", "member_user_id", "member_display_name", "action", "phase", "accepted_at_utc", "updated_at_utc", "committed_at_utc", "finished_at_utc", "expires_at_utc", "safe_failure_kind"].sort());
      f.advance(1000); f.history.failed("receipt");
      expect(f.row("receipt").phase).toBe("not_deleted");
      expect(f.row("receipt").expires_at_utc).toBe(before.expires_at_utc);
      expect(f.row("receipt").committed_at_utc).toBeNull();
    } finally { f.db.close(); }
  });
  it("does not fabricate committed/complete evidence without a matching durable outbox", () => {
    const f = fixture();
    try {
      f.accept("receipt");
      f.db.transaction(() => { f.history.committed("receipt"); f.history.completed("receipt"); }).immediate();
      expect(f.row("receipt").phase).toBe("accepted");
    } finally { f.db.close(); }
  });
  it("atomically links committed and complete outcomes and never calls postcommit failure not_deleted", () => {
    const f = fixture();
    try {
      f.accept("receipt"); const expires = f.row("receipt").expires_at_utc;
      f.db.transaction(() => f.recovery.record("traderlink_account", "a".repeat(64), [], "receipt")).immediate();
      expect(f.row("receipt").phase).toBe("committed_cleanup_pending");
      f.history.failed("receipt");
      expect(f.row("receipt").phase).toBe("committed_cleanup_pending");
      expect(f.row("receipt").safe_failure_kind).toBe("cleanup_unavailable");
      f.recovery.finish("receipt");
      expect(f.row("receipt").phase).toBe("complete");
      expect(f.row("receipt").safe_failure_kind).toBeNull();
      expect(f.row("receipt").expires_at_utc).toBe(expires);
      expect(f.db.prepare("SELECT target_binding_sha256 FROM platform_erasure_operations").get()).toEqual({ target_binding_sha256: null });
    } finally { f.db.close(); }
  });
  it("marks interrupted acceptance unknown without constructing a deletion job", () => {
    const f = fixture();
    try {
      f.accept("receipt");
      expect(f.history.reconcileInterrupted()).toBe(1);
      expect(f.row("receipt").phase).toBe("outcome_unknown");
      expect(f.row("receipt").committed_at_utc).toBeNull();
      expect(f.recovery.pending()).toBeNull();
      expect(f.history.reconcileInterrupted()).toBe(0);
    } finally { f.db.close(); }
  });
  it("bounds interrupted-acceptance reconciliation without dropping remaining receipts", () => {
    const f = fixture();
    try {
      for (let n = 0; n < 130; n++) f.accept(`receipt_${n}`);
      expect(f.history.reconcileInterrupted(1000)).toBe(128);
      expect(f.db.prepare("SELECT COUNT(*) AS n FROM platform_erasure_history WHERE phase='accepted'").get()).toEqual({ n: 2 });
      expect(f.history.reconcileInterrupted()).toBe(2);
      expect(f.recovery.pending()).toBeNull();
    } finally { f.db.close(); }
  });
  it("excludes expired history immediately and physically deletes only a bounded batch", () => {
    const f = fixture();
    try {
      for (let n = 0; n < 130; n++) f.accept(`receipt_${n}`);
      f.advance(ERASURE_HISTORY_RETENTION_MS);
      expect(f.db.prepare("SELECT COUNT(*) AS n FROM platform_erasure_history WHERE expires_at_utc>?").get(f.now())).toEqual({ n: 0 });
      expect(f.history.purgeExpired()).toBe(128);
      expect(f.db.prepare("SELECT COUNT(*) AS n FROM platform_erasure_history").get()).toEqual({ n: 2 });
      expect(f.history.purgeExpired()).toBe(2);
    } finally { f.db.close(); }
  });
  it("does not recreate expired identity history when an unfinished job later completes", () => {
    const f = fixture();
    try {
      f.accept("receipt");
      f.db.transaction(() => f.recovery.record("traderlink_account", "a".repeat(64), [], "receipt")).immediate();
      f.advance(ERASURE_HISTORY_RETENTION_MS + 1); f.history.purgeExpired();
      f.recovery.finish("receipt");
      expect(f.row("receipt")).toBeUndefined();
      expect(f.recovery.pending()).toBeNull();
      expect(() => f.accept("receipt")).toThrow("erasure_history_receipt_already_used");
    } finally { f.db.close(); }
  });
});
