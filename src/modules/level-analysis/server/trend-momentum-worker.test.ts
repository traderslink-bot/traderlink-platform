import assert from "node:assert/strict";
import { test } from "node:test";
import { LogicalTradeMoomooAnalyzerWorker } from "./logical-trade-moomoo-analyzer-worker";
import { analyzeDailyTrade } from "./daily-trade-analyzer";
import type { DailyTradeAnalyzerEvent, DailyTradeAnalyzerResult } from "../contracts/daily-trade-analyzer-contracts";
import type { ClaimedLogicalTradeAnalyzerJob } from "./logical-trade-analyzer-repository";

const start = Date.parse("2026-09-11T08:00:00.000Z") / 1000;
const candles = Array.from({ length: 401 }, (_, i) => ({ time: start + i * 60,
  openDecimal: "10", highDecimal: "12", lowDecimal: "9", closeDecimal: "10",
  volumeDecimal: "1000", turnoverDecimal: "10000" }));
const events: DailyTradeAnalyzerEvent[] = ([
  ["entry", "14:00"], ["temporary_flat", "14:03"], ["entry", "14:05"], ["final_exit", "14:10"],
] as const).map(([kind, time], i) => ({ eventId: String(i), sequence: i + 1, kind,
  executedAtUtc: `2026-09-11T${time}:00.000Z`, quantityDecimal: "1", priceDecimal: "10", feesDecimal: "0" }));

function fixture(prepare: () => Promise<unknown>) {
  const job = { attemptCount: 1, createdAtUtc: "2026-09-11T14:40:00.000Z",
    desiredCoverageEndUtc: "2026-09-11T14:40:00.000Z", jobId: "job", marketSessionSetId: "set",
    scope: { userId: "user", workspaceId: "workspace", accountId: "account", workspaceRole: "owner" },
    target: { logicalTradeId: "one-user-defined-trade", logicalTradeVersionId: "version", direction: "long",
      events, finalExitAtUtc: events[3].executedAtUtc, openedAtUtc: events[0].executedAtUtc,
      providerSymbol: "TEST", representativeRoundTripId: "member-one", tradingDateNewYork: "2026-09-11" },
  } as ClaimedLogicalTradeAnalyzerJob;
  const saved: { analyzed: DailyTradeAnalyzerResult; status: string }[] = [];
  let finished = 0, rescheduled = 0, released = 0, ready = 0;
  const logical = { claimNext: () => job, persistResult: (result: typeof saved[number]) => saved.push(result),
    finish: () => { finished++; }, reschedule: () => { rescheduled++; } };
  const repository = { readCurrentCandles: () => candles, currentSessionVersionId: () => "revision",
    currentSessionCoverageEnd: () => job.desiredCoverageEndUtc };
  const allowance = { release: () => { released++; } };
  type Args = ConstructorParameters<typeof LogicalTradeMoomooAnalyzerWorker>;
  const worker = new LogicalTradeMoomooAnalyzerWorker(logical as unknown as Args[0],
    repository as unknown as Args[1], allowance as unknown as Args[2],
    async () => { throw new Error("cached core must not fetch"); },
    { notifyReady: () => { ready++; } } as unknown as Args[4],
    () => new Date("2026-09-11T15:00:00.000Z"), { prepare } as unknown as Args[6]);
  return { worker, saved, counts: () => ({ finished, rescheduled, released, ready }) };
}

test("worker waits for history without publishing a completed result or losing reservation", async () => {
  const f = fixture(async () => ({ pending: true }));
  assert.equal(await f.worker.runOne(), true);
  assert.equal(f.saved.length, 0);
  assert.deepEqual(f.counts(), { finished: 0, rescheduled: 1, released: 0, ready: 0 });
});

test("history failure preserves the existing multi-cycle trade calculations", async () => {
  const f = fixture(async () => { throw new Error("fixture history failure"); });
  await f.worker.runOne();
  assert.equal(f.saved.length, 1);
  assert.equal(f.saved[0].status, "ready");
  const { trendMomentumUnavailableReason, ...core } = f.saved[0].analyzed;
  assert.equal(trendMomentumUnavailableReason, "history_unavailable");
  assert.deepEqual(core, analyzeDailyTrade({ candles, dailyRanges: [], direction: "long", events }));
  assert.deepEqual(core.eventSnapshots.map((s) => s.event.eventId), ["0", "1", "2", "3"]);
  assert.deepEqual(f.counts(), { finished: 1, rescheduled: 0, released: 1, ready: 1 });
});

test("ready indicator context is saved with all executions of one logical trade", async () => {
  const policy = { version: "fixture", minimumBars: { ema9: 9, ema20: 20, rsi14: 15 },
    maxAgeSeconds: 600, emaChangePercent: 0.02, rsiChangePoints: 2 };
  const f = fixture(async () => ({ pending: false, outcome: "complete", input: {
    history: { asOf: start + 400 * 60, completedRanges: [{ start, endExclusive: start + 400 * 60 }],
      candles: candles.map((c) => ({ time: c.time, open: 10, high: 12, low: 9, close: 10, volume: 1000, turnover: 10000 })) },
    session: { start, endExclusive: start + 16 * 3600 }, resetTimes: [], policies: { "1m": policy, "5m": policy },
  } }));
  await f.worker.runOne();
  assert.equal(f.saved.length, 1);
  assert.equal(f.saved[0].status, "ready");
  assert.deepEqual(f.saved[0].analyzed.trendMomentum!.executions.map((e) => e.eventId), ["0", "1", "2", "3"]);
  assert.equal(f.saved[0].analyzed.trendMomentum!.executions[0].sessionVwap!.value, 10);
  for (const snapshot of f.saved[0].analyzed.eventSnapshots) {
    assert.equal(snapshot.indicatorFilterContext!.eventId, snapshot.event.eventId);
    assert.equal(snapshot.indicatorFilterContext!.executedAtUtc, snapshot.event.executedAtUtc);
  }
  assert.deepEqual(f.saved[0].analyzed.eventSnapshots.map((snapshot) => { const core = { ...snapshot }; delete core.indicatorFilterContext; return core; }),
    analyzeDailyTrade({ candles, dailyRanges: [], direction: "long", events }).eventSnapshots);
});
