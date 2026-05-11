import { describe, expect, it } from "vitest";
import {
  buildCoachOverallFocusSummary,
  buildCoachProgressFollowThroughSummary,
  chooseCoachEvidenceQueueItem,
  chooseCoachOverallFocusBehavior,
  plainCoachBehaviorExplanation,
  type CoachOverallFocusBehavior,
} from "../product/coach-overall-focus";

const behaviors: CoachOverallFocusBehavior[] = [
  {
    estimatedGrossCost: -325.25,
    frequency: 4,
    id: "risk:add-weakness",
    label: "Adding into weakness",
    nextAction: "Replay the adds and write the condition required before adding.",
    relatedTradeIds: ["trade-1", "trade-2", "trade-3"],
  },
  {
    estimatedGrossCost: 210,
    frequency: 2,
    id: "strength:protection",
    label: "Strong profit protection",
    nextAction: "Write down what protected the first move.",
    relatedTradeIds: ["trade-9"],
  },
];

describe("coach overall focus read model", () => {
  it("chooses the behavior connected to the selected evidence trade", () => {
    expect(
      chooseCoachOverallFocusBehavior({
        items: behaviors,
        top: behaviors[0],
        tradeId: "trade-9",
      })?.label,
    ).toBe("Strong profit protection");
  });

  it("chooses an evidence queue item that matches the current coaching focus", () => {
    const item = chooseCoachEvidenceQueueItem({
      behavior: behaviors[0],
      fallback: {
        reviewStatus: "new",
        savedTradeId: "unrelated-trade",
        symbol: "AVEX",
      },
      queue: [
        {
          reviewStatus: "new",
          savedTradeId: "unrelated-trade",
          symbol: "AVEX",
        },
        {
          reviewStatus: "new",
          savedTradeId: "trade-2",
          symbol: "ELMT",
        },
      ],
    });

    expect(item?.savedTradeId).toBe("trade-2");
    expect(item?.symbol).toBe("ELMT");
  });

  it("falls back to a completed related item before unrelated queue work", () => {
    const item = chooseCoachEvidenceQueueItem({
      behavior: behaviors[1],
      fallback: {
        reviewStatus: "new",
        savedTradeId: "unrelated-trade",
      },
      queue: [
        {
          reviewStatus: "reviewed",
          savedTradeId: "trade-9",
        },
        {
          reviewStatus: "new",
          savedTradeId: "unrelated-trade",
        },
      ],
    });

    expect(item?.savedTradeId).toBe("trade-9");
  });

  it("builds beginner-readable aggregate focus copy", () => {
    const summary = buildCoachOverallFocusSummary({
      behavior: behaviors[0],
      fallbackAction: "Import trades",
      primarySymbol: "OMEX",
    });

    expect(summary.label).toBe("Adding into weakness");
    expect(summary.evidenceCountLabel).toBe("4 saved trades");
    expect(summary.impactLabel).toBe("-325.25 evidence P/L");
    expect(summary.focusActionLabel).toBe("Fix first");
    expect(summary.focusActionDetail).toBe("-325.25 evidence P/L");
    expect(summary.focusActionTone).toBe("risk");
    expect(summary.whyItMatters).toContain("appears in 4 saved trades");
    expect(summary.sampleWarning).toContain("Use the linked trades as evidence");
    expect(summary.plainExplanation).toContain("size was added");
    expect(summary.plainExplanation).toContain("not automatically a mistake");
  });

  it("does not call a profitable evidence set a fix-first conclusion", () => {
    const summary = buildCoachOverallFocusSummary({
      behavior: behaviors[1],
      fallbackAction: "Import trades",
      primarySymbol: "OMEX",
    });

    expect(summary.focusActionLabel).toBe("Review first");
    expect(summary.focusActionDetail).toContain("+210.00 evidence P/L");
    expect(summary.focusActionDetail).toContain("Confirm whether this was useful");
    expect(summary.focusActionTone).toBe("review");
    expect(summary.whyItMatters).toContain("test whether the behavior helped");
    expect(summary.whyItMatters).not.toContain("fix");
  });

  it("explains adverse-add focus without calling every dip buy a mistake", () => {
    const copy = plainCoachBehaviorExplanation(
      "Review adds that need chart context",
    );

    expect(copy).toContain("not automatically a mistake");
    expect(copy).toContain("bad dip buy");
    expect(copy).toContain("support held");
    expect(copy).toContain("trade repaired");
    expect(copy).not.toMatch(/signal|trade call|financial advice/i);
  });

  it("uses an honest empty state when aggregate behavior is unavailable", () => {
    const summary = buildCoachOverallFocusSummary({
      behavior: null,
      fallbackAction: "Save one broker CSV",
      primarySymbol: null,
    });

    expect(summary.label).toBe("Save trades to build a coaching focus");
    expect(summary.evidenceCountLabel).toBe("No saved evidence yet");
    expect(summary.focusActionLabel).toBe("Start here");
    expect(summary.focusActionTone).toBe("review");
    expect(summary.sampleWarning).toBe(
      "Save one broker CSV to unlock coaching from your own trades.",
    );
    expect(summary.whyItMatters).toContain("needs a saved import");
  });

  it("keeps behavior explanations observational", () => {
    const copy = plainCoachBehaviorExplanation("Rapid chasing decisions");

    expect(copy).toContain("Review the sequence");
    expect(copy).not.toMatch(/buy|sell|signal|trade call|financial advice/i);
  });

  it("separates saved imports from measurable coaching progress", () => {
    const summary = buildCoachProgressFollowThroughSummary({
      activeFocusLabel: "Adding into weakness",
      hasSavedData: true,
      reviewQueueItems: [
        { reviewStatus: "new" },
        { reviewStatus: "in_progress" },
        { reviewStatus: "reviewed" },
      ],
      trades: [
        { reviewStatus: "new" },
        { reviewStatus: "in_progress" },
        { reviewStatus: "reviewed" },
      ],
    });

    expect(summary.importedTradeCount).toBe(3);
    expect(summary.completedReviewCount).toBe(1);
    expect(summary.reviewBacklogCount).toBe(2);
    expect(summary.trendLabel).toBe("Needs more reviewed trades");
    expect(summary.nextActionLabel).toBe("Review next evidence trade");
  });

  it("uses an honest empty state before saved data exists", () => {
    const summary = buildCoachProgressFollowThroughSummary({
      hasSavedData: false,
      trades: [{ reviewStatus: "reviewed" }],
    });

    expect(summary.importedTradeCount).toBe(0);
    expect(summary.trendLabel).toBe("Save a broker CSV first");
    expect(summary.nextActionHref).toBe("/import-dry-run");
  });
});
