import type {
  CurrencyCode,
  ExactMoneyAmount,
  ExactPrice,
  ExactQuantity,
  ExactRatio,
  ExactSignedQuantity,
} from "../exact";
import type { CanonicalExecutionDigest } from "../identity";

export const FIFO_ANALYTICAL_PNL_POLICY_VERSION =
  "ti_v3_fifo_analytical_pnl_v1" as const;

export type InventoryDirection = "long" | "short";

export type ReconstructionBlockedCode =
  | "ti_v3_reconstruction_order_ambiguous"
  | "ti_v3_reconstruction_order_conflicting"
  | "ti_v3_reconstruction_execution_not_accepted"
  | "ti_v3_reconstruction_instrument_unresolved"
  | "ti_v3_reconstruction_currency_missing"
  | "ti_v3_reconstruction_currency_changed"
  | "ti_v3_reconstruction_prior_inventory_required"
  | "ti_v3_reconstruction_correction_unresolved"
  | "ti_v3_reconstruction_digest_collision"
  | "ti_v3_reconstruction_security_type_unsupported"
  | "ti_v3_reconstruction_corporate_action_basis_unresolved"
  | "ti_v3_reconstruction_symbol_continuity_unresolved"
  | "ti_v3_reconstruction_position_effect_conflict"
  | "ti_v3_reconstruction_exact_arithmetic_overflow"
  | "ti_v3_reconstruction_cash_flow_invariant_failed";

export interface ReconstructionBlockedState {
  code: ReconstructionBlockedCode;
  executionDigest: CanonicalExecutionDigest | null;
}

export interface FifoOpenLot {
  lotId: string;
  direction: InventoryDirection;
  remainingQuantity: ExactQuantity;
  price: ExactPrice;
  sourceExecutionDigest: CanonicalExecutionDigest;
}

export interface ReversalEffect {
  sourceExecutionDigest: CanonicalExecutionDigest;
  closedDirection: InventoryDirection;
  closedQuantity: ExactQuantity;
  openedDirection: InventoryDirection;
  openedQuantity: ExactQuantity;
}

export interface FlatToFlatRoundTrip {
  roundTripId: string;
  direction: InventoryDirection;
  entryQuantity: ExactQuantity;
  exitQuantity: ExactQuantity;
  weightedAverageEntryPrice: ExactRatio;
  weightedAverageExitPrice: ExactRatio;
  grossRealizedPnl: ExactMoneyAmount;
  signedCharges: ExactMoneyAmount;
  netAnalyticalPnl: ExactMoneyAmount;
  signedCashFlowNetPnl: ExactMoneyAmount;
  executionDigests: readonly CanonicalExecutionDigest[];
}

export interface AnalyticalLedgerResult {
  ledgerKey: string;
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
  stableInstrumentKey: string;
  currency: CurrencyCode;
  endingQuantity: ExactSignedQuantity;
  openLots: readonly FifoOpenLot[];
  grossRealizedPnl: ExactMoneyAmount;
  signedCharges: ExactMoneyAmount;
  netAnalyticalPnl: ExactMoneyAmount;
  signedCashFlow: ExactMoneyAmount;
  flatToFlatRoundTrips: readonly FlatToFlatRoundTrip[];
  reversalEffects: readonly ReversalEffect[];
  limitations: readonly string[];
  inputExecutionDigests: readonly CanonicalExecutionDigest[];
}

export interface AnalyticalPnlReconstructionResult {
  status: "completed" | "blocked";
  policyVersion: typeof FIFO_ANALYTICAL_PNL_POLICY_VERSION;
  ledgers: readonly AnalyticalLedgerResult[];
  blockedStates: readonly ReconstructionBlockedState[];
  limitations: readonly string[];
  inputExecutionDigests: readonly CanonicalExecutionDigest[];
}
