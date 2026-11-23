import type {
  ChartEvidenceCandle,
  ChartEvidenceCandleReference,
  ChartEvidenceEvent,
} from "./contracts";

export type StructurePolicy = Readonly<{
  /** Identifies the full policy, including swing widths and shortened-candle eligibility. */
  version: string;
  left: number;
  right: number;
  allowShortened: boolean;
}>;

type Swing = Readonly<{
  candle: ChartEvidenceCandle;
  knownAt: number;
  price: number;
  progression: "first" | "higher" | "lower" | "equal";
}>;

type SwingHistory = { latest?: Swing; previous?: Swing; broken: boolean };

export type CandleStructureEvent = ChartEvidenceEvent & Readonly<{
  /** Populated for a swing marker. Equal-to-neighbor extrema are not pivots in this policy. */
  progression?: Swing["progression"];
}>;

function candleReference(candle: ChartEvidenceCandle): ChartEvidenceCandleReference {
  const { basis, frame, interval, plotTime, revision } = candle;
  return { basis, frame, interval, plotTime, revision };
}

function basisKey(candle: ChartEvidenceCandle): string {
  const { instrumentId, seriesId, priceBasisId, sessionMode, calendarRevision, aggregationVersion } = candle.basis;
  return JSON.stringify([instrumentId, seriesId, priceBasisId, sessionMode, calendarRevision, aggregationVersion, candle.frame]);
}

function swingAt(
  segment: readonly ChartEvidenceCandle[],
  endIndex: number,
  policy: StructurePolicy,
  direction: "up" | "down",
  previous?: Swing,
): Swing | undefined {
  const index = endIndex - policy.right;
  const startIndex = index - policy.left;
  if (startIndex < 0) return;
  const candle = segment[index];
  const price = direction === "up" ? candle.bar.high : candle.bar.low;
  let knownAt = Math.max(candle.acceptedAt, previous?.knownAt ?? candle.acceptedAt);
  for (let neighbor = startIndex; neighbor <= endIndex; neighbor++) {
    if (neighbor === index) continue;
    const candidate = segment[neighbor];
    if (direction === "up" ? candidate.bar.high >= price : candidate.bar.low <= price) return;
    knownAt = Math.max(knownAt, candidate.acceptedAt);
  }
  const progression = !previous ? "first" : price > previous.price ? "higher" : price < previous.price ? "lower" : "equal";
  return { candle, knownAt, price, progression };
}

function trendAt(highs: SwingHistory, lows: SwingHistory, start: number): "up" | "down" | undefined {
  const high = highs.latest;
  const low = lows.latest;
  if (
    !high || !low || !highs.previous || !lows.previous ||
    Math.max(high.knownAt, low.knownAt, highs.previous.knownAt, lows.previous.knownAt) > start
  ) return;
  if (high.progression === "higher" && low.progression === "higher" && !lows.broken) return "up";
  if (high.progression === "lower" && low.progression === "lower" && !highs.broken) return "down";
}

function structureEvent(
  kind: "swing" | "swing-break" | "structure-break" | "change-of-character",
  direction: "up" | "down",
  trigger: ChartEvidenceCandle,
  reference: Swing,
  knownAt: number,
  policy: StructurePolicy,
  snapshotRevision: string,
): CandleStructureEvent {
  return {
    id: JSON.stringify([basisKey(trigger), policy.version, kind, direction, trigger.interval.start, reference.candle.interval.start]),
    revision: snapshotRevision,
    ruleVersion: policy.version,
    kind,
    direction,
    trigger: candleReference(trigger),
    knownAt,
    reference: { kind: "candle", candle: candleReference(reference.candle) },
    ...(kind === "swing" ? { progression: reference.progression } : {}),
  };
}

/**
 * Derive current structure as of the cutoff from one authoritative, calendar-ordered slice.
 * The caller marks covered empty or unresolved expected buckets with null. Scheduled closures
 * are omitted. The caller provides the accepted input revisions as of the cutoff, or recomputes
 * with newer revisions and replaces its previous current result to apply corrections.
 */
export function candleStructureAt({
  slots,
  cutoff,
  snapshotRevision,
  policy,
}: {
  slots: readonly (ChartEvidenceCandle | null)[];
  cutoff: number;
  snapshotRevision: string;
  policy: StructurePolicy;
}): { state: "ready"; events: readonly CandleStructureEvent[] } | { state: "unavailable" } {
  if (
    !Number.isFinite(cutoff) || !snapshotRevision || !policy.version ||
    !Number.isSafeInteger(policy.left) || policy.left < 1 ||
    !Number.isSafeInteger(policy.right) || policy.right < 1
  ) return { state: "unavailable" };

  let series: string | undefined;
  let lastEnd = -Infinity;
  let segment: ChartEvidenceCandle[] = [];
  let highs: SwingHistory = { broken: false };
  let lows: SwingHistory = { broken: false };
  const events: CandleStructureEvent[] = [];

  for (const candle of slots) {
    if (candle) {
      const key = basisKey(candle);
      const { start, end } = candle.interval;
      if (
        (series !== undefined && series !== key) ||
        !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < lastEnd || start >= end ||
        !Number.isFinite(candle.acceptedAt) || candle.acceptedAt < end
      ) return { state: "unavailable" };
      series = key;
      lastEnd = end;
    }
    if (candle?.shortened && !policy.allowShortened) continue;
    if (!candle || candle.acceptedAt > cutoff) {
      segment = [];
      highs = { broken: false };
      lows = { broken: false };
      continue;
    }

    const previous = segment.at(-1);
    const trend = trendAt(highs, lows, candle.interval.start);
    for (const [direction, history] of [["up", highs], ["down", lows]] as const) {
      const reference = history.latest;
      if (!previous || !reference || history.broken || reference.knownAt > candle.interval.start) continue;
      const crosses = direction === "up"
        ? previous.bar.close <= reference.price && candle.bar.close > reference.price
        : previous.bar.close >= reference.price && candle.bar.close < reference.price;
      if (!crosses) continue;
      const kind = !trend ? "swing-break" : trend === direction ? "structure-break" : "change-of-character";
      events.push(structureEvent(kind, direction, candle, reference,
        Math.max(previous.acceptedAt, candle.acceptedAt, reference.knownAt), policy, snapshotRevision));
      history.broken = true;
    }

    segment.push(candle);
    for (const [direction, history] of [["up", highs], ["down", lows]] as const) {
      const swing = swingAt(segment, segment.length - 1, policy, direction, history.latest);
      if (!swing) continue;
      history.previous = history.latest;
      history.latest = swing;
      history.broken = false;
      events.push(structureEvent("swing", direction, swing.candle, swing, swing.knownAt, policy, snapshotRevision));
    }
  }
  return { state: "ready", events };
}
