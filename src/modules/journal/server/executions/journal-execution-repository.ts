import type Database from "better-sqlite3";

import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type {
  JournalExecutionAliasType, JournalExecutionFacts, JournalExecutionRecord,
  JournalExecutionState, JournalExecutionVersionRecord,
} from "../../contracts/journal-execution-contracts";

type AliasRow = Readonly<{ execution_alias_id: string; execution_id: string }>;
type CurrentRow = Readonly<{
  execution_id: string; workspace_id: string; account_id: string;
  current_version_id: string; current_state: JournalExecutionState;
  created_at_utc: string; updated_at_utc: string; version_number: number;
}>;
type VersionRow = Readonly<{
  execution_version_id: string; workspace_id: string; account_id: string;
  execution_id: string; version_number: number; instrument_id: string;
  trade_currency: string; source_timestamp_text: string; source_timezone: string;
  time_parser_version: string; executed_at_utc: string; source_order_key: string;
  side: "buy" | "sell"; quantity_decimal: string; price_decimal: string | null;
  fees_decimal: string | null; fee_currency: string | null;
  fee_sign_convention: JournalExecutionFacts["feeSignConvention"];
  fact_completeness: JournalExecutionFacts["factCompleteness"];
  actor_kind: "system" | "user"; actor_user_id: string | null;
  change_reason_code: string; created_at_utc: string;
}>;

function mapVersion(row: VersionRow): JournalExecutionVersionRecord {
  return Object.freeze({
    executionVersionId: row.execution_version_id,
    workspaceId: row.workspace_id,
    accountId: row.account_id,
    executionId: row.execution_id,
    versionNumber: row.version_number,
    instrumentId: row.instrument_id,
    tradeCurrency: row.trade_currency,
    sourceTimestampText: row.source_timestamp_text,
    sourceTimezone: row.source_timezone,
    timeParserVersion: row.time_parser_version,
    executedAtUtc: row.executed_at_utc,
    sourceOrderKey: row.source_order_key,
    side: row.side,
    quantityDecimal: row.quantity_decimal,
    priceDecimal: row.price_decimal,
    feesDecimal: row.fees_decimal,
    feeCurrency: row.fee_currency,
    feeSignConvention: row.fee_sign_convention,
    factCompleteness: row.fact_completeness,
    actorKind: row.actor_kind,
    actorUserId: row.actor_user_id,
    changeReasonCode: row.change_reason_code,
    createdAtUtc: row.created_at_utc,
  });
}

export class JournalExecutionRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.transaction(operation).immediate();
  }

  findActiveAlias(input: Readonly<{
    workspaceId: string; accountId: string; aliasType: JournalExecutionAliasType;
    aliasSchemeVersion: string; aliasSha256: string; occurrenceOrdinal: number | null;
  }>): Readonly<{ executionAliasId: string; executionId: string }> | null {
    const row = this.database.prepare<[string, string, string, string, string, number], AliasRow>(`
SELECT execution_alias_id, execution_id FROM journal_execution_identity_aliases
WHERE workspace_id = ? AND account_id = ? AND alias_type = ?
  AND alias_scheme_version = ? AND alias_sha256 = ?
  AND ifnull(occurrence_ordinal, 0) = ? AND status = 'active'`)
      .get(input.workspaceId, input.accountId, input.aliasType,
        input.aliasSchemeVersion, input.aliasSha256, input.occurrenceOrdinal ?? 0);
    return row ? Object.freeze({ executionAliasId: row.execution_alias_id, executionId: row.execution_id }) : null;
  }

  listActiveContentAliases(
    workspaceId: string,
    accountId: string,
    aliasSchemeVersion: string,
    aliasSha256: string,
  ): readonly Readonly<{ executionAliasId: string; executionId: string; occurrenceOrdinal: number }>[] {
    return Object.freeze(
      this.database.prepare<[string, string, string, string], AliasRow & { occurrence_ordinal: number }>(`
SELECT execution_alias_id, execution_id, occurrence_ordinal
FROM journal_execution_identity_aliases
WHERE workspace_id = ? AND account_id = ? AND alias_type = 'content_occurrence'
  AND alias_scheme_version = ? AND alias_sha256 = ? AND status = 'active'
ORDER BY occurrence_ordinal`).all(workspaceId, accountId, aliasSchemeVersion, aliasSha256)
        .map((row) => Object.freeze({
          executionAliasId: row.execution_alias_id,
          executionId: row.execution_id,
          occurrenceOrdinal: row.occurrence_ordinal,
        })),
    );
  }

  listReferencedPrivacySchemeVersions(
    workspaceId: string,
    accountId: string,
  ): readonly string[] {
    return Object.freeze(this.database.prepare<[string, string, string, string], {
      scheme_version: string;
    }>(`
SELECT scheme_version FROM (
  SELECT alias_scheme_version AS scheme_version
  FROM journal_execution_identity_aliases
  WHERE workspace_id = ? AND account_id = ?
    AND alias_type IN ('broker_fill', 'content_occurrence')
  UNION
  SELECT provider_identity_scheme_version AS scheme_version
  FROM journal_execution_provenance
  WHERE workspace_id = ? AND account_id = ?
    AND provider_identity_scheme_version IS NOT NULL
)
ORDER BY scheme_version`).all(workspaceId, accountId, workspaceId, accountId)
      .map((row) => row.scheme_version));
  }

  current(executionId: string, workspaceId: string, accountId: string): Readonly<JournalExecutionRecord & { versionNumber: number }> | null {
    const row = this.database.prepare<[string, string, string], CurrentRow>(`
SELECT e.*, v.version_number FROM journal_executions e
JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
WHERE e.execution_id = ? AND e.workspace_id = ? AND e.account_id = ?`)
      .get(executionId, workspaceId, accountId);
    return row ? Object.freeze({
      executionId: row.execution_id, workspaceId: row.workspace_id, accountId: row.account_id,
      currentVersionId: row.current_version_id, currentState: row.current_state,
      createdAtUtc: row.created_at_utc, updatedAtUtc: row.updated_at_utc,
      versionNumber: row.version_number,
    }) : null;
  }

  currentVersion(executionId: string, workspaceId: string, accountId: string): JournalExecutionVersionRecord | null {
    const row = this.database.prepare<[string, string, string], VersionRow>(`
SELECT v.* FROM journal_executions e
JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
WHERE e.execution_id = ? AND e.workspace_id = ? AND e.account_id = ?`)
      .get(executionId, workspaceId, accountId);
    return row ? mapVersion(row) : null;
  }

  hasOtherPendingDecision(input: Readonly<{
    workspaceId: string;
    accountId: string;
    executionId: string;
    excludingDecisionId: string;
  }>): boolean {
    return Boolean(this.database.prepare<[
      string,
      string,
      string,
      string,
      string,
    ], { found: number }>(`
SELECT 1 AS found
FROM journal_data_decisions d
WHERE d.workspace_id = ? AND d.account_id = ?
  AND d.state = 'pending' AND d.decision_id <> ?
  AND (
    (d.target_kind = 'execution' AND d.execution_id = ?)
    OR (
      d.target_kind = 'source_issue'
      AND EXISTS (
        SELECT 1
        FROM journal_source_row_issues issue
        JOIN journal_execution_provenance provenance
          ON provenance.workspace_id = issue.workspace_id
         AND provenance.account_id = issue.account_id
         AND provenance.source_row_id = issue.source_row_id
        WHERE issue.workspace_id = d.workspace_id
          AND issue.account_id = d.account_id
          AND issue.source_issue_id = d.source_issue_id
          AND issue.issue_code IN (
            'execution_price_missing',
            'overlap_fact_conflict',
            'overlap_count_ambiguous'
          )
          AND provenance.execution_id = ?
      )
    )
  )
LIMIT 1`).get(
      input.workspaceId,
      input.accountId,
      input.excludingDecisionId,
      input.executionId,
      input.executionId,
    ));
  }

  currentContentIdentityMaterial(
    executionId: string,
    workspaceId: string,
    accountId: string,
  ): Readonly<{
    assetClass: string;
    normalizedSymbol: string;
    tradeCurrency: string;
    executedAtUtc: string;
    side: "buy" | "sell";
    quantityDecimal: string;
    priceDecimal: string | null;
  }> | null {
    const row = this.database.prepare<[string, string, string], {
      asset_class: string;
      normalized_symbol: string;
      trade_currency: string;
      executed_at_utc: string;
      side: "buy" | "sell";
      quantity_decimal: string;
      price_decimal: string | null;
    }>(`
SELECT i.asset_class, i.normalized_symbol, v.trade_currency, v.executed_at_utc,
       v.side, v.quantity_decimal, v.price_decimal
FROM journal_executions e
JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
JOIN journal_instruments i ON i.instrument_id = v.instrument_id AND i.workspace_id = e.workspace_id
WHERE e.execution_id = ? AND e.workspace_id = ? AND e.account_id = ?`)
      .get(executionId, workspaceId, accountId);
    return row ? Object.freeze({
      assetClass: row.asset_class,
      normalizedSymbol: row.normalized_symbol,
      tradeCurrency: row.trade_currency,
      executedAtUtc: row.executed_at_utc,
      side: row.side,
      quantityDecimal: row.quantity_decimal,
      priceDecimal: row.price_decimal,
    }) : null;
  }

  listCurrentExecutionIdsByContentFacts(input: Readonly<{
    workspaceId: string;
    accountId: string;
    assetClass: string;
    normalizedSymbol: string;
    tradeCurrency: string;
    executedAtUtc: string;
    side: "buy" | "sell";
    quantityDecimal: string;
    priceDecimal: string | null;
  }>): readonly string[] {
    return Object.freeze(this.database.prepare<[
      string, string, string, string, string, string, string, string, string | null,
    ], { execution_id: string }>(`
SELECT e.execution_id
FROM journal_executions e
JOIN journal_execution_versions v
  ON v.execution_version_id = e.current_version_id
JOIN journal_instruments i
  ON i.instrument_id = v.instrument_id AND i.workspace_id = e.workspace_id
WHERE e.workspace_id = ? AND e.account_id = ?
  AND e.current_state <> 'superseded'
  AND i.asset_class = ? AND i.normalized_symbol = ?
  AND v.trade_currency = ? AND v.executed_at_utc = ?
  AND v.side = ? AND v.quantity_decimal = ? AND v.price_decimal IS ?
ORDER BY e.execution_id`).all(
      input.workspaceId,
      input.accountId,
      input.assetClass,
      input.normalizedSymbol,
      input.tradeCurrency,
      input.executedAtUtc,
      input.side,
      input.quantityDecimal,
      input.priceDecimal,
    ).map((row) => row.execution_id));
  }

  currentSourceOrderKeyExists(input: Readonly<{
    workspaceId: string;
    accountId: string;
    instrumentId: string;
    tradeCurrency: string;
    executedAtUtc: string;
    sourceOrderKey: string;
    excludingExecutionId: string;
  }>): boolean {
    return Boolean(this.database.prepare<[
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ], { found: number }>(`
SELECT 1 AS found
FROM journal_executions e
JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
WHERE e.workspace_id = ? AND e.account_id = ?
  AND v.instrument_id = ? AND v.trade_currency = ? AND v.executed_at_utc = ?
  AND v.source_order_key = ? AND e.execution_id <> ?
  AND e.current_state <> 'superseded'
LIMIT 1`).get(
      input.workspaceId,
      input.accountId,
      input.instrumentId,
      input.tradeCurrency,
      input.executedAtUtc,
      input.sourceOrderKey,
      input.excludingExecutionId,
    ));
  }

  updateState(input: Readonly<{
    executionId: string; workspaceId: string; accountId: string;
    expectedCurrentVersionId: string; state: JournalExecutionState; timestamp: string;
  }>): void {
    const result = this.database.prepare(`UPDATE journal_executions
SET current_state = ?, updated_at_utc = ?
WHERE execution_id = ? AND workspace_id = ? AND account_id = ? AND current_version_id = ?`)
      .run(input.state, input.timestamp, input.executionId, input.workspaceId,
        input.accountId, input.expectedCurrentVersionId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
  }

  createExecution(input: Readonly<{
    executionId: string; executionVersionId: string; workspaceId: string; accountId: string;
    state: JournalExecutionState; facts: JournalExecutionFacts; actorKind: "system" | "user";
    actorUserId: string | null; changeReasonCode: string; timestamp: string;
  }>): JournalExecutionVersionRecord {
    this.database.prepare(`INSERT INTO journal_executions (
 execution_id, workspace_id, account_id, current_version_id, current_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(input.executionId, input.workspaceId, input.accountId, input.executionVersionId,
        input.state, input.timestamp, input.timestamp);
    this.insertVersion({ ...input, versionNumber: 1 });
    return Object.freeze({
      ...input.facts, executionVersionId: input.executionVersionId,
      executionId: input.executionId, workspaceId: input.workspaceId, accountId: input.accountId,
      versionNumber: 1, actorKind: input.actorKind, actorUserId: input.actorUserId,
      changeReasonCode: input.changeReasonCode, createdAtUtc: input.timestamp,
    });
  }

  appendVersion(input: Readonly<{
    executionId: string; executionVersionId: string; workspaceId: string; accountId: string;
    expectedCurrentVersionId: string; versionNumber: number; state: JournalExecutionState;
    facts: JournalExecutionFacts; actorKind: "system" | "user"; actorUserId: string | null;
    changeReasonCode: string; timestamp: string;
  }>): JournalExecutionVersionRecord {
    this.insertVersion(input);
    const result = this.database.prepare(`UPDATE journal_executions
SET current_version_id = ?, current_state = ?, updated_at_utc = ?
WHERE execution_id = ? AND workspace_id = ? AND account_id = ? AND current_version_id = ?`)
      .run(input.executionVersionId, input.state, input.timestamp, input.executionId,
        input.workspaceId, input.accountId, input.expectedCurrentVersionId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
    return Object.freeze({
      ...input.facts, executionVersionId: input.executionVersionId,
      executionId: input.executionId, workspaceId: input.workspaceId, accountId: input.accountId,
      versionNumber: input.versionNumber, actorKind: input.actorKind,
      actorUserId: input.actorUserId, changeReasonCode: input.changeReasonCode,
      createdAtUtc: input.timestamp,
    });
  }

  private insertVersion(input: Readonly<{
    executionId: string; executionVersionId: string; workspaceId: string; accountId: string;
    versionNumber: number; facts: JournalExecutionFacts; actorKind: "system" | "user";
    actorUserId: string | null; changeReasonCode: string; timestamp: string;
  }>): void {
    const facts = input.facts;
    this.database.prepare(`INSERT INTO journal_execution_versions (
 execution_version_id, workspace_id, account_id, execution_id, version_number,
 instrument_id, trade_currency, source_timestamp_text, source_timezone,
 time_parser_version, executed_at_utc, source_order_key, side, quantity_decimal,
 price_decimal, fees_decimal, fee_currency, fee_sign_convention, fact_completeness,
 actor_kind, actor_user_id, change_reason_code, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.executionVersionId, input.workspaceId, input.accountId, input.executionId,
        input.versionNumber, facts.instrumentId, facts.tradeCurrency,
        facts.sourceTimestampText, facts.sourceTimezone, facts.timeParserVersion,
        facts.executedAtUtc, facts.sourceOrderKey, facts.side, facts.quantityDecimal,
        facts.priceDecimal, facts.feesDecimal, facts.feeCurrency, facts.feeSignConvention,
        facts.factCompleteness, input.actorKind, input.actorUserId,
        input.changeReasonCode, input.timestamp);
  }

  insertProvenance(input: Readonly<{
    executionProvenanceId: string; workspaceId: string; accountId: string;
    executionId: string; executionVersionId: string; importBatchId: string;
    sourceRowId: string; provenanceKind: "broker" | "manual" | "correction" | "overlap_match";
    providerIdentitySchemeVersion: string | null; providerIdentitySha256: string | null;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_execution_provenance (
 execution_provenance_id, workspace_id, account_id, execution_id,
 execution_version_id, import_batch_id, source_row_id, provenance_kind,
 provider_identity_scheme_version, provider_identity_sha256, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.executionProvenanceId, input.workspaceId, input.accountId,
        input.executionId, input.executionVersionId, input.importBatchId,
        input.sourceRowId, input.provenanceKind, input.providerIdentitySchemeVersion,
        input.providerIdentitySha256, input.timestamp);
  }

  insertAlias(input: Readonly<{
    executionAliasId: string; workspaceId: string; accountId: string; executionId: string;
    aliasType: JournalExecutionAliasType; aliasSchemeVersion: string; aliasSha256: string;
    occurrenceOrdinal: number | null; timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_execution_identity_aliases (
 execution_alias_id, workspace_id, account_id, execution_id, alias_type,
 alias_scheme_version, alias_sha256, occurrence_ordinal, status,
 superseded_by_alias_id, first_seen_at_utc, last_seen_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL, ?, ?)`)
      .run(input.executionAliasId, input.workspaceId, input.accountId, input.executionId,
        input.aliasType, input.aliasSchemeVersion, input.aliasSha256,
        input.occurrenceOrdinal, input.timestamp, input.timestamp);
  }

  touchAlias(input: Readonly<{
    workspaceId: string;
    accountId: string;
    executionAliasId: string;
    timestamp: string;
  }>): void {
    const result = this.database.prepare(`UPDATE journal_execution_identity_aliases SET last_seen_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND execution_alias_id = ? AND status = 'active'`)
      .run(input.timestamp, input.workspaceId, input.accountId, input.executionAliasId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
  }

  listActiveAliasesForExecution(workspaceId: string, accountId: string, executionId: string): readonly Readonly<{
    executionAliasId: string;
    aliasType: JournalExecutionAliasType;
    aliasSchemeVersion: string;
    aliasSha256: string;
    occurrenceOrdinal: number | null;
  }>[] {
    return Object.freeze(this.database.prepare<[string, string, string], {
      execution_alias_id: string; alias_type: JournalExecutionAliasType;
      alias_scheme_version: string; alias_sha256: string; occurrence_ordinal: number | null;
    }>(`SELECT execution_alias_id, alias_type, alias_scheme_version,
 alias_sha256, occurrence_ordinal
FROM journal_execution_identity_aliases
WHERE workspace_id = ? AND account_id = ? AND execution_id = ? AND status = 'active'
ORDER BY execution_alias_id`).all(workspaceId, accountId, executionId)
      .map((row) => Object.freeze({
        executionAliasId: row.execution_alias_id,
        aliasType: row.alias_type,
        aliasSchemeVersion: row.alias_scheme_version,
        aliasSha256: row.alias_sha256,
      occurrenceOrdinal: row.occurrence_ordinal,
    })));
  }

  listProviderIdentityEvidence(
    workspaceId: string,
    accountId: string,
    executionId: string,
  ): readonly Readonly<{
    schemeVersion: string;
    identitySha256: string;
  }>[] {
    return Object.freeze(this.database.prepare<[string, string, string], {
      provider_identity_scheme_version: string;
      provider_identity_sha256: string;
    }>(`
SELECT DISTINCT provider_identity_scheme_version, provider_identity_sha256
FROM journal_execution_provenance
WHERE workspace_id = ? AND account_id = ? AND execution_id = ?
  AND provider_identity_scheme_version IS NOT NULL
  AND provider_identity_sha256 IS NOT NULL
ORDER BY provider_identity_scheme_version, provider_identity_sha256`).all(
      workspaceId,
      accountId,
      executionId,
    ).map((row) => Object.freeze({
      schemeVersion: row.provider_identity_scheme_version,
      identitySha256: row.provider_identity_sha256,
    })));
  }

  supersedeAlias(input: Readonly<{
    workspaceId: string;
    accountId: string;
    executionAliasId: string;
    supersededByAliasId: string;
    timestamp: string;
  }>): void {
    const result = this.database.prepare(`UPDATE journal_execution_identity_aliases
SET status = 'superseded', superseded_by_alias_id = ?, last_seen_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND execution_alias_id = ? AND status = 'active'`)
      .run(input.supersededByAliasId, input.timestamp, input.workspaceId,
        input.accountId, input.executionAliasId);
    if (result.changes !== 1) platformFailure("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
  }

  reassignActiveAliases(
    workspaceId: string,
    accountId: string,
    fromExecutionId: string,
    toExecutionId: string,
    timestamp: string,
  ): void {
    this.database.prepare(`UPDATE journal_execution_identity_aliases
SET execution_id = ?, last_seen_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND execution_id = ? AND status = 'active'`)
      .run(toExecutionId, timestamp, workspaceId, accountId, fromExecutionId);
  }
}
