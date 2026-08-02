import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import type {
  MarketDataProvider,
  MarketDataRequest,
  NormalizedMarketCandle,
} from "../contracts/candle-review-contracts";
import { CandleReviewRepository } from "./candle-review-repository";
import { CandleReviewService } from "./candle-review-service";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function id(sequence: number): string {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

const at = "2026-08-02T12:00:00.000Z";
const workspaceId = id(2);
const userId = id(1);

function scope(accountId: string): AccountScope {
  return Object.freeze({ userId, workspaceId, workspaceRole: "owner" as const, accountId });
}

function setup(): Database.Database {
  const root = mkdtempSync(join(tmpdir(), "traderlink-candle-review-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "journal.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date(at) });
  database.transaction(() => {
    database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'test', 'owner', 'Owner', 'active', ?, ?)`).run(userId, at, at);
    database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Workspace', 'America/New_York', 'active', ?, ?)`).run(workspaceId, at, at);
    database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(workspaceId, userId, userId, at, at);
    for (const accountId of [id(10), id(20)]) {
      database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Journal', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
        .run(accountId, workspaceId, userId, at, at);
    }
  }).immediate();
  return database;
}

function seedTrade(
  database: Database.Database,
  accountId: string,
  sequence: number,
  openedAtUtc = "2026-08-02T13:30:00.000Z",
  closedAtUtc = "2026-08-02T14:00:00.000Z",
): string {
  const instrumentId = id(sequence);
  const rebuildId = id(sequence + 1);
  const roundTripId = id(sequence + 2);
  const roundTripVersionId = id(sequence + 3);
  const executionIds = [id(sequence + 4), id(sequence + 5)];
  const versionIds = [id(sequence + 6), id(sequence + 7)];
  database.transaction(() => {
    database.prepare(`INSERT INTO journal_instruments (
  instrument_id, workspace_id, asset_class, normalized_symbol, quote_currency,
  venue, identity_scheme_version, provider_identity_sha256, status, created_at_utc, updated_at_utc
) VALUES (?, ?, 'stock', 'TEST', 'USD', NULL, NULL, NULL, 'active', ?, ?)`)
      .run(instrumentId, workspaceId, at, at);
    for (let index = 0; index < 2; index += 1) {
      database.prepare(`INSERT INTO journal_executions (
  execution_id, workspace_id, account_id, current_version_id, current_state,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'accepted', ?, ?)`)
        .run(executionIds[index], workspaceId, accountId, versionIds[index], at, at);
      database.prepare(`INSERT INTO journal_execution_versions (
  execution_version_id, workspace_id, account_id, execution_id, version_number,
  instrument_id, trade_currency, source_timestamp_text, source_timezone,
  time_parser_version, executed_at_utc, source_order_key, side, quantity_decimal,
  price_decimal, fees_decimal, fee_currency, fee_sign_convention,
  fact_completeness, actor_kind, actor_user_id, change_reason_code, created_at_utc
) VALUES (?, ?, ?, ?, 1, ?, 'USD', ?, 'America/New_York', 'iso_v1', ?, ?, ?,
  '10', ?, NULL, NULL, 'not_reported', 'complete', 'system', NULL, 'test_seed', ?)`)
        .run(versionIds[index], workspaceId, accountId, executionIds[index], instrumentId,
          index === 0 ? openedAtUtc : closedAtUtc,
          index === 0 ? openedAtUtc : closedAtUtc,
          String(index + 1), index === 0 ? "buy" : "sell",
          index === 0 ? "10" : "12", at);
    }
    database.prepare(`INSERT INTO journal_chain_rebuilds (
  rebuild_id, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, trigger_kind, trigger_import_event_id, trigger_decision_event_id,
  maintenance_reason_code, previous_rebuild_id, algorithm_version,
  ordered_input_sha256, output_sha256, coverage_state, ready_closed_count,
  legitimate_open_count, needs_decision_count, excluded_count,
  first_execution_at_utc, last_execution_at_utc, completed_at_utc
) VALUES (?, ?, ?, ?, 'USD', ?, 'maintenance', NULL, NULL, 'candle_review_test',
  NULL, 'round_trip_v1', ?, ?, 'complete', 1, 0, 0, 0, ?, ?, ?)`)
      .run(rebuildId, workspaceId, accountId, instrumentId, digest(`chain-${sequence}`),
        digest(`input-${sequence}`), digest(`output-${sequence}`), openedAtUtc, closedAtUtc, at);
    database.prepare(`INSERT INTO journal_round_trips (
  round_trip_id, workspace_id, account_id, current_version_id,
  lifecycle_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', ?, ?)`)
      .run(roundTripId, workspaceId, accountId, roundTripVersionId, at, at);
    database.prepare(`INSERT INTO journal_round_trip_versions (
  round_trip_version_id, workspace_id, account_id, round_trip_id, version_number,
  rebuild_id, instrument_id, trade_currency, chain_key_sha256, direction,
  opened_at_utc, closed_at_utc, final_position_decimal, projection_state,
  coverage_reason_code, projection_fingerprint_sha256, created_at_utc
) VALUES (?, ?, ?, ?, 1, ?, ?, 'USD', ?, 'long', ?, ?, '0', 'ready_closed', NULL, ?, ?)`)
      .run(roundTripVersionId, workspaceId, accountId, roundTripId, rebuildId,
        instrumentId, digest(`chain-${sequence}`), openedAtUtc, closedAtUtc,
        digest(`projection-${sequence}`), at);
    for (let index = 0; index < 2; index += 1) {
      database.prepare(`INSERT INTO journal_round_trip_execution_allocations (
  allocation_id, workspace_id, account_id, round_trip_version_id,
  execution_version_id, allocation_sequence, allocation_role,
  quantity_decimal, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, '10', ?)`)
        .run(id(sequence + 8 + index), workspaceId, accountId, roundTripVersionId,
          versionIds[index], index + 1, index === 0 ? "opening" : "closing", at);
    }
  }).immediate();
  return roundTripId;
}

function candles(startTime: number, endTime: number, step: number): readonly NormalizedMarketCandle[] {
  return Object.freeze(Array.from(
    { length: Math.floor((endTime - startTime) / step) + 1 },
    (_, index) => Object.freeze({
      time: startTime + index * step,
      openDecimal: "10",
      highDecimal: "13",
      lowDecimal: "9",
      closeDecimal: "11",
      volumeDecimal: "100",
    }),
  ));
}

class FixtureProvider implements MarketDataProvider {
  readonly requests: MarketDataRequest[] = [];
  async fetch(request: MarketDataRequest) {
    this.requests.push(request);
    const values = candles(request.startTime, request.endTime, request.interval === "1m" ? 60 : 86400);
    return Object.freeze({
      ok: true as const,
      candles: values,
      exchangeTimezone: "America/New_York",
      utcOffsetSeconds: -14400,
      normalizedCandleSha256: createHash("sha256")
        .update(`${JSON.stringify(values)}\n`, "utf8")
        .digest("hex"),
    });
  }
}

describe("CandleReviewService", () => {
  it("derives exact Journal facts, persists immutable normalized candles, and reuses the cooldown review", async () => {
    const database = setup();
    const roundTripId = seedTrade(database, id(10), 100);
    const provider = new FixtureProvider();
    const service = new CandleReviewService(
      new CandleReviewRepository(database),
      provider,
      () => new Date(at),
    );
    const first = await service.run(scope(id(10)), roundTripId);
    expect(first.reused).toBe(false);
    expect(first.record.status).toBe("ready");
    expect(first.record.target).toMatchObject({
      roundTripId,
      symbol: "TEST",
      entryPriceDecimal: "10",
      exitPriceDecimal: "12",
    });
    expect(first.record.candles.length).toBeGreaterThan(0);
    expect(provider.requests).toHaveLength(2);
    expect(provider.requests[0]).toMatchObject({
      symbol: "TEST",
      interval: "1m",
      includeExtendedHours: true,
    });
    const second = await service.run(scope(id(10)), roundTripId);
    expect(second.reused).toBe(true);
    expect(second.record.candleReviewId).toBe(first.record.candleReviewId);
    expect(provider.requests).toHaveLength(2);
    expect(database.prepare("SELECT COUNT(*) AS count FROM journal_round_trip_candle_reviews").get()).toEqual({ count: 1 });
    expect(database.prepare("SELECT COUNT(*) AS count FROM journal_round_trip_candle_review_versions").get()).toEqual({ count: 1 });
    expect(() => database.prepare("UPDATE level_analysis_normalized_candles SET close_decimal = '12'").run()).toThrow();
    expect(service.pageModel(scope(id(20)), roundTripId, digest("selection"))).toBeNull();

    const refreshed = await new CandleReviewService(
      new CandleReviewRepository(database),
      provider,
      () => new Date("2026-08-02T12:02:00.000Z"),
    ).run(scope(id(10)), roundTripId);
    expect(refreshed.reused).toBe(false);
    expect(refreshed.record.candleReviewId).toBe(first.record.candleReviewId);
    expect(refreshed.record.revision).toBe(2);
    expect(database.prepare("SELECT COUNT(*) AS count FROM journal_round_trip_candle_review_versions").get()).toEqual({ count: 2 });
    expect(() => database.prepare("UPDATE journal_round_trip_candle_review_versions SET review_status = 'no_coverage'").run()).toThrow();
    database.close();
  });

  it("records unsupported long-duration trades without calling a provider", async () => {
    const database = setup();
    const roundTripId = seedTrade(
      database,
      id(10),
      200,
      "2026-07-01T13:30:00.000Z",
      "2026-08-02T14:00:00.000Z",
    );
    const provider = new FixtureProvider();
    const result = await new CandleReviewService(
      new CandleReviewRepository(database),
      provider,
      () => new Date(at),
    ).run(scope(id(10)), roundTripId);
    expect(result.record.status).toBe("unsupported");
    expect(provider.requests).toEqual([]);
    expect(database.prepare("SELECT COUNT(*) AS count FROM level_analysis_market_data_requests").get()).toEqual({ count: 0 });
    database.close();
  });

  it("records provider unavailability without inventing candles or feedback", async () => {
    const database = setup();
    const roundTripId = seedTrade(database, id(10), 300);
    const provider: MarketDataProvider = {
      async fetch() {
        return Object.freeze({
          ok: false as const,
          code: "provider_unavailable" as const,
          failureReasonCode: "provider_request_failed",
          exchangeTimezone: null,
          utcOffsetSeconds: null,
        });
      },
    };
    const result = await new CandleReviewService(
      new CandleReviewRepository(database),
      provider,
      () => new Date(at),
    ).run(scope(id(10)), roundTripId);
    expect(result.record.status).toBe("provider_unavailable");
    expect(result.record.candles).toEqual([]);
    expect(database.prepare(`SELECT outcome, failure_reason_code, candle_count
FROM level_analysis_market_data_requests`).get()).toEqual({
      outcome: "provider_unavailable",
      failure_reason_code: "provider_request_failed",
      candle_count: 0,
    });
    expect(database.prepare("SELECT COUNT(*) AS count FROM level_analysis_normalized_candle_sets").get()).toEqual({ count: 0 });
    database.close();
  });
});
