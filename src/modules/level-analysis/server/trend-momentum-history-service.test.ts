import assert from "node:assert/strict";
import { test } from "vitest";
import { TrendMomentumHistoryService } from "./trend-momentum-history-service";
import type { TrendMomentumHistoryRepository } from "./trend-momentum-history-repository";
import type { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import type { ClaimedLogicalTradeAnalyzerJob } from "./logical-trade-analyzer-repository";
import type { MarketDataProviderResult, NormalizedMarketCandle } from "../contracts/candle-review-contracts";
import { newYorkExtendedSession } from "./daily-trade-analyzer-session";

for (const scenario of ["new", "refresh", "expired"] as const) test("worker history requests bounded ranges and reuses evidence; " + scenario, async () => {
  const session = newYorkExtendedSession("2026-09-11")!;
  let now = new Date((session.endTime + 3600) * 1000);
  const requestStartedAt = scenario === "expired" ? "2026-09-01T12:00:00Z" : now.toISOString();
  const ranges: { start: number; endExclusive: number }[] = [];
  const candles: NormalizedMarketCandle[] = [];
  const requests: { id: string; range: { start: number; endExclusive: number }; result?: MarketDataProviderResult }[] = [];
  const history = {
    recoverInterrupted: () => 0,
    compatibleEvidence: () => ({ ranges, candles }),
    read: () => requests.map((r) => ({ requested_start_seconds: r.range.start, requested_end_seconds: r.range.endExclusive,
      status: r.result ? "complete" : "requested", completed_at_utc: r.result ? now.toISOString() : null })),
    begin: ({ range }: {range: {start:number;endExclusive:number}}) => {
      const id = String(requests.length); requests.push({ id, range }); return id;
    },
    finish: ({ requestId, result }: {requestId:string;result:MarketDataProviderResult}) => {
      const request = requests.find((r) => r.id === requestId)!;
      request.result = result;
      if (result.ok && result.requestCoverage === "complete") { ranges.push(request.range); candles.push(...result.candles); }
      return true;
    },
  } as unknown as TrendMomentumHistoryRepository;
  let acquisitions = 0;
  const allowance = {
    designatedScope: () => ({ userId: "user", workspaceId: "workspace", accountId: "account", workspaceRole: "owner" }),
    hasHistoryReservation: () => true,
    historyRequestStartedAt: () => requestStartedAt,
    beginAcquisition: () => ({ acquisitionId: String(++acquisitions) }),
    completeAcquisition: () => {},
  } as unknown as SharedAnalyzerAllowanceRepository;
  const service = new TrendMomentumHistoryService(history, allowance, async () => ({
    fetch: async (range) => ({ ok: true as const, requestCoverage: "complete" as const,
      candles: Array.from({ length: Math.min(600, (range.endTime - range.startTime) / 60) }, (_, i) => ({
        time: range.startTime + i * 60, openDecimal: "10", highDecimal: "10", lowDecimal: "10",
        closeDecimal: "10", volumeDecimal: "100", turnoverDecimal: "1000",
      })), exchangeTimezone: "America/New_York", utcOffsetSeconds: -14400, normalizedCandleSha256: "fixture" }),
  }), () => now);
  const job = { jobId: "job", createdAtUtc: scenario !== "new" ? "2026-09-01T12:00:00Z" : now.toISOString(), marketSessionSetId: "session",
    scope: { userId: "user", workspaceId: "workspace", accountId: "account", workspaceRole: "owner" },
    target: { tradingDateNewYork: "2026-09-11", providerSymbol: "TEST",
      events: [{ eventId: "entry", executedAtUtc: new Date((session.startTime + 3600) * 1000).toISOString() }] },
  } as unknown as ClaimedLogicalTradeAnalyzerJob;
  const asOf = session.startTime + 7200;
  if (scenario === "expired") {
    const expired = await service.prepare(job, asOf);
    assert.equal(expired.pending, false);
    if (!expired.pending) assert.equal(expired.outcome, "provider_unavailable");
    assert.equal(acquisitions, 0);
    assert.equal(requests.length, 0);
    return;
  }
  for (let pass = 0; pass < 3; pass++) {
    assert.equal((await service.prepare(job, asOf)).pending, true);
    now = new Date(now.getTime() + 60_000);
  }
  const ready = await service.prepare(job, asOf);
  assert.equal(ready.pending, false);
  if (!ready.pending) assert.equal(ready.outcome, "complete");
  assert.equal(acquisitions, 3);
  assert.equal((await service.prepare(job, asOf)).pending, false);
  assert.equal(acquisitions, 3);
  assert.ok(requests.every((r) => r.range.endExclusive - r.range.start <= 86400));
});
