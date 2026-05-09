import { describe, expect, it } from "vitest";
import { buildExecutionFeedbackFacts } from "../build-execution-feedback-facts";
import { buildExecutionFeedbackPoints } from "../execution-behavior-patterns";
import type { BuildExecutionFeedbackFactsArgs } from "../build-execution-feedback-facts";

function request(
  overrides: Partial<BuildExecutionFeedbackFactsArgs>,
): BuildExecutionFeedbackFactsArgs {
  return {
    symbol: "ABCD",
    tradeDirection: "long",
    sessionContext: {
      sessionDate: "2026-05-01",
      sessionBucket: "market_open",
    },
    executions: [],
    ...overrides,
  };
}

function pointIds(args: BuildExecutionFeedbackFactsArgs): string[] {
  return buildExecutionFeedbackPoints(buildExecutionFeedbackFacts(args)).all.map(
    (point) => point.id,
  );
}

describe("buildExecutionFeedbackPoints", () => {
  it("emits context and strengths for a clean single-entry full-exit trade", () => {
    const points = buildExecutionFeedbackPoints(
      buildExecutionFeedbackFacts(
        request({
          executions: [
            {
              symbol: "ABCD",
              timestamp: "2026-05-01T13:30:00.000Z",
              side: "buy",
              shares: 100,
              price: 10,
            },
            {
              symbol: "ABCD",
              timestamp: "2026-05-01T13:40:00.000Z",
              side: "sell",
              shares: 100,
              price: 11,
            },
          ],
        }),
      ),
    );

    expect(points.context.map((point) => point.id)).toEqual([
      "full_exit_trade",
      "single_entry_trade",
    ]);
    expect(points.strengths.map((point) => point.id)).toEqual([
      "clean_single_entry_full_exit",
      "profitable_reduction_sequence",
      "decisive_full_exit",
    ]);
    expect(points.risks).toEqual([]);
  });

  it("emits size-discipline strengths for favorable execution-price scale-ins", () => {
    const ids = pointIds(
      request({
        executions: [
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:30:00.000Z",
            side: "buy",
            shares: 100,
            price: 10,
          },
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:34:00.000Z",
            side: "buy",
            shares: 100,
            price: 12,
          },
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:50:00.000Z",
            side: "sell",
            shares: 200,
            price: 13,
          },
        ],
      }),
    );

    expect(ids).toEqual(
      expect.arrayContaining([
        "multi_entry_trade",
        "controlled_scale_in",
        "consistent_share_sizing",
        "profitable_reduction_sequence",
      ]),
    );
    expect(ids).not.toContain("size_expansion_after_adverse_price");
  });

  it("emits high-priority risks for repeated adverse adds before any reduction", () => {
    const points = buildExecutionFeedbackPoints(
      buildExecutionFeedbackFacts(
        request({
          executions: [
            {
              symbol: "ABCD",
              timestamp: "2026-05-01T13:30:00.000Z",
              side: "buy",
              shares: 100,
              price: 10,
            },
            {
              symbol: "ABCD",
              timestamp: "2026-05-01T13:32:00.000Z",
              side: "buy",
              shares: 100,
              price: 9,
            },
            {
              symbol: "ABCD",
              timestamp: "2026-05-01T13:34:00.000Z",
              side: "buy",
              shares: 100,
              price: 8,
            },
            {
              symbol: "ABCD",
              timestamp: "2026-05-01T13:36:00.000Z",
              side: "buy",
              shares: 100,
              price: 7,
            },
            {
              symbol: "ABCD",
              timestamp: "2026-05-01T13:50:00.000Z",
              side: "sell",
              shares: 400,
              price: 6,
            },
          ],
        }),
      ),
    );

    expect(points.risks.map((point) => point.id)).toEqual([
      "size_expansion_after_adverse_price",
      "multiple_adds_before_first_reduction",
      "overbuilt_position",
      "all_or_nothing_exit_after_many_adds",
      "losing_reduction_sequence",
    ]);
    expect(points.risks[0]).toMatchObject({
      id: "size_expansion_after_adverse_price",
      severity: "high",
      evidence: {
        adversePriceAddCount: 3,
        adversePriceAddExecutionIndexes: [1, 2, 3],
      },
    });
  });

  it("handles open-position, small first reduction, large late add, and rapid-fire risks", () => {
    const ids = pointIds(
      request({
        executions: [
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:30:00.000Z",
            side: "buy",
            shares: 100,
            price: 10,
          },
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:30:05.000Z",
            side: "sell",
            shares: 10,
            price: 10.5,
          },
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:30:10.000Z",
            side: "buy",
            shares: 80,
            price: 10.6,
          },
        ],
      }),
    );

    expect(ids).toEqual(
      expect.arrayContaining([
        "open_position_trade",
        "open_position_leftover",
        "small_first_risk_reduction",
        "large_late_add",
        "rapid_fire_execution_cluster",
      ]),
    );
  });

  it("uses direction-aware adverse add logic for short trades", () => {
    const ids = pointIds(
      request({
        tradeDirection: "short",
        executions: [
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:30:00.000Z",
            side: "sell",
            shares: 100,
            price: 20,
          },
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:35:00.000Z",
            side: "sell",
            shares: 100,
            price: 22,
          },
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:50:00.000Z",
            side: "buy",
            shares: 200,
            price: 19,
          },
        ],
      }),
    );

    expect(ids).toContain("size_expansion_after_adverse_price");
    expect(ids).not.toContain("controlled_scale_in");
  });

  it("keeps execution-only wording free of candle-dependent labels", () => {
    const points = buildExecutionFeedbackPoints(
      buildExecutionFeedbackFacts(
        request({
          executions: [
            {
              symbol: "ABCD",
              timestamp: "2026-05-01T13:30:00.000Z",
              side: "buy",
              shares: 100,
              price: 10,
            },
            {
              symbol: "ABCD",
              timestamp: "2026-05-01T13:31:00.000Z",
              side: "buy",
              shares: 100,
              price: 9,
            },
            {
              symbol: "ABCD",
              timestamp: "2026-05-01T13:32:00.000Z",
              side: "sell",
              shares: 200,
              price: 8,
            },
          ],
        }),
      ),
    );
    const text = JSON.stringify(points).toLowerCase();

    expect(text).not.toMatch(
      /support|resistance|vwap|ema|breakout|trend|setup|candle|market structure/,
    );
  });
});
