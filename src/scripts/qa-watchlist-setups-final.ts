import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { evaluateWatchlistSetups } from "../lib/live-watchlist/setups/setup-engine";
import { createIndicatorCheckpoint } from "../lib/live-watchlist/indicators/indicator-engine";
import { normalizeIndicatorSessions } from "../lib/live-watchlist/indicators/indicator-sessions";
import { parseMoomooIndicatorPage } from "../lib/live-watchlist/indicators/indicator-history-provider";
import { WatchlistMoomooAdmission } from "../lib/live-watchlist/setups/setup-admission";
import { INITIAL_WATCHLIST_SETUP_KINDS } from "../lib/live-watchlist/setups/setup-contracts";
import calendar from "../modules/coach/server/market-calendar/us-equities-review-calendar.v1.json";
import type { IndicatorCalendar } from "../lib/live-watchlist/indicators/indicator-sessions";
import type { IndicatorCandle } from "../lib/live-watchlist/indicators/indicator-engine";
import type { WatchlistSetupInput } from "../lib/live-watchlist/setups/setup-input";

async function main() {
  globalThis.fetch = async () => { throw Error("No network in final setup QA"); };
  const cal = calendar as IndicatorCalendar;
  const settings = { enabled: true, enabledDetectors: [...INITIAL_WATCHLIST_SETUP_KINDS],
    sessions: ["premarket", "regular", "postmarket"] as const, showMemberCard: true,
    notifyForming: false, notifyConfirmed: false };
  const rows = readFileSync("data/scanner-verification-candles.jsonl", "utf8").trim().split(/\r?\n/u)
    .map(line => JSON.parse(line)).filter(value => value.symbol && Array.isArray(value.rows));
  const receipts = [];
  for (const record of rows) {
    const valid = record.rows.filter((row: any) => [row.open, row.high, row.low, row.close].every(value => Number.isFinite(value) && value > 0));
    const through = Math.max(...valid.map((row: any) => row.time_key));
    const page = parseMoomooIndicatorPage({ ret_code: record.providerCode,
      data: { kline_list: valid, volume_precision: 0 }, pagination: { has_more: false } }, "1m", through);
    assert.ok(page.ok); if (!page.ok) continue;
    const one = [...normalizeIndicatorSessions({ bars: page.data.bars, timeframe: "1m", calendar: cal, completedThrough: through }).candles];
    const five: IndicatorCandle[] = [];
    for (let index = 0; index + 5 <= one.length; index += 5) {
      const bars = one.slice(index, index + 5);
      if (bars[0].start % 300000 || bars.some((bar, i) => i > 0 && bar.start !== bars[i - 1].end)) continue;
      five.push({ ...bars[0], end: bars[4].end, high: Math.max(...bars.map(bar => bar.high)), low: Math.min(...bars.map(bar => bar.low)),
        close: bars[4].close, volume: bars.some(bar => bar.volume === null) ? null : bars.reduce((sum, bar) => sum + bar.volume!, 0) });
    }
    const frame = (name: "1m" | "5m", candles: IndicatorCandle[]) => ({ provider: "moomoo" as const,
      adjustment: "recorded", seriesKey: `recorded:${record.symbol}:${name}`,
      seed: createIndicatorCheckpoint(name, `recorded:${record.symbol}:${name}`), candles });
    const input: WatchlistSetupInput = { symbol: record.symbol, publicationIdentity: "00000000-0000-4000-8000-000000000001",
      revision: "offline-final-qa", receivedAt: through + 5000, calendar: cal, oneMinute: frame("1m", one), fiveMinute: frame("5m", five) };
    const full = evaluateWatchlistSetups(input, settings);
    const recordBytes = Buffer.byteLength(JSON.stringify({ version: 1, configurationRevision: 1, input, evaluation: full }));
    const staleExamples = [];
    for (let index = 30; index < five.length - 3; index += 6) {
      const cutoff = five[index].end;
      const stale = evaluateWatchlistSetups({ ...input, fiveMinute: frame("5m", five.filter(bar => bar.end <= cutoff)) }, settings);
      const events = stale.transitions.filter(event => event.instanceId.startsWith("ema") && event.state === "confirmed" && event.candleCompletedAt >= cutoff + 300000);
      assert.equal(events.length, 0, `${record.symbol}: no EMA confirmation on stale 5m context`);
      assert.deepEqual(stale.transitions.filter(event => event.instanceId.startsWith("ema") && event.candleCompletedAt < cutoff + 300000),
        full.transitions.filter(event => event.instanceId.startsWith("ema") && event.candleCompletedAt < cutoff + 300000), "Normal incomplete native interval is not prematurely stale");
      assert.ok(stale.snapshot.dependencies?.filter(value => value.kind.startsWith("ema")).every(value => value.availability !== "ready"));
      assert.deepEqual(stale.transitions.filter(event => event.instanceId.startsWith("higher-low")),
        full.transitions.filter(event => event.instanceId.startsWith("higher-low")), "Independent 1m higher-low results unchanged");
      if (events.length) staleExamples.push({ fiveMinuteThrough: cutoff, firstLateConfirmation: events[0].candleCompletedAt,
        lagMinutes: (events[0].candleCompletedAt - cutoff) / 60000, lateConfirmations: events.length,
        dependenciesAtReceipt: stale.snapshot.dependencies?.filter(value => value.kind.startsWith("ema")) });
    }
    receipts.push({ symbol: record.symbol, recordBytes, estimatedFullSizeRecordsBefore100MB: Math.floor(100000000 / recordBytes) - 1,
      staleExamples: staleExamples.slice(0, 3) });
  }
  let now = 1791547200000;
  const gate = new WatchlistMoomooAdmission({ now: () => now, sleep: async ms => { now += ms; },
    load: async () => null, save: async () => {} });
  const first = await gate.acquire();
  assert.equal(first.allowed, false);
  assert.equal(!first.allowed && first.retryAt, now + 60000);
  assert.equal((await gate.acquire(false)).allowed, true, "Existing Indicators do not inherit a setup-only cold-start hold");
  await gate.rateLimited(30000);
  assert.equal((await gate.acquire(false)).allowed, false, "Existing Indicators still respect actual provider cooldowns");
  now += 60000;
  assert.equal((await gate.acquire()).allowed, true);
  const broken = new WatchlistMoomooAdmission({ now: () => now, sleep: async ms => { now += ms; },
    load: async () => null, save: async () => { throw Error("offline audit storage failure"); } });
  assert.equal((await broken.acquire(false)).allowed, true, "New audit storage failure cannot disable existing Indicators");
  assert.equal((await broken.acquire(true)).allowed, false, "Additional setup demand yields on unknown history");
  await broken.rateLimited(45000);
  assert.equal((await broken.acquire(false)).allowed, false, "Known cooldown survives an audit write failure in memory");
  const result = { networkCalls: 0, source: "Recorded market rows only; truncated 5m simulates unavailable updates, not a changed live analysis.",
    freshLedgerFirstRequest: first, receipts };
  const directory = `data/watchlist-setup-validation/final-qa-${Date.now()}-${randomUUID().slice(0, 8)}`;
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/results.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  console.log(`Saved ${directory}/results.json`);
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
