export const CHART_TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D"] as const;
export type ChartTimeframe = typeof CHART_TIMEFRAMES[number];
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

export function chartSymbol(value: string): string {
  const symbol = value.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)) throw Error("invalid_symbol");
  return symbol;
}

export function chartTimeframe(value: string): ChartTimeframe {
  if (!CHART_TIMEFRAMES.includes(value as ChartTimeframe)) throw Error("invalid_timeframe");
  return value as ChartTimeframe;
}

export function alpacaCandle(value: unknown): Candle | null {
  if (!value || typeof value !== "object") return null;
  const bar = value as Record<string, unknown>;
  const time = typeof bar.t === "string" ? Date.parse(bar.t) / 1000 : NaN;
  const values = [bar.o, bar.h, bar.l, bar.c, bar.v];
  if (!Number.isFinite(time) || !values.every(value => typeof value === "number" && Number.isFinite(value) && value >= 0)) return null;
  const [open, high, low, close, volume] = values as number[];
  if (low > Math.min(open, close) || high < Math.max(open, close) || low > high) return null;
  return { time: Math.floor(time), open, high, low, close, volume };
}

export function aggregateCandles(input: Iterable<Candle>, timeframe: ChartTimeframe): Candle[] {
  const minutes = { "1m": 1, "5m": 5, "15m": 15, "1h": 60, "4h": 240, "1D": 0 }[timeframe];
  const unique = new Map<number, Candle>();
  for (const bar of input) unique.set(bar.time, bar);
  const buckets = new Map<number, Candle>();
  for (const bar of [...unique.values()].sort((a, b) => a.time - b.time)) {
    const time = minutes ? Math.floor(bar.time / (minutes * 60)) * minutes * 60 : bar.time;
    const previous = buckets.get(time);
    buckets.set(time, previous ? { ...previous, high: Math.max(previous.high, bar.high), low: Math.min(previous.low, bar.low), close: bar.close, volume: previous.volume + bar.volume } : { ...bar, time });
  }
  return [...buckets.values()];
}
