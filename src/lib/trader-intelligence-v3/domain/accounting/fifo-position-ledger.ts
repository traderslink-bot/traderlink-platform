import {
  addExactDecimals,
  compareExactDecimals,
  createExactRatio,
  decimalToExactRatio,
  multiplyExactDecimals,
  parseExactMoneyAmount,
  parseExactQuantity,
  parseExactSignedQuantity,
  subtractExactDecimals,
  type CanonicalDecimal,
  type ExactMoneyAmount,
  type ExactQuantity,
  type ExactRatio,
  type ExactSignedQuantity,
} from "../exact";
import type {
  CanonicalExecutionEnvelope,
  CanonicalExecutionOrderingResult,
} from "../execution";
import {
  executionLedgerGroupKey,
  isCompleteExecutionRelationshipResolution,
  type CompleteExecutionRelationshipResolution,
} from "../execution";
import type { CanonicalExecutionDigest } from "../identity";
import {
  FIFO_ANALYTICAL_PNL_POLICY_VERSION,
  type AnalyticalLedgerResult,
  type AnalyticalPnlReconstructionResult,
  type FifoOpenLot,
  type ExecutionMatchedQuantity,
  type FlatToFlatRoundTrip,
  type InventoryDirection,
  type ReconstructionBlockedCode,
  type ReversalEffect,
} from "./reconstruction-result";
import {
  isVerifiedStartingInventoryContract,
  startingInventoryLedgerGroupKey,
  type StartingInventoryContract,
} from "./starting-inventory";

const MONEY_BOUNDS = Object.freeze({
  maximumSignificantDigits: 48,
  maximumScale: 24,
  allowNegative: true,
  allowZero: true,
});
const QUANTITY_BOUNDS = Object.freeze({
  maximumSignificantDigits: 48,
  maximumScale: 12,
  allowNegative: false,
  allowZero: true,
});

class ExactLedgerArithmeticFailure extends Error {}

function exactMoney(value: string): ExactMoneyAmount {
  const result = parseExactMoneyAmount(value);
  if (!result.ok) throw new ExactLedgerArithmeticFailure(result.error.code);
  return result.value;
}

function exactQuantity(value: string): ExactQuantity {
  const result = parseExactQuantity(value);
  if (!result.ok) throw new ExactLedgerArithmeticFailure(result.error.code);
  return result.value;
}

function exactSignedQuantity(value: string): ExactSignedQuantity {
  const result = parseExactSignedQuantity(value);
  if (!result.ok) throw new ExactLedgerArithmeticFailure(result.error.code);
  return result.value;
}

function addMoney(left: ExactMoneyAmount, right: CanonicalDecimal): ExactMoneyAmount {
  const result = addExactDecimals(left, right, MONEY_BOUNDS);
  if (!result.ok) throw new ExactLedgerArithmeticFailure(result.error.code);
  return result.value as ExactMoneyAmount;
}

function subtractMoney(left: ExactMoneyAmount, right: CanonicalDecimal): ExactMoneyAmount {
  const result = subtractExactDecimals(left, right, MONEY_BOUNDS);
  if (!result.ok) throw new ExactLedgerArithmeticFailure(result.error.code);
  return result.value as ExactMoneyAmount;
}

function multiplyMoney(left: CanonicalDecimal, right: CanonicalDecimal): ExactMoneyAmount {
  const result = multiplyExactDecimals(left, right, MONEY_BOUNDS);
  if (!result.ok) throw new ExactLedgerArithmeticFailure(result.error.code);
  return result.value as ExactMoneyAmount;
}

function subtractQuantity(left: ExactQuantity, right: ExactQuantity): ExactQuantity {
  const result = subtractExactDecimals(left, right, QUANTITY_BOUNDS);
  if (!result.ok) throw new ExactLedgerArithmeticFailure(result.error.code);
  return result.value as ExactQuantity;
}

function addQuantity(left: ExactQuantity, right: ExactQuantity): ExactQuantity {
  const result = addExactDecimals(left, right, QUANTITY_BOUNDS);
  if (!result.ok) throw new ExactLedgerArithmeticFailure(result.error.code);
  return result.value as ExactQuantity;
}

function minimumQuantity(left: ExactQuantity, right: ExactQuantity): ExactQuantity {
  return compareExactDecimals(left, right) <= 0 ? left : right;
}

function weightedAverageRatio(
  notional: ExactMoneyAmount,
  quantity: ExactQuantity,
): ExactRatio {
  const notionalRatio = decimalToExactRatio(notional);
  const quantityRatio = decimalToExactRatio(quantity);
  if (!notionalRatio.ok || !quantityRatio.ok) {
    throw new ExactLedgerArithmeticFailure("ti_v3_ratio_invalid");
  }
  const result = createExactRatio(
    (
      BigInt(notionalRatio.value.numerator) * BigInt(quantityRatio.value.denominator)
    ).toString(),
    (
      BigInt(notionalRatio.value.denominator) * BigInt(quantityRatio.value.numerator)
    ).toString(),
  );
  if (!result.ok) throw new ExactLedgerArithmeticFailure(result.error.code);
  return result.value;
}

interface RoundTripAccumulator {
  id: string;
  direction: InventoryDirection;
  entryQuantity: ExactQuantity;
  exitQuantity: ExactQuantity;
  entryNotional: ExactMoneyAmount;
  exitNotional: ExactMoneyAmount;
  gross: ExactMoneyAmount;
  charges: ExactMoneyAmount;
  cashFlow: ExactMoneyAmount;
  executionDigests: Set<CanonicalExecutionDigest>;
}

function blocked(
  code: ReconstructionBlockedCode,
  executionDigest: CanonicalExecutionDigest | null,
  allDigests: readonly CanonicalExecutionDigest[],
): AnalyticalPnlReconstructionResult {
  return {
    status: "blocked",
    policyVersion: FIFO_ANALYTICAL_PNL_POLICY_VERSION,
    ledgers: [],
    blockedStates: [{ code, executionDigest }],
    limitations: [code],
    inputExecutionDigests: allDigests,
  };
}

function directionFromLots(lots: readonly FifoOpenLot[]): InventoryDirection | null {
  return lots[0]?.direction ?? null;
}

function signedEndingQuantity(lots: readonly FifoOpenLot[]): ExactSignedQuantity {
  let total = exactQuantity("0");
  for (const lot of lots) total = addQuantity(total, lot.remainingQuantity);
  return lots[0]?.direction === "short"
    ? exactSignedQuantity(total === "0" ? "0" : `-${total}`)
    : exactSignedQuantity(total);
}

function totalCharges(execution: CanonicalExecutionEnvelope): ExactMoneyAmount {
  let total = exactMoney("0");
  for (const charge of execution.content.charges) total = addMoney(total, charge.amount);
  return total;
}

function finalizeRoundTrip(accumulator: RoundTripAccumulator): FlatToFlatRoundTrip {
  const net = subtractMoney(accumulator.gross, accumulator.charges);
  if (net !== accumulator.cashFlow) {
    throw new ExactLedgerArithmeticFailure("ti_v3_reconstruction_cash_flow_invariant_failed");
  }
  return {
    roundTripId: accumulator.id,
    direction: accumulator.direction,
    entryQuantity: accumulator.entryQuantity,
    exitQuantity: accumulator.exitQuantity,
    weightedAverageEntryPrice: weightedAverageRatio(
      accumulator.entryNotional,
      accumulator.entryQuantity,
    ),
    weightedAverageExitPrice: weightedAverageRatio(
      accumulator.exitNotional,
      accumulator.exitQuantity,
    ),
    grossRealizedPnl: accumulator.gross,
    signedCharges: accumulator.charges,
    netAnalyticalPnl: net,
    signedCashFlowNetPnl: accumulator.cashFlow,
    executionDigests: [...accumulator.executionDigests],
  };
}

export interface FifoLedgerInput {
  readonly relationshipResolution: CompleteExecutionRelationshipResolution;
  readonly ledgerGroupKey: string;
  readonly ordering: CanonicalExecutionOrderingResult;
  readonly startingInventory: StartingInventoryContract;
}

export function runFifoPositionLedger(
  input: FifoLedgerInput,
): AnalyticalPnlReconstructionResult {
  if (!isCompleteExecutionRelationshipResolution(input.relationshipResolution)) {
    return blocked("ti_v3_reconstruction_relationship_coverage_incomplete", null, []);
  }
  if (
    !isVerifiedStartingInventoryContract(input.startingInventory) ||
    startingInventoryLedgerGroupKey(input.startingInventory.ledgerIdentity) !==
      input.ledgerGroupKey ||
    input.startingInventory.state === "unknown"
  ) {
    return blocked("ti_v3_reconstruction_prior_inventory_required", null, []);
  }
  const relationshipBlock = input.relationshipResolution.groupBlocks.find(
    (block) => block.groupKey === input.ledgerGroupKey,
  );
  if (relationshipBlock !== undefined) {
    return blocked(
      relationshipBlock.code,
      relationshipBlock.executionDigests[0] ?? null,
      relationshipBlock.executionDigests,
    );
  }
  const resolvedGroupExecutions = input.relationshipResolution.retainedExecutions.filter(
    (execution) => executionLedgerGroupKey(execution) === input.ledgerGroupKey,
  );
  const allExecutions = input.ordering.storageOrderedExecutions;
  const allDigests = allExecutions.map((execution) => execution.canonicalContentDigest);
  const resolvedDigests = resolvedGroupExecutions
    .map((execution) => execution.canonicalContentDigest)
    .sort();
  if (
    allDigests.length !== resolvedDigests.length ||
    [...allDigests].sort().some((digest, index) => digest !== resolvedDigests[index])
  ) {
    return blocked(
      "ti_v3_reconstruction_relationship_coverage_incomplete",
      null,
      allDigests,
    );
  }
  if (input.ordering.state === "ambiguous_meaningful_order") {
    return blocked("ti_v3_reconstruction_order_ambiguous", null, allDigests);
  }
  if (input.ordering.state === "conflicting_order_evidence") {
    return blocked("ti_v3_reconstruction_order_conflicting", null, allDigests);
  }
  const executions = input.ordering.economicallyOrderedExecutions ?? [];
  if (executions.length === 0) {
    return {
      status: "completed",
      policyVersion: FIFO_ANALYTICAL_PNL_POLICY_VERSION,
      ledgers: [],
      blockedStates: [],
      limitations: [],
      inputExecutionDigests: [],
    };
  }
  const first = executions[0];
  if (first.content.stableInstrumentKey === null) {
    return blocked(
      "ti_v3_reconstruction_instrument_unresolved",
      first.canonicalContentDigest,
      allDigests,
    );
  }

  try {
    const lots: FifoOpenLot[] = input.startingInventory.priorLots.map((lot) => ({
      lotId: lot.lotId,
      direction: lot.direction,
      remainingQuantity: lot.remainingQuantity,
      price: lot.price,
      sourceExecutionDigest: lot.sourceExecutionDigest,
      sourceProvenance: {
        kind: "accepted_prior_lot",
        sourceIdentity: lot.sourceIdentity,
        sourceDocumentDigest: lot.sourceDocumentDigest,
        originalSourceRowLocator: lot.originalSourceRowLocator,
      },
    }));
    const roundTrips: FlatToFlatRoundTrip[] = [];
    const reversalEffects: ReversalEffect[] = [];
    const matchedQuantities: ExecutionMatchedQuantity[] = [];
    let currentRoundTrip: RoundTripAccumulator | null = null;
    let gross = exactMoney("0");
    let charges = exactMoney("0");
    let cashFlow = exactMoney("0");
    let roundTripSequence = 0;

    const newRoundTrip = (
      direction: InventoryDirection,
      sourceExecutionDigest: CanonicalExecutionDigest,
    ): RoundTripAccumulator => {
      roundTripSequence += 1;
      return {
        id: `ti_v3_round_trip:${sourceExecutionDigest}:${roundTripSequence}`,
        direction,
        entryQuantity: exactQuantity("0"),
        exitQuantity: exactQuantity("0"),
        entryNotional: exactMoney("0"),
        exitNotional: exactMoney("0"),
        gross: exactMoney("0"),
        charges: exactMoney("0"),
        cashFlow: exactMoney("0"),
        executionDigests: new Set(),
      };
    };

    if (input.startingInventory.state === "accepted_prior_lots") {
      const firstPriorLot = input.startingInventory.priorLots[0];
      currentRoundTrip = newRoundTrip(
        firstPriorLot.direction,
        firstPriorLot.sourceExecutionDigest,
      );
      for (const priorLot of input.startingInventory.priorLots) {
        const priorNotional = multiplyMoney(
          priorLot.price,
          priorLot.remainingQuantity,
        );
        currentRoundTrip.entryQuantity = addQuantity(
          currentRoundTrip.entryQuantity,
          priorLot.remainingQuantity,
        );
        currentRoundTrip.entryNotional = addMoney(
          currentRoundTrip.entryNotional,
          priorNotional,
        );
        currentRoundTrip.cashFlow =
          priorLot.direction === "short"
            ? addMoney(currentRoundTrip.cashFlow, priorNotional)
            : subtractMoney(currentRoundTrip.cashFlow, priorNotional);
        currentRoundTrip.executionDigests.add(priorLot.sourceExecutionDigest);
        cashFlow =
          priorLot.direction === "short"
            ? addMoney(cashFlow, priorNotional)
            : subtractMoney(cashFlow, priorNotional);
      }
    }

    for (const execution of executions) {
      if (execution.validation.state !== "accepted") {
        return blocked(
          "ti_v3_reconstruction_execution_not_accepted",
          execution.canonicalContentDigest,
          allDigests,
        );
      }
      if (
        execution.content.instrumentResolutionState !== "resolved" ||
        execution.content.stableInstrumentKey === null ||
        execution.content.stableInstrumentKey !== first.content.stableInstrumentKey ||
        execution.content.canonicalOwnerKey !== first.content.canonicalOwnerKey ||
        execution.content.canonicalAccountKey !== first.content.canonicalAccountKey
      ) {
        return blocked(
          "ti_v3_reconstruction_instrument_unresolved",
          execution.canonicalContentDigest,
          allDigests,
        );
      }
      if (execution.content.currency !== first.content.currency) {
        return blocked(
          "ti_v3_reconstruction_currency_changed",
          execution.canonicalContentDigest,
          allDigests,
        );
      }
      if (execution.content.correctionState !== "none") {
        return blocked(
          "ti_v3_reconstruction_correction_unresolved",
          execution.canonicalContentDigest,
          allDigests,
        );
      }
      if (execution.content.securityType !== "common_stock") {
        return blocked(
          "ti_v3_reconstruction_security_type_unsupported",
          execution.canonicalContentDigest,
          allDigests,
        );
      }
      if (execution.content.basisContinuityState === "corporate_action_unresolved") {
        return blocked(
          "ti_v3_reconstruction_corporate_action_basis_unresolved",
          execution.canonicalContentDigest,
          allDigests,
        );
      }
      if (execution.content.basisContinuityState === "symbol_change_unresolved") {
        return blocked(
          "ti_v3_reconstruction_symbol_continuity_unresolved",
          execution.canonicalContentDigest,
          allDigests,
        );
      }

      const existingDirection = directionFromLots(lots);
      const closesExisting =
        (execution.content.side === "sell" && existingDirection === "long") ||
        (execution.content.side === "buy" && existingDirection === "short");
      if (
        execution.content.brokerPositionEffectEvidence === "close" &&
        !closesExisting
      ) {
        return blocked(
          "ti_v3_reconstruction_prior_inventory_required",
          execution.canonicalContentDigest,
          allDigests,
        );
      }
      if (
        execution.content.brokerPositionEffectEvidence === "open" &&
        closesExisting
      ) {
        return blocked(
          "ti_v3_reconstruction_position_effect_conflict",
          execution.canonicalContentDigest,
          allDigests,
        );
      }

      const executionCharges = totalCharges(execution);
      charges = addMoney(charges, executionCharges);
      let chargeAssigned = false;
      if (currentRoundTrip !== null) {
        currentRoundTrip.charges = addMoney(currentRoundTrip.charges, executionCharges);
        currentRoundTrip.cashFlow = subtractMoney(
          currentRoundTrip.cashFlow,
          executionCharges,
        );
        currentRoundTrip.executionDigests.add(execution.canonicalContentDigest);
        chargeAssigned = true;
      }
      cashFlow = subtractMoney(cashFlow, executionCharges);

      let remaining = execution.content.quantity;
      let closedQuantity = exactQuantity("0");
      const closedDirection = existingDirection;
      while (remaining !== "0" && lots.length > 0 && closesExisting) {
        const lot = lots[0];
        const matched = minimumQuantity(remaining, lot.remainingQuantity);
        const exitNotional = multiplyMoney(execution.content.price, matched);
        const priceDifference =
          lot.direction === "long"
            ? subtractExactDecimals(execution.content.price, lot.price, MONEY_BOUNDS)
            : subtractExactDecimals(lot.price, execution.content.price, MONEY_BOUNDS);
        if (!priceDifference.ok) {
          throw new ExactLedgerArithmeticFailure(priceDifference.error.code);
        }
        const realized = multiplyMoney(priceDifference.value, matched);
        gross = addMoney(gross, realized);
        if (currentRoundTrip === null) {
          throw new ExactLedgerArithmeticFailure("ti_v3_round_trip_missing");
        }
        currentRoundTrip.gross = addMoney(currentRoundTrip.gross, realized);
        currentRoundTrip.exitQuantity = addQuantity(
          currentRoundTrip.exitQuantity,
          matched,
        );
        currentRoundTrip.exitNotional = addMoney(
          currentRoundTrip.exitNotional,
          exitNotional,
        );
        currentRoundTrip.cashFlow =
          execution.content.side === "sell"
            ? addMoney(currentRoundTrip.cashFlow, exitNotional)
            : subtractMoney(currentRoundTrip.cashFlow, exitNotional);
        currentRoundTrip.executionDigests.add(execution.canonicalContentDigest);
        cashFlow =
          execution.content.side === "sell"
            ? addMoney(cashFlow, exitNotional)
            : subtractMoney(cashFlow, exitNotional);
        remaining = subtractQuantity(remaining, matched);
        closedQuantity = addQuantity(closedQuantity, matched);
        const lotRemainder = subtractQuantity(lot.remainingQuantity, matched);
        if (lotRemainder === "0") lots.shift();
        else lots[0] = { ...lot, remainingQuantity: lotRemainder };

        if (lots.length === 0) {
          roundTrips.push(finalizeRoundTrip(currentRoundTrip));
          currentRoundTrip = null;
        }
      }

      if (
        execution.content.brokerPositionEffectEvidence === "close" &&
        remaining !== "0"
      ) {
        return blocked(
          "ti_v3_reconstruction_prior_inventory_required",
          execution.canonicalContentDigest,
          allDigests,
        );
      }

      matchedQuantities.push({
        executionDigest: execution.canonicalContentDigest,
        matchedQuantity: closedQuantity,
      });

      if (remaining !== "0") {
        const openedDirection: InventoryDirection =
          execution.content.side === "buy" ? "long" : "short";
        if (currentRoundTrip === null) {
          currentRoundTrip = newRoundTrip(
            openedDirection,
            execution.canonicalContentDigest,
          );
        }
        if (!chargeAssigned) {
          currentRoundTrip.charges = addMoney(currentRoundTrip.charges, executionCharges);
          currentRoundTrip.cashFlow = subtractMoney(
            currentRoundTrip.cashFlow,
            executionCharges,
          );
          chargeAssigned = true;
        }
        const entryNotional = multiplyMoney(execution.content.price, remaining);
        currentRoundTrip.entryQuantity = addQuantity(
          currentRoundTrip.entryQuantity,
          remaining,
        );
        currentRoundTrip.entryNotional = addMoney(
          currentRoundTrip.entryNotional,
          entryNotional,
        );
        currentRoundTrip.cashFlow =
          execution.content.side === "sell"
            ? addMoney(currentRoundTrip.cashFlow, entryNotional)
            : subtractMoney(currentRoundTrip.cashFlow, entryNotional);
        currentRoundTrip.executionDigests.add(execution.canonicalContentDigest);
        cashFlow =
          execution.content.side === "sell"
            ? addMoney(cashFlow, entryNotional)
            : subtractMoney(cashFlow, entryNotional);
        lots.push({
          lotId: `ti_v3_fifo_lot:${execution.canonicalContentDigest}:${lots.length}`,
          direction: openedDirection,
          remainingQuantity: remaining,
          price: execution.content.price,
          sourceExecutionDigest: execution.canonicalContentDigest,
          sourceProvenance: {
            kind: "canonical_execution",
            sourceIdentity: execution.content.sourceIdentity,
            sourceDocumentDigest: execution.content.sourceDocumentDigest,
            originalSourceRowLocator: execution.content.originalSourceRowLocator,
          },
        });
        if (closedQuantity !== "0" && closedDirection !== null) {
          reversalEffects.push({
            sourceExecutionDigest: execution.canonicalContentDigest,
            closedDirection,
            closedQuantity,
            openedDirection,
            openedQuantity: remaining,
          });
        }
      }
    }

    const net = subtractMoney(gross, charges);
    const endingQuantity = signedEndingQuantity(lots);
    if (endingQuantity === "0" && net !== cashFlow) {
      return blocked("ti_v3_reconstruction_cash_flow_invariant_failed", null, allDigests);
    }
    const limitations = lots.length > 0 ? ["ti_v3_open_inventory_remaining"] : [];
    const ledger: AnalyticalLedgerResult = {
      ledgerKey: `${first.content.canonicalOwnerKey}:${first.content.canonicalAccountKey}:${first.content.stableInstrumentKey}:${first.content.currency}`,
      canonicalOwnerKey: first.content.canonicalOwnerKey,
      canonicalAccountKey: first.content.canonicalAccountKey,
      stableInstrumentKey: first.content.stableInstrumentKey,
      currency: first.content.currency,
      startingInventoryState: input.startingInventory.state,
      inputStartingLotIds: input.startingInventory.priorLots.map((lot) => lot.lotId),
      endingQuantity,
      openLots: lots,
      grossRealizedPnl: gross,
      signedCharges: charges,
      netAnalyticalPnl: net,
      signedCashFlow: cashFlow,
      flatToFlatRoundTrips: roundTrips,
      reversalEffects,
      matchedQuantities,
      limitations,
      inputExecutionDigests: allDigests,
    };
    return {
      status: "completed",
      policyVersion: FIFO_ANALYTICAL_PNL_POLICY_VERSION,
      ledgers: [ledger],
      blockedStates: [],
      limitations,
      inputExecutionDigests: allDigests,
    };
  } catch (error) {
    const code =
      error instanceof ExactLedgerArithmeticFailure &&
      error.message === "ti_v3_reconstruction_cash_flow_invariant_failed"
        ? "ti_v3_reconstruction_cash_flow_invariant_failed"
        : "ti_v3_reconstruction_exact_arithmetic_overflow";
    return blocked(code, null, allDigests);
  }
}
