import assert from "node:assert/strict";
import { test } from "vitest";
import { analyzeIndicatorEpisodes } from "./trend-momentum-episodes";
import { DEFAULT_INDICATOR_FILTERS } from "./trend-momentum-cohorts";
import { buildDuringStudy, summarizeDuringStudy, duringStudyClosure, type DuringStudySelection } from "./trend-momentum-during-study";
import type { TrendMomentumProjection } from "./trend-momentum-analytics";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TrendMomentumAnalysis } from "../../../app/(dashboard)/analytics/trend-momentum-analysis";

const at = 1_800_000_000;
const selection: DuringStudySelection = { interval: "1m", reference: "ema9", event: "loss", ema20Side: "any", filters: DEFAULT_INDICATOR_FILTERS };
function evidence(missingFirst = false, values = [10.2, 9.8, 10.3, 9.7, 10.4]) {
  return analyzeIndicatorEpisodes({ observations: values.map((close, i) => ({ at: at + i * 60, close, ema9: 10, ema20: 9, rsi14: i < 3 ? 40 : 60, vwap: 10 })),
    oneMinuteCloses: [], cycles: [{ openedAt: at, closedAt: at + 600, closingPrice: 10.5 }],
    completedRanges: [{ start: at, endExclusive: at + 600 }], resetTimes: [], direction: "long",
    contextAt: (time) => missingFirst && time === at + 60 ? null : ({ rsiBand: time < at + 180 ? "30_to_below_50" : "50_to_70", alignment: "above", ema9Direction: "rising", ema20Direction: "rising", separation: "expanding", rsiDirection: "rising", spacing: "standard" } as NonNullable<ReturnType<NonNullable<Parameters<typeof analyzeIndicatorEpisodes>[0]["contextAt"]>>>),
  });
}
const trade = (id: string, during: ReturnType<typeof evidence> | null) => ({ tradeId: id, representativeRoundTripId: id, symbol: "TEST", direction: "long", trackerDate: "2026-09-11", pnlDecimal: "5", returnPercentDecimal: "10",
  indicators: during ? { timingUnavailable: false, duringTrade: { oneMinute: during } } : null });
const project = (...trades: ReturnType<typeof trade>[]) => ({ trades, records: [], tradeCount: trades.length, analyzedTradeCount: trades.length, indicatorTradeCount: trades.filter((row) => row.indicators).length }) as unknown as TrendMomentumProjection;

test("during conditions never replace the first event with a later matching occurrence", () => {
  const result = buildDuringStudy(project(trade("one", evidence())), { ...selection, ema20Side: "above", filters: { ...DEFAULT_INDICATOR_FILTERS, rsiBand: "50_to_70" } });
  assert.equal(result.complete.matching.length, 0);
  assert.equal(result.complete.nonmatching.length, 1);
  assert.equal(result.complete.nonmatching[0].at, at + 60);
  assert.equal(result.occurrences.filter((row) => row.match).length, 1);
  const missing = buildDuringStudy(project(trade("one", evidence(true))), { ...selection, filters: { ...DEFAULT_INDICATOR_FILTERS, rsiBand: "50_to_70" } });
  assert.equal(missing.complete.unknown.length, 1);
  assert.equal(missing.complete.matching.length, 0);
});

test("incomplete first-event history, no event and unknown presence remain separate", () => {
  const incomplete = evidence();
  const result = buildDuringStudy(project(trade("incomplete", { ...incomplete, episodes: incomplete.episodes.map((episode) => ({ ...episode, firstEventCoverage: "incomplete" as const })) }),
    trade("no-event", evidence(false, [10.2, 10.3, 10.4])), trade("unknown", null)), selection);
  assert.equal(result.incomplete.matching.length, 1);
  assert.equal(result.complete.matching.length, 0);
  assert.deepEqual(result.noEventTradeIds, ["no-event"]);
  assert.deepEqual(result.unknownPresenceTradeIds, ["unknown"]);
});

test("during-trade controls render reclaim selection and separate unknown presence without a server", () => {
  const html = renderToStaticMarkup(createElement(TrendMomentumAnalysis, { projection: project(trade("one", evidence()), trade("unknown", null)),
    direction: "long", currency: "USD", timezone: "America/New_York", offline: true, queryString: "indicator_event=reclaim" }));
  assert.match(html, /Event/);
  assert.match(html, /Return above reference/);
  assert.match(html, /Matching conditions/);
  assert.match(html, /Context unavailable/);
  assert.match(html, /1 could not be checked/);
  assert.match(html, /includes observed returns only/);
  assert.doesNotMatch(html, /Recorded return rate:/);
  assert.match(html, /Until position closure/);
  assert.match(html, /per share/);
});

test("until-closure keeps loss and reclaim anchors separate and missing values outside averages", () => {
  const projection = project(trade("one", evidence()));
  const loss = buildDuringStudy(projection, selection).complete.matching[0];
  const reclaim = buildDuringStudy(projection, { ...selection, event: "reclaim" }).complete.matching[0];
  assert.equal(duringStudyClosure(loss)!.at, at + 600);
  assert.ok(Math.abs(duringStudyClosure(loss)!.changePerShare - 0.7) < 1e-10);
  assert.ok(Math.abs(duringStudyClosure(reclaim)!.changePerShare - 0.2) < 1e-10);
  const missing = { ...loss, followThrough: null };
  const equalTime = { ...loss, followThrough: { ...loss.followThrough!, untilClosure: { ...loss.followThrough!.untilClosure, at: loss.at } } };
  const invalid = { ...loss, followThrough: { ...loss.followThrough!, untilClosure: { ...loss.followThrough!.untilClosure, changePercent: NaN } } };
  assert.equal(duringStudyClosure(equalTime), null);
  const result = summarizeDuringStudy([loss, missing, equalTime, invalid], "loss");
  assert.equal(result.untilClosure.measured, 1); assert.equal(result.untilClosure.unavailable, 3);
  assert.equal(result.untilClosure.averageChangePercent, duringStudyClosure(loss)!.changePercent);
  assert.equal(summarizeDuringStudy([missing], "reclaim").untilClosure.averageChangePercent, null);
  assert.equal(summarizeDuringStudy([{ ...loss, trade: { ...loss.trade, direction: "short" } }], "loss").untilClosure.averageChangePercent,
    result.untilClosure.averageChangePercent);
});

test("reclaim samples use reclaim context and do not present a biased recovery rate", () => {
  const result = buildDuringStudy(project(trade("one", evidence())), { ...selection, event: "reclaim" });
  assert.equal(result.complete.matching[0].at, at + 120);
  assert.equal(result.complete.matching[0].price, 10.3);
  const summary = summarizeDuringStudy(result.occurrences, "reclaim");
  assert.equal(summary.tradeCount, 1);
  assert.equal(summary.occurrenceCount, 2);
  assert.equal(summary.totalPnlDecimal, "5");
  assert.equal(summary.recordedReclaimRate, null);
  for (const horizon of summary.horizons) assert.equal(Object.values(horizon.counts).reduce((sum, count) => sum + count, 0), 2);
});

test("loss recovery rate excludes unknown outcomes and absent held cycles cannot prove no event", () => {
  const result = buildDuringStudy(project(trade("one", evidence())), selection);
  const row = result.complete.matching[0];
  const summary = summarizeDuringStudy([row, { ...row, episode: { ...row.episode, recovery: "no_recorded_reclaim_before_closure" } },
    { ...row, episode: { ...row.episode, recovery: "unknown" } }], "loss");
  assert.equal(summary.recordedReclaimRate, 50);
  assert.equal(summary.unknown, 1);
  const noCycles = analyzeIndicatorEpisodes({ observations: [], oneMinuteCloses: [], cycles: [], completedRanges: [], resetTimes: [], direction: "long" });
  assert.deepEqual(buildDuringStudy(project(trade("empty", noCycles)), selection).unknownPresenceTradeIds, ["empty"]);
});
