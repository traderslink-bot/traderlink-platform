import type Database from "better-sqlite3";

import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export type ExistingImportBatch = Readonly<{
  importBatchId: string;
  accountId: string;
  currentEventId: string;
  currentState: "preview" | "blocked" | "accepted" | "accepted_with_decisions" | "superseded";
  preservedRowCount: number;
  mappedExecutionCount: number;
  pendingDecisionCount: number;
}>;

type ExistingImportBatchRow = Readonly<{
  import_batch_id: string;
  account_id: string;
  current_event_id: string;
  current_state: ExistingImportBatch["currentState"];
  preserved_row_count: number;
  mapped_execution_count: number;
  pending_decision_count: number;
}>;

function mapExistingBatch(row: ExistingImportBatchRow): ExistingImportBatch {
  return Object.freeze({
    importBatchId: row.import_batch_id,
    accountId: row.account_id,
    currentEventId: row.current_event_id,
    currentState: row.current_state,
    preservedRowCount: row.preserved_row_count,
    mappedExecutionCount: row.mapped_execution_count,
    pendingDecisionCount: row.pending_decision_count,
  });
}

export class JournalImportRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.transaction(operation).immediate();
  }

  findByFileDigest(workspaceId: string, sourceSystem: string, digest: string): ExistingImportBatch | null {
    const row = this.database.prepare<[string, string, string], ExistingImportBatchRow>(`
SELECT import_batch_id, account_id, current_event_id, current_state, preserved_row_count,
       mapped_execution_count, pending_decision_count
FROM journal_import_batches
WHERE workspace_id = ? AND source_system = ? AND source_file_sha256 = ?`).get(workspaceId, sourceSystem, digest);
    return row ? mapExistingBatch(row) : null;
  }

  findByManualIdempotency(workspaceId: string, accountId: string, key: string): ExistingImportBatch | null {
    const row = this.database.prepare<[string, string, string], ExistingImportBatchRow>(`
SELECT import_batch_id, account_id, current_event_id, current_state, preserved_row_count,
       mapped_execution_count, pending_decision_count
FROM journal_import_batches
WHERE workspace_id = ? AND account_id = ? AND manual_idempotency_key = ?`).get(workspaceId, accountId, key);
    return row ? mapExistingBatch(row) : null;
  }

  findLatestMappedStatementContract(
    workspaceId: string,
    accountId: string,
    structuralSignatureSha256: string,
  ): string | null {
    const row = this.database.prepare<[string, string, string], {
      mapping_contract_json: string;
    }>(`SELECT mapping_contract_json
FROM journal_import_batches
WHERE workspace_id = ? AND account_id = ?
  AND source_kind = 'broker_statement'
  AND source_system = 'mapped_csv'
  AND adapter_id = 'generic_mapped_statement'
  AND current_state IN ('accepted', 'accepted_with_decisions')
  AND json_extract(mapping_contract_json, '$.structuralSignatureSha256') = ?
ORDER BY accepted_at_utc DESC, import_batch_id DESC
LIMIT 1`).get(workspaceId, accountId, structuralSignatureSha256);
    return row?.mapping_contract_json ?? null;
  }

  requireSourceIdentity(workspaceId: string, accountId: string, sourceIdentityId: string): void {
    const row = this.database.prepare<[string, string, string], { found: number }>(`
SELECT 1 AS found FROM journal_account_source_identities
WHERE workspace_id = ? AND account_id = ? AND source_identity_id = ? AND status <> 'superseded'`).get(workspaceId, accountId, sourceIdentityId);
    if (!row) platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
  }

  insertImportBatch(input: Readonly<{
    importBatchId: string; workspaceId: string; accountId: string;
    sourceIdentityId: string | null; sourceKind: "broker_statement" | "manual_batch";
    sourceSystem: string; sourceFileSha256: string | null; sourceFileSizeBytes: number | null;
    sourceMimeType: string | null; sourceEncoding: string | null; sourceDisplayLabel: string;
    evidenceObjectKey: string | null; manualIdempotencyKey: string | null;
    adapterId: string; adapterVersion: string; parserVersion: string; mappingVersion: string;
    mappingContractJson: string; statementPeriodStartDate: string | null;
    statementPeriodEndDate: string | null; sourceTimezone: string | null;
    currentState: "accepted" | "accepted_with_decisions"; currentEventId: string;
    preservedRowCount: number; mappedExecutionCount: number; unsupportedRowCount: number;
    issueCount: number; pendingDecisionCount: number; createdByUserId: string; timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_import_batches (
 import_batch_id, workspace_id, account_id, source_identity_id, source_kind, source_system,
 source_file_sha256, source_file_size_bytes, source_mime_type, source_encoding,
 source_display_label, evidence_object_key, manual_idempotency_key, adapter_id,
 adapter_version, parser_version, mapping_version, mapping_contract_json,
 statement_period_start_date, statement_period_end_date, source_timezone,
 current_state, current_event_id, preserved_row_count, mapped_execution_count,
 unsupported_row_count, issue_count, pending_decision_count, created_by_user_id,
 created_at_utc, updated_at_utc, accepted_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        input.importBatchId, input.workspaceId, input.accountId, input.sourceIdentityId,
        input.sourceKind, input.sourceSystem, input.sourceFileSha256, input.sourceFileSizeBytes,
        input.sourceMimeType, input.sourceEncoding, input.sourceDisplayLabel,
        input.evidenceObjectKey, input.manualIdempotencyKey, input.adapterId,
        input.adapterVersion, input.parserVersion, input.mappingVersion,
        input.mappingContractJson, input.statementPeriodStartDate,
        input.statementPeriodEndDate, input.sourceTimezone, input.currentState,
        input.currentEventId, input.preservedRowCount, input.mappedExecutionCount,
        input.unsupportedRowCount, input.issueCount, input.pendingDecisionCount,
        input.createdByUserId, input.timestamp, input.timestamp, input.timestamp,
      );
  }

  insertAcceptedEvent(input: Readonly<{
    importEventId: string; workspaceId: string; accountId: string; importBatchId: string;
    eventType: "accepted" | "accepted_with_decisions"; actorUserId: string; timestamp: string;
    reasonCode?: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_import_events (
 import_event_id, workspace_id, account_id, import_batch_id, event_sequence,
 event_type, actor_kind, actor_user_id, prior_state, new_state, reason_code, occurred_at_utc
) VALUES (?, ?, ?, ?, 1, ?, 'user', ?, 'preview', ?, ?, ?)`)
      .run(input.importEventId, input.workspaceId, input.accountId, input.importBatchId,
        input.eventType, input.actorUserId, input.eventType,
        input.reasonCode ?? "user_accepted_import", input.timestamp);
  }

  reconcileAcceptedBatchDecisions(input: Readonly<{
    workspaceId: string;
    accountId: string;
    importBatchId: string;
    importEventId: string;
    actorUserId: string;
    timestamp: string;
  }>): void {
    const batch = this.database.prepare<[string, string, string], {
      current_state: ExistingImportBatch["currentState"];
      current_event_id: string;
      pending_decision_count: number;
    }>(`SELECT current_state, current_event_id, pending_decision_count
FROM journal_import_batches
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?`)
      .get(input.workspaceId, input.accountId, input.importBatchId);
    if (!batch || !["accepted", "accepted_with_decisions"].includes(batch.current_state)) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "import_decision_batch_state",
      });
    }
    const pendingDecisionCount = this.database.prepare<[
      string, string, string, string, string, string,
    ], {
      count: number;
    }>(`SELECT COUNT(*) AS count FROM (
  SELECT decision.decision_id
  FROM journal_data_decisions decision
  JOIN journal_source_row_issues issue
    ON issue.workspace_id = decision.workspace_id
   AND issue.account_id = decision.account_id
   AND issue.source_issue_id = decision.source_issue_id
  WHERE decision.workspace_id = ? AND decision.account_id = ?
    AND issue.import_batch_id = ? AND decision.state = 'pending'
    AND decision.target_kind = 'source_issue'
  UNION
  SELECT decision.decision_id
  FROM journal_data_decisions decision
  JOIN journal_execution_reconciliation_sets reconciliation
    ON reconciliation.workspace_id = decision.workspace_id
   AND reconciliation.account_id = decision.account_id
   AND reconciliation.decision_id = decision.decision_id
  JOIN journal_execution_reconciliation_members member
    ON member.workspace_id = reconciliation.workspace_id
   AND member.account_id = reconciliation.account_id
   AND member.reconciliation_set_id = reconciliation.reconciliation_set_id
  JOIN journal_execution_provenance provenance
    ON provenance.workspace_id = member.workspace_id
   AND provenance.account_id = member.account_id
   AND provenance.execution_id = member.execution_id
  WHERE decision.workspace_id = ? AND decision.account_id = ?
    AND provenance.import_batch_id = ? AND decision.state = 'pending'
    AND decision.target_kind = 'overlap_set'
    AND member.member_role = 'provisional_imported_execution'
)`).get(
      input.workspaceId,
      input.accountId,
      input.importBatchId,
      input.workspaceId,
      input.accountId,
      input.importBatchId,
    )?.count ?? 0;
    const nextState = pendingDecisionCount === 0
      ? "accepted" as const
      : "accepted_with_decisions" as const;
    if (
      batch.current_state === nextState &&
      batch.pending_decision_count === pendingDecisionCount
    ) return;
    if (batch.current_state === nextState) {
      this.database.prepare(`UPDATE journal_import_batches
SET pending_decision_count = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?`)
        .run(pendingDecisionCount, input.timestamp, input.workspaceId,
          input.accountId, input.importBatchId);
      return;
    }
    const eventSequence = (this.database.prepare<[string, string, string], {
      sequence: number;
    }>(`SELECT ifnull(MAX(event_sequence), 0) + 1 AS sequence
FROM journal_import_events
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?`).get(
      input.workspaceId,
      input.accountId,
      input.importBatchId,
    )?.sequence ?? 1);
    this.database.prepare(`INSERT INTO journal_import_events (
 import_event_id, workspace_id, account_id, import_batch_id, event_sequence,
 event_type, actor_kind, actor_user_id, prior_state, new_state, reason_code,
 occurred_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'user', ?, ?, ?, ?, ?)`)
      .run(input.importEventId, input.workspaceId, input.accountId,
        input.importBatchId, eventSequence, nextState, input.actorUserId,
        batch.current_state, nextState,
        nextState === "accepted"
          ? "all_import_decisions_resolved"
          : "import_decision_reopened",
        input.timestamp);
    const result = this.database.prepare(`UPDATE journal_import_batches
SET current_state = ?, current_event_id = ?, pending_decision_count = ?,
    updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?
  AND current_event_id = ?`)
      .run(nextState, input.importEventId, pendingDecisionCount, input.timestamp,
        input.workspaceId, input.accountId, input.importBatchId,
        batch.current_event_id);
    if (result.changes !== 1) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "import_decision_batch_conflict",
      });
    }
  }

  insertSourceRow(input: Readonly<{
    sourceRowId: string; workspaceId: string; accountId: string; importBatchId: string;
    recordOrdinal: number; sourceRecordIdentitySha256: string; rawRecordSha256: string;
    rawFieldsJson: string; sectionName: string | null; recordType: string | null;
    assetCategory: string | null; contentFingerprintSha256: string; occurrenceOrdinal: number;
    initialClassification: string; mappingVersion: string; timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_source_rows (
 source_row_id, workspace_id, account_id, import_batch_id, record_ordinal,
 source_record_identity_sha256, raw_record_sha256, raw_fields_json, section_name,
 record_type, asset_category, content_fingerprint_sha256, occurrence_ordinal,
 initial_classification, mapping_version, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.sourceRowId, input.workspaceId, input.accountId, input.importBatchId,
        input.recordOrdinal, input.sourceRecordIdentitySha256, input.rawRecordSha256,
        input.rawFieldsJson, input.sectionName, input.recordType, input.assetCategory,
        input.contentFingerprintSha256, input.occurrenceOrdinal,
        input.initialClassification, input.mappingVersion, input.timestamp);
  }

  insertIssue(input: Readonly<{
    sourceIssueId: string; workspaceId: string; accountId: string; importBatchId: string;
    sourceRowId: string | null; issueScope: string; issueCode: string;
    severity: string; isBlocking: boolean; instrumentId: string | null;
    tradeCurrency: string | null; effectiveAtUtc: string | null; timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_source_row_issues (
 source_issue_id, workspace_id, account_id, import_batch_id, source_row_id,
 instrument_id, trade_currency, effective_at_utc, issue_scope, issue_code, severity, is_blocking,
 detector_id, detector_version, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'journal_import', 'journal_import_v1', ?)`)
      .run(input.sourceIssueId, input.workspaceId, input.accountId, input.importBatchId,
        input.sourceRowId, input.instrumentId, input.tradeCurrency, input.effectiveAtUtc,
        input.issueScope, input.issueCode, input.severity,
        input.isBlocking ? 1 : 0, input.timestamp);
  }

  insertCoverage(input: Readonly<{
    coverageIntervalId: string; workspaceId: string; accountId: string; importBatchId: string;
    assetClass: string; coverageKind: string; localStartDate: string; localEndDate: string;
    sourceTimezone: string; timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_source_coverage_intervals (
 coverage_interval_id, workspace_id, account_id, import_batch_id, asset_class,
 coverage_kind, local_start_date, local_end_date, source_timezone,
 start_at_utc, end_at_utc, assertion_version, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'coverage_v1', ?)`)
      .run(input.coverageIntervalId, input.workspaceId, input.accountId,
        input.importBatchId, input.assetClass, input.coverageKind,
        input.localStartDate, input.localEndDate, input.sourceTimezone, input.timestamp);
  }

  findOrCreateInstrument(input: Readonly<{
    instrumentId: string; workspaceId: string; assetClass: string;
    normalizedSymbol: string; quoteCurrency: string; timestamp: string;
  }>): string {
    const rows = this.database.prepare<[string, string, string, string], { instrument_id: string }>(`
SELECT instrument_id FROM journal_instruments
WHERE workspace_id = ? AND asset_class = ? AND normalized_symbol = ?
  AND quote_currency = ? AND status = 'active' AND venue IS NULL
ORDER BY instrument_id`).all(input.workspaceId, input.assetClass, input.normalizedSymbol, input.quoteCurrency);
    if (rows.length > 1) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT");
    if (rows[0]) return rows[0].instrument_id;
    this.database.prepare(`INSERT INTO journal_instruments (
 instrument_id, workspace_id, asset_class, normalized_symbol, quote_currency,
 venue, identity_scheme_version, provider_identity_sha256, status, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 'active', ?, ?)`)
      .run(input.instrumentId, input.workspaceId, input.assetClass,
        input.normalizedSymbol, input.quoteCurrency, input.timestamp, input.timestamp);
    return input.instrumentId;
  }

  insertPositionFact(input: Readonly<{
    positionFactId: string; workspaceId: string; accountId: string; importBatchId: string;
    sourceRowId: string; instrumentId: string; currency: string; factKind: string;
    effectiveLocalDate: string; timePrecision: string; sourceTimezone: string;
    sourceTimeText?: string | null; effectiveAtUtc?: string | null;
    quantityDecimal: string; timestamp: string;
    factSource?: "statement" | "trader_correction";
    factVersion?: string;
    supersedesPositionFactId?: string | null;
    actorUserId?: string | null;
  }>): void {
    this.database.prepare(`INSERT INTO journal_position_facts (
 position_fact_id, workspace_id, account_id, import_batch_id, source_row_id,
 instrument_id, currency, fact_kind, effective_local_date, time_precision,
 source_time_text, source_timezone, effective_at_utc, quantity_decimal,
 fact_source, fact_version, supersedes_position_fact_id, actor_user_id, created_at_utc
 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.positionFactId, input.workspaceId, input.accountId, input.importBatchId,
        input.sourceRowId, input.instrumentId, input.currency, input.factKind,
        input.effectiveLocalDate, input.timePrecision, input.sourceTimeText ?? null,
        input.sourceTimezone, input.effectiveAtUtc ?? null, input.quantityDecimal,
        input.factSource ?? "statement",
        input.factVersion ?? "statement_v1",
        input.supersedesPositionFactId ?? null,
        input.actorUserId ?? null,
        input.timestamp);
  }

  findPositionFactByBatch(workspaceId: string, accountId: string, importBatchId: string): string | null {
    return this.database.prepare<[string, string, string], { position_fact_id: string }>(`
SELECT position_fact_id FROM journal_position_facts
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?
ORDER BY created_at_utc, position_fact_id LIMIT 1`)
      .get(workspaceId, accountId, importBatchId)?.position_fact_id ?? null;
  }

  findCoverageByBatch(workspaceId: string, accountId: string, importBatchId: string): string | null {
    return this.database.prepare<[string, string, string], { coverage_interval_id: string }>(`
SELECT coverage_interval_id FROM journal_source_coverage_intervals
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?
ORDER BY coverage_interval_id LIMIT 1`)
      .get(workspaceId, accountId, importBatchId)?.coverage_interval_id ?? null;
  }

  findFirstSourceRowByBatch(workspaceId: string, accountId: string, importBatchId: string): Readonly<{
    sourceRowId: string;
    rawFieldsJson: string;
  }> | null {
    const row = this.database.prepare<[string, string, string], {
      source_row_id: string;
      raw_fields_json: string;
    }>(`
SELECT source_row_id, raw_fields_json FROM journal_source_rows
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?
ORDER BY record_ordinal LIMIT 1`)
      .get(workspaceId, accountId, importBatchId);
    return row ? Object.freeze({
      sourceRowId: row.source_row_id,
      rawFieldsJson: row.raw_fields_json,
    }) : null;
  }

  listSourceRowFieldsByBatch(
    workspaceId: string,
    accountId: string,
    importBatchId: string,
  ): readonly string[] {
    return Object.freeze(this.database.prepare<[string, string, string], {
      raw_fields_json: string;
    }>(`SELECT raw_fields_json FROM journal_source_rows
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?
ORDER BY record_ordinal`).all(workspaceId, accountId, importBatchId)
      .map((row) => row.raw_fields_json));
  }

  listExecutionIdsForBatch(workspaceId: string, accountId: string, importBatchId: string): readonly string[] {
    return Object.freeze(this.database.prepare<[string, string, string], { execution_id: string }>(`
SELECT DISTINCT execution_id FROM journal_execution_provenance
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?
ORDER BY execution_id`).all(workspaceId, accountId, importBatchId)
      .map((row) => row.execution_id));
  }

}
