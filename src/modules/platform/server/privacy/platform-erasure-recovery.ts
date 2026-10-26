import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { PlatformErasureArtifact } from "./platform-erasure-service";
import { PlatformErasureHistory } from "./platform-erasure-history";

export type ErasureAction = "trade_tracker_account" | "demo_trade_tracker_account" | "traderlink_account";
export type ErasureObjectStore = Readonly<{
  /** Includes canonical vault root plus persistent directory device/inode. */
  identity(artifact: PlatformErasureArtifact): string;
  verify(artifact: PlatformErasureArtifact): void;
  exists(artifact: PlatformErasureArtifact): boolean;
  /** Verify again, unlink exact file and fsync its parent directory. */
  purge(artifact: PlatformErasureArtifact): void;
  syncDirectory(artifact: PlatformErasureArtifact): void;
}>;
type ObjectRow = {
  ordinal: number; kind: PlatformErasureArtifact["kind"]; object_key: string;
  sha256: string; size_bytes: number; vault_identity: string;
  phase: "prepared" | "unlink_pending" | "purged" | "retained";
};
type Job = { operation_id: string; state: "purge_pending" | "complete"; object_count: number };

const key = (artifact: PlatformErasureArtifact) => artifact.kind === "primary_evidence"
  ? artifact.evidenceObjectKey : artifact.objectKey;
function fromRow(row: ObjectRow): PlatformErasureArtifact {
  const facts = { sourceFileSha256: row.sha256, sourceFileSizeBytes: row.size_bytes };
  return row.kind === "primary_evidence" ? { ...facts, kind: row.kind, evidenceObjectKey: row.object_key }
    : { ...facts, kind: row.kind, objectKey: row.object_key };
}
export function erasureTargetBinding(parts: readonly string[]): string {
  return createHash("sha256").update(JSON.stringify(["erasure:v1", ...parts])).digest("hex");
}

/** A committed logical deletion plus an outbox. No filesystem mutation is
 * allowed in record(), so SQL rollback leaves every original byte intact.
 * This connection must be exclusive to the off-main erasure executor.
 */
export class PlatformErasureRecovery {
  constructor(private readonly database: Database.Database, private readonly store: ErasureObjectStore) {}

  record(action: ErasureAction, targetBinding: string, artifacts: readonly PlatformErasureArtifact[], receiptId?: string): string {
    if (!this.database.inTransaction) throw new Error("erasure_record_requires_transaction");
    if (artifacts.length > 10_000 || artifacts.reduce((n, a) => n + a.sourceFileSizeBytes, 0) > 2 * 1024 ** 3) {
      throw new Error("erasure_artifact_budget");
    }
    const unique = new Map<string, PlatformErasureArtifact>();
    for (const artifact of artifacts) {
      if (!Number.isSafeInteger(artifact.sourceFileSizeBytes) || artifact.sourceFileSizeBytes < 1
        || artifact.sourceFileSizeBytes > 256 * 1024 ** 2) throw new Error("erasure_object_byte_budget");
      const id = `${artifact.kind}:${key(artifact)}`;
      const previous = unique.get(id);
      if (previous && (previous.sourceFileSha256 !== artifact.sourceFileSha256 || previous.sourceFileSizeBytes !== artifact.sourceFileSizeBytes)) {
        throw new Error("erasure_artifact_conflict");
      }
      unique.set(id, artifact);
    }
    const id = receiptId ?? randomUUID();
    this.database.prepare(`INSERT INTO platform_erasure_operations VALUES(?,?,?,'purge_pending',1,?,NULL,?)`)
      .run(id, targetBinding, action, new Date().toISOString(), unique.size);
    let ordinal = 0;
    for (const artifact of unique.values()) {
      this.store.verify(artifact);
      this.database.prepare(`INSERT INTO platform_erasure_objects VALUES(?,?,?,?,?,?,?,'prepared')`)
        .run(id, ordinal++, artifact.kind, key(artifact), artifact.sourceFileSha256,
          artifact.sourceFileSizeBytes, this.store.identity(artifact));
    }
    new PlatformErasureHistory(this.database).committed(id);
    return id;
  }

  pending(): string | null {
    return this.database.prepare<[], Job>("SELECT operation_id,state FROM platform_erasure_operations WHERE active_slot=1").get()?.operation_id ?? null;
  }

  /** Resume this exact committed obligation, never repeat the root deletion.
   * Each object has a durable pre-unlink marker. No missing prepared object is
   * called success. An unlink_pending absence can be reconciled after crash.
   */
  finish(operationId: string, hook?: (phase: string, ordinal: number) => void): void {
    if (this.database.inTransaction) throw new Error("erasure_purge_before_commit");
    const job = this.database.prepare<[string], Job>("SELECT operation_id,state,object_count FROM platform_erasure_operations WHERE operation_id=?").get(operationId);
    if (!job) throw new Error("erasure_unknown_operation");
    if (job.state === "complete") return;
    const rows = this.database.prepare<[string], ObjectRow>("SELECT * FROM platform_erasure_objects WHERE operation_id=? ORDER BY ordinal").all(operationId);
    if (rows.length !== job.object_count) throw new Error("erasure_obligation_manifest_incomplete");
    for (const row of rows) {
      if (row.phase === "purged" || row.phase === "retained") continue;
      const artifact = fromRow(row);
      if (this.store.identity(artifact) !== row.vault_identity) throw new Error("erasure_vault_identity_changed");
      // Publishers must promote bytes and publish their reference in one
      // immediate transaction. The same lock protects this final reference check.
      const references = () => artifact.kind === "primary_evidence"
        ? this.database.prepare("SELECT 1 FROM journal_import_batches WHERE evidence_object_key=? LIMIT 1").get(key(artifact))
        : this.database.prepare("SELECT 1 FROM journal_statement_support_objects WHERE object_key=? LIMIT 1").get(key(artifact));
      this.database.transaction(() => {
        if (references()) {
          this.store.verify(artifact);
          this.database.prepare("UPDATE platform_erasure_objects SET phase='retained' WHERE operation_id=? AND ordinal=?").run(operationId, row.ordinal);
        } else {
          if (row.phase === "prepared") this.store.verify(artifact);
          this.database.prepare("UPDATE platform_erasure_objects SET phase='unlink_pending' WHERE operation_id=? AND ordinal=?").run(operationId, row.ordinal);
        }
      }).immediate();
      hook?.("intent_committed", row.ordinal);
      const current = this.database.prepare<[string, number], { phase: string }>(
        "SELECT phase FROM platform_erasure_objects WHERE operation_id=? AND ordinal=?").get(operationId, row.ordinal);
      if (current?.phase === "retained") continue;
      this.database.transaction(() => {
        if (references()) {
          this.store.verify(artifact);
          this.database.prepare("UPDATE platform_erasure_objects SET phase='retained' WHERE operation_id=? AND ordinal=?").run(operationId, row.ordinal);
          return;
        }
        if (this.store.exists(artifact)) this.store.purge(artifact);
        else this.store.syncDirectory(artifact);
        hook?.("unlinked", row.ordinal);
        this.database.prepare("UPDATE platform_erasure_objects SET phase='purged' WHERE operation_id=? AND ordinal=?").run(operationId, row.ordinal);
      }).immediate();
      hook?.("receipt_committed", row.ordinal);
    }
    this.database.transaction(() => {
      const remaining = this.database.prepare("SELECT 1 FROM platform_erasure_objects WHERE operation_id=? AND phase NOT IN ('purged','retained') LIMIT 1").get(operationId);
      if (remaining) throw new Error("erasure_incomplete");
      // All private operational identifiers/keys disappear on completion. Keep
      // only action/time/aggregate outcome, never a deleted member directory.
      this.database.prepare("DELETE FROM platform_erasure_objects WHERE operation_id=?").run(operationId);
      this.database.prepare(`UPDATE platform_erasure_operations SET state='complete',active_slot=NULL,
        target_binding_sha256=NULL,completed_at_utc=? WHERE operation_id=?`).run(new Date().toISOString(), operationId);
      new PlatformErasureHistory(this.database).completed(operationId);
    }).immediate();
  }
}
