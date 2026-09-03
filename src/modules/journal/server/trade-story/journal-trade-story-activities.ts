import type {
  TradeStoryCarryEvent,
  TradeStoryLedgerCheckpoint,
  TradeStoryLedgerResult,
  TradeStoryMarketSession,
} from "./journal-trade-story-position-ledger";

type TradeStoryActivityBase = Readonly<{
  atUtc: string;
  marketSession: TradeStoryMarketSession | null;
  tradingDate: string;
}>;

export type TradeStoryActivity =
  | (TradeStoryActivityBase & Readonly<{
    averageEntryPriceDecimal: string | null;
    executionId: string;
    kind: "opened";
    positionQuantityDecimal: string;
  }>)
  | (TradeStoryActivityBase & Readonly<{
    addedQuantityDecimal: string;
    averageEntryPriceDecimal: string | null;
    executionId: string;
    kind: "accumulated" | "added";
    positionQuantityDecimal: string;
  }>)
  | (TradeStoryActivityBase & Readonly<{
    executionId: string;
    kind: "scaled_out";
    positionBeforeQuantityDecimal: string;
    remainingPositionQuantityDecimal: string;
    scaledOutQuantityDecimal: string;
  }>)
  | (TradeStoryActivityBase & Readonly<{
    executionId: string;
    kind: "fully_exited";
    exitedQuantityDecimal: string;
  }>)
  | (TradeStoryActivityBase & Readonly<{
    fromTradingDate: string | null;
    kind: "carried";
    positionQuantityDecimal: string;
  }>);

export type TradeStoryChapter = Readonly<{
  activities: readonly TradeStoryActivity[];
  tradingDate: string;
}>;

export type TradeStoryActivitiesResult =
  | Readonly<{
    chapters: readonly TradeStoryChapter[];
    status: "ready";
  }>
  | Readonly<{
    checkpoints: readonly TradeStoryLedgerCheckpoint[];
    reason: "position_flipped" | "position_reopened";
    status: "factual_timeline_required";
  }>;

function checkpointActivity(
  checkpoint: TradeStoryLedgerCheckpoint,
): TradeStoryActivity {
  const common = {
    atUtc: checkpoint.execution.executedAtUtc,
    marketSession: checkpoint.execution.marketSession,
    tradingDate: checkpoint.execution.tradingDate,
  } as const;
  if (checkpoint.transition === "opened") {
    return Object.freeze({
      ...common,
      averageEntryPriceDecimal: checkpoint.averageEntryPriceAfterDecimal,
      executionId: checkpoint.execution.executionId,
      kind: "opened",
      positionQuantityDecimal: checkpoint.positionAfterQuantityDecimal,
    });
  }
  if (checkpoint.transition === "increased") {
    return Object.freeze({
      ...common,
      addedQuantityDecimal: checkpoint.execution.quantityDecimal,
      averageEntryPriceDecimal: checkpoint.averageEntryPriceAfterDecimal,
      executionId: checkpoint.execution.executionId,
      kind: checkpoint.increasePhase === "after_scale_out" ? "added" : "accumulated",
      positionQuantityDecimal: checkpoint.positionAfterQuantityDecimal,
    });
  }
  if (checkpoint.transition === "scaled_out") {
    return Object.freeze({
      ...common,
      executionId: checkpoint.execution.executionId,
      kind: "scaled_out",
      positionBeforeQuantityDecimal: checkpoint.reductionFromPositionQuantityDecimal!,
      remainingPositionQuantityDecimal: checkpoint.positionAfterQuantityDecimal,
      scaledOutQuantityDecimal: checkpoint.reductionQuantityDecimal!,
    });
  }
  return Object.freeze({
    ...common,
    executionId: checkpoint.execution.executionId,
    exitedQuantityDecimal: checkpoint.reductionQuantityDecimal!,
    kind: "fully_exited",
  });
}

function carryActivity(event: TradeStoryCarryEvent): TradeStoryActivity {
  return Object.freeze({
    atUtc: event.atUtc,
    fromTradingDate: event.fromTradingDate,
    kind: "carried",
    marketSession: event.session,
    positionQuantityDecimal: event.positionQuantityDecimal,
    tradingDate: event.tradingDate,
  });
}

function activityRank(activity: TradeStoryActivity): number {
  if (activity.kind === "carried" && activity.fromTradingDate !== null) return 0;
  return activity.kind === "carried" ? 1 : 2;
}

/**
 * Converts ledger facts into date-grouped trader-language activities. Final
 * prose is intentionally left to the drawer renderer so wording can evolve
 * without changing position arithmetic.
 */
export function buildTradeStoryActivities(
  ledgerResult: TradeStoryLedgerResult,
): TradeStoryActivitiesResult {
  if (ledgerResult.status === "unsupported") {
    return Object.freeze({
      checkpoints: ledgerResult.checkpoints,
      reason: ledgerResult.reason,
      status: "factual_timeline_required",
    });
  }
  const activities = [
    ...ledgerResult.ledger.carryEvents.map(carryActivity),
    ...ledgerResult.ledger.checkpoints.map(checkpointActivity),
  ];
  const byDate = new Map<string, TradeStoryActivity[]>();
  for (const activity of activities) {
    const chapter = byDate.get(activity.tradingDate) ?? [];
    chapter.push(activity);
    byDate.set(activity.tradingDate, chapter);
  }
  return Object.freeze({
    chapters: Object.freeze([...byDate.entries()].map(([tradingDate, chapter]) => Object.freeze({
      // A multi-day carry is the opening context for its new trading-date
      // chapter, even though the next known execution can occur after a
      // named-session boundary on that date.
      activities: Object.freeze([...chapter].sort((left, right) => {
        const rank = activityRank(left) - activityRank(right);
        if (rank !== 0 && (activityRank(left) === 0 || activityRank(right) === 0)) return rank;
        return left.atUtc.localeCompare(right.atUtc) || rank;
      })),
      tradingDate,
    }))),
    status: "ready",
  });
}
