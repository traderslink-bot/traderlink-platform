import type { JournalTagPresetCategory } from "@/src/modules/journal/contracts/journal-tag-preset-catalog";

export type TradeExplorerReviewTarget = Readonly<{
  roundTripId: string;
  closeLocalDate: string | null;
  closedAtUtc: string | null;
  direction: "long" | "short";
  displayedSymbol: string;
}>;

export type TradeExplorerReviewTag = Readonly<{
  assignmentCount: number;
  category: JournalTagPresetCategory | "custom";
  name: string;
  revision: number;
  tagId: string;
}>;

export type TradeExplorerCustomRuleReview = Readonly<{
  revision: number | null;
  ruleId: string;
  ruleVersionId: string;
  statement: string;
  status: "followed" | "broken" | "not_reviewed";
  title: string;
}>;

export type TradeExplorerPresetRuleReview = Readonly<{
  detail: string | null;
  ruleId: string;
  ruleVersionId: string;
  status: "followed" | "broken" | "n/a";
  title: string;
}>;

export type TradeExplorerReviewModel = Readonly<{
  availableTags: readonly TradeExplorerReviewTag[];
  customRules: readonly TradeExplorerCustomRuleReview[];
  note: Readonly<{
    revision: number | null;
    tradeNote: string;
  }>;
  presetRules: readonly TradeExplorerPresetRuleReview[];
  selectedTagIds: readonly string[];
  trade: TradeExplorerReviewTarget;
  roundTripVersionId: string;
}>;

export type TradeExplorerReviewRuleChange = Readonly<{
  expectedRevision: number | null;
  ruleId: string;
  ruleVersionId: string;
  status: TradeExplorerCustomRuleReview["status"];
}>;

export type TradeExplorerReviewSaveInput = Readonly<{
  closeLocalDate: string | null;
  expectedAccountSelectionRef: string;
  expectedRoundTripVersionId: string;
  note: Readonly<{
    expectedRevision: number | null;
    tradeNote: string;
  }> | null;
  roundTripId: string;
  ruleReviews: readonly TradeExplorerReviewRuleChange[];
  tags: Readonly<{
    expectedTagIds: readonly string[];
    presetKeys: readonly string[];
    tagIds: readonly string[];
  }> | null;
}>;
