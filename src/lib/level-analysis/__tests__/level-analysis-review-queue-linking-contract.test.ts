import { describe, expect, it } from "vitest";
import attachedStateFixture from "../__fixtures__/review-queue-linking-contract/level-facts-state.attached.compact.json";
import oldSnapshotAttachedStateFixture from "../__fixtures__/review-queue-linking-contract/level-facts-state.old-snapshot-attached.compact.json";
import blockedAsOfStateFixture from "../__fixtures__/review-queue-linking-contract/level-facts-state.blocked-asof.compact.json";
import unavailableStateFixture from "../__fixtures__/review-queue-linking-contract/level-facts-state.unavailable.compact.json";
import featureDisabledStateFixture from "../__fixtures__/review-queue-linking-contract/level-facts-state.feature-disabled.compact.json";
import readModelFixture from "../__fixtures__/review-queue-linking-contract/queue-level-facts-read-model.compact.json";
import linkedTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.linked.compact.json";
import oldSnapshotTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.old-snapshot.compact.json";
import blockedTradeLinkFixture from "../__fixtures__/trade-link-contract/trade-link-record.blocked.compact.json";
import {
  buildSavedReviewQueueLevelFactsReadModel,
  createFeatureDisabledReviewQueueLevelFactsState,
  createSavedReviewQueueLevelFactsState,
  deriveSavedReviewQueueLevelFactsStateFromTradeLink,
  validateSavedReviewQueueLevelFactsState,
} from "../level-analysis-review-queue-linking-contract";
import {
  journalLevelAnalysisTradeLinkContainsRawPayload,
  type JournalLevelAnalysisTradeLinkRecord,
} from "../level-analysis-journal-delivery-trade-link-contract";

type MutableRecord = Record<string, unknown>;

function clone<T>(value: T): T {
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

describe("level-analysis review queue linking contract", () => {
  it("validates compact queue level-facts state fixtures", () => {
    for (const fixture of [
      attachedStateFixture,
      oldSnapshotAttachedStateFixture,
      blockedAsOfStateFixture,
      unavailableStateFixture,
      featureDisabledStateFixture,
    ]) {
      const result = validateSavedReviewQueueLevelFactsState(fixture);

      expect(result.status).toBe("valid");
    }
  });

  it("derives attached packaged review delivery queue state from a trade link", () => {
    const link = clone(linkedTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord;
    const state = deriveSavedReviewQueueLevelFactsStateFromTradeLink(link);

    expect(state).toEqual(attachedStateFixture);
    expect(state.availability).toBe("attached");
    expect(state.fifteenMinuteContextOnlyStatus).toBe("context_only");
    expect(journalLevelAnalysisTradeLinkContainsRawPayload(state)).toBe(false);
  });

  it("derives old LevelAnalysisSnapshot v1 attached queue state", () => {
    const link = clone(oldSnapshotTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord;
    const state = deriveSavedReviewQueueLevelFactsStateFromTradeLink(link);

    expect(state).toEqual(oldSnapshotAttachedStateFixture);
    expect(state.sourceKind).toBe("single_snapshot_v1");
    expect(state.fifteenMinuteContextOnlyStatus).toBe("not_supplied");
  });

  it("derives blocked as-of queue state without trusted linked facts", () => {
    const link = clone(blockedTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord;
    const state = deriveSavedReviewQueueLevelFactsStateFromTradeLink(link);

    expect(state).toEqual(blockedAsOfStateFixture);
    expect(state.availability).toBe("blocked_by_as_of_policy");
    expect("linkedSymbolSummary" in state).toBe(false);
  });

  it("derives unavailable, feature-disabled, and explicitly available states", () => {
    expect(deriveSavedReviewQueueLevelFactsStateFromTradeLink(null)).toMatchObject({
      availability: "not_checked",
      label: "Level facts not checked",
    });
    expect(createFeatureDisabledReviewQueueLevelFactsState()).toEqual(
      featureDisabledStateFixture,
    );
    expect(
      createSavedReviewQueueLevelFactsState({
        availability: "unavailable_for_symbol_provider",
      }),
    ).toEqual(unavailableStateFixture);
    expect(
      createSavedReviewQueueLevelFactsState({
        availability: "available_to_attach",
      }),
    ).toMatchObject({
      availability: "available_to_attach",
      label: "Level facts available",
      limitationCount: 0,
    });
  });

  it("builds deterministic batch read model counts without changing queue priority", () => {
    const readModel = buildSavedReviewQueueLevelFactsReadModel({
      featureEnabled: true,
      tradeIds: [
        "trade_DEVS_2026_06_01_001",
        "trade_DEVS_2026_06_01_early",
        "trade_MISSING_2026_06_01_001",
      ],
      linksByTradeId: {
        trade_DEVS_2026_06_01_001:
          clone(linkedTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord,
        trade_DEVS_2026_06_01_early:
          clone(blockedTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord,
      },
    });

    expect(readModel).toEqual(readModelFixture);
    expect(collectObjectKeys(readModel)).not.toContain("priorityScore");
  });

  it("builds feature-disabled states for every queue item when disabled", () => {
    const readModel = buildSavedReviewQueueLevelFactsReadModel({
      featureEnabled: false,
      tradeIds: ["trade_DEVS_2026_06_01_001", "trade_QUBT_2026_06_01_001"],
      linksByTradeId: {
        trade_DEVS_2026_06_01_001:
          clone(linkedTradeLinkFixture) as JournalLevelAnalysisTradeLinkRecord,
      },
    });

    expect(readModel.counts.feature_disabled).toBe(2);
    expect(Object.values(readModel.statesByTradeId)).toEqual([
      featureDisabledStateFixture,
      featureDisabledStateFixture,
    ]);
  });

  it("rejects malformed states and raw payload copies", () => {
    const malformed = clone(attachedStateFixture) as MutableRecord;
    malformed.rawPayload = { copied: true };
    malformed.limitationCount = 99;

    const result = validateSavedReviewQueueLevelFactsState(malformed);

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") {
      return;
    }
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "raw_payload_not_allowed",
        "inconsistent_limitation_count",
      ]),
    );
  });

  it("does not introduce recommendation coaching grading P/L giveback behavior-scoring priority or trade-advice wording", () => {
    for (const value of [
      attachedStateFixture,
      oldSnapshotAttachedStateFixture,
      blockedAsOfStateFixture,
      unavailableStateFixture,
      featureDisabledStateFixture,
      readModelFixture,
    ]) {
      expectNoJournalOwnedFields(value);
      expectNoAdviceLanguage(value);
    }
  });
});
