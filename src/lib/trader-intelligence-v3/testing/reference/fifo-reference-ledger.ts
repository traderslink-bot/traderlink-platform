import type { CanonicalExecutionEnvelope, CanonicalExecutionOrderingResult } from "../../domain/execution";
import type { StartingInventoryContract } from "../../domain/accounting/starting-inventory";
import {
  addReferenceDecimals,
  compareReferenceDecimals,
  formatReferenceDecimal,
  multiplyReferenceDecimals,
  parseReferenceDecimal,
  subtractReferenceDecimals,
  type ReferenceDecimal,
} from "./bigint-decimal-reference";
import { divideReferenceDecimals, type ReferenceRatio } from "./rational-reference";

interface ReferenceLot {
  direction: "long" | "short";
  quantity: ReferenceDecimal;
  price: ReferenceDecimal;
  sourceExecutionDigest: string;
}

interface ReferenceRoundTripAccumulator {
  direction: "long" | "short";
  entryQuantity: ReferenceDecimal;
  exitQuantity: ReferenceDecimal;
  entryNotional: ReferenceDecimal;
  exitNotional: ReferenceDecimal;
  gross: ReferenceDecimal;
  charges: ReferenceDecimal;
  chargesByKind: Map<string, ReferenceDecimal>;
  chargeKindCoverageState: "complete" | "unknown";
  cashFlow: ReferenceDecimal;
  executionDigests: string[];
}

export interface ReferenceRoundTrip {
  direction: "long" | "short";
  entryQuantity: string;
  exitQuantity: string;
  weightedAverageEntryPrice: ReferenceRatio;
  weightedAverageExitPrice: ReferenceRatio;
  grossRealizedPnl: string;
  signedCharges: string;
  signedChargesByKind: readonly { readonly kind: string; readonly amount: string }[];
  chargeKindCoverageState: "complete" | "unknown";
  netAnalyticalPnl: string;
  signedCashFlowNetPnl: string;
  executionDigests: readonly string[];
}

export interface ReferenceFifoLedgerResult {
  status: "completed" | "blocked";
  blockedCode: string | null;
  endingQuantity: string | null;
  grossRealizedPnl: string | null;
  signedCharges: string | null;
  netAnalyticalPnl: string | null;
  signedCashFlow: string | null;
  openLots: readonly {
    direction: "long" | "short";
    quantity: string;
    price: string;
    sourceExecutionDigest: string;
  }[];
  matchedQuantityByExecution: readonly {
    executionDigest: string;
    matchedQuantity: string;
  }[];
  reversalEffects: readonly {
    sourceExecutionDigest: string;
    closedDirection: "long" | "short";
    closedQuantity: string;
    openedDirection: "long" | "short";
    openedQuantity: string;
  }[];
  flatToFlatRoundTrips: readonly ReferenceRoundTrip[];
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
    flatToFlatRoundTrips: [],
  };
}

function minimum(left: ReferenceDecimal, right: ReferenceDecimal): ReferenceDecimal {
  return compareReferenceDecimals(left, right) <= 0 ? left : right;
}

function compareReferenceOrdinal(left: string, right: string): number {
  return left.length !== right.length
    ? left.length - right.length
    : left < right
      ? -1
      : left > right
        ? 1
        : 0;
}

function validateReferenceStartingInventory(
  startingInventory: StartingInventoryContract,
  executionDigests: ReadonlySet<string>,
): string | null {
  if (startingInventory.policyVersion !== "ti_v3_starting_inventory_v2") {
    return "ti_v3_reconstruction_prior_inventory_required";
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}Z$/.test(startingInventory.asOf)) {
    return "ti_v3_reconstruction_starting_inventory_as_of_violation";
  }
  if (startingInventory.coverageState === "incomplete_prior_charges") {
    return "ti_v3_reconstruction_prior_charge_coverage_incomplete";
  }
  const lotIds = new Set<string>();
  const sourceDigests = new Set<string>();
  const ordinals = new Set<string>();
  let previous: StartingInventoryContract["priorLots"][number] | null = null;
  for (const lot of startingInventory.priorLots) {
    if (
      lot.canonicalOwnerKey !== startingInventory.ledgerIdentity.canonicalOwnerKey ||
      lot.canonicalAccountKey !== startingInventory.ledgerIdentity.canonicalAccountKey ||
      lot.stableInstrumentKey !== startingInventory.ledgerIdentity.stableInstrumentKey ||
      lot.currency !== startingInventory.ledgerIdentity.currency
    ) {
      return "ti_v3_reconstruction_instrument_unresolved";
    }
    if (lot.acquiredAt >= startingInventory.asOf) {
      return "ti_v3_reconstruction_starting_inventory_as_of_violation";
    }
    if (
      lotIds.has(lot.lotId) ||
      sourceDigests.has(lot.sourceExecutionDigest) ||
      ordinals.has(lot.fifoOrdinal)
    ) {
      return "ti_v3_reconstruction_prior_inventory_overlap";
    }
    if (executionDigests.has(lot.sourceExecutionDigest)) {
      return "ti_v3_reconstruction_prior_inventory_overlap";
    }
    if (
      previous !== null &&
      (lot.acquiredAt < previous.acquiredAt ||
        (lot.acquiredAt === previous.acquiredAt &&
          compareReferenceOrdinal(lot.fifoOrdinal, previous.fifoOrdinal) <= 0))
    ) {
      return "ti_v3_reconstruction_prior_inventory_required";
    }
    if (lot.chargeCoverageState !== "complete") {
      return "ti_v3_reconstruction_prior_charge_coverage_incomplete";
    }
    if (lot.signedCharges.some((charge) => charge.currency !== lot.currency)) {
      return "ti_v3_reconstruction_currency_changed";
    }
    lotIds.add(lot.lotId);
    sourceDigests.add(lot.sourceExecutionDigest);
    ordinals.add(lot.fifoOrdinal);
    previous = lot;
  }
  return null;
}

function addDigest(accumulator: ReferenceRoundTripAccumulator, digest: string): void {
  if (!accumulator.executionDigests.includes(digest)) {
    accumulator.executionDigests.push(digest);
  }
}

function assignChargeKinds(
  accumulator: ReferenceRoundTripAccumulator,
  execution: CanonicalExecutionEnvelope,
): void {
  for (const charge of execution.content.charges) {
    accumulator.chargesByKind.set(
      charge.kind,
      addReferenceDecimals(accumulator.chargesByKind.get(charge.kind) ?? zero(), parseReferenceDecimal(charge.amount)),
    );
  }
}

function newRoundTrip(direction: "long" | "short"): ReferenceRoundTripAccumulator {
  return {
    direction,
    entryQuantity: zero(),
    exitQuantity: zero(),
    entryNotional: zero(),
    exitNotional: zero(),
    gross: zero(),
    charges: zero(),
    chargesByKind: new Map(),
    chargeKindCoverageState: "complete",
    cashFlow: zero(),
    executionDigests: [],
  };
}

function finalizeRoundTrip(
  accumulator: ReferenceRoundTripAccumulator,
): ReferenceRoundTrip | null {
  const net = subtractReferenceDecimals(accumulator.gross, accumulator.charges);
  if (compareReferenceDecimals(net, accumulator.cashFlow) !== 0) return null;
  return {
    direction: accumulator.direction,
    entryQuantity: formatReferenceDecimal(accumulator.entryQuantity),
    exitQuantity: formatReferenceDecimal(accumulator.exitQuantity),
    weightedAverageEntryPrice: divideReferenceDecimals(
      accumulator.entryNotional,
      accumulator.entryQuantity,
    ),
    weightedAverageExitPrice: divideReferenceDecimals(
      accumulator.exitNotional,
      accumulator.exitQuantity,
    ),
    grossRealizedPnl: formatReferenceDecimal(accumulator.gross),
    signedCharges: formatReferenceDecimal(accumulator.charges),
    signedChargesByKind: [...accumulator.chargesByKind.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([kind, amount]) => ({ kind, amount: formatReferenceDecimal(amount) })),
    chargeKindCoverageState: accumulator.chargeKindCoverageState,
    netAnalyticalPnl: formatReferenceDecimal(net),
    signedCashFlowNetPnl: formatReferenceDecimal(accumulator.cashFlow),
    executionDigests: accumulator.executionDigests,
  };
}

export function runReferenceFifoLedger(
  ordering: CanonicalExecutionOrderingResult,
  startingInventory: StartingInventoryContract,
): ReferenceFifoLedgerResult {
  if (startingInventory.state === "unknown") {
    return blocked("ti_v3_reconstruction_prior_inventory_required");
  }
  if (ordering.state === "ambiguous_meaningful_order") {
    return blocked("ti_v3_reconstruction_order_ambiguous");
  }
  if (ordering.state === "conflicting_order_evidence") {
    return blocked("ti_v3_reconstruction_order_conflicting");
  }
  const executions = ordering.economicallyOrderedExecutions ?? [];
  const startingInventoryFailure = validateReferenceStartingInventory(
    startingInventory,
    new Set(executions.map((execution) => execution.canonicalContentDigest)),
  );
  if (startingInventoryFailure !== null) {
    return blocked(startingInventoryFailure);
  }

  const lots: ReferenceLot[] = startingInventory.priorLots.map((lot) => ({
    direction: lot.direction,
    quantity: parseReferenceDecimal(lot.remainingQuantity),
    price: parseReferenceDecimal(lot.price),
    sourceExecutionDigest: lot.sourceExecutionDigest,
  }));
  const matchedQuantityByExecution: {
    executionDigest: string;
    matchedQuantity: string;
  }[] = [];
  const reversalEffects: ReferenceFifoLedgerResult["reversalEffects"][number][] = [];
  const flatToFlatRoundTrips: ReferenceRoundTrip[] = [];
  let currentRoundTrip: ReferenceRoundTripAccumulator | null = null;
  let gross = zero();
  let charges = zero();
  let cashFlow = zero();

  if (startingInventory.state === "accepted_prior_lots") {
    currentRoundTrip = newRoundTrip(startingInventory.priorLots[0].direction);
    for (const priorLot of startingInventory.priorLots) {
      const quantity = parseReferenceDecimal(priorLot.remainingQuantity);
      const price = parseReferenceDecimal(priorLot.price);
      const notional = multiplyReferenceDecimals(price, quantity);
      currentRoundTrip.entryQuantity = addReferenceDecimals(
        currentRoundTrip.entryQuantity,
        quantity,
      );
      currentRoundTrip.entryNotional = addReferenceDecimals(
        currentRoundTrip.entryNotional,
        notional,
      );
      currentRoundTrip.cashFlow =
        priorLot.direction === "short"
          ? addReferenceDecimals(currentRoundTrip.cashFlow, notional)
          : subtractReferenceDecimals(currentRoundTrip.cashFlow, notional);
      let priorCharges = zero();
      for (const charge of priorLot.signedCharges) {
        priorCharges = addReferenceDecimals(
          priorCharges,
          parseReferenceDecimal(charge.amount),
        );
      }
      charges = addReferenceDecimals(charges, priorCharges);
      currentRoundTrip.charges = addReferenceDecimals(
        currentRoundTrip.charges,
        priorCharges,
      );
      if (compareReferenceDecimals(priorCharges, zero()) !== 0) {
        currentRoundTrip.chargeKindCoverageState = "unknown";
      }
      currentRoundTrip.cashFlow = subtractReferenceDecimals(
        currentRoundTrip.cashFlow,
        priorCharges,
      );
      addDigest(currentRoundTrip, priorLot.sourceExecutionDigest);
      cashFlow =
        priorLot.direction === "short"
          ? addReferenceDecimals(cashFlow, notional)
          : subtractReferenceDecimals(cashFlow, notional);
      cashFlow = subtractReferenceDecimals(cashFlow, priorCharges);
    }
  }

  for (const execution of executions) {
    if (execution.content.executedAt < startingInventory.asOf) {
      return blocked("ti_v3_reconstruction_starting_inventory_as_of_violation");
    }
    if (execution.validation.state !== "accepted") {
      return blocked("ti_v3_reconstruction_execution_not_accepted");
    }
    if (
      execution.content.instrumentResolutionState !== "resolved" ||
      execution.content.stableInstrumentKey === null ||
      execution.content.stableInstrumentKey !==
        startingInventory.ledgerIdentity.stableInstrumentKey ||
      execution.content.canonicalOwnerKey !==
        startingInventory.ledgerIdentity.canonicalOwnerKey ||
      execution.content.canonicalAccountKey !==
        startingInventory.ledgerIdentity.canonicalAccountKey
    ) {
      return blocked("ti_v3_reconstruction_instrument_unresolved");
    }
    if (execution.content.currency !== startingInventory.ledgerIdentity.currency) {
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
    if (
      execution.content.brokerPositionEffectEvidence === "close" &&
      !closesExisting
    ) {
      return blocked("ti_v3_reconstruction_prior_inventory_required");
    }
    if (
      execution.content.brokerPositionEffectEvidence === "open" &&
      closesExisting
    ) {
      return blocked("ti_v3_reconstruction_position_effect_conflict");
    }

    let executionCharges = zero();
    for (const charge of execution.content.charges) {
      executionCharges = addReferenceDecimals(
        executionCharges,
        parseReferenceDecimal(charge.amount),
      );
    }
    charges = addReferenceDecimals(charges, executionCharges);
    cashFlow = subtractReferenceDecimals(cashFlow, executionCharges);
    let chargeAssigned = false;
    if (currentRoundTrip !== null) {
      currentRoundTrip.charges = addReferenceDecimals(
        currentRoundTrip.charges,
        executionCharges,
      );
      assignChargeKinds(currentRoundTrip, execution);
      currentRoundTrip.cashFlow = subtractReferenceDecimals(
        currentRoundTrip.cashFlow,
        executionCharges,
      );
      addDigest(currentRoundTrip, execution.canonicalContentDigest);
      chargeAssigned = true;
    }

    let remaining = quantity;
    let matchedTotal = zero();
    const closedDirection = existingDirection;
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
      const realized = multiplyReferenceDecimals(difference, matched);
      const exitNotional = multiplyReferenceDecimals(price, matched);
      gross = addReferenceDecimals(gross, realized);
      cashFlow =
        execution.content.side === "sell"
          ? addReferenceDecimals(cashFlow, exitNotional)
          : subtractReferenceDecimals(cashFlow, exitNotional);
      if (currentRoundTrip === null) {
        return blocked("ti_v3_reference_round_trip_missing");
      }
      currentRoundTrip.gross = addReferenceDecimals(
        currentRoundTrip.gross,
        realized,
      );
      currentRoundTrip.exitQuantity = addReferenceDecimals(
        currentRoundTrip.exitQuantity,
        matched,
      );
      currentRoundTrip.exitNotional = addReferenceDecimals(
        currentRoundTrip.exitNotional,
        exitNotional,
      );
      currentRoundTrip.cashFlow =
        execution.content.side === "sell"
          ? addReferenceDecimals(currentRoundTrip.cashFlow, exitNotional)
          : subtractReferenceDecimals(currentRoundTrip.cashFlow, exitNotional);
      addDigest(currentRoundTrip, execution.canonicalContentDigest);
      remaining = subtractReferenceDecimals(remaining, matched);
      matchedTotal = addReferenceDecimals(matchedTotal, matched);
      lot.quantity = subtractReferenceDecimals(lot.quantity, matched);
      if (compareReferenceDecimals(lot.quantity, zero()) === 0) lots.shift();
      if (lots.length === 0) {
        const finalized = finalizeRoundTrip(currentRoundTrip);
        if (finalized === null) {
          return blocked("ti_v3_reconstruction_cash_flow_invariant_failed");
        }
        flatToFlatRoundTrips.push(finalized);
        currentRoundTrip = null;
      }
    }

    if (
      execution.content.brokerPositionEffectEvidence === "close" &&
      compareReferenceDecimals(remaining, zero()) > 0
    ) {
      return blocked("ti_v3_reconstruction_prior_inventory_required");
    }
    matchedQuantityByExecution.push({
      executionDigest: execution.canonicalContentDigest,
      matchedQuantity: formatReferenceDecimal(matchedTotal),
    });

    if (compareReferenceDecimals(remaining, zero()) > 0) {
      const openedDirection = execution.content.side === "buy" ? "long" : "short";
      if (currentRoundTrip === null) currentRoundTrip = newRoundTrip(openedDirection);
      if (!chargeAssigned) {
        currentRoundTrip.charges = addReferenceDecimals(
          currentRoundTrip.charges,
          executionCharges,
        );
        assignChargeKinds(currentRoundTrip, execution);
        currentRoundTrip.cashFlow = subtractReferenceDecimals(
          currentRoundTrip.cashFlow,
          executionCharges,
        );
      }
      const entryNotional = multiplyReferenceDecimals(price, remaining);
      currentRoundTrip.entryQuantity = addReferenceDecimals(
        currentRoundTrip.entryQuantity,
        remaining,
      );
      currentRoundTrip.entryNotional = addReferenceDecimals(
        currentRoundTrip.entryNotional,
        entryNotional,
      );
      currentRoundTrip.cashFlow =
        execution.content.side === "sell"
          ? addReferenceDecimals(currentRoundTrip.cashFlow, entryNotional)
          : subtractReferenceDecimals(currentRoundTrip.cashFlow, entryNotional);
      addDigest(currentRoundTrip, execution.canonicalContentDigest);
      cashFlow =
        execution.content.side === "sell"
          ? addReferenceDecimals(cashFlow, entryNotional)
          : subtractReferenceDecimals(cashFlow, entryNotional);
      lots.push({
        direction: openedDirection,
        quantity: remaining,
        price,
        sourceExecutionDigest: execution.canonicalContentDigest,
      });
      if (
        compareReferenceDecimals(matchedTotal, zero()) > 0 &&
        closedDirection !== null
      ) {
        reversalEffects.push({
          sourceExecutionDigest: execution.canonicalContentDigest,
          closedDirection,
          closedQuantity: formatReferenceDecimal(matchedTotal),
          openedDirection,
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
      sourceExecutionDigest: lot.sourceExecutionDigest,
    })),
    matchedQuantityByExecution,
    reversalEffects,
    flatToFlatRoundTrips,
  };
}
