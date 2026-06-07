import { describe, expect, it } from "vitest";
import attachedFixture from "../__fixtures__/trade-detail-level-facts-contract/trade-detail-level-facts.attached.compact.json";
import oldSnapshotAttachedFixture from "../__fixtures__/trade-detail-level-facts-contract/trade-detail-level-facts.old-snapshot-attached.compact.json";
import blockedAsOfFixture from "../__fixtures__/trade-detail-level-facts-contract/trade-detail-level-facts.blocked-asof.compact.json";
import notCheckedFixture from "../__fixtures__/trade-detail-level-facts-contract/trade-detail-level-facts.not-checked.compact.json";
import featureDisabledFixture from "../__fixtures__/trade-detail-level-facts-contract/trade-detail-level-facts.feature-disabled.compact.json";
import linkedTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.linked.compact.json";
import oldSnapshotTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.old-snapshot.compact.json";
import blockedTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.blocked.compact.json";
import {
  buildTradeDetailLevelFactsReadModel,
  validateTradeDetailLevelFactsReadModel,
} from "../level-analysis-trade-detail-level-facts-contract";
import {
  journalLevelAnalysisTradeLinkContainsRawPayload,
  type JournalLevelAnalysisTradeLinkRecord,
} from "../level-analysis-journal-delivery-trade-link-contract";

type MutableRecord = Record<string, unknown>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function jsonStable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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
    "priorityScore",
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

describe("trade detail level-facts read-model contract", () => {
  it("validates compact trade-detail fixtures", () => {
    for (const fixture of [
      attachedFixture,
      oldSnapshotAttachedFixture,
      blockedAsOfFixture,
      notCheckedFixture,
      featureDisabledFixture,
    ]) {
      const result = validateTradeDetailLevelFactsReadModel(fixture);

      expect(result.status).toBe("valid");
    }
  });

  it("derives attached packaged delivery facts from a persisted trade link", () => {
    const link = clone(linkedTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord;
    const readModel = buildTradeDetailLevelFactsReadModel({
      savedTradeId: link.savedTradeId,
      featureEnabled: true,
      link,
    });

    expect(jsonStable(readModel)).toEqual(attachedFixture);
    expect(readModel.availability.availability).toBe("attached");
    expect(readModel.display.shouldShowFactsPanel).toBe(true);
    expect(readModel.attachedFacts).toMatchObject({
      sourceKind: "packaged_review_delivery",
      fifteenMinuteContextOnlyStatus: "context_only",
      densityMetricSummary: {
        classification: "dense_clustered",
      },
      candidateInventoryGapSummary: {
        overall: "no_gap",
      },
      volumeSessionContextSummary: {
        contextCount: 1,
      },
      cacheFingerprintSourceIntegrity: {
        mismatchCount: 0,
        prohibitedLanguageHitCount: 0,
      },
    });
    expect(readModel.attachedFacts?.sourceFiles?.["15m"]).toContain("/15m/");
    expect(journalLevelAnalysisTradeLinkContainsRawPayload(readModel)).toBe(false);
  });

  it("keeps old LevelAnalysisSnapshot v1 attached facts supported", () => {
    const link = clone(
      oldSnapshotTradeLinkFixture,
    ) as JournalLevelAnalysisTradeLinkRecord;
    const readModel = buildTradeDetailLevelFactsReadModel({
      savedTradeId: link.savedTradeId,
      featureEnabled: true,
      link,
    });

    expect(jsonStable(readModel)).toEqual(oldSnapshotAttachedFixture);
    expect(readModel.attachedFacts).toMatchObject({
      sourceKind: "single_snapshot_v1",
      fifteenMinuteContextOnlyStatus: "not_supplied",
      missingFacts: [
        "density_metric",
        "candidate_inventory_gap_summary",
        "cache_fingerprint_summary",
      ],
    });
  });

  it("derives blocked as-of state without attached facts", () => {
    const link = clone(blockedTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord;
    const readModel = buildTradeDetailLevelFactsReadModel({
      savedTradeId: link.savedTradeId,
      featureEnabled: true,
      link,
    });

    expect(jsonStable(readModel)).toEqual(blockedAsOfFixture);
    expect(readModel.attachedFacts).toBeUndefined();
    expect(readModel.blockedFacts).toMatchObject({
      matchReason: "as_of_after_allowed_boundary",
    });
  });

  it("derives not-checked and feature-disabled states without repository or route behavior", () => {
    expect(
      jsonStable(
        buildTradeDetailLevelFactsReadModel({
          savedTradeId: "trade_MISSING_2026_06_01_001",
          featureEnabled: true,
          link: null,
        }),
      ),
    ).toEqual(notCheckedFixture);
    expect(
      jsonStable(
        buildTradeDetailLevelFactsReadModel({
          savedTradeId: linkedTradeLinkFixture.savedTradeId,
          featureEnabled: false,
          link: clone(linkedTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord,
        }),
      ),
    ).toEqual(featureDisabledFixture);
  });

  it("rejects malformed read models, raw payload copies, and unsafe packaged 15m state", () => {
    const malformed = clone(attachedFixture) as MutableRecord;
    malformed.rawPayload = { copied: true };
    malformed.priorityScore = 100;
    const attachedFacts = malformed.attachedFacts as MutableRecord;
    attachedFacts.fifteenMinuteContextOnlyStatus = "not_supplied";

    const result = validateTradeDetailLevelFactsReadModel(malformed);

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") {
      return;
    }
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "raw_payload_not_allowed",
        "prohibited_journal_owned_field",
        "fifteen_minute_not_context_only",
      ]),
    );
  });

  it("does not introduce recommendation coaching grading P/L giveback behavior-scoring priority or trade-advice wording", () => {
    for (const fixture of [
      attachedFixture,
      oldSnapshotAttachedFixture,
      blockedAsOfFixture,
      notCheckedFixture,
      featureDisabledFixture,
    ]) {
      expectNoJournalOwnedFields(fixture);
      expectNoAdviceLanguage(fixture);
    }
  });
});
