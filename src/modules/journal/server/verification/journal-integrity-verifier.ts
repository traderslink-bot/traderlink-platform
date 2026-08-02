import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import Database from "better-sqlite3";

import type {
  IbkrActivityStatementPreview,
  JournalAdapterExecution,
} from "../../contracts/journal-import-contracts";
import {
  narrowWorkspaceAccessToAccount,
  type WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import { JournalAccountRepository } from "../accounts/journal-account-repository";
import {
  ACCOUNT_FINGERPRINT_SCHEME_VERSION,
  type AccountIdentityConfiguration,
  JournalAccountService,
  loadAccountIdentityConfiguration,
} from "../accounts/journal-account-service";
import {
  IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
  IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "../accounts/ibkr-source-account-canonicalizer";
import { deriveDevelopmentOwnerJournalScope } from "../accounts/journal-development-owner-scope";
import { JournalIntegrityReadRepository } from "../journal-integrity-read-repository";
import { previewIbkrActivityStatement } from "../imports/ibkr-activity-statement-adapter";
import {
  readVerifiedJournalEvidenceObject,
  resolveJournalEvidenceVaultBoundary,
} from "../imports/journal-evidence-vault";
import {
  ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE,
  verifyAcceptedDevelopmentOwnerSourceBaseline,
} from "../imports/journal-private-source-import";
import {
  createJournalPrivacyDigester,
  createPrivacySafeIbkrPreview,
  loadJournalPrivacyHmacConfiguration,
} from "../imports/journal-import-service";
import { addDecimal, compareDecimal } from "../round-trips/journal-decimal-math";
import { JournalRoundTripRepository } from "../round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "../round-trips/journal-round-trip-service";
import {
  resolvePlatformDatabaseConfig,
  validatePlatformDatabasePath,
} from "@/src/modules/platform/server/database/platform-database-config";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import {
  assertCanonicalUuidV4,
  isLowercaseSha256,
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  readAppliedPlatformMigrations,
  requirePlatformForeignKeyCheck,
  requirePlatformQuickCheck,
} from "@/src/modules/platform/server/database/platform-migration-registry";
import { calculatePlatformSchemaDigest } from "@/src/modules/platform/server/database/platform-schema-digest";
import { verifyPlatformDatabaseConnectionPragmas } from "@/src/modules/platform/server/database/open-platform-database";
import { verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";

export const JOURNAL_INTEGRITY_VERIFICATION_ACTION =
  "verify_journal_integrity" as const;

const EXPECTED_MIGRATION_IDS = Object.freeze([
  "0001_platform_identity",
  "0002_journal_account_boundary",
  "0003_journal_import_evidence",
  "0004_journal_execution_ledger",
  "0005_journal_data_decisions",
  "0006_journal_round_trip_projection",
]);

export type TraderLinkJournalIntegrityVerificationResult = Readonly<{
  status: "journal_integrity_verified";
  identifiersRedacted: true;
  migrationCount: 6;
  migrationRows: readonly Readonly<{
    migrationId: string;
    checksumSha256: string;
    postSchemaSha256: string;
  }>[];
  schemaSha256: string;
  databaseFileSha256: string;
  databaseFileSizeBytes: number;
  workspaceId: string;
  accountId: string;
  sourceIdentityId: string;
  importBatchId: string;
  evidence: Readonly<{
    sourceFileSha256: string;
    sourceFileSizeBytes: number;
    aggregatePreviewSha256: string;
    evidenceObjectKey: string;
  }>;
  authority: Readonly<{
    accountIdentityReferencedKeyCount: number;
    accountIdentityReferencedCanonicalizerCount: number;
    journalReferencedSchemeCount: number;
  }>;
  counts: Readonly<{
    sourceRows: number;
    mappedExecutions: number;
    mappedPositionSourceRows: number;
    currentPositionFacts: number;
    unsupportedRows: number;
    executions: number;
    decisions: number;
    activeRoundTrips: number;
    readyClosedRoundTrips: number;
    legitimateOpenRoundTrips: number;
    needsDecisionRoundTrips: number;
    latestRebuildChains: number;
    affectedChains: number;
    unaffectedChains: number;
  }>;
  integrity: Readonly<{
    foreignKeys: "ok";
    quickCheck: "ok";
    integrityCheck: "ok";
    relationships: "ok";
    allocationConservation: "ok";
    rebuildFreshness: "ok";
    idempotencyEvidence: "ok";
    evidenceVault: "ok";
    sidecars: "no_pending_wal";
  }>;
}>;

export type TraderLinkJournalIntegrityVerificationOptions = Readonly<{
  sourcePath: string;
  sourceTimezone: string;
  expectedSourceFileSha256: string;
  expectedSourceFileSizeBytes: number;
  expectedAggregatePreviewSha256: string;
  expectedFirstImportBatchId: string;
  expectedReimportBatchId: string;
  environment?: NodeJS.ProcessEnv;
  databasePath?: string;
  forbiddenRepositoryRoots?: readonly string[];
  protectedStorageRoots?: readonly string[];
}>;

type CountRow = Readonly<{ count: number }>;

function sha256Bytes(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function sha256Json(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("hex");
}

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function integrityFailure(check: string): never {
  return platformFailure("TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED", {
    check,
  });
}

function requireZeroRows(
  database: Database.Database,
  sql: string,
  parameters: readonly unknown[],
  check: string,
): void {
  const row = database.prepare(sql).get(...parameters) as CountRow | undefined;
  if (row?.count !== 0) integrityFailure(check);
}

function requireIntegrityCheck(database: Database.Database): void {
  const rows = database.pragma("integrity_check") as readonly Record<string, unknown>[];
  if (rows.length !== 1 || Object.values(rows[0] ?? {})[0] !== "ok") {
    integrityFailure("integrity_check");
  }
}

function requireNoPendingWal(walPath: string): void {
  if (!existsSync(walPath)) return;
  const evidence = lstatSync(walPath);
  if (!evidence.isFile() || evidence.isSymbolicLink() || evidence.size !== 0) {
    integrityFailure("database_pending_wal");
  }
}

function requireExpectedInput(
  options: TraderLinkJournalIntegrityVerificationOptions,
): void {
  if (
    !isLowercaseSha256(options.expectedSourceFileSha256) ||
    !isLowercaseSha256(options.expectedAggregatePreviewSha256) ||
    !Number.isSafeInteger(options.expectedSourceFileSizeBytes) ||
    options.expectedSourceFileSizeBytes < 1
  ) {
    integrityFailure("verification_expected_evidence");
  }
  assertCanonicalUuidV4(
    options.expectedFirstImportBatchId,
    "expectedFirstImportBatchId",
  );
  assertCanonicalUuidV4(
    options.expectedReimportBatchId,
    "expectedReimportBatchId",
  );
  if (options.expectedFirstImportBatchId !== options.expectedReimportBatchId) {
    integrityFailure("exact_reimport_batch_identity");
  }
}

function requireExactMigrationBoundary(database: Database.Database): Readonly<{
  schemaSha256: string;
  migrationRows: TraderLinkJournalIntegrityVerificationResult["migrationRows"];
}> {
  if (platformMigrationManifest.length !== 6) {
    integrityFailure("six_migration_manifest");
  }
  verifyCompletedPlatformDatabase(database);
  verifyPlatformDatabaseConnectionPragmas(database);
  requirePlatformForeignKeyCheck(database);
  requirePlatformQuickCheck(database);
  requireIntegrityCheck(database);
  const rows = readAppliedPlatformMigrations(database);
  if (
    rows.length !== 6 ||
    JSON.stringify(rows.map((row) => row.migration_id)) !==
      JSON.stringify(EXPECTED_MIGRATION_IDS)
  ) {
    integrityFailure("six_migration_history");
  }
  const schemaSha256 = calculatePlatformSchemaDigest(database);
  if (schemaSha256 !== rows.at(-1)?.post_schema_sha256) {
    integrityFailure("schema_digest");
  }
  return Object.freeze({
    schemaSha256,
    migrationRows: Object.freeze(rows.map((row) => Object.freeze({
      migrationId: row.migration_id,
      checksumSha256: row.checksum_sha256,
      postSchemaSha256: row.post_schema_sha256,
    }))),
  });
}

function requireAppendOnlyRelationships(
  database: Database.Database,
  workspaceId: string,
  accountId: string,
): void {
  const scope = [workspaceId, accountId] as const;
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM journal_import_batches batch
LEFT JOIN journal_import_events event
  ON event.workspace_id = batch.workspace_id
 AND event.account_id = batch.account_id
 AND event.import_batch_id = batch.import_batch_id
 AND event.import_event_id = batch.current_event_id
WHERE batch.workspace_id = ? AND batch.account_id = ?
  AND (event.import_event_id IS NULL OR event.new_state <> batch.current_state)`, scope,
  "import_current_event");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM (
SELECT import_batch_id FROM journal_import_events
WHERE workspace_id = ? AND account_id = ? GROUP BY import_batch_id
HAVING MIN(event_sequence) <> 1 OR MAX(event_sequence) <> COUNT(*)
)`, scope, "import_event_sequence");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM journal_import_batches batch
WHERE batch.workspace_id = ? AND batch.account_id = ? AND (
  batch.preserved_row_count <> (SELECT COUNT(*) FROM journal_source_rows row
    WHERE row.workspace_id = batch.workspace_id AND row.account_id = batch.account_id
      AND row.import_batch_id = batch.import_batch_id)
  OR batch.mapped_execution_count <> (SELECT COUNT(*) FROM journal_source_rows row
    WHERE row.workspace_id = batch.workspace_id AND row.account_id = batch.account_id
      AND row.import_batch_id = batch.import_batch_id
      AND row.initial_classification = 'mapped_execution')
  OR batch.unsupported_row_count <> (SELECT COUNT(*) FROM journal_source_rows row
    WHERE row.workspace_id = batch.workspace_id AND row.account_id = batch.account_id
      AND row.import_batch_id = batch.import_batch_id
      AND row.initial_classification = 'unsupported')
  OR batch.issue_count <> (SELECT COUNT(*) FROM journal_source_row_issues issue
    WHERE issue.workspace_id = batch.workspace_id AND issue.account_id = batch.account_id
      AND issue.import_batch_id = batch.import_batch_id)
  OR batch.pending_decision_count <> (SELECT COUNT(*)
    FROM journal_data_decisions decision
    JOIN journal_source_row_issues issue
      ON issue.workspace_id = decision.workspace_id
     AND issue.account_id = decision.account_id
     AND issue.source_issue_id = decision.source_issue_id
    WHERE decision.workspace_id = batch.workspace_id
      AND decision.account_id = batch.account_id
      AND decision.target_kind = 'source_issue'
      AND decision.state = 'pending'
      AND issue.import_batch_id = batch.import_batch_id)
)`, scope, "import_aggregate_counts");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM journal_executions execution
JOIN journal_execution_versions current
  ON current.workspace_id = execution.workspace_id
 AND current.account_id = execution.account_id
 AND current.execution_id = execution.execution_id
 AND current.execution_version_id = execution.current_version_id
WHERE execution.workspace_id = ? AND execution.account_id = ?
  AND current.version_number <> (SELECT MAX(version.version_number)
    FROM journal_execution_versions version
    WHERE version.workspace_id = execution.workspace_id
      AND version.account_id = execution.account_id
      AND version.execution_id = execution.execution_id)`, scope,
  "execution_current_version");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM (
SELECT execution_id FROM journal_execution_versions
WHERE workspace_id = ? AND account_id = ? GROUP BY execution_id
HAVING MIN(version_number) <> 1 OR MAX(version_number) <> COUNT(*)
)`, scope, "execution_version_sequence");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM journal_data_decisions decision
LEFT JOIN journal_data_decision_events event
  ON event.workspace_id = decision.workspace_id
 AND event.account_id = decision.account_id
 AND event.decision_id = decision.decision_id
 AND event.decision_event_id = decision.current_event_id
WHERE decision.workspace_id = ? AND decision.account_id = ?
  AND (event.decision_event_id IS NULL OR event.resulting_state <> decision.state
    OR event.event_sequence <> decision.revision)`, scope, "decision_current_event");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM (
SELECT decision_id FROM journal_data_decision_events
WHERE workspace_id = ? AND account_id = ? GROUP BY decision_id
HAVING MIN(event_sequence) <> 1 OR MAX(event_sequence) <> COUNT(*)
)`, scope, "decision_event_sequence");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM journal_round_trips round_trip
JOIN journal_round_trip_versions current
  ON current.workspace_id = round_trip.workspace_id
 AND current.account_id = round_trip.account_id
 AND current.round_trip_id = round_trip.round_trip_id
 AND current.round_trip_version_id = round_trip.current_version_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND current.version_number <> (SELECT MAX(version.version_number)
    FROM journal_round_trip_versions version
    WHERE version.workspace_id = round_trip.workspace_id
      AND version.account_id = round_trip.account_id
      AND version.round_trip_id = round_trip.round_trip_id)`, scope,
  "round_trip_current_version");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM (
SELECT round_trip_id FROM journal_round_trip_versions
WHERE workspace_id = ? AND account_id = ? GROUP BY round_trip_id
HAVING MIN(version_number) <> 1 OR MAX(version_number) <> COUNT(*)
)`, scope, "round_trip_version_sequence");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM (
SELECT previous_rebuild_id FROM journal_chain_rebuilds
WHERE workspace_id = ? AND account_id = ? AND previous_rebuild_id IS NOT NULL
GROUP BY previous_rebuild_id HAVING COUNT(*) > 1
)`, scope, "rebuild_lineage_fork");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM (
SELECT instrument_id, trade_currency FROM journal_chain_rebuilds current
WHERE current.workspace_id = ? AND current.account_id = ? AND NOT EXISTS (
  SELECT 1 FROM journal_chain_rebuilds next
  WHERE next.workspace_id = current.workspace_id
    AND next.account_id = current.account_id
    AND next.instrument_id = current.instrument_id
    AND next.trade_currency = current.trade_currency
    AND next.previous_rebuild_id = current.rebuild_id)
GROUP BY instrument_id, trade_currency HAVING COUNT(*) > 1
)`, scope, "rebuild_latest_fork");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM journal_execution_provenance provenance
LEFT JOIN journal_executions execution
  ON execution.workspace_id = provenance.workspace_id
 AND execution.account_id = provenance.account_id
 AND execution.execution_id = provenance.execution_id
LEFT JOIN journal_execution_versions version
  ON version.workspace_id = provenance.workspace_id
 AND version.account_id = provenance.account_id
 AND version.execution_id = provenance.execution_id
 AND version.execution_version_id = provenance.execution_version_id
LEFT JOIN journal_source_rows row
  ON row.workspace_id = provenance.workspace_id
 AND row.account_id = provenance.account_id
 AND row.import_batch_id = provenance.import_batch_id
 AND row.source_row_id = provenance.source_row_id
WHERE provenance.workspace_id = ? AND provenance.account_id = ?
  AND (execution.execution_id IS NULL OR version.execution_version_id IS NULL
    OR row.source_row_id IS NULL)`, scope, "execution_provenance_relationship");
  requireZeroRows(database, `SELECT COUNT(*) AS count FROM journal_round_trip_execution_allocations allocation
LEFT JOIN journal_round_trip_versions round_version
  ON round_version.workspace_id = allocation.workspace_id
 AND round_version.account_id = allocation.account_id
 AND round_version.round_trip_version_id = allocation.round_trip_version_id
LEFT JOIN journal_execution_versions execution_version
  ON execution_version.workspace_id = allocation.workspace_id
 AND execution_version.account_id = allocation.account_id
 AND execution_version.execution_version_id = allocation.execution_version_id
WHERE allocation.workspace_id = ? AND allocation.account_id = ?
  AND (round_version.round_trip_version_id IS NULL
    OR execution_version.execution_version_id IS NULL)`, scope,
  "allocation_relationship");
}

function requireScopeIsolation(
  database: Database.Database,
  workspaceId: string,
  accountId: string,
): void {
  const accountScopedTables = Object.freeze([
    "journal_accounts",
    "journal_account_source_identities",
    "journal_import_batches",
    "journal_import_events",
    "journal_source_rows",
    "journal_source_row_issues",
    "journal_source_coverage_intervals",
    "journal_position_facts",
    "journal_executions",
    "journal_execution_versions",
    "journal_execution_provenance",
    "journal_execution_identity_aliases",
    "journal_data_decisions",
    "journal_data_decision_events",
    "journal_chain_rebuilds",
    "journal_round_trips",
    "journal_round_trip_versions",
    "journal_round_trip_execution_allocations",
    "journal_round_trip_identity_aliases",
    "journal_trading_days",
  ]);
  for (const tableName of accountScopedTables) {
    requireZeroRows(
      database,
      `SELECT COUNT(*) AS count FROM ${tableName}
WHERE workspace_id <> ? OR account_id <> ?`,
      [workspaceId, accountId],
      "journal_scope_isolation",
    );
  }
  requireZeroRows(
    database,
    `SELECT COUNT(*) AS count FROM journal_instruments WHERE workspace_id <> ?`,
    [workspaceId],
    "instrument_workspace_isolation",
  );
  const accountCount = database.prepare<[], CountRow>(
    "SELECT COUNT(*) AS count FROM journal_accounts",
  ).get()?.count;
  if (accountCount !== 1) integrityFailure("journal_account_cardinality");
}

function localDateAt(utc: string, timezone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(utc))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function requireTradingDayRelationships(
  database: Database.Database,
  workspaceId: string,
  accountId: string,
): void {
  const timezone = database.prepare<[string, string], { trading_timezone: string }>(
    `SELECT trading_timezone FROM journal_accounts
WHERE workspace_id = ? AND account_id = ?`,
  ).get(workspaceId, accountId)?.trading_timezone;
  if (!timezone) integrityFailure("trading_day_account_timezone");
  const executionDates = new Set(database.prepare<[string, string], {
    executed_at_utc: string;
  }>(`SELECT version.executed_at_utc
FROM journal_executions execution
JOIN journal_execution_versions version
  ON version.workspace_id = execution.workspace_id
 AND version.account_id = execution.account_id
 AND version.execution_version_id = execution.current_version_id
WHERE execution.workspace_id = ? AND execution.account_id = ?
  AND execution.current_state <> 'superseded'
ORDER BY version.executed_at_utc`).all(workspaceId, accountId)
    .map((row) => localDateAt(row.executed_at_utc, timezone)));
  const tradingDays = new Set(database.prepare<[string, string], {
    trading_date: string;
    trading_timezone: string;
  }>(`SELECT trading_date, trading_timezone FROM journal_trading_days
WHERE workspace_id = ? AND account_id = ? AND status = 'active'
ORDER BY trading_date`).all(workspaceId, accountId).map((row) => {
    if (row.trading_timezone !== timezone) {
      integrityFailure("trading_day_timezone");
    }
    return row.trading_date;
  }));
  if (
    executionDates.size !== tradingDays.size ||
    [...executionDates].some((date) => !tradingDays.has(date))
  ) {
    integrityFailure("trading_day_execution_coverage");
  }
}

function requireAllocationConservation(
  database: Database.Database,
  workspaceId: string,
  accountId: string,
): void {
  const rows = database.prepare<[string, string], {
    execution_version_id: string;
    current_state: "accepted" | "needs_decision" | "excluded_by_trader" | "superseded";
    quantity_decimal: string;
    allocated_quantity_decimal: string | null;
  }>(`SELECT current.execution_version_id, execution.current_state,
       current.quantity_decimal, allocation.quantity_decimal AS allocated_quantity_decimal
FROM journal_executions execution
JOIN journal_execution_versions current
  ON current.execution_version_id = execution.current_version_id
 AND current.workspace_id = execution.workspace_id
 AND current.account_id = execution.account_id
LEFT JOIN journal_round_trip_execution_allocations allocation
  ON allocation.workspace_id = current.workspace_id
 AND allocation.account_id = current.account_id
 AND allocation.execution_version_id = current.execution_version_id
 AND EXISTS (
   SELECT 1 FROM journal_round_trips round_trip
   WHERE round_trip.workspace_id = allocation.workspace_id
     AND round_trip.account_id = allocation.account_id
     AND round_trip.current_version_id = allocation.round_trip_version_id
     AND round_trip.lifecycle_state = 'active'
 )
WHERE execution.workspace_id = ? AND execution.account_id = ?
ORDER BY current.execution_version_id, allocation.allocation_sequence`)
    .all(workspaceId, accountId);
  const totals = new Map<string, {
    state: typeof rows[number]["current_state"];
    quantity: string;
    allocated: string;
  }>();
  for (const row of rows) {
    const prior = totals.get(row.execution_version_id) ?? {
      state: row.current_state,
      quantity: row.quantity_decimal,
      allocated: "0",
    };
    if (row.allocated_quantity_decimal !== null) {
      prior.allocated = addDecimal(prior.allocated, row.allocated_quantity_decimal);
    }
    totals.set(row.execution_version_id, prior);
  }
  for (const total of totals.values()) {
    const expected = total.state === "accepted" || total.state === "needs_decision"
      ? total.quantity
      : "0";
    if (compareDecimal(total.allocated, expected) !== 0) {
      integrityFailure("allocation_conservation");
    }
  }
}

function requireStoredSourceRowsMatchPreview(
  database: Database.Database,
  workspaceId: string,
  accountId: string,
  importBatchId: string,
  preview: IbkrActivityStatementPreview,
): void {
  const rows = database.prepare<[string, string, string], {
    record_ordinal: number;
    source_record_identity_sha256: string;
    raw_record_sha256: string;
    raw_fields_json: string;
    section_name: string | null;
    record_type: string | null;
    asset_category: string | null;
    content_fingerprint_sha256: string;
    occurrence_ordinal: number;
    initial_classification: string;
    mapping_version: string;
  }>(`SELECT record_ordinal, source_record_identity_sha256,
       raw_record_sha256, raw_fields_json, section_name, record_type,
       asset_category, content_fingerprint_sha256, occurrence_ordinal,
       initial_classification, mapping_version
FROM journal_source_rows
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?
ORDER BY record_ordinal`).all(workspaceId, accountId, importBatchId);
  if (rows.length !== preview.rows.length) {
    integrityFailure("stored_source_row_cardinality");
  }
  for (let index = 0; index < preview.rows.length; index += 1) {
    const expected = preview.rows[index];
    const actual = rows[index];
    if (
      !expected ||
      !actual ||
      actual.record_ordinal !== expected.recordOrdinal ||
      actual.source_record_identity_sha256 !== sha256Text([
        "journal-source-record-v1",
        preview.sourceFileSha256,
        String(expected.recordOrdinal),
      ].join("\u001f")) ||
      actual.raw_record_sha256 !== expected.rawRecordSha256 ||
      actual.raw_fields_json !== expected.rawFieldsJson ||
      actual.section_name !== expected.sectionName ||
      actual.record_type !== expected.recordType ||
      actual.asset_category !== expected.assetCategory ||
      actual.content_fingerprint_sha256 !== expected.contentFingerprintSha256 ||
      actual.occurrence_ordinal !== expected.occurrenceOrdinal ||
      actual.initial_classification !== expected.classification ||
      actual.mapping_version !== preview.mappingVersion
    ) {
      integrityFailure("stored_source_row_evidence");
    }
  }
}

function requireStoredPositionFactsMatchPreview(
  database: Database.Database,
  workspaceId: string,
  accountId: string,
  importBatchId: string,
  preview: IbkrActivityStatementPreview,
): void {
  const rows = database.prepare<[string, string, string], {
    record_ordinal: number;
    normalized_symbol: string;
    asset_class: string;
    currency: string;
    fact_kind: string;
    effective_local_date: string;
    time_precision: string;
    source_time_text: string | null;
    source_timezone: string;
    effective_at_utc: string | null;
    quantity_decimal: string;
    fact_source: string;
    fact_version: string;
    supersedes_position_fact_id: string | null;
    actor_user_id: string | null;
  }>(`SELECT source.record_ordinal, instrument.normalized_symbol,
       instrument.asset_class, fact.currency, fact.fact_kind,
       fact.effective_local_date, fact.time_precision, fact.source_time_text,
       fact.source_timezone, fact.effective_at_utc, fact.quantity_decimal,
       fact.fact_source, fact.fact_version, fact.supersedes_position_fact_id,
       fact.actor_user_id
FROM journal_position_facts AS fact
JOIN journal_source_rows AS source
  ON source.workspace_id = fact.workspace_id
 AND source.account_id = fact.account_id
 AND source.import_batch_id = fact.import_batch_id
 AND source.source_row_id = fact.source_row_id
JOIN journal_instruments AS instrument
  ON instrument.workspace_id = fact.workspace_id
 AND instrument.instrument_id = fact.instrument_id
WHERE fact.workspace_id = ? AND fact.account_id = ? AND fact.import_batch_id = ?
ORDER BY source.record_ordinal, fact.fact_kind, fact.position_fact_id`)
    .all(workspaceId, accountId, importBatchId);
  const expected = [...preview.positionFacts].sort((left, right) =>
    left.recordOrdinal - right.recordOrdinal ||
    left.factKind.localeCompare(right.factKind));
  if (rows.length !== expected.length) {
    integrityFailure("stored_position_fact_cardinality");
  }
  for (let index = 0; index < expected.length; index += 1) {
    const fact = expected[index];
    const row = rows[index];
    if (
      !fact ||
      !row ||
      row.record_ordinal !== fact.recordOrdinal ||
      row.normalized_symbol !== fact.normalizedSymbol ||
      row.asset_class !== fact.assetClass ||
      row.currency !== fact.currency ||
      row.fact_kind !== fact.factKind ||
      row.effective_local_date !== fact.effectiveLocalDate ||
      row.time_precision !== fact.timePrecision ||
      row.source_time_text !== null ||
      row.source_timezone !== preview.sourceTimezone ||
      row.effective_at_utc !== null ||
      row.quantity_decimal !== fact.quantityDecimal ||
      row.fact_source !== "statement" ||
      row.fact_version !== "statement_v1" ||
      row.supersedes_position_fact_id !== null ||
      row.actor_user_id !== null
    ) {
      integrityFailure("stored_position_fact_evidence");
    }
  }
}

function executionByOrdinal(
  preview: IbkrActivityStatementPreview,
): ReadonlyMap<number, JournalAdapterExecution> {
  const result = new Map<number, JournalAdapterExecution>();
  for (const execution of preview.executions) {
    if (result.has(execution.recordOrdinal)) {
      integrityFailure("parsed_execution_ordinal_uniqueness");
    }
    result.set(execution.recordOrdinal, execution);
  }
  return result;
}

function requireStoredExecutionsMatchPreview(
  database: Database.Database,
  workspaceId: string,
  accountId: string,
  importBatchId: string,
  preview: IbkrActivityStatementPreview,
  environment: NodeJS.ProcessEnv,
): void {
  const rows = database.prepare<[string, string, string], {
    record_ordinal: number;
    provenance_kind: string | null;
    provider_identity_scheme_version: string | null;
    provider_identity_sha256: string | null;
    current_state: string | null;
    current_version_id: string | null;
    execution_version_id: string | null;
    version_number: number | null;
    normalized_symbol: string | null;
    asset_class: string | null;
    trade_currency: string | null;
    source_timestamp_text: string | null;
    source_timezone: string | null;
    time_parser_version: string | null;
    executed_at_utc: string | null;
    source_order_key: string | null;
    side: string | null;
    quantity_decimal: string | null;
    price_decimal: string | null;
    fees_decimal: string | null;
    fee_currency: string | null;
    fee_sign_convention: string | null;
    fact_completeness: string | null;
    actor_kind: string | null;
    actor_user_id: string | null;
    change_reason_code: string | null;
  }>(`SELECT source.record_ordinal, provenance.provenance_kind,
       provenance.provider_identity_scheme_version,
       provenance.provider_identity_sha256, execution.current_state,
       execution.current_version_id, version.execution_version_id,
       version.version_number, instrument.normalized_symbol,
       instrument.asset_class, version.trade_currency,
       version.source_timestamp_text, version.source_timezone,
       version.time_parser_version, version.executed_at_utc,
       version.source_order_key, version.side, version.quantity_decimal,
       version.price_decimal, version.fees_decimal, version.fee_currency,
       version.fee_sign_convention, version.fact_completeness,
       version.actor_kind, version.actor_user_id, version.change_reason_code
FROM journal_source_rows AS source
LEFT JOIN journal_execution_provenance AS provenance
  ON provenance.workspace_id = source.workspace_id
 AND provenance.account_id = source.account_id
 AND provenance.import_batch_id = source.import_batch_id
 AND provenance.source_row_id = source.source_row_id
LEFT JOIN journal_executions AS execution
  ON execution.workspace_id = provenance.workspace_id
 AND execution.account_id = provenance.account_id
 AND execution.execution_id = provenance.execution_id
LEFT JOIN journal_execution_versions AS version
  ON version.workspace_id = provenance.workspace_id
 AND version.account_id = provenance.account_id
 AND version.execution_id = provenance.execution_id
 AND version.execution_version_id = provenance.execution_version_id
LEFT JOIN journal_instruments AS instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE source.workspace_id = ? AND source.account_id = ?
  AND source.import_batch_id = ?
  AND source.initial_classification = 'mapped_execution'
ORDER BY source.record_ordinal, provenance.execution_provenance_id`)
    .all(workspaceId, accountId, importBatchId);
  const expectedByOrdinal = executionByOrdinal(preview);
  if (rows.length !== expectedByOrdinal.size) {
    integrityFailure("stored_execution_provenance_cardinality");
  }
  const digester = createJournalPrivacyDigester(
    loadJournalPrivacyHmacConfiguration(environment),
  );
  for (const row of rows) {
    const expected = expectedByOrdinal.get(row.record_ordinal);
    if (
      !expected ||
      row.provenance_kind !== "broker" ||
      row.current_state !== "accepted" ||
      row.current_version_id !== row.execution_version_id ||
      row.version_number !== 1 ||
      row.normalized_symbol !== expected.normalizedSymbol ||
      row.asset_class !== expected.assetClass ||
      row.trade_currency !== expected.tradeCurrency ||
      row.source_timestamp_text !== expected.sourceTimestampText ||
      row.source_timezone !== expected.sourceTimezone ||
      row.time_parser_version !== expected.timeParserVersion ||
      row.executed_at_utc !== expected.executedAtUtc ||
      row.source_order_key !== expected.sourceOrderKey ||
      row.side !== expected.side ||
      row.quantity_decimal !== expected.quantityDecimal ||
      row.price_decimal !== expected.priceDecimal ||
      row.fees_decimal !== expected.feesDecimal ||
      row.fee_currency !== expected.feeCurrency ||
      row.fee_sign_convention !== expected.feeSignConvention ||
      row.fact_completeness !== expected.factCompleteness ||
      row.actor_kind !== "system" ||
      row.actor_user_id !== null ||
      row.change_reason_code !== "broker_import"
    ) {
      integrityFailure("stored_execution_content");
    }
    const providerCandidates = expected.providerExecutionIdentity === null
      ? []
      : digester.candidateDigests(
          "broker_execution",
          expected.providerExecutionIdentity,
        );
    if (
      expected.providerExecutionIdentity === null
        ? row.provider_identity_scheme_version !== null ||
          row.provider_identity_sha256 !== null
        : !providerCandidates.some((candidate) =>
            candidate.schemeVersion === row.provider_identity_scheme_version &&
            candidate.digestSha256 === row.provider_identity_sha256)
    ) {
      integrityFailure("stored_execution_provenance_evidence");
    }
  }
}

function requireAuthority(
  database: Database.Database,
  workspaceId: string,
  accountId: string,
  accountConfiguration: AccountIdentityConfiguration,
  environment: NodeJS.ProcessEnv,
): TraderLinkJournalIntegrityVerificationResult["authority"] {
  const accountRows = database.prepare<[string, string], {
    fingerprint_scheme_version: string;
    source_account_canonicalization_version: string;
    hmac_key_version: string;
  }>(`SELECT DISTINCT fingerprint_scheme_version,
       source_account_canonicalization_version, hmac_key_version
FROM journal_account_source_identities
WHERE workspace_id = ? AND account_id = ?
ORDER BY fingerprint_scheme_version, source_account_canonicalization_version,
         hmac_key_version`).all(workspaceId, accountId);
  const accountKeys = new Set(Object.keys(accountConfiguration.keysBase64));
  const canonicalizers = new Set(Object.keys(accountConfiguration.canonicalizers));
  if (accountRows.some((row) =>
    row.fingerprint_scheme_version !== ACCOUNT_FINGERPRINT_SCHEME_VERSION ||
    !accountKeys.has(row.hmac_key_version) ||
    !canonicalizers.has(row.source_account_canonicalization_version))) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }

  const journalDigester = createJournalPrivacyDigester(
    loadJournalPrivacyHmacConfiguration(environment),
  );
  const journalRows = database.prepare<[string, string, string, string], {
    scheme_version: string;
  }>(`SELECT DISTINCT alias_scheme_version AS scheme_version
FROM journal_execution_identity_aliases
WHERE workspace_id = ? AND account_id = ?
  AND alias_type IN ('broker_fill', 'broker_order_fill', 'content_occurrence')
UNION
SELECT DISTINCT provider_identity_scheme_version AS scheme_version
FROM journal_execution_provenance
WHERE workspace_id = ? AND account_id = ?
  AND provider_identity_scheme_version IS NOT NULL
ORDER BY scheme_version`).all(workspaceId, accountId, workspaceId, accountId);
  const configuredJournalSchemes = new Set(journalDigester.schemeVersions);
  if (journalRows.some((row) => !configuredJournalSchemes.has(row.scheme_version))) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED", {
      check: "journal_execution_hmac_authority",
    });
  }
  return Object.freeze({
    accountIdentityReferencedKeyCount:
      new Set(accountRows.map((row) => row.hmac_key_version)).size,
    accountIdentityReferencedCanonicalizerCount:
      new Set(accountRows.map((row) =>
        row.source_account_canonicalization_version)).size,
    journalReferencedSchemeCount: journalRows.length,
  });
}

function requireEvidenceSourceAccountIdentity(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  expectedAccountId: string,
  rawSourceAccountId: string | null,
  accountConfiguration: AccountIdentityConfiguration,
): void {
  if (rawSourceAccountId === null) {
    integrityFailure("vault_source_account_identity_resolution");
  }
  let resolvedAccountId: string;
  try {
    resolvedAccountId = new JournalAccountService(
      new JournalAccountRepository(database),
      accountConfiguration,
    ).inspectSourceAccountIdentity(scope, {
      sourceSystem: "ibkr",
      rawSourceAccountId,
    }).accountId;
  } catch (error) {
    if (
      isTraderLinkPlatformError(error) &&
      [
        "TRADERLINK_ACCOUNT_ACCESS_DENIED",
        "TRADERLINK_ACCOUNT_IDENTITY_CONFIGURATION_INVALID",
        "TRADERLINK_ACCOUNT_IDENTITY_CONFIRMATION_REQUIRED",
        "TRADERLINK_ACCOUNT_IDENTITY_CONFLICT",
        "TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED",
        "TRADERLINK_ACCOUNT_NOT_FOUND",
      ].includes(error.code)
    ) {
      integrityFailure("vault_source_account_identity_resolution");
    }
    throw error;
  }
  if (resolvedAccountId !== expectedAccountId) {
    integrityFailure("vault_source_account_identity_resolution");
  }
}

function requireVaultInventory(
  rootPath: string,
  expectedObjectKeys: readonly string[],
): void {
  const expectedFiles = new Set(expectedObjectKeys.map((key) => key.slice("ibkr/".length)));
  const rootEntries = readdirSync(rootPath, { withFileTypes: true });
  if (rootEntries.some((entry) =>
    entry.name !== "ibkr" || !entry.isDirectory() || entry.isSymbolicLink())) {
    integrityFailure("unmanaged_vault_root_object");
  }
  const objectDirectory = join(rootPath, "ibkr");
  if (!existsSync(objectDirectory) || lstatSync(objectDirectory).isSymbolicLink()) {
    integrityFailure("vault_object_directory");
  }
  const actualFiles = readdirSync(objectDirectory, { withFileTypes: true });
  if (
    actualFiles.length !== expectedFiles.size ||
    actualFiles.some((entry) =>
      !entry.isFile() || entry.isSymbolicLink() || !expectedFiles.has(entry.name))
  ) {
    integrityFailure("unmanaged_or_missing_vault_object");
  }
}

function verifyTraderLinkPlatformJournalIntegrityInternal(
  options: TraderLinkJournalIntegrityVerificationOptions,
): TraderLinkJournalIntegrityVerificationResult {
  requireExpectedInput(options);
  const environment = options.environment ?? process.env;
  const databasePath = options.databasePath
    ? validatePlatformDatabasePath(options.databasePath, {
        environment,
        forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
      })
    : resolvePlatformDatabaseConfig({
        environment,
        forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
      }).databasePath;
  const walPath = `${databasePath}-wal`;
  requireNoPendingWal(walPath);
  const initialDatabaseFileSizeBytes = statSync(databasePath).size;
  const initialDatabaseFileSha256 = sha256Bytes(readFileSync(databasePath));
  const vault = resolveJournalEvidenceVaultBoundary({
    sourcePath: options.sourcePath,
    databasePath,
    environment,
    additionalForbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
    protectedStorageRoots: options.protectedStorageRoots,
  });
  let database: Database.Database | null = null;
  try {
    database = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
      timeout: 5_000,
    });
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");
    database.pragma("query_only = ON");
    const migration = requireExactMigrationBoundary(database);
    const owner = deriveDevelopmentOwnerJournalScope(database);
    const accountScope = narrowWorkspaceAccessToAccount(
      owner.scope,
      owner.accountId,
    );
    const identityRows = new JournalAccountRepository(database)
      .listNonSupersededSourceIdentities(owner.scope.workspaceId, "ibkr");
    if (
      identityRows.length !== 1 ||
      !identityRows[0] ||
      identityRows[0].accountId !== owner.accountId
    ) {
      integrityFailure("prepared_ibkr_identity_cardinality");
    }
    const sourceIdentity = identityRows[0];
    const brokerImports = database.prepare<[string, string], {
      import_batch_id: string;
      source_identity_id: string;
      source_file_sha256: string;
      source_file_size_bytes: number;
      evidence_object_key: string;
      current_state: string;
      adapter_id: string;
      adapter_version: string;
      parser_version: string;
      mapping_version: string;
      mapping_contract_json: string;
      statement_period_start_date: string | null;
      statement_period_end_date: string | null;
      source_timezone: string | null;
    }>(`SELECT import_batch_id, source_identity_id, source_file_sha256,
       source_file_size_bytes, evidence_object_key, current_state,
       adapter_id, adapter_version, parser_version, mapping_version,
       mapping_contract_json, statement_period_start_date,
       statement_period_end_date, source_timezone
FROM journal_import_batches
WHERE workspace_id = ? AND account_id = ? AND source_kind = 'broker_statement'
ORDER BY import_batch_id`).all(owner.scope.workspaceId, owner.accountId);
    if (
      brokerImports.length !== 1 ||
      !brokerImports[0] ||
      brokerImports[0].import_batch_id !== options.expectedFirstImportBatchId ||
      brokerImports[0].source_identity_id !== sourceIdentity.sourceIdentityId ||
      brokerImports[0].source_file_sha256 !== options.expectedSourceFileSha256 ||
      brokerImports[0].source_file_size_bytes !== options.expectedSourceFileSizeBytes ||
      brokerImports[0].evidence_object_key !==
        `ibkr/${options.expectedSourceFileSha256}.csv` ||
      !["accepted", "accepted_with_decisions"].includes(brokerImports[0].current_state)
    ) {
      integrityFailure("broker_import_identity");
    }
    const brokerImport = brokerImports[0];
    requireVaultInventory(vault.rootPath, [brokerImport.evidence_object_key]);
    const sourceBytes = readVerifiedJournalEvidenceObject(vault, {
      evidenceObjectKey: brokerImport.evidence_object_key,
      sourceFileSha256: brokerImport.source_file_sha256,
      sourceFileSizeBytes: brokerImport.source_file_size_bytes,
    });
    const privatePreview = previewIbkrActivityStatement({
      sourceBytes,
      sourceTimezone: options.sourceTimezone,
    });
    verifyAcceptedDevelopmentOwnerSourceBaseline(privatePreview);
    if (
      brokerImport.adapter_id !== privatePreview.adapterId ||
      brokerImport.adapter_version !== privatePreview.adapterVersion ||
      brokerImport.parser_version !== privatePreview.parserVersion ||
      brokerImport.mapping_version !== privatePreview.mappingVersion ||
      brokerImport.mapping_contract_json !==
        JSON.stringify(privatePreview.mappingContract) ||
      brokerImport.statement_period_start_date !==
        privatePreview.statementPeriodStartDate ||
      brokerImport.statement_period_end_date !==
        privatePreview.statementPeriodEndDate ||
      brokerImport.source_timezone !== privatePreview.sourceTimezone
    ) {
      integrityFailure("stored_import_mapping_evidence");
    }
    const aggregatePreview = createPrivacySafeIbkrPreview(privatePreview);
    if (
      aggregatePreview.sourceFileSha256 !== options.expectedSourceFileSha256 ||
      aggregatePreview.sourceFileSizeBytes !== options.expectedSourceFileSizeBytes ||
      sha256Json(aggregatePreview) !== options.expectedAggregatePreviewSha256 ||
      aggregatePreview.preservedRowCount !==
        ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE.preservedRowCount ||
      aggregatePreview.mappedExecutionCount !==
        ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE.mappedExecutionCount ||
      aggregatePreview.mappedPositionFactCount !==
        ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE.mappedPositionFactCount ||
      aggregatePreview.rowsByClassification.mapped_position_fact !==
        ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE.mappedPositionSourceRowCount ||
      aggregatePreview.unsupportedRowCount !==
        ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE.unsupportedRowCount
    ) {
      integrityFailure("vault_source_parse_baseline");
    }
    const accountConfiguration = loadAccountIdentityConfiguration(
      environment,
      IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
      IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
    );
    const authority = requireAuthority(
      database,
      owner.scope.workspaceId,
      owner.accountId,
      accountConfiguration,
      environment,
    );
    requireEvidenceSourceAccountIdentity(
      database,
      owner.scope,
      owner.accountId,
      privatePreview.rawSourceAccountId,
      accountConfiguration,
    );
    requireStoredSourceRowsMatchPreview(
      database,
      owner.scope.workspaceId,
      owner.accountId,
      brokerImport.import_batch_id,
      privatePreview,
    );
    requireStoredPositionFactsMatchPreview(
      database,
      owner.scope.workspaceId,
      owner.accountId,
      brokerImport.import_batch_id,
      privatePreview,
    );
    requireStoredExecutionsMatchPreview(
      database,
      owner.scope.workspaceId,
      owner.accountId,
      brokerImport.import_batch_id,
      privatePreview,
      environment,
    );
    requireScopeIsolation(database, owner.scope.workspaceId, owner.accountId);
    requireAppendOnlyRelationships(database, owner.scope.workspaceId, owner.accountId);
    requireAllocationConservation(database, owner.scope.workspaceId, owner.accountId);
    requireTradingDayRelationships(database, owner.scope.workspaceId, owner.accountId);
    const rebuildVerification = new JournalRoundTripService(
      new JournalRoundTripRepository(database),
    ).verifyAccountRebuildsCurrent(accountScope);
    const coverage = new JournalIntegrityReadRepository(database)
      .coverageSummary(accountScope);
    const readyClosed = coverage.roundTrips.byProjectionState.ready_closed ?? 0;
    const legitimateOpen = coverage.roundTrips.byProjectionState.legitimate_open ?? 0;
    const needsDecision = coverage.roundTrips.byProjectionState.needs_decision ?? 0;
    if (
      coverage.imports.total !== 1 ||
      coverage.sourceRecords.total !== 2_284 ||
      (coverage.sourceRecords.byClassification.mapped_execution ?? 0) !== 1_072 ||
      (coverage.sourceRecords.byClassification.mapped_position_fact ?? 0) !== 116 ||
      coverage.positionFacts.currentTotal !== 231 ||
      coverage.unsupportedSourceRecords.total !== 542 ||
      coverage.executions.total !== 1_072 ||
      readyClosed !== 331 ||
      legitimateOpen !== 0 ||
      needsDecision !== 2 ||
      coverage.roundTrips.activeTotal !== 333 ||
      rebuildVerification.verifiedChainCount !==
        coverage.roundTrips.affectedChainCount + coverage.roundTrips.unaffectedChainCount
    ) {
      integrityFailure("accepted_post_import_counts");
    }
    const result = Object.freeze({
      status: "journal_integrity_verified" as const,
      identifiersRedacted: true as const,
      migrationCount: 6 as const,
      migrationRows: migration.migrationRows,
      schemaSha256: migration.schemaSha256,
      databaseFileSha256: initialDatabaseFileSha256,
      databaseFileSizeBytes: initialDatabaseFileSizeBytes,
      workspaceId: owner.scope.workspaceId,
      accountId: owner.accountId,
      sourceIdentityId: sourceIdentity.sourceIdentityId,
      importBatchId: brokerImport.import_batch_id,
      evidence: Object.freeze({
        sourceFileSha256: brokerImport.source_file_sha256,
        sourceFileSizeBytes: brokerImport.source_file_size_bytes,
        aggregatePreviewSha256: options.expectedAggregatePreviewSha256,
        evidenceObjectKey: brokerImport.evidence_object_key,
      }),
      authority,
      counts: Object.freeze({
        sourceRows: coverage.sourceRecords.total,
        mappedExecutions: coverage.sourceRecords.byClassification.mapped_execution ?? 0,
        mappedPositionSourceRows:
          coverage.sourceRecords.byClassification.mapped_position_fact ?? 0,
        currentPositionFacts: coverage.positionFacts.currentTotal,
        unsupportedRows: coverage.unsupportedSourceRecords.total,
        executions: coverage.executions.total,
        decisions: coverage.decisions.total,
        activeRoundTrips: coverage.roundTrips.activeTotal,
        readyClosedRoundTrips: readyClosed,
        legitimateOpenRoundTrips: legitimateOpen,
        needsDecisionRoundTrips: needsDecision,
        latestRebuildChains: rebuildVerification.verifiedChainCount,
        affectedChains: coverage.roundTrips.affectedChainCount,
        unaffectedChains: coverage.roundTrips.unaffectedChainCount,
      }),
      integrity: Object.freeze({
        foreignKeys: "ok" as const,
        quickCheck: "ok" as const,
        integrityCheck: "ok" as const,
        relationships: "ok" as const,
        allocationConservation: "ok" as const,
        rebuildFreshness: "ok" as const,
        idempotencyEvidence: "ok" as const,
        evidenceVault: "ok" as const,
        sidecars: "no_pending_wal" as const,
      }),
    });
    database.close();
    database = null;
    requireNoPendingWal(walPath);
    if (
      statSync(databasePath).size !== initialDatabaseFileSizeBytes ||
      sha256Bytes(readFileSync(databasePath)) !== initialDatabaseFileSha256
    ) {
      integrityFailure("database_changed_during_verification");
    }
    return result;
  } catch (error) {
    if (isTraderLinkPlatformError(error)) throw error;
    platformFailure(
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      { check: "unexpected_verifier_failure" },
      error,
    );
  } finally {
    database?.close();
  }
}

export function verifyTraderLinkPlatformJournalIntegrity(
  options: TraderLinkJournalIntegrityVerificationOptions,
): TraderLinkJournalIntegrityVerificationResult {
  try {
    return verifyTraderLinkPlatformJournalIntegrityInternal(options);
  } catch (error) {
    if (isTraderLinkPlatformError(error)) throw error;
    platformFailure(
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      { check: "unexpected_verifier_boundary_failure" },
      error,
    );
  }
}
