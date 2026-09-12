import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { indicatorTradingDay, normalizeIndicatorSessions, indicatorVwapCoverage, indicatorMarketDate }
  from "../lib/live-watchlist/indicators/indicator-sessions.ts";

const calendar = JSON.parse(await readFile(new URL("../modules/coach/server/market-calendar/us-equities-review-calendar.v1.json", import.meta.url), "utf8"));
let assertions = 0;
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
const iso = n => new Date(n).toISOString();
const winter = indicatorTradingDay(calendar, "2026-03-06"), summer = indicatorTradingDay(calendar, "2026-03-09");
equal(iso(winter.preOpen), "2026-03-06T09:00:00.000Z");
equal(iso(summer.preOpen), "2026-03-09T08:00:00.000Z");
equal(iso(indicatorTradingDay(calendar, "2026-11-02").regularOpen), "2026-11-02T14:30:00.000Z");
equal(indicatorTradingDay(calendar, "2026-09-07"), null);
equal(indicatorTradingDay(calendar, "2026-09-12"), null);
equal(indicatorTradingDay(calendar, "2027-01-04"), undefined);
const early = indicatorTradingDay(calendar, "2026-11-27");
equal(iso(early.regularClose), "2026-11-27T18:00:00.000Z");
equal(iso(early.postClose), "2026-11-27T22:00:00.000Z");
equal(indicatorMarketDate(Date.parse("2026-09-12T00:15:00Z")), "2026-09-11");
const bar = start => ({ start, open: 2, high: 2.1, low: 1.9, close: 2, volume: 100 });
const partial = normalizeIndicatorSessions({ calendar, timeframe: "5m", completedThrough: summer.regularOpen + 4 * 60_000,
  bars: [bar(summer.regularOpen), bar(summer.regularOpen - 5 * 60_000)] });
equal(partial.candles.length, 1); equal(partial.candles[0].sessionKey, "2026-03-09:pre");
equal(partial.excluded.incomplete, 1);
const misaligned = normalizeIndicatorSessions({ calendar, timeframe: "15m", completedThrough: summer.postClose,
  bars: [bar(summer.regularOpen + 60_000), bar(summer.regularOpen)] });
equal(misaligned.candles.length, 1); equal(misaligned.excluded.alignment, 1);
const daily = normalizeIndicatorSessions({ calendar, timeframe: "1d", completedThrough: early.regularClose - 1,
  bars: [bar(early.regularOpen)] });
equal(daily.candles.length, 0); equal(daily.excluded.incomplete, 1);
equal(normalizeIndicatorSessions({ calendar, timeframe: "1d", completedThrough: early.regularClose,
  bars: [bar(early.preOpen)] }).candles[0].end, early.regularClose);
const candles = normalizeIndicatorSessions({ calendar, timeframe: "1m", completedThrough: summer.preOpen + 120_000,
  bars: [bar(summer.preOpen), bar(summer.preOpen + 60_000)] }).candles;
equal(indicatorVwapCoverage({ candles, day: summer, completedThrough: summer.preOpen + 120_000 }).complete, true);
equal(indicatorVwapCoverage({ candles: candles.slice(1), day: summer, completedThrough: summer.preOpen + 120_000 }).missingMinutes, 1);
equal(indicatorVwapCoverage({ candles: candles.slice(1), day: summer, completedThrough: summer.preOpen + 120_000,
  confirmedNoTradeMinutes: new Set([summer.preOpen]) }).complete, true);
equal(indicatorVwapCoverage({ candles, day: summer, completedThrough: summer.preOpen }).complete, false);
equal(indicatorVwapCoverage({ candles, day: early, completedThrough: early.postClose + 60_000 }).expectedMinutes, 780);
console.log(`PASS: ${assertions} offline session/calendar assertions, including DST, holiday/early-close boundaries, completed native bars and exact same-day VWAP coverage. No provider requests.`);
