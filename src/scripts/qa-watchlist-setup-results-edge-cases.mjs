import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
registerHooks({ resolve(specifier, context, next) { try { return next(specifier, context); } catch (error) {
  if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/u.test(specifier)) return next(`${specifier}.ts`, context); throw error;
} } });
const { SetupResultsAccumulator } = await import("../lib/live-watchlist/setups/setup-results.ts");
const calendar = JSON.parse(await readFile(new URL("../modules/coach/server/market-calendar/us-equities-review-calendar.v1.json", import.meta.url), "utf8"));
globalThis.fetch = async () => { throw Error("No network in results edge QA"); };
const at = Date.parse("2026-10-09T15:00:00Z"), minute = 60000;
function fixture() {
  const candle = start => ({ start, end: start + minute, open: 10, high: 10.2, low: 9.8, close: 10, volume: 1000,
    sessionKey: "2026-10-09:regular", session: "regular", marketDate: "2026-10-09" });
  return { version: 1, configurationRevision: 1, input: { symbol: "TEST", publicationIdentity: "00000000-0000-4000-8000-000000000001", revision: "r1", receivedAt: at + 10 * minute,
    calendar: structuredClone(calendar), oneMinute: { provider: "moomoo", adjustment: "forward", seriesKey: "old", candles: [candle(at - minute), ...Array.from({ length: 5 }, (_, i) => candle(at + i * minute))] } },
    evaluation: { rulesVersion: "v1", diagnostics: [], instances: [{ id: "ema9:episode", kind: "ema9-pullback-bounce", firstRecognizedAt: at - minute, confirmedAt: at,
      evaluatedThrough: at, priceState: "confirmed", references: [{ role: "test-low", observation: { value: 9, observedAt: at - minute, knownAt: at }, frame: "1m" }] }],
      transitions: [{ instanceId: "ema9:episode", state: "forming", candleCompletedAt: at - minute, knownAt: at, reason: "forming_observed" }, { instanceId: "ema9:episode", state: "confirmed", candleCompletedAt: at, knownAt: at, reason: "trigger_observed" }] } };
}
const result = accumulator => accumulator.results({ minutes: 5, page: 1 }, at + 10 * minute);
// Exact decimal benchmark should count as reached; no arbitrary price tolerance
// or ticker-specific threshold is used in this reproduction.
const decimal = fixture();
for (const bar of decimal.input.oneMinute.candles) Object.assign(bar, { open: 0.1, close: 0.1, high: 0.105, low: 0.095 });
decimal.input.oneMinute.candles[1].high = 0.11;
decimal.evaluation.instances[0].references[0].observation.value = 0.09;
const decimalScan = new SetupResultsAccumulator(); decimalScan.add(decimal);
const decimalOutcome = result(decimalScan).rows[0].outcome;
assert.equal(decimalOutcome.state, "follow-through");
// A later accepted series can be incompatible for price comparisons without
// erasing the fact that the same instance reached a recorded price stage.
const forming = fixture(); forming.evaluation.instances[0].confirmedAt = null; forming.evaluation.transitions.pop();
const changedSeries = fixture(); changedSeries.input.revision = "r2"; changedSeries.input.receivedAt += minute;
changedSeries.input.oneMinute.seriesKey = "new";
const seriesScan = new SetupResultsAccumulator(); seriesScan.add(forming); seriesScan.add(changedSeries);
const seriesResult = result(seriesScan); assert.equal(seriesResult.summary[1].confirmed, 1);
assert.equal(seriesResult.rows[0].outcome.state, "neither");
// Caller catches malformed evidence, but add() has already mutated the totals.
const malformed = fixture(); malformed.evaluation.diagnostics = null;
malformed.input.oneMinute.candles[1].high = 11.1;
const malformedScan = new SetupResultsAccumulator();
assert.throws(() => malformedScan.add(malformed));
const malformedResult = malformedScan.results({ minutes: 5, page: 1 }, at + 10 * minute, 1);
assert.equal(malformedResult.total, 0); assert.equal(malformedResult.summary[1].confirmed, 0);
assert.equal(malformedResult.coverage.records, 0);
let regressions = 0;
const check = (actual, expected) => { assert.deepEqual(actual, expected); regressions++; };
// Fixed comparison works at different price scales and does not treat a real
// sub-cent difference as arithmetic noise. Exact tested-low touches are not losses.
for (const [close, low] of [[0.1, 0.09], [0.2, 0.18], [1.13, 1.02], [10.13, 9.99], [0.0001, 0.00009]]) {
  const target = Number((2 * close - low).toPrecision(14));
  for (const offset of [0, -close * 0.000001]) {
    const value = fixture();
    for (const candle of value.input.oneMinute.candles) Object.assign(candle, { open: close, close, high: close, low: close });
    value.input.oneMinute.candles[1].high = target + offset;
    value.evaluation.instances[0].references[0].observation.value = low;
    const scan = new SetupResultsAccumulator(); scan.add(value);
    check(result(scan).rows[0].outcome.state, offset === 0 ? "follow-through" : "neither");
  }
  for (const offset of [0, -close * 0.000001]) {
    const value = fixture();
    for (const candle of value.input.oneMinute.candles) Object.assign(candle, { open: close, close, high: close, low: close });
    value.input.oneMinute.candles[1].low = low + offset;
    value.evaluation.instances[0].references[0].observation.value = low;
    const scan = new SetupResultsAccumulator(); scan.add(value);
    check(result(scan).rows[0].outcome.state, offset === 0 ? "neither" : "low-lost-first");
  }
}
// Changing the accepted series cannot lose stages or borrow later bars from
// an incompatible price history. Scan order and timestamp ties are deterministic.
const changedFailure = structuredClone(changedSeries);
changedFailure.input.oneMinute.candles[1].low = 8.8;
const oldSuccess = structuredClone(forming); oldSuccess.input.oneMinute.candles[1].high = 12;
for (const records of [[oldSuccess, changedFailure], [changedFailure, oldSuccess]]) {
  const scan = new SetupResultsAccumulator(); for (const r of records) scan.add(r);
  const measured = result(scan);
  check(measured.total, 1); check(measured.summary[1].forming, 1); check(measured.summary[1].confirmed, 1);
  check(measured.rows[0].outcome.state, "low-lost-first"); check(measured.rows[0].inputRevisions, ["r1", "r2"]);
}
const noMatchingHistory = structuredClone(changedSeries); noMatchingHistory.input.oneMinute.candles = [];
const isolated = new SetupResultsAccumulator(); isolated.add(oldSuccess); isolated.add(noMatchingHistory);
check(result(isolated).summary[1].confirmed, 1); check(result(isolated).rows[0].outcome.state, "missing-data");
const tied = structuredClone(changedFailure); tied.input.receivedAt = oldSuccess.input.receivedAt;
const oldConfirmed = fixture();
const tieOne = new SetupResultsAccumulator(), tieTwo = new SetupResultsAccumulator();
tieOne.add(tied); tieOne.add(oldConfirmed); tieTwo.add(oldConfirmed); tieTwo.add(tied);
check(result(tieOne).rows[0].outcome, result(tieTwo).rows[0].outcome);
// Every nested rejection is atomic, whether it precedes or follows valid data.
const mutations = [r => { r.evaluation.diagnostics = null; }, r => { r.evaluation.transitions.push(null); },
  r => { r.evaluation.instances.push(null); }, r => { r.evaluation.instances[0].references.push(null); },
  r => { r.input.oneMinute.candles.push(null); }, r => { r.input.oneMinute.candles[1].volume = -1; },
  r => { r.input.calendar.coverage = null; }, r => { r.input.calendar.normalWeekdaySession.postMarketEndEastern = "12:00"; },
  r => { r.evaluation.instances[0].confirmedAt = NaN; }, r => { r.configurationRevision = -1; },
  r => { r.evaluation.transitions[0].state = "invented"; }, r => { r.evaluation.instances[0].references[0].observation.value = -9; }];
for (const mutate of mutations) {
  for (const beforeValid of [true, false]) {
    const scan = new SetupResultsAccumulator(), good = fixture(), bad = fixture();
    bad.input.receivedAt += minute; bad.input.revision = "poison"; bad.input.oneMinute.candles[1].high = 12;
    mutate(bad);
    if (!beforeValid) scan.add(good);
    const before = result(scan);
    assert.throws(() => scan.add(bad)); regressions++;
    check(result(scan), before);
    if (beforeValid) scan.add(good);
    check(result(scan).rows[0].outcome.state, "neither"); check(result(scan).coverage.records, 1);
  }
}
const owned = fixture(), ownedScan = new SetupResultsAccumulator(); ownedScan.add(owned);
owned.input.oneMinute.candles[1].high = 12; owned.evaluation.instances[0].references[0].observation.value = 1;
check(result(ownedScan).rows[0].outcome.state, "neither");
const receipt = { networkCalls: 0, findings: [
  { id: "decimal-boundary", expected: "follow-through", actual: decimalOutcome.state, objective: decimalOutcome.objective, observedHigh: 0.11 },
  { id: "series-transition-loss", expectedConfirmed: 1, actualConfirmed: seriesResult.summary[1].confirmed, actualOutcome: seriesResult.rows[0].outcome.state },
  { id: "partial-add-after-error", expectedOccurrences: 0, actualOccurrences: malformedResult.total, actualConfirmed: malformedResult.summary[1].confirmed,
    actualOutcome: null, unreadableRecords: 1 }
], findingsResolved: true, additionalRegressionAssertions: regressions,
  scope: "Offline regression inputs against actual accumulator. All three original findings corrected; not live/browser acceptance." };
const directory = `data/watchlist-setup-validation/results-edge-qa-${Date.now()}-${randomUUID().slice(0, 8)}`;
await mkdir(directory, { recursive: true }); await writeFile(`${directory}/results.json`, JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt, null, 2)); console.log(`Saved ${directory}/results.json`);
