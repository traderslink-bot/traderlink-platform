import assert from "node:assert/strict";
import { test } from "vitest";
import { MoomooDailyTradeKlineMarketDataProvider } from "./moomoo-daily-trade-kline-market-data-provider";

const start = 1_800_000_000;
const request = { symbol: "TEST", interval: "1m" as const, startTime: start,
  endTime: start + 3600, includeExtendedHours: true as const };
const row = { time_key: (start + 60) * 1000, open: 10, high: 11, low: 9, close: 10,
  volume: 100, turnover: 1000 };
function provider(payload: unknown) {
  return new MoomooDailyTradeKlineMarketDataProvider(async () => "fixture-token",
    (async () => new Response(JSON.stringify(payload), { status: 200 })) as typeof fetch);
}

test("explicit pagination exhaustion proves complete sparse response", async () => {
  const result = await provider({ ret_code: 0, data: { kline_list: [row] },
    pagination: { has_more: false } }).fetch(request);
  assert.equal(result.ok, true);
  assert.equal(result.requestCoverage, "complete");
  if (result.ok) assert.equal(result.candles.length, 1);
});

test("missing pagination cannot prove complete history", async () => {
  const result = await provider({ ret_code: 0, data: { kline_list: [row] } }).fetch(request);
  assert.equal(result.ok, true);
  assert.equal(result.requestCoverage, "partial");
});

test("page cap with more data retains usable candles but marks history partial", async () => {
  const result = await provider({ ret_code: 0, data: { kline_list: [row], next_time: "next" },
    pagination: { has_more: true } }).fetch(request);
  assert.equal(result.ok, true);
  assert.equal(result.requestCoverage, "partial");
});

test("successful empty history differs from a provider rejection", async () => {
  const empty = await provider({ ret_code: 0, data: { kline_list: [] },
    pagination: { has_more: false } }).fetch(request);
  assert.equal(empty.ok, false);
  assert.equal(empty.requestCoverage, "complete");
  if (!empty.ok) assert.equal(empty.failureReasonCode, "moomoo_returned_no_candles");
  const rejected = await provider({ ret_code: -1, data: { kline_list: [] },
    pagination: { has_more: false } }).fetch(request);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.requestCoverage, "partial");
});
