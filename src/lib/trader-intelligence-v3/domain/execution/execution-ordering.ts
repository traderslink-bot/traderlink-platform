import {
  timestampPrecisionIntervalNanoseconds,
  type TimestampSourcePrecision,
} from "../canonical";
import {
  verifyCanonicalExecutionEnvelope,
  type CanonicalExecutionEnvelope,
} from "./canonical-execution";

export type EconomicOrderingState =
  | "ordered"
  | "tied_but_economically_equivalent"
  | "ambiguous_meaningful_order"
  | "conflicting_order_evidence";

export interface ExecutionPairOrderingDecision {
  state: EconomicOrderingState;
  direction: "left_before_right" | "right_before_left" | "none";
  reasonCodes: readonly string[];
  evidenceUsed: readonly string[];
}

export interface CanonicalExecutionOrderingResult {
  state: EconomicOrderingState;
  storageOrderedExecutions: readonly CanonicalExecutionEnvelope[];
  economicallyOrderedExecutions: readonly CanonicalExecutionEnvelope[] | null;
  reasonCodes: readonly string[];
  evidenceUsed: readonly string[];
}

function compareString(left: string, right: string): -1 | 0 | 1 {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareOptionalInteger(left: string | null, right: string | null): -1 | 0 | 1 {
  if (left === null || right === null) return 0;
  if (!/^(?:0|[1-9][0-9]{0,37})$/.test(left) || !/^(?:0|[1-9][0-9]{0,37})$/.test(right)) {
    return 0;
  }
  return left.length < right.length
    ? -1
    : left.length > right.length
      ? 1
      : compareString(left, right);
}

function precisionRank(precision: TimestampSourcePrecision): number {
  return ["date", "minute", "second", "millisecond", "microsecond", "nanosecond", "unknown"].indexOf(
    precision,
  );
}

function compareVerifiedCanonicalStorageOrder(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): number {
  const timestamp = compareString(left.content.executedAt, right.content.executedAt);
  if (timestamp !== 0) return timestamp;
  const precision = precisionRank(left.content.timestampPrecision) - precisionRank(right.content.timestampPrecision);
  if (precision !== 0) return precision;
  const brokerIndex = compareOptionalInteger(
    left.content.brokerExecutionIndex,
    right.content.brokerExecutionIndex,
  );
  if (brokerIndex !== 0) return brokerIndex;
  const fillSequence = compareOptionalInteger(
    left.content.brokerFillSequence,
    right.content.brokerFillSequence,
  );
  if (fillSequence !== 0) return fillSequence;
  if (
    left.content.originalSourceRowLocator.rowOrderPreserved &&
    right.content.originalSourceRowLocator.rowOrderPreserved &&
    left.content.originalSourceRowLocator.kind === "row_number" &&
    right.content.originalSourceRowLocator.kind === "row_number"
  ) {
    const row = compareOptionalInteger(
      left.content.originalSourceRowLocator.value,
      right.content.originalSourceRowLocator.value,
    );
    if (row !== 0) return row;
  }
  return compareString(left.canonicalContentDigest, right.canonicalContentDigest);
}

export function compareCanonicalStorageOrder(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): number {
  const verifiedLeft = verifyCanonicalExecutionEnvelope(left);
  const verifiedRight = verifyCanonicalExecutionEnvelope(right);
  if (!verifiedLeft.ok || !verifiedRight.ok) return 0;
  return compareVerifiedCanonicalStorageOrder(verifiedLeft.value, verifiedRight.value);
}

function economicEquivalent(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): boolean {
  return (
    left.content.canonicalOwnerKey === right.content.canonicalOwnerKey &&
    left.content.canonicalAccountKey === right.content.canonicalAccountKey &&
    left.content.sourceAggregationState === right.content.sourceAggregationState &&
    left.content.instrumentResolutionState === right.content.instrumentResolutionState &&
    left.content.stableInstrumentKey === right.content.stableInstrumentKey &&
    left.content.rawBrokerSymbol === right.content.rawBrokerSymbol &&
    left.content.securityType === right.content.securityType &&
    left.content.basisContinuityState === right.content.basisContinuityState &&
    left.content.side === right.content.side &&
    left.content.brokerPositionEffectEvidence ===
      right.content.brokerPositionEffectEvidence &&
    left.content.shortSaleIndicator === right.content.shortSaleIndicator &&
    left.content.quantity === right.content.quantity &&
    left.content.price === right.content.price &&
    left.content.currency === right.content.currency &&
    left.content.brokerReportedNetCashAmount ===
      right.content.brokerReportedNetCashAmount &&
    left.content.correctionState === right.content.correctionState &&
    left.content.correctionReference === right.content.correctionReference &&
    left.validation.state === right.validation.state &&
    left.validation.reasonCodes.length === right.validation.reasonCodes.length &&
    left.validation.reasonCodes.every(
      (reason, index) => reason === right.validation.reasonCodes[index],
    ) &&
    left.content.charges.length === right.content.charges.length &&
    left.content.charges.every((charge, index) => {
      const counterpart = right.content.charges[index];
      return (
        counterpart !== undefined &&
        charge.kind === counterpart.kind &&
        charge.amount === counterpart.amount &&
        charge.currency === counterpart.currency
      );
    })
  );
}

function sameOrderingAdapterScope(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): boolean {
  return (
    left.content.canonicalOwnerKey === right.content.canonicalOwnerKey &&
    left.content.canonicalAccountKey === right.content.canonicalAccountKey &&
    left.content.brokerCode === right.content.brokerCode &&
    left.content.sourceSystem === right.content.sourceSystem &&
    left.content.sourceIdentity === right.content.sourceIdentity
  );
}

function sameSourceDocument(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): boolean {
  return (
    left.content.sourceDocumentDigest !== null &&
    left.content.sourceDocumentDigest === right.content.sourceDocumentDigest
  );
}

function compatibleDeclaredScope(
  leftScope: CanonicalExecutionEnvelope["content"]["executionIdOrderingScope"],
  rightScope: CanonicalExecutionEnvelope["content"]["executionIdOrderingScope"],
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): boolean {
  if (leftScope !== rightScope || leftScope === "not_declared") return false;
  return leftScope === "source_identity_global" || sameSourceDocument(left, right);
}

function directionFromComparison(comparison: number): "left_before_right" | "right_before_left" | null {
  return comparison < 0 ? "left_before_right" : comparison > 0 ? "right_before_left" : null;
}

function compareVerifiedMeaningfulExecutionOrder(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): ExecutionPairOrderingDecision {
  const directions = new Map<string, "left_before_right" | "right_before_left">();
  if (
    left.content.timestampPrecision !== "unknown" &&
    right.content.timestampPrecision !== "unknown"
  ) {
    const leftInterval = timestampPrecisionIntervalNanoseconds(
      left.content.executedAt,
      left.content.timestampPrecision,
    );
    const rightInterval = timestampPrecisionIntervalNanoseconds(
      right.content.executedAt,
      right.content.timestampPrecision,
    );
    if (leftInterval.endExclusive !== null && leftInterval.endExclusive <= rightInterval.start) {
      directions.set("canonical_timestamp_interval", "left_before_right");
    } else if (
      rightInterval.endExclusive !== null &&
      rightInterval.endExclusive <= leftInterval.start
    ) {
      directions.set("canonical_timestamp_interval", "right_before_left");
    }
  }

  const evidenceComparisons: readonly [string, number][] = [
    [
      "scoped_broker_execution_index",
      sameOrderingAdapterScope(left, right) &&
      compatibleDeclaredScope(
        left.content.brokerExecutionIndexOrderingScope,
        right.content.brokerExecutionIndexOrderingScope,
        left,
        right,
      )
        ? compareOptionalInteger(
            left.content.brokerExecutionIndex,
            right.content.brokerExecutionIndex,
          )
        : 0,
    ],
    [
      "scoped_broker_fill_sequence",
      sameOrderingAdapterScope(left, right) &&
      sameSourceDocument(left, right) &&
      left.content.orderId !== null &&
      left.content.orderId === right.content.orderId
        ? compareOptionalInteger(left.content.brokerFillSequence, right.content.brokerFillSequence)
        : 0,
    ],
    [
      "scoped_declared_execution_id_order",
      sameOrderingAdapterScope(left, right) &&
      left.content.executionIdOrderingSemantics === "declared" &&
      right.content.executionIdOrderingSemantics === "declared" &&
      left.content.executionIdOrderingNamespace !== null &&
      left.content.executionIdOrderingNamespace ===
        right.content.executionIdOrderingNamespace &&
      compatibleDeclaredScope(
        left.content.executionIdOrderingScope,
        right.content.executionIdOrderingScope,
        left,
        right,
      ) &&
      left.content.executionId !== null &&
      right.content.executionId !== null
        ? compareString(left.content.executionId, right.content.executionId)
        : 0,
    ],
    [
      "scoped_declared_source_row_order",
      sameOrderingAdapterScope(left, right) &&
      left.content.sourceIdentity === right.content.sourceIdentity &&
      sameSourceDocument(left, right) &&
      left.content.originalSourceRowLocator.rowOrderPreserved &&
      right.content.originalSourceRowLocator.rowOrderPreserved &&
      left.content.originalSourceRowLocator.kind === "row_number" &&
      right.content.originalSourceRowLocator.kind === "row_number"
        ? compareOptionalInteger(
            left.content.originalSourceRowLocator.value,
            right.content.originalSourceRowLocator.value,
          )
        : 0,
    ],
  ];
  for (const [evidence, comparison] of evidenceComparisons) {
    const direction = directionFromComparison(comparison);
    if (direction !== null) directions.set(evidence, direction);
  }

  const distinctDirections = new Set(directions.values());
  if (distinctDirections.size > 1) {
    return {
      state: "conflicting_order_evidence",
      direction: "none",
      reasonCodes: ["ti_v3_order_conflicting_evidence"],
      evidenceUsed: [...directions.keys()].sort(),
    };
  }
  const direction = directions.values().next().value as
    | "left_before_right"
    | "right_before_left"
    | undefined;
  if (direction !== undefined) {
    return {
      state: "ordered",
      direction,
      reasonCodes: ["ti_v3_order_supported_by_declared_evidence"],
      evidenceUsed: [...directions.keys()].sort(),
    };
  }
  if (economicEquivalent(left, right)) {
    return {
      state: "tied_but_economically_equivalent",
      direction: "none",
      reasonCodes: ["ti_v3_order_overlap_economically_equivalent"],
      evidenceUsed: ["overlapping_timestamp_precision_intervals"],
    };
  }
  return {
    state: "ambiguous_meaningful_order",
    direction: "none",
    reasonCodes: ["ti_v3_order_overlapping_precision_without_sequence"],
    evidenceUsed: ["digest_storage_tiebreak_not_economic_evidence"],
  };
}

export function compareMeaningfulExecutionOrder(
  left: CanonicalExecutionEnvelope,
  right: CanonicalExecutionEnvelope,
): ExecutionPairOrderingDecision {
  const verifiedLeft = verifyCanonicalExecutionEnvelope(left);
  const verifiedRight = verifyCanonicalExecutionEnvelope(right);
  if (!verifiedLeft.ok || !verifiedRight.ok) {
    return {
      state: "conflicting_order_evidence",
      direction: "none",
      reasonCodes: ["ti_v3_order_execution_envelope_integrity_invalid"],
      evidenceUsed: ["canonical_execution_envelope_integrity"],
    };
  }
  return compareVerifiedMeaningfulExecutionOrder(verifiedLeft.value, verifiedRight.value);
}

export function orderCanonicalExecutions(
  executions: readonly CanonicalExecutionEnvelope[],
): CanonicalExecutionOrderingResult {
  const verifiedExecutions: CanonicalExecutionEnvelope[] = [];
  for (const execution of executions) {
    const verified = verifyCanonicalExecutionEnvelope(execution);
    if (!verified.ok) {
      return {
        state: "conflicting_order_evidence",
        storageOrderedExecutions: [],
        economicallyOrderedExecutions: null,
        reasonCodes: ["ti_v3_order_execution_envelope_integrity_invalid"],
        evidenceUsed: ["canonical_execution_envelope_integrity"],
      };
    }
    verifiedExecutions.push(verified.value);
  }
  const storage = [...verifiedExecutions].sort(compareVerifiedCanonicalStorageOrder);
  const edges = new Map<CanonicalExecutionEnvelope, Set<CanonicalExecutionEnvelope>>();
  const incoming = new Map<CanonicalExecutionEnvelope, number>();
  const reasons = new Set<string>();
  const evidence = new Set<string>();
  let hasAmbiguity = false;
  let hasEquivalentTie = false;
  let hasConflict = false;
  for (const execution of storage) {
    edges.set(execution, new Set());
    incoming.set(execution, 0);
  }
  for (let leftIndex = 0; leftIndex < storage.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < storage.length; rightIndex += 1) {
      const left = storage[leftIndex];
      const right = storage[rightIndex];
      const decision = compareVerifiedMeaningfulExecutionOrder(left, right);
      decision.reasonCodes.forEach((reason) => reasons.add(reason));
      decision.evidenceUsed.forEach((item) => evidence.add(item));
      if (decision.state === "conflicting_order_evidence") hasConflict = true;
      else if (decision.state === "ambiguous_meaningful_order") hasAmbiguity = true;
      else if (decision.state === "tied_but_economically_equivalent") hasEquivalentTie = true;
      else if (decision.direction !== "none") {
        const before = decision.direction === "left_before_right" ? left : right;
        const after = decision.direction === "left_before_right" ? right : left;
        if (!edges.get(before)?.has(after)) {
          edges.get(before)?.add(after);
          incoming.set(after, (incoming.get(after) ?? 0) + 1);
        }
      }
    }
  }
  if (hasConflict) {
    return {
      state: "conflicting_order_evidence",
      storageOrderedExecutions: storage,
      economicallyOrderedExecutions: null,
      reasonCodes: [...reasons].sort(),
      evidenceUsed: [...evidence].sort(),
    };
  }
  if (hasAmbiguity) {
    return {
      state: "ambiguous_meaningful_order",
      storageOrderedExecutions: storage,
      economicallyOrderedExecutions: null,
      reasonCodes: [...reasons].sort(),
      evidenceUsed: [...evidence].sort(),
    };
  }
  const ready = storage.filter((execution) => incoming.get(execution) === 0);
  const ordered: CanonicalExecutionEnvelope[] = [];
  while (ready.length > 0) {
    ready.sort(compareVerifiedCanonicalStorageOrder);
    const next = ready.shift() as CanonicalExecutionEnvelope;
    ordered.push(next);
    for (const after of edges.get(next) ?? []) {
      const remaining = (incoming.get(after) ?? 0) - 1;
      incoming.set(after, remaining);
      if (remaining === 0) ready.push(after);
    }
  }
  if (ordered.length !== storage.length) {
    return {
      state: "conflicting_order_evidence",
      storageOrderedExecutions: storage,
      economicallyOrderedExecutions: null,
      reasonCodes: [...reasons, "ti_v3_order_evidence_cycle"].sort(),
      evidenceUsed: [...evidence].sort(),
    };
  }
  return {
    state: hasEquivalentTie ? "tied_but_economically_equivalent" : "ordered",
    storageOrderedExecutions: storage,
    economicallyOrderedExecutions: ordered,
    reasonCodes: [...reasons].sort(),
    evidenceUsed: [...evidence].sort(),
  };
}
