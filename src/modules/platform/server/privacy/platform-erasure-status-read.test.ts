// @vitest-environment node
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { platformErasureRecoverySchemaStatements } from "./platform-erasure-recovery-schema";
import { erasureViewerRef, readAccountErasureStatus } from "./platform-erasure-status-read";
import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";

const scope: WorkspaceAccessScope = { userId: randomUUID(), workspaceId: randomUUID(), workspaceRole: "owner", activeAccountId: null, allowedAccountIds: [] };
const now = new Date("2026-11-20T06:00:00.000Z"), at = "2026-11-19T00:00:00.000Z", until = "2026-12-19T00:00:00.000Z";
let db: Database.Database;
beforeEach(() => {
  db = new Database(":memory:");
  for (const sql of platformErasureRecoverySchemaStatements) db.exec(sql);
  // Reader projections only: explicit synthetic module rows, not admission fixtures.
  db.exec(`CREATE TABLE platform_erasure_lifecycles(lifecycle_ref TEXT,user_id TEXT);
    CREATE TABLE platform_erasure_module_operations(operation_ref TEXT,lifecycle_ref TEXT,workspace_id TEXT,phase TEXT);
    CREATE TABLE platform_erasure_operation_claims(operation_ref TEXT);`);
});
afterEach(() => db.close());
function history(phase = "accepted", user = scope.userId, expiry = until, failure: string | null = null) {
  const id = randomUUID();
  db.prepare("INSERT INTO platform_erasure_history VALUES(?,?,?,'traderlink_account',?,?,?,NULL,NULL,?,?)")
    .run(id, user, "PRIVATE name must never be returned", phase, at, at, expiry, failure);
  return id;
}
function read(receipt: string | null = null) {
  db.pragma("query_only=ON"); return readAccountErasureStatus(db, scope, receipt, now);
}
describe("bounded owned erasure status with real isolated readonly SQLite", () => {
  it("requires a readonly connection and a strict locator", () => {
    expect(() => readAccountErasureStatus(db, scope)).toThrow("readonly_connection_required");
    db.pragma("query_only=ON"); expect(() => readAccountErasureStatus(db, scope, "not-a-receipt")).toThrow("invalid_receipt_locator");
  });
  it("does not disclose foreign/expired/missing receipt identities or private columns", () => {
    const own = history(), foreign = history("accepted", randomUUID()), expired = history("accepted", scope.userId, now.toISOString());
    const result = read(own);
    expect(result.exact?.receiptRef).toBe(own); expect(result.correlation).toBe("server_receipt");
    for (const id of [foreign, expired, randomUUID()]) expect(read(id).exact).toBeNull();
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|member_user_id|member_display_name|workspaceId|claim|ticket/u);
    expect(result.viewerRef).toBe(erasureViewerRef(scope.userId));
  });
  it("keeps recent and pending information distinct from an original receipt", () => {
    for (let i = 0; i < 13; i++) history();
    db.prepare("INSERT INTO platform_erasure_lifecycles VALUES(?,?)").run("l", scope.userId);
    db.prepare("INSERT INTO platform_erasure_module_operations VALUES(?,?,?,?)").run(randomUUID(), "l", scope.workspaceId, "failed");
    const result = read(); expect(result.recent).toHaveLength(10); expect(result.more).toBe(true);
    expect(result.exact).toBeNull(); expect(result.correlation).toBe("recent_only"); expect(result.currentPending).toBe(true);
  });
  it.each(["prepared", "settling", "failed", "logical_deleted", "complete"])("never calls module %s or an expired lease a rollback", phase => {
    const id = history("not_deleted", scope.userId, until, "transaction_rolled_back");
    db.prepare("INSERT INTO platform_erasure_module_operations VALUES(?,?,?,?)").run(id, "l", scope.workspaceId, phase);
    expect(read(id).exact).toMatchObject({ phase: "outcome_unknown", failure: null });
  });
  it("requires genuine rollback history with no outbox/module/claim evidence", () => {
    const rolled = history("not_deleted", scope.userId, until, "transaction_rolled_back"), vague = history("not_deleted");
    const claimed = history("not_deleted", scope.userId, until, "transaction_rolled_back");
    db.prepare("INSERT INTO platform_erasure_operation_claims VALUES(?)").run(claimed);
    expect(read(rolled).exact?.phase).toBe("not_deleted"); expect(read(vague).exact?.phase).toBe("outcome_unknown");
    expect(read(claimed).exact?.phase).toBe("outcome_unknown");
  });
  it("preserves committed cleanup and never infers completion from a missing operation", () => {
    const cleanup = history("committed_cleanup_pending"), unsupported = history("complete"), complete = history("complete");
    db.prepare("INSERT INTO platform_erasure_operations VALUES(?,NULL,'traderlink_account','complete',NULL,?,?,0)").run(complete, at, at);
    expect(read(cleanup).exact?.phase).toBe("committed_cleanup_pending");
    expect(read(unsupported).exact?.phase).toBe("outcome_unknown"); expect(read(complete).exact?.phase).toBe("complete");
  });
  it("does not write, purge, renew expiry or construct participants", () => {
    const id = history("outcome_unknown");
    const changes = db.prepare("SELECT total_changes() n").get();
    const before = db.prepare("SELECT * FROM platform_erasure_history").all();
    expect(read(id).exact?.expiresAtUtc).toBe(until);
    expect(db.prepare("SELECT * FROM platform_erasure_history").all()).toEqual(before);
    expect(db.prepare("SELECT total_changes() n").get()).toEqual(changes);
    expect(readAccountErasureStatus(db, scope, id, new Date(until)).exact).toBeNull();
  });
  it("never presents contradictory committed history as a proven rollback", () => {
    const id = history("not_deleted", scope.userId, until, "transaction_rolled_back");
    db.prepare("UPDATE platform_erasure_history SET committed_at_utc=? WHERE receipt_id=?").run(at, id);
    expect(read(id).exact?.phase).toBe("outcome_unknown");
  });
  it("holds new requests for this member's unexpired pending cleanup", () => {
    const id = history("committed_cleanup_pending");
    db.prepare("INSERT INTO platform_erasure_operations VALUES(?,NULL,'traderlink_account','purge_pending',1,?,NULL,0)").run(id, at);
    const result = read(); expect(result.currentPending).toBe(true); expect(result.exact).toBeNull();
  });
  it.each(["foreign", "expired"])("does not use %s history to claim self-owned pending cleanup", kind => {
    const id = history("committed_cleanup_pending", kind === "foreign" ? randomUUID() : scope.userId, kind === "expired" ? now.toISOString() : until);
    db.prepare("INSERT INTO platform_erasure_operations VALUES(?,NULL,'traderlink_account','purge_pending',1,?,NULL,0)").run(id, at);
    expect(read().currentPending).toBe(false);
  });
});
