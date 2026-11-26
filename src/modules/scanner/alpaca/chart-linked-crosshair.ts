import { candleBucket, easternDayStart, type ChartTimeframe } from "./candles";

export function linkedCandleTime(time: number, timeframe: ChartTimeframe, regularOnly: boolean) {
  return timeframe === "1D" ? easternDayStart(time) : candleBucket(time, timeframe, regularOnly);
}

type Listener = (time: number | null) => void;

export function createChartCrosshairLink() {
  const listeners = new Map<symbol, Listener>();
  let active: symbol | null = null;
  let time: number | null = null;

  function publish(owner: symbol, next: number | null) {
    if (next === null && active !== owner) return;
    if (owner === active && next === time) return;
    time = next;
    active = next === null ? null : owner;
    for (const [pane, listener] of listeners) {
      if (pane !== owner) listener(next);
    }
  }

  return {
    publish,
    attach(owner: symbol, listener: Listener) {
      listeners.set(owner, listener);
      return () => {
        listeners.delete(owner);
        publish(owner, null);
      };
    },
  };
}
