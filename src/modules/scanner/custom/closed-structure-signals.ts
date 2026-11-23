import { candleStructureAt } from "../../market-data/chart-evidence/structure";
import type { ChartEvidenceBasis, ChartEvidenceCandle } from "../../market-data/chart-evidence/contracts";
import type { ScanSignalFrame, StructureScanSignal } from "./signal-filters";

const POLICY = { version:"scanner-closed-structure-v1", left:2, right:2, allowShortened:false } as const;

export function closedStructureSignals(
  packed: Float64Array, stride: number, frame: ScanSignalFrame, symbol: string, through: number,
): Partial<Record<StructureScanSignal, number>> | undefined {
  const seconds = parseInt(frame, 10) * 60;
  const basis: ChartEvidenceBasis = {
    instrumentId:symbol, symbol, venue:"US", seriesId:symbol + ":" + frame,
    priceBasisId:"alpaca-sip-split", sessionMode:"extended", calendarRevision:"scanner-verified-calendar",
    aggregationVersion:"scanner-completed-signal-bars",
  };
  const segment: ChartEvidenceCandle[] = [];
  for (let offset = Math.max(0, packed.length - 250 * stride); offset < packed.length; offset += stride) {
    const time = packed[offset], end = time + seconds;
    if (end * 1000 > through) break;
    if (segment.length && segment.at(-1)?.interval.end !== time) segment.length = 0;
    segment.push({
      basis, frame, interval:{ start:time, end }, plotTime:time, revision:String(time),
      acceptedAt:end, shortened:false, bar:{ time, open:packed[offset+1], high:packed[offset+2],
        low:packed[offset+3], close:packed[offset+4], volume:packed[offset+5] },
    });
  }
  if (segment.length < POLICY.left + POLICY.right + 1 || segment.at(-1)!.interval.end * 1000 !== through) return;
  const structure = candleStructureAt({ slots:segment, cutoff:through / 1000, snapshotRevision:String(through), policy:POLICY });
  if (structure.state !== "ready") return;
  const events: Partial<Record<StructureScanSignal, number>> = {};
  const closeForBar = new Map(segment.map((bar,index)=>[bar.interval.start,index]));
  let latestBreak: { direction:"up"|"down"; price:number; after:number } | undefined;
  for (const event of structure.events) {
    if (event.kind === "swing") {
      if (event.progression !== "higher" && event.progression !== "lower") continue;
      const kind = event.direction === "up"
        ? event.progression === "higher" ? "higherSwingHigh" : "lowerSwingHigh"
        : event.progression === "higher" ? "higherSwingLow" : "lowerSwingLow";
      events[kind] = event.knownAt * 1000;
      continue;
    }
    if (event.kind === "structure-break") {
      events[event.direction === "up" ? "structureBreakUp" : "structureBreakDown"] = event.knownAt * 1000;
    } else if (event.kind === "change-of-character") {
      events[event.direction === "up" ? "characterChangeUp" : "characterChangeDown"] = event.knownAt * 1000;
    }
    if (event.reference.kind !== "candle") continue;
    const index = closeForBar.get(event.reference.candle.interval.start);
    if (index === undefined) continue;
    const bar = segment[index].bar;
    latestBreak = { direction:event.direction, price:event.direction === "up" ? bar.high : bar.low, after:event.trigger.interval.end };
  }
  if (latestBreak) {
    const { direction, price, after } = latestBreak;
    let failed = false;
    for (const candle of segment) {
      if (candle.interval.start < after) continue;
      const { high, low, close } = candle.bar;
      const beyond = direction === "up" ? close > price : close < price;
      const against = direction === "up" ? close < price : close > price;
      if (against && !failed) {
        events[direction === "up" ? "failedStructureUp" : "failedStructureDown"] = candle.acceptedAt * 1000;
        failed = true;
      } else if (beyond && failed) {
        events[direction === "up" ? "reclaimedStructureUp" : "reclaimedStructureDown"] = candle.acceptedAt * 1000;
        failed = false;
      } else if (beyond && (direction === "up" ? low <= price : high >= price)) {
        events[direction === "up" ? "structureRetestUp" : "structureRetestDown"] = candle.acceptedAt * 1000;
      }
    }
  }
  return events;
}
