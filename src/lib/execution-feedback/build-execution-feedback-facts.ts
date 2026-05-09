import { buildPositionChangeDerivedSignals } from "../raw-trade-timeline/derived/build-position-change-derived-signals";
import { buildTimelineRelationshipSignals } from "../raw-trade-timeline/derived/build-timeline-relationship-signals";
import {
  normalizeExecutions,
  type NormalizeExecutionInput,
} from "../raw-trade-timeline/normalizers/normalize-execution";
import { normalizeRequiredSessionBucketValue } from "../raw-trade-timeline/session/normalize-session-bucket";
import { buildSessionTimeContextFromExecutions } from "../raw-trade-timeline/session/classify-session-time";
import { buildTradeStateSeries } from "../raw-trade-timeline/state/build-trade-state-series";
import type { Execution } from "../raw-trade-timeline/types/execution";
import type { SessionContextInput } from "../raw-trade-timeline/types/session-context";
import type { TradeDirection } from "../raw-trade-timeline/types/trade-timeline-input";
import type {
  ExecutionFeedbackExecutionAction,
  ExecutionFeedbackExecutionFact,
  ExecutionFeedbackFacts,
} from "./types/execution-feedback-facts";

export interface BuildExecutionFeedbackFactsArgs {
  symbol: string;
  tradeDirection: TradeDirection;
  sessionContext: SessionContextInput;
  executions: NormalizeExecutionInput[];
}

interface AverageAndRange {
  average: number | null;
  rangePctOfAverage: number | null;
}

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function sum(values: number[]): number {
  return round(values.reduce((total, value) => total + value, 0));
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return round(sum(values) / values.length);
}

function averageAndRange(values: number[]): AverageAndRange {
  const averageValue = average(values);

  if (averageValue === null || averageValue === 0 || values.length < 2) {
    return {
      average: averageValue,
      rangePctOfAverage: null,
    };
  }

  return {
    average: averageValue,
    rangePctOfAverage: round((Math.max(...values) - Math.min(...values)) / averageValue),
  };
}

function parseTimestampToMs(timestamp: string): number {
  const parsed = Date.parse(timestamp);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid execution timestamp: "${timestamp}" could not be parsed.`);
  }

  return parsed;
}

function normalizeSymbol(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();

  if (!normalized) {
    throw new Error("Execution feedback symbol cannot be empty.");
  }

  return normalized;
}

function getExecutionAction(args: {
  openedPositionFromFlat: boolean;
  closedPositionToFlat: boolean;
  positionIncreased: boolean;
  positionDecreased: boolean;
}): ExecutionFeedbackExecutionAction {
  if (args.openedPositionFromFlat) {
    return "entry";
  }

  if (args.closedPositionToFlat) {
    return "full_exit";
  }

  if (args.positionIncreased) {
    return "add";
  }

  if (args.positionDecreased) {
    return "partial_reduction";
  }

  return "unchanged";
}

function getDirectionNormalizedPriceVsPreviousAverageEntryPct(args: {
  tradeDirection: TradeDirection;
  executionPrice: number;
  previousAverageEntryPrice: number | null;
}): number | null {
  const { tradeDirection, executionPrice, previousAverageEntryPrice } = args;

  if (previousAverageEntryPrice === null || previousAverageEntryPrice <= 0) {
    return null;
  }

  const raw =
    tradeDirection === "long"
      ? (executionPrice - previousAverageEntryPrice) / previousAverageEntryPrice
      : (previousAverageEntryPrice - executionPrice) / previousAverageEntryPrice;

  return round(raw);
}

function toExecutionFact(args: {
  execution: Execution;
  tradeDirection: TradeDirection;
  previousPositionSize: number;
  currentPositionSize: number;
  positionSizeDelta: number;
  previousAverageEntryPrice: number | null;
  currentAverageEntryPrice: number | null;
  realizedPnlDelta: number;
  currentRealizedPnl: number;
  openedPositionFromFlat: boolean;
  closedPositionToFlat: boolean;
  positionIncreased: boolean;
  positionDecreased: boolean;
  sizeChangePctOfPreviousPosition: number | null;
}): ExecutionFeedbackExecutionFact {
  const directionNormalizedPriceVsPreviousAverageEntryPct =
    getDirectionNormalizedPriceVsPreviousAverageEntryPct({
      tradeDirection: args.tradeDirection,
      executionPrice: args.execution.price,
      previousAverageEntryPrice: args.previousAverageEntryPrice,
    });

  return {
    executionIndex: args.execution.executionIndex,
    timestamp: args.execution.timestamp,
    side: args.execution.side,
    shares: args.execution.shares,
    price: args.execution.price,
    orderId: args.execution.orderId,
    brokerExecutionId: args.execution.brokerExecutionId,
    source: args.execution.source,
    notes: args.execution.notes,
    action: getExecutionAction({
      openedPositionFromFlat: args.openedPositionFromFlat,
      closedPositionToFlat: args.closedPositionToFlat,
      positionIncreased: args.positionIncreased,
      positionDecreased: args.positionDecreased,
    }),
    previousPositionSize: args.previousPositionSize,
    currentPositionSize: args.currentPositionSize,
    positionSizeDelta: args.positionSizeDelta,
    previousAverageEntryPrice: args.previousAverageEntryPrice,
    currentAverageEntryPrice: args.currentAverageEntryPrice,
    realizedPnlDelta: args.realizedPnlDelta,
    currentRealizedPnl: args.currentRealizedPnl,
    sizeChangePctOfPreviousPosition: args.sizeChangePctOfPreviousPosition,
    directionNormalizedPriceVsPreviousAverageEntryPct,
    priceWasFavorableVsPreviousAverageEntry:
      directionNormalizedPriceVsPreviousAverageEntryPct === null
        ? null
        : directionNormalizedPriceVsPreviousAverageEntryPct > 0,
    priceWasAdverseVsPreviousAverageEntry:
      directionNormalizedPriceVsPreviousAverageEntryPct === null
        ? null
        : directionNormalizedPriceVsPreviousAverageEntryPct < 0,
  };
}

function getFirstExecutionWithAction(
  executions: ExecutionFeedbackExecutionFact[],
  action: ExecutionFeedbackExecutionAction,
): ExecutionFeedbackExecutionFact | null {
  return executions.find((execution) => execution.action === action) ?? null;
}

function getFirstReduction(
  executions: ExecutionFeedbackExecutionFact[],
): ExecutionFeedbackExecutionFact | null {
  return executions.find(
    (execution) =>
      execution.action === "partial_reduction" || execution.action === "full_exit",
  ) ?? null;
}

function getFirstMaxPositionExecution(
  executions: ExecutionFeedbackExecutionFact[],
  maxPositionSize: number,
): ExecutionFeedbackExecutionFact | null {
  return (
    executions.find(
      (execution) => execution.currentPositionSize === maxPositionSize,
    ) ?? null
  );
}

function countReaddsAfterReduction(
  executions: ExecutionFeedbackExecutionFact[],
): number {
  let hadPriorReduction = false;
  let count = 0;

  for (const execution of executions) {
    if (execution.action === "partial_reduction" || execution.action === "full_exit") {
      hadPriorReduction = true;
      continue;
    }

    if (execution.action === "add" && hadPriorReduction) {
      count += 1;
    }
  }

  return count;
}

function getNotional(executions: ExecutionFeedbackExecutionFact[]): number {
  return round(
    executions.reduce(
      (total, execution) => total + execution.price * execution.shares,
      0,
    ),
  );
}

export function buildExecutionFeedbackFacts(
  args: BuildExecutionFeedbackFactsArgs,
): ExecutionFeedbackFacts {
  const symbol = normalizeSymbol(args.symbol);
  const sessionBucket = normalizeRequiredSessionBucketValue(
    args.sessionContext.sessionBucket,
  );
  const sessionDate = args.sessionContext.sessionDate.trim();

  if (!sessionDate) {
    throw new Error("Execution feedback session date cannot be empty.");
  }

  const normalizedExecutions = normalizeExecutions(args.executions);

  if (normalizedExecutions.length === 0) {
    throw new Error("Execution feedback requires at least one execution.");
  }

  const tradeStateSeries = buildTradeStateSeries({
    executions: normalizedExecutions,
    tradeDirection: args.tradeDirection,
  });
  const positionSignals = buildPositionChangeDerivedSignals({
    executions: normalizedExecutions,
    tradeStateSnapshots: tradeStateSeries.snapshots,
    tradeDirection: args.tradeDirection,
  });
  const timelineSignals = buildTimelineRelationshipSignals({
    executions: normalizedExecutions,
    tradeCandles: [],
  });
  const executionFacts = positionSignals.map((signal, index) =>
    toExecutionFact({
      execution: normalizedExecutions[index],
      tradeDirection: args.tradeDirection,
      previousPositionSize: signal.previousPositionSize,
      currentPositionSize: signal.currentPositionSize,
      positionSizeDelta: signal.positionSizeDelta,
      previousAverageEntryPrice: signal.previousAverageEntryPrice,
      currentAverageEntryPrice: signal.currentAverageEntryPrice,
      realizedPnlDelta: signal.realizedPnlDelta,
      currentRealizedPnl: signal.currentRealizedPnl,
      openedPositionFromFlat: signal.openedPositionFromFlat,
      closedPositionToFlat: signal.closedPositionToFlat,
      positionIncreased: signal.positionIncreased,
      positionDecreased: signal.positionDecreased,
      sizeChangePctOfPreviousPosition: signal.sizeChangePctOfPreviousPosition,
    }),
  );
  const firstExecution = executionFacts[0];
  const lastExecution = executionFacts[executionFacts.length - 1];
  const entryExecutions = executionFacts.filter(
    (execution) => execution.action === "entry" || execution.action === "add",
  );
  const addExecutions = executionFacts.filter(
    (execution) => execution.action === "add",
  );
  const reductionExecutions = executionFacts.filter(
    (execution) =>
      execution.action === "partial_reduction" || execution.action === "full_exit",
  );
  const partialReductionExecutions = executionFacts.filter(
    (execution) => execution.action === "partial_reduction",
  );
  const fullExitExecutions = executionFacts.filter(
    (execution) => execution.action === "full_exit",
  );
  const firstEntry = getFirstExecutionWithAction(executionFacts, "entry");
  const firstReduction = getFirstReduction(executionFacts);
  const maxPositionSize = Math.max(
    ...executionFacts.map((execution) => execution.currentPositionSize),
  );
  const firstMaxPositionExecution = getFirstMaxPositionExecution(
    executionFacts,
    maxPositionSize,
  );
  const increaseShares = entryExecutions.map((execution) => execution.shares);
  const reductionShares = reductionExecutions.map((execution) => execution.shares);
  const addShares = addExecutions.map((execution) => execution.shares);
  const increaseSizeStats = averageAndRange(increaseShares);
  const reductionSizeStats = averageAndRange(reductionShares);
  const totalEntryNotional = getNotional(entryExecutions);
  const totalReductionNotional = getNotional(reductionExecutions);
  const adversePriceAdds = addExecutions.filter(
    (execution) => execution.priceWasAdverseVsPreviousAverageEntry,
  );
  const favorablePriceAdds = addExecutions.filter(
    (execution) => execution.priceWasFavorableVsPreviousAverageEntry,
  );
  const flatPriceAdds = addExecutions.filter(
    (execution) =>
      execution.directionNormalizedPriceVsPreviousAverageEntryPct === 0,
  );
  const profitableReductions = reductionExecutions.filter(
    (execution) => execution.priceWasFavorableVsPreviousAverageEntry,
  );
  const losingReductions = reductionExecutions.filter(
    (execution) => execution.priceWasAdverseVsPreviousAverageEntry,
  );
  const flatReductions = reductionExecutions.filter(
    (execution) =>
      execution.directionNormalizedPriceVsPreviousAverageEntryPct === 0,
  );
  const durationMs = round(
    parseTimestampToMs(lastExecution.timestamp) -
      parseTimestampToMs(firstExecution.timestamp),
  );

  if (!firstEntry) {
    throw new Error("Execution feedback could not identify an opening execution.");
  }

  const sessionTimeContext = buildSessionTimeContextFromExecutions(
    normalizedExecutions,
  );
  const entrySessionBucket =
    sessionTimeContext.entrySessionBucket ?? sessionBucket;
  const entrySessionDateEt = sessionTimeContext.entrySessionDateEt ?? sessionDate;
  const entryHourLabelEt = sessionTimeContext.entryHourLabelEt ?? "";

  return {
    contractVersion: "execution_feedback_facts_v1",
    dataSource: "executions_only",
    symbol,
    tradeDirection: args.tradeDirection,
    sessionDate: sessionTimeContext.sessionDate || sessionDate,
    sessionBucket: normalizeRequiredSessionBucketValue(
      sessionTimeContext.sessionBucket || sessionBucket,
    ),
    entrySessionBucket,
    entrySessionDateEt,
    entryTimeEt: sessionTimeContext.entryTimeEt ?? "",
    entryHourEt: sessionTimeContext.entryHourEt ?? null,
    entryHourLabelEt,
    sessionExposure: sessionTimeContext.sessionExposure ?? [],
    heldSessionBuckets: sessionTimeContext.heldSessionBuckets ?? [],
    heldHourBucketsEt: sessionTimeContext.heldHourBucketsEt ?? [],
    heldPremarketIntoOpen:
      sessionTimeContext.heldPremarketIntoOpen ?? false,
    heldOpenIntoMidday: sessionTimeContext.heldOpenIntoMidday ?? false,
    heldMiddayIntoPostmarket:
      sessionTimeContext.heldMiddayIntoPostmarket ?? false,
    heldPostmarketIntoOvernight:
      sessionTimeContext.heldPostmarketIntoOvernight ?? false,
    heldOvernight: sessionTimeContext.heldOvernight ?? false,
    executions: executionFacts,
    lifecycle: {
      executionCount: executionFacts.length,
      firstExecutionTimestamp: firstExecution.timestamp,
      lastExecutionTimestamp: lastExecution.timestamp,
      durationMs,
      durationSeconds: round(durationMs / 1000),
      durationMinutes: round(durationMs / 60000),
      openedFromFlat: executionFacts.some(
        (execution) => execution.action === "entry",
      ),
      closedToFlat: fullExitExecutions.length > 0,
      isOpenPosition: lastExecution.currentPositionSize > 0,
      finalPositionSize: lastExecution.currentPositionSize,
      maxPositionSize,
      initialEntrySize: firstEntry.shares,
      initialEntryPrice: firstEntry.price,
      finalExecutionPrice: lastExecution.price,
      positionIncreaseCount: entryExecutions.length,
      positionDecreaseCount: reductionExecutions.length,
      positionUnchangedCount: executionFacts.filter(
        (execution) => execution.action === "unchanged",
      ).length,
      addCountAfterInitialEntry: addExecutions.length,
      reductionCount: reductionExecutions.length,
      partialReductionCount: partialReductionExecutions.length,
      fullExitCount: fullExitExecutions.length,
      readdAfterReductionCount: countReaddsAfterReduction(executionFacts),
    },
    sizing: {
      totalPositionIncreaseShares: sum(increaseShares),
      totalPositionReductionShares: sum(reductionShares),
      largestPositionIncreaseShares:
        increaseShares.length > 0 ? Math.max(...increaseShares) : 0,
      largestReductionShares:
        reductionShares.length > 0 ? Math.max(...reductionShares) : 0,
      averagePositionIncreaseShares: increaseSizeStats.average,
      averageReductionShares: reductionSizeStats.average,
      largestAddShares: addShares.length > 0 ? Math.max(...addShares) : null,
      averageAddShares: average(addShares),
      sizeExpansionRatioFromInitialToMax:
        firstEntry.shares > 0 ? round(maxPositionSize / firstEntry.shares) : null,
      largestAddPctOfMaxPosition:
        addShares.length > 0 && maxPositionSize > 0
          ? round(Math.max(...addShares) / maxPositionSize)
          : null,
      increaseShareSizeRangePctOfAverage: increaseSizeStats.rangePctOfAverage,
      reductionShareSizeRangePctOfAverage: reductionSizeStats.rangePctOfAverage,
    },
    sequencing: {
      firstActionSide: firstExecution.side,
      firstReductionExecutionIndex: firstReduction?.executionIndex ?? null,
      firstReductionTimestamp: firstReduction?.timestamp ?? null,
      secondsFromEntryToFirstReduction:
        firstReduction !== null
          ? round(
              (parseTimestampToMs(firstReduction.timestamp) -
                parseTimestampToMs(firstEntry.timestamp)) /
                1000,
            )
          : null,
      addsBeforeFirstReductionCount: addExecutions.filter(
        (execution) =>
          firstReduction === null ||
          execution.executionIndex < firstReduction.executionIndex,
      ).length,
      addsAfterFirstReductionCount: addExecutions.filter(
        (execution) =>
          firstReduction !== null &&
          execution.executionIndex > firstReduction.executionIndex,
      ).length,
      reductionsAfterMaxSizeCount: reductionExecutions.filter(
        (execution) =>
          firstMaxPositionExecution !== null &&
          execution.executionIndex > firstMaxPositionExecution.executionIndex,
      ).length,
      executionGapCount: timelineSignals.executionGapCount,
      averageTimeBetweenExecutionsSeconds:
        timelineSignals.averageTimeBetweenExecutionsSeconds,
      minTimeBetweenExecutionsSeconds:
        timelineSignals.minimumTimeBetweenExecutionsMs !== null
          ? round(timelineSignals.minimumTimeBetweenExecutionsMs / 1000)
          : null,
      maxTimeBetweenExecutionsSeconds:
        timelineSignals.maximumTimeBetweenExecutionsMs !== null
          ? round(timelineSignals.maximumTimeBetweenExecutionsMs / 1000)
          : null,
      executionsPerMinute: timelineSignals.executionsPerMinute,
      rapidFireGapCount: timelineSignals.executionGapSignals.filter(
        (gap) => gap.timeBetweenExecutionsSeconds <= 10,
      ).length,
    },
    price: {
      averageEntryExecutionPrice:
        entryExecutions.length > 0 && sum(increaseShares) > 0
          ? round(totalEntryNotional / sum(increaseShares))
          : null,
      averageReductionExecutionPrice:
        reductionExecutions.length > 0 && sum(reductionShares) > 0
          ? round(totalReductionNotional / sum(reductionShares))
          : null,
      averageEntryPriceAtMaxSize:
        firstMaxPositionExecution?.currentAverageEntryPrice ?? null,
      finalAverageEntryPriceIfOpen: lastExecution.currentAverageEntryPrice,
      grossRealizedPnl: lastExecution.currentRealizedPnl,
      grossRealizedPnlPctOfEntryNotional:
        totalEntryNotional > 0
          ? round(lastExecution.currentRealizedPnl / totalEntryNotional)
          : null,
      commissionsAndFeesIncluded: false,
      totalEntryNotional,
      totalReductionNotional,
    },
    risk: {
      adversePriceAddCount: adversePriceAdds.length,
      favorablePriceAddCount: favorablePriceAdds.length,
      flatPriceAddCount: flatPriceAdds.length,
      adversePriceAddShares: sum(
        adversePriceAdds.map((execution) => execution.shares),
      ),
      largestAdversePriceAddShares:
        adversePriceAdds.length > 0
          ? Math.max(...adversePriceAdds.map((execution) => execution.shares))
          : null,
      adversePriceAddExecutionIndexes: adversePriceAdds.map(
        (execution) => execution.executionIndex,
      ),
      profitableReductionCount: profitableReductions.length,
      losingReductionCount: losingReductions.length,
      flatReductionCount: flatReductions.length,
      firstReductionShares: firstReduction?.shares ?? null,
      firstReductionPctOfPreviousPosition:
        firstReduction?.sizeChangePctOfPreviousPosition ?? null,
      firstReductionRealizedPnl: firstReduction?.realizedPnlDelta ?? null,
      firstReductionWasProfitable:
        firstReduction?.priceWasFavorableVsPreviousAverageEntry ?? null,
      openPositionShares: lastExecution.currentPositionSize,
    },
  };
}
