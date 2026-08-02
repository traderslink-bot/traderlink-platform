import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import type { JournalAnalyticsFactSetRequest } from "../../contracts/journal-analytics-fact-set";
import { JournalAnalyticsFactSetRepository } from "./journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "./journal-analytics-fact-set-service";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function id(sequence: number): string {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function chainKey(
  workspaceId: string,
  accountId: string,
  instrumentId: string,
  currency: string,
): string {
  return digest(JSON.stringify([
    "journal-chain-v1",
    workspaceId,
    accountId,
    instrumentId,
    currency,
  ]));
}

const timestamp = "2026-08-01T12:00:00.000Z";
const generatedAt = "2026-08-01T18:00:00.000Z";

const ids = Object.freeze({
  user: id(1),
  workspace: id(2),
  account: id(3),
  sourceIdentity: id(4),
  importBatch: id(5),
  importEvent: id(6),
  closedInstrument: id(10),
  openInstrument: id(11),
  decisionInstrument: id(12),
  closedBuyExecution: id(20),
  closedBuyVersion: id(21),
  closedSellExecution: id(22),
  closedSellVersion: id(23),
  openExecution: id(24),
  openVersion: id(25),
  decisionExecution: id(26),
  decisionVersion: id(27),
  closedRebuild: id(30),
  openRebuild: id(31),
  decisionRebuild: id(32),
  closedRoundTrip: id(40),
  closedRoundTripVersion: id(41),
  openRoundTrip: id(42),
  openRoundTripVersion: id(43),
  decisionRoundTrip: id(44),
  decisionRoundTripVersion: id(45),
  closedBuyAllocation: id(50),
  closedSellAllocation: id(51),
  openAllocation: id(52),
  decisionAllocation: id(53),
  decision: id(60),
  decisionEvent: id(61),
  coverage: id(70),
});

const allRequest: JournalAnalyticsFactSetRequest = Object.freeze({
  accountIds: Object.freeze([ids.account]),
  closingDateRange: Object.freeze({ kind: "all_available" }),
  currencySelection: Object.freeze({ kind: "all_partitions" }),
});

function setupDatabase(): Database.Database {
  const root = mkdtempSync(join(tmpdir(), "traderlink-analytics-facts-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "analytics.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date(timestamp) });
  seedGraph(database);
  return database;
}

function scope(
  overrides: Partial<WorkspaceAccessScope> = {},
): WorkspaceAccessScope {
  return Object.freeze({
    userId: ids.user,
    workspaceId: ids.workspace,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([ids.account]),
    activeAccountId: ids.account,
    ...overrides,
  });
}

function insertSourceRow(
  database: Database.Database,
  sequence: number,
): string {
  const sourceRowId = id(100 + sequence);
  database.prepare(`INSERT INTO journal_source_rows (
  source_row_id, workspace_id, account_id, import_batch_id, record_ordinal,
  source_record_identity_sha256, raw_record_sha256, raw_fields_json,
  section_name, record_type, asset_category, content_fingerprint_sha256,
  occurrence_ordinal, initial_classification, mapping_version, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, '["synthetic"]', 'Trades', 'Data',
  'Stocks', ?, 1, 'mapped_execution', 'test-mapping-v1', ?)`)
    .run(
      sourceRowId,
      ids.workspace,
      ids.account,
      ids.importBatch,
      sequence,
      digest(`identity-${sequence}`),
      digest(`raw-${sequence}`),
      digest(`content-${sequence}`),
      timestamp,
    );
  return sourceRowId;
}

function insertExecution(
  database: Database.Database,
  input: Readonly<{
    sequence: number;
    executionId: string;
    executionVersionId: string;
    instrumentId: string;
    side: "buy" | "sell";
    quantity: string;
    price: string;
    fees: string | null;
    atUtc: string;
    state?: "accepted" | "needs_decision";
  }>,
): string {
  const sourceRowId = insertSourceRow(database, input.sequence);
  database.prepare(`INSERT INTO journal_executions (
  execution_id, workspace_id, account_id, current_version_id, current_state,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(
      input.executionId,
      ids.workspace,
      ids.account,
      input.executionVersionId,
      input.state ?? "accepted",
      timestamp,
      timestamp,
    );
  database.prepare(`INSERT INTO journal_execution_versions (
  execution_version_id, workspace_id, account_id, execution_id,
  version_number, instrument_id, trade_currency, source_timestamp_text,
  source_timezone, time_parser_version, executed_at_utc, source_order_key,
  side, quantity_decimal, price_decimal, fees_decimal, fee_currency,
  fee_sign_convention, fact_completeness, actor_kind, actor_user_id,
  change_reason_code, created_at_utc
) VALUES (?, ?, ?, ?, 1, ?, 'USD', ?, 'America/New_York', 'test-time-v1',
  ?, ?, ?, ?, ?, ?, ?, ?, 'complete', 'system', NULL, 'test_seed', ?)`)
    .run(
      input.executionVersionId,
      ids.workspace,
      ids.account,
      input.executionId,
      input.instrumentId,
      input.atUtc,
      input.atUtc,
      `${input.atUtc}|${String(input.sequence).padStart(6, "0")}`,
      input.side,
      input.quantity,
      input.price,
      input.fees,
      input.fees === null ? null : "USD",
      input.fees === null ? "not_reported" : "broker_reported_signed",
      timestamp,
    );
  database.prepare(`INSERT INTO journal_execution_provenance (
  execution_provenance_id, workspace_id, account_id, execution_id,
  execution_version_id, import_batch_id, source_row_id, provenance_kind,
  provider_identity_scheme_version, provider_identity_sha256, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'broker', NULL, NULL, ?)`)
    .run(
      id(200 + input.sequence),
      ids.workspace,
      ids.account,
      input.executionId,
      input.executionVersionId,
      ids.importBatch,
      sourceRowId,
      timestamp,
    );
  return sourceRowId;
}

function insertRebuildAndRoundTrip(
  database: Database.Database,
  input: Readonly<{
    rebuildId: string;
    roundTripId: string;
    roundTripVersionId: string;
    instrumentId: string;
    direction: "long" | "short";
    openedAtUtc: string;
    closedAtUtc: string | null;
    finalPosition: string;
    state: "ready_closed" | "legitimate_open" | "needs_decision";
    reason: string | null;
    allocations: readonly Readonly<{
      allocationId: string;
      executionVersionId: string;
      role:
        | "opening"
        | "adding"
        | "reducing"
        | "closing"
        | "flip_closing"
        | "flip_opening";
      quantity: string;
    }>[];
  }>,
): void {
  const currentChainKey = chainKey(
    ids.workspace,
    ids.account,
    input.instrumentId,
    "USD",
  );
  const readyCount = input.state === "ready_closed" ? 1 : 0;
  const openCount = input.state === "legitimate_open" ? 1 : 0;
  const decisionCount = input.state === "needs_decision" ? 1 : 0;
  database.prepare(`INSERT INTO journal_chain_rebuilds (
  rebuild_id, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, trigger_kind, trigger_import_event_id,
  trigger_decision_event_id, maintenance_reason_code, previous_rebuild_id,
  algorithm_version, ordered_input_sha256, output_sha256, coverage_state,
  ready_closed_count, legitimate_open_count, needs_decision_count,
  excluded_count, first_execution_at_utc, last_execution_at_utc,
  completed_at_utc
) VALUES (?, ?, ?, ?, 'USD', ?, 'import_event', ?, NULL, NULL, NULL,
  'journal-round-trip-v1', ?, ?, 'complete', ?, ?, ?, 0, ?, ?, ?)`)
    .run(
      input.rebuildId,
      ids.workspace,
      ids.account,
      input.instrumentId,
      currentChainKey,
      ids.importEvent,
      digest(`input-${input.rebuildId}`),
      digest(`output-${input.rebuildId}`),
      readyCount,
      openCount,
      decisionCount,
      input.openedAtUtc,
      input.closedAtUtc ?? input.openedAtUtc,
      timestamp,
    );
  database.prepare(`INSERT INTO journal_round_trips (
  round_trip_id, workspace_id, account_id, current_version_id,
  lifecycle_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', ?, ?)`)
    .run(
      input.roundTripId,
      ids.workspace,
      ids.account,
      input.roundTripVersionId,
      timestamp,
      timestamp,
    );
  database.prepare(`INSERT INTO journal_round_trip_versions (
  round_trip_version_id, workspace_id, account_id, round_trip_id,
  version_number, rebuild_id, instrument_id, trade_currency, chain_key_sha256,
  direction, opened_at_utc, closed_at_utc, final_position_decimal,
  projection_state, coverage_reason_code, projection_fingerprint_sha256,
  created_at_utc
) VALUES (?, ?, ?, ?, 1, ?, ?, 'USD', ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      input.roundTripVersionId,
      ids.workspace,
      ids.account,
      input.roundTripId,
      input.rebuildId,
      input.instrumentId,
      currentChainKey,
      input.direction,
      input.openedAtUtc,
      input.closedAtUtc,
      input.finalPosition,
      input.state,
      input.reason,
      digest(`projection-${input.roundTripId}`),
      timestamp,
    );
  input.allocations.forEach((allocation, index) => {
    database.prepare(`INSERT INTO journal_round_trip_execution_allocations (
  allocation_id, workspace_id, account_id, round_trip_version_id,
  execution_version_id, allocation_sequence, allocation_role,
  quantity_decimal, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        allocation.allocationId,
        ids.workspace,
        ids.account,
        input.roundTripVersionId,
        allocation.executionVersionId,
        index + 1,
        allocation.role,
        allocation.quantity,
        timestamp,
      );
  });
}

function seedGraph(database: Database.Database): void {
  database.transaction(() => {
    database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'test', 'owner', 'Owner', 'active', ?, ?)`)
      .run(ids.user, timestamp, timestamp);
    database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'Workspace', 'America/New_York', 'active', ?, ?)`)
      .run(ids.workspace, timestamp, timestamp);
    database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
      .run(ids.workspace, ids.user, ids.user, timestamp, timestamp);
    database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Journal', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
      .run(ids.account, ids.workspace, ids.user, timestamp, timestamp);
    database.prepare(`INSERT INTO journal_account_source_identities (
  source_identity_id, workspace_id, account_id, source_system,
  fingerprint_scheme_version, source_account_canonicalization_version,
  hmac_key_version, source_account_fingerprint, privacy_safe_display,
  status, first_seen_at_utc, last_seen_at_utc
) VALUES (?, ?, ?, 'ibkr', 'hmac-sha256-v1', 'test-account-v1',
  'test-key-v1', ?, 'Broker account', 'active_current', ?, ?)`)
      .run(
        ids.sourceIdentity,
        ids.workspace,
        ids.account,
        digest("account"),
        timestamp,
        timestamp,
      );
    database.prepare(`INSERT INTO journal_import_batches (
  import_batch_id, workspace_id, account_id, source_identity_id, source_kind,
  source_system, source_file_sha256, source_file_size_bytes, source_mime_type,
  source_encoding, source_display_label, evidence_object_key,
  manual_idempotency_key, adapter_id, adapter_version, parser_version,
  mapping_version, mapping_contract_json, statement_period_start_date,
  statement_period_end_date, source_timezone, current_state, current_event_id,
  preserved_row_count, mapped_execution_count, unsupported_row_count,
  issue_count, pending_decision_count, created_by_user_id, created_at_utc,
  updated_at_utc, accepted_at_utc
) VALUES (?, ?, ?, ?, 'broker_statement', 'ibkr', ?, 100, 'text/csv',
  'utf-8', 'Statement', 'ibkr/evidence.csv', NULL, 'ibkr_activity',
  'ibkr-activity-v1', 'test-parser-v1', 'test-mapping-v1', '{}',
  '2026-01-01', '2026-01-31', 'America/New_York',
  'accepted_with_decisions', ?, 5, 4, 0, 0, 1, ?, ?, ?, ?)`)
      .run(
        ids.importBatch,
        ids.workspace,
        ids.account,
        ids.sourceIdentity,
        digest("statement"),
        ids.importEvent,
        ids.user,
        timestamp,
        timestamp,
        timestamp,
      );
    database.prepare(`INSERT INTO journal_import_events (
  import_event_id, workspace_id, account_id, import_batch_id, event_sequence,
  event_type, actor_kind, actor_user_id, prior_state, new_state, reason_code,
  occurred_at_utc
) VALUES (?, ?, ?, ?, 1, 'accepted_with_decisions', 'user', ?, 'preview',
  'accepted_with_decisions', 'test_accept', ?)`)
      .run(
        ids.importEvent,
        ids.workspace,
        ids.account,
        ids.importBatch,
        ids.user,
        timestamp,
      );
    for (const [instrumentId, symbol] of [
      [ids.closedInstrument, "CLOSED"],
      [ids.openInstrument, "OPEN"],
      [ids.decisionInstrument, "DECISION"],
    ] as const) {
      database.prepare(`INSERT INTO journal_instruments (
  instrument_id, workspace_id, asset_class, normalized_symbol, quote_currency,
  venue, identity_scheme_version, provider_identity_sha256, status,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'stock', ?, 'USD', NULL, NULL, NULL, 'active', ?, ?)`)
        .run(instrumentId, ids.workspace, symbol, timestamp, timestamp);
    }
    database.prepare(`INSERT INTO journal_source_coverage_intervals (
  coverage_interval_id, workspace_id, account_id, import_batch_id, asset_class,
  coverage_kind, local_start_date, local_end_date, source_timezone,
  start_at_utc, end_at_utc, assertion_version, created_at_utc
) VALUES (?, ?, ?, ?, 'stock', 'complete', '2026-01-01', '2026-01-31',
  'America/New_York', NULL, NULL, 'test-coverage-v1', ?)`)
      .run(
        ids.coverage,
        ids.workspace,
        ids.account,
        ids.importBatch,
        timestamp,
      );

    const closedBuySourceRow = insertExecution(database, {
      sequence: 1,
      executionId: ids.closedBuyExecution,
      executionVersionId: ids.closedBuyVersion,
      instrumentId: ids.closedInstrument,
      side: "buy",
      quantity: "10",
      price: "10",
      fees: "-1",
      atUtc: "2026-01-05T14:30:00.000Z",
    });
    insertExecution(database, {
      sequence: 2,
      executionId: ids.closedSellExecution,
      executionVersionId: ids.closedSellVersion,
      instrumentId: ids.closedInstrument,
      side: "sell",
      quantity: "10",
      price: "11",
      fees: "-1",
      atUtc: "2026-01-05T15:00:00.000Z",
    });
    insertExecution(database, {
      sequence: 3,
      executionId: ids.openExecution,
      executionVersionId: ids.openVersion,
      instrumentId: ids.openInstrument,
      side: "buy",
      quantity: "5",
      price: "20",
      fees: null,
      atUtc: "2026-01-06T15:00:00.000Z",
    });
    insertExecution(database, {
      sequence: 4,
      executionId: ids.decisionExecution,
      executionVersionId: ids.decisionVersion,
      instrumentId: ids.decisionInstrument,
      side: "buy",
      quantity: "2",
      price: "5",
      fees: "-0.5",
      atUtc: "2026-01-07T15:00:00.000Z",
      state: "needs_decision",
    });
    const duplicateProvenanceSourceRow = insertSourceRow(database, 5);
    database.prepare(`INSERT INTO journal_execution_provenance (
  execution_provenance_id, workspace_id, account_id, execution_id,
  execution_version_id, import_batch_id, source_row_id, provenance_kind,
  provider_identity_scheme_version, provider_identity_sha256, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'broker', NULL, NULL, ?)`)
      .run(
        id(250),
        ids.workspace,
        ids.account,
        ids.closedBuyExecution,
        ids.closedBuyVersion,
        ids.importBatch,
        duplicateProvenanceSourceRow,
        timestamp,
      );
    expect(closedBuySourceRow).not.toBe(duplicateProvenanceSourceRow);

    insertRebuildAndRoundTrip(database, {
      rebuildId: ids.closedRebuild,
      roundTripId: ids.closedRoundTrip,
      roundTripVersionId: ids.closedRoundTripVersion,
      instrumentId: ids.closedInstrument,
      direction: "long",
      openedAtUtc: "2026-01-05T14:30:00.000Z",
      closedAtUtc: "2026-01-05T15:00:00.000Z",
      finalPosition: "0",
      state: "ready_closed",
      reason: null,
      allocations: Object.freeze([
        Object.freeze({
          allocationId: ids.closedBuyAllocation,
          executionVersionId: ids.closedBuyVersion,
          role: "opening" as const,
          quantity: "10",
        }),
        Object.freeze({
          allocationId: ids.closedSellAllocation,
          executionVersionId: ids.closedSellVersion,
          role: "closing" as const,
          quantity: "10",
        }),
      ]),
    });
    insertRebuildAndRoundTrip(database, {
      rebuildId: ids.openRebuild,
      roundTripId: ids.openRoundTrip,
      roundTripVersionId: ids.openRoundTripVersion,
      instrumentId: ids.openInstrument,
      direction: "long",
      openedAtUtc: "2026-01-06T15:00:00.000Z",
      closedAtUtc: null,
      finalPosition: "5",
      state: "legitimate_open",
      reason: null,
      allocations: Object.freeze([
        Object.freeze({
          allocationId: ids.openAllocation,
          executionVersionId: ids.openVersion,
          role: "opening" as const,
          quantity: "5",
        }),
      ]),
    });
    insertRebuildAndRoundTrip(database, {
      rebuildId: ids.decisionRebuild,
      roundTripId: ids.decisionRoundTrip,
      roundTripVersionId: ids.decisionRoundTripVersion,
      instrumentId: ids.decisionInstrument,
      direction: "long",
      openedAtUtc: "2026-01-07T15:00:00.000Z",
      closedAtUtc: null,
      finalPosition: "2",
      state: "needs_decision",
      reason: "closing_position_unconfirmed",
      allocations: Object.freeze([
        Object.freeze({
          allocationId: ids.decisionAllocation,
          executionVersionId: ids.decisionVersion,
          role: "opening" as const,
          quantity: "2",
        }),
      ]),
    });
    database.prepare(`INSERT INTO journal_data_decisions (
  decision_id, workspace_id, account_id, issue_code, state, target_kind,
  source_issue_id, execution_id, position_fact_id, overlap_key_sha256,
  chain_key_sha256, effect_code, revision, current_event_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'closing_position_unconfirmed', 'pending', 'chain',
  NULL, NULL, NULL, NULL, ?, 'round_trip_needs_decision', 1, ?, ?, ?)`)
      .run(
        ids.decision,
        ids.workspace,
        ids.account,
        chainKey(
          ids.workspace,
          ids.account,
          ids.decisionInstrument,
          "USD",
        ),
        ids.decisionEvent,
        timestamp,
        timestamp,
      );
    database.prepare(`INSERT INTO journal_data_decision_events (
  decision_event_id, workspace_id, account_id, decision_id, event_sequence,
  action, actor_kind, actor_user_id, reason_code, reason_text,
  prior_execution_version_id, resulting_execution_version_id,
  prior_position_fact_id, resulting_position_fact_id,
  resulting_coverage_interval_id, counterpart_execution_id, resulting_state,
  occurred_at_utc
) VALUES (?, ?, ?, ?, 1, 'opened', 'system', NULL,
  'closing_position_unconfirmed', NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  'pending', ?)`)
      .run(
        ids.decisionEvent,
        ids.workspace,
        ids.account,
        ids.decision,
        timestamp,
      );
  }).immediate();
}

function read(
  database: Database.Database,
  request = allRequest,
  accessScope = scope(),
  now = generatedAt,
) {
  return new JournalAnalyticsFactSetService(
    new JournalAnalyticsFactSetRepository(database, () => new Date(now)),
  ).getJournalAnalyticsFactSet(accessScope, request);
}

describe("Journal Analytics fact set", () => {
  it("publishes immutable closed, open, decision, provenance and coverage facts", () => {
    const database = setupDatabase();
    try {
      const result = read(database);
      expect(result.contractVersion).toBe("journal_analytics_fact_set_v1");
      expect(result.generatedAtUtc).toBe(generatedAt);
      expect(result.sourceRevisionSha256).toMatch(/^[0-9a-f]{64}$/u);
      expect(result.earliestAvailableLocalDate).toBe("2026-01-01");
      expect(result.latestAvailableLocalDate).toBe("2026-01-31");
      expect(result.roundTrips.map((row) => row.projectionState)).toEqual([
        "ready_closed",
        "legitimate_open",
        "needs_decision",
      ]);
      expect(result.accounts[0]?.coverage.roundTrips.byProjectionState).toEqual({
        legitimate_open: 1,
        needs_decision: 1,
        ready_closed: 1,
      });
      const closed = result.roundTrips[0];
      expect(closed?.allocations).toHaveLength(2);
      expect(closed?.allocations[0]?.provenanceKinds).toEqual(["broker"]);
      expect(closed?.allocations[0]?.feePolicyCandidates).toEqual([
        {
          sourceSystem: "ibkr",
          adapterId: "ibkr_activity",
          adapterVersion: "ibkr-activity-v1",
          provenanceKind: "broker",
        },
      ]);
      const decision = result.roundTrips[2];
      expect(decision?.pendingDecisionIds).toEqual([ids.decision]);
      expect(decision?.pendingDecisionReasonCodes).toEqual([
        "closing_position_unconfirmed",
      ]);
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.roundTrips)).toBe(true);
      expect(Object.isFrozen(closed?.allocations)).toBe(true);
    } finally {
      database.close();
    }
  });

  it("loads the full allocation graph before later date/currency filtering", () => {
    const database = setupDatabase();
    try {
      const boundedRequest: JournalAnalyticsFactSetRequest = Object.freeze({
        accountIds: Object.freeze([ids.account]),
        closingDateRange: Object.freeze({
          kind: "inclusive_closing_date",
          startDate: "2026-01-05",
          endDate: "2026-01-05",
        }),
        currencySelection: Object.freeze({
          kind: "single_currency",
          currency: "USD",
        }),
      });
      const all = read(database);
      const bounded = read(
        database,
        boundedRequest,
        scope(),
        "2026-08-02T18:00:00.000Z",
      );
      expect(bounded.roundTrips).toHaveLength(3);
      expect(bounded.sourceRevisionSha256).toBe(all.sourceRevisionSha256);
      expect(bounded.generatedAtUtc).not.toBe(all.generatedAtUtc);
      expect(bounded.requestedClosingDateRange).toEqual(
        boundedRequest.closingDateRange,
      );
    } finally {
      database.close();
    }
  });

  it("changes the source revision only when selected Journal facts change", () => {
    const database = setupDatabase();
    try {
      const before = read(database).sourceRevisionSha256;
      database.prepare(`UPDATE journal_instruments
SET normalized_symbol = 'RENAMED', updated_at_utc = ?
WHERE workspace_id = ? AND instrument_id = ?`)
        .run(timestamp, ids.workspace, ids.closedInstrument);
      const after = read(database).sourceRevisionSha256;
      expect(after).not.toBe(before);
    } finally {
      database.close();
    }
  });

  it("denies member, omitted and cross-workspace account scope", () => {
    const database = setupDatabase();
    try {
      expect(() => read(database, allRequest, scope({ workspaceRole: "member" })))
        .toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      expect(() => read(database, { ...allRequest, accountIds: [] }))
        .toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");

      const otherUser = id(300);
      const otherWorkspace = id(301);
      const otherAccount = id(302);
      database.transaction(() => {
        database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'test', 'other', 'Other', 'active', ?, ?)`)
          .run(otherUser, timestamp, timestamp);
        database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'Other', 'America/New_York', 'active', ?, ?)`)
          .run(otherWorkspace, timestamp, timestamp);
        database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
          .run(otherWorkspace, otherUser, otherUser, timestamp, timestamp);
        database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Other', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
          .run(otherAccount, otherWorkspace, otherUser, timestamp, timestamp);
      }).immediate();
      const forgedScope = scope({
        allowedAccountIds: Object.freeze([otherAccount]),
        activeAccountId: otherAccount,
      });
      expect(() => read(database, {
        ...allRequest,
        accountIds: Object.freeze([otherAccount]),
      }, forgedScope)).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    } finally {
      database.close();
    }
  });

  it("rejects allocation quantity loss instead of returning partial facts", () => {
    const database = setupDatabase();
    try {
      database.prepare(`UPDATE journal_round_trip_execution_allocations
SET quantity_decimal = '9' WHERE allocation_id = ?`)
        .run(ids.closedBuyAllocation);
      expect(() => read(database)).toThrowError(
        "TRADERLINK_PLATFORM_INTEGRITY_FAILED",
      );
    } finally {
      database.close();
    }
  });

  it("rejects allocations that point to a stale execution version", () => {
    const database = setupDatabase();
    try {
      const nextVersionId = id(400);
      database.transaction(() => {
        database.prepare(`INSERT INTO journal_execution_versions (
  execution_version_id, workspace_id, account_id, execution_id,
  version_number, instrument_id, trade_currency, source_timestamp_text,
  source_timezone, time_parser_version, executed_at_utc, source_order_key,
  side, quantity_decimal, price_decimal, fees_decimal, fee_currency,
  fee_sign_convention, fact_completeness, actor_kind, actor_user_id,
  change_reason_code, created_at_utc
)
SELECT ?, workspace_id, account_id, execution_id, 2, instrument_id,
       trade_currency, source_timestamp_text, source_timezone,
       time_parser_version, executed_at_utc, source_order_key, side,
       quantity_decimal, price_decimal, fees_decimal, fee_currency,
       fee_sign_convention, fact_completeness, 'system', NULL,
       'test_correction', created_at_utc
FROM journal_execution_versions WHERE execution_version_id = ?`)
          .run(nextVersionId, ids.closedBuyVersion);
        database.prepare(`UPDATE journal_executions
SET current_version_id = ?, updated_at_utc = ? WHERE execution_id = ?`)
          .run(nextVersionId, timestamp, ids.closedBuyExecution);
      }).immediate();
      expect(() => read(database)).toThrowError(
        "TRADERLINK_PLATFORM_INTEGRITY_FAILED",
      );
    } finally {
      database.close();
    }
  });

  it("rejects a forked latest rebuild history", () => {
    const database = setupDatabase();
    try {
      const forkIds = [id(500), id(501)];
      for (const forkId of forkIds) {
        database.prepare(`INSERT INTO journal_chain_rebuilds (
  rebuild_id, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, trigger_kind, trigger_import_event_id,
  trigger_decision_event_id, maintenance_reason_code, previous_rebuild_id,
  algorithm_version, ordered_input_sha256, output_sha256, coverage_state,
  ready_closed_count, legitimate_open_count, needs_decision_count,
  excluded_count, first_execution_at_utc, last_execution_at_utc,
  completed_at_utc
)
SELECT ?, workspace_id, account_id, instrument_id, trade_currency,
       chain_key_sha256, 'maintenance', NULL, NULL, 'test_fork', rebuild_id,
       algorithm_version, ?, ?, coverage_state, ready_closed_count,
       legitimate_open_count, needs_decision_count, excluded_count,
       first_execution_at_utc, last_execution_at_utc, completed_at_utc
FROM journal_chain_rebuilds WHERE rebuild_id = ?`)
          .run(
            forkId,
            digest(`fork-input-${forkId}`),
            digest(`fork-output-${forkId}`),
            ids.closedRebuild,
          );
      }
      expect(() => read(database)).toThrowError(
        "TRADERLINK_PLATFORM_INTEGRITY_FAILED",
      );
    } finally {
      database.close();
    }
  });

  it("rejects rebuild population counts that do not match current projections", () => {
    const database = setupDatabase();
    try {
      database.prepare(`UPDATE journal_chain_rebuilds
SET ready_closed_count = 2 WHERE rebuild_id = ?`).run(ids.closedRebuild);
      expect(() => read(database)).toThrowError(
        "TRADERLINK_PLATFORM_INTEGRITY_FAILED",
      );
    } finally {
      database.close();
    }
  });
});
