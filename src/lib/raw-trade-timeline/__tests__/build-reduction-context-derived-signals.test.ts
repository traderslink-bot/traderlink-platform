import { describe, expect, it } from "vitest";
import { createRawTradeTimeline } from "../builders/create-raw-trade-timeline";
import { sampleCreateRawTradeTimelineInput } from "../__fixtures__/sample-create-raw-trade-timeline-input";
import { buildExecutionLocalStructureSignals } from "../derived/build-execution-local-structure-signals";
import { buildPositionChangeDerivedSignals } from "../derived/build-position-change-derived-signals";
import { buildReductionContextDerivedSignals } from "../derived/build-reduction-context-derived-signals";

describe("buildReductionContextDerivedSignals", () => {
  it("builds factual reduction-context signals from basis and local structure", () => {
    const result = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);

    const positionChangeDerivedSignals = buildPositionChangeDerivedSignals({
      executions: result.timeline.executions,
      tradeStateSnapshots: result.timeline.tradeStateSeries.snapshots,
      tradeDirection: result.timeline.tradeDirection,
    });

    const executionLocalStructureSignals =
      buildExecutionLocalStructureSignals(result);

    const signals = buildReductionContextDerivedSignals({
      positionChangeDerivedSignals,
      executionLocalStructureSignals,
    });

    expect(signals).toHaveLength(3);

    expect(signals[0]).toMatchObject({
      executionIndex: 0,
      executionDecreasedPosition: false,
      executionClosedToFlat: false,
      previousAverageEntryPrice: null,
      previousExecutionPrice: null,
    });

    expect(signals[1]).toMatchObject({
      executionIndex: 1,
      executionDecreasedPosition: false,
      executionClosedToFlat: false,
      previousAverageEntryPrice: 1.185,
      previousExecutionPrice: 1.185,
    });

    expect(signals[2]).toMatchObject({
      executionIndex: 2,
      executionDecreasedPosition: true,
      executionClosedToFlat: true,
      previousAverageEntryPrice: 1.208333,
      previousExecutionPrice: 1.255,
      executionPriceVsPreviousAverageEntryPct: 0.071724,
      executionPriceVsPreviousExecutionPct: 0.031873,
      reductionWasAbovePreviousAverageEntry: true,
      reductionWasBelowPreviousAverageEntry: false,
      reductionWasAbovePreviousExecutionPrice: true,
      reductionWasBelowPreviousExecutionPrice: false,
    });
  });
});
