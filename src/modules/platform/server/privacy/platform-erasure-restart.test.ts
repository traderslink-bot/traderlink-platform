// @vitest-environment node
import Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdtempSync, openSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { PlatformErasureRecovery, type ErasureObjectStore } from "./platform-erasure-recovery";
import { platformErasureRecoverySchemaStatements } from "./platform-erasure-recovery-schema";
import type { PlatformErasureArtifact } from "./platform-erasure-service";
import { PlatformErasureHistory } from "./platform-erasure-history";

function fileStore(root: string): ErasureObjectStore {
  const path = (artifact: PlatformErasureArtifact) => join(root,
    artifact.kind === "support_source" ? artifact.objectKey : artifact.evidenceObjectKey);
  return {
    identity: () => "synthetic_private_directory",
    verify(artifact) {
      const bytes = readFileSync(path(artifact));
      if (bytes.length !== artifact.sourceFileSizeBytes || createHash("sha256").update(bytes).digest("hex") !== artifact.sourceFileSha256) throw new Error("mismatch");
    },
    exists: (artifact) => existsSync(path(artifact)),
    purge(artifact) { this.verify(artifact); unlinkSync(path(artifact)); this.syncDirectory(artifact); },
    syncDirectory() { const fd = openSync(root, "r"); try { fsyncSync(fd); } finally { closeSync(fd); } },
  };
}

describe("actual process interruption with disposable WAL and private files", () => {
  it("records interrupted admitted acceptance as unknown without replaying deletion", () => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-erasure-accepted-crash-"));
    const databasePath = join(root, "synthetic.sqlite");
    let db: Database.Database | undefined;
    try {
      db = new Database(databasePath); db.pragma("journal_mode=WAL"); db.pragma("synchronous=FULL");
      for (const sql of platformErasureRecoverySchemaStatements) db.exec(sql);
      db.exec("CREATE TABLE accounts(id INTEGER PRIMARY KEY); INSERT INTO accounts VALUES(1);");
      db.close(); db = undefined;
      const source = `const path=require('node:path');const Database=require('better-sqlite3');
        const {PlatformErasureHistory}=require(path.resolve('src/modules/platform/server/privacy/platform-erasure-history.ts'));
        const db=new Database(process.argv[1]);db.pragma('synchronous=FULL');
        db.transaction(()=>new PlatformErasureHistory(db).accept({receiptId:'synthetic_receipt',memberUserId:'synthetic_member',displayName:'Synthetic member',action:'traderlink_account'})).immediate();
        process.exit(42);`;
      const child = spawnSync(process.execPath, ["--require", "tsx/cjs", "-e", source, databasePath], {
        cwd: process.cwd(), encoding: "utf8", timeout: 10_000,
      });
      expect(child.status).toBe(42);
      db = new Database(databasePath);
      expect(db.prepare("SELECT phase FROM platform_erasure_history").get()).toEqual({ phase: "accepted" });
      new PlatformErasureHistory(db).reconcileInterrupted();
      expect(db.prepare("SELECT phase FROM platform_erasure_history").get()).toEqual({ phase: "outcome_unknown" });
      expect(db.prepare("SELECT COUNT(*) AS n FROM accounts").get()).toEqual({ n: 1 });
      expect(db.prepare("SELECT COUNT(*) AS n FROM platform_erasure_operations").get()).toEqual({ n: 0 });
    } finally { db?.close(); rmSync(root, { recursive: true, force: true }); }
  });
  it.each(["intent_committed", "unlinked", "receipt_committed"])("recovers after process exit at %s", (phase) => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-erasure-crash-"));
    const databasePath = join(root, "synthetic.sqlite");
    let db: Database.Database | undefined;
    try {
      db = new Database(databasePath);
      db.pragma("journal_mode=WAL"); db.pragma("synchronous=FULL");
      db.exec(`CREATE TABLE journal_import_batches(evidence_object_key TEXT);
        CREATE TABLE journal_statement_support_objects(object_key TEXT);
        CREATE TABLE accounts(id INTEGER PRIMARY KEY); INSERT INTO accounts VALUES(1);`);
      for (const sql of platformErasureRecoverySchemaStatements) db.exec(sql);
      const artifacts: PlatformErasureArtifact[] = ["object_a", "object_b"].map((objectKey) => {
        const bytes = Buffer.from(`synthetic:${objectKey}`); writeFileSync(join(root, objectKey), bytes);
        return { kind: "support_source", objectKey, sourceFileSizeBytes: bytes.length,
          sourceFileSha256: createHash("sha256").update(bytes).digest("hex") };
      });
      const recovery = new PlatformErasureRecovery(db, fileStore(root));
      const receiptId = randomUUID();
      db.transaction(() => new PlatformErasureHistory(db!).accept({ receiptId, memberUserId: "synthetic_member",
        displayName: "Synthetic member", action: "trade_tracker_account" })).immediate();
      const job = db.transaction(() => {
        db!.exec("DELETE FROM accounts");
        return recovery.record("trade_tracker_account", "a".repeat(64), artifacts, receiptId);
      }).immediate();
      db.close(); db = undefined;
      const childSource = `
        const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
        const Database=require('better-sqlite3');
        const {PlatformErasureRecovery}=require(path.resolve('src/modules/platform/server/privacy/platform-erasure-recovery.ts'));
        const root=process.argv[1],phase=process.argv[2];
        const db=new Database(path.join(root,'synthetic.sqlite'));
        db.pragma('synchronous=FULL');
        const filename=a=>path.join(root,a.objectKey);
        const store={identity:()=> 'synthetic_private_directory',
          verify(a){const b=fs.readFileSync(filename(a));if(b.length!==a.sourceFileSizeBytes||crypto.createHash('sha256').update(b).digest('hex')!==a.sourceFileSha256)throw Error('mismatch')},
          exists:a=>fs.existsSync(filename(a)),
          purge(a){this.verify(a);fs.unlinkSync(filename(a));this.syncDirectory(a)},
          syncDirectory(){const fd=fs.openSync(root,'r');try{fs.fsyncSync(fd)}finally{fs.closeSync(fd)}}};
        const r=new PlatformErasureRecovery(db,store);
        r.finish(r.pending(),(p,n)=>{if(p===phase&&n===0)process.exit(42)});
        process.exit(43);
      `;
      const child = spawnSync(process.execPath, ["--require", "tsx/cjs", "-e", childSource, root, phase], {
        cwd: process.cwd(), encoding: "utf8", timeout: 10_000,
      });
      expect(child.status).toBe(42);
      db = new Database(databasePath); db.pragma("synchronous=FULL");
      const restarted = new PlatformErasureRecovery(db, fileStore(root));
      expect(restarted.pending() === job).toBe(true);
      expect(db.prepare("SELECT phase FROM platform_erasure_history").get()).toEqual({ phase: "committed_cleanup_pending" });
      restarted.finish(job);
      expect(db.prepare("SELECT COUNT(*) AS n FROM accounts").get()).toEqual({ n: 0 });
      expect(existsSync(join(root, "object_a"))).toBe(false);
      expect(existsSync(join(root, "object_b"))).toBe(false);
      expect(restarted.pending()).toBeNull();
      expect(db.prepare("SELECT phase FROM platform_erasure_history").get()).toEqual({ phase: "complete" });
    } finally {
      db?.close(); rmSync(root, { recursive: true, force: true });
    }
  });
});
