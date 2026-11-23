import type { Candle } from "../../scanner/alpaca/candles";
import type { ChartEvidenceBasis, ChartEvidenceZone } from "./contracts";

const utc = (time: string) => Date.parse(`2026-11-18T${time}Z`) / 1_000;

const basis: ChartEvidenceBasis = {
  instrumentId: "fixture-instrument-4h",
  symbol: "QA",
  venue: "fixture",
  seriesId: "fixture-series-1",
  priceBasisId: "fixture-split-basis-1",
  sessionMode: "regular",
  calendarRevision: "fixture-calendar-1",
  aggregationVersion: "regular-aggregation-1",
};

const start = utc("14:30:00");
const end = utc("18:30:00");
const minutes = Array.from({ length: 240 }, (_, index): Candle => {
  const minute = { time: start + index * 60, open: 10.05, high: 10.05, low: 10.05, close: 10.05, volume: 100 };
  switch (index) {
    case 0: return { ...minute, open: 9.98, low: 9.98 };
    case 60: return { ...minute, high: 10.25 };
    case 120: return { ...minute, low: 9.90 };
    case 236: return { ...minute, low: 10.00 };
    case 237: return { ...minute, high: 10.09 };
    case 239: return { ...minute, open: 10.22, high: 10.22, low: 10.20, close: 10.20 };
    default: return minute;
  }
});

const fourHourZone: ChartEvidenceZone = {
  instrumentId: basis.instrumentId,
  priceBasisId: basis.priceBasisId,
  zoneId: "fixture-zone-4h",
  mapId: "fixture-map-4h",
  mapRevision: "fixture-map-4h-v1",
  lower: 10.00,
  upper: 10.10,
  side: "resistance",
  sourceFrame: "4h",
  inputThrough: utc("14:20:00"),
  firstAvailableAt: utc("14:29:00"),
  calculatedAt: utc("14:28:00"),
  expiresAt: utc("23:00:00"),
  freshness: "fresh",
};

export const SHARED_CHART_REPLAY = {
  basis,
  session: { start, end: utc("21:00:00") },
  triggerInterval: { start, end },
  priorEligibleClose: 9.95,
  minutes,
  coveredEmptyTail: { start: utc("18:25:50"), end: utc("18:26:00") },
  provisionalPrints: [
    { time: utc("18:29:50"), price: 10.22, volume: 40 },
    { time: utc("18:29:59"), price: 10.20, volume: 60 },
  ],
  receivedAt: utc("18:30:02"),
  acceptedAt: utc("18:30:03"),
  revision: "fixture-trigger-v1",
  expectedTriggerBar: { time: start, open: 9.98, high: 10.25, low: 9.90, close: 10.20, volume: 24_000 },
  expectedIntradayTest: { low: 10.00, high: 10.22, latestPrice: 10.22, volume: 340 },
  fourHourZone,
  dailyZone: {
    ...fourHourZone,
    zoneId: "fixture-zone-daily",
    mapId: "fixture-map-daily",
    mapRevision: "fixture-map-daily-v1",
    lower: 10.50,
    upper: 10.55,
    sourceFrame: "1D",
  } satisfies ChartEvidenceZone,
} as const;
