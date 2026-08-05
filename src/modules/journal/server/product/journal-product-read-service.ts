import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalDecisionAction } from "../../contracts/journal-decision-contracts";
import type {
  JournalDataDecisionItem,
  JournalDataDecisionStatementReadModel,
  JournalDataDecisionsReadModel,
  JournalDecisionExecutionEvidence,
  JournalDecisionPositionEvidence,
  JournalImportHistoryItem,
} from "../../contracts/journal-product-read-models";

type StatementSourceRow = Readonly<{
  source_row_id: string;
  record_ordinal: number;
  section_name: string | null;
  record_type: string | null;
  initial_classification: JournalDataDecisionStatementReadModel["rows"][number]["initialClassification"];
  raw_fields_json: string;
}>;

type StatementIssueRow = Readonly<{
  source_row_id: string | null;
  issue_code: string;
  severity: "info" | "warning" | "error";
}>;

type DecisionRow = Readonly<{
  decision_id: string;
  execution_id: string | null;
  source_import_batch_id: string | null;
  revision: number;
  state: JournalDataDecisionItem["state"];
  issue_code: string;
  effect_code: string;
  target_kind: JournalDataDecisionItem["targetKind"];
  overlap_key_sha256: string | null;
  chain_key_sha256: string | null;
  source_row_id: string | null;
  source_row_number: number | null;
  source_section: string | null;
  source_raw_fields_json: string | null;
  instrument_id: string | null;
  trade_currency: string | null;
  effective_at_utc: string | null;
  symbol: string | null;
  updated_at_utc: string;
  resolution_action: JournalDecisionAction | null;
  resolution_at_utc: string | null;
}>;

function allowedActions(
  row: DecisionRow,
  hasScopedOpenPositionConfirmation = false,
): readonly JournalDecisionAction[] {
  if (hasScopedOpenPositionConfirmation) {
    return Object.freeze(["confirm_legitimate_open_position"]);
  }
  if (row.target_kind === "source_issue") {
    if (row.issue_code.startsWith("position_fact_")) {
      return Object.freeze(["supply_position_fact", "accept_source_limitation"]);
    }
    if ([
      "statement_period_missing",
      "statement_period_conflict",
      "source_timezone_differs_from_account",
      "manual_trading_day_coverage_unconfirmed",
    ].includes(row.issue_code)) {
      return Object.freeze(["supply_coverage_fact", "accept_source_limitation"]);
    }
    if ([
      "execution_required_fact_missing",
      "execution_zero_quantity",
      "execution_time_ambiguous",
      "execution_fact_invalid",
    ].includes(row.issue_code)) {
      return Object.freeze(["add_missing_execution", "accept_source_limitation"]);
    }
    if (row.issue_code === "execution_price_missing") {
      return Object.freeze([
        "correct_execution_fact",
        "exclude_execution",
        "accept_source_limitation",
      ]);
    }
    if (row.issue_code === "provider_execution_identity_invalid") {
      return Object.freeze(["exclude_execution", "accept_source_limitation"]);
    }
    if (["overlap_fact_conflict", "overlap_count_ambiguous"].includes(row.issue_code)) {
      return Object.freeze([
        "correct_execution_fact",
        "exclude_execution",
        "merge_supported_duplicate",
        "keep_distinct",
        "accept_source_limitation",
      ]);
    }
    return Object.freeze(["accept_source_limitation"]);
  }
  if (row.target_kind === "position_fact") {
    return Object.freeze(["correct_position_fact", "confirm_legitimate_open_position"]);
  }
  if (row.target_kind === "execution") {
    return Object.freeze(["correct_execution_fact", "exclude_execution"]);
  }
  if (row.target_kind === "overlap_set") {
    return row.issue_code === "manual_broker_grouped_fill_candidate"
      ? Object.freeze([
          "reconcile_grouped_fills",
          "keep_distinct",
          "correct_execution_fact",
        ])
      : Object.freeze([
          "merge_supported_duplicate",
          "keep_distinct",
          "correct_execution_fact",
        ]);
  }
  if (row.issue_code === "opening_inventory_required") {
    return Object.freeze(["supply_opening_inventory", "add_missing_execution"]);
  }
  if (row.issue_code === "closing_position_unconfirmed") {
    return Object.freeze([
      "supply_position_fact",
      "add_missing_execution",
      "correct_execution_fact",
      "exclude_execution",
    ]);
  }
  if (["position_fact_mismatch", "conflicting_position_facts"].includes(row.issue_code)) {
    return Object.freeze([
      "correct_position_fact",
      "add_missing_execution",
      "supply_opening_inventory",
    ]);
  }
  if (row.issue_code.includes("order")) {
    return Object.freeze(["set_execution_order", "exclude_execution"]);
  }
  return Object.freeze(["add_missing_execution", "correct_execution_fact", "exclude_execution"]);
}

function suggestedCoverage(row: DecisionRow): JournalDataDecisionItem["suggestedCoverage"] {
  if (row.issue_code !== "manual_trading_day_coverage_unconfirmed" || !row.source_raw_fields_json) {
    return null;
  }
  try {
    const fields: unknown = JSON.parse(row.source_raw_fields_json);
    if (
      Array.isArray(fields) &&
      fields[0] === "manual_execution_v1" &&
      typeof fields[5] === "string" &&
      typeof fields[6] === "string" &&
      /^\d{4}-\d{2}-\d{2}$/u.test(fields[5])
    ) {
      return Object.freeze({
        assetClass: "stock" as const,
        localStartDate: fields[5],
        localEndDate: fields[5],
        sourceTimezone: fields[6],
      });
    }
  } catch {
    return null;
  }
  return null;
}

function flaggedStatementRow(
  row: DecisionRow,
): JournalDataDecisionItem["flaggedStatementRow"] {
  if (!row.source_row_number || !row.source_raw_fields_json) return null;
  try {
    const parsed: unknown = JSON.parse(row.source_raw_fields_json);
    if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === "string")) {
      return null;
    }
    return Object.freeze({
      recordOrdinal: row.source_row_number,
      sectionName: row.source_section,
      fields: Object.freeze([...parsed]),
    });
  } catch {
    return null;
  }
}

function decisionQuestion(
  row: DecisionRow,
  openPositionConfirmation: JournalDataDecisionItem["openPositionConfirmation"],
  symbol: string | null,
): string {
  if (openPositionConfirmation && symbol) {
    return `Does your broker account show ${openPositionConfirmation.supportedQuantityDecimal} ${symbol} shares still open?`;
  }
  const known: Readonly<Record<string, string>> = {
    closing_position_unconfirmed:
      "How many shares were still open at the end of this statement?",
    conflicting_position_facts:
      "Which position quantity matches your broker statement?",
    execution_fact_invalid:
      "What execution details does your broker statement show?",
    execution_price_missing:
      "What execution price does your broker statement show?",
    execution_required_fact_missing:
      "What execution details are missing from this statement row?",
    execution_time_ambiguous:
      "What execution time does your broker statement show?",
    execution_zero_quantity:
      "What execution quantity does your broker statement show?",
    manual_broker_grouped_fill_candidate:
      "Do these broker fills represent the same execution as your manual entry?",
    manual_broker_possible_duplicate:
      "Does this broker execution match the manual execution you entered?",
    manual_trading_day_coverage_unconfirmed:
      "Did you enter every stock execution for this trading day?",
    opening_inventory_required:
      "How many shares did you hold before the first execution shown?",
    overlap_count_ambiguous:
      "Are these the same execution or separate executions?",
    overlap_fact_conflict:
      "Are these the same execution or separate executions?",
    position_fact_mismatch:
      "What position quantity does your broker statement show?",
    provider_execution_identity_invalid:
      "Should this statement row be kept as an execution?",
    source_timezone_differs_from_account:
      "Which timezone does this statement use?",
    statement_period_conflict:
      "What date range does this statement cover?",
    statement_period_missing:
      "What date range does this statement cover?",
  };
  if (known[row.issue_code]) return known[row.issue_code];
  if (row.issue_code.includes("order")) return "Which execution happened first?";
  if (row.target_kind === "position_fact") {
    return "What position quantity matches your broker statement?";
  }
  if (row.target_kind === "execution") {
    return "What execution details match your broker statement?";
  }
  return "What does your broker statement show?";
}

function decisionImpactSummary(
  row: DecisionRow,
  openPositionConfirmation: JournalDataDecisionItem["openPositionConfirmation"],
): string {
  if (openPositionConfirmation) {
    return "An earlier completed trade in this ticker remains available. This decision applies only to the later open position.";
  }
  const known: Readonly<Record<string, string>> = {
    net_metrics_unavailable:
      "Net results for this trade stay unavailable until you decide.",
    position_chain_unavailable:
      "This ticker stays out of confirmed round trips until you decide.",
    price_metrics_unavailable:
      "Price-based results for this trade stay unavailable until you decide.",
    provisional_import_withheld_manual_active:
      "Your manual entry remains active while the possible broker match is held aside.",
    source_review_required:
      "Only the results that depend on this source fact remain limited.",
  };
  return known[row.effect_code] ??
    "Only the affected trade results remain limited until you decide.";
}

export class JournalProductReadService {
  constructor(private readonly database: Database.Database) {}

  listImports(scope: AccountScope): readonly JournalImportHistoryItem[] {
    return Object.freeze(this.database.prepare<[string, string], {
      import_batch_id: string;
      source_kind: JournalImportHistoryItem["sourceKind"];
      source_system: string;
      source_display_label: string;
      current_state: JournalImportHistoryItem["currentState"];
      statement_period_start_date: string | null;
      statement_period_end_date: string | null;
      preserved_row_count: number;
      mapped_execution_count: number;
      unsupported_row_count: number;
      issue_count: number;
      pending_decision_count: number;
      accepted_at_utc: string | null;
    }>(`SELECT import_batch_id, source_kind, source_system, source_display_label,
 current_state, statement_period_start_date, statement_period_end_date,
 preserved_row_count, mapped_execution_count, unsupported_row_count,
 issue_count, pending_decision_count, accepted_at_utc
FROM journal_import_batches
WHERE workspace_id = ? AND account_id = ?
ORDER BY accepted_at_utc DESC, import_batch_id DESC
LIMIT 200`).all(scope.workspaceId, scope.accountId).map((row) => Object.freeze({
      importBatchId: row.import_batch_id,
      sourceKind: row.source_kind,
      sourceSystem: row.source_system,
      sourceDisplayLabel: row.source_display_label,
      currentState: row.current_state,
      statementPeriodStartDate: row.statement_period_start_date,
      statementPeriodEndDate: row.statement_period_end_date,
      preservedRowCount: row.preserved_row_count,
      mappedExecutionCount: row.mapped_execution_count,
      unsupportedRowCount: row.unsupported_row_count,
      issueCount: row.issue_count,
      pendingDecisionCount: row.pending_decision_count,
      acceptedAtUtc: row.accepted_at_utc,
    })));
  }

  listDataDecisionStatement(
    scope: AccountScope,
    importBatchId: string,
  ): JournalDataDecisionStatementReadModel | null {
    const batch = this.database.prepare<[string, string, string], {
      source_display_label: string;
      preserved_row_count: number;
    }>(`SELECT source_display_label, preserved_row_count
FROM journal_import_batches
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?`).get(
      scope.workspaceId,
      scope.accountId,
      importBatchId,
    );
    if (!batch) return null;

    const rows = this.database.prepare<[string, string, string], StatementSourceRow>(`SELECT
 source_row_id, record_ordinal, section_name, record_type,
 initial_classification, raw_fields_json
FROM journal_source_rows
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?
ORDER BY record_ordinal
LIMIT 5000`).all(scope.workspaceId, scope.accountId, importBatchId);
    const issues = this.database.prepare<[string, string, string], StatementIssueRow>(`SELECT
 source_row_id, issue_code, severity
FROM journal_source_row_issues
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?
ORDER BY source_issue_id`).all(scope.workspaceId, scope.accountId, importBatchId);
    const issuesBySourceRow = new Map<string, StatementIssueRow[]>();
    for (const issue of issues) {
      if (!issue.source_row_id) continue;
      const existing = issuesBySourceRow.get(issue.source_row_id) ?? [];
      existing.push(issue);
      issuesBySourceRow.set(issue.source_row_id, existing);
    }
    return Object.freeze({
      importBatchId,
      sourceDisplayLabel: batch.source_display_label,
      totalRowCount: batch.preserved_row_count,
      rows: Object.freeze(rows.map((row) => {
        let fields: readonly string[] = Object.freeze([]);
        try {
          const parsed: unknown = JSON.parse(row.raw_fields_json);
          if (Array.isArray(parsed) && parsed.every((value) => typeof value === "string")) {
            fields = Object.freeze([...parsed]);
          }
        } catch {
          // Preserve the row and make its unreadable values visible as an issue.
        }
        const rowIssues = issuesBySourceRow.get(row.source_row_id) ?? [];
        return Object.freeze({
          recordOrdinal: row.record_ordinal,
          sectionName: row.section_name,
          recordType: row.record_type,
          initialClassification: row.initial_classification,
          fields,
          issues: Object.freeze(rowIssues.map((issue) => Object.freeze({
            message: issue.issue_code.replaceAll("_", " "),
            severity: issue.severity,
          }))),
        });
      })),
    });
  }

  listDataDecisions(scope: AccountScope): JournalDataDecisionsReadModel {
    const rows = this.database.prepare<[string, string, string, string], DecisionRow>(`WITH latest_chain AS (
  SELECT rebuild.* FROM journal_chain_rebuilds rebuild
  WHERE rebuild.workspace_id = ? AND rebuild.account_id = ?
    AND NOT EXISTS (
      SELECT 1 FROM journal_chain_rebuilds successor
      WHERE successor.workspace_id = rebuild.workspace_id
        AND successor.account_id = rebuild.account_id
        AND successor.previous_rebuild_id = rebuild.rebuild_id
    )
)
  SELECT decision.decision_id, decision.execution_id, decision.revision, decision.state,
        decision.issue_code, decision.effect_code, decision.target_kind,
       decision.overlap_key_sha256, decision.chain_key_sha256,
       issue.source_row_id,
       COALESCE(issue.import_batch_id, position_fact.import_batch_id) AS source_import_batch_id,
       source_row.record_ordinal AS source_row_number,
       source_row.section_name AS source_section,
       source_row.raw_fields_json AS source_raw_fields_json,
       COALESCE(issue.instrument_id, execution_version.instrument_id,
                position_fact.instrument_id, latest_chain.instrument_id) AS instrument_id,
       COALESCE(issue.trade_currency, execution_version.trade_currency,
                position_fact.currency, latest_chain.trade_currency) AS trade_currency,
       COALESCE(issue.effective_at_utc, execution_version.executed_at_utc,
                position_fact.effective_at_utc) AS effective_at_utc,
       instrument.normalized_symbol AS symbol,
       decision.updated_at_utc,
       resolution_event.action AS resolution_action,
       resolution_event.occurred_at_utc AS resolution_at_utc
FROM journal_data_decisions decision
LEFT JOIN journal_data_decision_events resolution_event
  ON resolution_event.workspace_id = decision.workspace_id
 AND resolution_event.account_id = decision.account_id
 AND resolution_event.decision_id = decision.decision_id
 AND resolution_event.decision_event_id = decision.current_event_id
LEFT JOIN journal_source_row_issues issue
  ON issue.workspace_id = decision.workspace_id
 AND issue.account_id = decision.account_id
 AND issue.source_issue_id = decision.source_issue_id
LEFT JOIN journal_source_rows source_row
  ON source_row.workspace_id = issue.workspace_id
 AND source_row.account_id = issue.account_id
 AND source_row.source_row_id = issue.source_row_id
LEFT JOIN journal_executions execution
  ON execution.workspace_id = decision.workspace_id
 AND execution.account_id = decision.account_id
 AND execution.execution_id = decision.execution_id
LEFT JOIN journal_execution_versions execution_version
  ON execution_version.workspace_id = execution.workspace_id
 AND execution_version.account_id = execution.account_id
 AND execution_version.execution_version_id = execution.current_version_id
LEFT JOIN journal_position_facts position_fact
  ON position_fact.workspace_id = decision.workspace_id
 AND position_fact.account_id = decision.account_id
 AND position_fact.position_fact_id = decision.position_fact_id
LEFT JOIN latest_chain ON latest_chain.chain_key_sha256 = decision.chain_key_sha256
LEFT JOIN journal_instruments instrument
  ON instrument.workspace_id = decision.workspace_id
 AND instrument.instrument_id = COALESCE(
   issue.instrument_id, execution_version.instrument_id,
   position_fact.instrument_id, latest_chain.instrument_id
 )
WHERE decision.workspace_id = ? AND decision.account_id = ?
  AND decision.state IN ('pending', 'resolved')
ORDER BY CASE decision.state WHEN 'pending' THEN 0 ELSE 1 END,
         decision.updated_at_utc DESC, decision.decision_id DESC
LIMIT 400`).all(
      scope.workspaceId,
      scope.accountId,
      scope.workspaceId,
      scope.accountId,
    );
    const chainImportBatchCache = new Map<string, readonly string[]>();
    const items = rows.map((row) => this.mapDecision(
      scope,
      row,
      chainImportBatchCache,
    ));
    return Object.freeze({
      pending: Object.freeze(items.filter((item) => item.state === "pending")),
      resolved: Object.freeze(items.filter((item) => item.state === "resolved")),
    });
  }

  private mapDecision(
    scope: AccountScope,
    row: DecisionRow,
    chainImportBatchCache: Map<string, readonly string[]>,
  ): JournalDataDecisionItem {
    const decisionPositionScope = this.openPositionDecisionScope(scope, row);
    const allExecutions = this.executionEvidence(
      scope,
      row.instrument_id,
      row.trade_currency,
      row.overlap_key_sha256,
    );
    const executions = decisionPositionScope
      ? Object.freeze(allExecutions.filter((execution) =>
          decisionPositionScope.executionIds.has(execution.executionId)))
      : allExecutions;
    const allPositionFacts = this.positionEvidence(
      scope,
      row.instrument_id,
      row.trade_currency,
    );
    const positionFacts = decisionPositionScope
      ? Object.freeze(allPositionFacts.filter((fact) =>
          fact.effectiveLocalDate >= decisionPositionScope.openedAtUtc.slice(0, 10)))
      : allPositionFacts;
    const openPositionConfirmation = this.openPositionConfirmation(
      decisionPositionScope,
      positionFacts,
    );
    return Object.freeze({
      decisionId: row.decision_id,
      importBatchIds: this.relatedImportBatchIds(
        scope,
        row,
        chainImportBatchCache,
      ),
      revision: row.revision,
      state: row.state,
      issueCode: row.issue_code,
      effectCode: row.effect_code,
      question: decisionQuestion(row, openPositionConfirmation, row.symbol ?? executions[0]?.symbol ?? null),
      impactSummary: decisionImpactSummary(row, openPositionConfirmation),
      targetKind: row.target_kind,
      instrumentRef: row.instrument_id,
      symbol: row.symbol ?? executions[0]?.symbol ?? null,
      currency: row.trade_currency ?? executions[0]?.currency ?? null,
      sourceRowNumber: row.source_row_number,
      sourceSection: row.source_section,
      effectiveAtUtc: row.effective_at_utc,
      updatedAtUtc: row.updated_at_utc,
      resolution: row.state === "resolved" && row.resolution_action && row.resolution_at_utc
        ? Object.freeze({
            action: row.resolution_action,
            occurredAtUtc: row.resolution_at_utc,
          })
        : null,
      allowedActions: allowedActions(row, openPositionConfirmation !== null),
      executions,
      flaggedStatementRow: flaggedStatementRow(row),
      positionFacts,
      openPositionConfirmation,
      suggestedCoverage: suggestedCoverage(row),
    });
  }

  private openPositionDecisionScope(
    scope: AccountScope,
    row: DecisionRow,
  ): Readonly<{ openedAtUtc: string; finalPositionDecimal: string; executionIds: ReadonlySet<string> }> | null {
    if (
      row.issue_code !== "conflicting_position_facts" ||
      !row.chain_key_sha256 ||
      !row.instrument_id ||
      !row.trade_currency
    ) return null;
    const candidates = this.database.prepare<[string, string, string, string, string], {
      current_version_id: string;
      opened_at_utc: string;
      final_position_decimal: string;
    }>(`SELECT round_trip.current_version_id, version.opened_at_utc,
 version.final_position_decimal
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_version_id = round_trip.current_version_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.lifecycle_state = 'active'
  AND version.instrument_id = ? AND version.trade_currency = ?
  AND version.chain_key_sha256 = ?
  AND version.projection_state = 'needs_decision'
  AND version.coverage_reason_code = 'conflicting_position_facts'
ORDER BY version.opened_at_utc, round_trip.round_trip_id`).all(
      scope.workspaceId,
      scope.accountId,
      row.instrument_id,
      row.trade_currency,
      row.chain_key_sha256,
    );
    if (candidates.length !== 1) return null;
    const candidate = candidates[0]!;
    const executionIds = new Set(this.database.prepare<[string, string, string], {
      execution_id: string;
    }>(`SELECT DISTINCT execution.execution_id
FROM journal_round_trip_execution_allocations allocation
JOIN journal_execution_versions version
  ON version.execution_version_id = allocation.execution_version_id
JOIN journal_executions execution
  ON execution.workspace_id = allocation.workspace_id
 AND execution.account_id = allocation.account_id
 AND execution.execution_id = version.execution_id
WHERE allocation.workspace_id = ? AND allocation.account_id = ?
  AND allocation.round_trip_version_id = ?
ORDER BY execution.execution_id`).all(
      scope.workspaceId,
      scope.accountId,
      candidate.current_version_id,
    ).map((item) => item.execution_id));
    return executionIds.size > 0
      ? Object.freeze({
          openedAtUtc: candidate.opened_at_utc,
          finalPositionDecimal: candidate.final_position_decimal,
          executionIds,
        })
      : null;
  }

  private openPositionConfirmation(
    scope: Readonly<{ openedAtUtc: string; finalPositionDecimal: string }> | null,
    facts: readonly JournalDecisionPositionEvidence[],
  ): JournalDataDecisionItem["openPositionConfirmation"] {
    if (!scope || scope.finalPositionDecimal === "0") return null;
    const supported = facts.find((fact) =>
      fact.factKind === "open_position" &&
      fact.quantityDecimal === scope.finalPositionDecimal) ?? null;
    const contradictory = facts.find((fact) =>
      fact.factKind === "closing_balance" &&
      fact.quantityDecimal !== scope.finalPositionDecimal) ?? null;
    if (!supported || !contradictory) return null;
    return Object.freeze({
      supportedQuantityDecimal: scope.finalPositionDecimal,
      supportedPositionFactId: supported.positionFactId,
      contradictoryPositionFactId: contradictory.positionFactId,
    });
  }

  private relatedImportBatchIds(
    scope: AccountScope,
    row: DecisionRow,
    chainImportBatchCache: Map<string, readonly string[]>,
  ): readonly string[] {
    if (row.source_import_batch_id) {
      return Object.freeze([row.source_import_batch_id]);
    }
    if (row.execution_id) {
      return Object.freeze(this.database.prepare<[string, string, string], {
        import_batch_id: string;
      }>(`SELECT DISTINCT provenance.import_batch_id
FROM journal_execution_provenance provenance
WHERE provenance.workspace_id = ? AND provenance.account_id = ?
  AND provenance.execution_id = ?
ORDER BY provenance.import_batch_id`).all(
        scope.workspaceId,
        scope.accountId,
        row.execution_id,
      ).map((item) => item.import_batch_id));
    }
    if (row.overlap_key_sha256) {
      return Object.freeze(this.database.prepare<[string, string, string], {
        import_batch_id: string;
      }>(`SELECT DISTINCT provenance.import_batch_id
FROM journal_execution_reconciliation_sets reconciliation
JOIN journal_execution_reconciliation_members member
  ON member.workspace_id = reconciliation.workspace_id
 AND member.account_id = reconciliation.account_id
 AND member.reconciliation_set_id = reconciliation.reconciliation_set_id
JOIN journal_execution_provenance provenance
  ON provenance.workspace_id = member.workspace_id
 AND provenance.account_id = member.account_id
 AND provenance.execution_id = member.execution_id
WHERE reconciliation.workspace_id = ? AND reconciliation.account_id = ?
  AND reconciliation.overlap_key_sha256 = ?
  AND member.member_role = 'provisional_imported_execution'
ORDER BY provenance.import_batch_id`).all(
        scope.workspaceId,
        scope.accountId,
        row.overlap_key_sha256,
      ).map((item) => item.import_batch_id));
    }
    if (!row.instrument_id || !row.trade_currency) return Object.freeze([]);
    const cacheKey = `${row.instrument_id}:${row.trade_currency}`;
    const cached = chainImportBatchCache.get(cacheKey);
    if (cached) return cached;
    const result = Object.freeze(this.database.prepare<
      [string, string, string, string],
      { import_batch_id: string }
    >(`SELECT DISTINCT provenance.import_batch_id
FROM journal_execution_provenance provenance
JOIN journal_execution_versions version
  ON version.workspace_id = provenance.workspace_id
 AND version.account_id = provenance.account_id
 AND version.execution_version_id = provenance.execution_version_id
WHERE provenance.workspace_id = ? AND provenance.account_id = ?
  AND version.instrument_id = ? AND version.trade_currency = ?
ORDER BY provenance.import_batch_id`).all(
      scope.workspaceId,
      scope.accountId,
      row.instrument_id,
      row.trade_currency,
    ).map((item) => item.import_batch_id));
    chainImportBatchCache.set(cacheKey, result);
    return result;
  }

  private executionEvidence(
    scope: AccountScope,
    instrumentId: string | null,
    currency: string | null,
    overlapKeySha256: string | null,
  ): readonly JournalDecisionExecutionEvidence[] {
    if (overlapKeySha256) {
      return Object.freeze(this.database.prepare<[string, string, string], {
        execution_id: string;
        current_version_id: string;
        source_timestamp_text: string;
        executed_at_utc: string;
        source_timezone: string;
        normalized_symbol: string;
        trade_currency: string;
        side: "buy" | "sell";
        quantity_decimal: string;
        price_decimal: string | null;
        fees_decimal: string | null;
        fee_currency: string | null;
        fee_sign_convention: JournalDecisionExecutionEvidence["feeSignConvention"];
        current_state: JournalDecisionExecutionEvidence["currentState"];
        member_role: "manual_execution" | "provisional_imported_execution";
      }>(`SELECT execution.execution_id, execution.current_version_id,
 version.source_timestamp_text, version.executed_at_utc, version.source_timezone,
 instrument.normalized_symbol, version.trade_currency, version.side,
 version.quantity_decimal, version.price_decimal, version.fees_decimal,
 version.fee_currency, version.fee_sign_convention, execution.current_state,
 member.member_role
FROM journal_execution_reconciliation_sets reconciliation
JOIN journal_execution_reconciliation_members member
  ON member.workspace_id = reconciliation.workspace_id
 AND member.account_id = reconciliation.account_id
 AND member.reconciliation_set_id = reconciliation.reconciliation_set_id
JOIN journal_executions execution
  ON execution.workspace_id = member.workspace_id
 AND execution.account_id = member.account_id
 AND execution.execution_id = member.execution_id
JOIN journal_execution_versions version
  ON version.workspace_id = execution.workspace_id
 AND version.account_id = execution.account_id
 AND version.execution_version_id = execution.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE reconciliation.workspace_id = ? AND reconciliation.account_id = ?
  AND reconciliation.overlap_key_sha256 = ?
  AND member.member_role IN ('manual_execution', 'provisional_imported_execution')
ORDER BY CASE member.member_role WHEN 'manual_execution' THEN 0 ELSE 1 END,
 version.executed_at_utc, execution.execution_id`).all(
        scope.workspaceId,
        scope.accountId,
        overlapKeySha256,
      ).map((item) => Object.freeze({
        executionId: item.execution_id,
        currentVersionId: item.current_version_id,
        sourceTimestampText: item.source_timestamp_text,
        executedAtUtc: item.executed_at_utc,
        sourceTimezone: item.source_timezone,
        symbol: item.normalized_symbol,
        currency: item.trade_currency,
        side: item.side,
        quantityDecimal: item.quantity_decimal,
        priceDecimal: item.price_decimal,
        feesDecimal: item.fees_decimal,
        feeCurrency: item.fee_currency,
        feeSignConvention: item.fee_sign_convention,
        currentState: item.current_state,
        sourceLabel: item.member_role === "manual_execution"
          ? "Manual entry" as const
          : "Broker statement" as const,
      })));
    }
    if (!instrumentId || !currency) return Object.freeze([]);
    return Object.freeze(this.database.prepare<[string, string, string, string], {
      execution_id: string;
      current_version_id: string;
      source_timestamp_text: string;
      executed_at_utc: string;
      source_timezone: string;
      normalized_symbol: string;
      trade_currency: string;
      side: "buy" | "sell";
      quantity_decimal: string;
      price_decimal: string | null;
      fees_decimal: string | null;
      fee_currency: string | null;
      fee_sign_convention: JournalDecisionExecutionEvidence["feeSignConvention"];
      current_state: JournalDecisionExecutionEvidence["currentState"];
      }>(`SELECT execution.execution_id, execution.current_version_id,
 version.source_timestamp_text, version.executed_at_utc, version.source_timezone, instrument.normalized_symbol,
 version.trade_currency, version.side, version.quantity_decimal,
 version.price_decimal, version.fees_decimal, version.fee_currency,
 version.fee_sign_convention, execution.current_state
FROM journal_executions execution
JOIN journal_execution_versions version
  ON version.workspace_id = execution.workspace_id
 AND version.account_id = execution.account_id
 AND version.execution_version_id = execution.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE execution.workspace_id = ? AND execution.account_id = ?
  AND version.instrument_id = ? AND version.trade_currency = ?
ORDER BY version.executed_at_utc, version.source_order_key, execution.execution_id
LIMIT 200`).all(scope.workspaceId, scope.accountId, instrumentId, currency)
      .map((item) => Object.freeze({
        executionId: item.execution_id,
        currentVersionId: item.current_version_id,
        sourceTimestampText: item.source_timestamp_text,
        executedAtUtc: item.executed_at_utc,
        sourceTimezone: item.source_timezone,
        symbol: item.normalized_symbol,
        currency: item.trade_currency,
        side: item.side,
        quantityDecimal: item.quantity_decimal,
        priceDecimal: item.price_decimal,
        feesDecimal: item.fees_decimal,
        feeCurrency: item.fee_currency,
        feeSignConvention: item.fee_sign_convention,
        currentState: item.current_state,
        sourceLabel: null,
      })));
  }

  private positionEvidence(
    scope: AccountScope,
    instrumentId: string | null,
    currency: string | null,
  ): readonly JournalDecisionPositionEvidence[] {
    if (!instrumentId || !currency) return Object.freeze([]);
    return Object.freeze(this.database.prepare<[string, string, string, string], {
      position_fact_id: string;
      normalized_symbol: string;
      currency: string;
      fact_kind: JournalDecisionPositionEvidence["factKind"];
      effective_local_date: string;
      source_timezone: string;
      quantity_decimal: string;
      fact_source: "statement" | "trader_correction";
    }>(`SELECT fact.position_fact_id, instrument.normalized_symbol, fact.currency,
 fact.fact_kind, fact.effective_local_date, fact.source_timezone,
 fact.quantity_decimal, fact.fact_source
FROM journal_position_facts fact
JOIN journal_instruments instrument
  ON instrument.workspace_id = fact.workspace_id
 AND instrument.instrument_id = fact.instrument_id
WHERE fact.workspace_id = ? AND fact.account_id = ?
  AND fact.instrument_id = ? AND fact.currency = ?
  AND NOT EXISTS (
    SELECT 1 FROM journal_position_facts successor
    WHERE successor.workspace_id = fact.workspace_id
      AND successor.account_id = fact.account_id
      AND successor.supersedes_position_fact_id = fact.position_fact_id
  )
ORDER BY fact.effective_local_date, fact.fact_kind, fact.position_fact_id
LIMIT 100`).all(scope.workspaceId, scope.accountId, instrumentId, currency)
      .map((item) => Object.freeze({
        positionFactId: item.position_fact_id,
        symbol: item.normalized_symbol,
        currency: item.currency,
        factKind: item.fact_kind,
        effectiveLocalDate: item.effective_local_date,
        sourceTimezone: item.source_timezone,
        quantityDecimal: item.quantity_decimal,
        source: item.fact_source === "statement"
          ? "Broker statement" as const
          : "Trader correction" as const,
      })));
  }
}
