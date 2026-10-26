import type Database from "better-sqlite3";
import type { ErasureAction } from "./platform-erasure-recovery";

export const ERASURE_HISTORY_RETENTION_MS = 30 * 24 * 60 * 60_000;
export type ErasureHistoryPhase = "accepted" | "not_deleted" | "committed_cleanup_pending" | "complete" | "outcome_unknown";
export type ErasureHistoryRow = Readonly<{
  receipt_id: string;
  member_user_id: string;
  member_display_name: string;
  action: ErasureAction;
  phase: ErasureHistoryPhase;
  accepted_at_utc: string;
  updated_at_utc: string;
  committed_at_utc: string | null;
  finished_at_utc: string | null;
  expires_at_utc: string;
  safe_failure_kind: "transaction_rolled_back" | "cleanup_unavailable" | "interrupted_before_receipt" | null;
}>;

/** Internal producer only. Administration owns bounded audited reads and must
 * apply expires_at_utc > serverNow before disclosing any row or count.
 */
export class PlatformErasureHistory {
  constructor(private readonly database: Database.Database, private readonly now: () => Date = () => new Date()) {}

  accept(input: Readonly<{ receiptId: string; memberUserId: string; displayName: string; action: ErasureAction }>): void {
    if (!this.database.inTransaction) throw new Error("erasure_history_accept_requires_transaction");
    if (this.database.prepare("SELECT 1 FROM platform_erasure_operations WHERE operation_id=?").get(input.receiptId)) {
      throw new Error("erasure_history_receipt_already_used");
    }
    const now = this.now();
    this.database.prepare(`INSERT INTO platform_erasure_history VALUES(
      ?,?,?,?,'accepted',?,?,NULL,NULL,?,NULL)`).run(input.receiptId, input.memberUserId,
      Array.from(input.displayName).slice(0, 200).join(""), input.action, now.toISOString(), now.toISOString(),
      new Date(now.getTime() + ERASURE_HISTORY_RETENTION_MS).toISOString());
  }

  committed(receiptId: string): void {
    if (!this.database.inTransaction) throw new Error("erasure_history_commit_requires_transaction");
    const now = this.now().toISOString();
    this.database.prepare(`UPDATE platform_erasure_history SET phase='committed_cleanup_pending',
      committed_at_utc=?,updated_at_utc=?,finished_at_utc=NULL,safe_failure_kind=NULL
      WHERE receipt_id=? AND expires_at_utc>? AND EXISTS(SELECT 1 FROM platform_erasure_operations operation
        WHERE operation.operation_id=platform_erasure_history.receipt_id AND operation.state='purge_pending')`).run(now, now, receiptId, now);
  }

  completed(receiptId: string): void {
    if (!this.database.inTransaction) throw new Error("erasure_history_complete_requires_transaction");
    const now = this.now().toISOString();
    this.database.prepare(`UPDATE platform_erasure_history SET phase='complete',updated_at_utc=?,
      committed_at_utc=COALESCE(committed_at_utc,(SELECT operation.created_at_utc FROM platform_erasure_operations operation
        WHERE operation.operation_id=platform_erasure_history.receipt_id)),
      finished_at_utc=?,safe_failure_kind=NULL WHERE receipt_id=? AND expires_at_utc>? AND EXISTS(
        SELECT 1 FROM platform_erasure_operations operation WHERE operation.operation_id=platform_erasure_history.receipt_id AND operation.state='complete')`)
      .run(now, now, receiptId, now);
  }

  /** Only after the logical transaction returned an error and rolled back.
   * Read durable outbox first: a post-commit failure can NEVER say not_deleted.
   */
  failed(receiptId: string): void {
    if (this.database.inTransaction) throw new Error("erasure_history_failure_before_rollback");
    this.database.transaction(() => {
      const operation = this.database.prepare<[string], { state: string }>(
        "SELECT state FROM platform_erasure_operations WHERE operation_id=?").get(receiptId);
      if (operation?.state === "complete") { this.completed(receiptId); return; }
      const now = this.now().toISOString();
      if (operation) {
        this.database.prepare(`UPDATE platform_erasure_history SET phase='committed_cleanup_pending',
          updated_at_utc=?,safe_failure_kind='cleanup_unavailable' WHERE receipt_id=? AND expires_at_utc>?`)
          .run(now, receiptId, now);
      } else {
        this.database.prepare(`UPDATE platform_erasure_history SET phase='not_deleted',updated_at_utc=?,
          finished_at_utc=?,safe_failure_kind='transaction_rolled_back'
          WHERE receipt_id=? AND phase='accepted' AND expires_at_utc>?`).run(now, now, receiptId, now);
      }
    }).immediate();
  }

  /** Startup/housekeeping only, while this supervisor is the sole executor.
   * Interrupted acceptance is conservatively unknown, never a root replay.
   */
  reconcileInterrupted(limit = 128): number {
    if (this.database.inTransaction) throw new Error("erasure_history_recovery_requires_idle_connection");
    const bounded = Math.max(1, Math.min(128, Math.floor(limit)));
    const now = this.now().toISOString();
    return this.database.transaction(() => this.database.prepare(`UPDATE platform_erasure_history
      SET phase='outcome_unknown',updated_at_utc=?,finished_at_utc=?,safe_failure_kind='interrupted_before_receipt'
      WHERE receipt_id IN (SELECT history.receipt_id FROM platform_erasure_history history
        WHERE history.phase='accepted' AND history.expires_at_utc>?
          AND NOT EXISTS (SELECT 1 FROM platform_erasure_operations operation WHERE operation.operation_id=history.receipt_id)
        ORDER BY history.accepted_at_utc,history.receipt_id LIMIT ?)`)
      .run(now, now, now, bounded).changes).immediate();
  }

  purgeExpired(limit = 128): number {
    const bounded = Math.max(1, Math.min(128, Math.floor(limit)));
    return this.database.transaction(() => this.database.prepare(`DELETE FROM platform_erasure_history
      WHERE receipt_id IN (SELECT receipt_id FROM platform_erasure_history
        WHERE expires_at_utc<=? ORDER BY expires_at_utc,receipt_id LIMIT ?)`)
      .run(this.now().toISOString(), bounded).changes).immediate();
  }
}
