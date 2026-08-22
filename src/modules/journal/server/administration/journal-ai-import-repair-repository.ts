import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type JournalAiImportRepairJob = Readonly<{
  repairJobId: string;
  state: "queued" | "processing" | "preview_ready" | "completed" | "failed" | "cancelled";
  discordCompletionRequested: boolean;
  createdAtUtc: string;
}>;

export type ClaimedJournalAiImportRepairJob = Readonly<{
  job: JournalAiImportRepairJob;
  scope: WorkspaceAccessScope;
  importAttemptId: string;
  confirmedBrokerName: string;
  requestIdempotencySha256: string;
  correlationRefSha256: string;
  supportObject: Readonly<{
    objectKey: string;
    sourceFileSha256: string;
    sourceFileSizeBytes: number;
  }>;
}>;

type Row = Readonly<{
  repair_job_id: string;
  job_state: JournalAiImportRepairJob["state"];
  discord_completion_requested: number;
  created_at_utc: string;
}>;

function map(row: Row): JournalAiImportRepairJob {
  return Object.freeze({
    repairJobId: row.repair_job_id,
    state: row.job_state,
    discordCompletionRequested: row.discord_completion_requested === 1,
    createdAtUtc: row.created_at_utc,
  });
}

export class JournalAiImportRepairRepository {
  constructor(private readonly database: Database.Database) {}

  private immediate<T>(operation: () => T): T {
    return this.database.inTransaction ? operation() : this.database.transaction(operation).immediate();
  }

  createOrRead(input: Readonly<{
    scope: WorkspaceAccessScope;
    importAttemptId: string;
    supportConsentId: string;
    discordCompletionRequested: boolean;
    timestamp: string;
  }>): JournalAiImportRepairJob {
    const accountId = input.scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    assertCanonicalUuidV4(input.importAttemptId, "repairImportAttemptId");
    assertCanonicalUuidV4(input.supportConsentId, "repairSupportConsentId");
    assertCanonicalUtcTimestamp(input.timestamp, "repairCreatedAtUtc");
    const existing = this.database.prepare<[string, string, string], Row>(`SELECT
  repair_job_id, job_state, discord_completion_requested, created_at_utc
FROM journal_ai_import_repair_jobs
WHERE workspace_id = ? AND account_id = ? AND import_attempt_id = ?`).get(
      input.scope.workspaceId, accountId, input.importAttemptId,
    );
    if (existing) return map(existing);
    const attempt = this.database.prepare<[string, string, string, string], { found: number }>(`SELECT 1 AS found
FROM journal_import_attempts
WHERE user_id = ? AND workspace_id = ? AND account_id = ? AND import_attempt_id = ?
  AND current_state = 'awaiting_mapping'`).get(
      input.scope.userId, input.scope.workspaceId, accountId, input.importAttemptId,
    );
    const consent = this.database.prepare<[string, string, string, string, string], { found: number }>(`SELECT 1 AS found
FROM journal_statement_support_consents
WHERE user_id = ? AND workspace_id = ? AND account_id = ? AND support_consent_id = ?
  AND source_kind = 'support_object' AND consent_state = 'active'
  AND expires_at_utc > ?`).get(
      input.scope.userId, input.scope.workspaceId, accountId, input.supportConsentId,
      input.timestamp,
    );
    if (!attempt || !consent) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", { reason: "ai_repair_unavailable" });
    const repairJobId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO journal_ai_import_repair_jobs (
  repair_job_id, user_id, workspace_id, account_id, import_attempt_id,
  support_consent_id, discord_completion_requested, job_state, retry_count,
  safe_failure_code, completed_import_batch_id, created_at_utc, updated_at_utc,
  completed_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', 0, NULL, NULL, ?, ?, NULL)`).run(
      repairJobId, input.scope.userId, input.scope.workspaceId, accountId,
      input.importAttemptId, input.supportConsentId,
      input.discordCompletionRequested ? 1 : 0, input.timestamp, input.timestamp,
    );
    return Object.freeze({
      repairJobId,
      state: "queued",
      discordCompletionRequested: input.discordCompletionRequested,
      createdAtUtc: input.timestamp,
    });
  }

  claimNext(timestamp: string): ClaimedJournalAiImportRepairJob | null {
    assertCanonicalUtcTimestamp(timestamp, "repairClaimedAtUtc");
    return this.immediate(() => {
      const row = this.database.prepare<[string], Readonly<{
        repair_job_id: string; job_state: JournalAiImportRepairJob["state"];
        discord_completion_requested: number; created_at_utc: string;
        user_id: string; workspace_id: string; account_id: string; import_attempt_id: string;
        request_idempotency_sha256: string; correlation_ref_sha256: string;
        safe_broker_label: string;
        workspace_role: "owner" | "admin" | "member";
        object_key: string; source_file_sha256: string; source_file_size_bytes: number;
      }>>(`SELECT job.repair_job_id, job.job_state, job.discord_completion_requested,
  job.created_at_utc, job.user_id, job.workspace_id, job.account_id,
  job.import_attempt_id, attempt.request_idempotency_sha256, attempt.safe_broker_label,
  membership.role AS workspace_role,
  (
    SELECT event.correlation_ref_sha256
    FROM journal_import_attempt_events event
    WHERE event.workspace_id = attempt.workspace_id
      AND event.account_id = attempt.account_id
      AND event.import_attempt_id = attempt.import_attempt_id
    ORDER BY event.sequence_number DESC
    LIMIT 1
  ) AS correlation_ref_sha256,
  object.object_key, object.source_file_sha256,
  object.source_file_size_bytes
FROM journal_ai_import_repair_jobs job
JOIN journal_import_attempts attempt ON attempt.workspace_id = job.workspace_id
 AND attempt.account_id = job.account_id AND attempt.import_attempt_id = job.import_attempt_id
JOIN journal_statement_support_consents consent ON consent.workspace_id = job.workspace_id
 AND consent.account_id = job.account_id AND consent.support_consent_id = job.support_consent_id
JOIN journal_statement_support_objects object ON object.workspace_id = consent.workspace_id
 AND object.account_id = consent.account_id AND object.support_object_id = consent.support_object_id
JOIN platform_workspace_memberships membership ON membership.workspace_id = job.workspace_id
 AND membership.user_id = job.user_id AND membership.status = 'active'
WHERE job.job_state = 'queued' AND attempt.current_state = 'awaiting_mapping'
  AND attempt.safe_broker_label IS NOT NULL
  AND consent.consent_state = 'active' AND consent.expires_at_utc > ?
  AND object.purge_state = 'active'
  AND EXISTS (
    SELECT 1 FROM journal_import_attempt_events event
    WHERE event.workspace_id = attempt.workspace_id
      AND event.account_id = attempt.account_id
      AND event.import_attempt_id = attempt.import_attempt_id
  )
ORDER BY job.created_at_utc, job.repair_job_id LIMIT 1`).get(timestamp);
      if (!row) return null;
      const updated = this.database.prepare(`UPDATE journal_ai_import_repair_jobs
SET job_state = 'processing', updated_at_utc = ?
WHERE repair_job_id = ? AND job_state = 'queued'`).run(timestamp, row.repair_job_id);
      if (updated.changes !== 1) return null;
      return Object.freeze({
        job: Object.freeze({ repairJobId: row.repair_job_id, state: "processing" as const,
          discordCompletionRequested: row.discord_completion_requested === 1, createdAtUtc: row.created_at_utc }),
        scope: Object.freeze({ userId: row.user_id, workspaceId: row.workspace_id,
          workspaceRole: row.workspace_role, allowedAccountIds: Object.freeze([row.account_id]), activeAccountId: row.account_id }),
        importAttemptId: row.import_attempt_id, requestIdempotencySha256: row.request_idempotency_sha256,
        confirmedBrokerName: row.safe_broker_label,
        correlationRefSha256: row.correlation_ref_sha256,
        supportObject: Object.freeze({ objectKey: row.object_key, sourceFileSha256: row.source_file_sha256,
          sourceFileSizeBytes: row.source_file_size_bytes }),
      });
    });
  }

  complete(input: Readonly<{ repairJobId: string; importBatchId: string; timestamp: string }>): void {
    assertCanonicalUuidV4(input.repairJobId, "repairJobId");
    assertCanonicalUuidV4(input.importBatchId, "repairImportBatchId");
    assertCanonicalUtcTimestamp(input.timestamp, "repairCompletedAtUtc");
    const result = this.database.prepare(`UPDATE journal_ai_import_repair_jobs
SET job_state = 'completed', completed_import_batch_id = ?, completed_at_utc = ?, updated_at_utc = ?
WHERE repair_job_id = ? AND job_state = 'processing'`).run(
      input.importBatchId, input.timestamp, input.timestamp, input.repairJobId,
    );
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", { reason: "repair_completion_state" });
  }

  fail(input: Readonly<{ repairJobId: string; safeFailureCode: string; timestamp: string }>): void {
    assertCanonicalUuidV4(input.repairJobId, "repairJobId");
    assertCanonicalUtcTimestamp(input.timestamp, "repairFailedAtUtc");
    if (!/^[a-z][a-z0-9_-]{0,63}$/u.test(input.safeFailureCode)) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", { reason: "repair_failure_code" });
    }
    this.database.prepare(`UPDATE journal_ai_import_repair_jobs
SET job_state = 'failed', safe_failure_code = ?, updated_at_utc = ?
WHERE repair_job_id = ? AND job_state = 'processing'`).run(
      input.safeFailureCode, input.timestamp, input.repairJobId,
    );
  }
}
