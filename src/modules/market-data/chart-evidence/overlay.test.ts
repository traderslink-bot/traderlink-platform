import { describe, expect, it } from "vitest";
import type { DisplayCandle } from "../../scanner/alpaca/candles";
import { completedRegularIntradayCandle } from "./completed-candles";
import type { ChartEvidenceCandle, ChartEvidenceContext, ChartEvidenceEvent, ChartEvidenceLayer, ResolvedChartEvidence } from "./contracts";
import { projectChartOverlay } from "./overlay";
import { SHARED_CHART_REPLAY as fixture } from "./replay-fixture";

const ready = <T>(...facts: T[]): ChartEvidenceLayer<T> => ({ state: "ready", facts });
const missing = { state: "unavailable", reason: "missing" } as const;
const chartGeneration = "fixture-charts-generation";
const candle: ChartEvidenceCandle = {
  basis: fixture.basis, frame: "4h", interval: fixture.triggerInterval, plotTime: fixture.triggerInterval.start,
  revision: fixture.revision, bar: fixture.expectedTriggerBar, acceptedAt: fixture.acceptedAt, shortened: false,
};
const { zoneId, mapId, mapRevision } = fixture.fourHourZone;
const breakEvent: ChartEvidenceEvent = {
  id: "fixture-break-up", revision: "fixture-event-v1", ruleVersion: "fixture-edge-rule-v1", kind: "level-break",
  direction: "up", knownAt: fixture.acceptedAt, trigger: candle,
  reference: { kind: "zone", zoneId, mapId, mapRevision },
};
const context: ChartEvidenceContext = {
  candles: ready(candle), events: ready(breakEvent), zones: ready(fixture.dailyZone, fixture.fourHourZone),
};
const evidence: ResolvedChartEvidence = { version: 1, chartGeneration, basis: fixture.basis, current: context, match: context };
const plotted: DisplayCandle = { ...candle.bar, carried: false };
const request = {
  evidence, context: "match" as const, symbol: fixture.basis.symbol, generation: chartGeneration,
  frame: "4h" as const, sessionMode: "regular" as const,
  candleAt: (time: number) => time === plotted.time ? plotted : undefined,
};

describe("shared chart evidence projection", () => {
  it("projects the independently aggregated completed candle and the two exact Levels revisions", () => {
    const accepted = completedRegularIntradayCandle({
      snapshot: { basis: fixture.basis, revision: fixture.revision, receivedAt: fixture.receivedAt,
        acceptedAt: fixture.acceptedAt, coverage: fixture.triggerInterval, bars: fixture.minutes },
      session: fixture.session, frame: "4h", time: fixture.triggerInterval.start, cutoff: fixture.acceptedAt,
    });
    expect(accepted).toEqual({ state: "ready", candle });
    expect(projectChartOverlay(request)).toEqual({
      state: "ready", events: [breakEvent], zones: [fixture.dailyZone, fixture.fourHourZone],
      missingCandle: false, missingEvent: false, missingZone: false,
    });
  });

  it("rejects forming, carried or corrected plot values", () => {
    expect(projectChartOverlay({ ...request, candleAt: () => undefined }).events).toEqual([]);
    expect(projectChartOverlay({ ...request, candleAt: () => ({ ...plotted, carried: true }) }).events).toEqual([]);
    expect(projectChartOverlay({ ...request, candleAt: () => ({ ...plotted, close: 10.05 }) }).events).toEqual([]);
    const unaccepted = { ...context, candles: missing, events: ready<ChartEvidenceEvent>() };
    const forming = { ...evidence, current: unaccepted, match: unaccepted };
    expect(projectChartOverlay({ ...request, evidence: forming }).events).toEqual([]);
  });

  it("withholds a superseded candle marker even if the OHLCV happens to be identical", () => {
    const corrected = { ...candle, revision: "fixture-trigger-v2" };
    const revised = { ...evidence, current: { ...context, candles: ready(corrected) } };
    expect(projectChartOverlay({ ...request, evidence: revised })).toMatchObject({ events: [], missingCandle: true, missingEvent: true });
  });

  it("keeps the actual Levels source frame on Daily and omits the unmatched 4H marker", () => {
    const daily = projectChartOverlay({ ...request, frame: "1D" });
    expect(daily.zones.map(zone => [zone.sourceFrame, zone.lower, zone.upper])).toEqual([
      ["1D", 10.50, 10.55], ["4h", 10.00, 10.10],
    ]);
    expect(daily.events).toEqual([]);
    expect(daily.missingEvent).toBe(false);
  });

  it("does not substitute a refreshed map for the exact zone referenced by a match", () => {
    const revised = { ...fixture.fourHourZone, mapRevision: "fixture-map-4h-v2", lower: 10.35, upper: 10.45 };
    const match: ChartEvidenceContext = { ...context, zones: missing };
    const current: ChartEvidenceContext = { ...context, zones: ready(fixture.dailyZone, revised), events: ready() };
    const refreshed = { ...evidence, match, current };
    expect(projectChartOverlay({ ...request, evidence: refreshed })).toMatchObject({ zones: [], events: [], missingZone: true });
    expect(projectChartOverlay({ ...request, evidence: refreshed, context: "current" }).zones).toEqual([fixture.dailyZone, revised]);
  });

  it("allows a later-published zone as chart context without binding it to an earlier trigger", () => {
    const late = { ...fixture.fourHourZone, firstAvailableAt: fixture.triggerInterval.start + 60 };
    const revised = { ...evidence, match: { ...context, zones: ready(fixture.dailyZone, late) } };
    expect(projectChartOverlay({ ...request, evidence: revised })).toMatchObject({
      zones: [fixture.dailyZone, late], events: [], missingEvent: true,
    });
  });

  it("withholds incompatible generations, symbols, sessions and zone price bases", () => {
    expect(projectChartOverlay({ ...request, generation: "new-generation" }).state).toBe("unavailable");
    expect(projectChartOverlay({ ...request, symbol: "OTHER" }).zones).toEqual([]);
    expect(projectChartOverlay({ ...request, sessionMode: "extended" }).events).toEqual([]);
    const foreign = { ...fixture.fourHourZone, priceBasisId: "raw-before-split" };
    const incompatible = { ...evidence, match: { ...context, zones: ready(fixture.dailyZone, foreign) } };
    expect(projectChartOverlay({ ...request, evidence: incompatible })).toMatchObject({
      zones: [fixture.dailyZone], events: [], missingZone: true, missingEvent: true,
    });
  });
});
