import { describe, expect, it } from "vitest";
import oldSnapshotFixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import deliveryFixture from "../__fixtures__/level-analysis-journal-delivery-package-v1.compact.json";
import {
  loadLevelAnalysisJournalPayloadForJournal,
  validateLevelAnalysisJournalPayload,
  type LevelAnalysisJournalChartContextView,
  type LevelAnalysisJournalDeliveryIngestionResult,
} from "../level-analysis-journal-delivery-adapter";

type MutablePayload = Record<string, unknown>;

function mutableRecord(value: unknown): MutablePayload {
  return value as MutablePayload;
}

function mutableRecords(value: unknown): MutablePayload[] {
  return value as MutablePayload[];
}

function mutableArray(value: unknown): unknown[] {
  return value as unknown[];
}

function cloneOldSnapshot(): MutablePayload {
  return JSON.parse(JSON.stringify(oldSnapshotFixture)) as MutablePayload;
}

function cloneDelivery(): MutablePayload {
  return JSON.parse(JSON.stringify(deliveryFixture)) as MutablePayload;
}

function assertAccepted(
  result: LevelAnalysisJournalDeliveryIngestionResult,
): asserts result is Extract<LevelAnalysisJournalDeliveryIngestionResult, { status: "accepted" }> {
  expect(result.status).toBe("accepted");
}

function assertQuarantined(
  result: LevelAnalysisJournalDeliveryIngestionResult,
): asserts result is Extract<LevelAnalysisJournalDeliveryIngestionResult, { status: "quarantined" }> {
  expect(result.status).toBe("quarantined");
  expect(result.errors.length).toBeGreaterThan(0);
}

function collectObjectKeys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjectKeys(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      out.push(key);
      collectObjectKeys(item, out);
    }
  }

  return out;
}

function collectStringValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStringValues(item, out);
    }
  }

  return out;
}

function expectNoJournalOwnedFields(view: LevelAnalysisJournalChartContextView): void {
  const prohibitedKeys = new Set([
    "grade",
    "tradeGrade",
    "coaching",
    "coach",
    "pnl",
    "pAndL",
    "giveback",
    "behaviorScore",
    "behaviorScoring",
    "recommendation",
    "entryDecision",
    "exitDecision",
    "tradeAdvice",
  ]);

  for (const key of collectObjectKeys(view)) {
    expect(prohibitedKeys.has(key), `Unexpected journal-owned field ${key}`).toBe(false);
  }
}

function expectNoAdviceLanguage(view: LevelAnalysisJournalChartContextView): void {
  const text = collectStringValues(view).join("\n").toLowerCase();

  for (const [label, pattern] of [
    ["grading", /\bgrading\b|\btrade grade\b/],
    ["coaching", /\bcoaching\b|\bcoach\b/],
    ["p/l", /\bp\/l\b|\bpnl\b/],
    ["giveback", /\bgiveback\b/],
    ["behavior scoring", /\bbehavior score\b|\bbehavior scoring\b/],
    ["recommendation", /\brecommendation\b/],
    ["buy/sell/hold", /\bbuy\b|\bsell\b|\bhold\b/],
    ["entry decision", /\bentry decision\b/],
    ["exit decision", /\bexit decision\b/],
    ["trade advice", /\btrade advice\b/],
  ] as const) {
    expect(pattern.test(text), `Unexpected ${label} language in chart-context view`).toBe(false);
  }
}

describe("level-analysis journal delivery ingestion", () => {
  it("keeps the existing LevelAnalysisSnapshot v1 path accepted", () => {
    const result = loadLevelAnalysisJournalPayloadForJournal(
      JSON.stringify(oldSnapshotFixture),
    );

    assertAccepted(result);
    expect(result.sourceKind).toBe("single_snapshot_v1");
    expect(result.views).toHaveLength(1);
    expect(result.views[0].sourceKind).toBe("single_snapshot_v1");
    expect(result.views[0].source.schemaVersion).toBe("level-analysis-snapshot/v1");
    expect(result.views[0].source.producer).toBe("levels-system");
    expect(result.views[0].identity.symbol).toBe(oldSnapshotFixture.symbol);
    expect(result.views[0].nearestLevels.support).toMatchObject({
      levelId: oldSnapshotFixture.nearestSupport?.levelId,
    });
    expect(result.views[0].bucketCounts.total).toBeGreaterThan(0);
    expect(result.views[0].fifteenMinuteContext.status).toBe("not_supplied");
  });

  it("accepts the compact packaged review delivery payload with entries", () => {
    const result = loadLevelAnalysisJournalPayloadForJournal(
      JSON.stringify(deliveryFixture),
    );

    assertAccepted(result);
    expect(result.sourceKind).toBe("packaged_review_delivery");
    expect(result.packageMetadata).toMatchObject({
      schemaVersion: "level-quality-review-process/v1",
      generatedAt: "2026-06-06T13:10:00.000Z",
      provider: "ibkr",
      reviewedSymbols: ["DEVS", "QUBT"],
    });
    expect(result.views.map((view) => view.identity.symbol)).toEqual(["DEVS", "QUBT"]);
    expect(result.views.every((view) => view.fifteenMinuteContext.status === "context_only")).toBe(true);
  });

  it("derives a compact normalized view from the old snapshot", () => {
    const result = validateLevelAnalysisJournalPayload(cloneOldSnapshot());
    assertAccepted(result);

    const [view] = result.views;
    expect(view.identity).toMatchObject({
      symbol: "SNAP",
      referencePrice: 10,
      provider: "fixture",
    });
    expect(view.syntheticContinuationMap.count).toBeGreaterThan(0);
    expect(view.qualityDiagnostics.diagnostics).toContain("no_support_extension_coverage");
    expect(view.volumeSessionContext?.factSummary).toEqual({
      hasSessionFacts: true,
      hasVolumeFacts: true,
      volumeShelfCount: 1,
    });
    expect(view.safetyFlags).toMatchObject({
      noLookaheadApplied: true,
      syntheticExtensionsClearlyMarked: true,
    });
  });

  it("derives one normalized factual view per packaged delivery entry", () => {
    const result = validateLevelAnalysisJournalPayload(cloneDelivery());
    assertAccepted(result);

    const devs = result.views.find((view) => view.identity.symbol === "DEVS");
    const qubt = result.views.find((view) => view.identity.symbol === "QUBT");

    expect(devs).toBeTruthy();
    expect(qubt).toBeTruthy();
    expect(devs?.identity).toMatchObject({
      provider: "ibkr",
      referencePrice: 0.2705,
      previousClose: 0.25,
    });
    expect(devs?.nearestLevels.support).toMatchObject({
      levelId: "DEVS-support-zone-15",
      bucket: "intermediateSupport",
    });
    expect(devs?.bucketCounts.total).toBe(16);
    expect(devs?.sourceFiles).toMatchObject({
      "15m": "ibkr/DEVS/15m/100-1780329600000.json",
    });
    expect(qubt?.candidateInventory?.gapSummary).toMatchObject({
      overall: "closer_unsurfaced_candidate",
    });
    expect(qubt?.volumeSessionContext?.comparisonSummary).toMatchObject({
      outcome: "candidate_identifier_unavailable",
    });
  });

  it("preserves raw source payloads and does not mutate them while deriving views", () => {
    const delivery = cloneDelivery();
    delivery.additiveTopLevelField = { preserved: true };
    mutableRecords(delivery.entries)[0].additiveEntryField = "preserved";
    const before = JSON.parse(JSON.stringify(delivery));

    const result = validateLevelAnalysisJournalPayload(delivery);

    assertAccepted(result);
    expect(result.sourcePayload).toBe(delivery);
    expect(result.sourcePayload).toEqual(before);
    expect(result.views[0].nearestLevels.support).not.toBe(
      mutableRecord(mutableRecords(delivery.entries)[0].nearestLevels).support,
    );
    expect(result.views[0].sourceIntegrity?.cacheFingerprintSummary).not.toBe(
      delivery.cacheFingerprintSummary,
    );
  });

  it("tolerates unknown additive fields on packaged payloads", () => {
    const delivery = cloneDelivery();
    delivery.unknownTopLevel = { ok: true };
    mutableRecords(delivery.entries)[0].unknownEntry = { ok: true };
    mutableRecords(mutableRecord(delivery.cacheFingerprintSet).fingerprints)[0].unknownFingerprint = {
      ok: true,
    };

    const result = validateLevelAnalysisJournalPayload(delivery);

    assertAccepted(result);
    expect(result.sourcePayload).toBe(delivery);
  });

  it("quarantines unsupported or malformed package shapes", () => {
    const result = validateLevelAnalysisJournalPayload({
      schemaVersion: "unknown/v1",
      provider: "ibkr",
    });

    assertQuarantined(result);
    expect(result.errors[0].code).toBe("unsupported_schema_or_package_shape");
  });

  it("quarantines packages with missing entries", () => {
    const delivery = cloneDelivery();
    delete delivery.entries;

    const result = validateLevelAnalysisJournalPayload(delivery);

    assertQuarantined(result);
    expect(result.errors.some((error) => error.code === "missing_entries")).toBe(true);
  });

  it("quarantines non-IBKR packaged providers unless configured", () => {
    const delivery = cloneDelivery();
    delivery.provider = "stub";
    const fingerprintSet = mutableRecord(delivery.cacheFingerprintSet);
    fingerprintSet.provider = "stub";
    for (const fingerprint of mutableRecords(fingerprintSet.fingerprints)) {
      fingerprint.provider = "stub";
    }
    for (const entry of mutableRecords(delivery.entries)) {
      entry.provider = "stub";
      mutableRecord(mutableRecord(entry.candidateInventoryVisibility).visibility).provider =
        "stub";
      mutableRecord(entry.candidateVolumeSessionContext).provider = "stub";
    }

    const defaultResult = validateLevelAnalysisJournalPayload(delivery);
    const configuredResult = validateLevelAnalysisJournalPayload(delivery, {
      allowedPackagedProviders: ["stub"],
    });

    assertQuarantined(defaultResult);
    expect(defaultResult.errors.some((error) => error.code === "wrong_provider")).toBe(true);
    assertAccepted(configuredResult);
  });

  it("quarantines nonzero package mismatch count and per-entry mismatches", () => {
    const delivery = cloneDelivery();
    mutableRecord(delivery.summary).mismatchCount = 1;
    mutableArray(mutableRecords(delivery.entries)[0].mismatches).push({
      field: "nearestSupport",
    });

    const result = validateLevelAnalysisJournalPayload(delivery);

    assertQuarantined(result);
    expect(result.errors.some((error) => error.code === "nonzero_mismatch_count")).toBe(true);
    expect(result.errors.some((error) => error.code === "package_mismatch")).toBe(true);
  });

  it("enforces 15m context-only status on entries and cache fingerprints", () => {
    const delivery = cloneDelivery();
    mutableRecord(mutableRecords(delivery.entries)[0].fifteenMinuteContext).stillContextOnly =
      false;
    const fingerprint = mutableRecords(
      mutableRecord(delivery.cacheFingerprintSet).fingerprints,
    ).find(
      (item) => item.timeframe === "15m",
    );
    expect(fingerprint).toBeTruthy();
    if (fingerprint) {
      fingerprint.contextOnly = false;
      fingerprint.includedInLevelEngine = true;
    }

    const result = validateLevelAnalysisJournalPayload(delivery);

    assertQuarantined(result);
    expect(result.errors.some((error) => error.code === "fifteen_minute_not_context_only")).toBe(true);
    expect(result.errors.some((error) => error.code === "cache_fingerprint_not_context_only")).toBe(true);
  });

  it("quarantines prohibited wording hits", () => {
    const delivery = cloneDelivery();
    mutableArray(delivery.prohibitedLanguageHits).push({
      field: "content",
      match: "recommendation",
    });

    const result = validateLevelAnalysisJournalPayload(delivery);

    assertQuarantined(result);
    expect(result.errors.some((error) => error.code === "prohibited_language_hits")).toBe(true);
  });

  it("quarantines malformed candidate inventory and volume/session context", () => {
    const delivery = cloneDelivery();
    delete mutableRecord(
      mutableRecords(delivery.entries)[0].candidateInventoryVisibility,
    ).visibility;
    mutableRecord(mutableRecords(delivery.entries)[1].candidateVolumeSessionContext).contexts =
      [];

    const result = validateLevelAnalysisJournalPayload(delivery);

    assertQuarantined(result);
    expect(
      result.errors.some((error) =>
        error.field.endsWith("candidateInventoryVisibility.visibility"),
      ),
    ).toBe(true);
    expect(result.errors.some((error) => error.code === "candidate_volume_session_invalid")).toBe(true);
  });

  it("surfaces cache fingerprints density candidate gaps and volume session summaries", () => {
    const result = validateLevelAnalysisJournalPayload(cloneDelivery());
    assertAccepted(result);

    const devs = result.views.find((view) => view.identity.symbol === "DEVS");
    const qubt = result.views.find((view) => view.identity.symbol === "QUBT");

    expect(devs?.sourceIntegrity?.cacheFingerprintCounts).toEqual({
      totalFingerprints: 8,
      levelEngineInputCount: 6,
      contextOnlyCount: 2,
      fifteenMinuteContextOnlyCount: 2,
      validationIssueCount: 9,
    });
    expect(devs?.sourceIntegrity?.fifteenMinuteCacheFingerprintsContextOnly).toBe(true);
    expect(devs?.qualityDiagnostics.densityMetric).toMatchObject({
      classification: "dense_clustered",
      present: true,
    });
    expect(qubt?.qualityDiagnostics.densityMetric).toMatchObject({
      classification: "balanced",
      present: true,
    });
    expect(qubt?.candidateInventory).toMatchObject({
      present: true,
      limitations: ["surfaced_selection_reason_not_serialized"],
    });
    expect(qubt?.volumeSessionContext).toMatchObject({
      present: true,
      contextCount: 2,
    });
  });

  it("does not introduce recommendation coaching grading P/L giveback behavior-scoring or trade-advice fields", () => {
    const oldResult = validateLevelAnalysisJournalPayload(cloneOldSnapshot());
    const deliveryResult = validateLevelAnalysisJournalPayload(cloneDelivery());

    assertAccepted(oldResult);
    assertAccepted(deliveryResult);

    for (const view of [...oldResult.views, ...deliveryResult.views]) {
      expectNoJournalOwnedFields(view);
      expectNoAdviceLanguage(view);
    }
  });
});
