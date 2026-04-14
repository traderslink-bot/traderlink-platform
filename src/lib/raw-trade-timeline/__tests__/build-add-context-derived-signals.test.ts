import { describe, expect, it } from "vitest";
import { buildAddContextDerivedSignals } from "../derived/build-add-context-derived-signals";
import { buildExecutionLocalStructureSignals } from "../derived/build-execution-local-structure-signals";
import { buildPositionChangeDerivedSignals } from "../derived/build-position-change-derived-signals";
import { createRawTradeTimeline } from "../builders/create-raw-trade-timeline";
import { sampleCreateRawTradeTimelineInput } from "../__fixtures__/sample-create-raw-trade-timeline-input";

describe("buildAddContextDerivedSignals", () => {
  it("builds factual add-context signals from basis and local structure", () => {
    const result = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);

    const positionChangeDerivedSignals = buildPositionChangeDerivedSignals({
      executions: result.timeline.executions,
      tradeStateSnapshots: result.timeline.tradeStateSeries.snapshots,
      tradeDirection: result.timeline.tradeDirection,
    });

    const executionLocalStructureSignals =
      buildExecutionLocalStructureSignals(result);

    const signals = buildAddContextDerivedSignals({
      positionChangeDerivedSignals,
      executionLocalStructureSignals,
    });

    expect(signals).toHaveLength(3);

    expect(signals[0]).toMatchObject({
      executionIndex: 0,
      executionIncreasedPosition: true,
      executionOpenedFromFlat: true,
      previousAverageEntryPrice: null,
      previousExecutionPrice: null,
    });

    expect(signals[1]).toMatchObject({
      executionIndex: 1,
      executionIncreasedPosition: true,
      executionOpenedFromFlat: false,
      previousAverageEntryPrice: 1.185,
      previousExecutionPrice: 1.185,
      executionPriceVsPreviousAverageEntryPct: 0.059072,
      executionPriceVsPreviousExecutionPct: 0.059072,
      addWasAbovePreviousAverageEntry: true,
      addWasBelowPreviousAverageEntry: false,
      addWasAbovePreviousExecutionPrice: true,
      addWasBelowPreviousExecutionPrice: false,
    });

    expect(signals[2]).toMatchObject({
      executionIndex: 2,
      executionIncreasedPosition: false,
      executionOpenedFromFlat: false,
      previousAverageEntryPrice: 1.208333,
      previousExecutionPrice: 1.255,
    });
  });
});
