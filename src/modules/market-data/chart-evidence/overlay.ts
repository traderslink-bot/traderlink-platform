import type { ChartTimeframe, DisplayCandle } from "../../scanner/alpaca/candles";
import {
  CHART_EVIDENCE_VERSION,
  type ChartEvidenceBasis,
  type ChartEvidenceCandle,
  type ChartEvidenceCandleReference,
  type ChartEvidenceEvent,
  type ChartEvidenceZone,
  type ResolvedChartEvidence,
} from "./contracts";

function compatibleBasis(left: ChartEvidenceBasis, right: ChartEvidenceBasis): boolean {
  return left.instrumentId === right.instrumentId && left.seriesId === right.seriesId &&
    left.priceBasisId === right.priceBasisId && left.calendarRevision === right.calendarRevision &&
    left.aggregationVersion === right.aggregationVersion && left.sessionMode === right.sessionMode;
}

function sameReference(left: ChartEvidenceCandleReference, right: ChartEvidenceCandleReference): boolean {
  return compatibleBasis(left.basis, right.basis) && left.frame === right.frame &&
    left.plotTime === right.plotTime && left.revision === right.revision &&
    left.interval.start === right.interval.start && left.interval.end === right.interval.end;
}

function matchesPlot(candle: ChartEvidenceCandle, plotted?: DisplayCandle): boolean {
  if (!plotted || plotted.carried || plotted.time !== candle.plotTime) return false;
  const { bar } = candle;
  return bar.time === plotted.time && bar.open === plotted.open && bar.high === plotted.high &&
    bar.low === plotted.low && bar.close === plotted.close && bar.volume === plotted.volume;
}

export type ChartOverlay = Readonly<{
  state: "ready" | "unavailable";
  events: readonly ChartEvidenceEvent[];
  zones: readonly ChartEvidenceZone[];
  missingCandle: boolean;
  missingEvent: boolean;
  missingZone: boolean;
}>;

/** Project authorized evidence onto this chart without adding or changing any prices. */
export function projectChartOverlay({
  evidence, context, symbol, generation, frame, sessionMode, candleAt,
}: {
  evidence: ResolvedChartEvidence;
  context: "current" | "match";
  symbol: string;
  generation: string;
  frame: ChartTimeframe;
  sessionMode: ChartEvidenceBasis["sessionMode"] | "overnight";
  candleAt: (time: number) => DisplayCandle | undefined;
}): ChartOverlay {
  const data = evidence[context];
  if (
    !data || evidence.version !== CHART_EVIDENCE_VERSION ||
    evidence.chartGeneration !== generation || evidence.basis.symbol !== symbol ||
    sessionMode === "overnight" || (!["1D", "1W", "1M", "1Y"].includes(frame) && evidence.basis.sessionMode !== sessionMode)
  ) return { state: "unavailable", events: [], zones: [], missingCandle: true, missingEvent: true, missingZone: true };

  const zones = data.zones.state === "ready" ? data.zones.facts.filter(zone =>
    zone.instrumentId === evidence.basis.instrumentId && zone.priceBasisId === evidence.basis.priceBasisId &&
    Number.isFinite(zone.lower) && Number.isFinite(zone.upper) && zone.lower > 0 && zone.upper >= zone.lower
  ) : [];
  const candles = new Map(data.candles.state === "ready"
    ? data.candles.facts.filter(candle => candle.frame === frame).map(candle => [candle.plotTime, candle])
    : []);
  const current = new Map(evidence.current.candles.state === "ready"
    ? evidence.current.candles.facts.filter(candle => candle.frame === frame).map(candle => [candle.plotTime, candle])
    : []);
  const candidates = data.events.state === "ready" ? data.events.facts.filter(event => event.trigger.frame === frame) : [];
  let missingCandle = data.candles.state === "unavailable";
  let missingZone = data.zones.state === "unavailable" || data.zones.facts.length !== zones.length;
  const events = candidates.filter(event => {
    const candle = candles.get(event.trigger.plotTime);
    const active = current.get(event.trigger.plotTime);
    if (
      !candle || !active || !compatibleBasis(evidence.basis, candle.basis) ||
      !sameReference(candle, event.trigger) || !sameReference(candle, active) ||
      !matchesPlot(candle, candleAt(candle.plotTime))
    ) {
      missingCandle = true;
      return false;
    }
    if (!Number.isFinite(event.knownAt) || event.knownAt < candle.acceptedAt) return false;
    const reference = event.reference;
    if (reference.kind === "candle") {
      const linked = candles.get(reference.candle.plotTime);
      const activeLinked = current.get(reference.candle.plotTime);
      if (!linked || !activeLinked || !sameReference(linked, reference.candle) ||
        !sameReference(linked, activeLinked) || !Number.isFinite(linked.acceptedAt) ||
        linked.acceptedAt > event.knownAt) {
        missingCandle = true;
        return false;
      }
      return true;
    }
    const zone = zones.find(candidate => candidate.zoneId === reference.zoneId &&
      candidate.mapId === reference.mapId && candidate.mapRevision === reference.mapRevision);
    if (!zone) {
      missingZone = true;
      return false;
    }
    return zone.inputThrough <= zone.firstAvailableAt && zone.firstAvailableAt <= candle.interval.start &&
      zone.expiresAt > event.knownAt;
  });
  return {
    state: "ready", events, zones,
    missingCandle,
    missingEvent: data.events.state === "unavailable" || candidates.length !== events.length,
    missingZone,
  };
}
