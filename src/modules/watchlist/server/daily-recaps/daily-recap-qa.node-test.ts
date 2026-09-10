import assert from "node:assert/strict";
import test from "node:test";
import { buildAiReadPullbackRecoveryRecap as pullback, buildAnalysisBreakoutRecap as breakout } from "./ai-read-pullback-recap";
import { acceptsRecapDateResponse, clearSavedRecapEdit } from "./daily-recap-client-state";
import { buildDailyWatchlistAnalysisRecap } from "./daily-analysis-recap-builder";
import type { TradersLinkAiReadPayload } from "@/src/lib/live-watchlist/live-watchlist-types";

const postedAtMs = 1_000_000;
const base = { postedAtMs, postedPrice: 0.5, symbol: "PDSB", plan: { kind: "shallow" as const, publishedAtMs: postedAtMs, zoneLow: 0.44, zoneHigh: 0.46 } };
const observations = (prices: number[]) => prices.map((price, index) => ({ price, observedAtMs: postedAtMs + index }));

test("bounce below a broken pullback zone is not successful recovery", () => {
  assert.equal(pullback({ ...base, observations: observations([0.45, 0.39, 0.42]) }), null);
});

test("deep recovery is never a successful pullback recap", () => {
  assert.equal(pullback({ ...base, plan: { ...base.plan, kind: "deep", zoneLow: 0.38, zoneHigh: 0.40 }, observations: observations([0.39, 0.65]) }), null);
});

test("tiny shallow bounce followed by a deep run uses posted price and full high", () => {
  const read = { version: 4, mustClear: { price: 0.52 }, breakoutContinuation: { price: 0.54 }, momentumFailure: { price: 0.35 },
    pullbackPlans: { shallow: base.plan, deep: { zoneLow: 0.38, zoneHigh: 0.40 } },
    forwardPlan: { nearestRealistic: { available: true, price: 0.60 }, continuedMomentum: { available: true, price: 0.63 },
      strongExpansion: { available: false, price: null }, extremeMomentum: { available: false, price: null }, additionalObservedOutcomes: [] },
  } as unknown as TradersLinkAiReadPayload;
  const text = buildDailyWatchlistAnalysisRecap({ ...base, aiRead: { read, publishedAtMs: postedAtMs }, observations: observations([0.45, 0.455, 0.39, 0.65]) });
  assert.match(text, /high of \$0.6500.*30.0%/);
  assert.match(text, /0.6000, \$0.6300/);
  assert.doesNotMatch(text, /1.1%|66.7%|pullback area/);
  for (const firstHigh of [0.60, 0.65, 0.70]) {
    const combined = buildDailyWatchlistAnalysisRecap({ ...base, aiRead: { read, publishedAtMs: postedAtMs }, observations: observations([firstHigh, 0.45, 0.455, 0.39, 0.65]) });
    const fullHigh = Math.max(firstHigh, 0.65);
    assert.ok(combined.includes(`high of $${fullHigh.toFixed(4)}`), combined);
    assert.ok(combined.includes(`potential gain of ${(((fullHigh - 0.5) / 0.5) * 100).toFixed(1)}%`), combined);
    assert.doesNotMatch(combined, /1.1%|66.7%|pullback area/);
    assert.match(combined, /\$0.6300/);
  }
  const twoMoves = buildDailyWatchlistAnalysisRecap({ ...base, aiRead: { read, publishedAtMs: postedAtMs }, observations: observations([0.70, 0.45, 0.65]) });
  assert.match(twoMoves, /high of \$0.7000.*40.0%/);
  assert.match(twoMoves, /reached \$0.4500.*ran to \$0.6500.*44.4%/);
  assert.ok(twoMoves.indexOf("40.0%") < twoMoves.indexOf("44.4%"));
  assert.doesNotMatch(twoMoves, /84.4%|deep/);
  for (const firstHigh of [0.60, 0.65, 0.70]) {
    const result = buildDailyWatchlistAnalysisRecap({ ...base, aiRead: { read, publishedAtMs: postedAtMs }, observations: observations([firstHigh, 0.45, 0.65]) });
    const firstGain = (((firstHigh - 0.5) / 0.5) * 100).toFixed(1);
    assert.ok(result.includes(`potential gain of ${firstGain}%`), result);
    assert.match(result, /reached \$0.4500.*ran to \$0.6500.*44.4%/);
    assert.ok(result.indexOf(`potential gain of ${firstGain}%`) < result.indexOf("44.4%"));
    assert.match(result, /\$0.6300/);
  }
});
test("completed pullback recovery is retained when price fails later", () => {
  assert.match(pullback({ ...base, observations: observations([0.45, 0.65, 0.39]) })!.text, /44.4%/);
});
test("continuation potential gain uses the full post-period high", () => {
  assert.match(breakout({ ...base, plan: { publishedAtMs: postedAtMs + 1, clearedPrice: 0.52, breakoutTriggerPrice: 0.54, nextLevelPrices: [0.6, 0.63] }, observations: observations([0.65, 0.61]) })!, /30.0%/);
});

test("a later lower dip does not erase the earlier 44.4 percent recovery", () => {
  assert.match(pullback({ ...base, observations: observations([0.45, 0.65, 0.44]) })!.text, /44.4%/);
});

test("a 10 percent dip can run without reaching an area 15 percent below the post", () => {
  const result = pullback({ ...base, plan: { ...base.plan, zoneLow: 0.42, zoneHigh: 0.425 }, observations: observations([0.5, 0.45, 0.65]) });
  assert.match(result!.text, /pulled back 10.0%/);
  assert.match(result!.text, /before reaching that area/);
  assert.match(result!.text, /44.4%/);
  assert.doesNotMatch(result!.text, /invalidat|failed|traded into/);
});

test("recovery does not require proximity to an analysis area", () => {
  const result = pullback({ ...base, plan: { ...base.plan, zoneLow: 0.30, zoneHigh: 0.32 }, observations: observations([0.5, 0.45, 0.65, 0.44]) });
  assert.match(result!.text, /44.4%/);
  assert.match(result!.text, /before reaching that area/);
});

test("an early recovery remains when price reaches the lower analysis area afterward", () => {
  const result = pullback({ ...base, plan: { ...base.plan, zoneLow: 0.42, zoneHigh: 0.425 }, observations: observations([0.5, 0.45, 0.65, 0.42]) });
  assert.match(result!.text, /44.4%/);
  assert.match(result!.text, /before reaching that area/);
});

test("continuation does not require hitting a where-it-could-go-next level", () => {
  const result = breakout({ ...base, plan: { publishedAtMs: postedAtMs, clearedPrice: 0.52, breakoutTriggerPrice: 0.54, nextLevelPrices: [0.6, 0.63] }, observations: observations([0.5, 0.54, 0.59]) });
  assert.match(result!, /18.0%/);
  assert.doesNotMatch(result!, /reached the next/);
});

test("late date response cannot replace the active date's candidates", () => {
  assert.equal(acceptsRecapDateResponse(1, 2, "2026-09-08", "2026-09-09"), false);
  assert.equal(acceptsRecapDateResponse(2, 2, "2026-09-09", "2026-09-09"), true);
  assert.equal(acceptsRecapDateResponse(1, 3, "2026-09-08", "2026-09-08"), false);
});

test("save response preserves any newer text typed while save was running", () => {
  const edits = { PDSB: "new text", OTHER: "other ticker" };
  assert.deepEqual(clearSavedRecapEdit(edits, "PDSB", "submitted text"), edits);
  assert.deepEqual(clearSavedRecapEdit(edits, "PDSB", "new text"), { OTHER: "other ticker" });
});
