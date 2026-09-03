import Decimal from "decimal.js";

import {
  assertCanonicalJournalDecimal,
  assertJournalTradingDate,
  assertJournalUtcTimestamp,
} from "../../contracts/journal-storage-values";
import {
  absoluteDecimal,
  addDecimal,
  compareDecimal,
  negateDecimal,
} from "../round-trips/journal-decimal-math";

const ExactDecimal = Decimal.clone({
  precision: 160,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});

export type TradeStoryMarketSession =
  | "pre_market"
  | "regular_hours"
  | "post_market";

export type TradeStoryLedgerExecution = Readonly<{
  executionId: string;
  executedAtUtc: string;
  marketSession: TradeStoryMarketSession | null;
  priceDecimal: string | null;
  quantityDecimal: string;
  sequence: number;
  side: "buy" | "sell";
  tradingDate: string;
}>;

export type TradeStorySessionBoundary = Readonly<{
  atUtc: string;
  session: TradeStoryMarketSession;
  tradingDate: string;
}>;

export type TradeStoryPositionTransition =
  | "opened"
  | "increased"
  | "scaled_out"
  | "fully_exited";

export type TradeStoryLedgerCheckpoint = Readonly<{
  averageEntryPriceAfterDecimal: string | null;
  averageEntryPriceBeforeDecimal: string | null;
  execution: TradeStoryLedgerExecution;
  increasePhase: "initial_accumulation" | "after_scale_out" | null;
  positionAfterDecimal: string;
  positionAfterQuantityDecimal: string;
  positionBeforeDecimal: string;
  positionBeforeQuantityDecimal: string;
  reductionFromPositionQuantityDecimal: string | null;
  reductionQuantityDecimal: string | null;
  transition: TradeStoryPositionTransition;
}>;

export type TradeStoryCarryEvent = Readonly<{
  atUtc: string;
  fromTradingDate: string | null;
  kind: "across_session" | "across_trading_date";
  positionQuantityDecimal: string;
  session: TradeStoryMarketSession | null;
  tradingDate: string;
}>;

export type TradeStoryPositionLedger = Readonly<{
  carryEvents: readonly TradeStoryCarryEvent[];
  checkpoints: readonly TradeStoryLedgerCheckpoint[];
  direction: "long" | "short";
  maximumPositionQuantityDecimal: string;
}>;

export type TradeStoryLedgerResult =
  | Readonly<{ ledger: TradeStoryPositionLedger; status: "ready" }>
  | Readonly<{
    checkpoints: readonly TradeStoryLedgerCheckpoint[];
    reason: "position_flipped" | "position_reopened";
    status: "unsupported";
  }>;

function canonicalDecimal(value: Decimal): string {
  const normalized = value.isZero() ? "0" : value.toFixed();
  assertCanonicalJournalDecimal(normalized, "tradeStoryDecimal");
  return normalized;
}

function weightedAverage(
  currentAverageDecimal: string | null,
  currentQuantityDecimal: string,
  addedPriceDecimal: string | null,
  addedQuantityDecimal: string,
): string | null {
  if (currentAverageDecimal === null || addedPriceDecimal === null) return null;
  const quantity = new ExactDecimal(currentQuantityDecimal).plus(addedQuantityDecimal);
  if (quantity.isZero()) return null;
  return canonicalDecimal(
    new ExactDecimal(currentAverageDecimal)
      .times(currentQuantityDecimal)
      .plus(new ExactDecimal(addedPriceDecimal).times(addedQuantityDecimal))
      .dividedBy(quantity),
  );
}

function assertExecution(execution: TradeStoryLedgerExecution): void {
  if (!Number.isSafeInteger(execution.sequence) || execution.sequence < 1) {
    throw new Error("trade_story_sequence_invalid");
  }
  assertJournalUtcTimestamp(execution.executedAtUtc, "tradeStoryExecutionTime");
  assertJournalTradingDate(execution.tradingDate, "tradeStoryTradingDate");
  assertCanonicalJournalDecimal(execution.quantityDecimal, "tradeStoryQuantity", { positive: true });
  if (execution.priceDecimal !== null) {
    assertCanonicalJournalDecimal(execution.priceDecimal, "tradeStoryPrice", { positive: true });
  }
}

function assertBoundary(boundary: TradeStorySessionBoundary): void {
  assertJournalUtcTimestamp(boundary.atUtc, "tradeStorySessionBoundary");
  assertJournalTradingDate(boundary.tradingDate, "tradeStorySessionBoundaryDate");
}

function sortExecutions(
  executions: readonly TradeStoryLedgerExecution[],
): readonly TradeStoryLedgerExecution[] {
  const sorted = [...executions].sort((left, right) => left.sequence - right.sequence);
  for (const [index, execution] of sorted.entries()) {
    assertExecution(execution);
    if (index > 0 && execution.sequence === sorted[index - 1]!.sequence) {
      throw new Error("trade_story_sequence_ambiguous");
    }
  }
  return Object.freeze(sorted);
}

function positionAt(
  checkpoints: readonly TradeStoryLedgerCheckpoint[],
  atUtc: string,
): TradeStoryLedgerCheckpoint | null {
  let latest: TradeStoryLedgerCheckpoint | null = null;
  for (const checkpoint of checkpoints) {
    if (checkpoint.execution.executedAtUtc >= atUtc) break;
    latest = checkpoint;
  }
  return latest;
}

/**
 * Replays canonical single-round-trip executions. It returns factual position
 * transitions only; the later narrator chooses words such as "accumulated"
 * versus "added" from those facts and the surrounding sequence.
 */
export function buildTradeStoryPositionLedger(input: Readonly<{
  executions: readonly TradeStoryLedgerExecution[];
  sessionBoundaries?: readonly TradeStorySessionBoundary[];
}>): TradeStoryLedgerResult {
  const executions = sortExecutions(input.executions);
  if (executions.length === 0) throw new Error("trade_story_executions_missing");

  let averageEntryPriceDecimal: string | null = null;
  let direction: "long" | "short" | null = null;
  let maximumPositionQuantityDecimal = "0";
  let positionDecimal = "0";
  let hasOpened = false;
  let hasScaledOut = false;
  const checkpoints: TradeStoryLedgerCheckpoint[] = [];

  for (const execution of executions) {
    const positionBeforeDecimal = positionDecimal;
    const positionBeforeQuantityDecimal = absoluteDecimal(positionBeforeDecimal);
    const averageEntryPriceBeforeDecimal = averageEntryPriceDecimal;
    const signedQuantityDecimal = execution.side === "buy"
      ? execution.quantityDecimal
      : negateDecimal(execution.quantityDecimal);
    const nextPositionDecimal = addDecimal(positionBeforeDecimal, signedQuantityDecimal);
    const nextPositionQuantityDecimal = absoluteDecimal(nextPositionDecimal);
    let transition: TradeStoryPositionTransition;
    let reductionFromPositionQuantityDecimal: string | null = null;
    let reductionQuantityDecimal: string | null = null;
    let increasePhase: TradeStoryLedgerCheckpoint["increasePhase"] = null;

    if (positionBeforeDecimal === "0") {
      if (hasOpened) {
        return Object.freeze({ checkpoints: Object.freeze(checkpoints), reason: "position_reopened", status: "unsupported" });
      }
      hasOpened = true;
      direction = execution.side === "buy" ? "long" : "short";
      averageEntryPriceDecimal = execution.priceDecimal;
      transition = "opened";
    } else if (
      compareDecimal(positionBeforeDecimal, "0") ===
      compareDecimal(signedQuantityDecimal, "0")
    ) {
      averageEntryPriceDecimal = weightedAverage(
        averageEntryPriceDecimal,
        positionBeforeQuantityDecimal,
        execution.priceDecimal,
        execution.quantityDecimal,
      );
      increasePhase = hasScaledOut ? "after_scale_out" : "initial_accumulation";
      transition = "increased";
    } else {
      const relation = compareDecimal(execution.quantityDecimal, positionBeforeQuantityDecimal);
      if (relation > 0) {
        return Object.freeze({ checkpoints: Object.freeze(checkpoints), reason: "position_flipped", status: "unsupported" });
      }
      reductionFromPositionQuantityDecimal = positionBeforeQuantityDecimal;
      reductionQuantityDecimal = execution.quantityDecimal;
      if (relation === 0) {
        averageEntryPriceDecimal = null;
        transition = "fully_exited";
      } else {
        hasScaledOut = true;
        transition = "scaled_out";
      }
    }

    positionDecimal = nextPositionDecimal;
    if (compareDecimal(nextPositionQuantityDecimal, maximumPositionQuantityDecimal) > 0) {
      maximumPositionQuantityDecimal = nextPositionQuantityDecimal;
    }
    checkpoints.push(Object.freeze({
      averageEntryPriceAfterDecimal: averageEntryPriceDecimal,
      averageEntryPriceBeforeDecimal,
      execution,
      increasePhase,
      positionAfterDecimal: positionDecimal,
      positionAfterQuantityDecimal: nextPositionQuantityDecimal,
      positionBeforeDecimal,
      positionBeforeQuantityDecimal,
      reductionFromPositionQuantityDecimal,
      reductionQuantityDecimal,
      transition,
    }));
  }

  const carryEvents: TradeStoryCarryEvent[] = [];
  for (const boundary of input.sessionBoundaries ?? []) {
    assertBoundary(boundary);
    const checkpoint = positionAt(checkpoints, boundary.atUtc);
    if (!checkpoint || checkpoint.positionAfterDecimal === "0") continue;
    carryEvents.push(Object.freeze({
      atUtc: boundary.atUtc,
      fromTradingDate: null,
      kind: "across_session",
      positionQuantityDecimal: checkpoint.positionAfterQuantityDecimal,
      session: boundary.session,
      tradingDate: boundary.tradingDate,
    }));
  }
  for (let index = 1; index < checkpoints.length; index += 1) {
    const prior = checkpoints[index - 1]!;
    const next = checkpoints[index]!;
    if (
      prior.execution.tradingDate !== next.execution.tradingDate &&
      prior.positionAfterDecimal !== "0"
    ) {
      carryEvents.push(Object.freeze({
        atUtc: next.execution.executedAtUtc,
        fromTradingDate: prior.execution.tradingDate,
        kind: "across_trading_date",
        positionQuantityDecimal: prior.positionAfterQuantityDecimal,
        session: next.execution.marketSession,
        tradingDate: next.execution.tradingDate,
      }));
    }
  }

  carryEvents.sort((left, right) => left.atUtc.localeCompare(right.atUtc));
  return Object.freeze({
    ledger: Object.freeze({
      carryEvents: Object.freeze(carryEvents),
      checkpoints: Object.freeze(checkpoints),
      direction: direction!,
      maximumPositionQuantityDecimal,
    }),
    status: "ready",
  });
}
