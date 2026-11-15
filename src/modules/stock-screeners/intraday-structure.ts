import { OPENING_RANGE_MINUTES, type Values } from "./contracts";
import type { ProviderBar, Window } from "./market-metrics";

export const SCREENER_BAR_MS = 5 * 60_000;

export function completedSessionBars(window: Window, bars: Iterable<ProviderBar>) {
  return Array.from(bars).filter(bar => {
    const start = bar.time * 1000;
    return start >= window.from && start + SCREENER_BAR_MS <= window.asOf;
  });
}

export function barNotional(bars: readonly ProviderBar[]) {
  return bars.length && bars.every(bar => bar.vwap !== undefined)
    ? bars.reduce((sum, bar) => sum + bar.vwap! * bar.volume, 0)
    : undefined;
}

function vwapPosition(price: number, vwap: number) {
  const difference = price - vwap;
  return Math.abs(difference) <= Number.EPSILON * Math.max(price, vwap) * 8 ? 0 : Math.sign(difference);
}

/** Window-scoped, chronological, completed SIP bars from a fully paginated response. */
export function intradayStructureMetrics(window: Window, bars: readonly ProviderBar[], price: number, priceAt: number): Values {
  const values: Values = {};
  if (window.session === "regular" || window.session === "last_regular") {
    for (const minutes of OPENING_RANGE_MINUTES) {
      const rangeEnd = window.from + minutes * 60_000;
      if (window.asOf < rangeEnd) break;
      const opening = bars.filter(bar => bar.time * 1000 + SCREENER_BAR_MS <= rangeEnd);
      if (!opening.length) continue;
      const high = Math.max(...opening.map(bar => bar.high));
      const low = Math.min(...opening.map(bar => bar.low));
      values[`or${minutes}High`] = high;
      values[`or${minutes}Low`] = low;
      values[`or${minutes}Width`] = (high / low - 1) * 100;
      if (priceAt > rangeEnd) values[`or${minutes}Position`] = price > high ? 1 : price < low ? -1 : 0;
    }
  }

  const traded = bars.filter(bar => bar.volume > 0);
  const volume = traded.reduce((sum, bar) => sum + bar.volume, 0);
  const notional = barNotional(traded);
  if (notional === undefined || volume <= 0) return values;
  const vwap = notional / volume;
  if (!Number.isFinite(vwap) || vwap <= 0) return values;
  values.sessionVwap = vwap;
  const position = vwapPosition(price, vwap);
  values.vwapPosition = position;
  values.vwapDistance = position === 0 ? 0 : (price / vwap - 1) * 100;

  const last = traded.at(-1), previous = traded.at(-2);
  if (!last || !previous || last.time * 1000 + SCREENER_BAR_MS !== window.asOf
    || (last.time - previous.time) * 1000 !== SCREENER_BAR_MS) return values;
  const priorVwap = (notional - last.vwap! * last.volume) / (volume - last.volume);
  if (!Number.isFinite(priorVwap) || priorVwap <= 0) return values;
  const before = vwapPosition(previous.close, priorVwap);
  const after = vwapPosition(last.close, vwap);
  values.vwapCross = before <= 0 && after > 0 ? 1 : before >= 0 && after < 0 ? -1 : 0;
  return values;
}
