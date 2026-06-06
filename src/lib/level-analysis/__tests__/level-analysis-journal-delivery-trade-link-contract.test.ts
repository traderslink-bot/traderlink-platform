import { describe, expect, it } from "vitest";
import acceptedDeliveryFixture from "../__fixtures__/persistence-contract/delivery-record.accepted.compact.json";
import quarantinedDeliveryFixture from "../__fixtures__/persistence-contract/delivery-record.quarantined.compact.json";
import linkedTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.linked.compact.json";
import oldSnapshotTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.old-snapshot.compact.json";
import blockedTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.blocked.compact.json";
import tradeLinkApiFixtures from "../__fixtures__/trade-link-contract/api-responses.compact.json";
import oldSnapshotFixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import {
  loadLevelAnalysisJournalPayloadForJournal,
  type LevelAnalysisJournalDeliveryIngestionResult,
} from "../level-analysis-journal-delivery-adapter";
import {
  createJournalLevelAnalysisDeliveryRecordFromIngestion,
  type JournalLevelAnalysisDeliveryRecord,
  validateJournalLevelAnalysisDeliveryRecord,
} from "../level-analysis-journal-delivery-persistence-contract";
import {
  createDefaultJournalLevelAnalysisTradeLinkMatchPolicy,
  createJournalLevelAnalysisTradeLinkRecord,
  deriveJournalLevelAnalysisLinkedSymbolSummary,
  isJournalLevelAnalysisTradeLinkDuplicate,
  journalLevelAnalysisTradeLinkContainsRawPayload,
  validateJournalLevelAnalysisTradeLinkRecord,
} from "../level-analysis-journal-delivery-trade-link-contract";

type MutableRecord = Record<string, unknown>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertAcceptedIngestion(
  result: LevelAnalysisJournalDeliveryIngestionResult,
): asserts result is Extract<LevelAnalysisJournalDeliveryIngestionResult, { status: "accepted" }> {
  expect(result.status).toBe("accepted");
}

function acceptedDeliveryRecord(): Extract<
  JournalLevelAnalysisDeliveryRecord,
  { validationStatus: "accepted" }
> {
  const validation = validateJournalLevelAnalysisDeliveryRecord(acceptedDeliveryFixture);
  expect(validation.status).toBe("valid");
  if (validation.status !== "valid" || validation.record.validationStatus !== "accepted") {
    throw new Error("Accepted delivery fixture failed validation.");
  }

  return validation.record;
}

function quarantinedDeliveryRecord(): Extract<
  JournalLevelAnalysisDeliveryRecord,
  { validationStatus: "quarantined" }
> {
  const validation = validateJournalLevelAnalysisDeliveryRecord(quarantinedDeliveryFixture);
  expect(validation.status).toBe("valid");
  if (validation.status !== "valid" || validation.record.validationStatus !== "quarantined") {
    throw new Error("Quarantined delivery fixture failed validation.");
  }

  return validation.record;
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

describe("level-analysis journal delivery trade-link contract", () => {
  it("validates the linked packaged delivery trade-link fixture", () => {
    const result = validateJournalLevelAnalysisTradeLinkRecord(linkedTradeLinkFixture);

    expect(result.status).toBe("valid");
    if (result.status !== "valid") {
      return;
    }

    expect(result.record.linkStatus).toBe("linked");
    if (result.record.linkStatus !== "linked") {
      return;
    }
    expect(result.record.sourceKind).toBe("packaged_review_delivery");
    expect(result.record.rawPayloadHash).toBe(acceptedDeliveryFixture.rawPayloadHash);
    expect(result.record.linkedSymbolSummary.fifteenMinuteContextOnlyStatus).toBe(
      "context_only",
    );
    expect(result.record.linkedSymbolSummary.densityMetricSummary).toMatchObject({
      classification: "dense_clustered",
    });
    expect(result.record.linkedSymbolSummary.candidateInventoryGapSummary).toMatchObject({
      overall: "no_gap",
    });
    expect(result.record.linkedSymbolSummary.volumeSessionContextSummary).toMatchObject({
      outcome: "surfaced_has_more_session_volume_context",
    });
  });

  it("validates the old LevelAnalysisSnapshot v1 trade-link fixture", () => {
    const result = validateJournalLevelAnalysisTradeLinkRecord(oldSnapshotTradeLinkFixture);

    expect(result.status).toBe("valid");
    if (result.status !== "valid") {
      return;
    }

    expect(result.record.sourceKind).toBe("single_snapshot_v1");
    expect(result.record.linkStatus).toBe("linked");
    if (result.record.linkStatus !== "linked") {
      return;
    }
    expect(result.record.linkedSymbolSummary.symbol).toBe("SNAP");
    expect(result.record.linkedSymbolSummary.fifteenMinuteContextOnlyStatus).toBe(
      "not_supplied",
    );
  });

  it("validates blocked link attempts without trusted linked facts", () => {
    const result = validateJournalLevelAnalysisTradeLinkRecord(blockedTradeLinkFixture);

    expect(result.status).toBe("valid");
    if (result.status !== "valid") {
      return;
    }

    expect(result.record.linkStatus).toBe("blocked");
    expect(result.record.matchResult.reason).toBe("as_of_after_allowed_boundary");
    expect(result.record.linkedSymbolSummary).toBeNull();
    expect(result.record.safetyFlags).toEqual({ trustedFactsAttached: false });
  });

  it("derives linked symbol summaries without mutating or copying raw payloads", () => {
    const deliveryRecord = acceptedDeliveryRecord();
    const sourceSummary = deliveryRecord.perSymbolSummary[0];
    const before = clone(sourceSummary);

    const linkedSummary = deriveJournalLevelAnalysisLinkedSymbolSummary(sourceSummary);

    expect(linkedSummary).toEqual(sourceSummary);
    expect(linkedSummary).not.toBe(sourceSummary);
    expect(sourceSummary).toEqual(before);
    expect(journalLevelAnalysisTradeLinkContainsRawPayload(linkedSummary)).toBe(false);
  });

  it("creates linked records from accepted packaged delivery summaries", () => {
    const deliveryRecord = acceptedDeliveryRecord();
    const record = createJournalLevelAnalysisTradeLinkRecord({
      id: "jlatl_helper_trade_DEVS_001",
      createdAt: "2026-06-06T19:20:00.000Z",
      workspaceId: "local-demo-workspace",
      accountId: "local-demo-account",
      userId: "local-demo-user",
      savedTradeId: "trade_DEVS_2026_06_01_001",
      importBatchId: "import_batch_2026_06_01_001",
      deliveryRecord,
      symbolSummary: deliveryRecord.perSymbolSummary[0],
    });

    expect(record.linkStatus).toBe("linked");
    expect(record.symbol).toBe("DEVS");
    expect(record.provider).toBe("ibkr");
    expect(record.rawPayloadHash).toBe(deliveryRecord.rawPayloadHash);
    expect(journalLevelAnalysisTradeLinkContainsRawPayload(record)).toBe(false);
    expect(validateJournalLevelAnalysisTradeLinkRecord(record).status).toBe("valid");
  });

  it("creates linked records from old single-snapshot v1 delivery summaries", () => {
    const ingestionResult = loadLevelAnalysisJournalPayloadForJournal(
      JSON.stringify(oldSnapshotFixture),
    );
    assertAcceptedIngestion(ingestionResult);

    const deliveryRecord = createJournalLevelAnalysisDeliveryRecordFromIngestion({
      id: "lad_contract_SNAP_v1_2026_06_06T182500Z",
      createdAt: "2026-06-06T18:25:00.000Z",
      ingestionResult,
    });
    expect(deliveryRecord.validationStatus).toBe("accepted");
    if (deliveryRecord.validationStatus !== "accepted") {
      return;
    }

    const record = createJournalLevelAnalysisTradeLinkRecord({
      id: "jlatl_helper_trade_SNAP_001",
      createdAt: "2026-06-06T19:25:00.000Z",
      workspaceId: "local-demo-workspace",
      accountId: "local-demo-account",
      userId: "local-demo-user",
      savedTradeId: "trade_SNAP_2026_05_01_001",
      linkSource: "manual_review",
      deliveryRecord,
      symbolSummary: deliveryRecord.perSymbolSummary[0],
      matchPolicy: {
        providerMatch: "explicit_provider",
        asOfPolicy: "manual_delivery_selection",
      },
    });

    expect(record.sourceKind).toBe("single_snapshot_v1");
    expect(record.linkedSymbolSummary.fifteenMinuteContextOnlyStatus).toBe(
      "not_supplied",
    );
    expect(validateJournalLevelAnalysisTradeLinkRecord(record).status).toBe("valid");
  });

  it("rejects quarantined deliveries for trade-link creation", () => {
    const deliveryRecord = quarantinedDeliveryRecord();

    expect(() =>
      createJournalLevelAnalysisTradeLinkRecord({
        id: "jlatl_quarantined_rejected",
        createdAt: "2026-06-06T19:30:00.000Z",
        workspaceId: "local-demo-workspace",
        accountId: "local-demo-account",
        userId: "local-demo-user",
        savedTradeId: "trade_DEVS_2026_06_01_001",
        deliveryRecord,
        symbolSummary: acceptedDeliveryRecord().perSymbolSummary[0],
      }),
    ).toThrow(/accepted level analysis delivery record/);
  });

  it("rejects packaged delivery links when 15m is not context-only", () => {
    const deliveryRecord = acceptedDeliveryRecord();
    const unsafeSummary = clone(deliveryRecord.perSymbolSummary[0]);
    unsafeSummary.fifteenMinuteContextOnlyStatus = "not_supplied";

    expect(() =>
      createJournalLevelAnalysisTradeLinkRecord({
        id: "jlatl_unsafe_15m_rejected",
        createdAt: "2026-06-06T19:35:00.000Z",
        workspaceId: "local-demo-workspace",
        accountId: "local-demo-account",
        userId: "local-demo-user",
        savedTradeId: "trade_DEVS_2026_06_01_001",
        deliveryRecord,
        symbolSummary: unsafeSummary,
      }),
    ).toThrow(/15m context-only/);
  });

  it("rejects malformed link records and raw payload copies", () => {
    const malformed = clone(linkedTradeLinkFixture) as MutableRecord;
    malformed.rawPayload = { copied: true };
    malformed.rawPayloadHash = "sha256:0000";

    const result = validateJournalLevelAnalysisTradeLinkRecord(malformed);

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") {
      return;
    }

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["raw_payload_not_allowed", "invalid_field_shape"]),
    );
  });

  it("treats duplicate link fixtures as idempotent contract matches", () => {
    const result = validateJournalLevelAnalysisTradeLinkRecord(linkedTradeLinkFixture);
    expect(result.status).toBe("valid");
    if (result.status !== "valid") {
      return;
    }

    expect(
      isJournalLevelAnalysisTradeLinkDuplicate({
        existing: result.record,
        incoming: result.record,
      }),
    ).toBe(true);
    expect(tradeLinkApiFixtures.duplicateTradeLinkIdempotentMatch).toMatchObject({
      linkId: linkedTradeLinkFixture.id,
      savedTradeId: linkedTradeLinkFixture.savedTradeId,
      deliveryId: linkedTradeLinkFixture.deliveryId,
      symbol: linkedTradeLinkFixture.symbol,
      provider: linkedTradeLinkFixture.provider,
    });
  });

  it("locks the default factual match policy", () => {
    expect(createDefaultJournalLevelAnalysisTradeLinkMatchPolicy()).toEqual({
      policyVersion: "journal_level_analysis_trade_link_match_policy_v1",
      symbolMatch: "exact_uppercase",
      providerMatch: "account_allowed_provider",
      asOfPolicy: "latest_before_or_equal_trade_end",
      allowSameDayAfterTradeEnd: false,
      allowFutureAsOfForHistoricalTrade: false,
      requireAcceptedDelivery: true,
      requireContextOnly15m: true,
    });
  });

  it("locks compact API response contract fixtures", () => {
    expect(tradeLinkApiFixtures.resolveTradeLinkMatched).toMatchObject({
      contractVersion: "journal_level_analysis_trade_link_resolution_api_v1",
      status: "matched",
      savedTradeId: linkedTradeLinkFixture.savedTradeId,
      symbol: linkedTradeLinkFixture.symbol,
      provider: linkedTradeLinkFixture.provider,
    });
    expect(tradeLinkApiFixtures.resolveTradeLinkBlocked).toMatchObject({
      contractVersion: "journal_level_analysis_trade_link_resolution_api_v1",
      status: "blocked",
      matchResult: {
        reason: "as_of_after_allowed_boundary",
      },
    });
    expect(tradeLinkApiFixtures.persistTradeLinkSuccess).toMatchObject({
      contractVersion: "journal_level_analysis_trade_link_api_v1",
      status: "linked",
      linkId: linkedTradeLinkFixture.id,
    });
    expect(tradeLinkApiFixtures.tradeLevelAnalysisFound).toMatchObject({
      contractVersion: "journal_trade_level_analysis_api_v1",
      status: "found",
      savedTradeId: linkedTradeLinkFixture.savedTradeId,
      symbol: linkedTradeLinkFixture.symbol,
    });
    expect(tradeLinkApiFixtures.adminDebugTradeLinkFound).toMatchObject({
      contractVersion: "journal_level_analysis_trade_link_api_v1",
      status: "linked",
      rawPayloadHash: acceptedDeliveryFixture.rawPayloadHash,
    });
  });

  it("keeps raw source payload preservation on delivery records only", () => {
    const deliveryRecord = acceptedDeliveryRecord();
    const linkResult = validateJournalLevelAnalysisTradeLinkRecord(linkedTradeLinkFixture);

    expect("rawPayload" in deliveryRecord).toBe(true);
    expect(linkResult.status).toBe("valid");
    expect(journalLevelAnalysisTradeLinkContainsRawPayload(linkedTradeLinkFixture)).toBe(
      false,
    );
    expect(journalLevelAnalysisTradeLinkContainsRawPayload(oldSnapshotTradeLinkFixture)).toBe(
      false,
    );
    expect(journalLevelAnalysisTradeLinkContainsRawPayload(blockedTradeLinkFixture)).toBe(
      false,
    );
  });

  it("does not introduce recommendation coaching grading P/L giveback behavior-scoring or trade-advice wording", () => {
    for (const value of [
      linkedTradeLinkFixture,
      oldSnapshotTradeLinkFixture,
      blockedTradeLinkFixture,
      tradeLinkApiFixtures,
    ]) {
      expectNoJournalOwnedFields(value);
      expectNoAdviceLanguage(value);
    }
  });
});
