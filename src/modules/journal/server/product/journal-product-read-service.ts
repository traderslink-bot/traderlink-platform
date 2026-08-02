import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalDecisionAction } from "../../contracts/journal-decision-contracts";
import type {
  JournalDataDecisionItem,
  JournalDataDecisionsReadModel,
  JournalDecisionExecutionEvidence,
  JournalDecisionPositionEvidence,
  JournalImportHistoryItem,
} from "../../contracts/journal-product-read-models";

type DecisionRow = Readonly<{
  decision_id: string;
  execution_id: string | null;
  source_import_batch_id: string | null;
  revision: number;
  state: JournalDataDecisionItem["state"];
  issue_code: string;
  effect_code: string;
  target_kind: JournalDataDecisionItem["targetKind"];
  source_row_id: string | null;
  source_row_number: number | null;
  source_section: string | null;
  source_raw_fields_json: string | null;
  instrument_id: string | null;
  trade_currency: string | null;
  effective_at_utc: string | null;
  symbol: string | null;
  updated_at_utc: string;
}>;

function allowedActions(row: DecisionRow): readonly JournalDecisionAction[] {
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
    return Object.freeze(["merge_supported_duplicate", "keep_distinct"]);
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
       decision.updated_at_utc
FROM journal_data_decisions decision
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
      targetKind: row.target_kind,
      instrumentRef: row.instrument_id,
      symbol: row.symbol,
      currency: row.trade_currency,
      sourceRowNumber: row.source_row_number,
      sourceSection: row.source_section,
      effectiveAtUtc: row.effective_at_utc,
      updatedAtUtc: row.updated_at_utc,
      allowedActions: allowedActions(row),
      executions: this.executionEvidence(scope, row.instrument_id, row.trade_currency),
      positionFacts: this.positionEvidence(scope, row.instrument_id, row.trade_currency),
      suggestedCoverage: suggestedCoverage(row),
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
  ): readonly JournalDecisionExecutionEvidence[] {
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
