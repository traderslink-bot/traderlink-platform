export type JournalExecutionState =
  | "accepted"
  | "needs_decision"
  | "excluded_by_trader"
  | "superseded";

export type JournalExecutionFacts = Readonly<{
  instrumentId: string;
  tradeCurrency: string;
  sourceTimestampText: string;
  sourceTimezone: string;
  timeParserVersion: string;
  executedAtUtc: string;
  sourceOrderKey: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string | null;
  feesDecimal: string | null;
  feeCurrency: string | null;
  feeSignConvention: "not_reported" | "broker_reported_signed" | "cash_effect";
  /** Present only for manual entry surfaces; null preserves imported evidence. */
  manualFeeInputState?: "not_entered" | "entered" | null;
  factCompleteness: "complete" | "price_missing" | "order_ambiguous";
}>;

export type JournalExecutionRecord = Readonly<{
  executionId: string;
  workspaceId: string;
  accountId: string;
  currentVersionId: string;
  currentState: JournalExecutionState;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type JournalExecutionVersionRecord = JournalExecutionFacts &
  Readonly<{
    executionVersionId: string;
    executionId: string;
    workspaceId: string;
    accountId: string;
    versionNumber: number;
    actorKind: "system" | "user";
    actorUserId: string | null;
    changeReasonCode: string;
    createdAtUtc: string;
  }>;

export type JournalExecutionAliasType =
  | "broker_fill"
  | "broker_order_fill"
  | "content_occurrence"
  | "manual_entry"
  | "legacy_reference";
