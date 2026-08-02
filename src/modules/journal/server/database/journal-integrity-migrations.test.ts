import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  currentPlatformDomainTableNames,
  platformMigrationManifest,
} from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function id(sequence: number): string {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function digest(character: string): string {
  return character.repeat(64);
}

const timestamp = "2026-08-01T12:00:00.000Z";
const userId = id(1);
const workspaceId = id(2);
const accountId = id(3);
const sourceIdentityId = id(4);
const instrumentId = id(5);
const importBatchId = id(10);
const importEventId = id(11);

function setupDatabase(): Database.Database {
  const root = mkdtempSync(join(tmpdir(), "traderlink-journal-schema-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "journal.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, {
    now: () => new Date(timestamp),
  });
  return database;
}

function seedOwnership(database: Database.Database): void {
  database
    .prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'test', 'owner', 'Owner', 'active', ?, ?)`)
    .run(userId, timestamp, timestamp);
  database
    .prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'Workspace', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, timestamp, timestamp);
  database
    .prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, timestamp, timestamp);
  database
    .prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Journal', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, timestamp, timestamp);
  database
    .prepare(`INSERT INTO journal_account_source_identities (
  source_identity_id, workspace_id, account_id, source_system,
  fingerprint_scheme_version, source_account_canonicalization_version,
  hmac_key_version, source_account_fingerprint, privacy_safe_display,
  status, first_seen_at_utc, last_seen_at_utc
) VALUES (?, ?, ?, 'ibkr', 'hmac-sha256-v1', 'ibkr-account-v1',
  'local-key-v1', ?, 'Broker account', 'active_current', ?, ?)`)
    .run(sourceIdentityId, workspaceId, accountId, digest("a"), timestamp, timestamp);
  database
    .prepare(`INSERT INTO journal_instruments (
  instrument_id, workspace_id, asset_class, normalized_symbol, quote_currency,
  venue, identity_scheme_version, provider_identity_sha256, status,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'stock', 'TEST', 'USD', NULL, NULL, NULL, 'active', ?, ?)`)
    .run(instrumentId, workspaceId, timestamp, timestamp);
}

function insertSourceRow(
  database: Database.Database,
  options: Readonly<{
    sequence: number;
    ordinal: number;
    identityCharacter: string;
    rawCharacter: string;
    contentCharacter: string;
    occurrence: number;
    classification: string;
    fields: readonly string[];
  }>,
): string {
  const sourceRowId = id(options.sequence);
  database
    .prepare(`INSERT INTO journal_source_rows (
  source_row_id, workspace_id, account_id, import_batch_id, record_ordinal,
  source_record_identity_sha256, raw_record_sha256, raw_fields_json,
  section_name, record_type, asset_category, content_fingerprint_sha256,
  occurrence_ordinal, initial_classification, mapping_version, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Trades', 'Data', 'Stocks', ?, ?, ?, 'ibkr-mapping-v1', ?)`)
    .run(
      sourceRowId,
      workspaceId,
      accountId,
      importBatchId,
      options.ordinal,
      digest(options.identityCharacter),
      digest(options.rawCharacter),
      JSON.stringify(options.fields),
      digest(options.contentCharacter),
      options.occurrence,
      options.classification,
      timestamp,
    );
  return sourceRowId;
}

function seedJournalGraph(database: Database.Database): void {
  const sourceRows = [id(20), id(21), id(22), id(23), id(24), id(25)];
  const sourceIssueId = id(30);
  const coverageIntervalId = id(31);
  const openingFactId = id(32);
  const closingFactId = id(33);
  const executionIds = [id(40), id(41)];
  const executionVersionIds = [id(42), id(43)];
  const decisionId = id(50);
  const decisionEventIds = [id(51), id(52)];
  const rebuildId = id(60);
  const roundTripId = id(61);
  const roundTripVersionId = id(62);

  database.transaction(() => {
    database
      .prepare(`INSERT INTO journal_import_batches (
  import_batch_id, workspace_id, account_id, source_identity_id, source_kind,
  source_system, source_file_sha256, source_file_size_bytes, source_mime_type,
  source_encoding, source_display_label, evidence_object_key,
  manual_idempotency_key, adapter_id, adapter_version, parser_version,
  mapping_version, mapping_contract_json, statement_period_start_date,
  statement_period_end_date, source_timezone, current_state, current_event_id,
  preserved_row_count, mapped_execution_count, unsupported_row_count,
  issue_count, pending_decision_count, created_by_user_id, created_at_utc,
  updated_at_utc, accepted_at_utc
) VALUES (
  ?, ?, ?, ?, 'broker_statement', 'ibkr', ?, 100, 'text/csv', 'utf-8',
  'Statement', 'sha256/aa/statement.csv', NULL, 'ibkr_activity',
  'ibkr-activity-v1', 'csv-parser-v1', 'ibkr-mapping-v1', ?,
  '2026-01-01', '2026-01-31', 'America/New_York', 'accepted', ?,
  6, 2, 0, 1, 0, ?, ?, ?, ?
)`)
      .run(
        importBatchId,
        workspaceId,
        accountId,
        sourceIdentityId,
        digest("b"),
        JSON.stringify({ contractVersion: "ibkr_mapping_v1" }),
        importEventId,
        userId,
        timestamp,
        timestamp,
        timestamp,
      );
    database
      .prepare(`INSERT INTO journal_import_events (
  import_event_id, workspace_id, account_id, import_batch_id, event_sequence,
  event_type, actor_kind, actor_user_id, prior_state, new_state, reason_code,
  occurred_at_utc
) VALUES (?, ?, ?, ?, 1, 'accepted', 'user', ?, 'preview', 'accepted',
  'accepted_after_preview', ?)`)
      .run(importEventId, workspaceId, accountId, importBatchId, userId, timestamp);

    insertSourceRow(database, {
      sequence: 20,
      ordinal: 1,
      identityCharacter: "c",
      rawCharacter: "d",
      contentCharacter: "e",
      occurrence: 1,
      classification: "mapped_execution",
      fields: ["buy", "10"],
    });
    insertSourceRow(database, {
      sequence: 21,
      ordinal: 2,
      identityCharacter: "f",
      rawCharacter: "1",
      contentCharacter: "2",
      occurrence: 1,
      classification: "mapped_execution",
      fields: ["sell", "10"],
    });
    insertSourceRow(database, {
      sequence: 22,
      ordinal: 3,
      identityCharacter: "3",
      rawCharacter: "4",
      contentCharacter: "5",
      occurrence: 1,
      classification: "mapped_position_fact",
      fields: ["opening", "0"],
    });
    insertSourceRow(database, {
      sequence: 23,
      ordinal: 4,
      identityCharacter: "6",
      rawCharacter: "7",
      contentCharacter: "8",
      occurrence: 1,
      classification: "mapped_position_fact",
      fields: ["closing", "0"],
    });
    insertSourceRow(database, {
      sequence: 24,
      ordinal: 5,
      identityCharacter: "9",
      rawCharacter: "a",
      contentCharacter: "b",
      occurrence: 1,
      classification: "automatic_non_execution",
      fields: ["duplicate evidence"],
    });
    insertSourceRow(database, {
      sequence: 25,
      ordinal: 6,
      identityCharacter: "0",
      rawCharacter: "a",
      contentCharacter: "b",
      occurrence: 2,
      classification: "automatic_non_execution",
      fields: ["duplicate evidence"],
    });

    database
      .prepare(`INSERT INTO journal_source_row_issues (
  source_issue_id, workspace_id, account_id, import_batch_id, source_row_id,
  issue_scope, issue_code, severity, is_blocking, detector_id,
  detector_version, created_at_utc
) VALUES (?, ?, ?, ?, ?, 'row', 'duplicate_occurrence_reviewed', 'info', 0,
  'source_overlap', 'source-overlap-v1', ?)`)
      .run(sourceIssueId, workspaceId, accountId, importBatchId, sourceRows[4], timestamp);
    database
      .prepare(`INSERT INTO journal_source_coverage_intervals (
  coverage_interval_id, workspace_id, account_id, import_batch_id, asset_class,
  coverage_kind, local_start_date, local_end_date, source_timezone,
  start_at_utc, end_at_utc, assertion_version, created_at_utc
) VALUES (?, ?, ?, ?, 'stock', 'complete', '2026-01-01', '2026-01-31',
  'America/New_York', NULL, NULL, 'ibkr-statement-v1', ?)`)
      .run(coverageIntervalId, workspaceId, accountId, importBatchId, timestamp);
    for (const [positionFactId, sourceRowId, kind, date, precision] of [
      [openingFactId, sourceRows[2], "opening_balance", "2026-01-01", "day_start"],
      [closingFactId, sourceRows[3], "closing_balance", "2026-01-31", "day_end"],
    ] as const) {
      database
        .prepare(`INSERT INTO journal_position_facts (
  position_fact_id, workspace_id, account_id, import_batch_id, source_row_id,
  instrument_id, currency, fact_kind, effective_local_date, time_precision,
  source_time_text, source_timezone, effective_at_utc, quantity_decimal,
  fact_source, fact_version, supersedes_position_fact_id, actor_user_id,
  created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, ?, ?, NULL, 'America/New_York',
  NULL, '0', 'statement', 'ibkr-position-v1', NULL, NULL, ?)`)
        .run(
          positionFactId,
          workspaceId,
          accountId,
          importBatchId,
          sourceRowId,
          instrumentId,
          kind,
          date,
          precision,
          timestamp,
        );
    }

    for (const [index, side, price, executedAt, sourceRowId] of [
      [0, "buy", "10", "2026-01-05T14:30:00.000Z", sourceRows[0]],
      [1, "sell", "11", "2026-01-05T15:00:00.000Z", sourceRows[1]],
    ] as const) {
      database
        .prepare(`INSERT INTO journal_executions (
  execution_id, workspace_id, account_id, current_version_id, current_state,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'accepted', ?, ?)`)
        .run(
          executionIds[index],
          workspaceId,
          accountId,
          executionVersionIds[index],
          timestamp,
          timestamp,
        );
      database
        .prepare(`INSERT INTO journal_execution_versions (
  execution_version_id, workspace_id, account_id, execution_id,
  version_number, instrument_id, trade_currency, source_timestamp_text,
  source_timezone, time_parser_version, executed_at_utc, source_order_key,
  side, quantity_decimal, price_decimal, fees_decimal, fee_currency,
  fee_sign_convention, fact_completeness, actor_kind, actor_user_id,
  change_reason_code, created_at_utc
) VALUES (?, ?, ?, ?, 1, ?, 'USD', ?, 'America/New_York',
  'ibkr-time-v1', ?, ?, ?, '10', ?, NULL, NULL, 'not_reported', 'complete',
  'system', NULL, 'source_import', ?)`)
        .run(
          executionVersionIds[index],
          workspaceId,
          accountId,
          executionIds[index],
          instrumentId,
          executedAt,
          executedAt,
          `${executedAt}|${String(index + 1).padStart(6, "0")}`,
          side,
          price,
          timestamp,
        );
      database
        .prepare(`INSERT INTO journal_execution_provenance (
  execution_provenance_id, workspace_id, account_id, execution_id,
  execution_version_id, import_batch_id, source_row_id, provenance_kind,
  provider_identity_scheme_version, provider_identity_sha256, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'broker', 'ibkr-fill-v1', ?, ?)`)
        .run(
          id(44 + index),
          workspaceId,
          accountId,
          executionIds[index],
          executionVersionIds[index],
          importBatchId,
          sourceRowId,
          digest(index === 0 ? "d" : "e"),
          timestamp,
        );
      database
        .prepare(`INSERT INTO journal_execution_identity_aliases (
  execution_alias_id, workspace_id, account_id, execution_id, alias_type,
  alias_scheme_version, alias_sha256, occurrence_ordinal, status,
  superseded_by_alias_id, first_seen_at_utc, last_seen_at_utc
) VALUES (?, ?, ?, ?, 'broker_fill', 'ibkr-fill-v1', ?, NULL, 'active',
  NULL, ?, ?)`)
        .run(
          id(46 + index),
          workspaceId,
          accountId,
          executionIds[index],
          digest(index === 0 ? "f" : "1"),
          timestamp,
          timestamp,
        );
    }

    database
      .prepare(`INSERT INTO journal_data_decisions (
  decision_id, workspace_id, account_id, issue_code, state, target_kind,
  source_issue_id, execution_id, position_fact_id, overlap_key_sha256,
  chain_key_sha256, effect_code, revision, current_event_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'duplicate_occurrence_reviewed', 'resolved', 'source_issue',
  ?, NULL, NULL, NULL, NULL, 'kept_distinct', 2, ?, ?, ?)`)
      .run(
        decisionId,
        workspaceId,
        accountId,
        sourceIssueId,
        decisionEventIds[1],
        timestamp,
        timestamp,
      );
    database
      .prepare(`INSERT INTO journal_data_decision_events (
  decision_event_id, workspace_id, account_id, decision_id, event_sequence,
  action, actor_kind, actor_user_id, reason_code, reason_text,
  prior_execution_version_id, resulting_execution_version_id,
  prior_position_fact_id, resulting_position_fact_id,
  counterpart_execution_id, resulting_state, occurred_at_utc
) VALUES (?, ?, ?, ?, 1, 'opened', 'system', NULL, 'duplicate_detected', NULL,
  NULL, NULL, NULL, NULL, NULL, 'pending', ?)`)
      .run(decisionEventIds[0], workspaceId, accountId, decisionId, timestamp);
    database
      .prepare(`INSERT INTO journal_data_decision_events (
  decision_event_id, workspace_id, account_id, decision_id, event_sequence,
  action, actor_kind, actor_user_id, reason_code, reason_text,
  prior_execution_version_id, resulting_execution_version_id,
  prior_position_fact_id, resulting_position_fact_id,
  counterpart_execution_id, resulting_state, occurred_at_utc
) VALUES (?, ?, ?, ?, 2, 'keep_distinct', 'user', ?, 'statement_confirms_both', NULL,
  NULL, NULL, NULL, NULL, NULL, 'resolved', ?)`)
      .run(decisionEventIds[1], workspaceId, accountId, decisionId, userId, timestamp);

    database
      .prepare(`INSERT INTO journal_chain_rebuilds (
  rebuild_id, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, trigger_kind, trigger_import_event_id,
  trigger_decision_event_id, maintenance_reason_code, previous_rebuild_id,
  algorithm_version, ordered_input_sha256, output_sha256, coverage_state,
  ready_closed_count, legitimate_open_count, needs_decision_count,
  excluded_count, first_execution_at_utc, last_execution_at_utc,
  completed_at_utc
) VALUES (?, ?, ?, ?, 'USD', ?, 'import_event', ?, NULL, NULL, NULL,
  'zero-to-zero-v1', ?, ?, 'complete', 1, 0, 0, 0,
  '2026-01-05T14:30:00.000Z', '2026-01-05T15:00:00.000Z', ?)`)
      .run(
        rebuildId,
        workspaceId,
        accountId,
        instrumentId,
        digest("2"),
        importEventId,
        digest("3"),
        digest("4"),
        timestamp,
      );
    database
      .prepare(`INSERT INTO journal_round_trips (
  round_trip_id, workspace_id, account_id, current_version_id,
  lifecycle_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', ?, ?)`)
      .run(
        roundTripId,
        workspaceId,
        accountId,
        roundTripVersionId,
        timestamp,
        timestamp,
      );
    database
      .prepare(`INSERT INTO journal_round_trip_versions (
  round_trip_version_id, workspace_id, account_id, round_trip_id,
  version_number, rebuild_id, instrument_id, trade_currency,
  chain_key_sha256, direction, opened_at_utc, closed_at_utc,
  final_position_decimal, projection_state, coverage_reason_code,
  projection_fingerprint_sha256, created_at_utc
) VALUES (?, ?, ?, ?, 1, ?, ?, 'USD', ?, 'long',
  '2026-01-05T14:30:00.000Z', '2026-01-05T15:00:00.000Z',
  '0', 'ready_closed', NULL, ?, ?)`)
      .run(
        roundTripVersionId,
        workspaceId,
        accountId,
        roundTripId,
        rebuildId,
        instrumentId,
        digest("2"),
        digest("5"),
        timestamp,
      );
    for (const [sequence, executionVersionId, role] of [
      [1, executionVersionIds[0], "opening"],
      [2, executionVersionIds[1], "closing"],
    ] as const) {
      database
        .prepare(`INSERT INTO journal_round_trip_execution_allocations (
  allocation_id, workspace_id, account_id, round_trip_version_id,
  execution_version_id, allocation_sequence, allocation_role,
  quantity_decimal, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, '10', ?)`)
        .run(
          id(62 + sequence),
          workspaceId,
          accountId,
          roundTripVersionId,
          executionVersionId,
          sequence,
          role,
          timestamp,
        );
    }
    database
      .prepare(`INSERT INTO journal_round_trip_identity_aliases (
  round_trip_alias_id, workspace_id, account_id, round_trip_id,
  alias_scheme_version, alias_key_sha256, status, superseded_by_alias_id,
  created_at_utc
) VALUES (?, ?, ?, ?, 'round-trip-v1', ?, 'active', NULL, ?)`)
      .run(id(65), workspaceId, accountId, roundTripId, digest("6"), timestamp);
    database
      .prepare(`INSERT INTO journal_trading_days (
  trading_day_id, workspace_id, account_id, trading_date, trading_timezone,
  status, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, '2026-01-05', 'America/New_York', 'active', ?, ?)`)
      .run(id(66), workspaceId, accountId, timestamp, timestamp);
  }).immediate();
}

describe("Phase 3 Journal integrity migrations", () => {
  it("creates the current schema and accepts one fully scoped evidence graph", () => {
    const database = setupDatabase();
    try {
      seedOwnership(database);
      seedJournalGraph(database);
      expect(database.pragma("foreign_key_check")).toEqual([]);
      expect(
        database.prepare("SELECT COUNT(*) AS count FROM platform_schema_migrations").get(),
      ).toEqual({ count: platformMigrationManifest.length });
      expect(currentPlatformDomainTableNames).toContain("journal_trading_days");
      expect(
        database.prepare("SELECT COUNT(*) AS count FROM journal_source_rows").get(),
      ).toEqual({ count: 6 });
      expect(
        database
          .prepare(`SELECT COUNT(*) AS count FROM journal_source_rows
WHERE raw_record_sha256 = ? AND content_fingerprint_sha256 = ?`)
          .get(digest("a"), digest("b")),
      ).toEqual({ count: 2 });
      expect(
        database.prepare("SELECT COUNT(*) AS count FROM journal_executions").get(),
      ).toEqual({ count: 2 });
      expect(
        database.prepare("SELECT COUNT(*) AS count FROM journal_round_trips").get(),
      ).toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  it("enforces canonical decimals and occurrence-distinct source identity", () => {
    const database = setupDatabase();
    try {
      seedOwnership(database);
      seedJournalGraph(database);
      expect(() =>
        database
          .prepare(`UPDATE journal_position_facts SET quantity_decimal = '1.0'
WHERE position_fact_id = ?`)
          .run(id(32)),
      ).toThrow();
      expect(() =>
        database
          .prepare(`UPDATE journal_source_rows
SET source_record_identity_sha256 = ? WHERE source_row_id = ?`)
          .run(digest("9"), id(25)),
      ).toThrow();
    } finally {
      database.close();
    }
  });

  it("keeps the accepted Phase 2 foundation list immutable", () => {
    expect(platformMigrationManifest.slice(0, 2).map((migration) => migration.migrationId)).toEqual([
      "0001_platform_identity",
      "0002_journal_account_boundary",
    ]);
  });
});
