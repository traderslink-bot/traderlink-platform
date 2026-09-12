import type { IndicatorHistoryInput, IndicatorHistoryRange } from "./trend-momentum-history";
import { tradeIndicatorContextAt, type TradeIndicatorContextPolicy } from "./trend-momentum-context";
import { calculateTradeIndicatorSeries, calculateTradeSessionVwap, TRADE_INDICATOR_CALCULATION_VERSION } from "./trend-momentum-indicators";

export type TradeExecutionIndicatorInput = Readonly<{
  historyOutcome?: string;
  history: IndicatorHistoryInput;
  session: IndicatorHistoryRange;
  resetTimes: readonly number[];
  policies: Readonly<Record<"1m" | "5m", TradeIndicatorContextPolicy>>;
}>;

/** Additive evidence: never changes executions, grouping or financial calculations. */
export function analyzeTradeExecutionIndicators(
  input: TradeExecutionIndicatorInput,
  events: readonly Readonly<{ eventId: string; executedAtUtc: string }>[],
) {
  const one = calculateTradeIndicatorSeries(input.history, "1m");
  const five = calculateTradeIndicatorSeries(input.history, "5m");
  const seen = new Set<string>();
  const executions = events.map((event) => {
    const at = Date.parse(event.executedAtUtc) / 1000;
    if (!event.eventId || seen.has(event.eventId) || !Number.isFinite(at)) {
      throw new Error("trade_indicator_execution_invalid");
    }
    seen.add(event.eventId);
    // Never present the latest history as if it were known at a later execution.
    const coveredThroughExecution = at <= input.history.asOf;
    const context = (interval: "1m" | "5m") => coveredThroughExecution
      ? tradeIndicatorContextAt({ series: interval === "1m" ? one : five, at, interval,
          completedRanges: input.history.completedRanges, resetTimes: input.resetTimes,
          policy: input.policies[interval] }) : null;
    return Object.freeze({ eventId: event.eventId, executedAtUtc: event.executedAtUtc,
      oneMinute: context("1m"), fiveMinute: context("5m"),
      sessionVwap: coveredThroughExecution ? calculateTradeSessionVwap({ ...input.history,
        asOf: Math.floor(at) }, input.session) : null });
  });
  return Object.freeze({ calculationVersion: TRADE_INDICATOR_CALCULATION_VERSION,
    historyOutcome: input.historyOutcome ?? "complete",
    executions: Object.freeze(executions) });
}

export type TradeExecutionIndicatorResult = ReturnType<typeof analyzeTradeExecutionIndicators>;
