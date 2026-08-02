import type { JournalIntegrityCoverageSummary } from "./journal-integrity-coverage-contracts";
import type {
  JournalAllocationRole,
  JournalRoundTripProjectionState,
} from "./journal-round-trip-contracts";

export const JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION =
  "journal_analytics_fact_set_v1" as const;
export const JOURNAL_ANALYTICS_MAX_SELECTED_ACCOUNTS = 20 as const;

export type JournalAnalyticsAssetClass =
  | "stock"
  | "option"
  | "forex"
  | "future"
  | "crypto"
  | "other";

export type JournalAnalyticsClosingDateRange =
  | Readonly<{ kind: "all_available" }>
  | Readonly<{
      kind: "inclusive_closing_date";
      startDate: string;
      endDate: string;
    }>;

export type JournalAnalyticsCurrencySelection =
  | Readonly<{ kind: "all_partitions" }>
  | Readonly<{ kind: "single_currency"; currency: string }>;

export type JournalAnalyticsFactSetRequest = Readonly<{
  accountIds: readonly string[];
  closingDateRange: JournalAnalyticsClosingDateRange;
  currencySelection: JournalAnalyticsCurrencySelection;
}>;

export type JournalAnalyticsAccountFact = Readonly<{
  accountId: string;
  baseCurrency: string;
  tradingTimezone: string;
  earliestAvailableLocalDate: string | null;
  latestAvailableLocalDate: string | null;
  coverage: JournalIntegrityCoverageSummary;
}>;

export type JournalAnalyticsFeePolicyCandidate = Readonly<{
  sourceSystem: string;
  adapterId: string;
  adapterVersion: string;
  provenanceKind: "broker" | "manual" | "correction" | "overlap_match";
}>;

export type JournalAnalyticsAllocationFact = Readonly<{
  allocationId: string;
  allocationSequence: number;
  allocationRole: JournalAllocationRole;
  executionId: string;
  executionVersionId: string;
  executionState: "accepted" | "needs_decision";
  executedAtUtc: string;
  sourceOrderKey: string;
  side: "buy" | "sell";
  allocatedQuantityDecimal: string;
  executionQuantityDecimal: string;
  priceDecimal: string | null;
  feesDecimal: string | null;
  feeCurrency: string | null;
  feeSignConvention:
    | "not_reported"
    | "broker_reported_signed"
    | "cash_effect";
  factCompleteness: "complete" | "price_missing" | "order_ambiguous";
  provenanceKinds: readonly (
    | "broker"
    | "manual"
    | "correction"
    | "overlap_match"
  )[];
  feePolicyCandidates: readonly JournalAnalyticsFeePolicyCandidate[];
}>;

export type JournalAnalyticsRebuildFact = Readonly<{
  rebuildId: string;
  chainKeySha256: string;
  algorithmVersion: string;
  orderedInputSha256: string;
  outputSha256: string;
  coverageState: "complete" | "partial" | "unavailable";
  readyClosedCount: number;
  legitimateOpenCount: number;
  needsDecisionCount: number;
  excludedCount: number;
  completedAtUtc: string;
}>;

export type JournalAnalyticsRoundTripFact = Readonly<{
  roundTripId: string;
  roundTripVersionId: string;
  versionNumber: number;
  accountId: string;
  instrumentId: string;
  displayedSymbol: string;
  assetClass: JournalAnalyticsAssetClass;
  tradeCurrency: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string | null;
  finalPositionDecimal: string;
  projectionState: JournalRoundTripProjectionState;
  coverageReasonCode: string | null;
  projectionFingerprintSha256: string;
  rebuild: JournalAnalyticsRebuildFact;
  allocations: readonly JournalAnalyticsAllocationFact[];
  pendingDecisionIds: readonly string[];
  pendingDecisionReasonCodes: readonly string[];
}>;

export type JournalAnalyticsPendingDecisionFact = Readonly<{
  decisionId: string;
  accountId: string;
  issueCode: string;
  effectCode: string;
  revision: number;
  targetKind:
    | "source_issue"
    | "execution"
    | "position_fact"
    | "overlap_set"
    | "chain";
  chainKeySha256: string | null;
  executionId: string | null;
  instrumentId: string | null;
  tradeCurrency: string | null;
  updatedAtUtc: string;
}>;

export type JournalAnalyticsFactSet = Readonly<{
  contractVersion: typeof JOURNAL_ANALYTICS_FACT_SET_CONTRACT_VERSION;
  workspaceId: string;
  requestedAccountIds: readonly string[];
  requestedClosingDateRange: JournalAnalyticsClosingDateRange;
  requestedCurrencySelection: JournalAnalyticsCurrencySelection;
  generatedAtUtc: string;
  sourceRevisionSha256: string;
  earliestAvailableLocalDate: string | null;
  latestAvailableLocalDate: string | null;
  accounts: readonly JournalAnalyticsAccountFact[];
  roundTrips: readonly JournalAnalyticsRoundTripFact[];
  pendingDecisions: readonly JournalAnalyticsPendingDecisionFact[];
}>;
