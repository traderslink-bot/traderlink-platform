import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type JournalImportAttemptState =
  | "received"
  | "inspecting"
  | "awaiting_mapping"
  | "preview_ready"
  | "committing"
  | "committed"
  | "committed_with_decisions"
  | "duplicate"
  | "rejected"
  | "system_failed"
  | "user_cancelled"
  | "expired";

export type JournalImportAttemptRecord = Readonly<{
  importAttemptId: string;
  instrumentationEpochId: string;
  userId: string;
  workspaceId: string;
  accountId: string;
  requestIdempotencySha256: string;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
  fileKind: "csv" | "tsv" | "text_csv";
  safeBrokerLabel: string | null;
  currentState: JournalImportAttemptState;
  revision: number;
  adapterId: string | null;
  adapterVersion: string | null;
  parserVersion: string | null;
  mappingVersion: string | null;
  preservedRowCount: number;
  mappedExecutionCount: number;
  unsupportedRowCount: number;
  issueCount: number;
  pendingDecisionCount: number;
  committedImportBatchId: string | null;
  failureCode: string | null;
  admittedAtUtc: string;
  updatedAtUtc: string;
  resumableUntilUtc: string | null;
  terminalAtUtc: string | null;
}>;

export type JournalRecoverableImportAttempt = Readonly<{
  attempt: JournalImportAttemptRecord;
  correlationRefSha256: string;
}>;

type AttemptRow = Readonly<{
  import_attempt_id: string;
  instrumentation_epoch_id: string;
  user_id: string;
  workspace_id: string;
  account_id: string;
  request_idempotency_sha256: string;
  source_file_sha256: string;
  source_file_size_bytes: number;
  file_kind: JournalImportAttemptRecord["fileKind"];
  safe_broker_label: string | null;
  current_state: JournalImportAttemptState;
  revision: number;
  adapter_id: string | null;
  adapter_version: string | null;
  parser_version: string | null;
  mapping_version: string | null;
  preserved_row_count: number;
  mapped_execution_count: number;
  unsupported_row_count: number;
  issue_count: number;
  pending_decision_count: number;
  committed_import_batch_id: string | null;
  failure_code: string | null;
  admitted_at_utc: string;
  updated_at_utc: string;
  resumable_until_utc: string | null;
  terminal_at_utc: string | null;
}>;

const SHA256 = /^[0-9a-f]{64}$/u;
const TOKEN = /^[a-z][a-z0-9_-]{0,63}$/u;
const TERMINAL = new Set<JournalImportAttemptState>([
  "committed", "committed_with_decisions", "duplicate", "rejected",
  "system_failed", "user_cancelled", "expired",
]);
function states(
  ...values: JournalImportAttemptState[]
): readonly JournalImportAttemptState[] {
  return Object.freeze(values);
}
const TRANSITIONS: Readonly<Record<JournalImportAttemptState, readonly JournalImportAttemptState[]>> =
  Object.freeze({
    received: states("inspecting", "rejected", "system_failed"),
    inspecting: states("awaiting_mapping", "preview_ready", "rejected", "system_failed"),
    awaiting_mapping: states("inspecting", "user_cancelled", "expired"),
    preview_ready: states("inspecting", "committing", "user_cancelled", "expired"),
    committing: states(
      "committed", "committed_with_decisions", "duplicate", "system_failed",
    ),
    committed: states(),
    committed_with_decisions: states(),
    duplicate: states(),
    rejected: states(),
    system_failed: states(),
    user_cancelled: states(),
    expired: states(),
  });

const SELECT_ATTEMPT = `SELECT import_attempt_id, instrumentation_epoch_id,
 user_id, workspace_id, account_id, request_idempotency_sha256,
 source_file_sha256, source_file_size_bytes, file_kind, safe_broker_label,
 current_state, revision, adapter_id, adapter_version, parser_version,
 mapping_version, preserved_row_count, mapped_execution_count,
 unsupported_row_count, issue_count, pending_decision_count,
 committed_import_batch_id, failure_code, admitted_at_utc, updated_at_utc,
 resumable_until_utc, terminal_at_utc
FROM journal_import_attempts`;

function mapAttempt(row: AttemptRow): JournalImportAttemptRecord {
  return Object.freeze({
    importAttemptId: row.import_attempt_id,
    instrumentationEpochId: row.instrumentation_epoch_id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    accountId: row.account_id,
    requestIdempotencySha256: row.request_idempotency_sha256,
    sourceFileSha256: row.source_file_sha256,
    sourceFileSizeBytes: row.source_file_size_bytes,
    fileKind: row.file_kind,
    safeBrokerLabel: row.safe_broker_label,
    currentState: row.current_state,
    revision: row.revision,
    adapterId: row.adapter_id,
    adapterVersion: row.adapter_version,
    parserVersion: row.parser_version,
    mappingVersion: row.mapping_version,
    preservedRowCount: row.preserved_row_count,
    mappedExecutionCount: row.mapped_execution_count,
    unsupportedRowCount: row.unsupported_row_count,
    issueCount: row.issue_count,
    pendingDecisionCount: row.pending_decision_count,
    committedImportBatchId: row.committed_import_batch_id,
    failureCode: row.failure_code,
    admittedAtUtc: row.admitted_at_utc,
    updatedAtUtc: row.updated_at_utc,
    resumableUntilUtc: row.resumable_until_utc,
    terminalAtUtc: row.terminal_at_utc,
  });
}

function safeCountsJson(counts: Readonly<Record<string, number>>): string {
  const entries = Object.entries(counts).sort(([left], [right]) =>
    left.localeCompare(right));
  if (entries.length > 20 || entries.some(([key, value]) =>
    !TOKEN.test(key) || !Number.isSafeInteger(value) || value < 0)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
      reason: "attempt_counts_invalid",
    });
  }
  return JSON.stringify(Object.fromEntries(entries));
}

function requireSha256(value: string, field: string): void {
  if (!SHA256.test(value)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", { reason: field });
  }
}

export class JournalImportAttemptRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  findActiveEpochId(): string | null {
    const row = this.database.prepare<[], { instrumentation_epoch_id: string }>(`
SELECT instrumentation_epoch_id FROM journal_import_instrumentation_epochs
WHERE closed_at_utc IS NULL`).get();
    return row?.instrumentation_epoch_id ?? null;
  }

  activateEpoch(input: Readonly<{
    applicationVersion: string;
    timestamp: string;
  }>): string {
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const existing = this.findActiveEpochId();
    if (existing) return existing;
    const epochId = createCanonicalUuidV4();
    try {
      this.database.prepare(`INSERT INTO journal_import_instrumentation_epochs (
 instrumentation_epoch_id, application_version, activated_at_utc,
 closed_at_utc, close_reason_code, created_at_utc
) VALUES (?, ?, ?, NULL, NULL, ?)`).run(
        epochId,
        input.applicationVersion,
        input.timestamp,
        input.timestamp,
      );
    } catch (error) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "instrumentation_epoch_activation",
      }, error);
    }
    return epochId;
  }

  findByIdempotency(
    scope: WorkspaceAccessScope,
    requestIdempotencySha256: string,
  ): JournalImportAttemptRecord | null {
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const row = this.database.prepare<[string, string, string, string], AttemptRow>(`
${SELECT_ATTEMPT}
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND request_idempotency_sha256 = ?`).get(
      scope.userId,
      scope.workspaceId,
      accountId,
      requestIdempotencySha256,
    );
    return row ? mapAttempt(row) : null;
  }

  findById(
    scope: WorkspaceAccessScope,
    importAttemptId: string,
  ): JournalImportAttemptRecord | null {
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const row = this.database.prepare<[string, string, string, string], AttemptRow>(`
${SELECT_ATTEMPT}
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND import_attempt_id = ?`).get(
      scope.userId,
      scope.workspaceId,
      accountId,
      importAttemptId,
    );
    return row ? mapAttempt(row) : null;
  }

  listStaleCommitting(
    updatedBeforeUtc: string,
    limit = 50,
  ): readonly JournalRecoverableImportAttempt[] {
    assertCanonicalUtcTimestamp(updatedBeforeUtc, "updatedBeforeUtc");
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "attempt_recovery_limit",
      });
    }
    const rows = this.database.prepare<[string, number], AttemptRow & {
      correlation_ref_sha256: string;
    }>(`SELECT attempt.*, (
  SELECT event.correlation_ref_sha256
  FROM journal_import_attempt_events event
  WHERE event.workspace_id = attempt.workspace_id
    AND event.account_id = attempt.account_id
    AND event.import_attempt_id = attempt.import_attempt_id
  ORDER BY event.sequence_number DESC
  LIMIT 1
) AS correlation_ref_sha256
FROM (${SELECT_ATTEMPT}) attempt
WHERE attempt.current_state = 'committing' AND attempt.updated_at_utc <= ?
ORDER BY attempt.updated_at_utc, attempt.import_attempt_id
LIMIT ?`).all(updatedBeforeUtc, limit);
    return Object.freeze(rows.map((row) => Object.freeze({
      attempt: mapAttempt(row),
      correlationRefSha256: row.correlation_ref_sha256,
    })));
  }

  admit(input: Readonly<{
    scope: WorkspaceAccessScope;
    requestIdempotencySha256: string;
    sourceFileSha256: string;
    sourceFileSizeBytes: number;
    fileKind: JournalImportAttemptRecord["fileKind"];
    safeBrokerLabel: string | null;
    correlationRefSha256: string;
    timestamp: string;
  }>): JournalImportAttemptRecord {
    return this.immediate(() => {
      const accountId = input.scope.activeAccountId;
      if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      requireSha256(input.requestIdempotencySha256, "attempt_idempotency_invalid");
      requireSha256(input.sourceFileSha256, "attempt_source_invalid");
      requireSha256(input.correlationRefSha256, "attempt_correlation_invalid");
      assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
      const existing = this.findByIdempotency(
        input.scope,
        input.requestIdempotencySha256,
      );
      if (existing) {
        if (
          existing.sourceFileSha256 !== input.sourceFileSha256 ||
          existing.sourceFileSizeBytes !== input.sourceFileSizeBytes ||
          existing.safeBrokerLabel !== input.safeBrokerLabel
        ) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: existing.safeBrokerLabel !== input.safeBrokerLabel
            ? "attempt_broker_mismatch"
            : "attempt_idempotency_reused",
        });
        return existing;
      }
      const epochId = this.findActiveEpochId();
      if (!epochId) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "instrumentation_epoch_inactive",
      });
      const attemptId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO journal_import_attempts (
 import_attempt_id, instrumentation_epoch_id, user_id, workspace_id,
 account_id, request_idempotency_sha256, source_file_sha256,
 source_file_size_bytes, file_kind, safe_broker_label, current_state,
 revision, adapter_id, adapter_version, parser_version, mapping_version,
 preserved_row_count, mapped_execution_count, unsupported_row_count,
 issue_count, pending_decision_count, committed_import_batch_id, failure_code,
 admitted_at_utc, updated_at_utc, resumable_until_utc, terminal_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', 1,
 NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, NULL, NULL, ?, ?, NULL, NULL)`)
        .run(
          attemptId,
          epochId,
          input.scope.userId,
          input.scope.workspaceId,
          accountId,
          input.requestIdempotencySha256,
          input.sourceFileSha256,
          input.sourceFileSizeBytes,
          input.fileKind,
          input.safeBrokerLabel,
          input.timestamp,
          input.timestamp,
        );
      this.database.prepare(`INSERT INTO journal_import_attempt_events (
 import_attempt_event_id, workspace_id, account_id, import_attempt_id,
 sequence_number, prior_state, new_state, reason_code, safe_counts_json,
 correlation_ref_sha256, created_at_utc
) VALUES (?, ?, ?, ?, 1, NULL, 'received', 'upload_admitted', '{}', ?, ?)`)
        .run(
          createCanonicalUuidV4(),
          input.scope.workspaceId,
          accountId,
          attemptId,
          input.correlationRefSha256,
          input.timestamp,
        );
      return this.findById(input.scope, attemptId)!;
    });
  }

  transition(input: Readonly<{
    scope: WorkspaceAccessScope;
    importAttemptId: string;
    expectedRevision: number;
    nextState: JournalImportAttemptState;
    reasonCode: string;
    correlationRefSha256: string;
    timestamp: string;
    resumableUntilUtc?: string | null;
    committedImportBatchId?: string | null;
    failureCode?: string | null;
    adapterId?: string | null;
    adapterVersion?: string | null;
    parserVersion?: string | null;
    mappingVersion?: string | null;
    counts?: Readonly<Record<string, number>>;
  }>): JournalImportAttemptRecord {
    return this.immediate(() => {
      const current = this.findById(input.scope, input.importAttemptId);
      if (!current || current.revision !== input.expectedRevision ||
        !TRANSITIONS[current.currentState].includes(input.nextState)) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "attempt_transition_conflict",
        });
      }
      requireSha256(input.correlationRefSha256, "attempt_correlation_invalid");
      assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
      const resumableUntilUtc = ["awaiting_mapping", "preview_ready"]
        .includes(input.nextState)
        ? input.resumableUntilUtc ?? null
        : null;
      if (resumableUntilUtc) assertCanonicalUtcTimestamp(resumableUntilUtc, "resumableUntilUtc");
      if (["awaiting_mapping", "preview_ready"].includes(input.nextState) &&
        !resumableUntilUtc) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "attempt_resume_boundary_missing",
        });
      }
      const terminalAtUtc = TERMINAL.has(input.nextState) ? input.timestamp : null;
      const committedImportBatchId = ["committed", "committed_with_decisions"]
        .includes(input.nextState)
        ? input.committedImportBatchId ?? null
        : null;
      if (["committed", "committed_with_decisions"].includes(input.nextState) &&
        !committedImportBatchId) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "attempt_import_link_missing",
        });
      }
      if (!TOKEN.test(input.reasonCode) ||
        (input.failureCode !== undefined && input.failureCode !== null &&
          !TOKEN.test(input.failureCode))) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "attempt_reason_invalid",
        });
      }
      const counts = input.counts ?? {};
      const eventSequence = current.revision + 1;
      this.database.prepare(`INSERT INTO journal_import_attempt_events (
 import_attempt_event_id, workspace_id, account_id, import_attempt_id,
 sequence_number, prior_state, new_state, reason_code, safe_counts_json,
 correlation_ref_sha256, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(),
        current.workspaceId,
        current.accountId,
        current.importAttemptId,
        eventSequence,
        current.currentState,
        input.nextState,
        input.reasonCode,
        safeCountsJson(counts),
        input.correlationRefSha256,
        input.timestamp,
      );
      const updated = this.database.prepare(`UPDATE journal_import_attempts SET
 current_state = ?, revision = revision + 1,
 adapter_id = ?, adapter_version = ?, parser_version = ?, mapping_version = ?,
 preserved_row_count = ?, mapped_execution_count = ?, unsupported_row_count = ?,
 issue_count = ?, pending_decision_count = ?, committed_import_batch_id = ?,
 failure_code = ?, updated_at_utc = ?, resumable_until_utc = ?, terminal_at_utc = ?
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND import_attempt_id = ? AND current_state = ? AND revision = ?`).run(
        input.nextState,
        input.adapterId ?? current.adapterId,
        input.adapterVersion ?? current.adapterVersion,
        input.parserVersion ?? current.parserVersion,
        input.mappingVersion ?? current.mappingVersion,
        counts.preserved_rows ?? current.preservedRowCount,
        counts.mapped_executions ?? current.mappedExecutionCount,
        counts.unsupported_rows ?? current.unsupportedRowCount,
        counts.issues ?? current.issueCount,
        counts.pending_decisions ?? current.pendingDecisionCount,
        committedImportBatchId,
        input.failureCode ?? null,
        input.timestamp,
        resumableUntilUtc,
        terminalAtUtc,
        current.userId,
        current.workspaceId,
        current.accountId,
        current.importAttemptId,
        current.currentState,
        current.revision,
      );
      if (updated.changes !== 1) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "attempt_transition_conflict",
      });
      return this.findById(input.scope, input.importAttemptId)!;
    });
  }
}
