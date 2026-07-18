import {
  parseCurrencyCode,
  parseExactPrice,
  parseExactQuantity,
  type CurrencyCode,
  type ExactPrice,
  type ExactQuantity,
  type ExactResult,
} from "../exact";
import {
  parseCanonicalContentDigest,
  type CanonicalExecutionDigest,
  type CanonicalSourceDocumentDigest,
} from "../identity";
import {
  verifyCanonicalExecutionEnvelope,
  type CanonicalExecutionEnvelope,
  type CanonicalSourceRowLocator,
} from "../execution/canonical-execution";

export const STARTING_INVENTORY_POLICY_VERSION =
  "ti_v3_starting_inventory_v1" as const;

export type StartingInventoryState =
  | "proven_flat"
  | "accepted_prior_lots"
  | "unknown";

export interface StartingInventoryLedgerIdentity {
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly stableInstrumentKey: string;
  readonly currency: CurrencyCode;
}

export interface AcceptedPriorLot {
  readonly lotId: string;
  readonly direction: "long" | "short";
  readonly remainingQuantity: ExactQuantity;
  readonly price: ExactPrice;
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly stableInstrumentKey: string;
  readonly currency: CurrencyCode;
  readonly sourceIdentity: string;
  readonly sourceDocumentDigest: CanonicalSourceDocumentDigest;
  readonly originalSourceRowLocator: CanonicalSourceRowLocator;
  readonly sourceExecutionDigest: CanonicalExecutionDigest;
}

export interface StartingInventoryContract {
  readonly policyVersion: typeof STARTING_INVENTORY_POLICY_VERSION;
  readonly state: StartingInventoryState;
  readonly ledgerIdentity: StartingInventoryLedgerIdentity;
  readonly priorLots: readonly AcceptedPriorLot[];
}

export type StartingInventoryFailureCode =
  | "ti_v3_starting_inventory_input_invalid"
  | "ti_v3_starting_inventory_state_invalid"
  | "ti_v3_starting_inventory_identity_invalid"
  | "ti_v3_starting_inventory_prior_lots_invalid"
  | "ti_v3_starting_inventory_prior_lot_provenance_invalid"
  | "ti_v3_starting_inventory_prior_lot_identity_mismatch";

export interface StartingInventoryFailure {
  readonly code: "ti_v3_starting_inventory_invalid";
  readonly reasonCodes: readonly StartingInventoryFailureCode[];
}

const protectedStartingInventories = new WeakSet<StartingInventoryContract>();

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function failure(
  reasonCodes: readonly StartingInventoryFailureCode[],
): ExactResult<never, StartingInventoryFailure> {
  return {
    ok: false,
    error: {
      code: "ti_v3_starting_inventory_invalid",
      reasonCodes: [...new Set(reasonCodes)].sort(),
    },
  };
}

function validKey(value: unknown, prefix: string): value is string {
  return (
    typeof value === "string" &&
    value.length <= 96 &&
    new RegExp(`^${prefix}[a-z0-9][a-z0-9_-]*$`).test(value)
  );
}

function validLocator(input: unknown): input is CanonicalSourceRowLocator {
  if (!isRecord(input) || typeof input.rowOrderPreserved !== "boolean") return false;
  if (input.kind === "row_number") {
    return (
      typeof input.value === "string" &&
      /^(?:0|[1-9][0-9]{0,37})$/.test(input.value)
    );
  }
  return (
    input.kind === "record_key" &&
    typeof input.value === "string" &&
    input.value.length > 0 &&
    input.value.length <= 128 &&
    !/[\u0000-\u001f]/.test(input.value)
  );
}

function freezeLocator(locator: CanonicalSourceRowLocator): CanonicalSourceRowLocator {
  return Object.freeze({ ...locator });
}

export function startingInventoryLedgerGroupKey(
  identity: StartingInventoryLedgerIdentity,
): string {
  return [
    identity.canonicalOwnerKey,
    identity.canonicalAccountKey,
    identity.stableInstrumentKey,
    identity.currency,
  ].join(":");
}

export function isVerifiedStartingInventoryContract(
  input: unknown,
): input is StartingInventoryContract {
  return (
    typeof input === "object" &&
    input !== null &&
    protectedStartingInventories.has(input as StartingInventoryContract)
  );
}

export function buildStartingInventoryContract(
  input: unknown,
): ExactResult<StartingInventoryContract, StartingInventoryFailure> {
  if (!isRecord(input)) {
    return failure(["ti_v3_starting_inventory_input_invalid"]);
  }
  const reasons: StartingInventoryFailureCode[] = [];
  const identity = isRecord(input.ledgerIdentity) ? input.ledgerIdentity : null;
  const currency = parseCurrencyCode(identity?.currency);
  if (
    identity === null ||
    !validKey(identity.canonicalOwnerKey, "owner_") ||
    !validKey(identity.canonicalAccountKey, "account_") ||
    !validKey(identity.stableInstrumentKey, "instrument_") ||
    !currency.ok
  ) {
    reasons.push("ti_v3_starting_inventory_identity_invalid");
  }
  const state = input.state;
  if (!(["proven_flat", "accepted_prior_lots", "unknown"] as const).includes(
    state as StartingInventoryState,
  )) {
    reasons.push("ti_v3_starting_inventory_state_invalid");
  }
  if (!Array.isArray(input.priorLots)) {
    reasons.push("ti_v3_starting_inventory_prior_lots_invalid");
  }
  if (reasons.length > 0 || identity === null || !currency.ok || !Array.isArray(input.priorLots)) {
    return failure(reasons);
  }
  if (
    (state === "accepted_prior_lots" && input.priorLots.length === 0) ||
    (state !== "accepted_prior_lots" && input.priorLots.length !== 0)
  ) {
    return failure(["ti_v3_starting_inventory_prior_lots_invalid"]);
  }

  const priorLots: AcceptedPriorLot[] = [];
  let priorDirection: "long" | "short" | null = null;
  for (const priorLotInput of input.priorLots) {
    if (!isRecord(priorLotInput)) {
      reasons.push("ti_v3_starting_inventory_prior_lots_invalid");
      continue;
    }
    const quantity = parseExactQuantity(priorLotInput.remainingQuantity);
    const price = parseExactPrice(priorLotInput.price);
    const lotCurrency = parseCurrencyCode(priorLotInput.currency);
    const executionDigest = parseCanonicalContentDigest(
      priorLotInput.sourceExecutionDigest,
    );
    const documentDigest = parseCanonicalContentDigest(
      priorLotInput.sourceDocumentDigest,
    );
    const provenanceValid =
      typeof priorLotInput.lotId === "string" &&
      /^prior_lot_[a-z0-9][a-z0-9_-]{0,95}$/.test(priorLotInput.lotId) &&
      (priorLotInput.direction === "long" || priorLotInput.direction === "short") &&
      quantity.ok &&
      quantity.value !== "0" &&
      price.ok &&
      typeof priorLotInput.sourceIdentity === "string" &&
      /^source_[a-z0-9][a-z0-9_-]*$/.test(priorLotInput.sourceIdentity) &&
      validLocator(priorLotInput.originalSourceRowLocator) &&
      executionDigest.ok &&
      typeof priorLotInput.sourceExecutionDigest === "string" &&
      priorLotInput.sourceExecutionDigest.startsWith("ti_v3:canonical_execution:") &&
      documentDigest.ok &&
      typeof priorLotInput.sourceDocumentDigest === "string" &&
      priorLotInput.sourceDocumentDigest.startsWith(
        "ti_v3:canonical_source_document:",
      );
    if (!provenanceValid || !lotCurrency.ok) {
      reasons.push("ti_v3_starting_inventory_prior_lot_provenance_invalid");
      continue;
    }
    const identityMatches =
      priorLotInput.canonicalOwnerKey === identity.canonicalOwnerKey &&
      priorLotInput.canonicalAccountKey === identity.canonicalAccountKey &&
      priorLotInput.stableInstrumentKey === identity.stableInstrumentKey &&
      lotCurrency.value === currency.value;
    if (!identityMatches) {
      reasons.push("ti_v3_starting_inventory_prior_lot_identity_mismatch");
      continue;
    }
    if (priorDirection !== null && priorDirection !== priorLotInput.direction) {
      reasons.push("ti_v3_starting_inventory_prior_lots_invalid");
      continue;
    }
    priorDirection = priorLotInput.direction as "long" | "short";
    priorLots.push(
      Object.freeze({
        lotId: priorLotInput.lotId as string,
        direction: priorLotInput.direction as "long" | "short",
        remainingQuantity: quantity.value,
        price: price.value,
        canonicalOwnerKey: priorLotInput.canonicalOwnerKey as string,
        canonicalAccountKey: priorLotInput.canonicalAccountKey as string,
        stableInstrumentKey: priorLotInput.stableInstrumentKey as string,
        currency: lotCurrency.value,
        sourceIdentity: priorLotInput.sourceIdentity as string,
        sourceDocumentDigest:
          documentDigest.value as CanonicalSourceDocumentDigest,
        originalSourceRowLocator: freezeLocator(
          priorLotInput.originalSourceRowLocator as CanonicalSourceRowLocator,
        ),
        sourceExecutionDigest: executionDigest.value as CanonicalExecutionDigest,
      }),
    );
  }
  if (reasons.length > 0) return failure(reasons);

  const ledgerIdentity: StartingInventoryLedgerIdentity = Object.freeze({
    canonicalOwnerKey: identity.canonicalOwnerKey as string,
    canonicalAccountKey: identity.canonicalAccountKey as string,
    stableInstrumentKey: identity.stableInstrumentKey as string,
    currency: currency.value,
  });
  const contract: StartingInventoryContract = Object.freeze({
    policyVersion: STARTING_INVENTORY_POLICY_VERSION,
    state: state as StartingInventoryState,
    ledgerIdentity,
    priorLots: Object.freeze(priorLots),
  });
  protectedStartingInventories.add(contract);
  return { ok: true, value: contract };
}

export function buildStartingInventoryForExecution(
  execution: CanonicalExecutionEnvelope,
  state: "proven_flat" | "unknown",
): ExactResult<StartingInventoryContract, StartingInventoryFailure> {
  const verified = verifyCanonicalExecutionEnvelope(execution);
  if (!verified.ok || verified.value.content.stableInstrumentKey === null) {
    return failure(["ti_v3_starting_inventory_identity_invalid"]);
  }
  return buildStartingInventoryContract({
    state,
    ledgerIdentity: {
      canonicalOwnerKey: verified.value.content.canonicalOwnerKey,
      canonicalAccountKey: verified.value.content.canonicalAccountKey,
      stableInstrumentKey: verified.value.content.stableInstrumentKey,
      currency: verified.value.content.currency,
    },
    priorLots: [],
  });
}
