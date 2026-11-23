import {
  qualifiedStockLevelsChartProvenance,
  type SavedStockLevelsMap,
  type StockLevelsChartEvidenceProvenance,
} from "../../stock-levels/stock-levels-contract";
import type { OwnedChartLevelMap } from "../server/chart-evidence-levels-read";
import type { ChartEvidenceBasis, ChartEvidenceLayer, ChartEvidenceZone } from "./contracts";

/** Attested by the Levels source for the exact saved revision. Clocks use Unix seconds. */
export type LevelsChartProvenance = Readonly<{
  instrumentId: string;
  priceBasisId: string;
  calendarRevision: string;
  mapRevision: string;
  intradaySessionMode: ChartEvidenceBasis["sessionMode"];
  inputThrough: number;
  firstAvailableAt: number;
  expiresAt: number;
}>;

const chartFrame = { daily: "1D", "4h": "4h", "5m": "5m" } as const;
const positive = (value: number) => Number.isFinite(value) && value > 0;

type SavedLevel = NonNullable<SavedStockLevelsMap["map"]["levelMap"]>["supportLevels"][number];

function levelGeometry(level: SavedLevel | undefined, side: ChartEvidenceZone["side"]) {
  if (!level || level.side !== side || level.roleFlipState === "testing" ||
    (level.evidenceStatus !== "detected_structure" && level.evidenceStatus !== "historically_tested")) return;
  const { freshness } = level;
  if (freshness !== "fresh" && freshness !== "aging" && freshness !== "stale") return;
  const lower = level.lowPrice ?? level.price;
  const upper = level.highPrice ?? level.price;
  if (!positive(lower) || !positive(upper) || lower > upper ||
    (level.lowPrice === undefined) !== (level.highPrice === undefined)) return;
  return { lower, upper, freshness };
}

/** Convert an already authorized saved map. This function has no storage or quota access. */
export function projectSavedChartLevels(
  saved: SavedStockLevelsMap | undefined,
  provenance: LevelsChartProvenance | undefined,
  basis: ChartEvidenceBasis,
  asOf: number,
): ChartEvidenceLayer<ChartEvidenceZone> {
  if (!saved?.savedMapId || !saved.map.levelMap) return { state: "unavailable", reason: "missing" };
  if (!provenance?.mapRevision) return { state: "unavailable", reason: "coverage" };
  const map = saved.map.levelMap;
  const { instrumentId, priceBasisId, calendarRevision, mapRevision, inputThrough, firstAvailableAt, expiresAt } = provenance;
  const calculatedAt = saved.map.calculatedAt / 1_000;
  if (saved.map.symbol !== basis.symbol || instrumentId !== basis.instrumentId ||
    priceBasisId !== basis.priceBasisId || calendarRevision !== basis.calendarRevision) {
    return { state: "unavailable", reason: "incompatible" };
  }
  if (![asOf, inputThrough, calculatedAt, firstAvailableAt, expiresAt].every(positive) ||
    inputThrough > calculatedAt || calculatedAt > firstAvailableAt || firstAvailableAt > asOf ||
    firstAvailableAt >= expiresAt ||
    map.dataQuality?.status === "unavailable" || !Array.isArray(map.supportLevels) || !Array.isArray(map.resistanceLevels)) {
    return { state: "unavailable", reason: "coverage" };
  }
  if (expiresAt <= asOf) return { state: "unavailable", reason: "expired" };

  const zones: ChartEvidenceZone[] = [];
  for (const side of ["support", "resistance"] as const) {
    const levels = side === "support" ? map.supportLevels : map.resistanceLevels;
    for (const [index, level] of levels.entries()) {
      const geometry = levelGeometry(level, side);
      if (!geometry) continue;
      const { marketDataProvenance } = level;
      if (!marketDataProvenance || !positive(marketDataProvenance.formedAt) ||
        !positive(marketDataProvenance.sourceLastSeenAt) ||
        marketDataProvenance.formedAt > marketDataProvenance.sourceLastSeenAt ||
        marketDataProvenance.sourceLastSeenAt / 1_000 > inputThrough) continue;
      if (!Array.isArray(level.timeframes) || level.timeframes.length !== 1) continue;
      const source = level.timeframes[0];
      if (!Object.hasOwn(chartFrame, source) ||
        (source !== "daily" && provenance.intradaySessionMode !== basis.sessionMode)) continue;
      zones.push({
        instrumentId, priceBasisId, mapId: saved.savedMapId, mapRevision,
        zoneId: `${side}:${index}`, side, ...geometry, sourceFrame: chartFrame[source],
        inputThrough, calculatedAt, firstAvailableAt, expiresAt,
      });
    }
  }
  return zones.length ? { state: "ready", facts: zones } : { state: "unavailable", reason: "coverage" };
}

type LevelInput = StockLevelsChartEvidenceProvenance["inputs"][number];

/** Get this receipt from the accepted-series authority, independently of the saved map. */
export type AcceptedLevelInput = Readonly<Omit<LevelInput, "availableAtMs" | "acceptedAtMs"> & {
  instrumentId: string;
  symbol: string;
  venue: string;
}>;

function sameAcceptedInput(input: LevelInput, source: AcceptedLevelInput | undefined, basis: ChartEvidenceBasis): boolean {
  return source !== undefined && source.instrumentId === basis.instrumentId &&
    source.symbol === basis.symbol && source.venue === basis.venue &&
    input.id === source.id && input.digest === source.digest && input.frame === source.frame &&
    input.datasetId === source.datasetId && input.priceBasisId === source.priceBasisId &&
    input.calendarRevision === source.calendarRevision && input.sessionMode === source.sessionMode &&
    input.completedThroughMs === source.completedThroughMs && input.acceptedCutoffMs === source.acceptedCutoffMs;
}

/** Project the private v1 envelope only where the saved revision and accepted source agree. */
export function projectAttestedChartLevels({
  owned, basis, asOf, acceptedInput, triggerDatasetId,
}: {
  owned: OwnedChartLevelMap | undefined;
  basis: ChartEvidenceBasis;
  /** Unix seconds. A break caller also checks strict publication before the trigger. */
  asOf: number;
  acceptedInput: (id: string) => AcceptedLevelInput | undefined;
  /** Exact versioned dataset from the trusted accepted 4H trigger. Missing skips 4H zones. */
  triggerDatasetId?: string;
}): ChartEvidenceLayer<ChartEvidenceZone> {
  if (!owned?.saved.map.levelMap) return { state: "unavailable", reason: "missing" };
  const { saved, reference, publishedAt, expiresAt } = owned;
  const map = saved.map.levelMap;
  const attestation = qualifiedStockLevelsChartProvenance(saved.map);
  if (!attestation || !map || map.dataQuality?.status === "unavailable") return { state: "unavailable", reason: "coverage" };
  const { instrument, calculatedAtMs } = attestation;
  if (instrument.id !== basis.instrumentId || instrument.symbol !== basis.symbol || instrument.venue !== basis.venue ||
    reference.mapId !== saved.savedMapId || !/^[a-f0-9]{64}$/u.test(reference.revision)) {
    return { state: "unavailable", reason: "incompatible" };
  }
  const calculatedAt = calculatedAtMs / 1_000;
  if (![asOf, publishedAt, expiresAt].every(positive) ||
    calculatedAt > publishedAt || publishedAt > asOf || publishedAt >= expiresAt) {
    return { state: "unavailable", reason: "coverage" };
  }
  if (expiresAt <= asOf) return { state: "unavailable", reason: "expired" };

  const inputs = new Map(attestation.inputs.filter(input =>
    input.priceBasisId === basis.priceBasisId && input.calendarRevision === basis.calendarRevision &&
    (input.frame === "daily" ||
      (input.sessionMode === basis.sessionMode && input.datasetId === triggerDatasetId)) &&
    sameAcceptedInput(input, acceptedInput(input.id), basis)
  ).map(input => [input.id, input]));
  const zones: ChartEvidenceZone[] = [];
  for (const lineage of attestation.zones) {
    const { side, index, inputIds } = lineage;
    const originating = inputIds.map(id => inputs.get(id));
    const frame = originating[0]?.frame;
    if (!frame || !originating.every((input): input is LevelInput => input?.frame === frame)) continue;
    const levels = side === "support" ? map.supportLevels : map.resistanceLevels;
    const geometry = levelGeometry(levels[index], side);
    if (!geometry) continue;
    const inputThrough = originating.reduce((through, input) => Math.max(through, input.completedThroughMs), 0) / 1_000;
    zones.push({
      instrumentId: instrument.id, priceBasisId: basis.priceBasisId, mapId: reference.mapId,
      mapRevision: reference.revision, zoneId: `${side}:${index}`, side, ...geometry, sourceFrame: chartFrame[frame],
      inputThrough, calculatedAt, firstAvailableAt: publishedAt, expiresAt,
    });
  }
  return zones.length ? { state: "ready", facts: zones } : { state: "unavailable", reason: "coverage" };
}
