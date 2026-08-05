import type Database from "better-sqlite3";

import type {
  JournalDataDecisionRecord,
  JournalDecisionAction,
  JournalDecisionTarget,
} from "../../contracts/journal-decision-contracts";
import type { JournalExecutionState } from "../../contracts/journal-execution-contracts";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

type DecisionRow = Readonly<{
  decision_id: string; workspace_id: string; account_id: string; issue_code: string;
  state: JournalDataDecisionRecord["state"]; target_kind: JournalDecisionTarget["kind"];
  source_issue_id: string | null; execution_id: string | null;
  position_fact_id: string | null; overlap_key_sha256: string | null;
  chain_key_sha256: string | null; effect_code: string; revision: number;
  current_event_id: string; created_at_utc: string; updated_at_utc: string;
}>;

function targetFromRow(row: DecisionRow): JournalDecisionTarget {
  switch (row.target_kind) {
    case "source_issue": return Object.freeze({ kind: "source_issue", sourceIssueId: row.source_issue_id! });
    case "execution": return Object.freeze({ kind: "execution", executionId: row.execution_id! });
    case "position_fact": return Object.freeze({ kind: "position_fact", positionFactId: row.position_fact_id! });
    case "overlap_set": return Object.freeze({ kind: "overlap_set", overlapKeySha256: row.overlap_key_sha256! });
    case "chain": return Object.freeze({ kind: "chain", chainKeySha256: row.chain_key_sha256! });
  }
}

function mapDecision(row: DecisionRow): JournalDataDecisionRecord {
  return Object.freeze({
    decisionId: row.decision_id, workspaceId: row.workspace_id,
    accountId: row.account_id, issueCode: row.issue_code,
    state: row.state, target: targetFromRow(row), effectCode: row.effect_code,
    revision: row.revision, currentEventId: row.current_event_id,
    createdAtUtc: row.created_at_utc, updatedAtUtc: row.updated_at_utc,
  });
}

function targetColumns(target: JournalDecisionTarget): readonly (string | null)[] {
  return Object.freeze([
    target.kind === "source_issue" ? target.sourceIssueId : null,
    target.kind === "execution" ? target.executionId : null,
    target.kind === "position_fact" ? target.positionFactId : null,
    target.kind === "overlap_set" ? target.overlapKeySha256 : null,
    target.kind === "chain" ? target.chainKeySha256 : null,
  ]);
}

export type PositionFactRecord = Readonly<{
  positionFactId: string; instrumentId: string; currency: string;
  factKind: "opening_balance" | "closing_balance" | "open_position" | "current_position";
  effectiveLocalDate: string; timePrecision: "date" | "day_start" | "day_end" | "exact";
  sourceTimeText: string | null; sourceTimezone: string;
  effectiveAtUtc: string | null; quantityDecimal: string;
}>;

export type SourceIssueResolutionContext = Readonly<{
  sourceIssueId: string;
  importBatchId: string;
  issueCode: string;
  issueScope: "import" | "row" | "position_fact" | "execution" | "chain";
  sourceRowId: string | null;
  sourceRowRawFieldsJson: string | null;
  instrumentId: string | null;
  tradeCurrency: string | null;
  effectiveAtUtc: string | null;
  executionIds: readonly string[];
  positionFactIds: readonly string[];
}>;

export class JournalDataDecisionRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.transaction(operation).immediate();
  }

  get(workspaceId: string, accountId: string, decisionId: string): JournalDataDecisionRecord | null {
    const row = this.database.prepare<[string, string, string], DecisionRow>(`
SELECT * FROM journal_data_decisions
WHERE workspace_id = ? AND account_id = ? AND decision_id = ?`)
      .get(workspaceId, accountId, decisionId);
    return row ? mapDecision(row) : null;
  }

  findPending(workspaceId: string, accountId: string, target: JournalDecisionTarget): JournalDataDecisionRecord | null {
    const [sourceIssueId, executionId, positionFactId, overlapKey, chainKey] = targetColumns(target);
    const row = this.database.prepare<[
      string, string, string, string | null, string | null, string | null, string | null, string | null,
    ], DecisionRow>(`
SELECT * FROM journal_data_decisions
WHERE workspace_id = ? AND account_id = ? AND state = 'pending' AND target_kind = ?
  AND ifnull(source_issue_id, '') = ifnull(?, '')
  AND ifnull(execution_id, '') = ifnull(?, '')
  AND ifnull(position_fact_id, '') = ifnull(?, '')
  AND ifnull(overlap_key_sha256, '') = ifnull(?, '')
  AND ifnull(chain_key_sha256, '') = ifnull(?, '') LIMIT 1`)
      .get(workspaceId, accountId, target.kind, sourceIssueId, executionId,
        positionFactId, overlapKey, chainKey);
    return row ? mapDecision(row) : null;
  }

  findForSourceIssue(
    workspaceId: string,
    accountId: string,
    sourceIssueId: string,
  ): JournalDataDecisionRecord | null {
    const rows = this.database.prepare<[string, string, string], DecisionRow>(`
SELECT * FROM journal_data_decisions
WHERE workspace_id = ? AND account_id = ? AND target_kind = 'source_issue'
  AND source_issue_id = ?
ORDER BY created_at_utc, decision_id`).all(workspaceId, accountId, sourceIssueId);
    if (rows.length > 1) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "duplicate_source_issue_decision",
      });
    }
    return rows[0] ? mapDecision(rows[0]) : null;
  }

  open(input: Readonly<{
    decisionId: string; decisionEventId: string; workspaceId: string; accountId: string;
    issueCode: string; target: JournalDecisionTarget; effectCode: string; timestamp: string;
  }>): JournalDataDecisionRecord {
    const [sourceIssueId, executionId, positionFactId, overlapKey, chainKey] = targetColumns(input.target);
    this.database.prepare(`INSERT INTO journal_data_decisions (
 decision_id, workspace_id, account_id, issue_code, state, target_kind,
 source_issue_id, execution_id, position_fact_id, overlap_key_sha256,
 chain_key_sha256, effect_code, revision, current_event_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`)
      .run(input.decisionId, input.workspaceId, input.accountId, input.issueCode,
        input.target.kind, sourceIssueId, executionId, positionFactId,
        overlapKey, chainKey, input.effectCode, input.decisionEventId,
        input.timestamp, input.timestamp);
    this.database.prepare(`INSERT INTO journal_data_decision_events (
 decision_event_id, workspace_id, account_id, decision_id, event_sequence,
 action, actor_kind, actor_user_id, reason_code, reason_text,
 prior_execution_version_id, resulting_execution_version_id,
 prior_position_fact_id, resulting_position_fact_id, counterpart_execution_id,
 resulting_state, occurred_at_utc
) VALUES (?, ?, ?, ?, 1, 'opened', 'system', NULL, ?, NULL,
 NULL, NULL, NULL, NULL, NULL, 'pending', ?)`)
      .run(input.decisionEventId, input.workspaceId, input.accountId,
        input.decisionId, input.issueCode, input.timestamp);
    return this.get(input.workspaceId, input.accountId, input.decisionId)!;
  }

  resolve(input: Readonly<{
    decisionEventId: string; workspaceId: string; accountId: string;
    decisionId: string; expectedRevision: number; action: JournalDecisionAction;
    actorUserId: string; reasonCode: string; reasonText: string | null;
    priorExecutionVersionId: string | null; resultingExecutionVersionId: string | null;
    priorPositionFactId: string | null; resultingPositionFactId: string | null;
    resultingCoverageIntervalId: string | null;
    counterpartExecutionId: string | null; timestamp: string;
  }>): JournalDataDecisionRecord {
    this.database.prepare(`INSERT INTO journal_data_decision_events (
 decision_event_id, workspace_id, account_id, decision_id, event_sequence,
 action, actor_kind, actor_user_id, reason_code, reason_text,
 prior_execution_version_id, resulting_execution_version_id,
 prior_position_fact_id, resulting_position_fact_id, counterpart_execution_id,
 resulting_coverage_interval_id,
 resulting_state, occurred_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'user', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'resolved', ?)`)
      .run(input.decisionEventId, input.workspaceId, input.accountId,
        input.decisionId, input.expectedRevision + 1, input.action,
        input.actorUserId, input.reasonCode, input.reasonText,
        input.priorExecutionVersionId, input.resultingExecutionVersionId,
        input.priorPositionFactId, input.resultingPositionFactId,
        input.counterpartExecutionId, input.resultingCoverageIntervalId,
        input.timestamp);
    const result = this.database.prepare(`UPDATE journal_data_decisions
SET state = 'resolved', revision = revision + 1, current_event_id = ?, updated_at_utc = ?
WHERE decision_id = ? AND workspace_id = ? AND account_id = ?
  AND state = 'pending' AND revision = ?`)
      .run(input.decisionEventId, input.timestamp, input.decisionId,
        input.workspaceId, input.accountId, input.expectedRevision);
    if (result.changes !== 1) {
      platformFailure("TRADERLINK_DATA_DECISION_CONFLICT", { reason: "decision_revision" });
    }
    return this.get(input.workspaceId, input.accountId, input.decisionId)!;
  }

  continuePending(input: Readonly<{
    decisionEventId: string; workspaceId: string; accountId: string;
    decisionId: string; expectedRevision: number; action: JournalDecisionAction;
    actorUserId: string; reasonCode: string; reasonText: string | null;
    priorExecutionVersionId: string | null; resultingExecutionVersionId: string | null;
    counterpartExecutionId: string | null; timestamp: string;
  }>): JournalDataDecisionRecord {
    this.database.prepare(`INSERT INTO journal_data_decision_events (
 decision_event_id, workspace_id, account_id, decision_id, event_sequence,
 action, actor_kind, actor_user_id, reason_code, reason_text,
 prior_execution_version_id, resulting_execution_version_id,
 prior_position_fact_id, resulting_position_fact_id, counterpart_execution_id,
 resulting_coverage_interval_id, resulting_state, occurred_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'user', ?, ?, ?, ?, ?, NULL, NULL, ?, NULL,
 'pending', ?)`).run(
      input.decisionEventId, input.workspaceId, input.accountId,
      input.decisionId, input.expectedRevision + 1, input.action,
      input.actorUserId, input.reasonCode, input.reasonText,
      input.priorExecutionVersionId, input.resultingExecutionVersionId,
      input.counterpartExecutionId, input.timestamp,
    );
    const result = this.database.prepare(`UPDATE journal_data_decisions
SET revision = revision + 1, current_event_id = ?, updated_at_utc = ?
WHERE decision_id = ? AND workspace_id = ? AND account_id = ?
  AND state = 'pending' AND revision = ?`).run(
      input.decisionEventId, input.timestamp, input.decisionId,
      input.workspaceId, input.accountId, input.expectedRevision,
    );
    if (result.changes !== 1) {
      platformFailure("TRADERLINK_DATA_DECISION_CONFLICT", {
        reason: "decision_revision",
      });
    }
    return this.get(input.workspaceId, input.accountId, input.decisionId)!;
  }

  updateExecutionState(input: Readonly<{
    workspaceId: string; accountId: string; executionId: string;
    expectedVersionId: string; state: JournalExecutionState; timestamp: string;
  }>): void {
    const result = this.database.prepare(`UPDATE journal_executions
SET current_state = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND execution_id = ?
  AND current_version_id = ?`)
      .run(input.state, input.timestamp, input.workspaceId, input.accountId,
        input.executionId, input.expectedVersionId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
  }

  positionFact(workspaceId: string, accountId: string, positionFactId: string): PositionFactRecord | null {
    const row = this.database.prepare<[string, string, string], {
      position_fact_id: string; instrument_id: string; currency: string;
      fact_kind: PositionFactRecord["factKind"]; effective_local_date: string;
      time_precision: PositionFactRecord["timePrecision"]; source_time_text: string | null;
      source_timezone: string; effective_at_utc: string | null;
      quantity_decimal: string;
    }>(`SELECT position_fact_id, instrument_id, currency, fact_kind,
 effective_local_date, time_precision, source_time_text, source_timezone,
 effective_at_utc, quantity_decimal
FROM journal_position_facts
WHERE workspace_id = ? AND account_id = ? AND position_fact_id = ?
  AND NOT EXISTS (
    SELECT 1 FROM journal_position_facts successor
    WHERE successor.workspace_id = journal_position_facts.workspace_id
      AND successor.account_id = journal_position_facts.account_id
      AND successor.supersedes_position_fact_id = journal_position_facts.position_fact_id
  )`)
      .get(workspaceId, accountId, positionFactId);
    return row ? Object.freeze({
      positionFactId: row.position_fact_id, instrumentId: row.instrument_id,
      currency: row.currency, factKind: row.fact_kind,
      effectiveLocalDate: row.effective_local_date,
      timePrecision: row.time_precision, sourceTimeText: row.source_time_text,
      sourceTimezone: row.source_timezone, effectiveAtUtc: row.effective_at_utc,
      quantityDecimal: row.quantity_decimal,
    }) : null;
  }

  sourceIssueResolutionContext(
    workspaceId: string,
    accountId: string,
    sourceIssueId: string,
  ): SourceIssueResolutionContext | null {
    const issue = this.database.prepare<[string, string, string], {
      source_issue_id: string;
      import_batch_id: string;
      issue_code: string;
      issue_scope: SourceIssueResolutionContext["issueScope"];
      source_row_id: string | null;
      raw_fields_json: string | null;
      instrument_id: string | null;
      trade_currency: string | null;
      effective_at_utc: string | null;
    }>(`SELECT issue.source_issue_id, issue.import_batch_id, issue.issue_code,
 issue.issue_scope, issue.source_row_id, source_row.raw_fields_json,
 issue.instrument_id, issue.trade_currency, issue.effective_at_utc
FROM journal_source_row_issues issue
LEFT JOIN journal_source_rows source_row
  ON source_row.workspace_id = issue.workspace_id
 AND source_row.account_id = issue.account_id
 AND source_row.import_batch_id = issue.import_batch_id
 AND source_row.source_row_id = issue.source_row_id
WHERE issue.workspace_id = ? AND issue.account_id = ? AND issue.source_issue_id = ?`)
      .get(workspaceId, accountId, sourceIssueId);
    if (!issue) return null;
    const executionIds = issue.source_row_id
      ? this.database.prepare<[string, string, string], { execution_id: string }>(`
SELECT DISTINCT execution_id FROM journal_execution_provenance
WHERE workspace_id = ? AND account_id = ? AND source_row_id = ?
ORDER BY execution_id`).all(workspaceId, accountId, issue.source_row_id)
        .map((row) => row.execution_id)
      : [];
    const positionFactIds = issue.source_row_id
      ? this.database.prepare<[string, string, string], { position_fact_id: string }>(`
SELECT position_fact_id FROM journal_position_facts
WHERE workspace_id = ? AND account_id = ? AND source_row_id = ?
ORDER BY position_fact_id`).all(workspaceId, accountId, issue.source_row_id)
        .map((row) => row.position_fact_id)
      : [];
    return Object.freeze({
      sourceIssueId: issue.source_issue_id,
      importBatchId: issue.import_batch_id,
      issueCode: issue.issue_code,
      issueScope: issue.issue_scope,
      sourceRowId: issue.source_row_id,
      sourceRowRawFieldsJson: issue.raw_fields_json,
      instrumentId: issue.instrument_id,
      tradeCurrency: issue.trade_currency,
      effectiveAtUtc: issue.effective_at_utc,
      executionIds: Object.freeze(executionIds),
      positionFactIds: Object.freeze(positionFactIds),
    });
  }

  listPendingSourceIssueDecisionsByIssueCode(
    workspaceId: string,
    accountId: string,
    issueCode: string,
  ): readonly JournalDataDecisionRecord[] {
    const rows = this.database.prepare<[string, string, string], {
      decision_id: string;
    }>(`SELECT decision_id
FROM journal_data_decisions
WHERE workspace_id = ? AND account_id = ? AND state = 'pending'
  AND target_kind = 'source_issue' AND issue_code = ?
ORDER BY decision_id`).all(workspaceId, accountId, issueCode);
    return Object.freeze(rows.map((row) =>
      this.get(workspaceId, accountId, row.decision_id)!
    ));
  }

  listActionableSourceIssues(workspaceId: string, accountId: string, importBatchId: string): readonly Readonly<{
    sourceIssueId: string; issueCode: string;
  }>[] {
    return Object.freeze(this.database.prepare<[string, string, string], {
      source_issue_id: string; issue_code: string;
    }>(`SELECT source_issue_id, issue_code FROM journal_source_row_issues
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?
  AND severity <> 'info' AND is_blocking = 0
ORDER BY source_issue_id`).all(workspaceId, accountId, importBatchId)
      .map((row) => Object.freeze({
        sourceIssueId: row.source_issue_id,
        issueCode: row.issue_code,
      })));
  }

  supersedeStaleChainDecisions(input: Readonly<{
    workspaceId: string;
    accountId: string;
    currentFindings: ReadonlyMap<string, string>;
    createEventId: () => string;
    timestamp: string;
  }>): readonly string[] {
    const pending = this.database.prepare<[string, string], {
      decision_id: string;
      issue_code: string;
      revision: number;
      chain_key_sha256: string;
    }>(`
SELECT decision_id, issue_code, revision, chain_key_sha256
FROM journal_data_decisions
WHERE workspace_id = ? AND account_id = ? AND state = 'pending'
  AND target_kind = 'chain' AND chain_key_sha256 IS NOT NULL
ORDER BY decision_id`).all(input.workspaceId, input.accountId);
    const superseded: string[] = [];
    for (const decision of pending) {
      if (input.currentFindings.get(decision.chain_key_sha256) === decision.issue_code) continue;
      const decisionEventId = input.createEventId();
      this.database.prepare(`INSERT INTO journal_data_decision_events (
 decision_event_id, workspace_id, account_id, decision_id, event_sequence,
 action, actor_kind, actor_user_id, reason_code, reason_text,
 prior_execution_version_id, resulting_execution_version_id,
 prior_position_fact_id, resulting_position_fact_id, counterpart_execution_id,
 resulting_state, occurred_at_utc
) VALUES (?, ?, ?, ?, ?, 'superseded_by_rebuild', 'system', NULL,
 'finding_no_longer_current', NULL, NULL, NULL, NULL, NULL, NULL, 'superseded', ?)`)
        .run(decisionEventId, input.workspaceId, input.accountId,
          decision.decision_id, decision.revision + 1, input.timestamp);
      const result = this.database.prepare(`UPDATE journal_data_decisions
SET state = 'superseded', revision = revision + 1, current_event_id = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND decision_id = ?
  AND state = 'pending' AND revision = ?`)
        .run(decisionEventId, input.timestamp, input.workspaceId, input.accountId,
          decision.decision_id, decision.revision);
      if (result.changes !== 1) {
        platformFailure("TRADERLINK_DATA_DECISION_CONFLICT", {
          reason: "chain_decision_reconciliation",
        });
      }
      superseded.push(decision.decision_id);
    }
    return Object.freeze(superseded);
  }
}
