import type {
  TradeStoryActivitiesResult,
  TradeStoryActivity,
} from "./journal-trade-story-activities";
import type { TradeStoryMarketSession } from "./journal-trade-story-position-ledger";
import { addDecimal } from "../round-trips/journal-decimal-math";

export type TradeStoryCopyFormatters = Readonly<{
  describeSession: (session: TradeStoryMarketSession) => string;
  formatPercentageOfPosition: (
    quantityDecimal: string,
    positionQuantityDecimal: string,
  ) => string;
  formatPrice: (priceDecimal: string) => string;
  formatQuantity: (quantityDecimal: string) => string;
  formatTime: (atUtc: string) => string;
}>;

export type TradeStoryCopyInput = Readonly<{
  activities: TradeStoryActivitiesResult;
  finalOutcomeCopy?: string | null;
  formatters: TradeStoryCopyFormatters;
  tradeLabel: "Day trade" | "Swing trade" | "Trade";
}>;

export type TradeStoryCopyResult =
  | Readonly<{
    chapters: readonly Readonly<{
      sentences: readonly string[];
      tradingDate: string;
    }>[];
    status: "ready";
  }>
  | Readonly<{
    reason: "position_flipped" | "position_reopened";
    status: "factual_timeline_required";
  }>;

function narrationPrefix(
  activity: TradeStoryActivity,
  input: TradeStoryCopyInput,
): string {
  return activity.marketSession === null
    ? "You"
    : `During ${input.formatters.describeSession(activity.marketSession)}, you`;
}

function sessionLocation(
  activity: TradeStoryActivity,
  input: TradeStoryCopyInput,
): string {
  return activity.marketSession === null
    ? ""
    : ` during ${input.formatters.describeSession(activity.marketSession)}`;
}

function entryRun(
  activities: readonly TradeStoryActivity[],
  start: number,
): readonly TradeStoryActivity[] {
  const initial = activities[start]!;
  const session = initial.marketSession;
  const permitted = initial.kind === "opened"
    ? new Set(["opened", "accumulated"])
    : new Set([initial.kind]);
  const result: TradeStoryActivity[] = [];
  for (let index = start; index < activities.length; index += 1) {
    const candidate = activities[index]!;
    if (!permitted.has(candidate.kind) || candidate.marketSession !== session) break;
    result.push(candidate);
  }
  return Object.freeze(result);
}

function addedQuantity(activities: readonly TradeStoryActivity[]): string {
  return activities.reduce((total, activity) =>
    activity.kind === "accumulated" || activity.kind === "added"
      ? addDecimal(total, activity.addedQuantityDecimal)
      : total, "0");
}

function entrySentence(
  activities: readonly TradeStoryActivity[],
  input: TradeStoryCopyInput,
): string {
  const first = activities[0]!;
  const last = activities.at(-1)!;
  const executionCopy = activities.length === 1
    ? ""
    : ` through ${activities.length} entry executions`;
  const averageEntryPrice = last.kind === "opened" || last.kind === "accumulated" || last.kind === "added"
    ? last.averageEntryPriceDecimal
    : null;
  const averageCopy = averageEntryPrice === null
    ? ""
    : ` at a ${input.formatters.formatPrice(averageEntryPrice)} average`;
  if (first.kind === "opened") {
    if (activities.length === 1) {
      return `You opened this ${input.tradeLabel.toLowerCase()}${sessionLocation(first, input)} with ${input.formatters.formatQuantity(first.positionQuantityDecimal)} shares${averageCopy}.`;
    }
    return `You opened this ${input.tradeLabel.toLowerCase()}${sessionLocation(first, input)}, accumulating ${input.formatters.formatQuantity(last.kind === "opened" || last.kind === "accumulated" || last.kind === "added" ? last.positionQuantityDecimal : "0")} shares${executionCopy}${averageCopy}.`;
  }
  const quantity = addedQuantity(activities);
  const finalPosition = last.kind === "accumulated" || last.kind === "added"
    ? last.positionQuantityDecimal
    : "0";
  const verb = first.kind === "added" ? "added" : "accumulated";
  const additional = first.kind === "added" ? " additional" : "";
  return `${narrationPrefix(first, input)} ${verb} ${input.formatters.formatQuantity(quantity)}${additional} shares${executionCopy}, increasing the position to ${input.formatters.formatQuantity(finalPosition)} shares${averageCopy}.`;
}

function activitySentence(
  activity: TradeStoryActivity,
  input: TradeStoryCopyInput,
): string {
  if (activity.kind === "carried") {
    if (activity.marketSession !== null) {
      return `You carried ${input.formatters.formatQuantity(activity.positionQuantityDecimal)} shares into ${input.formatters.describeSession(activity.marketSession)}.`;
    }
    return `You carried ${input.formatters.formatQuantity(activity.positionQuantityDecimal)} shares from ${activity.fromTradingDate ?? "the prior trading date"} into this trading day.`;
  }
  if (activity.kind === "scaled_out") {
    const percent = input.formatters.formatPercentageOfPosition(
      activity.scaledOutQuantityDecimal,
      activity.positionBeforeQuantityDecimal,
    );
    return `${narrationPrefix(activity, input)} scaled out ${input.formatters.formatQuantity(activity.scaledOutQuantityDecimal)} shares (${percent} of the position) at ${input.formatters.formatTime(activity.atUtc)}, leaving ${input.formatters.formatQuantity(activity.remainingPositionQuantityDecimal)} shares.`;
  }
  if (activity.kind === "fully_exited") {
    const outcomeCopy = input.finalOutcomeCopy ? ` ${input.finalOutcomeCopy}` : "";
    return `${narrationPrefix(activity, input)} fully exited the remaining ${input.formatters.formatQuantity(activity.exitedQuantityDecimal)} shares at ${input.formatters.formatTime(activity.atUtc)}${outcomeCopy}.`;
  }
  throw new Error("trade_story_entry_run_required");
}

function carriesIntoSessionWithActivity(
  activities: readonly TradeStoryActivity[],
  index: number,
): boolean {
  const carry = activities[index]!;
  if (carry.kind !== "carried" || carry.marketSession === null) return false;
  for (let later = index + 1; later < activities.length; later += 1) {
    const candidate = activities[later]!;
    if (candidate.kind !== "carried" && candidate.marketSession === carry.marketSession) {
      return true;
    }
  }
  return false;
}

/**
 * Renders the structured Trade story into plain trader-facing sentences. The
 * caller owns locale, currency, percentage and timezone formatting so this
 * function never rounds or reinterprets Journal facts.
 */
export function composeTradeStoryCopy(input: TradeStoryCopyInput): TradeStoryCopyResult {
  if (input.activities.status === "factual_timeline_required") {
    return Object.freeze({
      reason: input.activities.reason,
      status: "factual_timeline_required",
    });
  }
  const chapters = input.activities.chapters.map((chapter) => {
    const sentences: string[] = [];
    for (let index = 0; index < chapter.activities.length;) {
      const activity = chapter.activities[index]!;
      if (activity.kind === "carried") {
        if (activity.fromTradingDate !== null || carriesIntoSessionWithActivity(chapter.activities, index)) {
          sentences.push(activitySentence(activity, input));
        }
        index += 1;
        continue;
      }
      if (activity.kind === "opened" || activity.kind === "accumulated" || activity.kind === "added") {
        const run = entryRun(chapter.activities, index);
        sentences.push(entrySentence(run, input));
        index += run.length;
        continue;
      }
      sentences.push(activitySentence(activity, input));
      index += 1;
    }
    return Object.freeze({ sentences: Object.freeze(sentences), tradingDate: chapter.tradingDate });
  });
  return Object.freeze({ chapters: Object.freeze(chapters), status: "ready" });
}
