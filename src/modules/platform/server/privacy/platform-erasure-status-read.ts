import "server-only";
import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import { ERASURE_STATUS_PROTOCOL, type ErasureReceipt, type ErasureStatus } from "../../contracts/account-erasure-status";
import type { ErasureHistoryRow } from "./platform-erasure-history";

/** Public optimistic identity partition, not a credential or subject selector. */
export function erasureViewerRef(userId: string): string {
  return `v1:${createHash("sha256").update("traderlink.account-erasure.viewer.v1\0").update(userId).digest("hex")}`;
}
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iu;
const COLUMNS = "receipt_id,action,phase,accepted_at_utc,updated_at_utc,committed_at_utc,finished_at_utc,expires_at_utc,safe_failure_kind";
/** No admission, history producer, participant constructor, reconciliation or purge. */
export function readAccountErasureStatus(database: Database.Database, scope: WorkspaceAccessScope,
  receipt: string | null = null, now = new Date()): ErasureStatus {
  if (Number(database.pragma("query_only", { simple: true })) !== 1) throw new Error("readonly_connection_required");
  if (receipt !== null && !UUID.test(receipt)) throw new Error("invalid_receipt_locator");
  const at = now.toISOString();
  return database.transaction((): ErasureStatus => {
    const table = (name: string) => Boolean(database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(name));
    const modules = table("platform_erasure_module_operations");
    const claims = table("platform_erasure_operation_claims");
    const pending = (id: string) => Boolean(modules && database.prepare(
      "SELECT 1 FROM platform_erasure_module_operations WHERE operation_ref=? AND phase!='complete' LIMIT 1").get(id))
      || Boolean(claims && database.prepare("SELECT 1 FROM platform_erasure_operation_claims WHERE operation_ref=? LIMIT 1").get(id));
    const project = (row: ErasureHistoryRow): ErasureReceipt => {
      const operation = database.prepare("SELECT state FROM platform_erasure_operations WHERE operation_id=?")
        .get(row.receipt_id) as { state: string } | undefined;
      const moduleRecorded = Boolean(modules && database.prepare(
        "SELECT 1 FROM platform_erasure_module_operations WHERE operation_ref=?").get(row.receipt_id));
      let phase = row.phase;
      if (phase === "not_deleted" && (row.safe_failure_kind !== "transaction_rolled_back" || row.committed_at_utc !== null
        || operation || moduleRecorded || pending(row.receipt_id))) phase = "outcome_unknown";
      if (phase === "complete" && (operation?.state !== "complete" || pending(row.receipt_id))) phase = "outcome_unknown";
      if (phase === "accepted" && operation) phase = "committed_cleanup_pending";
      return { receiptRef: row.receipt_id, action: row.action, phase, acceptedAtUtc: row.accepted_at_utc,
        updatedAtUtc: row.updated_at_utc, committedAtUtc: row.committed_at_utc, finishedAtUtc: row.finished_at_utc,
        expiresAtUtc: row.expires_at_utc,
        failure: phase !== "not_deleted" && row.safe_failure_kind === "transaction_rolled_back" ? null : row.safe_failure_kind };
    };
    const recent = database.prepare(`SELECT ${COLUMNS} FROM platform_erasure_history WHERE member_user_id=? AND expires_at_utc>?
      ORDER BY accepted_at_utc DESC,receipt_id DESC LIMIT 11`).all(scope.userId, at) as ErasureHistoryRow[];
    const exact = receipt === null ? undefined : database.prepare(`SELECT ${COLUMNS} FROM platform_erasure_history
      WHERE member_user_id=? AND receipt_id=? AND expires_at_utc>?`).get(scope.userId, receipt, at) as ErasureHistoryRow | undefined;
    const currentPending = Boolean(database.prepare(`SELECT 1 FROM platform_erasure_history h
      JOIN platform_erasure_operations o ON o.operation_id=h.receipt_id
      WHERE h.member_user_id=? AND h.expires_at_utc>? AND o.state='purge_pending' LIMIT 1`).get(scope.userId, at))
      || Boolean(modules && database.prepare(`SELECT 1 FROM platform_erasure_lifecycles l
      JOIN platform_erasure_module_operations o ON o.lifecycle_ref=l.lifecycle_ref
      WHERE l.user_id=? AND o.workspace_id=? AND o.phase!='complete' LIMIT 1`).get(scope.userId, scope.workspaceId));
    return { protocol: ERASURE_STATUS_PROTOCOL, viewerRef: erasureViewerRef(scope.userId),
      correlation: receipt === null ? "recent_only" : "server_receipt", exact: exact ? project(exact) : null,
      recent: recent.slice(0, 10).map(project), more: recent.length > 10, currentPending };
  })();
}
