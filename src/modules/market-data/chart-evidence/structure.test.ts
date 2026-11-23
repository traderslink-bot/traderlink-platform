import { describe, expect, it } from "vitest";
import type { ChartEvidenceCandle, ResolvedChartEvidence } from "./contracts";
import { projectChartOverlay } from "./overlay";
import { SHARED_CHART_REPLAY } from "./replay-fixture";
import { candleStructureAt } from "./structure";

const bucketSeconds = 14_400;
const policy = { version: "fixture-strict-1x1", left: 1, right: 1, allowShortened: false };

function bar(index: number, high: number, low: number, close = (high + low) / 2): ChartEvidenceCandle {
  const start = index * bucketSeconds;
  const end = start + bucketSeconds;
  return {
    basis: SHARED_CHART_REPLAY.basis,
    frame: "4h",
    interval: { start, end },
    plotTime: start,
    revision: `bar-${index}-v1`,
    bar: { time: start, open: close, high, low, close, volume: 100 },
    acceptedAt: end,
    shortened: false,
  };
}

function events(slots: readonly (ChartEvidenceCandle | null)[], cutoff = 20 * bucketSeconds, snapshotRevision = "v1") {
  const result = candleStructureAt({ slots, cutoff, snapshotRevision, policy });
  if (result.state !== "ready") throw Error("Expected available chart structure");
  return result.events;
}

const setup = [bar(0, 9, 7), bar(1, 10, 8), bar(2, 9, 7), bar(3, 11, 8, 10.2)];
const overlaySetup = [...setup.slice(0, 3), bar(3, 11, 7, 10.2)];

function mirror(candle: ChartEvidenceCandle): ChartEvidenceCandle {
  const { bar: original } = candle;
  return {
    ...candle,
    bar: {
      ...original, open: 20 - original.open, high: 20 - original.low,
      low: 20 - original.high, close: 20 - original.close,
    },
  };
}

function renderRequest(candles: readonly ChartEvidenceCandle[]) {
  const chartGeneration = "accepted-fixture-generation";
  const evidence: ResolvedChartEvidence = {
    version: 1, chartGeneration, basis: SHARED_CHART_REPLAY.basis,
    current: {
      candles: { state: "ready", facts: candles },
      zones: { state: "unavailable", reason: "missing" },
      events: { state: "ready", facts: events(candles) },
    },
  };
  const plotted = new Map(candles.map(candle => [candle.plotTime, { ...candle.bar, carried: false }]));
  return {
    evidence, context: "current" as const, symbol: evidence.basis.symbol, generation: chartGeneration,
    frame: "4h" as const, sessionMode: "regular" as const, candleAt: (time: number) => plotted.get(time),
  };
}

describe("candle-derived structure", () => {
  it("waits for the right neighbor and binds the swing to its source candle", () => {
    expect(events(setup, setup[1].acceptedAt)).toEqual([]);
    expect(events(setup, setup[2].acceptedAt)).toMatchObject([{
      kind: "swing", direction: "up", progression: "first",
      trigger: { interval: setup[1].interval }, knownAt: setup[2].acceptedAt,
    }]);
    expect(events(setup, setup[2].acceptedAt)).toEqual(events(setup.slice(0, 3), setup[2].acceptedAt));
  });

  it("produces a plain swing break only on the accepted crossing close", () => {
    const trigger = setup[3];
    expect(events(setup, trigger.acceptedAt - 1).filter(event => event.kind !== "swing")).toEqual([]);
    expect(events(setup).filter(event => event.kind !== "swing")).toMatchObject([{
      kind: "swing-break", direction: "up", knownAt: trigger.acceptedAt,
      trigger: { revision: trigger.revision }, reference: { candle: { revision: setup[1].revision } },
    }]);
    expect(events([...setup, bar(4, 12, 8, 11)]).filter(event => event.kind === "swing-break")).toHaveLength(1);
  });

  it("rejects a wick or equal close and a reference accepted after the trigger starts", () => {
    expect(events([...setup.slice(0, 3), bar(3, 11, 8, 10)]).filter(event => event.kind !== "swing")).toEqual([]);
    const late = { ...setup[2], acceptedAt: setup[2].acceptedAt + 1 };
    expect(events([setup[0], setup[1], late, setup[3]]).filter(event => event.kind !== "swing")).toEqual([]);
  });

  it("recomputes a corrected snapshot without carrying forward the superseded event", () => {
    const original = events(setup).find(event => event.kind === "swing-break");
    expect(original).toBeDefined();
    const replacement = { ...bar(3, 11, 8, 9.5), revision: "bar-3-v2" };
    expect(events([...setup.slice(0, 3), replacement], 20 * bucketSeconds, "v2").every(event => event.id !== original?.id)).toBe(true);
  });

  it("does not bridge a missing expected slot or promote equal extrema", () => {
    expect(events([...setup.slice(0, 3), null, setup[3]]).filter(event => event.kind !== "swing")).toEqual([]);
    expect(events([bar(0, 9, 7), bar(1, 10, 8), bar(2, 10, 7)])).toEqual([]);
  });

  it("distinguishes continuation and a protected swing break after a confirmed uptrend", () => {
    const rising = [
      bar(0, 9, 7), bar(1, 10, 8), bar(2, 9, 7.5), bar(3, 11, 8.8),
      bar(4, 10, 8.5), bar(5, 10.5, 9),
    ];
    expect(events([...rising, bar(6, 12, 10, 11.5)]).filter(event => event.kind !== "swing")).toMatchObject([
      { kind: "structure-break", direction: "up" },
    ]);
    expect(events([...rising, bar(6, 10, 8, 8.25)]).filter(event => event.kind !== "swing")).toMatchObject([
      { kind: "change-of-character", direction: "down" },
    ]);
  });

  it("waits for the first confirmed swing low and mirrors the closing break", () => {
    const falling = setup.map(mirror);
    expect(events(falling, falling[1].acceptedAt)).toEqual([]);
    expect(events(falling, falling[2].acceptedAt)).toMatchObject([
      { kind: "swing", direction: "down", progression: "first", knownAt: falling[2].acceptedAt },
    ]);
    expect(events(falling).filter(event => event.kind !== "swing")).toMatchObject([
      { kind: "swing-break", direction: "down", trigger: { revision: falling[3].revision } },
    ]);
  });

  it("distinguishes downward continuation and the loss of a protected swing in a downtrend", () => {
    const rising = [
      bar(0, 9, 7), bar(1, 10, 8), bar(2, 9, 7.5), bar(3, 11, 8.8),
      bar(4, 10, 8.5), bar(5, 10.5, 9),
    ];
    expect(events([...rising, bar(6, 12, 10, 11.5)].map(mirror)).filter(event => event.kind !== "swing"))
      .toMatchObject([{ kind: "structure-break", direction: "down" }]);
    expect(events([...rising, bar(6, 10, 8, 8.25)].map(mirror)).filter(event => event.kind !== "swing"))
      .toMatchObject([{ kind: "change-of-character", direction: "up" }]);
  });

  it.each([false, true])("projects derived markers only in the accepted chart generation, mirrored=%s", mirrored => {
    const candles = mirrored ? overlaySetup.map(mirror) : overlaySetup;
    const request = renderRequest(candles);
    expect(projectChartOverlay(request)).toMatchObject({
      events: [
        { kind: "swing", direction: mirrored ? "down" : "up", knownAt: candles[2].acceptedAt },
        { kind: "swing-break", direction: mirrored ? "down" : "up", knownAt: candles[3].acceptedAt },
      ],
      zones: [], missingZone: true, missingCandle: false, missingEvent: false,
    });
    expect(projectChartOverlay({ ...request, generation: "corrected-chart-generation" })).toMatchObject({
      state: "unavailable", events: [],
    });
    const withoutPlottedTrigger = {
      ...request, candleAt: (time: number) => time === candles[3].plotTime ? undefined : request.candleAt(time),
    };
    expect(projectChartOverlay(withoutPlottedTrigger)).toMatchObject({
      events: [{ kind: "swing" }], missingCandle: true, missingEvent: true,
    });
  });

  it("withdraws a marker when its reference candle is superseded even with identical OHLCV", () => {
    const request = renderRequest(overlaySetup);
    const revised = [...overlaySetup];
    revised[1] = { ...revised[1], revision: "bar-1-v2" };
    expect(projectChartOverlay({
      ...request,
      evidence: { ...request.evidence, current: {
        ...request.evidence.current, candles: { state: "ready", facts: revised },
      } },
    })).toMatchObject({ events: [], missingCandle: true, missingEvent: true });
  });

  it("rejects mixed revisions of series identity", () => {
    const other = { ...setup[1], basis: { ...setup[1].basis, seriesId: "other-generation" } };
    expect(candleStructureAt({
      slots: [setup[0], other],
      cutoff: setup[3].acceptedAt,
      snapshotRevision: "v1",
      policy,
    })).toEqual({ state: "unavailable" });
  });
});
