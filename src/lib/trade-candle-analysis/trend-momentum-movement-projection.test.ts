import assert from "node:assert/strict";
import { test } from "vitest";
import { projectSavedIndicatorMovement, summarizeSavedIndicatorMovement } from "./trend-momentum-movement-projection";

type Input = Parameters<typeof projectSavedIndicatorMovement>[0];
const start = Date.parse("2026-09-11T14:00:00Z") / 1000;
function fixture(direction: "long" | "short" = "long"): Input {
  const snapshot = (kind: string, sequence: number, offset: number) => ({
    event: { eventId: `e${sequence}`, kind, sequence, priceDecimal: "10", executedAtUtc: new Date((start + offset) * 1000).toISOString() },
    metrics: { excursionUntilFlat: kind === "entry" ? { favorableMoveDecimal: "2", adverseMoveDecimal: "1", minutesUntilFlat: 10, observedThroughCandleTime: start + 540 } : null },
  });
  return {
    analyzed: { eventSnapshots: [snapshot("entry", 1, 30), snapshot("temporary_flat", 2, 150), snapshot("entry", 3, 210), snapshot("final_exit", 4, 630)] } as unknown as Input["analyzed"],
    candles: Array.from({ length: 61 }, (_, i) => ({ time: start + i * 60, highDecimal: i === 0 || i === 5 ? "99" : "12", lowDecimal: "9", openDecimal: "10", closeDecimal: "11", volumeDecimal: "100" })) as Input["candles"],
    identity: { roundTripId: "logical-trade", symbol: "TEST", direction, closeDate: "2026-09-11", trackerDate: "2026-09-11" },
    pnlDecimal: null, multiplier: "2", timezone: "America/New_York",
  };
}

test("movement excludes the execution and endpoint candle and preserves missing financial results", () => {
  const result = projectSavedIndicatorMovement(fixture());
  assert.equal(result.eventPaths[0]!.favorableMoveDecimal, "4");
  assert.equal(result.eventPaths[0]!.adverseMoveDecimal, "2");
  assert.equal(result.eventPaths[0]!.observedAtCandleTime, start + 240);
  assert.equal(result.excursions[0]!.actualPnlDecimal, null);
  assert.equal(result.excursions[0]!.entryPriceDecimal, "20");
  assert.equal(result.excursions[0]!.favorableMovePercent, 20);
  assert.equal(result.eventPaths[4]!.eventKind, "Re-entry");
  assert.ok(result.eventPaths.every((row) => row.roundTripId === "logical-trade"));
});

test("missing interior candle withholds only affected movement windows", () => {
  const input = fixture();
  const result = projectSavedIndicatorMovement({ ...input, candles: input.candles.filter((c) => c.time !== start + 60) });
  assert.equal(result.eventPaths[0]!.favorableMoveDecimal, null);
  assert.equal(result.excursions.length, 1);
  assert.notEqual(result.eventPaths[4]!.favorableMoveDecimal, null);
});

test("short movement reverses favorable and adverse sides without changing percentage units", () => {
  const result = projectSavedIndicatorMovement(fixture("short"));
  assert.equal(result.eventPaths[0]!.favorableMoveDecimal, "2");
  assert.equal(result.eventPaths[0]!.adverseMoveDecimal, "4");
  assert.throws(() => projectSavedIndicatorMovement({ ...fixture(), multiplier: "0" }), /reporting_rate_invalid/);
});

test("summary statistics use the same measured executions and empty coverage stays unavailable", () => {
  const rows = projectSavedIndicatorMovement(fixture()).excursions;
  const summary = summarizeSavedIndicatorMovement(rows);
  assert.equal(summary.entryOpportunityRisk.measuredExecutionCount, rows.length);
  assert.equal(summary.entryOpportunityRisk.averageFavorableMoveDecimal, "91");
  assert.equal(summary.mfeMae.averageFavorableMovePercent, 455);
  assert.equal(summary.mfeMae.breakdown.find((row) => row.label === "Entries")!.measuredExecutionCount, 2);
  assert.equal(summarizeSavedIndicatorMovement([]).mfeMae.averageAdverseMovePercent, null);
});

test("until-flat measurement excludes idle prices before re-entry while timed paths retain their fixed horizon", () => {
  const input = fixture();
  const candles = input.candles.map((candle) => ({ ...candle, highDecimal: candle.time === start + 180 ? "500" : "12" }));
  const result = projectSavedIndicatorMovement({ ...input, candles });
  assert.equal(result.excursions[0]!.favorableMoveDecimal, "4");
  assert.equal(result.excursions[0]!.minutesUntilFlat, 2);
  assert.equal(result.excursions[1]!.favorableMoveDecimal, "4");
  assert.equal(result.eventPaths[0]!.favorableMoveDecimal, "980");
});
