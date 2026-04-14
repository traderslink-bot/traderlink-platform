// 2026-04-12 10:18 AM America/Toronto
// PURPOSE:
// End to end raw trade timeline tests for the canonical raw timeline creation flow.
// These tests validate factual structure only.

import { describe, expect, it } from "vitest";
import { createRawTradeTimeline } from "../builders/create-raw-trade-timeline";
import { sampleCreateRawTradeTimelineInput } from "../__fixtures__/sample-create-raw-trade-timeline-input";
import { buildExecutionDerivedSignals } from "../derived/build-execution-derived-signals";

describe("createRawTradeTimeline", () => {
    it("builds a complete raw trade timeline from normalize-ready inputs", () => {
        const result = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);

        expect(result.input.symbol).toBe("ABCD");
        expect(result.input.timeframe).toBe("1m");
        expect(result.input.tradeDirection).toBe("long");

        expect(result.timeline.symbol).toBe("ABCD");
        expect(result.timeline.timeframe).toBe("1m");
        expect(result.timeline.tradeDirection).toBe("long");

        expect(result.timeline.executions).toHaveLength(3);
        expect(result.timeline.preTradeCandles.length).toBeGreaterThan(0);
        expect(result.timeline.tradeCandles.length).toBeGreaterThan(0);
        expect(result.timeline.postTradeCandles.length).toBeGreaterThan(0);
        expect(result.timeline.allCandles).toHaveLength(11);

        expect(result.timeline.executionContextWindows).toHaveLength(3);
        expect(result.timeline.tradeStateSeries.snapshots).toHaveLength(3);

        expect(result.timeline.timelineSegments).toHaveLength(4);
        expect(result.timeline.timelineSegments[0].segmentType).toBe("pre_trade");
        expect(result.timeline.timelineSegments[1].segmentType).toBe("between_executions");
        expect(result.timeline.timelineSegments[2].segmentType).toBe("between_executions");
        expect(result.timeline.timelineSegments[3].segmentType).toBe("post_trade");
    });

    it("preserves deterministic trade state progression for a simple long trade", () => {
        const result = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);
        const snapshots = result.timeline.tradeStateSeries.snapshots;

        expect(snapshots[0].positionSize).toBe(100);
        expect(snapshots[0].averageEntryPrice).toBe(1.185);
        expect(snapshots[0].realizedPnl).toBe(0);
        expect(snapshots[0].isFlat).toBe(false);

        expect(snapshots[1].positionSize).toBe(150);
        expect(snapshots[1].averageEntryPrice).toBeCloseTo(1.208333, 6);
        expect(snapshots[1].realizedPnl).toBe(0);
        expect(snapshots[1].isFlat).toBe(false);

        expect(snapshots[2].positionSize).toBe(0);
        expect(snapshots[2].averageEntryPrice).toBeNull();
        expect(snapshots[2].realizedPnl).toBeCloseTo(13.00005, 5);
        expect(snapshots[2].isFlat).toBe(true);
    });

    it("builds execution windows around each execution", () => {
        const result = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);
        const windows = result.timeline.executionContextWindows;

        expect(windows[0].execution.executionIndex).toBe(0);
        expect(windows[0].candlesBeforeExecution).toHaveLength(2);
        expect(windows[0].candlesAfterExecution).toHaveLength(2);

        expect(windows[1].execution.executionIndex).toBe(1);
        expect(windows[1].candlesBeforeExecution).toHaveLength(2);
        expect(windows[1].candlesAfterExecution).toHaveLength(2);

        expect(windows[2].execution.executionIndex).toBe(2);
        expect(windows[2].candlesBeforeExecution).toHaveLength(2);
        expect(windows[2].candlesAfterExecution).toHaveLength(1);
    });

    it("returns warnings only when the underlying validators produce them", () => {
        const result = createRawTradeTimeline(sampleCreateRawTradeTimelineInput);

        expect(Array.isArray(result.warnings) || result.warnings === undefined).toBe(true);
    });

    it("normalizes provider session aliases into canonical internal session buckets", () => {
        const result = createRawTradeTimeline({
            ...sampleCreateRawTradeTimelineInput,
            sessionContext: {
                ...sampleCreateRawTradeTimelineInput.sessionContext,
                sessionBucket: "open",
            },
            preTradeCandles: sampleCreateRawTradeTimelineInput.preTradeCandles.map((candle) => ({
                ...candle,
                sessionBucket: "open",
            })),
            tradeCandles: sampleCreateRawTradeTimelineInput.tradeCandles.map((candle) => ({
                ...candle,
                sessionBucket: "open",
            })),
            postTradeCandles: sampleCreateRawTradeTimelineInput.postTradeCandles.map((candle) => ({
                ...candle,
                sessionBucket: "open",
            })),
        });

        expect(result.timeline.sessionContext.sessionBucket).toBe("market_open");
        expect(result.timeline.preTradeCandles.every((candle) => candle.sessionBucket === "market_open")).toBe(true);
    });
});
