import type Database from "better-sqlite3";

import type {
  JournalAdminImportDetail,
  JournalAdminImportListItem,
  JournalAdminPage,
} from "../../contracts/journal-administration-contracts";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import type { PlatformAdminReferenceKeyConfiguration } from "@/src/modules/platform/server/administration/platform-admin-reference-authority";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  boundedToken,
  createJournalAdminReadContext,
  journalAdminCoverage,
  journalAdminPageSize,
  journalAdminReference,
  parseSafeCountObject,
  resolveJournalAdminInternalId,
} from "./journal-admin-read-helpers";

type ImportRow = Readonly<{
  item_kind: "import_attempt" | "import_batch";
  internal_id: string;
  sort_at_utc: string;
  submitted_at_utc: string;
  completed_at_utc: string | null;
  display_name: string;
  account_display_name: string;
  safe_broker_label: string | null;
  statement_format_candidate_id: string | null;
  format_state: string | null;
  observation_outcome: string | null;
  adapter_id: string | null;
  adapter_version: string | null;
  parser_version: string | null;
  mapping_version: string | null;
  current_state: string;
  preserved_row_count: number;
  mapped_execution_count: number;
  unsupported_row_count: number;
  issue_count: number;
  pending_decision_count: number;
  linked_import_state: string | null;
  processing_duration_ms: number | null;
  failure_code: string | null;
  developer_package_available: number;
  consented_source_available: number;
}>;

type TimelineRow = Readonly<{
  sequence_number: number;
  prior_state: string | null;
  new_state: string;
  reason_code: string;
  safe_counts_json: string;
  occurred_at_utc: string;
}>;

type DecisionRow = Readonly<{
  decision_id: string;
  issue_code: string;
  state: string;
  target_kind: string;
}>;

const IMPORT_UNION = `WITH import_items AS (
  SELECT 'import_attempt' AS item_kind,
    attempt.import_attempt_id AS internal_id,
    attempt.admitted_at_utc AS sort_at_utc,
    attempt.admitted_at_utc AS submitted_at_utc,
    attempt.terminal_at_utc AS completed_at_utc,
    user.display_name,
    account.display_name AS account_display_name,
    attempt.safe_broker_label,
    observation.statement_format_candidate_id,
    candidate.current_state AS format_state,
    observation.observation_outcome,
    attempt.adapter_id,
    attempt.adapter_version,
    attempt.parser_version,
    attempt.mapping_version,
    attempt.current_state,
    attempt.preserved_row_count,
    attempt.mapped_execution_count,
    attempt.unsupported_row_count,
    attempt.issue_count,
    attempt.pending_decision_count,
    batch.current_state AS linked_import_state,
    CASE WHEN attempt.terminal_at_utc IS NULL THEN NULL
      ELSE CAST((julianday(attempt.terminal_at_utc) - julianday(attempt.admitted_at_utc)) * 86400000 AS INTEGER)
      END AS processing_duration_ms,
    attempt.failure_code,
    CASE WHEN observation.statement_format_candidate_id IS NOT NULL
      AND observation.observation_outcome <> 'privacy_review_required' THEN 1 ELSE 0 END AS developer_package_available,
    CASE WHEN EXISTS (
      SELECT 1 FROM journal_statement_support_consents consent
      LEFT JOIN journal_statement_support_objects object
        ON object.workspace_id = consent.workspace_id
       AND object.account_id = consent.account_id
       AND object.support_object_id = consent.support_object_id
      WHERE consent.workspace_id = attempt.workspace_id
        AND consent.account_id = attempt.account_id
        AND consent.consent_state = 'active'
        AND consent.expires_at_utc > :nowUtc
        AND (consent.import_batch_id = attempt.committed_import_batch_id
          OR object.import_attempt_id = attempt.import_attempt_id)
    ) THEN 1 ELSE 0 END AS consented_source_available
  FROM journal_import_attempts attempt
  JOIN platform_users user ON user.user_id = attempt.user_id
  JOIN journal_accounts account
    ON account.workspace_id = attempt.workspace_id AND account.account_id = attempt.account_id
  LEFT JOIN journal_statement_format_observations observation
    ON observation.workspace_id = attempt.workspace_id
   AND observation.account_id = attempt.account_id
   AND observation.import_attempt_id = attempt.import_attempt_id
  LEFT JOIN journal_statement_format_candidates candidate
    ON candidate.statement_format_candidate_id = observation.statement_format_candidate_id
  LEFT JOIN journal_import_batches batch
    ON batch.workspace_id = attempt.workspace_id
   AND batch.account_id = attempt.account_id
   AND batch.import_batch_id = attempt.committed_import_batch_id
  UNION ALL
  SELECT 'import_batch' AS item_kind,
    batch.import_batch_id AS internal_id,
    batch.created_at_utc AS sort_at_utc,
    batch.created_at_utc AS submitted_at_utc,
    COALESCE(batch.accepted_at_utc, batch.updated_at_utc) AS completed_at_utc,
    user.display_name,
    account.display_name AS account_display_name,
    batch.source_system AS safe_broker_label,
    observation.statement_format_candidate_id,
    candidate.current_state AS format_state,
    observation.observation_outcome,
    batch.adapter_id,
    batch.adapter_version,
    batch.parser_version,
    batch.mapping_version,
    batch.current_state,
    batch.preserved_row_count,
    batch.mapped_execution_count,
    batch.unsupported_row_count,
    batch.issue_count,
    batch.pending_decision_count,
    batch.current_state AS linked_import_state,
    CASE WHEN batch.accepted_at_utc IS NULL THEN NULL
      ELSE CAST((julianday(batch.accepted_at_utc) - julianday(batch.created_at_utc)) * 86400000 AS INTEGER)
      END AS processing_duration_ms,
    NULL AS failure_code,
    CASE WHEN observation.statement_format_candidate_id IS NOT NULL
      AND observation.observation_outcome <> 'privacy_review_required' THEN 1 ELSE 0 END AS developer_package_available,
    CASE WHEN EXISTS (
      SELECT 1 FROM journal_statement_support_consents consent
      WHERE consent.workspace_id = batch.workspace_id
        AND consent.account_id = batch.account_id
        AND consent.import_batch_id = batch.import_batch_id
        AND consent.consent_state = 'active'
        AND consent.expires_at_utc > :nowUtc
    ) THEN 1 ELSE 0 END AS consented_source_available
  FROM journal_import_batches batch
  JOIN platform_users user ON user.user_id = batch.created_by_user_id
  JOIN journal_accounts account
    ON account.workspace_id = batch.workspace_id AND account.account_id = batch.account_id
  LEFT JOIN journal_import_attempts linked_attempt
    ON linked_attempt.workspace_id = batch.workspace_id
   AND linked_attempt.account_id = batch.account_id
   AND linked_attempt.committed_import_batch_id = batch.import_batch_id
  LEFT JOIN journal_statement_format_observations observation
    ON observation.workspace_id = batch.workspace_id
   AND observation.account_id = batch.account_id
   AND observation.historical_import_batch_id = batch.import_batch_id
  LEFT JOIN journal_statement_format_candidates candidate
    ON candidate.statement_format_candidate_id = observation.statement_format_candidate_id
  WHERE batch.source_kind = 'broker_statement' AND linked_attempt.import_attempt_id IS NULL
)
SELECT * FROM import_items`;

function mappingOrigin(row: ImportRow): JournalAdminImportListItem["mappingOrigin"] {
  if (row.observation_outcome === "known_format") return "verified_adapter";
  if (row.observation_outcome === "saved_mapping") return "saved_account_template";
  if (row.observation_outcome === "manual_mapping") return "manual_map";
  if (row.adapter_id && row.item_kind === "import_batch") return "verified_adapter";
  return "unavailable";
}

function mapImport(
  context: ReturnType<typeof createJournalAdminReadContext>,
  row: ImportRow,
): JournalAdminImportListItem {
  return Object.freeze({
    importRef: journalAdminReference(context, row.item_kind, row.internal_id),
    coverageKind: row.item_kind === "import_attempt"
      ? "tracked_attempt"
      : "historical_committed_import",
    submittedAtUtc: row.submitted_at_utc,
    completedAtUtc: row.completed_at_utc,
    userDisplayName: row.display_name,
    accountDisplayName: row.account_display_name,
    safeBrokerLabel: row.safe_broker_label,
    formatRef: row.statement_format_candidate_id
      ? journalAdminReference(context, "statement_format", row.statement_format_candidate_id)
      : null,
    formatState: row.format_state,
    mappingOrigin: mappingOrigin(row),
    adapterId: row.adapter_id,
    adapterVersion: row.adapter_version,
    parserVersion: row.parser_version,
    mappingVersion: row.mapping_version,
    currentState: row.current_state,
    preservedRowCount: row.preserved_row_count,
    mappedExecutionCount: row.mapped_execution_count,
    unsupportedRowCount: row.unsupported_row_count,
    issueCount: row.issue_count,
    pendingDecisionCount: row.pending_decision_count,
    linkedImportState: row.linked_import_state,
    processingDurationMs: row.processing_duration_ms,
    safeFailureCategory: row.failure_code,
    developerPackageAvailable: row.developer_package_available === 1,
    consentedSourceAvailable: row.consented_source_available === 1,
  });
}

export type JournalAdminImportFilters = Readonly<{
  state?: string;
  brokerLabel?: string;
  formatRef?: string;
  userRef?: string;
  accountRef?: string;
  mappingOrigin?: JournalAdminImportListItem["mappingOrigin"];
  hasUnresolvedDecisions?: boolean;
  developerPackageAvailable?: boolean;
  consentedSourceAvailable?: boolean;
  submittedAfterUtc?: string;
  submittedBeforeUtc?: string;
}>;

export class JournalAdminImportService {
  private readonly context;

  constructor(input: Readonly<{
    database: Database.Database;
    scope: JournalAdminScope;
    configuration?: PlatformAdminReferenceKeyConfiguration;
    now?: Date;
  }>) {
    this.context = createJournalAdminReadContext(input);
  }

  private anchor(reference: string): Readonly<{
    kind: "import_attempt" | "import_batch";
    internalId: string;
    sortAtUtc: string;
  }> {
    const resolved = resolveJournalAdminInternalId(
      this.context,
      reference,
      ["import_attempt", "import_batch"],
    );
    const table = resolved.kind === "import_attempt"
      ? "journal_import_attempts"
      : "journal_import_batches";
    const idColumn = resolved.kind === "import_attempt"
      ? "import_attempt_id"
      : "import_batch_id";
    const timeColumn = resolved.kind === "import_attempt"
      ? "admitted_at_utc"
      : "created_at_utc";
    const row = this.context.database.prepare<[string], { sort_at_utc: string }>(
      `SELECT ${timeColumn} AS sort_at_utc FROM ${table} WHERE ${idColumn} = ?`,
    ).get(resolved.internalId);
    if (!row) platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    return Object.freeze({
      kind: resolved.kind as "import_attempt" | "import_batch",
      internalId: resolved.internalId,
      sortAtUtc: row.sort_at_utc,
    });
  }

  list(input: Readonly<{
    cursor?: string | null;
    pageSize?: number;
    filters?: JournalAdminImportFilters;
  }> = {}): JournalAdminPage<JournalAdminImportListItem> {
    const pageSize = journalAdminPageSize(input.pageSize);
    const filters = input.filters ?? {};
    const clauses: string[] = [];
    const parameters: Record<string, string | number> = {
      nowUtc: this.context.nowUtc,
      limit: pageSize + 1,
    };
    if (input.cursor) {
      const cursor = this.anchor(input.cursor);
      clauses.push(`(sort_at_utc < :cursorTime OR
        (sort_at_utc = :cursorTime AND item_kind < :cursorKind) OR
        (sort_at_utc = :cursorTime AND item_kind = :cursorKind AND internal_id < :cursorId))`);
      parameters.cursorTime = cursor.sortAtUtc;
      parameters.cursorKind = cursor.kind;
      parameters.cursorId = cursor.internalId;
    }
    const state = boundedToken(filters.state, "state");
    if (state) {
      clauses.push("current_state = :state");
      parameters.state = state;
    }
    if (filters.brokerLabel) {
      if (filters.brokerLabel.length > 80 || /[\u0000-\u001f\u007f]/u.test(filters.brokerLabel)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "brokerLabel" });
      }
      clauses.push("safe_broker_label = :brokerLabel COLLATE NOCASE");
      parameters.brokerLabel = filters.brokerLabel;
    }
    if (filters.formatRef) {
      const format = resolveJournalAdminInternalId(
        this.context,
        filters.formatRef,
        ["statement_format"],
      );
      clauses.push("statement_format_candidate_id = :formatId");
      parameters.formatId = format.internalId;
    }
    if (filters.userRef) {
      const user = resolveJournalAdminInternalId(this.context, filters.userRef, ["user"]);
      clauses.push(`internal_id IN (
        SELECT import_attempt_id FROM journal_import_attempts WHERE user_id = :userId
        UNION SELECT batch.import_batch_id FROM journal_import_batches batch
          WHERE batch.created_by_user_id = :userId)`);
      parameters.userId = user.internalId;
    }
    if (filters.accountRef) {
      const account = resolveJournalAdminInternalId(this.context, filters.accountRef, ["account"]);
      clauses.push(`internal_id IN (
        SELECT import_attempt_id FROM journal_import_attempts WHERE account_id = :accountId
        UNION SELECT import_batch_id FROM journal_import_batches WHERE account_id = :accountId)`);
      parameters.accountId = account.internalId;
    }
    if (filters.mappingOrigin) {
      const mappingStates: Record<JournalAdminImportListItem["mappingOrigin"], string> = {
        verified_adapter: "known_format",
        saved_account_template: "saved_mapping",
        manual_map: "manual_mapping",
        unavailable: "unavailable",
      };
      if (filters.mappingOrigin === "unavailable") {
        clauses.push("observation_outcome NOT IN ('known_format', 'saved_mapping', 'manual_mapping') OR observation_outcome IS NULL");
      } else {
        clauses.push("observation_outcome = :mappingOutcome");
        parameters.mappingOutcome = mappingStates[filters.mappingOrigin];
      }
    }
    if (filters.hasUnresolvedDecisions !== undefined) {
      clauses.push(`pending_decision_count ${filters.hasUnresolvedDecisions ? ">" : "="} 0`);
    }
    if (filters.developerPackageAvailable !== undefined) {
      clauses.push("developer_package_available = :packageAvailable");
      parameters.packageAvailable = filters.developerPackageAvailable ? 1 : 0;
    }
    if (filters.consentedSourceAvailable !== undefined) {
      clauses.push("consented_source_available = :consentAvailable");
      parameters.consentAvailable = filters.consentedSourceAvailable ? 1 : 0;
    }
    if (filters.submittedAfterUtc) {
      clauses.push("submitted_at_utc >= :submittedAfter");
      parameters.submittedAfter = filters.submittedAfterUtc;
    }
    if (filters.submittedBeforeUtc) {
      clauses.push("submitted_at_utc <= :submittedBefore");
      parameters.submittedBefore = filters.submittedBeforeUtc;
    }
    const where = clauses.length ? ` WHERE ${clauses.map((clause) => `(${clause})`).join(" AND ")}` : "";
    const rows = this.context.database.prepare<Record<string, string | number>, ImportRow>(
      `${IMPORT_UNION}${where}\nORDER BY sort_at_utc DESC, item_kind DESC, internal_id DESC LIMIT :limit`,
    ).all(parameters);
    const visible = rows.slice(0, pageSize).map((row) => mapImport(this.context, row));
    return Object.freeze({
      items: Object.freeze(visible),
      nextCursor: rows.length > pageSize ? visible.at(-1)?.importRef ?? null : null,
      coverage: journalAdminCoverage(
        this.context,
        "Historical committed imports predate attempt telemetry and remain labeled separately.",
      ),
    });
  }

  detail(importRef: string): JournalAdminImportDetail | null {
    const resolved = resolveJournalAdminInternalId(
      this.context,
      importRef,
      ["import_attempt", "import_batch"],
    );
    const rows = this.context.database.prepare<Record<string, string>, ImportRow>(
      `${IMPORT_UNION} WHERE item_kind = :kind AND internal_id = :internalId`,
    ).all({
      nowUtc: this.context.nowUtc,
      kind: resolved.kind,
      internalId: resolved.internalId,
    });
    const row = rows[0];
    if (!row) return null;
    const batchId = resolved.kind === "import_batch"
      ? resolved.internalId
      : this.context.database.prepare<[string], { committed_import_batch_id: string | null }>(`SELECT committed_import_batch_id
FROM journal_import_attempts WHERE import_attempt_id = ?`).get(resolved.internalId)
        ?.committed_import_batch_id ?? null;
    const timeline = resolved.kind === "import_attempt"
      ? this.context.database.prepare<[string], TimelineRow>(`SELECT sequence_number, prior_state,
  new_state, reason_code, safe_counts_json, created_at_utc AS occurred_at_utc
FROM journal_import_attempt_events WHERE import_attempt_id = ?
ORDER BY sequence_number`).all(resolved.internalId)
      : this.context.database.prepare<[string], TimelineRow>(`SELECT event_sequence AS sequence_number,
  prior_state, new_state, reason_code, '{}' AS safe_counts_json,
  occurred_at_utc
FROM journal_import_events WHERE import_batch_id = ?
ORDER BY event_sequence`).all(resolved.internalId);
    const observation = this.context.database.prepare<Record<string, string>, {
      sanitized_structure_json: string;
      mapping_contract_json: string | null;
    }>(`SELECT sanitized_structure_json, mapping_contract_json
FROM journal_statement_format_observations
WHERE ${resolved.kind === "import_attempt"
      ? "import_attempt_id = :internalId"
      : "historical_import_batch_id = :internalId"}`).get({ internalId: resolved.internalId });
    const decisions = batchId
      ? this.context.database.prepare<[string], DecisionRow>(`SELECT DISTINCT decision.decision_id,
  decision.issue_code, decision.state, decision.target_kind
FROM journal_data_decisions decision
JOIN journal_source_row_issues issue ON issue.source_issue_id = decision.source_issue_id
WHERE issue.import_batch_id = ?
ORDER BY decision.created_at_utc, decision.decision_id`).all(batchId)
      : [];
    let sanitizedStructure: unknown | null = null;
    if (observation) {
      try {
        sanitizedStructure = JSON.parse(observation.sanitized_structure_json) as unknown;
      } catch (error) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {}, error);
      }
    }
    return Object.freeze({
      summary: mapImport(this.context, row),
      timeline: Object.freeze(timeline.map((event) => Object.freeze({
        sequence: event.sequence_number,
        priorState: event.prior_state,
        newState: event.new_state,
        reasonCode: event.reason_code,
        safeCounts: parseSafeCountObject(event.safe_counts_json),
        occurredAtUtc: event.occurred_at_utc,
      }))),
      sanitizedStructure,
      mappingAvailable: observation?.mapping_contract_json !== null && observation !== undefined,
      decisionIssues: Object.freeze(decisions.map((decision) => Object.freeze({
        decisionRef: journalAdminReference(this.context, "data_decision", decision.decision_id),
        issueCode: decision.issue_code,
        state: decision.state,
        targetKind: decision.target_kind,
      }))),
      reprocessEligibility: resolved.kind === "import_attempt" &&
        ["awaiting_mapping", "preview_ready"].includes(row.current_state)
        ? "eligible"
        : resolved.kind === "import_attempt" &&
            ["rejected", "system_failed", "expired", "user_cancelled"].includes(row.current_state)
          ? "requires_source_reselection"
          : "not_applicable",
    });
  }
}
