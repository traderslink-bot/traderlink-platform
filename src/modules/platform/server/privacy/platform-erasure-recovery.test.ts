// @vitest-environment node
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { PlatformErasureRecovery, type ErasureObjectStore } from "./platform-erasure-recovery";
import { platformErasureRecoverySchemaStatements } from "./platform-erasure-recovery-schema";
import type { PlatformErasureArtifact } from "./platform-erasure-service";

const artifacts: PlatformErasureArtifact[] = [0, 1].map((n) => ({ kind: "support_source",
  objectKey: `synthetic${n}`, sourceFileSha256: "a".repeat(64), sourceFileSizeBytes: 10 }));
function fixture() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE journal_import_batches(evidence_object_key TEXT);
    CREATE TABLE journal_statement_support_objects(object_key TEXT);
    CREATE TABLE accounts(id INTEGER PRIMARY KEY); INSERT INTO accounts VALUES(1);`);
  for (const sql of platformErasureRecoverySchemaStatements) db.exec(sql);
  const bytes = new Set(artifacts.map((a) => a.kind === "support_source" ? a.objectKey : ""));
  const objectKey = (a: PlatformErasureArtifact) => a.kind === "support_source" ? a.objectKey : a.evidenceObjectKey;
  const store: ErasureObjectStore = {
    identity: () => "synthetic-vault",
    verify(a) { if (!bytes.has(objectKey(a))) throw new Error("missing"); },
    exists: (a) => bytes.has(objectKey(a)),
    purge(a) { this.verify(a); bytes.delete(objectKey(a)); },
    syncDirectory() {},
  };
  const recovery = new PlatformErasureRecovery(db, store);
  const commit = () => db.transaction(() => {
    db.prepare("DELETE FROM accounts").run();
    return recovery.record("trade_tracker_account", "b".repeat(64), artifacts);
  }).immediate();
  return { db, bytes, recovery, commit, store };
}

describe("durable erasure obligations", () => {
  it("SQL rollback preserves all bytes and leaves no purge job", () => {
    const { db, bytes, recovery } = fixture();
    try {
      expect(() => db.transaction(() => {
        db.prepare("DELETE FROM accounts").run();
        recovery.record("trade_tracker_account", "b".repeat(64), artifacts);
        throw new Error("foreign_key_check_or_commit_failure");
      }).immediate()).toThrow();
      expect(bytes.size).toBe(2);
      expect(recovery.pending()).toBeNull();
      expect(db.prepare("SELECT COUNT(*) AS n FROM accounts").get()).toEqual({ n: 1 });
    } finally { db.close(); }
  });
  it.each(["intent_committed", "unlinked", "receipt_committed"])("resumes an interruption after %s without repeating deletion", (phase) => {
    const { db, bytes, recovery, commit, store } = fixture();
    try {
      const id = commit();
      expect(() => recovery.finish(id, (p, n) => { if (p === phase && n === 0) throw new Error("interruption"); })).toThrow("interruption");
      expect(db.prepare("SELECT COUNT(*) AS n FROM accounts").get()).toEqual({ n: 0 });
      const restarted = new PlatformErasureRecovery(db, store);
      restarted.finish(id); restarted.finish(id);
      expect(bytes.size).toBe(0);
      expect(restarted.pending()).toBeNull();
      expect(db.prepare("SELECT * FROM platform_erasure_objects").all()).toEqual([]);
      expect(db.prepare("SELECT target_binding_sha256 FROM platform_erasure_operations").get()).toEqual({ target_binding_sha256: null });
    } finally { db.close(); }
  });
  it("retains a newly shared object published between commit and purge", () => {
    const { db, bytes, recovery, commit } = fixture();
    try {
      const id = commit();
      db.prepare("INSERT INTO journal_statement_support_objects VALUES(?)").run("synthetic0");
      recovery.finish(id);
      expect([...bytes]).toEqual(["synthetic0"]);
    } finally { db.close(); }
  });
  it("rechecks sharing after committing unlink intent", () => {
    const { db, bytes, recovery, commit } = fixture();
    try {
      const id = commit();
      recovery.finish(id, (phase, ordinal) => {
        if (phase === "intent_committed" && ordinal === 0) {
          db.prepare("INSERT INTO journal_statement_support_objects VALUES(?)").run("synthetic0");
        }
      });
      expect([...bytes]).toEqual(["synthetic0"]);
    } finally { db.close(); }
  });
  it("does not claim completion when an obligation row is missing", () => {
    const { db, bytes, recovery, commit } = fixture();
    try {
      const id = commit();
      db.prepare("DELETE FROM platform_erasure_objects WHERE operation_id=? AND ordinal=0").run(id);
      expect(() => recovery.finish(id)).toThrow("erasure_obligation_manifest_incomplete");
      expect(bytes.size).toBe(2);
      expect(recovery.pending() === id).toBe(true);
    } finally { db.close(); }
  });
  it("rejects missing prepared bytes and keeps the pending obligation", () => {
    const { db, bytes, recovery, commit } = fixture();
    try {
      const id = commit(); bytes.delete("synthetic0");
      expect(() => recovery.finish(id)).toThrow("missing");
      expect(recovery.pending()).toBe(id);
      expect(() => commit()).toThrow();
    } finally { db.close(); }
  });
  it("cannot purge within the deletion transaction", () => {
    const { db, bytes, recovery, commit } = fixture();
    try {
      const id = commit();
      expect(() => db.transaction(() => recovery.finish(id)).immediate()).toThrow("erasure_purge_before_commit");
      expect(bytes.size).toBe(2);
    } finally { db.close(); }
  });
});
