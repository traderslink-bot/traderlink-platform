import type { DailyTradeAnalyzerInput } from "../contracts/daily-trade-analyzer-contracts";
import type { TradeIndicatorLandmark } from "../../../lib/trade-candle-analysis/trend-momentum-executions";
import { analyzeDailyTradeV2Scenario } from "./daily-trade-v2-scenario-analyzer";

/** Reuse the financial engine's landmarks without changing its eligibility or outcomes. */
export function tradeIndicatorLandmarks(input: DailyTradeAnalyzerInput): readonly TradeIndicatorLandmark[] {
  const scenario = analyzeDailyTradeV2Scenario({ direction: input.direction, candles: input.candles,
    events: input.events.map((event) => ({ ...event, feesDecimal: event.feesDecimal ?? null })) });
  if (!scenario) return [];
  const landmarks: TradeIndicatorLandmark[] = [];
  const add = (key: string, at: number | null, source: "completed_close" | "exit" | null | undefined) => {
    if (at === null || source == null) return;
    // The scenario stamps candle extrema at the minute's end. The extreme can
    // occur anywhere inside it, so only pre-minute indicators were known then.
    landmarks.push({ key, at, contextAt: source === "exit" ? at : at - 60,
      precision: source === "exit" ? "execution" : "candle_range" });
  };
  for (const zone of scenario.profitZones) add(`zone:${zone.lowerBoundPercent}`, zone.firstReachedAtUtcSeconds, zone.firstReachSource);
  const green = scenario.greenOpportunity;
  if (green) {
    add("green:20", green.firstReachedTwentyAtUtcSeconds, green.firstReachedTwentySource);
    add("red:after20", green.firstRedAfterTwentyAtUtcSeconds, green.firstRedAfterTwentySource);
  }
  return landmarks;
}
