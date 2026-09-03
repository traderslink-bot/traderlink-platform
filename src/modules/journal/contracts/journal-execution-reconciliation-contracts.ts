import type { JournalExecutionState } from "./journal-execution-contracts";

export type JournalExecutionReconciliationState =
  | "pending"
  | "same_execution"
  | "separate_executions"
  | "corrected"
  | "superseded";

export type JournalExecutionReconciliationKind =
  | "one_to_one"
  | "grouped_fills";

export type JournalExecutionReconciliationSetRecord = Readonly<{
  reconciliationSetId: string;
  overlapKeySha256: string;
  state: JournalExecutionReconciliationState;
  decisionId: string | null;
  revision: number;
  currentEventId: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type JournalExecutionReconciliationMemberRecord = Readonly<{
  memberRole: "manual_execution" | "provisional_imported_execution";
  executionId: string;
  currentVersionId: string;
  currentState: JournalExecutionState;
  instrumentId: string;
  symbol: string;
  currency: string;
  sourceTimestampText: string;
  sourceTimezone: string;
  executedAtUtc: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string | null;
  feesDecimal: string | null;
  feeCurrency: string | null;
}>;

export type JournalManualExecutionCandidate = Readonly<{
  executionId: string;
  currentVersionId: string;
  instrumentId: string;
  assetClass: string;
  normalizedSymbol: string;
  tradeCurrency: string;
  sourceTimestampText: string;
  sourceTimezone: string;
  executedAtUtc: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string | null;
  feesDecimal: string | null;
  feeCurrency: string | null;
  manualFeeInputState: "not_entered" | "entered" | null;
  accountTimezone: string;
}>;
