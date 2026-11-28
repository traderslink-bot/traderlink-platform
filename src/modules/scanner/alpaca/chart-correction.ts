import { chartSymbol, type Candle } from "./candles";

export type PremarketTradeTotals = { through: number; volume: number; dollarVolume: number };
export type ChartCorrection = { symbol: string; minute: number; bar: Candle | null; premarket?: PremarketTradeTotals };

export function parseChartCorrection(value: unknown): ChartCorrection {
  const event = value as ChartCorrection;
  if (!event || typeof event.symbol !== "string" || chartSymbol(event.symbol) !== event.symbol ||
      !Number.isSafeInteger(event.minute) || event.minute <= 0 || event.minute % 60 !== 0) throw Error("invalid_chart_correction");
  const { bar, premarket } = event;
  if (premarket !== undefined && (!premarket || !Number.isSafeInteger(premarket.through) ||
      premarket.through <= event.minute || premarket.through % 60 !== 0 ||
      !Number.isSafeInteger(premarket.volume) || premarket.volume <= 0 ||
      !Number.isFinite(premarket.dollarVolume) || premarket.dollarVolume <= 0)) throw Error("invalid_chart_correction");
  const totals = premarket ? { premarket: {
    through: premarket.through, volume: premarket.volume, dollarVolume: premarket.dollarVolume,
  } } : {};
  if (bar === null) return { symbol: event.symbol, minute: event.minute, bar, ...totals };
  if (!bar || bar.time !== event.minute ||
      ![bar.open, bar.high, bar.low, bar.close].every(price => Number.isFinite(price) && price > 0) ||
      !Number.isSafeInteger(bar.volume) || bar.volume < 0 ||
      bar.low > Math.min(bar.open, bar.close) || bar.high < Math.max(bar.open, bar.close)) throw Error("invalid_chart_correction");
  return { symbol: event.symbol, minute: event.minute, bar: {
    time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume,
  }, ...totals };
}

export type StoredChartCorrection = ChartCorrection & {
  correctionRevision?: number;
  /** A witnessed prior OHLCV for exact same-basis comparisons across providers. */
  before?: Candle;
};

export function parseStoredChartCorrection(input: unknown): StoredChartCorrection {
  const correction = parseChartCorrection(input);
  const { correctionRevision, before } = input as StoredChartCorrection;
  if (correctionRevision !== undefined && (!Number.isSafeInteger(correctionRevision) || correctionRevision <= 0)) throw Error("invalid_chart_correction");
  if (before === null) throw Error("invalid_chart_correction");
  return { ...correction, ...(correctionRevision === undefined ? {} : { correctionRevision }),
    ...(before === undefined ? {} : { before: parseChartCorrection({ ...correction, bar: before }).bar! }) };
}

export function applyChartCorrection(bars: Map<number, Candle>, { minute, bar }: ChartCorrection) {
  if (bar) bars.set(minute, bar);
  else bars.delete(minute);
}
