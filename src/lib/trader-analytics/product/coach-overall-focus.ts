export interface CoachOverallFocusBehavior {
  estimatedGrossCost: number | null;
  frequency: number;
  id: string;
  label: string;
  nextAction: string;
  relatedTradeIds: string[];
}

export interface CoachOverallFocusSummary {
  evidenceCountLabel: string;
  impactLabel: string;
  label: string;
  nextAction: string;
  plainExplanation: string;
  sampleWarning: string;
  whyItMatters: string;
}

export interface CoachEvidenceQueueItem {
  reviewStatus?: string;
  savedTradeId: string;
}

export interface CoachProgressFollowThroughTrade {
  reviewStatus: string;
}

export interface CoachProgressFollowThroughQueueItem {
  reviewStatus: string;
}

export type CoachProgressFollowThroughTone =
  | "danger"
  | "info"
  | "success"
  | "warning";

export interface CoachProgressFollowThroughCard {
  detail: string;
  label: string;
  tone: CoachProgressFollowThroughTone;
  value: string;
}

export interface CoachProgressFollowThroughSummary {
  activeFocusLabel: string;
  cards: CoachProgressFollowThroughCard[];
  completedReviewCount: number;
  completionPct: number;
  importedTradeCount: number;
  inProgressReviewCount: number;
  nextActionHref: string;
  nextActionLabel: string;
  reviewBacklogCount: number;
  trendDetail: string;
  trendLabel: string;
  trendTone: CoachProgressFollowThroughTone;
}

function signed(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

export function plainCoachBehaviorExplanation(label: string): string {
  const value = label.toLowerCase();

  if (
    value.includes("add") &&
    (value.includes("weak") ||
      value.includes("adverse") ||
      value.includes("price moved against") ||
      value.includes("repair") ||
      value.includes("chart context"))
  ) {
    return "The execution replay shows size was added after price had moved against the position. That is not automatically a mistake or a bad dip buy. Check whether support held, price reclaimed, or the trade repaired before the add; if it did not, the add likely increased risk.";
  }

  if (value.includes("profit") || value.includes("protect") || value.includes("reduction")) {
    return "Profit protection is about what happened after the trade had something to protect. Review whether exits locked in the good part of the trade or gave too much of it back.";
  }

  if (value.includes("premature") || value.includes("early")) {
    return "A premature exit means the trade may have been reduced before the original idea had enough room to work. Review the reason for the exit before turning it into a rule.";
  }

  if (value.includes("rapid") || value.includes("fire") || value.includes("chasing")) {
    return "Fast repeated decisions can turn one trade idea into a reaction loop. Review the sequence and decide where the trade should have slowed down.";
  }

  if (value.includes("size") || value.includes("sizing")) {
    return "Sizing review means checking whether share size matched the quality of the trade idea and the risk in front of you.";
  }

  if (value.includes("open")) {
    return "Open-trade review means the import still had exposure left. Treat the item as position-history review until the position is flat.";
  }

  return "Review the replay and name the behavior in your own words before creating a new rule. The coach should translate evidence, not bury you in engine labels.";
}

export function chooseCoachOverallFocusBehavior(args: {
  items: CoachOverallFocusBehavior[];
  top: CoachOverallFocusBehavior | null;
  tradeId: string | null;
}): CoachOverallFocusBehavior | null {
  if (args.tradeId) {
    const related = args.items.find((item) =>
      item.relatedTradeIds.includes(args.tradeId ?? ""),
    );

    if (related) {
      return related;
    }
  }

  return args.top ?? args.items[0] ?? null;
}

export function chooseCoachEvidenceQueueItem<T extends CoachEvidenceQueueItem>(args: {
  behavior: CoachOverallFocusBehavior | null;
  fallback: T | null;
  queue: T[];
}): T | null {
  const relatedIds = new Set(args.behavior?.relatedTradeIds ?? []);

  if (relatedIds.size === 0) {
    return args.fallback ?? args.queue[0] ?? null;
  }

  const relatedItems = args.queue.filter((item) =>
    relatedIds.has(item.savedTradeId),
  );

  return (
    relatedItems.find((item) => !isFinishedReview(item.reviewStatus ?? "")) ??
    relatedItems[0] ??
    args.fallback ??
    args.queue[0] ??
    null
  );
}

export function buildCoachOverallFocusSummary(args: {
  behavior: CoachOverallFocusBehavior | null;
  fallbackAction: string;
  primarySymbol: string | null;
}): CoachOverallFocusSummary {
  if (!args.behavior) {
    return {
      evidenceCountLabel: "No saved evidence yet",
      impactLabel:
        "Import and review more trades before the coach can measure a recurring behavior.",
      label: "Save trades to build a coaching focus",
      nextAction: args.fallbackAction,
      plainExplanation:
        "Save one broker CSV, then review the first execution replay and write one lesson.",
      sampleWarning: "Save one broker CSV to unlock coaching from your own trades.",
      whyItMatters: args.primarySymbol
        ? `Start with ${args.primarySymbol} because it is the clearest saved review item available right now.`
        : "The coach needs a saved import before it can connect guidance to your own trades.",
    };
  }

  const impact = args.behavior.estimatedGrossCost;
  const impactCopy =
    typeof impact === "number" && impact < 0
      ? ` It is tied to ${signed(impact)} gross P/L in the current evidence set.`
      : typeof impact === "number" && impact > 0
        ? ` The related trades are ${signed(impact)} gross P/L in the current evidence set, so review whether the behavior helped or simply appeared in winners.`
        : "";
  const tradeCount = Math.max(
    args.behavior.relatedTradeIds.length,
    args.behavior.frequency,
  );

  return {
    evidenceCountLabel: `${tradeCount} saved trade${tradeCount === 1 ? "" : "s"}`,
    impactLabel:
      impact === null || impact === 0
        ? "Impact needs review"
        : `${signed(impact)} evidence P/L`,
    label: args.behavior.label,
    nextAction: args.behavior.nextAction,
    plainExplanation: plainCoachBehaviorExplanation(args.behavior.label),
    sampleWarning:
      args.behavior.frequency < 3
        ? "Small sample: use this as a review prompt until more trades confirm it."
        : "Use the linked trades as evidence before turning this into a rule.",
    whyItMatters: `${args.behavior.label} appears in ${
      args.behavior.frequency
    } saved trade${args.behavior.frequency === 1 ? "" : "s"}.${impactCopy} Review the evidence before creating or changing a rule.`,
  };
}

function isFinishedReview(status: string): boolean {
  return status === "reviewed" || status === "resolved";
}

function isIgnoredReview(status: string): boolean {
  return status === "ignored";
}

function pct(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

export function buildCoachProgressFollowThroughSummary(args: {
  activeFocusLabel?: string | null;
  hasSavedData: boolean;
  reviewQueueItems?: CoachProgressFollowThroughQueueItem[];
  trades: CoachProgressFollowThroughTrade[];
}): CoachProgressFollowThroughSummary {
  const reviewTrades = args.hasSavedData ? args.trades : [];
  const reviewQueueItems = args.hasSavedData ? (args.reviewQueueItems ?? []) : [];
  const importedTradeCount = reviewTrades.length;
  const ignoredReviewCount = reviewTrades.filter((trade) =>
    isIgnoredReview(trade.reviewStatus),
  ).length;
  const activeTradeCount = Math.max(0, importedTradeCount - ignoredReviewCount);
  const completedReviewCount = reviewTrades.filter((trade) =>
    isFinishedReview(trade.reviewStatus),
  ).length;
  const inProgressReviewCount = reviewTrades.filter(
    (trade) => trade.reviewStatus === "in_progress",
  ).length;
  const unresolvedTradeCount = Math.max(0, activeTradeCount - completedReviewCount);
  const unresolvedQueueCount = reviewQueueItems.filter(
    (item) =>
      !isFinishedReview(item.reviewStatus) && !isIgnoredReview(item.reviewStatus),
  ).length;
  const reviewBacklogCount =
    reviewQueueItems.length > 0
      ? unresolvedQueueCount
      : unresolvedTradeCount;
  const completionPct = pct(completedReviewCount, activeTradeCount);
  const activeFocusLabel =
    args.activeFocusLabel?.trim() || "current coaching focus";

  let trendLabel = "Save a broker CSV first";
  let trendDetail =
    "Progress starts after saved trades exist. Until then the coach can only show a preview.";
  let trendTone: CoachProgressFollowThroughTone = "warning";
  let nextActionHref = "/import-dry-run";
  let nextActionLabel = "Import trades";

  if (importedTradeCount > 0 && completedReviewCount === 0) {
    trendLabel = "Not enough completed reviews yet";
    trendDetail =
      "The app can see saved trade history, but progress is not measured until you finish reviews and save the lessons.";
    nextActionHref = "/review?queue=highest_priority";
    nextActionLabel = "Finish first review";
  } else if (completedReviewCount > 0 && completedReviewCount < 3) {
    trendLabel = "Needs more reviewed trades";
    trendDetail = `You have started reviewing ${activeFocusLabel}. Finish a few more evidence trades before treating the trend as meaningful.`;
    trendTone = "info";
    nextActionHref = "/review?queue=highest_priority";
    nextActionLabel = "Review next evidence trade";
  } else if (completedReviewCount >= 3 && reviewBacklogCount > completedReviewCount) {
    trendLabel = "Review backlog still high";
    trendDetail = `There is enough review history to start watching ${activeFocusLabel}, but the backlog is still larger than the completed review set.`;
    trendTone = "warning";
    nextActionHref = "/review?queue=highest_priority";
    nextActionLabel = "Reduce review backlog";
  } else if (completedReviewCount >= 3) {
    trendLabel = "Ready to watch the focus";
    trendDetail = `There are enough completed reviews to start checking whether ${activeFocusLabel} repeats less often in newer saved trades.`;
    trendTone = "success";
    nextActionHref = "/progress#quality";
    nextActionLabel = "Check quality trend";
  }

  return {
    activeFocusLabel,
    cards: [
      {
        detail: args.hasSavedData ? "Saved import history" : "No saved import yet",
        label: "Saved Trades",
        tone: importedTradeCount > 0 ? "info" : "warning",
        value: String(importedTradeCount),
      },
      {
        detail: "Finished trade reviews",
        label: "Reviews Finished",
        tone: completedReviewCount > 0 ? "success" : "warning",
        value: `${completedReviewCount} / ${activeTradeCount}`,
      },
      {
        detail: "Still needs review work",
        label: "Review Backlog",
        tone: reviewBacklogCount > 0 ? "warning" : "success",
        value: String(reviewBacklogCount),
      },
      {
        detail: "Do not call this improvement until reviews exist",
        label: "Progress State",
        tone: trendTone,
        value: `${completionPct}%`,
      },
    ],
    completedReviewCount,
    completionPct,
    importedTradeCount,
    inProgressReviewCount,
    nextActionHref,
    nextActionLabel,
    reviewBacklogCount,
    trendDetail,
    trendLabel,
    trendTone,
  };
}
