import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFile } from "node:fs/promises";
registerHooks({ resolve(specifier, context, next) { try { return next(specifier, context); } catch (error) {
  if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/u.test(specifier)) return next(`${specifier}.ts`, context); throw error;
} } });
const { SetupResultsAccumulator } = await import("../lib/live-watchlist/setups/setup-results.ts");
const calendar = JSON.parse(await readFile(new URL("../modules/coach/server/market-calendar/us-equities-review-calendar.v1.json", import.meta.url), "utf8"));
globalThis.fetch = async () => { throw Error("No network in Setup Results QA"); };
let assertions = 0;
const eq = (a, b) => { assert.deepEqual(a, b); assertions++; };
const at = Date.parse("2026-10-09T15:00:00Z"), minute = 60000;
const bar = (start, high = 10.2, low = 9.8) => ({ start, end: start + minute, open: 10, close: 10, high, low, volume: 1000,
  sessionKey: "2026-10-09:regular", session: "regular", marketDate: "2026-10-09" });
function record(later = [], options = {}) {
  const instance = { id: "ema9:episode", kind: "ema9-pullback-bounce", firstRecognizedAt: at - minute,
    confirmedAt: at, evaluatedThrough: at, priceState: "confirmed", references: [{ role: "test-low", observation: { value: 9, observedAt: at - minute, knownAt: at }, frame: "1m" }] };
  return { version: 1, configurationRevision: 1, input: { symbol: "TEST", publicationIdentity: "00000000-0000-4000-8000-000000000001", revision: "r1", receivedAt: at + 10 * minute,
    calendar, oneMinute: { provider: "moomoo", adjustment: "forward", seriesKey: "test", candles: [bar(at - minute), ...later] }, ...options.input },
    evaluation: { rulesVersion: "v1", instances: [instance], transitions: [{ instanceId: instance.id, state: "forming", candleCompletedAt: at - minute, knownAt: at, reason: "forming_observed" },
      { instanceId: instance.id, state: "confirmed", candleCompletedAt: at, knownAt: at, reason: "trigger_observed" }], diagnostics: [], ...options.evaluation } };
}
const filter = { minutes: 5, page: 1 };
function result(rec, now = at + 10 * minute) { const a = new SetupResultsAccumulator(); a.add(rec); return a.results(filter, now); }
eq(result(record([bar(at, 11.1, 9.5)])).rows[0].outcome.state, "follow-through");
eq(result(record([bar(at, 10.2, 8.9)])).rows[0].outcome.state, "low-lost-first");
eq(result(record([bar(at, 11.1, 8.9)])).rows[0].outcome.state, "unclear");
eq(result(record([bar(at, 10.2, 9), bar(at + minute, 11.2, 9.5)])).rows[0].outcome.state, "follow-through");
eq(result(record(Array.from({ length: 5 }, (_, i) => bar(at + i * minute)))).rows[0].outcome.state, "neither");
eq(result(record([bar(at), bar(at + 2 * minute, 12, 9.5)])).rows[0].outcome.state, "missing-data");
eq(result(record([]), at + 30000).rows[0].outcome.state, "developing");
eq(result(record([])).rows[0].outcome.state, "missing-data");
const a = new SetupResultsAccumulator(), first = record([bar(at, 11.1, 9.5)]);
a.add(first); a.add(first); a.add({ ...first, configurationRevision: 2 });
eq(a.results(filter).total, 1); eq(a.results(filter).summary[1].confirmed, 1); eq(a.results(filter).summary[1].forming, 1);
eq(a.results(filter).summary[1].followThroughPct, 100);
const failed = structuredClone(first); failed.input.revision = "r2"; failed.input.receivedAt += minute;
failed.evaluation.transitions.push({ instanceId: "ema9:episode", state: "failed", candleCompletedAt: at + minute, knownAt: at + minute, reason: "low_lost" }); a.add(failed);
eq(a.results(filter).summary[1].failed, 1); eq(a.results(filter).summary[1].confirmed, 1);
const second = structuredClone(first); second.input.publicationIdentity = "00000000-0000-4000-8000-000000000002"; a.add(second); eq(a.results(filter).total, 2);
const version = structuredClone(first); version.evaluation.rulesVersion = "v2"; a.add(version); eq(a.results(filter).total, 3);
eq(a.results({ ...filter, rules: "v2" }).total, 1); eq(a.results({ ...filter, symbol: "NOPE" }).total, 0);
eq(a.results({ ...filter, session: "premarket" }).total, 0); eq(a.results({ ...filter, from: "2026-10-10" }).total, 0);
eq(a.results({ ...filter, to: "2026-10-08" }).total, 0);
// A later corrected candle supersedes an earlier copy, regardless of scan order.
const correction = structuredClone(first); correction.input.receivedAt += minute; correction.input.revision = "correction";
correction.input.oneMinute.candles[1] = bar(at, 10.2, 8.9);
const corrected = new SetupResultsAccumulator(); corrected.add(correction); corrected.add(first);
eq(corrected.results(filter).rows[0].outcome.state, "low-lost-first");
const missing = structuredClone(first); missing.input.oneMinute.candles.shift(); eq(result(missing).rows[0].outcome.state, "missing-data");
const invalid = structuredClone(first); invalid.evaluation.instances[0].references[0].observation.value = 10.5; eq(result(invalid).rows[0].outcome.state, "missing-data");
const unconfirmed = structuredClone(first); unconfirmed.evaluation.instances[0].confirmedAt = null; unconfirmed.evaluation.transitions.pop();
eq(result(unconfirmed).rows[0].outcome.state, "not-confirmed"); eq(result(unconfirmed).summary[1].decided, 0);
const late = structuredClone(first); late.evaluation.instances[0].firstRecognizedAt = at + 5 * minute; eq(result(late).rows[0].historicalDiscovery, true);
for (const minutes of [5, 15, 30, 60]) {
  const acc = new SetupResultsAccumulator(); acc.add(record(Array.from({ length: minutes }, (_, i) => bar(at + i * minute)), { input: { receivedAt: at + (minutes + 1) * minute } }));
  const value = acc.results({ minutes, page: 1 }, at + (minutes + 1) * minute).rows[0].outcome;
  eq(value.state, "neither"); eq(value.coveredMinutes, minutes); eq(value.confirmationPrice, 10); eq(value.objective, 11);
}
// Early close uses the supplied calendar, not a fixed 4 PM assumption.
const early = Date.parse("2026-11-27T17:59:00Z"), earlyRecord = record();
earlyRecord.evaluation.instances[0].confirmedAt = early; earlyRecord.evaluation.instances[0].firstRecognizedAt = early;
earlyRecord.evaluation.transitions = [{ instanceId: "ema9:episode", state: "confirmed", candleCompletedAt: early, knownAt: early, reason: "trigger_observed" }];
earlyRecord.input.receivedAt = early + 10 * minute; earlyRecord.input.oneMinute.candles = [bar(early - minute), bar(early)];
eq(result(earlyRecord, early + 10 * minute).rows[0].outcome.state, "session-ended");
const paged = new SetupResultsAccumulator();
for (let i = 0; i < 30; i++) { const r = structuredClone(first); r.evaluation.instances[0].id += i; for (const t of r.evaluation.transitions) t.instanceId = r.evaluation.instances[0].id; paged.add(r); }
eq(paged.results(filter).rows.length, 25); eq(paged.results({ ...filter, page: 2 }).rows.length, 5); eq(paged.results({ ...filter, page: 999 }).page, 2);
eq(result(first).coverage.retainedOnly, true);
console.log(`PASS ${assertions} Setup Results assertions; no network, storage mutations or notifications.`);
