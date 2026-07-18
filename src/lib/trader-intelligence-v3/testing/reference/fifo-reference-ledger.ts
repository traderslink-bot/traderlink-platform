import type {
  CanonicalExecutionOrderingResult,
} from "../../domain/execution";
import {
  addReferenceDecimals,
  compareReferenceDecimals,
  formatReferenceDecimal,
  multiplyReferenceDecimals,
  parseReferenceDecimal,
  subtractReferenceDecimals,
  type ReferenceDecimal,
} from "./bigint-decimal-reference";

interface ReferenceLot {
  direction: "long" | "short";
  quantity: ReferenceDecimal;
  price: ReferenceDecimal;
}

export interface ReferenceFifoLedgerResult {
  status: "completed" | "blocked";
  blockedCode: string | null;
  endingQuantity: string | null;
  grossRealizedPnl: string | null;
  signedCharges: string | null;
  netAnalyticalPnl: string | null;
  signedCashFlow: string | null;
  openLots: readonly { direction: "long" | "short"; quantity: string; price: string }[];
  matchedQuantityByExecution: readonly string[];
  reversalEffects: readonly { closedQuantity: string; openedQuantity: string }[];
}

function zero(): ReferenceDecimal {
  return { coefficient: BigInt(0), scale: 0 };
}

function blocked(code: string): ReferenceFifoLedgerResult {
  return {
    status: "blocked",
    blockedCode: code,
    endingQuantity: null,
    grossRealizedPnl: null,
    signedCharges: null,
    netAnalyticalPnl: null,
    signedCashFlow: null,
    openLots: [],
    matchedQuantityByExecution: [],
    reversalEffects: [],
  };
}

function minimum(left: ReferenceDecimal, right: ReferenceDecimal): ReferenceDecimal {
  return compareReferenceDecimals(left, right) <= 0 ? left : right;
}

export function runReferenceFifoLedger(
  ordering: CanonicalExecutionOrderingResult,
): ReferenceFifoLedgerResult {
  if (ordering.state === "ambiguous_meaningful_order") {
    return blocked("ti_v3_reconstruction_order_ambiguous");
  }
  if (ordering.state === "conflicting_order_evidence") {
    return blocked("ti_v3_reconstruction_order_conflicting");
  }
  const executions = ordering.economicallyOrderedExecutions ?? [];
  if (executions.length === 0) {
    return {
      status: "completed",
      blockedCode: null,
      endingQuantity: "0",
      grossRealizedPnl: "0",
      signedCharges: "0",
      netAnalyticalPnl: "0",
      signedCashFlow: "0",
      openLots: [],
      matchedQuantityByExecution: [],
      reversalEffects: [],
    };
  }
  const first = executions[0];
  const lots: ReferenceLot[] = [];
  let gross = zero();
  let charges = zero();
  let cashFlow = zero();
  const matchedByExecution: string[] = [];
  const reversalEffects: { closedQuantity: string; openedQuantity: string }[] = [];

  for (const execution of executions) {
    if (execution.validation.state !== "accepted") {
      return blocked("ti_v3_reconstruction_execution_not_accepted");
    }
    if (
      execution.content.instrumentResolutionState !== "resolved" ||
      execution.content.stableInstrumentKey === null ||
      execution.content.stableInstrumentKey !== first.content.stableInstrumentKey
    ) {
      return blocked("ti_v3_reconstruction_instrument_unresolved");
    }
    if (execution.content.currency !== first.content.currency) {
      return blocked("ti_v3_reconstruction_currency_changed");
    }
    if (execution.content.correctionState !== "none") {
      return blocked("ti_v3_reconstruction_correction_unresolved");
    }
    if (execution.content.securityType !== "common_stock") {
      return blocked("ti_v3_reconstruction_security_type_unsupported");
    }
    if (execution.content.basisContinuityState === "corporate_action_unresolved") {
      return blocked("ti_v3_reconstruction_corporate_action_basis_unresolved");
    }
    if (execution.content.basisContinuityState === "symbol_change_unresolved") {
      return blocked("ti_v3_reconstruction_symbol_continuity_unresolved");
    }

    const quantity = parseReferenceDecimal(execution.content.quantity);
    const price = parseReferenceDecimal(execution.content.price);
    const existingDirection = lots[0]?.direction ?? null;
    const closesExisting =
      (execution.content.side === "sell" && existingDirection === "long") ||
      (execution.content.side === "buy" && existingDirection === "short");
    if (execution.content.brokerPositionEffectEvidence === "close" && !closesExisting) {
      return blocked("ti_v3_reconstruction_prior_inventory_required");
    }
    if (execution.content.brokerPositionEffectEvidence === "open" && closesExisting) {
      return blocked("ti_v3_reconstruction_position_effect_conflict");
    }

    for (const charge of execution.content.charges) {
      const parsedCharge = parseReferenceDecimal(charge.amount);
      charges = addReferenceDecimals(charges, parsedCharge);
      cashFlow = subtractReferenceDecimals(cashFlow, parsedCharge);
    }

    let remaining = quantity;
    let matchedTotal = zero();
    while (
      compareReferenceDecimals(remaining, zero()) > 0 &&
      lots.length > 0 &&
      closesExisting
    ) {
      const lot = lots[0];
      const matched = minimum(remaining, lot.quantity);
      const difference =
        lot.direction === "long"
          ? subtractReferenceDecimals(price, lot.price)
          : subtractReferenceDecimals(lot.price, price);
      gross = addReferenceDecimals(
        gross,
        multiplyReferenceDecimals(difference, matched),
      );
      const notional = multiplyReferenceDecimals(price, matched);
      cashFlow =
        execution.content.side === "sell"
          ? addReferenceDecimals(cashFlow, notional)
          : subtractReferenceDecimals(cashFlow, notional);
      remaining = subtractReferenceDecimals(remaining, matched);
      matchedTotal = addReferenceDecimals(matchedTotal, matched);
      lot.quantity = subtractReferenceDecimals(lot.quantity, matched);
      if (compareReferenceDecimals(lot.quantity, zero()) === 0) lots.shift();
    }
    if (
      execution.content.brokerPositionEffectEvidence === "close" &&
      compareReferenceDecimals(remaining, zero()) > 0
    ) {
      return blocked("ti_v3_reconstruction_prior_inventory_required");
    }
    matchedByExecution.push(formatReferenceDecimal(matchedTotal));
    if (compareReferenceDecimals(remaining, zero()) > 0) {
      const openedDirection = execution.content.side === "buy" ? "long" : "short";
      const notional = multiplyReferenceDecimals(price, remaining);
      cashFlow =
        execution.content.side === "sell"
          ? addReferenceDecimals(cashFlow, notional)
          : subtractReferenceDecimals(cashFlow, notional);
      lots.push({ direction: openedDirection, quantity: remaining, price });
      if (compareReferenceDecimals(matchedTotal, zero()) > 0) {
        reversalEffects.push({
          closedQuantity: formatReferenceDecimal(matchedTotal),
          openedQuantity: formatReferenceDecimal(remaining),
        });
      }
    }
  }

  let ending = zero();
  for (const lot of lots) ending = addReferenceDecimals(ending, lot.quantity);
  if (lots[0]?.direction === "short") {
    ending = { coefficient: -ending.coefficient, scale: ending.scale };
  }
  const net = subtractReferenceDecimals(gross, charges);
  if (
    compareReferenceDecimals(ending, zero()) === 0 &&
    compareReferenceDecimals(net, cashFlow) !== 0
  ) {
    return blocked("ti_v3_reconstruction_cash_flow_invariant_failed");
  }
  return {
    status: "completed",
    blockedCode: null,
    endingQuantity: formatReferenceDecimal(ending),
    grossRealizedPnl: formatReferenceDecimal(gross),
    signedCharges: formatReferenceDecimal(charges),
    netAnalyticalPnl: formatReferenceDecimal(net),
    signedCashFlow: formatReferenceDecimal(cashFlow),
    openLots: lots.map((lot) => ({
      direction: lot.direction,
      quantity: formatReferenceDecimal(lot.quantity),
      price: formatReferenceDecimal(lot.price),
    })),
    matchedQuantityByExecution: matchedByExecution,
    reversalEffects,
  };
}
