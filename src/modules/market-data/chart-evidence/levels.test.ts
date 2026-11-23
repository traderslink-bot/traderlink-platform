import { describe, expect, it } from "vitest";
import type { SavedStockLevelsMap, StockLevelsChartEvidenceProvenance } from "../../stock-levels/stock-levels-contract";
import type { OwnedChartLevelMap } from "../server/chart-evidence-levels-read";
import { projectAttestedChartLevels, projectSavedChartLevels, type AcceptedLevelInput, type LevelsChartProvenance } from "./levels";
import { SHARED_CHART_REPLAY as fixture } from "./replay-fixture";

type Map = NonNullable<SavedStockLevelsMap["map"]["levelMap"]>;
type Level = Map["resistanceLevels"][number];
const level: Level = {
  side: "resistance", price: 10.05, lowPrice: 10, highPrice: 10.10, distancePct: 1,
  evidenceStatus: "historically_tested", timeframes: ["4h"], freshness: "fresh", label: "fixture",
  marketDataProvenance: {
    formedAt: (fixture.fourHourZone.inputThrough - 60) * 1_000,
    sourceLastSeenAt: fixture.fourHourZone.inputThrough * 1_000,
  },
};
const provenance: LevelsChartProvenance = {
  instrumentId: fixture.basis.instrumentId, priceBasisId: fixture.basis.priceBasisId,
  calendarRevision: fixture.basis.calendarRevision, intradaySessionMode: "regular",
  mapRevision: fixture.fourHourZone.mapRevision, inputThrough: fixture.fourHourZone.inputThrough,
  firstAvailableAt: fixture.fourHourZone.firstAvailableAt, expiresAt: fixture.fourHourZone.expiresAt,
};

function saved(...resistanceLevels: Level[]): SavedStockLevelsMap {
  return {
    savedMapId: "map-id",
    map: {
      symbol: fixture.basis.symbol, referencePrice: 9.95,
      referencePriceAsOf: provenance.inputThrough * 1_000,
      calculatedAt: fixture.fourHourZone.calculatedAt * 1_000, cacheStatus: "hit",
      fullLadderCard: null, nearestSupportResistanceCard: null,
      levelMap: {
        currentPrice: 9.95, rangeState: "normal", nearestSupport: null, nearestResistance: null,
        nextStrongResistance: null, nextStrongSupport: null, supportLevels: [], resistanceLevels,
      },
    },
  };
}
const project = (snapshot: SavedStockLevelsMap, source = provenance, asOf = fixture.acceptedAt) =>
  projectSavedChartLevels(snapshot, source, fixture.basis, asOf);

describe("read-only saved Levels chart projection", () => {
  it("preserves Daily and 4H source geometry and clocks from qualified inputs", () => {
    const daily: Level = { ...level, lowPrice: 10.50, highPrice: 10.55, timeframes: ["daily"] };
    expect(project(saved(level, daily))).toMatchObject({ state: "ready", facts: [
      { mapId: "map-id", mapRevision: provenance.mapRevision, zoneId: "resistance:0",
        sourceFrame: "4h", lower: 10, upper: 10.10, firstAvailableAt: provenance.firstAvailableAt },
      { mapId: "map-id", mapRevision: provenance.mapRevision, zoneId: "resistance:1",
        sourceFrame: "1D", lower: 10.50, upper: 10.55 },
    ] });
  });

  it("does not infer adjustment, instrument identity or point-in-time provenance from legacy fields", () => {
    const snapshot = saved(level);
    expect(projectSavedChartLevels(snapshot, undefined, fixture.basis, fixture.acceptedAt))
      .toEqual({ state: "unavailable", reason: "coverage" });
    expect(project(snapshot, { ...provenance, instrumentId: "different-id" }))
      .toEqual({ state: "unavailable", reason: "incompatible" });
    expect(project(snapshot, { ...provenance, priceBasisId: "raw" }))
      .toEqual({ state: "unavailable", reason: "incompatible" });
  });

  it("withholds prepublication and expired revisions", () => {
    expect(project(saved(level), provenance, provenance.firstAvailableAt - 1))
      .toEqual({ state: "unavailable", reason: "coverage" });
    expect(project(saved(level), provenance, provenance.expiresAt))
      .toEqual({ state: "unavailable", reason: "expired" });
  });

  it("preserves independently supported Daily zones and drops intraday session mismatch or malformed zones", () => {
    const daily: Level = { ...level, timeframes: ["daily"] };
    const result = project(saved(level, daily, { ...daily, lowPrice: 11 }, { ...daily, timeframes: ["daily", "4h"] },
      { ...daily, evidenceStatus: "synthetic_planning" }, { ...daily, marketDataProvenance: undefined }),
    { ...provenance, intradaySessionMode: "extended" });
    expect(result).toMatchObject({ state: "ready", facts: [{ zoneId: "resistance:1", sourceFrame: "1D" }] });
    if (result.state === "ready") expect(result.facts).toHaveLength(1);
  });
});

const publishedAt = fixture.fourHourZone.firstAvailableAt;
const frameInputs = (["4h", "daily"] as const).map((frame, index) => ({
  id: `accepted-${frame}`,
  frame,
  datasetId: `alpaca-sip-${frame}`,
  priceBasisId: fixture.basis.priceBasisId,
  calendarRevision: fixture.basis.calendarRevision,
  sessionMode: "regular" as const,
  completedThroughMs: (publishedAt - 90) * 1_000,
  availableAtMs: (publishedAt - 60) * 1_000,
  acceptedCutoffMs: (publishedAt - 59) * 1_000,
  acceptedAtMs: (publishedAt - 58) * 1_000,
  digest: String(index).repeat(64),
}));
const attestation: StockLevelsChartEvidenceProvenance = {
  version: 1,
  instrument: { id: fixture.basis.instrumentId, symbol: fixture.basis.symbol, venue: fixture.basis.venue },
  calculatedAtMs: (publishedAt - 30) * 1_000,
  inputs: frameInputs,
  zones: [
    { side: "resistance", index: 0, inputIds: [frameInputs[0].id] },
    { side: "resistance", index: 1, inputIds: [frameInputs[1].id] },
    { side: "resistance", index: 2, inputIds: frameInputs.map(input => input.id) },
  ],
};
const stored = saved(
  { ...level, timeframes: undefined },
  { ...level, timeframes: ["4h"], lowPrice: 10.50, highPrice: 10.55 },
  level,
  level,
);
const owned: OwnedChartLevelMap = {
  saved: { ...stored, map: { ...stored.map, chartEvidenceProvenance: attestation } },
  reference: { mapId: stored.savedMapId, revision: "f".repeat(64) },
  publishedAt, expiresAt: fixture.fourHourZone.expiresAt,
};
const expectedInput = (id: string): AcceptedLevelInput | undefined => {
  const input = frameInputs.find(frame => frame.id === id);
  return input && { ...input, instrumentId: fixture.basis.instrumentId, symbol: fixture.basis.symbol, venue: fixture.basis.venue };
};
const attested = {
  owned, basis: fixture.basis, asOf: fixture.acceptedAt, acceptedInput: expectedInput,
  triggerDatasetId: frameInputs[0].datasetId,
};

describe("private v1 Levels projection", () => {
  it("uses the verified final lineage and actual calculation clock independently of display metadata", () => {
    expect(projectAttestedChartLevels(attested)).toMatchObject({ state: "ready", facts: [
      { zoneId: "resistance:0", sourceFrame: "4h", inputThrough: publishedAt - 90, calculatedAt: publishedAt - 30,
        firstAvailableAt: publishedAt, lower: 10, upper: 10.10 },
      { zoneId: "resistance:1", sourceFrame: "1D", lower: 10.50, upper: 10.55 },
    ] });
  });

  it.each(["alpaca-sip-native-4h", undefined])(
    "keeps Daily context when the trigger dataset is %s, even with an exact independent saved receipt",
    triggerDatasetId => {
      const result = projectAttestedChartLevels({ ...attested, triggerDatasetId });
      expect(result).toMatchObject({ state: "ready", facts: [{ zoneId: "resistance:1", sourceFrame: "1D" }] });
    },
  );

  it.each(["id", "digest", "datasetId", "instrumentId", "calendarRevision", "priceBasisId"] as const)(
    "excludes a zone when its independently published %s differs",
    key => {
      const acceptedInput = (id: string) => {
        const record = expectedInput(id);
        return record?.frame === "4h" ? { ...record, [key]: "different" } : record;
      };
      const result = projectAttestedChartLevels({ ...attested, acceptedInput });
      expect(result).toMatchObject({ state: "ready", facts: [{ zoneId: "resistance:1", sourceFrame: "1D" }] });
    },
  );

  it("keeps private chart Levels unavailable when there is no independent publisher, and leaves old maps intact", () => {
    expect(projectAttestedChartLevels({ ...attested, acceptedInput: () => undefined }))
      .toEqual({ state: "unavailable", reason: "coverage" });
    expect(projectAttestedChartLevels({ ...attested, owned: { ...owned, saved: stored } }))
      .toEqual({ state: "unavailable", reason: "coverage" });
  });

  it("withholds unsaved or expired evidence even when the source receipts match", () => {
    expect(projectAttestedChartLevels({ ...attested, asOf: publishedAt - 1 }))
      .toEqual({ state: "unavailable", reason: "coverage" });
    expect(projectAttestedChartLevels({ ...attested, asOf: owned.expiresAt }))
      .toEqual({ state: "unavailable", reason: "expired" });
  });
});
