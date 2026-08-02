import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import {
  narrowWorkspaceAccessToAccount,
  type WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";
import { JournalAccountRepository } from "./accounts/journal-account-repository";
import { JournalAccountService } from "./accounts/journal-account-service";
import { JournalDataDecisionRepository } from "./decisions/journal-data-decision-repository";
import { JournalDataDecisionService } from "./decisions/journal-data-decision-service";
import { JournalExecutionRepository } from "./executions/journal-execution-repository";
import { JournalExecutionService } from "./executions/journal-execution-service";
import {
  createJournalPrivacyDigester,
  JournalImportService,
} from "./imports/journal-import-service";
import { JournalImportRepository } from "./imports/journal-import-repository";
import { JournalProductReadService } from "./product/journal-product-read-service";
import { JournalRoundTripRepository } from "./round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "./round-trips/journal-round-trip-service";
import { JournalIntegrityCommandService } from "./journal-integrity-command-service";
import { JournalIntegrityReadRepository } from "./journal-integrity-read-repository";

type Trade = Readonly<{
  symbol: string;
  timestamp: string;
  quantity: string;
  price: string;
  id: string;
}>;

type Position = Readonly<{
  symbol: string;
  prior: string;
  current: string;
}>;

type OpenPosition = Readonly<{ symbol: string; quantity: string }>;

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function statement(input: Readonly<{
  period: string;
  trades: readonly Trade[];
  positions: readonly Position[];
  openPositions?: readonly OpenPosition[];
}>): string {
  return [
    "Statement,Header,Field Name,Field Value",
    `Statement,Data,Period,"${input.period}"`,
    "Account Information,Header,Field Name,Field Value",
    "Account Information,Data,Account,SYNTH-ACCOUNT",
    "Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Comm/Fee,TradeID",
    ...input.trades.map((trade) =>
      `Trades,Data,Order,Stocks,USD,${trade.symbol},"${trade.timestamp}",${trade.quantity},${trade.price},,${trade.id}`),
    "Mark-to-Market Performance Summary,Header,Asset Category,Currency,Symbol,Prior Quantity,Current Quantity",
    ...input.positions.map((position) =>
      `Mark-to-Market Performance Summary,Data,Stocks,USD,${position.symbol},${position.prior},${position.current}`),
    ...(input.openPositions?.length
      ? [
          "Open Positions,Header,DataDiscriminator,Asset Category,Currency,Symbol,Quantity",
          ...input.openPositions.map((position) =>
            `Open Positions,Data,Summary,Stocks,USD,${position.symbol},${position.quantity}`),
        ]
      : []),
  ].join("\r\n");
}

function setup() {
  const root = mkdtempSync(join(tmpdir(), "traderlink-journal-integrity-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "journal.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database);
  const users = new PlatformUserRepository(database, { allowedAuthProviders: ["test"] });
  const workspaces = new PlatformWorkspaceRepository(database);
  const accountRepository = new JournalAccountRepository(database);
  const key = randomBytes(32);
  const accounts = new JournalAccountService(accountRepository, {
    activeKeyVersion: "testkey",
    keysBase64: { testkey: key.toString("base64") },
    activeCanonicalizationVersion: "ibkr_v1",
    canonicalizers: { ibkr_v1: (value) => value.trim().toUpperCase() },
  });
  const now = "2026-08-01T12:00:00.000Z";
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  users.createUser({
    userId,
    authProvider: "test",
    authSubject: "owner",
    displayName: "Owner",
    createdAtUtc: now,
    updatedAtUtc: now,
  });
  workspaces.createWorkspaceWithOwner({
    workspaceId,
    ownerUserId: userId,
    displayName: "Workspace",
    defaultTradingTimezone: "America/New_York",
    createdAtUtc: now,
  });
  const creationScope: WorkspaceAccessScope = {
    userId,
    workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: [],
    activeAccountId: null,
  };
  const account = accounts.createAccount(creationScope, {
    workspaceId,
    displayName: "Journal",
    baseCurrency: "USD",
    tradingTimezone: "America/New_York",
    now: new Date(now),
  });
  const scope: WorkspaceAccessScope = {
    ...creationScope,
    allowedAccountIds: [account.accountId],
    activeAccountId: account.accountId,
  };
  accounts.confirmSourceIdentityLinkRecord(scope, {
    accountId: account.accountId,
    sourceSystem: "ibkr",
    rawSourceAccountId: "SYNTH-ACCOUNT",
    privacySafeDisplay: "Synthetic account",
    now: new Date(now),
  });
  const imports = new JournalImportRepository(database);
  const executions = new JournalExecutionRepository(database);
  const importService = new JournalImportService(
    imports,
    executions,
    accounts,
    createJournalPrivacyDigester({
      activeKeyVersion: "testkey",
      keysBase64: { testkey: key.toString("base64") },
    }),
  );
  const roundTrips = new JournalRoundTripService(new JournalRoundTripRepository(database));
  const decisions = new JournalDataDecisionService(
    new JournalDataDecisionRepository(database),
    imports,
    importService,
    executions,
    new JournalExecutionService(executions),
    roundTrips,
  );
  return Object.freeze({
    database,
    scope,
    accountScope: narrowWorkspaceAccessToAccount(scope, account.accountId),
    command: new JournalIntegrityCommandService(
      imports,
      importService,
      decisions,
      roundTrips,
    ),
    importService,
    decisions,
    coverage: new JournalIntegrityReadRepository(database),
  });
}

function count(database: Database.Database, table: string, where = ""): number {
  return (database.prepare(`SELECT COUNT(*) AS count FROM ${table} ${where}`).get() as {
    count: number;
  }).count;
}

function caughtFailure(action: () => unknown): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error("Expected the synthetic integrity action to fail");
}

function commitBroker(context: ReturnType<typeof setup>, csvText: string, minute = 0) {
  const sourceBytes = Buffer.from(csvText, "utf8");
  const preview = context.importService.previewIbkr(
    sourceBytes,
    "America/New_York",
  );
  return context.command.commitIbkrStatement(context.scope, {
    sourceBytes,
    sourceTimezone: "America/New_York",
    privacySafeAccountDisplay: "Synthetic account",
    sourceDisplayLabel: "Synthetic statement",
    evidenceObjectKey: `ibkr/${preview.sourceFileSha256}.csv`,
    now: new Date(`2026-08-01T13:${String(minute).padStart(2, "0")}:00.000Z`),
  });
}

describe("Journal integrity command service", () => {
  it("keeps a statement-only open position visible when its execution is outside coverage", () => {
    const context = setup();
    try {
      const result = commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [],
        positions: [],
        openPositions: [{ symbol: "CARRIED", quantity: "25" }],
      }));
      expect(result.rebuilds).toHaveLength(1);
      expect(result.rebuilds[0]).toMatchObject({
        needsDecisionCount: 1,
        readyClosedCount: 0,
        legitimateOpenCount: 0,
      });
      expect(count(context.database, "journal_round_trips", "WHERE lifecycle_state = 'active'"))
        .toBe(1);
      expect(count(context.database, "journal_data_decisions", "WHERE state = 'pending' AND issue_code = 'opening_execution_outside_coverage'"))
        .toBe(1);
      const decision = context.database.prepare(`SELECT decision_id, revision
FROM journal_data_decisions
WHERE state = 'pending' AND issue_code = 'opening_execution_outside_coverage'`).get() as {
        decision_id: string;
        revision: number;
      };
      const fact = context.database.prepare(`SELECT position_fact_id
FROM journal_position_facts
WHERE fact_kind = 'open_position'`).get() as { position_fact_id: string };
      context.decisions.resolve(context.accountScope, {
        action: "confirm_legitimate_open_position",
        decisionId: decision.decision_id,
        expectedRevision: decision.revision,
        reasonCode: "broker_open_position_confirmed",
        positionFactId: fact.position_fact_id,
        idempotencyKey: "confirm-carried-open-position-01",
        sourceDisplayLabel: "Confirmed carried open position",
      });
      expect(context.database.prepare(`SELECT version.projection_state,
 version.coverage_reason_code
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.round_trip_version_id = round_trip.current_version_id
WHERE round_trip.lifecycle_state = 'active'`).get()).toEqual({
        projection_state: "legitimate_open",
        coverage_reason_code: null,
      });
      expect(count(
        context.database,
        "journal_data_decisions",
        "WHERE state = 'pending' AND issue_code = 'opening_execution_outside_coverage'",
      )).toBe(0);
    } finally {
      context.database.close();
    }
  });

  it("builds long, short, partial, multi-day, repeated-symbol, and flip projections", () => {
    const context = setup();
    try {
      const csvText = statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "LONG", timestamp: "2026-01-02, 09:30:00", quantity: "10", price: "10", id: "L1" },
          { symbol: "LONG", timestamp: "2026-01-02, 09:31:00", quantity: "-4", price: "11", id: "L2" },
          { symbol: "LONG", timestamp: "2026-01-02, 09:32:00", quantity: "-6", price: "12", id: "L3" },
          { symbol: "SHORT", timestamp: "2026-01-03, 09:30:00", quantity: "-10", price: "20", id: "S1" },
          { symbol: "SHORT", timestamp: "2026-01-03, 09:31:00", quantity: "4", price: "19", id: "S2" },
          { symbol: "SHORT", timestamp: "2026-01-03, 09:32:00", quantity: "6", price: "18", id: "S3" },
          { symbol: "MULTI", timestamp: "2026-01-04, 15:00:00", quantity: "5", price: "30", id: "M1" },
          { symbol: "MULTI", timestamp: "2026-01-05, 09:30:00", quantity: "-5", price: "31", id: "M2" },
          { symbol: "REPEAT", timestamp: "2026-01-06, 09:30:00", quantity: "2", price: "40", id: "R1" },
          { symbol: "REPEAT", timestamp: "2026-01-06, 09:31:00", quantity: "-2", price: "41", id: "R2" },
          { symbol: "REPEAT", timestamp: "2026-01-06, 10:30:00", quantity: "3", price: "42", id: "R3" },
          { symbol: "REPEAT", timestamp: "2026-01-06, 10:31:00", quantity: "-3", price: "43", id: "R4" },
          { symbol: "FLIP", timestamp: "2026-01-07, 09:30:00", quantity: "10", price: "50", id: "F1" },
          { symbol: "FLIP", timestamp: "2026-01-07, 09:31:00", quantity: "-15", price: "49", id: "F2" },
        ],
        positions: [
          { symbol: "LONG", prior: "0", current: "0" },
          { symbol: "SHORT", prior: "0", current: "0" },
          { symbol: "MULTI", prior: "0", current: "0" },
          { symbol: "REPEAT", prior: "0", current: "0" },
          { symbol: "FLIP", prior: "0", current: "-5" },
        ],
        openPositions: [{ symbol: "FLIP", quantity: "-5" }],
      });
      const result = commitBroker(context, csvText);
      expect(result.rebuilds).toHaveLength(5);
      expect(count(context.database, "journal_round_trip_versions", "WHERE projection_state = 'ready_closed'")).toBe(6);
      expect(count(context.database, "journal_round_trip_versions", "WHERE projection_state = 'legitimate_open'")).toBe(1);
      expect(count(context.database, "journal_round_trip_versions", "WHERE projection_state = 'needs_decision'")).toBe(0);
      const coverage = context.coverage.coverageSummary(context.accountScope);
      expect(coverage.roundTrips).toMatchObject({
        activeTotal: 7,
        affectedChainCount: 0,
        unaffectedChainCount: 5,
      });
      expect(coverage.accountScope).toEqual({
        baseCurrency: "USD",
        tradingTimezone: "America/New_York",
      });
      expect(coverage.coverageIntervals).toMatchObject({
        accountTimezoneCompatibleCompleteCount: 1,
        accountTimezoneMismatchCount: 0,
        overlappingCompleteIntervalCount: 0,
        completeCoverageGapCount: 0,
        earliestLocalDate: "2026-01-01",
        latestLocalDate: "2026-01-31",
      });
      expect(coverage.executions).toMatchObject({ total: 14, byState: { accepted: 14 } });
      expect(coverage.rebuilds.latestByChain).toHaveLength(5);
      const flipAllocations = context.database.prepare(`SELECT a.quantity_decimal
FROM journal_round_trip_execution_allocations a
JOIN journal_execution_versions v ON v.execution_version_id = a.execution_version_id
JOIN journal_instruments i ON i.instrument_id = v.instrument_id
WHERE i.normalized_symbol = 'FLIP' AND v.side = 'sell'
ORDER BY a.quantity_decimal`).all();
      expect(flipAllocations).toEqual([
        { quantity_decimal: "10" },
        { quantity_decimal: "5" },
      ]);
      const rebuildCount = count(context.database, "journal_chain_rebuilds");
      const retried = commitBroker(context, csvText, 1);
      expect(retried.status).toBe("already_imported");
      expect(retried.rebuilds).toEqual([]);
      expect(count(context.database, "journal_chain_rebuilds")).toBe(rebuildCount);
    } finally {
      context.database.close();
    }
  });

  it("rebuilds a cross-statement trade correctly when the closing month arrives first", () => {
    const context = setup();
    try {
      const january = statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [{ symbol: "CROSS", timestamp: "2026-01-31, 15:00:00", quantity: "10", price: "5", id: "C1" }],
        positions: [{ symbol: "CROSS", prior: "0", current: "10" }],
      });
      const february = statement({
        period: "February 1, 2026 - February 28, 2026",
        trades: [{ symbol: "CROSS", timestamp: "2026-02-01, 09:30:00", quantity: "-10", price: "6", id: "C2" }],
        positions: [{ symbol: "CROSS", prior: "10", current: "0" }],
      });
      commitBroker(context, february);
      commitBroker(context, january, 1);
      const current = context.database.prepare(`SELECT v.projection_state, v.coverage_reason_code
FROM journal_round_trips r
JOIN journal_round_trip_versions v ON v.round_trip_version_id = r.current_version_id
WHERE r.lifecycle_state = 'active'`).all();
      expect(current).toEqual([{ projection_state: "ready_closed", coverage_reason_code: null }]);
      expect(count(context.database, "journal_data_decisions", "WHERE state = 'pending' AND target_kind = 'chain'")).toBe(0);
      expect(count(context.database, "journal_data_decisions", "WHERE state = 'superseded' AND target_kind = 'chain'")).toBeGreaterThan(0);
    } finally {
      context.database.close();
    }
  });

  it("follows rebuild parentage and fails closed on a tuple fork or conflicting alias", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "HISTORY", timestamp: "2026-01-05, 09:30:00", quantity: "1", price: "5", id: "H1" },
          { symbol: "HISTORY", timestamp: "2026-01-05, 09:31:00", quantity: "-1", price: "6", id: "H2" },
        ],
        positions: [{ symbol: "HISTORY", prior: "0", current: "0" }],
      }));
      const repository = new JournalRoundTripRepository(context.database);
      const first = context.database.prepare(`SELECT rebuild_id, instrument_id,
 trade_currency, chain_key_sha256, completed_at_utc
FROM journal_chain_rebuilds`).get() as {
        rebuild_id: string;
        instrument_id: string;
        trade_currency: string;
        chain_key_sha256: string;
        completed_at_utc: string;
      };
      const highId = "ffffffff-ffff-4fff-afff-ffffffffffff";
      const lowId = "00000000-0000-4000-8000-000000000001";
      const insert = (
        rebuildId: string,
        previousRebuildId: string | null,
        digestCharacter: string,
        chainKeySha256 = first.chain_key_sha256,
      ) => repository.insertRebuild({
        rebuildId,
        workspaceId: context.scope.workspaceId,
        accountId: context.accountScope.accountId,
        instrumentId: first.instrument_id,
        tradeCurrency: first.trade_currency,
        chainKeySha256,
        triggerKind: "maintenance",
        triggerId: null,
        maintenanceReasonCode: "history_test",
        previousRebuildId,
        algorithmVersion: "zero_to_zero_v2",
        orderedInputSha256: digestCharacter.repeat(64),
        outputSha256: digestCharacter.repeat(64),
        coverageState: "complete",
        readyClosedCount: 1,
        legitimateOpenCount: 0,
        needsDecisionCount: 0,
        excludedCount: 0,
        firstExecutionAtUtc: null,
        lastExecutionAtUtc: null,
        timestamp: first.completed_at_utc,
      });
      insert(highId, first.rebuild_id, "a");
      insert(lowId, highId, "b");
      expect(repository.latestRebuild(
        context.scope.workspaceId,
        context.accountScope.accountId,
        first.instrument_id,
        first.trade_currency,
      )?.rebuildId).toBe(lowId);
      expect(context.coverage.coverageSummary(context.accountScope)
        .rebuilds.latestByChain[0]?.outputSha256).toBe("b".repeat(64));

      const alias = context.database.prepare(`SELECT alias_key_sha256
FROM journal_round_trip_identity_aliases LIMIT 1`).get() as {
        alias_key_sha256: string;
      };
      expect(() => repository.insertAliasIfMissing({
        roundTripAliasId: createCanonicalUuidV4(),
        workspaceId: context.scope.workspaceId,
        accountId: context.accountScope.accountId,
        roundTripId: createCanonicalUuidV4(),
        aliasKeySha256: alias.alias_key_sha256,
        timestamp: first.completed_at_utc,
      })).toThrowError("TRADERLINK_PLATFORM_INTEGRITY_FAILED");

      const inconsistentChainKey = [
        first.chain_key_sha256[0] === "0" ? "1" : "0",
        first.chain_key_sha256.slice(1),
      ].join("");
      insert(
        "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee",
        null,
        "c",
        inconsistentChainKey,
      );
      expect(caughtFailure(() =>
        context.coverage.coverageSummary(context.accountScope))).toMatchObject({
        code: "TRADERLINK_PLATFORM_INTEGRITY_FAILED",
        safeContext: { check: "journal_rebuild_history_fork" },
      });
    } finally {
      context.database.close();
    }
  });

  it("fails coverage when a latest rebuild stores an inconsistent chain hash", () => {
    const context = setup();
    try {
      const instrumentId = "dddddddd-dddd-4ddd-addd-dddddddddddd";
      new JournalImportRepository(context.database).findOrCreateInstrument({
        instrumentId,
        workspaceId: context.scope.workspaceId,
        assetClass: "stock",
        normalizedSymbol: "CORRUPTCHAIN",
        quoteCurrency: "USD",
        timestamp: "2026-08-01T12:20:00.000Z",
      });
      const expectedChainKey = createHash("sha256").update(JSON.stringify([
        "journal-chain-v1",
        context.scope.workspaceId,
        context.accountScope.accountId,
        instrumentId,
        "USD",
      ]), "utf8").digest("hex");
      const inconsistentChainKey = [
        expectedChainKey[0] === "0" ? "1" : "0",
        expectedChainKey.slice(1),
      ].join("");
      new JournalRoundTripRepository(context.database).insertRebuild({
        rebuildId: "cccccccc-cccc-4ccc-accc-cccccccccccc",
        workspaceId: context.scope.workspaceId,
        accountId: context.accountScope.accountId,
        instrumentId,
        tradeCurrency: "USD",
        chainKeySha256: inconsistentChainKey,
        triggerKind: "maintenance",
        triggerId: null,
        maintenanceReasonCode: "chain_hash_guard_test",
        previousRebuildId: null,
        algorithmVersion: "zero_to_zero_v2",
        orderedInputSha256: "a".repeat(64),
        outputSha256: "b".repeat(64),
        coverageState: "unavailable",
        readyClosedCount: 0,
        legitimateOpenCount: 0,
        needsDecisionCount: 0,
        excludedCount: 0,
        firstExecutionAtUtc: null,
        lastExecutionAtUtc: null,
        timestamp: "2026-08-01T12:21:00.000Z",
      });
      expect(caughtFailure(() =>
        context.coverage.coverageSummary(context.accountScope))).toMatchObject({
        code: "TRADERLINK_PLATFORM_INTEGRITY_FAILED",
        safeContext: { check: "journal_rebuild_chain_key_mismatch" },
      });
    } finally {
      context.database.close();
    }
  });

  it("contains a bad same-symbol interval while preserving earlier, later, and other-symbol trades", () => {
    const context = setup();
    try {
      const january = statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "BAD", timestamp: "2026-01-02, 09:30:00", quantity: "2", price: "10", id: "B1" },
          { symbol: "BAD", timestamp: "2026-01-02, 09:31:00", quantity: "-2", price: "11", id: "B2" },
          { symbol: "BAD", timestamp: "2026-01-10, 09:30:00", quantity: "10", price: "12", id: "B3" },
          { symbol: "BAD", timestamp: "2026-01-10, 09:31:00", quantity: "-9", price: "13", id: "B4" },
          { symbol: "GOOD", timestamp: "2026-01-03, 09:30:00", quantity: "5", price: "20", id: "G1" },
          { symbol: "GOOD", timestamp: "2026-01-03, 09:31:00", quantity: "-5", price: "21", id: "G2" },
        ],
        positions: [
          { symbol: "BAD", prior: "0", current: "0" },
          { symbol: "GOOD", prior: "0", current: "0" },
        ],
      });
      const february = statement({
        period: "February 1, 2026 - February 28, 2026",
        trades: [
          { symbol: "BAD", timestamp: "2026-02-03, 09:30:00", quantity: "3", price: "14", id: "B5" },
          { symbol: "BAD", timestamp: "2026-02-03, 09:31:00", quantity: "-3", price: "15", id: "B6" },
        ],
        positions: [{ symbol: "BAD", prior: "0", current: "0" }],
      });
      commitBroker(context, january);
      commitBroker(context, february, 1);
      const states = context.database.prepare(`SELECT i.normalized_symbol, v.projection_state,
       v.coverage_reason_code
FROM journal_round_trips r
JOIN journal_round_trip_versions v ON v.round_trip_version_id = r.current_version_id
JOIN journal_instruments i ON i.instrument_id = v.instrument_id
WHERE r.lifecycle_state = 'active'
ORDER BY i.normalized_symbol, v.opened_at_utc`).all();
      expect(states).toEqual([
        { normalized_symbol: "BAD", projection_state: "ready_closed", coverage_reason_code: null },
        { normalized_symbol: "BAD", projection_state: "needs_decision", coverage_reason_code: "position_fact_mismatch" },
        { normalized_symbol: "BAD", projection_state: "ready_closed", coverage_reason_code: null },
        { normalized_symbol: "GOOD", projection_state: "ready_closed", coverage_reason_code: null },
      ]);
    } finally {
      context.database.close();
    }
  });

  it("marks a cross-statement trade partial when the intervening month is missing", () => {
    const context = setup();
    try {
      const january = statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [{ symbol: "GAP", timestamp: "2026-01-31, 15:00:00", quantity: "10", price: "5", id: "P1" }],
        positions: [{ symbol: "GAP", prior: "0", current: "10" }],
      });
      const march = statement({
        period: "March 1, 2026 - March 31, 2026",
        trades: [{ symbol: "GAP", timestamp: "2026-03-01, 09:30:00", quantity: "-10", price: "6", id: "P2" }],
        positions: [{ symbol: "GAP", prior: "10", current: "0" }],
      });
      commitBroker(context, january);
      commitBroker(context, march, 1);
      const current = context.database.prepare(`SELECT v.projection_state, v.coverage_reason_code
FROM journal_round_trips r
JOIN journal_round_trip_versions v ON v.round_trip_version_id = r.current_version_id
WHERE r.lifecycle_state = 'active'`).get();
      expect(current).toEqual({
        projection_state: "needs_decision",
        coverage_reason_code: "source_coverage_incomplete",
      });
      expect(context.coverage.coverageSummary(context.accountScope).coverageIntervals)
        .toMatchObject({
          accountTimezoneCompatibleCompleteCount: 2,
          overlappingCompleteIntervalCount: 0,
          completeCoverageGapCount: 1,
          earliestLocalDate: "2026-01-01",
          latestLocalDate: "2026-03-31",
        });
    } finally {
      context.database.close();
    }
  });

  it("contains missing price without treating an unreported optional fee as a bad trade", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "PRICE", timestamp: "2026-01-05, 09:30:00", quantity: "1", price: "", id: "MP1" },
          { symbol: "PRICE", timestamp: "2026-01-05, 09:31:00", quantity: "-1", price: "6", id: "MP2" },
          { symbol: "NOFEE", timestamp: "2026-01-06, 09:30:00", quantity: "1", price: "7", id: "NF1" },
          { symbol: "NOFEE", timestamp: "2026-01-06, 09:31:00", quantity: "-1", price: "8", id: "NF2" },
        ],
        positions: [
          { symbol: "PRICE", prior: "0", current: "0" },
          { symbol: "NOFEE", prior: "0", current: "0" },
        ],
      }));
      const states = context.database.prepare(`SELECT i.normalized_symbol,
 v.projection_state, v.coverage_reason_code
FROM journal_round_trips r
JOIN journal_round_trip_versions v ON v.round_trip_version_id = r.current_version_id
JOIN journal_instruments i ON i.instrument_id = v.instrument_id
WHERE r.lifecycle_state = 'active'
ORDER BY i.normalized_symbol`).all();
      expect(states).toEqual([
        { normalized_symbol: "NOFEE", projection_state: "ready_closed", coverage_reason_code: null },
        { normalized_symbol: "PRICE", projection_state: "needs_decision", coverage_reason_code: "execution_price_missing" },
      ]);
    } finally {
      context.database.close();
    }
  });

  it("keeps valid trade arithmetic usable when only the provider identity is invalid", () => {
    const context = setup();
    try {
      const invalidProviderIdentity = "X".repeat(257);
      const result = commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "IDENTITY", timestamp: "2026-01-05, 09:30:00", quantity: "1", price: "5", id: invalidProviderIdentity },
          { symbol: "IDENTITY", timestamp: "2026-01-05, 09:31:00", quantity: "-1", price: "6", id: "VALID-ID" },
        ],
        positions: [{ symbol: "IDENTITY", prior: "0", current: "0" }],
      }));
      expect(result.pendingSourceDecisionCount).toBe(1);
      expect(context.database.prepare(`SELECT version.projection_state,
 version.coverage_reason_code
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.round_trip_version_id = round_trip.current_version_id
WHERE round_trip.lifecycle_state = 'active'`).get()).toEqual({
        projection_state: "ready_closed",
        coverage_reason_code: null,
      });
      expect(count(
        context.database,
        "journal_data_decisions",
        "WHERE state = 'pending' AND issue_code = 'provider_execution_identity_invalid'",
      )).toBe(1);
    } finally {
      context.database.close();
    }
  });

  it("contains an unmapped execution row to its known chain without hiding another symbol", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "UNCERTAIN", timestamp: "2026-01-06, 09:30:00", quantity: "1", price: "5", id: "U1" },
          { symbol: "UNCERTAIN", timestamp: "2026-01-06, 09:31:00", quantity: "invalid", price: "5.5", id: "U-BAD" },
          { symbol: "UNCERTAIN", timestamp: "2026-01-06, 09:32:00", quantity: "-1", price: "6", id: "U2" },
          { symbol: "SAFE", timestamp: "2026-01-06, 10:30:00", quantity: "1", price: "7", id: "S1" },
          { symbol: "SAFE", timestamp: "2026-01-06, 10:31:00", quantity: "-1", price: "8", id: "S2" },
        ],
        positions: [
          { symbol: "UNCERTAIN", prior: "0", current: "0" },
          { symbol: "SAFE", prior: "0", current: "0" },
        ],
      }));
      const currentStates = () => context.database.prepare(`SELECT instrument.normalized_symbol,
 version.projection_state, version.coverage_reason_code
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.instrument_id = version.instrument_id
WHERE round_trip.lifecycle_state = 'active'
ORDER BY instrument.normalized_symbol`).all();
      expect(currentStates()).toEqual([
        {
          normalized_symbol: "SAFE",
          projection_state: "ready_closed",
          coverage_reason_code: null,
        },
        {
          normalized_symbol: "UNCERTAIN",
          projection_state: "needs_decision",
          coverage_reason_code: "source_chain_issue_pending",
        },
      ]);
      const issue = context.database.prepare(`SELECT decision.decision_id,
 decision.revision, source_issue.instrument_id, source_issue.trade_currency
FROM journal_data_decisions decision
JOIN journal_source_row_issues source_issue
  ON source_issue.source_issue_id = decision.source_issue_id
WHERE decision.state = 'pending'
  AND decision.issue_code = 'execution_fact_invalid'`).get() as {
        decision_id: string;
        revision: number;
        instrument_id: string;
        trade_currency: string;
      };
      expect(issue.instrument_id).toEqual(expect.any(String));
      expect(issue.trade_currency).toBe("USD");
      expect(() => context.decisions.resolve(context.accountScope, {
        action: "add_missing_execution",
        decisionId: issue.decision_id,
        expectedRevision: issue.revision,
        reasonCode: "wrong_chain_attempt",
        idempotencyKey: "wrong-chain-execution-0001",
        sourceDisplayLabel: "Wrong chain execution",
        execution: {
          sourceTimestampText: "2026-01-06, 09:31:00",
          sourceTimezone: "America/New_York",
          normalizedSymbol: "SAFE",
          tradeCurrency: "USD",
          side: "buy",
          quantityDecimal: "1",
          priceDecimal: "5.5",
          feesDecimal: null,
          feeCurrency: null,
          feeSignConvention: "not_reported",
        },
      })).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");
      context.decisions.resolve(context.accountScope, {
        action: "accept_source_limitation",
        decisionId: issue.decision_id,
        expectedRevision: issue.revision,
        reasonCode: "statement_row_unrecoverable",
      });
      expect(currentStates()).toEqual([
        {
          normalized_symbol: "SAFE",
          projection_state: "ready_closed",
          coverage_reason_code: null,
        },
        {
          normalized_symbol: "UNCERTAIN",
          projection_state: "needs_decision",
          coverage_reason_code: "source_chain_limitation_accepted",
        },
      ]);
    } finally {
      context.database.close();
    }
  });

  it("counts latest rebuilt chains even when they have no active projection", () => {
    const context = setup();
    try {
      const result = commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          {
            symbol: "EMPTYHEALTH",
            timestamp: "2026-01-06, 09:30:00",
            quantity: "invalid",
            price: "5",
            id: "EMPTYHEALTH-BAD",
          },
        ],
        positions: [{ symbol: "EMPTYHEALTH", prior: "0", current: "0" }],
      }));
      expect(result.rebuilds).toHaveLength(1);
      expect(result.rebuilds[0]).toMatchObject({
        readyClosedCount: 0,
        legitimateOpenCount: 0,
        needsDecisionCount: 0,
        roundTripIds: [],
      });
      expect(count(context.database, "journal_round_trips", "WHERE lifecycle_state = 'active'"))
        .toBe(0);
      const pendingCoverage = context.coverage.coverageSummary(context.accountScope);
      expect(pendingCoverage.roundTrips).toMatchObject({
        activeTotal: 0,
        affectedChainCount: 1,
        unaffectedChainCount: 0,
      });
      expect(pendingCoverage.rebuilds.latestByChain).toHaveLength(1);

      const limitation = context.database.prepare(`SELECT decision_id, revision
FROM journal_data_decisions
WHERE state = 'pending' AND target_kind = 'source_issue'
  AND issue_code = 'execution_fact_invalid'`).get() as {
        decision_id: string;
        revision: number;
      };
      context.decisions.resolve(context.accountScope, {
        action: "accept_source_limitation",
        decisionId: limitation.decision_id,
        expectedRevision: limitation.revision,
        reasonCode: "synthetic_unmapped_execution_unrecoverable",
      });
      const acceptedCoverage = context.coverage.coverageSummary(context.accountScope);
      expect(acceptedCoverage.roundTrips).toMatchObject({
        activeTotal: 0,
        affectedChainCount: 1,
        unaffectedChainCount: 0,
      });
      expect(acceptedCoverage.rebuilds.latestByChain).toHaveLength(1);

      const cleanInstrumentId = "ffffffff-ffff-4fff-bfff-fffffffffff0";
      new JournalImportRepository(context.database).findOrCreateInstrument({
        instrumentId: cleanInstrumentId,
        workspaceId: context.scope.workspaceId,
        assetClass: "stock",
        normalizedSymbol: "EMPTYCLEAN",
        quoteCurrency: "USD",
        timestamp: "2026-08-01T14:00:00.000Z",
      });
      const cleanRebuild = new JournalRoundTripService(
        new JournalRoundTripRepository(context.database),
      ).rebuildChain(context.accountScope, {
        instrumentId: cleanInstrumentId,
        assetClass: "stock",
        tradeCurrency: "USD",
      }, {
        kind: "maintenance",
        maintenanceReasonCode: "synthetic_zero_fact_chain_health",
        now: new Date("2026-08-01T14:01:00.000Z"),
      });
      expect(cleanRebuild).toMatchObject({
        readyClosedCount: 0,
        legitimateOpenCount: 0,
        needsDecisionCount: 0,
        roundTripIds: [],
      });
      const coverageWithCleanChain = context.coverage.coverageSummary(context.accountScope);
      expect(coverageWithCleanChain.roundTrips).toMatchObject({
        activeTotal: 0,
        affectedChainCount: 1,
        unaffectedChainCount: 1,
      });
      expect(coverageWithCleanChain.rebuilds.latestByChain).toHaveLength(2);
    } finally {
      context.database.close();
    }
  });

  it("ends source-chain containment only at a single-valued supported checkpoint", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "January 1, 2026 - January 10, 2026",
        trades: [
          {
            symbol: "BOUNDARY",
            timestamp: "2026-01-05, 09:30:00",
            quantity: "invalid",
            price: "5",
            id: "BOUNDARY-BAD",
          },
        ],
        positions: [
          { symbol: "BOUNDARY", prior: "0", current: "0" },
          { symbol: "BOUNDARY", prior: "0", current: "1" },
        ],
      }));
      context.command.commitManualExecutions(context.scope, {
        accountId: context.accountScope.accountId,
        idempotencyKey: "boundary-manual-round-trip-01",
        sourceDisplayLabel: "Synthetic boundary manual executions",
        now: new Date("2026-08-01T13:01:00.000Z"),
        entries: [
          {
            sourceTimestampText: "2026-01-12, 09:30:00",
            sourceTimezone: "America/New_York",
            normalizedSymbol: "BOUNDARY",
            tradeCurrency: "USD",
            side: "buy",
            quantityDecimal: "1",
            priceDecimal: "6",
            feesDecimal: null,
            feeCurrency: null,
            feeSignConvention: "not_reported",
          },
          {
            sourceTimestampText: "2026-01-12, 09:31:00",
            sourceTimezone: "America/New_York",
            normalizedSymbol: "BOUNDARY",
            tradeCurrency: "USD",
            side: "sell",
            quantityDecimal: "1",
            priceDecimal: "7",
            feesDecimal: null,
            feeCurrency: null,
            feeSignConvention: "not_reported",
          },
        ],
      });
      commitBroker(context, statement({
        period: "January 21, 2026 - January 31, 2026",
        trades: [
          { symbol: "BOUNDARY", timestamp: "2026-01-22, 09:30:00", quantity: "1", price: "8", id: "BOUNDARY-3" },
          { symbol: "BOUNDARY", timestamp: "2026-01-22, 09:31:00", quantity: "-1", price: "9", id: "BOUNDARY-4" },
        ],
        positions: [{ symbol: "BOUNDARY", prior: "0", current: "0" }],
      }), 2);

      const currentProjections = () => context.database.prepare(`SELECT
 version.opened_at_utc, version.projection_state, version.coverage_reason_code
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.round_trip_version_id = round_trip.current_version_id
WHERE round_trip.lifecycle_state = 'active'
ORDER BY version.opened_at_utc`).all();
      expect(currentProjections()).toEqual([
        {
          opened_at_utc: "2026-01-12T14:30:00.000Z",
          projection_state: "needs_decision",
          coverage_reason_code: "source_chain_issue_pending",
        },
        {
          opened_at_utc: "2026-01-22T14:30:00.000Z",
          projection_state: "ready_closed",
          coverage_reason_code: null,
        },
      ]);

      const limitation = context.database.prepare(`SELECT decision_id, revision
FROM journal_data_decisions
WHERE state = 'pending' AND target_kind = 'source_issue'
  AND issue_code = 'execution_fact_invalid'`).get() as {
        decision_id: string;
        revision: number;
      };
      context.decisions.resolve(context.accountScope, {
        action: "accept_source_limitation",
        decisionId: limitation.decision_id,
        expectedRevision: limitation.revision,
        reasonCode: "synthetic_source_row_unrecoverable",
      });
      expect(currentProjections()).toEqual([
        {
          opened_at_utc: "2026-01-12T14:30:00.000Z",
          projection_state: "needs_decision",
          coverage_reason_code: "source_chain_limitation_accepted",
        },
        {
          opened_at_utc: "2026-01-22T14:30:00.000Z",
          projection_state: "ready_closed",
          coverage_reason_code: null,
        },
      ]);
    } finally {
      context.database.close();
    }
  });

  it("keeps consequential same-time broker ordering behind Data Decisions", () => {
    const context = setup();
    try {
      const result = commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "SAME", timestamp: "2026-01-05, 09:30:00", quantity: "10", price: "5", id: "ST1" },
          { symbol: "SAME", timestamp: "2026-01-05, 09:30:00", quantity: "-10", price: "6", id: "ST2" },
        ],
        positions: [{ symbol: "SAME", prior: "0", current: "0" }],
      }));
      expect(result.pendingSourceDecisionCount).toBe(0);
      expect(count(context.database, "journal_executions", "WHERE current_state = 'accepted'")).toBe(2);
      expect(count(context.database, "journal_data_decisions", "WHERE state = 'pending' AND issue_code = 'execution_order_ambiguous'")).toBe(1);
      expect((context.database.prepare(`SELECT coverage_reason_code
FROM journal_round_trip_versions ORDER BY created_at_utc DESC LIMIT 1`).get() as {
        coverage_reason_code: string;
      }).coverage_reason_code).toBe("execution_order_ambiguous");
      const executions = context.database.prepare(`SELECT e.execution_id, e.current_version_id
FROM journal_executions e
JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
ORDER BY v.source_order_key`).all() as Array<{
        execution_id: string;
        current_version_id: string;
      }>;
      let ordering = context.database.prepare(`SELECT decision_id, revision
FROM journal_data_decisions
WHERE state = 'pending' AND issue_code = 'execution_order_ambiguous'`).get() as {
        decision_id: string;
        revision: number;
      };
      context.decisions.resolve(context.accountScope, {
        action: "set_execution_order",
        decisionId: ordering.decision_id,
        expectedRevision: ordering.revision,
        reasonCode: "statement_sequence_verified",
        executionId: executions[0].execution_id,
        expectedCurrentVersionId: executions[0].current_version_id,
        sameTimestampSequence: 1,
        idempotencyKey: "same-time-sequence-0001",
        sourceDisplayLabel: "Same-time execution order",
      });
      ordering = context.database.prepare(`SELECT decision_id, revision
FROM journal_data_decisions
WHERE state = 'pending' AND issue_code = 'execution_order_ambiguous'`).get() as {
        decision_id: string;
        revision: number;
      };
      expect(() => context.decisions.resolve(context.accountScope, {
        action: "set_execution_order",
        decisionId: ordering.decision_id,
        expectedRevision: ordering.revision,
        reasonCode: "statement_sequence_verified",
        executionId: executions[1].execution_id,
        expectedCurrentVersionId: executions[1].current_version_id,
        sameTimestampSequence: 1,
        idempotencyKey: "same-time-sequence-0002",
        sourceDisplayLabel: "Same-time execution order",
      })).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");
      context.decisions.resolve(context.accountScope, {
        action: "set_execution_order",
        decisionId: ordering.decision_id,
        expectedRevision: ordering.revision,
        reasonCode: "statement_sequence_verified",
        executionId: executions[1].execution_id,
        expectedCurrentVersionId: executions[1].current_version_id,
        sameTimestampSequence: 2,
        idempotencyKey: "same-time-sequence-0002",
        sourceDisplayLabel: "Same-time execution order",
      });
      expect(count(context.database, "journal_data_decisions", "WHERE state = 'pending' AND issue_code = 'execution_order_ambiguous'"))
        .toBe(0);
    } finally {
      context.database.close();
    }
  });

  it("does not create an ordering decision when same-time sides cannot change the trade boundary", () => {
    const context = setup();
    try {
      const result = commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "SAMESTABLE", timestamp: "2026-01-05, 09:30:00", quantity: "10", price: "5", id: "SS1" },
          { symbol: "SAMESTABLE", timestamp: "2026-01-05, 09:30:00", quantity: "-5", price: "6", id: "SS2" },
        ],
        positions: [{ symbol: "SAMESTABLE", prior: "100", current: "105" }],
      }));
      expect(result.pendingSourceDecisionCount).toBe(0);
      expect(count(
        context.database,
        "journal_data_decisions",
        "WHERE state = 'pending' AND issue_code = 'execution_order_ambiguous'",
      )).toBe(0);
    } finally {
      context.database.close();
    }
  });

  it("keeps an execution decision-bound until every issue for it is resolved", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "MULTIISSUE", timestamp: "2026-01-05, 09:30:00", quantity: "10", price: "", id: "MI1" },
          { symbol: "MULTIISSUE", timestamp: "2026-01-05, 09:30:00", quantity: "-10", price: "6", id: "MI2" },
        ],
        positions: [{ symbol: "MULTIISSUE", prior: "0", current: "0" }],
      }));
      const priceDecision = context.database.prepare(`SELECT d.decision_id,
 d.revision, e.execution_id, e.current_version_id, v.*
FROM journal_data_decisions d
JOIN journal_source_row_issues issue ON issue.source_issue_id = d.source_issue_id
JOIN journal_execution_provenance p ON p.source_row_id = issue.source_row_id
JOIN journal_executions e ON e.execution_id = p.execution_id
JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
WHERE d.state = 'pending' AND d.issue_code = 'execution_price_missing'`).get() as Record<string, string | number>;

      expect(() => context.decisions.resolve(context.accountScope, {
        action: "correct_execution_fact",
        decisionId: String(priceDecision.decision_id),
        expectedRevision: Number(priceDecision.revision),
        reasonCode: "wrong_quantity_attempt",
        executionId: String(priceDecision.execution_id),
        expectedCurrentVersionId: String(priceDecision.current_version_id),
        facts: {
          instrumentId: String(priceDecision.instrument_id),
          tradeCurrency: String(priceDecision.trade_currency),
          sourceTimestampText: String(priceDecision.source_timestamp_text),
          sourceTimezone: String(priceDecision.source_timezone),
          timeParserVersion: String(priceDecision.time_parser_version),
          executedAtUtc: String(priceDecision.executed_at_utc),
          sourceOrderKey: String(priceDecision.source_order_key),
          side: priceDecision.side as "buy" | "sell",
          quantityDecimal: "11",
          priceDecimal: "5",
          feesDecimal: null,
          feeCurrency: null,
          feeSignConvention: "not_reported",
          factCompleteness: "complete",
        },
        idempotencyKey: "wrong-price-scope-correction-01",
        sourceDisplayLabel: "Wrong price correction scope",
      })).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");

      context.decisions.resolve(context.accountScope, {
        action: "correct_execution_fact",
        decisionId: String(priceDecision.decision_id),
        expectedRevision: Number(priceDecision.revision),
        reasonCode: "statement_price_verified",
        executionId: String(priceDecision.execution_id),
        expectedCurrentVersionId: String(priceDecision.current_version_id),
        facts: {
          instrumentId: String(priceDecision.instrument_id),
          tradeCurrency: String(priceDecision.trade_currency),
          sourceTimestampText: String(priceDecision.source_timestamp_text),
          sourceTimezone: String(priceDecision.source_timezone),
          timeParserVersion: String(priceDecision.time_parser_version),
          executedAtUtc: String(priceDecision.executed_at_utc),
          sourceOrderKey: String(priceDecision.source_order_key),
          side: priceDecision.side as "buy" | "sell",
          quantityDecimal: String(priceDecision.quantity_decimal),
          priceDecimal: "5",
          feesDecimal: null,
          feeCurrency: null,
          feeSignConvention: "not_reported",
          factCompleteness: "complete",
        },
        idempotencyKey: "multi-issue-price-correction-01",
        sourceDisplayLabel: "Multi-issue price correction",
      });

      expect(context.database.prepare(`SELECT current_state
FROM journal_executions WHERE execution_id = ?`).get(
        String(priceDecision.execution_id),
      )).toEqual({ current_state: "accepted" });
      expect(count(
        context.database,
        "journal_data_decisions",
        "WHERE state = 'pending' AND issue_code = 'execution_order_ambiguous'",
      )).toBe(1);
    } finally {
      context.database.close();
    }
  });

  it("shows conflicting flat position evidence without invalidating the closed trade", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "FLAT", timestamp: "2026-01-05, 09:30:00", quantity: "2", price: "5", id: "CF1" },
          { symbol: "FLAT", timestamp: "2026-01-05, 09:31:00", quantity: "-2", price: "6", id: "CF2" },
        ],
        positions: [
          { symbol: "FLAT", prior: "0", current: "0" },
          { symbol: "FLAT", prior: "0", current: "1" },
        ],
      }));
      expect(count(context.database, "journal_round_trips", "WHERE lifecycle_state = 'active'")).toBe(1);
      expect(count(context.database, "journal_round_trip_versions", "WHERE projection_state = 'ready_closed'")).toBe(1);
      expect(count(context.database, "journal_data_decisions", "WHERE state = 'pending' AND issue_code = 'conflicting_position_facts'")).toBe(1);
    } finally {
      context.database.close();
    }
  });

  it("rolls back source, ledger, decision, and projection writes as one unit", () => {
    const context = setup();
    try {
      context.database.exec(`CREATE TEMP TRIGGER synthetic_rebuild_failure
BEFORE INSERT ON journal_chain_rebuilds
BEGIN
  SELECT RAISE(ABORT, 'synthetic rebuild failure');
END`);
      const csvText = statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "ROLL", timestamp: "2026-01-02, 09:30:00", quantity: "1", price: "5", id: "T1" },
          { symbol: "ROLL", timestamp: "2026-01-02, 09:31:00", quantity: "-1", price: "6", id: "T2" },
        ],
        positions: [{ symbol: "ROLL", prior: "0", current: "0" }],
      });
      expect(() => commitBroker(context, csvText)).toThrow("synthetic rebuild failure");
      for (const table of [
        "journal_import_batches",
        "journal_source_rows",
        "journal_executions",
        "journal_data_decisions",
        "journal_chain_rebuilds",
        "journal_round_trips",
      ]) expect(count(context.database, table)).toBe(0);
    } finally {
      context.database.close();
    }
  });
});

describe("Journal Data Decisions", () => {
  it("applies one exact manual-day coverage decision to every pending batch for that same account day", () => {
    const context = setup();
    try {
      const commitDay = (input: Readonly<{
        idempotencyKey: string;
        date: string;
        symbol: string;
      }>) => context.command.commitManualExecutions(context.scope, {
        accountId: context.accountScope.accountId,
        idempotencyKey: input.idempotencyKey,
        sourceDisplayLabel: `Manual ${input.symbol} entry`,
        entries: [{
          sourceTimestampText: `${input.date}, 09:30:00`,
          sourceTimezone: "America/New_York",
          normalizedSymbol: input.symbol,
          tradeCurrency: "USD",
          side: "buy",
          quantityDecimal: "1",
          priceDecimal: "10",
          feesDecimal: null,
          feeCurrency: null,
          feeSignConvention: "not_reported",
        }],
      });
      const first = commitDay({
        idempotencyKey: "manual-coverage-same-day-01",
        date: "2026-01-08",
        symbol: "DAYA",
      });
      const second = commitDay({
        idempotencyKey: "manual-coverage-same-day-02",
        date: "2026-01-08",
        symbol: "DAYB",
      });
      const other = commitDay({
        idempotencyKey: "manual-coverage-other-day-01",
        date: "2026-01-09",
        symbol: "DAYC",
      });
      const pending = context.database.prepare(`SELECT decision.decision_id,
 decision.revision, source_row.raw_fields_json
FROM journal_data_decisions decision
JOIN journal_source_row_issues issue
  ON issue.source_issue_id = decision.source_issue_id
JOIN journal_source_rows source_row
  ON source_row.source_row_id = issue.source_row_id
WHERE decision.state = 'pending'
  AND issue.issue_code = 'manual_trading_day_coverage_unconfirmed'
ORDER BY decision.decision_id`).all() as Array<{
        decision_id: string;
        revision: number;
        raw_fields_json: string;
      }>;
      expect(pending).toHaveLength(3);
      const selected = pending.find((row) =>
        (JSON.parse(row.raw_fields_json) as unknown[])[5] === "2026-01-08"
      )!;
      context.decisions.resolve(context.accountScope, {
        action: "supply_coverage_fact",
        decisionId: selected.decision_id,
        expectedRevision: selected.revision,
        reasonCode: "manual_trading_day_verified_complete",
        assetClass: "stock",
        coverageKind: "complete",
        localStartDate: "2026-01-08",
        localEndDate: "2026-01-08",
        sourceTimezone: "America/New_York",
        idempotencyKey: "manual-coverage-cascade-01",
        sourceDisplayLabel: "Verified complete manual trading day",
      });
      expect(count(
        context.database,
        "journal_data_decisions",
        "WHERE state = 'resolved' AND issue_code = 'manual_trading_day_coverage_unconfirmed'",
      )).toBe(2);
      expect(count(
        context.database,
        "journal_data_decisions",
        "WHERE state = 'pending' AND issue_code = 'manual_trading_day_coverage_unconfirmed'",
      )).toBe(1);
      const states = context.database.prepare(`SELECT import_batch_id,
 current_state, pending_decision_count
FROM journal_import_batches
WHERE import_batch_id IN (?, ?, ?)
ORDER BY import_batch_id`).all(
        first.importBatchId,
        second.importBatchId,
        other.importBatchId,
      ) as Array<{
        import_batch_id: string;
        current_state: string;
        pending_decision_count: number;
      }>;
      expect(states.filter((row) =>
        [first.importBatchId, second.importBatchId].includes(row.import_batch_id)
      ).map((row) => [row.current_state, row.pending_decision_count])).toEqual([
        ["accepted", 0],
        ["accepted", 0],
      ]);
      expect(states.find((row) => row.import_batch_id === other.importBatchId))
        .toMatchObject({
          current_state: "accepted_with_decisions",
          pending_decision_count: 1,
        });
    } finally {
      context.database.close();
    }
  });

  it("lets the trader confirm a manual swing position with an exact current-position fact", () => {
    const context = setup();
    try {
      const manualBatch = context.command.commitManualExecutions(context.scope, {
        accountId: context.accountScope.accountId,
        idempotencyKey: "manual-swing-position-decision-01",
        sourceDisplayLabel: "Manual swing entry",
        now: new Date("2026-08-01T13:00:00.000Z"),
        entries: [{
          sourceTimestampText: "2026-01-08, 15:30:00",
          sourceTimezone: "America/New_York",
          normalizedSymbol: "SWING",
          tradeCurrency: "USD",
          side: "buy",
          quantityDecimal: "10.5",
          priceDecimal: "15.25",
          feesDecimal: null,
          feeCurrency: null,
          feeSignConvention: "not_reported",
          tradeIntent: "swing",
        }],
      });
      const decision = (issueCode: string) => context.database.prepare(`SELECT
 decision_id, revision FROM journal_data_decisions
WHERE state = 'pending' AND issue_code = ?`).get(issueCode) as {
        decision_id: string;
        revision: number;
      };
      const instrument = context.database.prepare(`SELECT instrument_id
FROM journal_instruments WHERE normalized_symbol = 'SWING'`).get() as {
        instrument_id: string;
      };
      const opening = decision("opening_inventory_required");
      context.decisions.resolve(context.accountScope, {
        action: "supply_opening_inventory",
        decisionId: opening.decision_id,
        expectedRevision: opening.revision,
        reasonCode: "trader_confirmed_zero_opening_inventory",
        instrumentId: instrument.instrument_id,
        currency: "USD",
        effectiveLocalDate: "2026-01-08",
        sourceTimezone: "America/New_York",
        quantityDecimal: "0",
        idempotencyKey: "manual-swing-opening-position-01",
        sourceDisplayLabel: "Confirmed zero opening position",
      });
      const coverage = decision("manual_trading_day_coverage_unconfirmed");
      context.decisions.resolve(context.accountScope, {
        action: "supply_coverage_fact",
        decisionId: coverage.decision_id,
        expectedRevision: coverage.revision,
        reasonCode: "manual_trading_day_verified_complete",
        assetClass: "stock",
        coverageKind: "complete",
        localStartDate: "2026-01-08",
        localEndDate: "2026-01-08",
        sourceTimezone: "America/New_York",
        idempotencyKey: "manual-swing-coverage-01",
        sourceDisplayLabel: "Verified manual swing trading day",
      });
      const closing = decision("closing_position_unconfirmed");
      const productDecision = new JournalProductReadService(context.database)
        .listDataDecisions(context.accountScope).pending.find(
          (item) => item.decisionId === closing.decision_id,
        );
      expect(productDecision?.allowedActions).toContain("supply_position_fact");
      expect(productDecision?.importBatchIds).toContain(manualBatch.importBatchId);
      expect(() => context.decisions.resolve(context.accountScope, {
        action: "supply_position_fact",
        decisionId: closing.decision_id,
        expectedRevision: closing.revision,
        reasonCode: "trader_confirmed_intentional_swing",
        instrumentId: instrument.instrument_id,
        currency: "USD",
        factKind: "opening_balance",
        effectiveLocalDate: "2026-01-08",
        timePrecision: "day_start",
        sourceTimezone: "America/New_York",
        quantityDecimal: "10.5",
        idempotencyKey: "manual-swing-invalid-opening-01",
        sourceDisplayLabel: "Invalid swing position fact",
      })).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");
      context.decisions.resolve(context.accountScope, {
        action: "supply_position_fact",
        decisionId: closing.decision_id,
        expectedRevision: closing.revision,
        reasonCode: "trader_confirmed_intentional_swing",
        instrumentId: instrument.instrument_id,
        currency: "USD",
        factKind: "open_position",
        effectiveLocalDate: "2026-01-08",
        timePrecision: "day_end",
        sourceTimezone: "America/New_York",
        quantityDecimal: "10.5",
        idempotencyKey: "manual-swing-open-position-01",
        sourceDisplayLabel: "Confirmed manual swing position",
      });
      expect(context.database.prepare(`SELECT version.projection_state,
 version.final_position_decimal, version.coverage_reason_code
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.round_trip_version_id = round_trip.current_version_id
WHERE round_trip.lifecycle_state = 'active'`).get()).toEqual({
        projection_state: "legitimate_open",
        final_position_decimal: "10.5",
        coverage_reason_code: null,
      });
    } finally {
      context.database.close();
    }
  });

  it("records opening inventory, rebuilds, and rejects a stale retry without partial writes", () => {
    const context = setup();
    try {
      context.command.commitManualExecutions(context.scope, {
        accountId: context.accountScope.accountId,
        idempotencyKey: "manual-opening-decision-01",
        sourceDisplayLabel: "Manual trading day",
        now: new Date("2026-08-01T13:00:00.000Z"),
        entries: [
          {
            sourceTimestampText: "2026-01-08, 09:30:00",
            sourceTimezone: "America/New_York",
            normalizedSymbol: "MANUAL",
            tradeCurrency: "USD",
            side: "buy",
            quantityDecimal: "5",
            priceDecimal: "10",
            feesDecimal: null,
            feeCurrency: null,
            feeSignConvention: "not_reported",
          },
          {
            sourceTimestampText: "2026-01-08, 09:31:00",
            sourceTimezone: "America/New_York",
            normalizedSymbol: "MANUAL",
            tradeCurrency: "USD",
            side: "sell",
            quantityDecimal: "5",
            priceDecimal: "11",
            feesDecimal: null,
            feeCurrency: null,
            feeSignConvention: "not_reported",
          },
        ],
      });
      const manualCoverage = context.database.prepare(`SELECT decision.decision_id,
 decision.revision
FROM journal_data_decisions decision
JOIN journal_source_row_issues issue
  ON issue.source_issue_id = decision.source_issue_id
WHERE decision.state = 'pending'
  AND issue.issue_code = 'manual_trading_day_coverage_unconfirmed'`).get() as {
        decision_id: string;
        revision: number;
      };
      const pending = context.database.prepare(`SELECT decision_id, revision, chain_key_sha256
FROM journal_data_decisions
WHERE state = 'pending' AND issue_code = 'opening_inventory_required'`).get() as {
        decision_id: string;
        revision: number;
        chain_key_sha256: string;
      };
      const instrument = context.database.prepare(`SELECT instrument_id
FROM journal_instruments WHERE normalized_symbol = 'MANUAL'`).get() as {
        instrument_id: string;
      };
      const resolution = {
        action: "supply_opening_inventory" as const,
        decisionId: pending.decision_id,
        expectedRevision: pending.revision,
        reasonCode: "statement_opening_verified",
        instrumentId: instrument.instrument_id,
        currency: "USD",
        effectiveLocalDate: "2026-01-08",
        sourceTimezone: "America/New_York",
        quantityDecimal: "0",
        idempotencyKey: "opening-position-correction-01",
        sourceDisplayLabel: "Opening position correction",
        now: new Date("2026-08-01T14:00:00.000Z"),
      };
      const resolved = context.decisions.resolve(context.accountScope, resolution);
      expect(resolved.decision.state).toBe("resolved");
      expect(resolved.openedFollowupDecisionIds.length).toBeGreaterThan(0);
      const eventCount = count(context.database, "journal_data_decision_events");
      const factCount = count(context.database, "journal_position_facts");
      expect(() => context.decisions.resolve(context.accountScope, resolution))
        .toThrowError(/TRADERLINK_DATA_DECISION_CONFLICT/u);
      expect(count(context.database, "journal_data_decision_events")).toBe(eventCount);
      expect(count(context.database, "journal_position_facts")).toBe(factCount);
      expect(() => context.decisions.resolve(context.accountScope, {
        action: "supply_coverage_fact",
        decisionId: manualCoverage.decision_id,
        expectedRevision: manualCoverage.revision,
        reasonCode: "manual_trading_day_verified_complete",
        assetClass: "stock",
        coverageKind: "complete",
        localStartDate: "2026-01-09",
        localEndDate: "2026-01-09",
        sourceTimezone: "America/New_York",
        idempotencyKey: "manual-coverage-wrong-day-01",
        sourceDisplayLabel: "Wrong manual day",
      })).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");
      const coverageResolution = context.decisions.resolve(context.accountScope, {
        action: "supply_coverage_fact",
        decisionId: manualCoverage.decision_id,
        expectedRevision: manualCoverage.revision,
        reasonCode: "manual_trading_day_verified_complete",
        assetClass: "stock",
        coverageKind: "complete",
        localStartDate: "2026-01-08",
        localEndDate: "2026-01-08",
        sourceTimezone: "America/New_York",
        idempotencyKey: "manual-coverage-correct-day-01",
        sourceDisplayLabel: "Verified manual trading day",
      });
      expect(coverageResolution.decision.state).toBe("resolved");
      expect(context.database.prepare(`SELECT version.projection_state,
 version.coverage_reason_code
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.round_trip_version_id = round_trip.current_version_id
WHERE round_trip.lifecycle_state = 'active'`).get()).toEqual({
        projection_state: "ready_closed",
        coverage_reason_code: null,
      });
    } finally {
      context.database.close();
    }
  });

  it("supports immutable fact correction, ordering, exclusion, and restoration", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "EDIT", timestamp: "2026-01-04, 09:30:00", quantity: "10", price: "10", id: "E1" },
          { symbol: "EDIT", timestamp: "2026-01-04, 09:31:00", quantity: "-10", price: "11", id: "E2" },
        ],
        positions: [{ symbol: "EDIT", prior: "0", current: "0" }],
      }));
      const execution = () => context.database.prepare(`SELECT e.execution_id,
 e.current_version_id, e.current_state, v.*
FROM journal_executions e
JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
JOIN journal_instruments i ON i.instrument_id = v.instrument_id
WHERE i.normalized_symbol = 'EDIT' AND v.side = 'buy'`).get() as Record<string, string>;
      const openExecutionDecision = (issueCode: string) => {
        const current = execution();
        return context.decisions.openDecision(context.accountScope, {
          issueCode,
          effectCode: "position_chain_unavailable",
          target: { kind: "execution", executionId: current.execution_id },
        });
      };

      let current = execution();
      const originalOrderKey = current.source_order_key;
      let decision = openExecutionDecision("execution_fact_review");
      context.decisions.resolve(context.accountScope, {
        action: "correct_execution_fact",
        decisionId: decision.decisionId,
        expectedRevision: decision.revision,
        reasonCode: "statement_price_verified",
        executionId: current.execution_id,
        expectedCurrentVersionId: current.current_version_id,
        facts: {
          instrumentId: current.instrument_id,
          tradeCurrency: current.trade_currency,
          sourceTimestampText: current.source_timestamp_text,
          sourceTimezone: current.source_timezone,
          timeParserVersion: current.time_parser_version,
          executedAtUtc: current.executed_at_utc,
          sourceOrderKey: "client-forged-order-key",
          side: "buy",
          quantityDecimal: current.quantity_decimal,
          priceDecimal: "10.25",
          feesDecimal: null,
          feeCurrency: null,
          feeSignConvention: "not_reported",
          factCompleteness: "complete",
        },
        idempotencyKey: "execution-fact-correction-01",
        sourceDisplayLabel: "Execution fact correction",
      });
      current = execution();
      expect(current.price_decimal).toBe("10.25");
      expect(current.source_order_key).toBe(originalOrderKey);
      expect(Number(current.version_number)).toBe(2);
      expect(context.database.prepare(`SELECT b.mapped_execution_count,
 r.initial_classification
FROM journal_import_batches b
JOIN journal_source_rows r ON r.import_batch_id = b.import_batch_id
WHERE b.mapping_version = 'execution_correction_mapping_v1'`).get()).toEqual({
        mapped_execution_count: 1,
        initial_classification: "mapped_execution",
      });

      decision = openExecutionDecision("execution_order_review");
      context.decisions.resolve(context.accountScope, {
        action: "set_execution_order",
        decisionId: decision.decisionId,
        expectedRevision: decision.revision,
        reasonCode: "statement_order_verified",
        executionId: current.execution_id,
        expectedCurrentVersionId: current.current_version_id,
        sameTimestampSequence: 1,
        idempotencyKey: "execution-order-correction-01",
        sourceDisplayLabel: "Execution order correction",
      });
      current = execution();
      expect(Number(current.version_number)).toBe(3);

      decision = openExecutionDecision("execution_exclusion_review");
      context.decisions.resolve(context.accountScope, {
        action: "exclude_execution",
        decisionId: decision.decisionId,
        expectedRevision: decision.revision,
        reasonCode: "statement_row_not_execution",
        executionId: current.execution_id,
        expectedCurrentVersionId: current.current_version_id,
      });
      current = execution();
      expect(current.current_state).toBe("excluded_by_trader");

      decision = openExecutionDecision("excluded_execution_fact_review");
      context.decisions.resolve(context.accountScope, {
        action: "correct_execution_fact",
        decisionId: decision.decisionId,
        expectedRevision: decision.revision,
        reasonCode: "statement_price_rechecked",
        executionId: current.execution_id,
        expectedCurrentVersionId: current.current_version_id,
        facts: {
          instrumentId: current.instrument_id,
          tradeCurrency: current.trade_currency,
          sourceTimestampText: current.source_timestamp_text,
          sourceTimezone: current.source_timezone,
          timeParserVersion: current.time_parser_version,
          executedAtUtc: current.executed_at_utc,
          sourceOrderKey: current.source_order_key,
          side: "buy",
          quantityDecimal: current.quantity_decimal,
          priceDecimal: "10.5",
          feesDecimal: null,
          feeCurrency: null,
          feeSignConvention: "not_reported",
          factCompleteness: "complete",
        },
        idempotencyKey: "excluded-fact-correction-01",
        sourceDisplayLabel: "Excluded execution fact correction",
      });
      current = execution();
      expect(current.current_state).toBe("excluded_by_trader");

      decision = openExecutionDecision("execution_restore_review");
      context.decisions.resolve(context.accountScope, {
        action: "restore_execution",
        decisionId: decision.decisionId,
        expectedRevision: decision.revision,
        reasonCode: "statement_execution_restored",
        executionId: current.execution_id,
        expectedCurrentVersionId: current.current_version_id,
      });
      expect(execution().current_state).toBe("accepted");
      expect(count(context.database, "journal_execution_versions")).toBe(5);
    } finally {
      context.database.close();
    }
  });

  it("retires an old chain when a corrected execution moves to another instrument", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "OLDCHAIN", timestamp: "2026-01-04, 09:30:00", quantity: "1", price: "10", id: "OC1" },
          { symbol: "NEWCHAIN", timestamp: "2026-01-04, 10:30:00", quantity: "1", price: "20", id: "NC1" },
          { symbol: "NEWCHAIN", timestamp: "2026-01-04, 10:31:00", quantity: "-1", price: "21", id: "NC2" },
        ],
        positions: [{ symbol: "NEWCHAIN", prior: "0", current: "0" }],
      }));
      expect(count(context.database, "journal_round_trips", `WHERE lifecycle_state = 'active'
AND current_version_id IN (
  SELECT v.round_trip_version_id FROM journal_round_trip_versions v
  JOIN journal_instruments i ON i.instrument_id = v.instrument_id
  WHERE i.normalized_symbol = 'OLDCHAIN'
)`)).toBe(1);
      const oldExecution = context.database.prepare(`SELECT e.execution_id,
 e.current_version_id, v.*
FROM journal_executions e
JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
JOIN journal_instruments i ON i.instrument_id = v.instrument_id
WHERE i.normalized_symbol = 'OLDCHAIN'`).get() as Record<string, string>;
      const newInstrument = context.database.prepare(`SELECT instrument_id
FROM journal_instruments WHERE normalized_symbol = 'NEWCHAIN'`).get() as {
        instrument_id: string;
      };
      const decision = context.decisions.openDecision(context.accountScope, {
        issueCode: "execution_instrument_review",
        effectCode: "position_chain_unavailable",
        target: { kind: "execution", executionId: oldExecution.execution_id },
      });
      context.decisions.resolve(context.accountScope, {
        action: "correct_execution_fact",
        decisionId: decision.decisionId,
        expectedRevision: decision.revision,
        reasonCode: "statement_symbol_verified",
        executionId: oldExecution.execution_id,
        expectedCurrentVersionId: oldExecution.current_version_id,
        facts: {
          instrumentId: newInstrument.instrument_id,
          tradeCurrency: oldExecution.trade_currency,
          sourceTimestampText: oldExecution.source_timestamp_text,
          sourceTimezone: oldExecution.source_timezone,
          timeParserVersion: oldExecution.time_parser_version,
          executedAtUtc: oldExecution.executed_at_utc,
          sourceOrderKey: oldExecution.source_order_key,
          side: "buy",
          quantityDecimal: oldExecution.quantity_decimal,
          priceDecimal: oldExecution.price_decimal,
          feesDecimal: null,
          feeCurrency: null,
          feeSignConvention: "not_reported",
          factCompleteness: "complete",
        },
        idempotencyKey: "execution-instrument-correction-01",
        sourceDisplayLabel: "Execution instrument correction",
      });
      expect(count(context.database, "journal_round_trips", `WHERE lifecycle_state = 'active'
AND current_version_id IN (
  SELECT v.round_trip_version_id FROM journal_round_trip_versions v
  JOIN journal_instruments i ON i.instrument_id = v.instrument_id
  WHERE i.normalized_symbol = 'OLDCHAIN'
)`)).toBe(0);
      expect(count(context.database, "journal_round_trips", `WHERE lifecycle_state = 'superseded'
AND current_version_id IN (
  SELECT v.round_trip_version_id FROM journal_round_trip_versions v
  JOIN journal_instruments i ON i.instrument_id = v.instrument_id
  WHERE i.normalized_symbol = 'OLDCHAIN'
)`)).toBeGreaterThan(0);
    } finally {
      context.database.close();
    }
  });

  it("reactivates the stable round-trip identity when the old chain rebuilds first", () => {
    const context = setup();
    try {
      const oldInstrumentId = "00000000-0000-4000-8000-000000000001";
      const newInstrumentId = "ffffffff-ffff-4fff-bfff-ffffffffffff";
      const instruments = new JournalImportRepository(context.database);
      for (const [instrumentId, normalizedSymbol] of [
        [oldInstrumentId, "OLDIDENTITY"],
        [newInstrumentId, "NEWIDENTITY"],
      ] as const) {
        instruments.findOrCreateInstrument({
          instrumentId,
          workspaceId: context.scope.workspaceId,
          assetClass: "stock",
          normalizedSymbol,
          quoteCurrency: "USD",
          timestamp: "2026-08-01T12:30:00.000Z",
        });
      }
      expect(oldInstrumentId.localeCompare(newInstrumentId)).toBeLessThan(0);

      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          {
            symbol: "OLDIDENTITY",
            timestamp: "2026-01-04, 09:30:00",
            quantity: "1",
            price: "10",
            id: "IDENTITY-1",
          },
        ],
        positions: [],
      }));
      const original = context.database.prepare(`SELECT r.round_trip_id,
 e.execution_id, e.current_version_id, v.*
FROM journal_round_trips r
JOIN journal_round_trip_versions round_trip_version
  ON round_trip_version.round_trip_version_id = r.current_version_id
JOIN journal_round_trip_execution_allocations allocation
  ON allocation.round_trip_version_id = round_trip_version.round_trip_version_id
JOIN journal_execution_versions v
  ON v.execution_version_id = allocation.execution_version_id
JOIN journal_executions e ON e.execution_id = v.execution_id
WHERE r.lifecycle_state = 'active'
  AND round_trip_version.instrument_id = ?`).get(oldInstrumentId) as Record<string, string>;
      const decision = context.decisions.openDecision(context.accountScope, {
        issueCode: "execution_instrument_and_quantity_review",
        effectCode: "position_chain_unavailable",
        target: { kind: "execution", executionId: original.execution_id },
      });
      context.decisions.resolve(context.accountScope, {
        action: "correct_execution_fact",
        decisionId: decision.decisionId,
        expectedRevision: decision.revision,
        reasonCode: "statement_instrument_and_quantity_verified",
        executionId: original.execution_id,
        expectedCurrentVersionId: original.current_version_id,
        facts: {
          instrumentId: newInstrumentId,
          tradeCurrency: original.trade_currency,
          sourceTimestampText: original.source_timestamp_text,
          sourceTimezone: original.source_timezone,
          timeParserVersion: original.time_parser_version,
          executedAtUtc: original.executed_at_utc,
          sourceOrderKey: original.source_order_key,
          side: "buy",
          quantityDecimal: "2",
          priceDecimal: original.price_decimal,
          feesDecimal: null,
          feeCurrency: null,
          feeSignConvention: "not_reported",
          factCompleteness: "complete",
        },
        idempotencyKey: "round-trip-chain-identity-correction-01",
        sourceDisplayLabel: "Synthetic chain identity correction",
      });

      expect(context.database.prepare(`SELECT r.round_trip_id,
 r.lifecycle_state, round_trip_version.version_number,
 instrument.normalized_symbol, allocation.quantity_decimal
FROM journal_round_trips r
JOIN journal_round_trip_versions round_trip_version
  ON round_trip_version.round_trip_version_id = r.current_version_id
JOIN journal_instruments instrument
  ON instrument.instrument_id = round_trip_version.instrument_id
JOIN journal_round_trip_execution_allocations allocation
  ON allocation.round_trip_version_id = round_trip_version.round_trip_version_id
WHERE r.lifecycle_state = 'active'`).all()).toEqual([
        {
          round_trip_id: original.round_trip_id,
          lifecycle_state: "active",
          version_number: 2,
          normalized_symbol: "NEWIDENTITY",
          quantity_decimal: "2",
        },
      ]);
      expect(count(context.database, "journal_round_trips", `WHERE lifecycle_state = 'active'
AND current_version_id IN (
  SELECT round_trip_version_id FROM journal_round_trip_versions
  WHERE instrument_id = '${oldInstrumentId}'
)`)).toBe(0);
      expect(context.database.prepare(`SELECT COUNT(DISTINCT alias_key_sha256) AS count
FROM journal_round_trip_identity_aliases
WHERE round_trip_id = ?`).get(original.round_trip_id)).toEqual({ count: 2 });
    } finally {
      context.database.close();
    }
  });

  it("supports trader-controlled duplicate merging and keeping distinct occurrences", () => {
    const context = setup();
    try {
      const row: Trade = {
        symbol: "DUP",
        timestamp: "2026-01-09, 09:30:00",
        quantity: "10",
        price: "5",
        id: "",
      };
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [row],
        positions: [{ symbol: "DUP", prior: "0", current: "10" }],
      }));
      commitBroker(context, statement({
        period: "January 1, 2026 - February 28, 2026",
        trades: [row, row],
        positions: [{ symbol: "DUP", prior: "0", current: "20" }],
      }), 1);
      const ambiguous = context.database.prepare(`SELECT e.execution_id,
 e.current_version_id
FROM journal_executions e
JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
WHERE e.current_state = 'needs_decision'
ORDER BY e.execution_id`).all() as Array<{
        execution_id: string;
        current_version_id: string;
      }>;
      expect(ambiguous.length).toBeGreaterThanOrEqual(2);
      const pendingOverlapDecision = (executionId: string) =>
        context.database.prepare(`SELECT DISTINCT decision.decision_id,
 decision.revision
FROM journal_data_decisions decision
JOIN journal_source_row_issues issue
  ON issue.source_issue_id = decision.source_issue_id
JOIN journal_execution_provenance provenance
  ON provenance.source_row_id = issue.source_row_id
WHERE decision.state = 'pending' AND decision.target_kind = 'source_issue'
  AND issue.issue_code = 'overlap_count_ambiguous'
  AND provenance.execution_id = ?
ORDER BY decision.decision_id LIMIT 1`).get(executionId) as {
          decision_id: string;
          revision: number;
        };
      const mergeDecision = pendingOverlapDecision(ambiguous[0].execution_id);
      context.decisions.resolve(context.accountScope, {
        action: "merge_supported_duplicate",
        decisionId: mergeDecision.decision_id,
        expectedRevision: mergeDecision.revision,
        reasonCode: "statement_duplicate_confirmed",
        duplicateExecutionId: ambiguous[0].execution_id,
        retainedExecutionId: ambiguous[1].execution_id,
        expectedDuplicateVersionId: ambiguous[0].current_version_id,
      });
      expect(count(context.database, "journal_executions", "WHERE current_state = 'superseded'")).toBe(1);
      expect(() => context.decisions.openDecision(context.accountScope, {
        issueCode: "superseded_execution_review",
        effectCode: "position_chain_unavailable",
        target: { kind: "execution", executionId: ambiguous[0].execution_id },
      })).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");

      const retained = context.database.prepare(`SELECT current_version_id, current_state
FROM journal_executions WHERE execution_id = ?`).get(ambiguous[1].execution_id) as {
        current_version_id: string;
        current_state: string;
      };
      expect(retained.current_state).toBe("needs_decision");
      const keepDecision = pendingOverlapDecision(ambiguous[1].execution_id);
      context.decisions.resolve(context.accountScope, {
        action: "keep_distinct",
        decisionId: keepDecision.decision_id,
        expectedRevision: keepDecision.revision,
        reasonCode: "statement_occurrence_confirmed",
        executionId: ambiguous[1].execution_id,
        expectedCurrentVersionId: retained.current_version_id,
      });
      expect((context.database.prepare(`SELECT current_state FROM journal_executions
WHERE execution_id = ?`).get(ambiguous[1].execution_id) as { current_state: string }).current_state)
        .toBe("accepted");
    } finally {
      context.database.close();
    }
  });

  it("activates provider identity after the trader keeps an ambiguous fill distinct", () => {
    const context = setup();
    try {
      const original: Trade = {
        symbol: "PROVIDER",
        timestamp: "2026-01-09, 09:30:00",
        quantity: "10",
        price: "5",
        id: "",
      };
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [original],
        positions: [],
      }));
      const ambiguousImport = commitBroker(context, statement({
        period: "January 1, 2026 - February 28, 2026",
        trades: [
          { ...original, id: "PROVIDER-FILL-A" },
          { ...original, id: "PROVIDER-FILL-B" },
        ],
        positions: [],
      }), 1);
      const executionId = ambiguousImport.executionIds[0];
      const current = executionId
        ? context.database.prepare(`SELECT current_version_id, current_state
FROM journal_executions WHERE execution_id = ?`).get(executionId) as {
            current_version_id: string;
            current_state: string;
          } | undefined
        : undefined;
      if (!executionId || !current) {
        throw new Error("Expected an ambiguous provider execution");
      }
      expect(current?.current_state).toBe("needs_decision");

      const decision = context.database.prepare(`SELECT DISTINCT
 decision.decision_id, decision.revision
FROM journal_data_decisions decision
JOIN journal_source_row_issues issue
  ON issue.source_issue_id = decision.source_issue_id
JOIN journal_execution_provenance provenance
  ON provenance.source_row_id = issue.source_row_id
WHERE decision.state = 'pending' AND decision.target_kind = 'source_issue'
  AND issue.issue_code = 'overlap_count_ambiguous'
  AND provenance.execution_id = ?
ORDER BY decision.decision_id LIMIT 1`).get(executionId) as {
        decision_id: string;
        revision: number;
      };
      context.decisions.resolve(context.accountScope, {
        action: "keep_distinct",
        decisionId: decision.decision_id,
        expectedRevision: decision.revision,
        reasonCode: "broker_fill_identity_confirmed",
        executionId,
        expectedCurrentVersionId: current.current_version_id,
        now: new Date("2026-08-01T13:01:30.000Z"),
      });
      expect(count(
        context.database,
        "journal_execution_identity_aliases",
        "WHERE alias_type = 'broker_fill' AND status = 'active'",
      )).toBe(1);

      const overlap = commitBroker(context, statement({
        period: "January 1, 2026 - March 31, 2026",
        trades: [{ ...original, id: "PROVIDER-FILL-A" }],
        positions: [],
      }), 2);
      expect(overlap).toMatchObject({
        createdExecutionCount: 0,
        matchedExecutionCount: 1,
        pendingSourceDecisionCount: 0,
      });
      expect(count(context.database, "journal_executions")).toBe(3);
    } finally {
      context.database.close();
    }
  });

  it("supports missing executions, corrected position facts, and confirmed open positions", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [{ symbol: "OPEN", timestamp: "2026-01-10, 09:30:00", quantity: "10", price: "5", id: "O1" }],
        positions: [{ symbol: "OPEN", prior: "0", current: "10" }],
        openPositions: [{ symbol: "OPEN", quantity: "10" }],
      }));
      const chain = context.database.prepare(`SELECT v.chain_key_sha256
FROM journal_round_trips r
JOIN journal_round_trip_versions v ON v.round_trip_version_id = r.current_version_id
WHERE r.lifecycle_state = 'active'`).get() as { chain_key_sha256: string };
      const openFact = context.database.prepare(`SELECT position_fact_id
FROM journal_position_facts WHERE fact_kind = 'open_position'`).get() as {
        position_fact_id: string;
      };
      let decision = context.decisions.openDecision(context.accountScope, {
        issueCode: "open_position_review",
        effectCode: "position_chain_unavailable",
        target: { kind: "chain", chainKeySha256: chain.chain_key_sha256 },
      });
      context.decisions.resolve(context.accountScope, {
        action: "confirm_legitimate_open_position",
        decisionId: decision.decisionId,
        expectedRevision: decision.revision,
        reasonCode: "broker_position_confirmed",
        positionFactId: openFact.position_fact_id,
        idempotencyKey: "confirm-open-position-0001",
        sourceDisplayLabel: "Confirmed open position",
      });
      expect(count(context.database, "journal_position_facts", "WHERE fact_source = 'trader_correction'")).toBe(1);
      expect(() => context.decisions.openDecision(context.accountScope, {
        issueCode: "stale_position_review",
        effectCode: "position_chain_unavailable",
        target: { kind: "position_fact", positionFactId: openFact.position_fact_id },
      })).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");

      const currentFact = context.database.prepare(`SELECT position_fact_id
FROM journal_position_facts f
WHERE fact_kind = 'open_position' AND NOT EXISTS (
 SELECT 1 FROM journal_position_facts n WHERE n.supersedes_position_fact_id = f.position_fact_id
)
ORDER BY created_at_utc DESC LIMIT 1`).get() as { position_fact_id: string };
      decision = context.decisions.openDecision(context.accountScope, {
        issueCode: "position_quantity_review",
        effectCode: "position_chain_unavailable",
        target: { kind: "position_fact", positionFactId: currentFact.position_fact_id },
      });
      context.decisions.resolve(context.accountScope, {
        action: "correct_position_fact",
        decisionId: decision.decisionId,
        expectedRevision: decision.revision,
        reasonCode: "broker_quantity_corrected",
        priorPositionFactId: currentFact.position_fact_id,
        quantityDecimal: "0",
        idempotencyKey: "correct-open-position-0001",
        sourceDisplayLabel: "Corrected open position",
      });

      decision = context.decisions.openDecision(context.accountScope, {
        issueCode: "missing_execution_review",
        effectCode: "position_chain_unavailable",
        target: { kind: "chain", chainKeySha256: chain.chain_key_sha256 },
      });
      context.decisions.resolve(context.accountScope, {
        action: "add_missing_execution",
        decisionId: decision.decisionId,
        expectedRevision: decision.revision,
        reasonCode: "broker_execution_added",
        idempotencyKey: "missing-execution-entry-01",
        sourceDisplayLabel: "Missing execution",
        execution: {
          sourceTimestampText: "2026-01-11, 09:30:00",
          sourceTimezone: "America/New_York",
          normalizedSymbol: "OPEN",
          tradeCurrency: "USD",
          side: "sell",
          quantityDecimal: "10",
          priceDecimal: "6",
          feesDecimal: null,
          feeCurrency: null,
          feeSignConvention: "not_reported",
        },
      });
      expect(count(context.database, "journal_executions")).toBe(2);
      expect(count(context.database, "journal_data_decision_events", "WHERE action = 'add_missing_execution'")).toBe(1);
    } finally {
      context.database.close();
    }
  });

  it("binds position-correction idempotency and exact UTC to immutable semantics", () => {
    const context = setup();
    try {
      const instrumentId = "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb";
      new JournalImportRepository(context.database).findOrCreateInstrument({
        instrumentId,
        workspaceId: context.scope.workspaceId,
        assetClass: "stock",
        normalizedSymbol: "POSITIONINVARIANT",
        quoteCurrency: "USD",
        timestamp: "2026-08-01T14:10:00.000Z",
      });
      type PositionCorrectionInput = Readonly<{
        instrumentId: string;
        currency: string;
        factKind: "opening_balance" | "closing_balance" | "open_position" | "current_position";
        effectiveLocalDate: string;
        timePrecision: "date" | "day_start" | "day_end" | "exact";
        sourceTimeText?: string | null;
        sourceTimezone: string;
        effectiveAtUtc?: string | null;
        quantityDecimal: string;
        factVersion?: "trader_correction_v1" | "trader_confirmed_open_v1";
        supersedesPositionFactId: string | null;
        idempotencyKey: string;
        sourceDisplayLabel: string;
        now?: Date;
      }>;
      const positionCorrections = context.decisions as unknown as {
        createPositionCorrection(
          scope: typeof context.accountScope,
          input: PositionCorrectionInput,
        ): string;
      };
      const coherentExactCorrection: PositionCorrectionInput = {
        instrumentId,
        currency: "USD",
        factKind: "open_position",
        effectiveLocalDate: "2026-01-05",
        timePrecision: "exact",
        sourceTimeText: "2026-01-05, 09:30:00",
        sourceTimezone: "America/New_York",
        effectiveAtUtc: "2026-01-05T14:30:00.000Z",
        quantityDecimal: "5",
        supersedesPositionFactId: null,
        idempotencyKey: "position-version-semantics-0001",
        sourceDisplayLabel: "Synthetic exact position correction",
        now: new Date("2026-08-01T14:11:00.000Z"),
      };
      const correctedFactId = positionCorrections.createPositionCorrection(
        context.accountScope,
        coherentExactCorrection,
      );
      const correctionEvidence = context.database.prepare(`SELECT
 position_fact.fact_version, source_row.raw_fields_json,
 source_row.mapping_version AS row_mapping_version,
 import_batch.mapping_version AS batch_mapping_version,
 import_batch.mapping_contract_json
FROM journal_position_facts position_fact
JOIN journal_source_rows source_row
  ON source_row.source_row_id = position_fact.source_row_id
JOIN journal_import_batches import_batch
  ON import_batch.import_batch_id = position_fact.import_batch_id
WHERE position_fact.position_fact_id = ?`).get(correctedFactId) as {
        fact_version: string;
        raw_fields_json: string;
        row_mapping_version: string;
        batch_mapping_version: string;
        mapping_contract_json: string;
      };
      expect(correctionEvidence).toMatchObject({
        fact_version: "trader_correction_v1",
        row_mapping_version: "position_fact_mapping_v2",
        batch_mapping_version: "position_fact_mapping_v2",
        mapping_contract_json: JSON.stringify({ contractVersion: "position_fact_mapping_v2" }),
      });
      expect(JSON.parse(correctionEvidence.raw_fields_json)).toEqual(expect.arrayContaining([
        "position_fact_correction_v2",
        "trader_correction_v1",
      ]));

      expect(caughtFailure(() => positionCorrections.createPositionCorrection(
        context.accountScope,
        {
          ...coherentExactCorrection,
          factVersion: "trader_confirmed_open_v1",
        },
      ))).toMatchObject({
        code: "TRADERLINK_DATA_DECISION_CONFLICT",
        safeContext: { reason: "position_correction_idempotency" },
      });
      expect(count(
        context.database,
        "journal_position_facts",
        "WHERE fact_version = 'trader_confirmed_open_v1'",
      )).toBe(0);

      expect(caughtFailure(() => positionCorrections.createPositionCorrection(
        context.accountScope,
        {
          ...coherentExactCorrection,
          effectiveLocalDate: "2026-01-06",
          sourceTimeText: null,
          idempotencyKey: "position-exact-date-mismatch-01",
        },
      ))).toMatchObject({
        code: "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED",
        safeContext: {
          field: "positionFactTime",
          reason: "exact_local_date_mismatch",
        },
      });
      expect(caughtFailure(() => positionCorrections.createPositionCorrection(
        context.accountScope,
        {
          ...coherentExactCorrection,
          sourceTimeText: "2026-01-05, 09:31:00",
          idempotencyKey: "position-exact-time-mismatch-01",
        },
      ))).toMatchObject({
        code: "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED",
        safeContext: {
          field: "positionFactTime",
          reason: "exact_local_time_mismatch",
        },
      });
      expect(count(context.database, "journal_position_facts")).toBe(1);
    } finally {
      context.database.close();
    }
  });

  it("binds an imported execution issue to the execution evidenced by its source row", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "LINKED", timestamp: "2026-01-12, 09:30:00", quantity: "1", price: "", id: "LINK-1" },
          { symbol: "OTHER", timestamp: "2026-01-12, 10:30:00", quantity: "1", price: "2", id: "OTHER-1" },
        ],
        positions: [
          { symbol: "LINKED", prior: "0", current: "1" },
          { symbol: "OTHER", prior: "0", current: "1" },
        ],
      }));
      const decision = context.database.prepare(`SELECT decision_id, revision
FROM journal_data_decisions
WHERE state = 'pending' AND issue_code = 'execution_price_missing'`).get() as {
        decision_id: string;
        revision: number;
      };
      const executions = context.database.prepare(`SELECT e.execution_id,
 e.current_version_id, i.normalized_symbol
FROM journal_executions e
JOIN journal_execution_versions v ON v.execution_version_id = e.current_version_id
JOIN journal_instruments i ON i.instrument_id = v.instrument_id
WHERE i.normalized_symbol IN ('LINKED', 'OTHER')`).all() as Array<{
        execution_id: string;
        current_version_id: string;
        normalized_symbol: string;
      }>;
      const linked = executions.find((entry) => entry.normalized_symbol === "LINKED")!;
      const unrelated = executions.find((entry) => entry.normalized_symbol === "OTHER")!;
      expect(() => context.decisions.resolve(context.accountScope, {
        action: "set_execution_order",
        decisionId: decision.decision_id,
        expectedRevision: decision.revision,
        reasonCode: "wrong_action_for_price_issue",
        executionId: linked.execution_id,
        expectedCurrentVersionId: linked.current_version_id,
        sameTimestampSequence: 1,
        idempotencyKey: "wrong-price-order-action-01",
        sourceDisplayLabel: "Wrong price action",
      })).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");
      expect(() => context.decisions.resolve(context.accountScope, {
        action: "exclude_execution",
        decisionId: decision.decision_id,
        expectedRevision: decision.revision,
        reasonCode: "wrong_row_attempt",
        executionId: unrelated.execution_id,
        expectedCurrentVersionId: unrelated.current_version_id,
      })).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");
      context.decisions.resolve(context.accountScope, {
        action: "exclude_execution",
        decisionId: decision.decision_id,
        expectedRevision: decision.revision,
        reasonCode: "statement_row_excluded",
        executionId: linked.execution_id,
        expectedCurrentVersionId: linked.current_version_id,
      });
    } finally {
      context.database.close();
    }
  });

  it("lets the trader supply a missing position fact from statement evidence", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "January 1, 2026 - January 31, 2026",
        trades: [
          { symbol: "POSITION", timestamp: "2026-01-13, 09:30:00", quantity: "1", price: "3", id: "POSITION-1" },
        ],
        positions: [{ symbol: "POSITION", prior: "0", current: "invalid" }],
      }));
      const decision = context.database.prepare(`SELECT decision_id, revision
FROM journal_data_decisions
WHERE state = 'pending' AND issue_code = 'position_fact_closing_balance_quantity_invalid'`).get() as {
        decision_id: string;
        revision: number;
      };
      const instrument = context.database.prepare(`SELECT instrument_id
FROM journal_instruments WHERE normalized_symbol = 'POSITION'`).get() as {
        instrument_id: string;
      };
      expect(() => context.decisions.resolve(context.accountScope, {
        action: "supply_position_fact",
        decisionId: decision.decision_id,
        expectedRevision: decision.revision,
        reasonCode: "wrong_position_fact_kind",
        instrumentId: instrument.instrument_id,
        currency: "USD",
        factKind: "opening_balance",
        effectiveLocalDate: "2026-01-01",
        timePrecision: "day_start",
        sourceTimezone: "America/New_York",
        quantityDecimal: "0",
        idempotencyKey: "supply-position-wrong-kind-01",
        sourceDisplayLabel: "Wrong statement position fact",
      })).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");
      expect(() => context.decisions.resolve(context.accountScope, {
        action: "supply_position_fact",
        decisionId: decision.decision_id,
        expectedRevision: decision.revision,
        reasonCode: "wrong_position_fact_time",
        instrumentId: instrument.instrument_id,
        currency: "USD",
        factKind: "closing_balance",
        effectiveLocalDate: "2026-01-30",
        timePrecision: "day_end",
        sourceTimezone: "America/New_York",
        quantityDecimal: "1",
        idempotencyKey: "supply-position-wrong-time-01",
        sourceDisplayLabel: "Wrong statement position time",
      })).toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");
      context.decisions.resolve(context.accountScope, {
        action: "supply_position_fact",
        decisionId: decision.decision_id,
        expectedRevision: decision.revision,
        reasonCode: "statement_closing_position_supplied",
        instrumentId: instrument.instrument_id,
        currency: "USD",
        factKind: "closing_balance",
        effectiveLocalDate: "2026-01-31",
        timePrecision: "day_end",
        sourceTimezone: "America/New_York",
        quantityDecimal: "1",
        idempotencyKey: "supply-position-fact-0001",
        sourceDisplayLabel: "Statement closing position correction",
      });
      expect(count(context.database, "journal_position_facts", "WHERE fact_source = 'trader_correction'"))
        .toBe(1);
    } finally {
      context.database.close();
    }
  });

  it("lets the trader supply statement coverage from reviewed source evidence", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "",
        trades: [
          { symbol: "COVERAGE", timestamp: "2026-01-14, 09:30:00", quantity: "1", price: "4", id: "COVERAGE-1" },
        ],
        positions: [],
      }));
      const decision = context.database.prepare(`SELECT decision_id, revision
FROM journal_data_decisions
WHERE state = 'pending' AND issue_code = 'statement_period_missing'`).get() as {
        decision_id: string;
        revision: number;
      };
      const resolution = {
        action: "supply_coverage_fact" as const,
        decisionId: decision.decision_id,
        expectedRevision: decision.revision,
        reasonCode: "statement_period_verified",
        assetClass: "stock" as const,
        coverageKind: "complete" as const,
        localStartDate: "2026-01-01",
        localEndDate: "2026-01-31",
        sourceTimezone: "UTC",
        idempotencyKey: "supply-coverage-fact-0001",
        sourceDisplayLabel: "Statement coverage correction",
      };
      expect(() => context.decisions.resolve(context.accountScope, resolution))
        .toThrowError("TRADERLINK_DATA_DECISION_INVALID_ACTION");
      context.decisions.resolve(context.accountScope, {
        ...resolution,
        sourceTimezone: "America/New_York",
      });
      expect(count(
        context.database,
        "journal_source_coverage_intervals",
        "WHERE coverage_kind = 'complete' AND source_timezone = 'America/New_York'",
      )).toBe(1);
      expect(count(
        context.database,
        "journal_source_rows",
        "WHERE initial_classification = 'mapped_coverage_fact'",
      )).toBe(1);
      expect(context.database.prepare(`SELECT resulting_coverage_interval_id
FROM journal_data_decision_events
WHERE action = 'supply_coverage_fact'`).get()).toEqual({
        resulting_coverage_interval_id: expect.any(String),
      });
    } finally {
      context.database.close();
    }
  });

  it("records a trader-accepted source limitation without inventing complete coverage", () => {
    const context = setup();
    try {
      commitBroker(context, statement({
        period: "",
        trades: [
          { symbol: "UNKNOWN", timestamp: "2026-01-14, 09:30:00", quantity: "1", price: "4", id: "UNKNOWN-1" },
        ],
        positions: [],
      }));
      const decision = context.database.prepare(`SELECT decision_id, revision
FROM journal_data_decisions
WHERE state = 'pending' AND issue_code = 'statement_period_missing'`).get() as {
        decision_id: string;
        revision: number;
      };
      context.decisions.resolve(context.accountScope, {
        action: "accept_source_limitation",
        decisionId: decision.decision_id,
        expectedRevision: decision.revision,
        reasonCode: "statement_period_not_available",
        reasonText: "The source statement does not provide a reliable period.",
      });
      expect(count(context.database, "journal_data_decisions", "WHERE state = 'resolved' AND issue_code = 'statement_period_missing'"))
        .toBe(1);
      expect(count(context.database, "journal_source_coverage_intervals", "WHERE coverage_kind = 'unknown'"))
        .toBe(1);
      expect(count(context.database, "journal_source_coverage_intervals", "WHERE coverage_kind = 'complete'"))
        .toBe(0);
      expect(context.database.prepare(`SELECT current_state, pending_decision_count
FROM journal_import_batches WHERE source_system = 'ibkr'`).get()).toEqual({
        current_state: "accepted",
        pending_decision_count: 0,
      });
      expect(context.database.prepare(`SELECT event_sequence, prior_state, new_state,
 reason_code
FROM journal_import_events
WHERE event_sequence = 2`).get()).toEqual({
        event_sequence: 2,
        prior_state: "accepted_with_decisions",
        new_state: "accepted",
        reason_code: "all_import_decisions_resolved",
      });
      expect(context.coverage.coverageSummary(context.accountScope).decisions)
        .toMatchObject({
          resolvedByAction: { accept_source_limitation: 1 },
          acceptedSourceLimitationsByIssue: { statement_period_missing: 1 },
        });
      expect(context.decisions.openImportIssueDecisions(
        context.accountScope,
        (context.database.prepare(`SELECT import_batch_id
FROM journal_import_batches WHERE source_system = 'ibkr'`).get() as {
          import_batch_id: string;
        }).import_batch_id,
      ).find((candidate) => candidate.issueCode === "statement_period_missing")?.state)
        .toBe("resolved");
      expect(count(
        context.database,
        "journal_data_decisions",
        "WHERE issue_code = 'statement_period_missing'",
      )).toBe(1);
    } finally {
      context.database.close();
    }
  });

  it("reports unsupported asset categories through privacy-safe canonical buckets", () => {
    const context = setup();
    try {
      const csvText = [
        statement({
          period: "January 1, 2026 - January 31, 2026",
          trades: [],
          positions: [],
        }),
        'Trades,Data,Order,SYNTH-PRIVATE-ASSET,USD,SYNTHETIC,"2026-01-05, 09:30:00",1,1,,SYNTH-FILL',
      ].join("\r\n");
      commitBroker(context, csvText);
      const coverage = context.coverage.coverageSummary(context.accountScope);
      expect(coverage.unsupportedSourceRecords).toEqual({
        total: 1,
        byAssetCategory: { other: 1 },
      });
      expect(JSON.stringify(coverage)).not.toContain("SYNTH-PRIVATE-ASSET");
      expect(JSON.stringify(coverage)).not.toContain("SYNTHETIC");
      expect(JSON.stringify(coverage)).not.toContain("SYNTH-FILL");
    } finally {
      context.database.close();
    }
  });
});
