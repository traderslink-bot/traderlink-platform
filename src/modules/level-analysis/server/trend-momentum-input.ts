import type { TradeExecutionIndicatorInput } from "@/src/lib/trade-candle-analysis/trend-momentum-executions";
import type { IndicatorHistoryInput } from "@/src/lib/trade-candle-analysis/trend-momentum-history";
import { newYorkExtendedSession, newYorkMarketSessionBoundaries } from "./daily-trade-analyzer-session";

// EMA initialization is distinct from the larger history acquisition target.
// Always use all accepted earlier candles; do not hide an initialized average
// merely because the preferred convergence history could not be acquired.
// RSI retains its separate calibrated history requirement.
const policy = Object.freeze({ version: "trade_indicator_policy_v2",
  minimumBars: Object.freeze({ ema9: 9, ema20: 20, rsi14: 200 }),
  emaChangePercent: 0.02, rsiChangePoints: 2, maxAgeSeconds: 120 });

/** Takes already start-labeled evidence; never requests or modifies candles. */
export function buildTradeIndicatorInput(
  tradingDateNewYork: string,
  history: IndicatorHistoryInput,
): TradeExecutionIndicatorInput {
  const session = newYorkExtendedSession(tradingDateNewYork);
  if (!session) throw new Error("indicator_history_session_invalid");
  return Object.freeze({ history,
    session: Object.freeze({ start: session.startTime, endExclusive: session.endTime }),
    resetTimes: Object.freeze([session.startTime,
      ...newYorkMarketSessionBoundaries(tradingDateNewYork).map((boundary) => Date.parse(boundary.atUtc) / 1000)]),
    policies: Object.freeze({ "1m": policy, "5m": Object.freeze({ ...policy, maxAgeSeconds: 600 }) }),
  });
}
