import {
  isVerifiedAnalyticalPnlReconstructionResult,
  type AnalyticalPnlReconstructionResult,
} from "../accounting";
import type { ExactResult } from "../exact";
import {
  isCompleteExecutionRelationshipResolution,
  type CompleteExecutionRelationshipResolution,
} from "../execution";
import {
  createCanonicalContentIdentity,
  type CanonicalContentDigest,
  type CanonicalExecutionDigest,
} from "../identity";

export interface ExecutionOccurrenceEvidenceInventory {
  readonly schemaVersion: "ti_v3_execution_occurrence_evidence_inventory_v1";
  readonly inputExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly occurrenceKeys: readonly string[];
  readonly inventoryDigest: CanonicalContentDigest;
}

export interface RoundTripEvidenceInventory {
  readonly schemaVersion: "ti_v3_round_trip_evidence_inventory_v1";
  readonly inputExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly roundTripKeys: readonly string[];
  readonly inventoryDigest: CanonicalContentDigest;
}

export interface EvidenceInventoryFailure {
  readonly code:
    | "ti_v3_evidence_inventory_unverified"
    | "ti_v3_evidence_inventory_inconsistent"
    | "ti_v3_evidence_inventory_oversized";
  readonly path: string;
}

const verifiedOccurrenceInventories =
  new WeakSet<ExecutionOccurrenceEvidenceInventory>();
const verifiedRoundTripInventories = new WeakSet<RoundTripEvidenceInventory>();

function failure(
  code: EvidenceInventoryFailure["code"],
  path: string,
): ExactResult<never, EvidenceInventoryFailure> {
  return { ok: false, error: { code, path } };
}

export function buildExecutionOccurrenceEvidenceInventory(
  resolution: CompleteExecutionRelationshipResolution,
): ExactResult<ExecutionOccurrenceEvidenceInventory, EvidenceInventoryFailure> {
  if (!isCompleteExecutionRelationshipResolution(resolution)) {
    return failure("ti_v3_evidence_inventory_unverified", "$.resolution");
  }
  const occurrenceKeys = [...resolution.coverageReceipt.inputOccurrenceKeys].sort();
  if (occurrenceKeys.length > 100_000) {
    return failure("ti_v3_evidence_inventory_oversized", "$.occurrenceKeys");
  }
  const inputExecutionDigests = [
    ...new Set(resolution.coverageReceipt.inputExecutionDigests),
  ].sort();
  if (
    new Set(occurrenceKeys).size !== occurrenceKeys.length ||
    occurrenceKeys.some(
      (key) =>
        typeof key !== "string" ||
        key.length > 512 ||
        !inputExecutionDigests.some((digest) => key.startsWith(`${digest}:`)),
    )
  ) {
    return failure("ti_v3_evidence_inventory_inconsistent", "$.occurrenceKeys");
  }
  const content = {
    schemaVersion: "ti_v3_execution_occurrence_evidence_inventory_v1" as const,
    inputExecutionDigests,
    occurrenceKeys,
  };
  const identity = createCanonicalContentIdentity("evidence_inventory", "v1", content);
  if (!identity.ok) {
    return failure("ti_v3_evidence_inventory_inconsistent", identity.error.path);
  }
  const canonical = identity.value.canonicalValue as unknown as Omit<
    ExecutionOccurrenceEvidenceInventory,
    "inventoryDigest"
  >;
  const inventory = Object.freeze({
    ...canonical,
    inventoryDigest: identity.value.identifier,
  });
  verifiedOccurrenceInventories.add(inventory);
  return { ok: true, value: inventory };
}

export function verifyExecutionOccurrenceEvidenceInventory(
  input: unknown,
): ExactResult<ExecutionOccurrenceEvidenceInventory, EvidenceInventoryFailure> {
  return typeof input === "object" &&
    input !== null &&
    verifiedOccurrenceInventories.has(input as ExecutionOccurrenceEvidenceInventory)
    ? { ok: true, value: input as ExecutionOccurrenceEvidenceInventory }
    : failure("ti_v3_evidence_inventory_unverified", "$");
}

export function buildRoundTripEvidenceInventory(
  reconstruction: AnalyticalPnlReconstructionResult,
): ExactResult<RoundTripEvidenceInventory, EvidenceInventoryFailure> {
  if (!isVerifiedAnalyticalPnlReconstructionResult(reconstruction)) {
    return failure("ti_v3_evidence_inventory_unverified", "$.reconstruction");
  }
  const roundTripKeys = reconstruction.ledgers
    .flatMap((ledger) => ledger.flatToFlatRoundTrips.map((roundTrip) => roundTrip.roundTripId))
    .sort();
  if (roundTripKeys.length > 100_000) {
    return failure("ti_v3_evidence_inventory_oversized", "$.roundTripKeys");
  }
  const inputExecutionDigests = [...new Set(reconstruction.inputExecutionDigests)].sort();
  if (
    new Set(roundTripKeys).size !== roundTripKeys.length ||
    roundTripKeys.some(
      (key) =>
        typeof key !== "string" ||
        key.length > 512 ||
        !/^ti_v3_round_trip:ti_v3:canonical_execution:v1:sha256:[0-9a-f]{64}:[1-9][0-9]*$/.test(key),
    )
  ) {
    return failure("ti_v3_evidence_inventory_inconsistent", "$.roundTripKeys");
  }
  const content = {
    schemaVersion: "ti_v3_round_trip_evidence_inventory_v1" as const,
    inputExecutionDigests,
    roundTripKeys,
  };
  const identity = createCanonicalContentIdentity("evidence_inventory", "v1", content);
  if (!identity.ok) {
    return failure("ti_v3_evidence_inventory_inconsistent", identity.error.path);
  }
  const canonical = identity.value.canonicalValue as unknown as Omit<
    RoundTripEvidenceInventory,
    "inventoryDigest"
  >;
  const inventory = Object.freeze({
    ...canonical,
    inventoryDigest: identity.value.identifier,
  });
  verifiedRoundTripInventories.add(inventory);
  return { ok: true, value: inventory };
}

export function verifyRoundTripEvidenceInventory(
  input: unknown,
): ExactResult<RoundTripEvidenceInventory, EvidenceInventoryFailure> {
  return typeof input === "object" &&
    input !== null &&
    verifiedRoundTripInventories.has(input as RoundTripEvidenceInventory)
    ? { ok: true, value: input as RoundTripEvidenceInventory }
    : failure("ti_v3_evidence_inventory_unverified", "$");
}
