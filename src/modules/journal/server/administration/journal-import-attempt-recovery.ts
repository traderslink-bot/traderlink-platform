import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { JournalImportAttemptRepository } from "./journal-import-attempt-repository";

const DEFAULT_GRACE_MS = 5 * 60 * 1000;

type BatchRecoveryRow = Readonly<{
  import_batch_id: string;
  current_state: "accepted" | "accepted_with_decisions" | "superseded";
  preserved_row_count: number;
  mapped_execution_count: number;
  unsupported_row_count: number;
  issue_count: number;
  pending_decision_count: number;
  accepted_at_utc: string;
}>;

export type JournalImportRecoveryResult = Readonly<{
  examinedCount: number;
  committedCount: number;
  duplicateCount: number;
  systemFailedCount: number;
}>;

function recoveryScope(input: Readonly<{
  userId: string;
  workspaceId: string;
  accountId: string;
}>): WorkspaceAccessScope {
  return Object.freeze({
    userId: input.userId,
    workspaceId: input.workspaceId,
    workspaceRole: "member" as const,
    allowedAccountIds: Object.freeze([input.accountId]),
    activeAccountId: input.accountId,
  });
}

export function recoverStaleJournalImportAttempts(input: Readonly<{
  now?: Date;
  graceMs?: number;
  limit?: number;
  environment?: NodeJS.ProcessEnv;
}> = {}): JournalImportRecoveryResult {
  const now = input.now ?? new Date();
  const graceMs = input.graceMs ?? DEFAULT_GRACE_MS;
  if (!Number.isSafeInteger(graceMs) || graceMs < 60_000 || graceMs > 60 * 60 * 1000) {
    throw new Error("Journal import recovery grace must be between one minute and one hour.");
  }
  const timestamp = createCanonicalUtcTimestamp(now);
  const cutoff = createCanonicalUtcTimestamp(new Date(now.getTime() - graceMs));
  const databasePath = resolvePlatformDatabaseConfig({
    environment: input.environment,
  }).databasePath;
  return withPlatformDatabase({ mode: "runtime", databasePath }, (database) => {
    const repository = new JournalImportAttemptRepository(database);
    const stale = repository.listStaleCommitting(cutoff, input.limit ?? 50);
    let committedCount = 0;
    let duplicateCount = 0;
    let systemFailedCount = 0;
    for (const recoverable of stale) {
      repository.immediate(() => {
        const attempt = recoverable.attempt;
        const scope = recoveryScope(attempt);
        const current = repository.findById(scope, attempt.importAttemptId);
        if (!current || current.currentState !== "committing") return;
        const sourceSystem = current.adapterId === "ibkr_activity_statement"
          ? "ibkr"
          : current.adapterId === "generic_mapped_statement"
            ? "mapped_csv"
            : null;
        const batch = sourceSystem ? database.prepare<[
          string,
          string,
          string,
          string,
        ], BatchRecoveryRow>(`SELECT import_batch_id, current_state,
 preserved_row_count, mapped_execution_count, unsupported_row_count,
 issue_count, pending_decision_count, accepted_at_utc
FROM journal_import_batches
WHERE workspace_id = ? AND account_id = ? AND source_system = ?
  AND source_file_sha256 = ? AND source_kind = 'broker_statement'
LIMIT 1`).get(
          current.workspaceId,
          current.accountId,
          sourceSystem,
          current.sourceFileSha256,
        ) : undefined;
        if (!batch) {
          repository.transition({
            scope,
            importAttemptId: current.importAttemptId,
            expectedRevision: current.revision,
            nextState: "system_failed",
            reasonCode: "commit_recovery_failed",
            failureCode: "recovery_no_committed_batch",
            correlationRefSha256: recoverable.correlationRefSha256,
            timestamp,
          });
          systemFailedCount += 1;
          return;
        }
        const isPriorImport = batch.accepted_at_utc < current.admittedAtUtc;
        const nextState = isPriorImport
          ? "duplicate" as const
          : batch.current_state === "accepted_with_decisions"
            ? "committed_with_decisions" as const
            : "committed" as const;
        repository.transition({
          scope,
          importAttemptId: current.importAttemptId,
          expectedRevision: current.revision,
          nextState,
          reasonCode: isPriorImport
            ? "commit_recovered_duplicate"
            : "commit_recovered",
          failureCode: isPriorImport ? "exact_duplicate" : null,
          committedImportBatchId: isPriorImport ? null : batch.import_batch_id,
          correlationRefSha256: recoverable.correlationRefSha256,
          timestamp,
          counts: {
            preserved_rows: batch.preserved_row_count,
            mapped_executions: batch.mapped_execution_count,
            unsupported_rows: batch.unsupported_row_count,
            issues: batch.issue_count,
            pending_decisions: batch.pending_decision_count,
          },
        });
        if (isPriorImport) duplicateCount += 1;
        else committedCount += 1;
      });
    }
    return Object.freeze({
      examinedCount: stale.length,
      committedCount,
      duplicateCount,
      systemFailedCount,
    });
  });
}
