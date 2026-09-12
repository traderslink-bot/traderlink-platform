import assert from "node:assert/strict";
import { IndicatorRequestCoordinator } from "../lib/live-watchlist/indicators/indicator-request-coordinator.ts";
import { parseMoomooIndicatorPage, parseYahooIndicatorPage, indicatorHistoryUrl,
  fetchIndicatorHistory, createIndicatorHistoryBudget } from "../lib/live-watchlist/indicators/indicator-history-provider.ts";

const minute = 60_000, end = Date.parse("2026-09-11T14:00:00Z"), start = end - 60 * minute;
const row = (time, price = 3) => ({ time_key: time, open: price, high: price + .1, low: price - .1, close: price, volume: 100 });
const payload = (rows, more = false, next = undefined) => ({ ret_code: 0, data: { kline_list: rows, next_time: next }, pagination: { has_more: more } });
const request = { symbol: "TNON", timeframe: "1m", start, end };
let assertions = 0;
function equal(actual, expected) { assert.deepEqual(actual, expected); assertions++; }
equal(parseMoomooIndicatorPage(payload([row(end - minute), row(start)])).data.bars.map(b => b.start), [start, end - minute]);
equal(parseMoomooIndicatorPage(payload([row(start + minute)]), "1m").data.bars[0].start, start);
equal(parseMoomooIndicatorPage(payload([row(start)]), "1d").data.bars[0].start, start);
equal(parseMoomooIndicatorPage(payload([row(start + 5 * minute)]), "5m").data.bars[0].start, start);
equal(parseMoomooIndicatorPage(payload([row(start + 15 * minute)]), "15m").data.bars[0].start, start);
equal(parseMoomooIndicatorPage(payload(Array.from({ length: 960 }, (_, i) => row(start + (i + 1) * minute))), "1m").data.bars.length, 960);
equal(parseMoomooIndicatorPage(payload(Array.from({ length: 12001 }, (_, i) => row(start + (i + 1) * minute))), "1m").reason, "invalid_data");
equal(parseMoomooIndicatorPage(payload([row(start), row(start, 4)])).reason, "invalid_data");
equal(parseMoomooIndicatorPage(payload([{ ...row(start), close: null }])).reason, "invalid_data");
equal(parseMoomooIndicatorPage(payload([])).usable, false);
equal(parseMoomooIndicatorPage({ ret_code: -7 }).reason, "no_data");
equal(parseMoomooIndicatorPage({ ret_code: -3 }).requestAccepted, true);
equal(parseMoomooIndicatorPage({}).reason, "invalid_data");
equal(parseMoomooIndicatorPage({ ret_code: 0, data: { kline_list: [row(start)] } }).data.hasMore, null);
equal(parseMoomooIndicatorPage({ ret_code: 0, data: { kline_list: [row(end - minute)], next_time: end - 2 * minute } }).data.hasMore, true);
equal(parseMoomooIndicatorPage({ ret_code: 0, data: { kline_list: [row(start)], next_time: 0 } }).data.hasMore, false);
equal(parseMoomooIndicatorPage(payload([row(start)], false, end - minute)).reason, "invalid_data");
equal(parseMoomooIndicatorPage({ ret_code: 0, data: { kline_list: [row(start)], next_time: "bad" } }).reason, "invalid_data");
equal(parseMoomooIndicatorPage(payload([], true, start)).reason, "invalid_data");
const scaled = payload([row(start)]); scaled.data.volume_precision = 2;
equal(parseMoomooIndicatorPage(scaled).data.bars[0].volume, 1);
for (const [timeframe, ktype] of [["1m", "1"], ["5m", "6"], ["15m", "7"], ["1d", "2"]]) {
  const url = new URL(indicatorHistoryUrl("moomoo", { ...request, timeframe }));
  equal(url.searchParams.get("ktype"), ktype);
  equal(url.searchParams.get("autype"), "1");
  equal(url.searchParams.get("end"), timeframe === "1d" ? "2026-09-11" : "2026-09-12");
}
equal(new URL(indicatorHistoryUrl("moomoo", request, end - minute)).searchParams.get("end"), String(end - minute));
assert.throws(() => indicatorHistoryUrl("moomoo", { ...request, symbol: "../bad" })); assertions++;
const yahoo = { chart: { result: [{ meta: { exchangeTimezoneName: "America/New_York" }, timestamp: [start / 1000],
  indicators: { quote: [{ open: [3], high: [3.1], low: [2.9], close: [3], volume: [100] }] } }] } };
equal(parseYahooIndicatorPage(yahoo).data.bars[0].start, start);
yahoo.chart.result[0].indicators.quote[0].volume = [null];
equal(parseYahooIndicatorPage(yahoo).data.bars[0].volume, null);
equal(parseYahooIndicatorPage(yahoo).data.bars[0].close, 3);
equal(parseMoomooIndicatorPage(payload([{ ...row(start), volume: null }])).data.bars[0].volume, null);
equal(parseMoomooIndicatorPage(payload([{ ...row(start), volume: "not-volume" }])).reason, "invalid_data");
for (const key of ["open", "high", "low", "close", "volume"]) yahoo.chart.result[0].indicators.quote[0][key] = [null];
equal(parseYahooIndicatorPage(yahoo).data.hasMore, null);

const events = [], urls = [];
const coordinator = new IndicatorRequestCoordinator({ sleep: async () => {}, audit: e => events.push(e) });
const base = { provider: "moomoo", request, scope: "private-connection", consumer: "refresh:test", coordinator,
  accessToken: "secret-fixture-never-printed", budget: createIndicatorHistoryBudget() };
const fetched = await fetchIndicatorHistory({ ...base, fetcher: async (url, options) => {
  urls.push(url);
  equal(options.headers.Authorization, "Bearer secret-fixture-never-printed");
  equal(options.redirect, "error");
  return Response.json(urls.length === 1 ? payload([row(end)], true, end - 2 * minute) : payload([row(start + minute)]));
} });
equal(fetched.outcome, "complete"); equal(fetched.pages, 2); equal(fetched.transportIds.length, 2);
equal(base.budget.attemptsRemaining, 8);
equal(new URL(urls[1]).searchParams.get("end"), String(end - 2 * minute));
let cursorPages = 0;
const cursorOnly = await fetchIndicatorHistory({ ...base, scope: "cursor-only", budget: createIndicatorHistoryBudget(), fetcher: async () => {
  cursorPages++;
  return Response.json({ ret_code: 0, data: { kline_list: [row(cursorPages === 1 ? end : start + minute)], next_time: cursorPages === 1 ? end - 2 * minute : 0 } });
} });
equal(cursorPages, 2); equal(cursorOnly.outcome, "complete"); equal(cursorOnly.bars.length, 2);
assert.ok(!JSON.stringify(events).includes("secret-fixture")); assertions++;
assert.ok(!JSON.stringify(events).includes("private-connection")); assertions++;

let attempts = 0;
const budget = createIndicatorHistoryBudget();
const paged = await fetchIndicatorHistory({ ...base, scope: "retry", budget, fetcher: async () => {
  attempts++;
  if (attempts === 1) return new Response("private error", { status: 503 });
  return Response.json(payload([row(end - attempts * minute)], true, end - (attempts + 1) * minute));
} });
equal(attempts, 10); equal(paged.outcome, "budget_exhausted"); equal(paged.pages, 9);
equal(budget.retriesRemaining, 0); equal(budget.attemptsRemaining, 0);

const throttle = await fetchIndicatorHistory({ ...base, scope: "throttle", budget: createIndicatorHistoryBudget(), fetcher: async () =>
  new Response("sensitive vendor text", { status: 429, headers: { "retry-after": "240" } }) });
equal(throttle.outcome, "rate_limited"); equal(throttle.transportIds.length, 1);
equal(events.find(e => e.outcome === "rate_limited").retryAfterMs, 240_000);
equal(events.find(e => e.outcome === "rate_limited").httpStatus, 429);
assert.ok(!JSON.stringify(events).includes("sensitive")); assertions++;
const blocked = await fetchIndicatorHistory({ ...base, scope: "throttle", budget: createIndicatorHistoryBudget(),
  fetcher: async () => { throw Error("must not fetch while throttled"); } });
equal(blocked.outcome, "deferred"); equal(blocked.transportIds.length, 0);
const forbidden = await fetchIndicatorHistory({ ...base, scope: "permission", budget: createIndicatorHistoryBudget(),
  fetcher: async () => new Response("", { status: 403 }) });
equal(forbidden.outcome, "permission"); equal(forbidden.transportIds.length, 1);
const repeatedCursor = await fetchIndicatorHistory({ ...base, scope: "cursor", budget: createIndicatorHistoryBudget(),
  fetcher: async () => Response.json(payload([row(end - minute)], true, end - minute)) });
equal(repeatedCursor.outcome, "invalid_data"); equal(repeatedCursor.pages, 2);

const friday = Date.parse("2026-09-11T08:00:00Z"), thursday = friday - 86400000;
const dayUrls = [];
const datedFetcher = async url => {
  const date = new URL(url).searchParams.get("start"); dayUrls.push(date);
  const dayStart = date === "2026-09-11" ? friday : thursday;
  return Response.json(payload(Array.from({ length: 960 }, (_, i) => row(dayStart + (i + 1) * minute))));
};
const fullDay = await fetchIndicatorHistory({ ...base, scope: "dated-full", budget: createIndicatorHistoryBudget(),
  request: { symbol: "TRUG", timeframe: "1m", start: thursday, end: friday + 960 * minute },
  sufficientHistory: { minimumBars: 250, coverFrom: friday }, fetcher: datedFetcher });
equal(dayUrls, ["2026-09-11"]); equal(fullDay.bars.length, 960); equal(fullDay.outcome, "sufficient_history");
dayUrls.length = 0;
const earlyDay = await fetchIndicatorHistory({ ...base, scope: "dated-early", budget: createIndicatorHistoryBudget(),
  request: { symbol: "TRUG", timeframe: "1m", start: thursday, end: friday + 30 * minute },
  sufficientHistory: { minimumBars: 250, coverFrom: friday }, fetcher: datedFetcher });
equal(dayUrls, ["2026-09-11", "2026-09-10"]); equal(earlyDay.bars.length, 990);
equal(earlyDay.bars.at(-1).start, friday + 29 * minute); equal(earlyDay.transportIds.length, 2);
console.log(`PASS: ${assertions} offline history-adapter assertions (native timeframes, strict OHLCV, newest-date warm-up, pagination, HTTP budget, shared retry, throttle evidence and sanitization). No network requests.`);
