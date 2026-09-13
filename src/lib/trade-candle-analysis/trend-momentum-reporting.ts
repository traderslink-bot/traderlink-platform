import Decimal from "decimal.js";
import type { TradeExecutionIndicatorResult } from "./trend-momentum-executions";

/** Convert price-valued evidence only; RSI, percentages and event times are invariant. */
export function scaleTradeIndicatorResult(result: TradeExecutionIndicatorResult, multiplier: string): TradeExecutionIndicatorResult {
  const rate = new Decimal(multiplier);
  if (!rate.isFinite() || rate.lte(0)) throw new Error("indicator_reporting_rate_invalid");
  if (rate.eq(1)) return result;
  const scale = (value: number | null) => value === null ? null : new Decimal(value).mul(rate).toNumber();
  const context = (value: TradeExecutionIndicatorResult["executions"][number]["oneMinute"]) => value
    ? { ...value, ema9: scale(value.ema9), ema20: scale(value.ema20) } : null;
  const during = (value: TradeExecutionIndicatorResult["duringTrade"]["oneMinute"]) => value ? {
    ...value,
    episodes: value.episodes.map((episode) => ({ ...episode, price: scale(episode.price)!, reclaimPrice: scale(episode.reclaimPrice),
      horizons: episode.horizons.map((horizon) => ({ ...horizon, changePerShare: scale(horizon.changePerShare) })),
      untilClosure: { ...episode.untilClosure, changePerShare: scale(episode.untilClosure.changePerShare)! },
    })),
    crossings: value.crossings.map((crossing) => ({ ...crossing, price: scale(crossing.price)! })),
  } : null;
  const chart = (points: TradeExecutionIndicatorResult["chartSeries"]["oneMinute"]) => points.map((point) => ({ ...point,
    close: scale(point.close)!, ema9: scale(point.ema9), ema20: scale(point.ema20), vwap: scale(point.vwap) }));
  return { ...result,
    ...(result.landmarks ? { landmarks: result.landmarks.map((landmark) => ({ ...landmark,
      lastCompletedClose: landmark.lastCompletedClose == null ? null : scale(landmark.lastCompletedClose),
      oneMinute: context(landmark.oneMinute), fiveMinute: context(landmark.fiveMinute),
      sessionVwap: landmark.sessionVwap ? { ...landmark.sessionVwap, value: scale(landmark.sessionVwap.value) } : null,
    })) } : {}),
    ...(result.chartSeries ? { chartSeries: { oneMinute: chart(result.chartSeries.oneMinute), fiveMinute: chart(result.chartSeries.fiveMinute) } } : {}),
    executions: result.executions.map((event) => ({ ...event,
    oneMinute: context(event.oneMinute), fiveMinute: context(event.fiveMinute),
    sessionVwap: event.sessionVwap ? { ...event.sessionVwap, value: scale(event.sessionVwap.value) } : null,
  })), duringTrade: { oneMinute: during(result.duringTrade.oneMinute), fiveMinute: during(result.duringTrade.fiveMinute) } };
}
