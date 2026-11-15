import type { SeriesMarker, UTCTimestamp } from "lightweight-charts";
import { candleBucket, easternDayStart, type ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import type { ChartJournalItem, ChartJournalOverlay, ChartJournalTrade } from "@/src/modules/journal/contracts/journal-chart-contracts";
import { candleIndexAtOrAfter } from "./chart-drawing-volume";

type MarkerKind = ChartJournalOverlay["kind"] | "pattern" | "rule";
type Bucket<Kind> = { ids: string[]; time: number; kind: Kind };
const markerStyles = {
  buy: { position: "belowBar", shape: "arrowUp", color: "#15a368" },
  sell: { position: "aboveBar", shape: "arrowDown", color: "#dd424d" },
  note: { position: "aboveBar", shape: "circle", color: "#4083ec" },
  pattern: { position: "aboveBar", shape: "circle", color: "#8b5cf6" },
  rule: { position: "aboveBar", shape: "square", color: "#e6a020" },
} as const;

export function chartJournalFocusBounds(from: number, to: number, timeframe: ChartTimeframe, regularOnly: boolean) {
  if (timeframe === "1D") {
    return { first: easternDayStart(from), last: easternDayStart(easternDayStart(to) + 36 * 3600) - 1 };
  }
  return { first: candleBucket(from, timeframe, regularOnly), last: candleBucket(to, timeframe, regularOnly) };
}

export function makeJournalMarkers<Kind extends MarkerKind>(
  overlay: readonly { id: string; time: number; kind: Kind }[],
  chart: {
    timeframe: ChartTimeframe;
    regularOnly: boolean;
    sortedCandles: readonly { time: number }[];
    hasCandle: (time: number) => boolean;
  },
  inVisibleSession: (time: number) => boolean,
) {
  const { timeframe, regularOnly, sortedCandles, hasCandle } = chart;
  const buckets = new Map<string, Bucket<Kind>>();
  for (const item of overlay) {
    if (!inVisibleSession(item.time)) continue;
    const { first, last } = timeframe === "1D" ? chartJournalFocusBounds(item.time, item.time, timeframe, regularOnly)
      : { first: candleBucket(item.time, timeframe, regularOnly), last: Infinity };
    // Daily bars keep the provider timestamp. Match executions and pins by their Eastern trading date.
    const time = timeframe === "1D" ? sortedCandles[candleIndexAtOrAfter(sortedCandles, first)]?.time : first;
    if (time === undefined || time > last || !hasCandle(time)) continue;
    const key = `journal-${time}-${item.kind}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.ids.push(item.id);
    else buckets.set(key, { ids: [item.id], time, kind: item.kind });
  }
  const markers = [...buckets].sort((a, b) => a[1].time - b[1].time).map(([id, item]): SeriesMarker<UTCTimestamp> => {
    const { position, shape, color } = markerStyles[item.kind];
    return {
      id, time: item.time as UTCTimestamp, position, shape, color,
      text: item.ids.length > 1 ? String(item.ids.length) : undefined,
    };
  });
  return { markers, buckets };
}

export function chartJournalLocalTime(seconds: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(seconds * 1000));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}:${value("second")}` };
}

export function chartJournalDayAt(seconds: number) {
  return easternClock(seconds * 1000).date;
}

export function matchingChartPlan(items: readonly ChartJournalItem[], trade: ChartJournalTrade | undefined) {
  return trade && items.find((item) => item.kind === "plan" && item.roundTripId && trade.memberIds.includes(item.roundTripId));
}

export type ChartJournalFocus = Readonly<{ symbol: string; from: number; to: number }>;
