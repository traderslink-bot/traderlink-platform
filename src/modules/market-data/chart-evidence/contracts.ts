import type { Candle, ChartTimeframe } from "../../scanner/alpaca/candles";

export const CHART_EVIDENCE_VERSION = 1;

export type ChartEvidenceBasis = Readonly<{
  instrumentId: string;
  symbol: string;
  venue: string;
  /** Opaque identity binding the source, provider generation and adjustment basis. */
  seriesId: string;
  priceBasisId: string;
  sessionMode: "regular" | "extended";
  calendarRevision: string;
  aggregationVersion: string;
}>;

/** All timestamps are Unix seconds. The start is included and the end is excluded. */
export type ChartEvidenceInterval = Readonly<{ start: number; end: number }>;

export type ChartEvidenceCandleReference = Readonly<{
  basis: ChartEvidenceBasis;
  frame: ChartTimeframe;
  interval: ChartEvidenceInterval;
  plotTime: number;
  revision: string;
}>;

export type ChartEvidenceCandle = ChartEvidenceCandleReference & Readonly<{
  bar: Readonly<Candle>;
  acceptedAt: number;
  shortened: boolean;
}>;

export type ChartEvidenceZone = Readonly<{
  instrumentId: string;
  /** Opaque identity for the adjustment/price basis used to compute the zone. */
  priceBasisId: string;
  zoneId: string;
  mapId: string;
  mapRevision: string;
  lower: number;
  upper: number;
  side: "support" | "resistance";
  sourceFrame: ChartTimeframe;
  inputThrough: number;
  firstAvailableAt: number;
  calculatedAt: number;
  expiresAt: number;
  freshness: "fresh" | "aging" | "stale";
}>;

export type ChartEvidenceEvent = Readonly<{
  id: string;
  revision: string;
  ruleVersion: string;
  kind: "swing" | "swing-break" | "structure-break" | "change-of-character" | "level-break" | "failure";
  direction: "up" | "down";
  trigger: ChartEvidenceCandleReference;
  knownAt: number;
  reference:
    | { kind: "candle"; candle: ChartEvidenceCandleReference }
    | { kind: "zone"; zoneId: string; mapId: string; mapRevision: string };
}>;

export type ChartEvidenceLayer<T> =
  | Readonly<{ state: "ready"; facts: readonly T[] }>
  | Readonly<{ state: "unavailable"; reason: "coverage" | "expired" | "incompatible" | "missing" }>;

export type ChartEvidenceContext = Readonly<{
  candles: ChartEvidenceLayer<ChartEvidenceCandle>;
  zones: ChartEvidenceLayer<ChartEvidenceZone>;
  events: ChartEvidenceLayer<ChartEvidenceEvent>;
}>;

/** Already resolved and authorized by the server for the active chart context. */
export type ResolvedChartEvidence = Readonly<{
  version: typeof CHART_EVIDENCE_VERSION;
  /** The public Charts provider generation for which the server resolved this evidence. */
  chartGeneration: string;
  basis: ChartEvidenceBasis;
  current: ChartEvidenceContext;
  match?: ChartEvidenceContext;
}>;
