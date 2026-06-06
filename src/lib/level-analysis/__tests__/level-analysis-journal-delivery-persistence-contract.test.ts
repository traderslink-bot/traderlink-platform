import { describe, expect, it } from "vitest";
import acceptedRecordFixture from "../__fixtures__/persistence-contract/delivery-record.accepted.compact.json";
import quarantinedRecordFixture from "../__fixtures__/persistence-contract/delivery-record.quarantined.compact.json";
import apiResponseFixtures from "../__fixtures__/persistence-contract/api-responses.compact.json";
import oldSnapshotFixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import {
  loadLevelAnalysisJournalPayloadForJournal,
  type LevelAnalysisJournalDeliveryIngestionResult,
} from "../level-analysis-journal-delivery-adapter";
import {
  createJournalLevelAnalysisDeliveryRecordFromIngestion,
  hashJournalLevelAnalysisRawPayload,
  isJournalLevelAnalysisDuplicatePayload,
  validateJournalLevelAnalysisDeliveryRecord,
  validateJournalLevelAnalysisDeliverySymbolSummary,
} from "../level-analysis-journal-delivery-persistence-contract";

type MutableRecord = Record<string, unknown>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertAcceptedIngestion(
  result: LevelAnalysisJournalDeliveryIngestionResult,
): asserts result is Extract<LevelAnalysisJournalDeliveryIngestionResult, { status: "accepted" }> {
  expect(result.status).toBe("accepted");
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

function expectNoJournalOwnedFields(value: unknown): void {
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

  for (const key of collectObjectKeys(value)) {
    expect(prohibitedKeys.has(key), `Unexpected journal-owned field ${key}`).toBe(false);
  }
}

function expectNoAdviceLanguage(value: unknown): void {
  const text = collectStringValues(value).join("\n").toLowerCase();

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
    expect(pattern.test(text), `Unexpected ${label} language`).toBe(false);
  }
}

describe("level-analysis journal delivery persistence contract", () => {
  it("validates the accepted persisted record fixture", () => {
    const result = validateJournalLevelAnalysisDeliveryRecord(acceptedRecordFixture);

    expect(result.status).toBe("valid");
    if (result.status !== "valid") {
      return;
    }

    expect(result.record.validationStatus).toBe("accepted");
    if (result.record.validationStatus !== "accepted") {
      return;
    }
    expect(result.record.sourceSystem).toBe("levels-system");
    expect(result.record.sourceKind).toBe("packaged_review_delivery");
    expect(result.record.rawPayloadHash).toBe(
      hashJournalLevelAnalysisRawPayload(result.record.rawPayload),
    );
    expect(result.record.reviewedSymbols).toEqual(["DEVS", "QUBT"]);
    expect(result.record.compactSummary.cacheFingerprintCounts).toMatchObject({
      totalFingerprints: 8,
      fifteenMinuteContextOnlyCount: 2,
    });
    expect(result.record.perSymbolSummary).toHaveLength(2);
  });

  it("validates each per-symbol summary as facts-only chart context", () => {
    for (const summary of acceptedRecordFixture.perSymbolSummary) {
      const result = validateJournalLevelAnalysisDeliverySymbolSummary(summary);

      expect(result.status).toBe("valid");
      if (result.status !== "valid") {
        continue;
      }

      expect(result.summary.referencePrice).toBeGreaterThan(0);
      expect(result.summary.bucketCounts.total).toBeGreaterThan(0);
      expect(result.summary.extensionCounts.total).toBeGreaterThanOrEqual(0);
      expect(result.summary.fifteenMinuteContextOnlyStatus).toBe("context_only");
    }
  });

  it("fails malformed persisted records", () => {
    const malformed = clone(acceptedRecordFixture) as MutableRecord;
    malformed.rawPayloadHash = "sha256:0000";
    delete malformed.rawPayload;
    malformed.sourceSystem = "other-system";

    const result = validateJournalLevelAnalysisDeliveryRecord(malformed);

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") {
      return;
    }

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "invalid_field_shape",
        "missing_required_field",
        "wrong_source_system",
      ]),
    );
  });

  it("treats duplicate rawPayloadHash fixtures as idempotent contract matches", () => {
    const duplicateResponse =
      apiResponseFixtures.duplicateIngestIdempotentRawPayloadHashMatch;

    expect(duplicateResponse.duplicate).toBe(true);
    expect(duplicateResponse.rawPayloadHash).toBe(acceptedRecordFixture.rawPayloadHash);
    expect(
      isJournalLevelAnalysisDuplicatePayload({
        existingRawPayloadHash: acceptedRecordFixture.rawPayloadHash,
        incomingRawPayloadHash: duplicateResponse.rawPayloadHash,
      }),
    ).toBe(true);
  });

  it("represents quarantine fixtures without trusted derived summaries", () => {
    const result = validateJournalLevelAnalysisDeliveryRecord(quarantinedRecordFixture);

    expect(result.status).toBe("valid");
    if (result.status !== "valid") {
      return;
    }

    expect(result.record.validationStatus).toBe("quarantined");
    expect(result.record.compactSummary).toBeNull();
    expect(result.record.perSymbolSummary).toEqual([]);
    expect(result.record.quarantineReasons.map((reason) => reason.code)).toEqual(
      expect.arrayContaining(["missing_entries", "nonzero_mismatch_count"]),
    );
    expect(result.record.rawPayloadHash).toBe(
      hashJournalLevelAnalysisRawPayload(result.record.rawPayload),
    );
  });

  it("locks compact API response contract fixtures", () => {
    expect(apiResponseFixtures.validateDeliveryPackageSuccess).toMatchObject({
      contractVersion: "level_analysis_delivery_validate_api_v1",
      status: "accepted",
      sourceKind: "packaged_review_delivery",
    });
    expect(apiResponseFixtures.ingestDeliveryPackageSuccess).toMatchObject({
      contractVersion: "level_analysis_delivery_ingest_api_v1",
      status: "accepted",
      duplicate: false,
      rawPayloadHash: acceptedRecordFixture.rawPayloadHash,
    });
    expect(apiResponseFixtures.malformedPayloadQuarantine).toMatchObject({
      contractVersion: "level_analysis_delivery_ingest_api_v1",
      status: "quarantined",
      rawPayloadHash: quarantinedRecordFixture.rawPayloadHash,
    });
    expect(apiResponseFixtures.latestDeliverySummaryResponse).toMatchObject({
      contractVersion: "level_analysis_delivery_latest_api_v1",
      status: "found",
      deliveryId: acceptedRecordFixture.id,
    });
    expect(apiResponseFixtures.symbolLevelLatestSummaryResponse).toMatchObject({
      contractVersion: "level_analysis_delivery_symbol_latest_api_v1",
      status: "found",
      symbol: "QUBT",
    });
    expect(apiResponseFixtures.adminDebugRawPayloadResponse).toMatchObject({
      contractVersion: "level_analysis_delivery_raw_admin_api_v1",
      status: "found",
      rawPayloadHash: acceptedRecordFixture.rawPayloadHash,
    });
    expect(apiResponseFixtures.adminDebugRawPayloadResponse.rawPayloadHash).toBe(
      hashJournalLevelAnalysisRawPayload(
        apiResponseFixtures.adminDebugRawPayloadResponse.rawPayload,
      ),
    );
  });

  it("preserves old LevelAnalysisSnapshot v1 ingestion compatibility in the contract helper", () => {
    const ingestionResult = loadLevelAnalysisJournalPayloadForJournal(
      JSON.stringify(oldSnapshotFixture),
    );
    assertAcceptedIngestion(ingestionResult);

    const record = createJournalLevelAnalysisDeliveryRecordFromIngestion({
      id: "lad_contract_SNAP_v1_2026_06_06T182500Z",
      createdAt: "2026-06-06T18:25:00.000Z",
      ingestionResult,
    });
    const validation = validateJournalLevelAnalysisDeliveryRecord(record);

    expect(validation.status).toBe("valid");
    expect(record.validationStatus).toBe("accepted");
    expect(record.sourceKind).toBe("single_snapshot_v1");
    expect(record.sourceSchemaVersion).toBe("level-analysis-snapshot/v1");
    expect(record.rawPayload).toBe(ingestionResult.sourcePayload);
    expect(record.perSymbolSummary).toHaveLength(1);
    expect(record.perSymbolSummary[0]).toMatchObject({
      symbol: "SNAP",
      fifteenMinuteContextOnlyStatus: "not_supplied",
    });
  });

  it("keeps raw source payload preservation required", () => {
    const accepted = validateJournalLevelAnalysisDeliveryRecord(acceptedRecordFixture);
    const quarantined = validateJournalLevelAnalysisDeliveryRecord(quarantinedRecordFixture);

    expect(accepted.status).toBe("valid");
    expect(quarantined.status).toBe("valid");
    if (accepted.status !== "valid" || quarantined.status !== "valid") {
      return;
    }

    expect("rawPayload" in accepted.record).toBe(true);
    expect("rawPayload" in quarantined.record).toBe(true);
    expect(accepted.record.rawPayloadHash).toBe(
      hashJournalLevelAnalysisRawPayload(accepted.record.rawPayload),
    );
    expect(quarantined.record.rawPayloadHash).toBe(
      hashJournalLevelAnalysisRawPayload(quarantined.record.rawPayload),
    );
  });

  it("does not introduce recommendation coaching grading P/L giveback behavior-scoring or trade-advice wording", () => {
    for (const value of [
      acceptedRecordFixture,
      quarantinedRecordFixture,
      apiResponseFixtures,
    ]) {
      expectNoJournalOwnedFields(value);
      expectNoAdviceLanguage(value);
    }
  });
});
