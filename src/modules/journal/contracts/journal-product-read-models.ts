import type { JournalDecisionAction } from "./journal-decision-contracts";

export type JournalImportHistoryItem = Readonly<{
  importBatchId: string;
  sourceKind: "broker_statement" | "manual_batch";
  sourceSystem: string;
  sourceDisplayLabel: string;
  currentState: "preview" | "blocked" | "accepted" | "accepted_with_decisions" | "superseded";
  statementPeriodStartDate: string | null;
  statementPeriodEndDate: string | null;
  preservedRowCount: number;
  mappedExecutionCount: number;
  unsupportedRowCount: number;
  issueCount: number;
  pendingDecisionCount: number;
  acceptedAtUtc: string | null;
}>;

export type JournalSavedStatementBroker = Readonly<{
  brokerName: string;
  savedFormatCount: number;
}>;

export type JournalDecisionExecutionEvidence = Readonly<{
  executionId: string;
  currentVersionId: string;
  sourceTimestampText: string;
  executedAtUtc: string;
  sourceTimezone: string;
  symbol: string;
  currency: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string | null;
  feesDecimal: string | null;
  feeCurrency: string | null;
  feeSignConvention: "not_reported" | "broker_reported_signed" | "cash_effect";
  currentState: "accepted" | "needs_decision" | "excluded_by_trader" | "superseded";
  sourceLabel: "Manual entry" | "Broker statement" | null;
}>;

export type JournalDecisionPositionEvidence = Readonly<{
  positionFactId: string;
  symbol: string;
  currency: string;
  factKind: "opening_balance" | "closing_balance" | "open_position" | "current_position";
  effectiveLocalDate: string;
  sourceTimezone: string;
  quantityDecimal: string;
  source: "Broker statement" | "Trader correction";
}>;

export type JournalDecisionOpenPositionConfirmation = Readonly<{
  supportedQuantityDecimal: string;
  supportedPositionFactId: string;
  contradictoryPositionFactId: string;
}>;

export type JournalDecisionStatementRowEvidence = Readonly<{
  recordOrdinal: number;
  sectionName: string | null;
  fields: readonly string[];
}>;

export type JournalDataDecisionItem = Readonly<{
  decisionId: string;
  importBatchIds: readonly string[];
  revision: number;
  state: "pending" | "resolved" | "superseded";
  issueCode: string;
  effectCode: string;
  question: string;
  impactSummary: string;
  targetKind: "source_issue" | "execution" | "position_fact" | "overlap_set" | "chain";
  instrumentRef: string | null;
  symbol: string | null;
  currency: string | null;
  sourceRowNumber: number | null;
  sourceSection: string | null;
  effectiveAtUtc: string | null;
  updatedAtUtc: string;
  resolution: Readonly<{
    action: JournalDecisionAction;
    occurredAtUtc: string;
  }> | null;
  allowedActions: readonly JournalDecisionAction[];
  executions: readonly JournalDecisionExecutionEvidence[];
  flaggedStatementRow: JournalDecisionStatementRowEvidence | null;
  positionFacts: readonly JournalDecisionPositionEvidence[];
  openPositionConfirmation?: JournalDecisionOpenPositionConfirmation | null;
  suggestedCoverage: Readonly<{
    assetClass: "stock";
    localStartDate: string;
    localEndDate: string;
    sourceTimezone: string;
  }> | null;
}>;

export type JournalDataDecisionsReadModel = Readonly<{
  pending: readonly JournalDataDecisionItem[];
  resolved: readonly JournalDataDecisionItem[];
}>;

export type JournalDataDecisionStatementRow = Readonly<{
  recordOrdinal: number;
  sectionName: string | null;
  recordType: string | null;
  initialClassification:
    | "mapped_execution"
    | "mapped_position_fact"
    | "mapped_coverage_fact"
    | "automatic_non_execution"
    | "unsupported"
    | "needs_correction";
  fields: readonly string[];
  issues: readonly Readonly<{
    message: string;
    severity: "info" | "warning" | "error";
  }>[];
}>;

export type JournalDataDecisionStatementReadModel = Readonly<{
  importBatchId: string;
  sourceDisplayLabel: string;
  totalRowCount: number;
  rows: readonly JournalDataDecisionStatementRow[];
}>;
