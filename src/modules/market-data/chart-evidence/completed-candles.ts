import { aggregateCandles, candleBucket, type Candle } from "../../scanner/alpaca/candles";
import type {
  ChartEvidenceBasis,
  ChartEvidenceCandle,
  ChartEvidenceInterval,
} from "./contracts";

type RegularIntradayFrame = "1h" | "4h";

const durationSeconds = { "1h": 3_600, "4h": 14_400 } as const;

/** One accepted snapshot scoped to the basis. Coverage may include minutes with no trades. */
export type AcceptedMinuteSnapshot = Readonly<{
  basis: ChartEvidenceBasis;
  revision: string;
  receivedAt: number;
  acceptedAt: number;
  coverage: ChartEvidenceInterval;
  bars: readonly Readonly<Candle>[];
}>;

type CompletedCandleResult =
  | { state: "ready"; candle: ChartEvidenceCandle }
  | { state: "no-trades" | "unavailable" };

/** Use the chart's existing anchor and the verified session end. */
export function regularIntradayBucket(
  time: number,
  frame: RegularIntradayFrame,
  session: ChartEvidenceInterval,
): ChartEvidenceInterval | null {
  if (
    !Number.isSafeInteger(time) || !Number.isSafeInteger(session.start) || !Number.isSafeInteger(session.end) ||
    session.start % 60 !== 0 || session.end % 60 !== 0 || time < session.start || time >= session.end
  ) return null;
  const start = candleBucket(time, frame, true);
  if (!Number.isSafeInteger(start) || start < session.start) return null;
  return { start, end: Math.min(start + durationSeconds[frame], session.end) };
}

/** Aggregate an accepted minute snapshot. Provisional chart data has no role here. */
export function completedRegularIntradayCandle({
  snapshot,
  session,
  frame,
  time,
  cutoff,
}: {
  snapshot: AcceptedMinuteSnapshot;
  session: ChartEvidenceInterval;
  frame: RegularIntradayFrame;
  time: number;
  cutoff: number;
}): CompletedCandleResult {
  const interval = regularIntradayBucket(time, frame, session);
  if (
    !interval ||
    snapshot.basis.sessionMode !== "regular" ||
    !Number.isFinite(cutoff) ||
    !Number.isFinite(snapshot.receivedAt) ||
    !Number.isFinite(snapshot.acceptedAt) ||
    snapshot.receivedAt > snapshot.acceptedAt ||
    snapshot.acceptedAt > cutoff ||
    snapshot.acceptedAt < interval.end ||
    !Number.isSafeInteger(snapshot.coverage.start) ||
    !Number.isSafeInteger(snapshot.coverage.end) ||
    snapshot.coverage.start > interval.start ||
    snapshot.coverage.end < interval.end
  ) return { state: "unavailable" };

  const minutes = snapshot.bars.filter(bar => bar.time >= interval.start && bar.time < interval.end);
  if (minutes.length === 0) return { state: "no-trades" };

  // This is a single immutable source revision. Ambiguous duplicates cannot confirm a break.
  const minuteTimes = new Set<number>();
  for (const bar of minutes) {
    if (
      !Number.isInteger(bar.time) || bar.time % 60 !== 0 || minuteTimes.has(bar.time) ||
      ![bar.open, bar.high, bar.low, bar.close].every(price => Number.isFinite(price) && price > 0) ||
      bar.low > Math.min(bar.open, bar.close) || bar.high < Math.max(bar.open, bar.close) ||
      !Number.isFinite(bar.volume) || bar.volume <= 0
    ) return { state: "unavailable" };
    minuteTimes.add(bar.time);
  }
  const [bar] = aggregateCandles(minutes, frame, true);
  if (!bar || bar.time !== interval.start || !Number.isFinite(bar.volume)) return { state: "unavailable" };

  return {
    state: "ready",
    candle: {
      basis: snapshot.basis,
      frame,
      interval,
      plotTime: bar.time,
      revision: snapshot.revision,
      bar,
      acceptedAt: snapshot.acceptedAt,
      shortened: interval.end - interval.start < durationSeconds[frame],
    },
  };
}
