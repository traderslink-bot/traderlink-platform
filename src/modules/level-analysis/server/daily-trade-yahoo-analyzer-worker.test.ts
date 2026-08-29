import { describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";

import type { MarketDataProvider, NormalizedMarketCandle } from "../contracts/candle-review-contracts";
import type { ClaimedDailyTradeAnalyzerJob } from "./daily-trade-analyzer-repository";
import { DailyTradeAnalyzerRepository } from "./daily-trade-analyzer-repository";
import { DailyTradeMoomooAnalyzerWorker } from "./daily-trade-yahoo-analyzer-worker";

const ENTRY_MINUTE = Date.parse("2026-08-28T13:00:00.000Z") / 1000;
const EXIT_MINUTE = Date.parse("2026-08-28T13:01:00.000Z") / 1000;

function candle(time: number, low: string, high: string): NormalizedMarketCandle {
  return Object.freeze({
    closeDecimal: low,
    highDecimal: high,
    lowDecimal: low,
    openDecimal: low,
    time,
    turnoverDecimal: "1000",
    volumeDecimal: "100",
  });
}

function job(): ClaimedDailyTradeAnalyzerJob {
  return Object.freeze({
    attemptCount: 1,
    desiredCoverageEndUtc: "2026-08-28T13:31:00.000Z",
    jobId: "00000000-0000-4000-8000-000000000001",
    marketSessionSetId: "00000000-0000-4000-8000-000000000002",
    scope: Object.freeze({
      accountId: "00000000-0000-4000-8000-000000000003",
      userId: "00000000-0000-4000-8000-000000000004",
      workspaceId: "00000000-0000-4000-8000-000000000005",
      workspaceRole: "owner",
    }),
    target: Object.freeze({
      assetClass: "stock",
      direction: "long",
      events: Object.freeze([
        Object.freeze({
          eventId: "00000000-0000-4000-8000-000000000006",
          executedAtUtc: "2026-08-28T13:00:45.000Z",
          feesDecimal: null,
          kind: "entry",
          priceDecimal: "6.50",
          quantityDecimal: "500",
          sequence: 0,
        }),
        Object.freeze({
          eventId: "00000000-0000-4000-8000-000000000007",
          executedAtUtc: "2026-08-28T13:01:12.000Z",
          feesDecimal: null,
          kind: "final_exit",
          priceDecimal: "6.60",
          quantityDecimal: "500",
          sequence: 1,
        }),
      ]),
      finalExitAtUtc: "2026-08-28T13:01:12.000Z",
      openedAtUtc: "2026-08-28T13:00:45.000Z",
      providerSymbol: "AEMD",
      roundTripId: "00000000-0000-4000-8000-000000000008",
      roundTripVersionId: "00000000-0000-4000-8000-000000000009",
      tradingDateNewYork: "2026-08-28",
    }),
  });
}

function repository(
  cached: readonly NormalizedMarketCandle[],
  claimed: ClaimedDailyTradeAnalyzerJob = job(),
) {
  return {
    claimNextJob: vi.fn(() => claimed),
    currentSessionCoverageEnd: vi.fn(() => claimed.desiredCoverageEndUtc),
    currentSessionRetrievedAt: vi.fn(() => "2026-08-28T14:00:00.000Z"),
    currentSessionVersionId: vi.fn(() => "00000000-0000-4000-8000-000000000010"),
    finishJob: vi.fn(),
    persistAnalysis: vi.fn(),
    persistExecutionMismatches: vi.fn(),
    persistMarketSession: vi.fn(() => "00000000-0000-4000-8000-000000000011"),
    readCurrentCandles: vi.fn(() => cached),
    rescheduleJob: vi.fn(),
  };
}

describe("DailyTradeMoomooAnalyzerWorker execution refresh", () => {
  it("refreshes once and analyzes when revised provider candles match", async () => {
    const cached = [
      candle(ENTRY_MINUTE, "7.94", "8.08"),
      candle(EXIT_MINUTE, "6.55", "6.70"),
    ];
    const revised = [
      candle(ENTRY_MINUTE, "6.40", "6.55"),
      candle(EXIT_MINUTE, "6.55", "6.70"),
    ];
    const repo = repository(cached);
    const provider: MarketDataProvider = {
      fetch: vi.fn(async () => ({
        candles: revised,
        exchangeTimezone: "America/New_York",
        normalizedCandleSha256: "a".repeat(64),
        ok: true as const,
        utcOffsetSeconds: -14_400,
      })),
    };
    const worker = new DailyTradeMoomooAnalyzerWorker(
      repo as unknown as DailyTradeAnalyzerRepository,
      () => provider,
      () => new Date("2026-08-28T14:00:00.000Z"),
    );

    await worker.runOne();

    expect(provider.fetch).toHaveBeenCalledTimes(1);
    expect(repo.persistMarketSession).toHaveBeenCalledTimes(1);
    expect(repo.persistAnalysis).toHaveBeenCalledTimes(1);
    expect(repo.persistExecutionMismatches).not.toHaveBeenCalled();
  });

  it("persists every mismatch after the one provider refresh still disagrees", async () => {
    const unchanged = [
      candle(ENTRY_MINUTE, "7.94", "8.08"),
      candle(EXIT_MINUTE, "7.90", "8.10"),
    ];
    const repo = repository(unchanged);
    const provider: MarketDataProvider = {
      fetch: vi.fn(async () => ({
        candles: unchanged,
        exchangeTimezone: "America/New_York",
        normalizedCandleSha256: "b".repeat(64),
        ok: true as const,
        utcOffsetSeconds: -14_400,
      })),
    };
    const worker = new DailyTradeMoomooAnalyzerWorker(
      repo as unknown as DailyTradeAnalyzerRepository,
      () => provider,
      () => new Date("2026-08-28T14:00:00.000Z"),
    );

    await worker.runOne();

    expect(provider.fetch).toHaveBeenCalledTimes(1);
    expect(repo.persistExecutionMismatches).toHaveBeenCalledWith(expect.objectContaining({
      mismatches: expect.arrayContaining([
        expect.objectContaining({ enteredPriceDecimal: "6.50" }),
        expect.objectContaining({ enteredPriceDecimal: "6.60" }),
      ]),
    }));
    expect(repo.persistAnalysis).not.toHaveBeenCalled();
    expect(repo.finishJob).toHaveBeenCalledWith(job().jobId, "completed", expect.any(Date));
  });

  it("uses the final execution's containing minute for first-result readiness", async () => {
    const base = job();
    const claimed = Object.freeze({
      ...base,
      desiredCoverageEndUtc: "2026-08-28T14:01:59.000Z",
      target: Object.freeze({
        ...base.target,
        finalExitAtUtc: "2026-08-28T13:01:59.000Z",
        events: Object.freeze(base.target.events.map((event) => event.kind === "final_exit"
          ? Object.freeze({ ...event, executedAtUtc: "2026-08-28T13:01:59.000Z" })
          : event)),
      }),
    });
    const cached = [
      candle(ENTRY_MINUTE, "6.40", "6.55"),
      candle(EXIT_MINUTE, "6.55", "6.70"),
    ];
    const repo = repository(cached, claimed);
    const provider: MarketDataProvider = { fetch: vi.fn() };
    const worker = new DailyTradeMoomooAnalyzerWorker(
      repo as unknown as DailyTradeAnalyzerRepository,
      () => provider,
      () => new Date("2026-08-28T13:31:00.000Z"),
    );

    await worker.runOne();

    expect(provider.fetch).not.toHaveBeenCalled();
    expect(repo.persistAnalysis).toHaveBeenCalledWith(expect.objectContaining({ status: "ready" }));
  });
});

describe("DailyTradeAnalyzerRepository legacy first-result wakeup", () => {
  it("moves an old one-hour wake to the minute-aligned 30-minute boundary before claim", () => {
    const claimed = job();
    const rescheduleLegacy = vi.fn(() => ({ changes: 1 }));
    const lease = vi.fn(() => ({ changes: 1 }));
    const prepare = vi.fn((sql: string) => {
      if (sql.includes("SET status = 'expired'")) return { run: vi.fn() };
      if (sql.includes("version.closed_at_utc")) {
        return { all: () => [{
          closed_at_utc: "2026-08-28T13:01:59.000Z",
          daily_trade_job_id: claimed.jobId,
          desired_coverage_end_utc: "2026-08-28T14:01:59.000Z",
        }] };
      }
      if (sql.includes("SET next_attempt_at_utc = ?")) return { run: rescheduleLegacy };
      if (sql.includes("SELECT daily_trade_job_id, user_id")) {
        return { get: () => ({
          account_id: claimed.scope.accountId,
          attempt_count: 0,
          daily_trade_job_id: claimed.jobId,
          desired_coverage_end_utc: "2026-08-28T14:01:59.000Z",
          market_session_set_id: claimed.marketSessionSetId,
          round_trip_id: claimed.target.roundTripId,
          user_id: claimed.scope.userId,
          workspace_id: claimed.scope.workspaceId,
        }) };
      }
      if (sql.includes("SET status = 'leased'")) return { run: lease };
      throw new Error(`Unexpected SQL in queue regression test: ${sql}`);
    });
    const database = {
      prepare,
      transaction: (operation: () => unknown) => ({ immediate: operation }),
    } as unknown as Database.Database;
    const analyzerRepository = new DailyTradeAnalyzerRepository(database);
    vi.spyOn(analyzerRepository, "findEligibleTarget").mockReturnValue(claimed.target);

    const result = analyzerRepository.claimNextJob(new Date("2026-08-28T13:31:00.000Z"));

    expect(rescheduleLegacy).toHaveBeenCalledWith(
      "2026-08-28T13:31:00.000Z",
      "2026-08-28T13:31:00.000Z",
      claimed.jobId,
    );
    expect(lease).toHaveBeenCalledTimes(1);
    expect(result?.jobId).toBe(claimed.jobId);
  });
});
