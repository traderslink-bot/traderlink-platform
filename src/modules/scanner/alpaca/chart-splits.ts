import { calendarDate } from "./chart-calendar";
import { candleBucket, easternDayStart, type Candle, type ChartTimeframe } from "./candles";

export type ChartSplit = {
  id: string;
  date: string;
  oldShares: number;
  newShares: number;
};

export function parseChartSplits(value: unknown): ChartSplit[] {
  if (!Array.isArray(value) || value.length > 2_000) throw Error("invalid_chart_splits");
  const splits = new Map<string, ChartSplit>();
  for (const row of value) {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id || row.id.length > 128 ||
      !calendarDate(row.date) || !Number.isFinite(row.oldShares) || row.oldShares <= 0 ||
      !Number.isFinite(row.newShares) || row.newShares <= 0 || row.newShares === row.oldShares) {
      throw Error("invalid_chart_split");
    }
    const split = { id: row.id, date: row.date, oldShares: row.oldShares, newShares: row.newShares };
    const prior = splits.get(split.id);
    if (prior && (prior.date !== split.date || prior.oldShares !== split.oldShares || prior.newShares !== split.newShares)) {
      throw Error("conflicting_chart_split");
    }
    splits.set(split.id, split);
  }
  return [...splits.values()];
}

export function chartSplitLabel(split: ChartSplit) {
  const shares = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 8 });
  return `${shares.format(split.newShares)}-for-${shares.format(split.oldShares)} ${split.newShares < split.oldShares ? "reverse split" : "split"}`;
}

export function projectChartSplits(
  splits: readonly ChartSplit[],
  observed: Iterable<Pick<Candle, "time"> & { carried?: boolean }>,
  timeframe: ChartTimeframe,
  regularOnly: boolean,
  coveredFrom?: number,
) {
  const times = [...observed].filter(bar => !bar.carried).map(bar => bar.time).sort((a, b) => a - b);
  if (!times.length) return [];
  const firstDay = easternDayStart(Math.min(times[0], coveredFrom ?? times[0]));
  return splits.flatMap(split => {
    const effective = easternDayStart(Date.parse(split.date + "T12:00:00Z") / 1000);
    if (effective < firstDay) return [];
    const first = times.find(time => time >= effective);
    return first === undefined ? [] : [{ split, time: candleBucket(first, timeframe, regularOnly) }];
  }).sort((a, b) => a.time - b.time);
}
