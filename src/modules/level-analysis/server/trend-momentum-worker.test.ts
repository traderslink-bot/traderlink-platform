import assert from "node:assert/strict";
import { test } from "vitest";
import { LogicalTradeAlpacaAnalyzerWorker } from "./logical-trade-alpaca-analyzer-worker";
import { newYorkExtendedSession, postSessionReconciliationAt } from "./daily-trade-analyzer-session";
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

function fixture(prepare: () => Promise<unknown>, options: { now?: string; cached?: boolean; refresh?: boolean; failed?: boolean; mismatch?: boolean; attempt?: number; finalized?: boolean } = {}) {
  const job = { attemptCount: options.attempt ?? 1, postSessionRefresh: options.refresh, createdAtUtc: "2026-09-11T14:40:00.000Z",
    desiredCoverageEndUtc: "2026-09-11T14:40:00.000Z", jobId: "job", marketSessionSetId: "set",
    scope: { userId: "user", workspaceId: "workspace", accountId: "account", workspaceRole: "owner" },
    target: { logicalTradeId: "one-user-defined-trade", logicalTradeVersionId: "version", direction: "long",
      events, finalExitAtUtc: events[3].executedAtUtc, openedAtUtc: events[0].executedAtUtc,
      providerSymbol: "TEST", representativeRoundTripId: "member-one", tradingDateNewYork: "2026-09-11" },
  } as ClaimedLogicalTradeAnalyzerJob;
  const saved: { analyzed: DailyTradeAnalyzerResult; status: string }[] = [];
  let finished = 0, rescheduled = 0, released = 0, ready = 0;
  const downloads: { startTime: number; endTime: number; interval: string }[] = [];
  const stored: { coverageEndUtc: string; requestedEndUtc: string; candles: readonly unknown[] }[] = [];
  const historyWindows: number[] = [];
  const scheduled: Date[] = [];
  const logical = { claimNext: () => job, persistResult: (result: typeof saved[number]) => saved.push(result),
    finish: () => { finished++; }, schedulePostSessionRefresh: (_id: string, at: Date) => { finished++; scheduled.push(at); }, reschedule: () => { rescheduled++; } };
  const repository = { readCurrentCandles: () => options.cached === false ? [] : candles,
    currentSessionRetrievedAt: () => options.finalized ? "2026-09-12T08:15:01.000Z" : null,
    currentSessionVersionId: () => "revision",
    currentSessionCoverageEnd: () => options.cached === false ? null : options.finalized ? "2026-09-12T00:00:00.000Z" : job.desiredCoverageEndUtc,
    persistMarketSession: (value: typeof stored[number]) => { stored.push(value); return "downloaded"; } };
  const allowance = { release: () => { released++; }, designatedScope: () => job.scope,
    beginAcquisition: () => ({ acquisitionId: "acquisition", chargeKind: "user_charged" }),
    completeAcquisition: () => {} };
  type Args = ConstructorParameters<typeof LogicalTradeAlpacaAnalyzerWorker>;
  const worker = new LogicalTradeAlpacaAnalyzerWorker(logical as unknown as Args[0],
    repository as unknown as Args[1], allowance as unknown as Args[2],
    async () => {
      if (options.cached !== false && !options.refresh) throw new Error("cached core must not fetch");
      return { fetch: async (request: typeof downloads[number]) => {
        downloads.push(request);
        if (options.failed) return { ok: false, code: "provider_unavailable", failureReasonCode: "fixture" };
        return { ok: true, candles: options.mismatch ? [] : Array.from({ length: (request.endTime - start) / 60 }, (_, i) => ({ ...candles[0], time: start + i * 60 })),
          exchangeTimezone: "America/New_York", utcOffsetSeconds: -14400, normalizedCandleSha256: "fixture" };
      } } as unknown as Awaited<ReturnType<Args[3]>>;
    },
    { notifyReady: () => { ready++; } } as unknown as Args[4],
    () => new Date(options.now ?? "2026-09-11T15:00:00.000Z"), { prepare,
      beginSession: (_job: unknown, _acquisition: string, _start: number, end: number) => { historyWindows.push(end); return "request"; },
      finishSession: () => {} } as unknown as Args[6]);
  return { worker, saved, downloads, stored, historyWindows, scheduled, counts: () => ({ finished, rescheduled, released, ready }) };
}

test("needed download captures available session through evening or full past day", async () => {
  for (const [now, expectedEnd] of [
    ["2026-09-11T22:42:37.000Z", "2026-09-11T22:42:00.000Z"],
    ["2026-09-12T02:00:00.000Z", "2026-09-12T00:00:00.000Z"],
    ["2026-09-14T16:00:00.000Z", "2026-09-12T00:00:00.000Z"],
  ]) {
    const f = fixture(async () => null, { now, cached: false });
    await f.worker.runOne();
    assert.equal(f.downloads.length, 1);
    assert.equal(f.downloads[0].startTime, start);
    assert.equal(f.downloads[0].endTime, Date.parse(expectedEnd) / 1000);
    assert.equal(f.downloads[0].interval, "1m");
    assert.deepEqual(f.historyWindows, [Date.parse(expectedEnd) / 1000]);
    assert.equal(f.stored[0].coverageEndUtc, expectedEnd);
    assert.equal(f.stored[0].requestedEndUtc, expectedEnd);
    assert.equal(f.saved[0].status, "ready");
    assert.deepEqual(f.saved[0].analyzed.eventSnapshots.map(s => s.event.eventId), ["0", "1", "2", "3"]);
  }
});

test("sufficient saved first-result coverage does not trigger an evening top-up download", async () => {
  const f = fixture(async () => null, { now: "2026-09-12T02:00:00.000Z" });
  await f.worker.runOne();
  assert.equal(f.downloads.length, 0);
  assert.equal(f.saved[0].status, "ready");
});

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
  assert.deepEqual(core, analyzeDailyTrade({ candles: candles, dailyRanges: [], direction: "long", events }));
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
    analyzeDailyTrade({ candles: candles, dailyRanges: [], direction: "long", events }).eventSnapshots);
});

test("same-day ready result schedules a free next-day refresh", async () => {
  const f = fixture(async () => null);
  await f.worker.runOne();
  assert.equal(f.saved[0].status, "ready");
  assert.deepEqual(f.scheduled.map((date) => date.toISOString()), ["2026-09-12T08:15:00.000Z"]);
});

test("refresh downloads the full session without a new allowance or ready notification", async () => {
  const f = fixture(async () => null, { refresh: true, now: "2026-09-12T08:15:00.000Z" });
  await f.worker.runOne();
  assert.equal(f.downloads[0].endTime, Date.parse("2026-09-12T00:00:00Z") / 1000);
  assert.equal(f.stored.length, 1);
  assert.equal(f.saved[0].status, "ready");
  assert.deepEqual(f.saved[0].analyzed.eventSnapshots.map((row) => row.event), events);
  assert.deepEqual(f.counts(), { finished: 1, rescheduled: 0, released: 0, ready: 0 });
});

test("refresh shares the finalized cache across trades", async () => {
  const f = fixture(async () => null, { refresh: true, finalized: true, now: "2026-09-12T08:16:00.000Z" });
  await f.worker.runOne();
  assert.equal(f.downloads.length, 0);
  assert.equal(f.saved[0].status, "ready");
});

test("refresh retries a provider outage and leaves the saved result untouched at exhaustion", async () => {
  for (const attempt of [1, 3]) {
    const f = fixture(async () => null, { refresh: true, failed: true, attempt, now: "2026-09-12T08:15:00.000Z" });
    await f.worker.runOne();
    assert.equal(f.saved.length, 0);
    assert.equal(f.stored.length, 0);
    assert.equal(f.counts().finished, attempt === 3 ? 1 : 0);
    assert.equal(f.counts().rescheduled, attempt === 1 ? 1 : 0);
  }
});

test("refresh retains its 4:15 Eastern schedule across daylight-saving transitions", () => {
  for (const [date, expected] of [
    ["2026-03-07", "2026-03-08T08:15:00.000Z"],
    ["2026-10-31", "2026-11-01T09:15:00.000Z"],
  ]) {
    assert.equal(postSessionReconciliationAt(newYorkExtendedSession(date)!).toISOString(), expected);
  }
});

test("refresh does not promote new bars that omit execution minutes", async () => {
  const f = fixture(async () => null, { refresh: true, mismatch: true, now: "2026-09-12T08:15:00.000Z" });
  await f.worker.runOne();
  assert.equal(f.saved.length, 0);
  assert.equal(f.stored.length, 0);
  assert.equal(f.counts().finished, 1);
});
