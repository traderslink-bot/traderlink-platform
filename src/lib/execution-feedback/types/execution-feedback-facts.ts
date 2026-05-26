import type { ExecutionSide } from "../../raw-trade-timeline/types/execution";
import type {
  SessionBucket,
  SessionExposureSegment,
} from "../../raw-trade-timeline/types/session-context";
import type { TradeDirection } from "../../raw-trade-timeline/types/trade-timeline-input";

export type ExecutionFeedbackExecutionAction =
  | "entry"
  | "add"
  | "partial_reduction"
  | "full_exit"
  | "unchanged";

export interface ExecutionFeedbackExecutionFact {
  executionIndex: number;
  timestamp: string;
  side: ExecutionSide;
  shares: number;
  price: number;
  orderId?: string;
  brokerExecutionId?: string;
  source?: string;
  notes?: string;
  action: ExecutionFeedbackExecutionAction;
  previousPositionSize: number;
  currentPositionSize: number;
  positionSizeDelta: number;
  previousAverageEntryPrice: number | null;
  currentAverageEntryPrice: number | null;
  realizedPnlDelta: number;
  currentRealizedPnl: number;
  sizeChangePctOfPreviousPosition: number | null;
  directionNormalizedPriceVsPreviousAverageEntryPct: number | null;
  priceWasFavorableVsPreviousAverageEntry: boolean | null;
  priceWasAdverseVsPreviousAverageEntry: boolean | null;
}

export interface ExecutionFeedbackLifecycleFacts {
  executionCount: number;
  firstExecutionTimestamp: string;
  lastExecutionTimestamp: string;
  durationMs: number;
  durationSeconds: number;
  durationMinutes: number;
  openedFromFlat: boolean;
  closedToFlat: boolean;
  isOpenPosition: boolean;
  finalPositionSize: number;
  maxPositionSize: number;
  initialEntrySize: number;
  initialEntryPrice: number;
  finalExecutionPrice: number;
  positionIncreaseCount: number;
  positionDecreaseCount: number;
  positionUnchangedCount: number;
  addCountAfterInitialEntry: number;
  reductionCount: number;
  partialReductionCount: number;
  fullExitCount: number;
  readdAfterReductionCount: number;
}

export interface ExecutionFeedbackSizingFacts {
  totalPositionIncreaseShares: number;
  totalPositionReductionShares: number;
  largestPositionIncreaseShares: number;
  largestReductionShares: number;
  averagePositionIncreaseShares: number | null;
  averageReductionShares: number | null;
  largestAddShares: number | null;
  averageAddShares: number | null;
  sizeExpansionRatioFromInitialToMax: number | null;
  largestAddPctOfMaxPosition: number | null;
  increaseShareSizeRangePctOfAverage: number | null;
  reductionShareSizeRangePctOfAverage: number | null;
}

export interface ExecutionFeedbackSequencingFacts {
  firstActionSide: ExecutionSide;
  firstReductionExecutionIndex: number | null;
  firstReductionTimestamp: string | null;
  secondsFromEntryToFirstReduction: number | null;
  addsBeforeFirstReductionCount: number;
  addsAfterFirstReductionCount: number;
  reductionsAfterMaxSizeCount: number;
  executionGapCount: number;
  averageTimeBetweenExecutionsSeconds: number | null;
  minTimeBetweenExecutionsSeconds: number | null;
  maxTimeBetweenExecutionsSeconds: number | null;
  executionsPerMinute: number | null;
  rapidFireGapCount: number;
}

export interface ExecutionFeedbackPriceFacts {
  averageEntryExecutionPrice: number | null;
  averageReductionExecutionPrice: number | null;
  averageEntryPriceAtMaxSize: number | null;
  finalAverageEntryPriceIfOpen: number | null;
  grossRealizedPnl: number;
  grossRealizedPnlPctOfEntryNotional: number | null;
  commissionsAndFeesIncluded: false;
  totalEntryNotional: number;
  totalReductionNotional: number;
}

export interface ExecutionFeedbackRiskFacts {
  adversePriceAddCount: number;
  favorablePriceAddCount: number;
  flatPriceAddCount: number;
  adversePriceAddShares: number;
  largestAdversePriceAddShares: number | null;
  adversePriceAddExecutionIndexes: number[];
  profitableReductionCount: number;
  losingReductionCount: number;
  flatReductionCount: number;
  firstReductionShares: number | null;
  firstReductionPctOfPreviousPosition: number | null;
  firstReductionRealizedPnl: number | null;
  firstReductionWasProfitable: boolean | null;
  openPositionShares: number;
}

export interface ExecutionFeedbackFacts {
  contractVersion: "execution_feedback_facts_v1";
  dataSource: "executions_only";
  symbol: string;
  tradeDirection: TradeDirection;
  sessionDate: string;
  sessionBucket: SessionBucket;
  entrySessionBucket: SessionBucket;
  entrySessionDateEt: string;
  entryTimeEt: string;
  entryHourEt: number | null;
  entryHourLabelEt: string;
  sessionExposure: SessionExposureSegment[];
  heldSessionBuckets: SessionBucket[];
  heldHourBucketsEt: string[];
  heldPremarketIntoOpen: boolean;
  heldOpenIntoMidday: boolean;
  heldMiddayIntoPostmarket: boolean;
  heldPostmarketIntoOvernight: boolean;
  heldOvernight: boolean;
  executions: ExecutionFeedbackExecutionFact[];
  lifecycle: ExecutionFeedbackLifecycleFacts;
  sizing: ExecutionFeedbackSizingFacts;
  sequencing: ExecutionFeedbackSequencingFacts;
  price: ExecutionFeedbackPriceFacts;
  risk: ExecutionFeedbackRiskFacts;
}
