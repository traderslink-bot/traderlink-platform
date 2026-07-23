import {
  compareUnicodeCodePoints,
  parseCanonicalUtcTimestamp,
  type CanonicalUtcTimestamp,
} from "../canonical";
import {
  parseCurrencyCode,
  parseExactCharge,
  parseExactPrice,
  parseExactQuantity,
  type CurrencyCode,
  type ExactCharge,
  type ExactPrice,
  type ExactQuantity,
  type ExactResult,
} from "../exact";
import {
  createCanonicalContentIdentity,
  parseCanonicalContentDigest,
  type CanonicalContentDigest,
  type CanonicalExecutionDigest,
  type CanonicalSourceDocumentDigest,
} from "../identity";
import {
  verifyCanonicalExecutionEnvelope,
  type CanonicalExecutionEnvelope,
  type CanonicalSourceRowLocator,
  type ExecutionEvidenceClass,
  type ExecutionSourceKind,
} from "../execution/canonical-execution";

export const STARTING_INVENTORY_POLICY_VERSION =
  "ti_v3_starting_inventory_v2" as const;

export const PRIOR_INVENTORY_BASIS_POLICY =
  "execution_price_with_explicit_charges" as const;

export type StartingInventoryState =
  | "proven_flat"
  | "accepted_prior_lots"
  | "unknown";

export type StartingInventoryCoverageState =
  | "complete"
  | "incomplete_prior_charges"
  | "unknown";

export interface StartingInventoryLedgerIdentity {
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly stableInstrumentKey: string;
  readonly currency: CurrencyCode;
}

export interface AcceptedPriorCharge {
  readonly kind: string;
  readonly amount: ExactCharge;
  readonly currency: CurrencyCode;
}

export interface AcceptedPriorLot {
  readonly lotId: string;
  readonly direction: "long" | "short";
  readonly acquiredAt: CanonicalUtcTimestamp;
  readonly fifoOrdinal: string;
  readonly remainingQuantity: ExactQuantity;
  readonly price: ExactPrice;
  readonly basisPolicy: typeof PRIOR_INVENTORY_BASIS_POLICY;
  readonly signedCharges: readonly AcceptedPriorCharge[];
  readonly chargeCoverageState: "complete" | "incomplete";
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly stableInstrumentKey: string;
  readonly currency: CurrencyCode;
  readonly sourceIdentity: string;
  readonly sourceKind: ExecutionSourceKind;
  readonly evidenceClass: ExecutionEvidenceClass;
  readonly sourceDocumentDigest: CanonicalSourceDocumentDigest;
  readonly originalSourceRowLocator: CanonicalSourceRowLocator;
  readonly sourceExecutionDigest: CanonicalExecutionDigest;
}

export interface StartingInventoryContract {
  readonly policyVersion: typeof STARTING_INVENTORY_POLICY_VERSION;
  readonly state: StartingInventoryState;
  readonly asOf: CanonicalUtcTimestamp;
  readonly coverageState: StartingInventoryCoverageState;
  readonly ledgerIdentity: StartingInventoryLedgerIdentity;
  readonly priorLots: readonly AcceptedPriorLot[];
  readonly contractDigest: CanonicalContentDigest;
}

export type StartingInventoryFailureCode =
  | "ti_v3_starting_inventory_input_invalid"
  | "ti_v3_starting_inventory_state_invalid"
  | "ti_v3_starting_inventory_as_of_invalid"
  | "ti_v3_starting_inventory_coverage_invalid"
  | "ti_v3_starting_inventory_identity_invalid"
  | "ti_v3_starting_inventory_prior_lots_invalid"
  | "ti_v3_starting_inventory_prior_lot_provenance_invalid"
  | "ti_v3_starting_inventory_prior_lot_identity_mismatch"
  | "ti_v3_starting_inventory_prior_lot_order_invalid"
  | "ti_v3_starting_inventory_prior_lot_duplicate_id"
  | "ti_v3_starting_inventory_prior_lot_duplicate_execution"
  | "ti_v3_starting_inventory_prior_charge_invalid";

const STARTING_INVENTORY_DIGEST_VERSION = "v1" as const;

export interface StartingInventoryFailure {
  readonly code: "ti_v3_starting_inventory_invalid";
  readonly reasonCodes: readonly StartingInventoryFailureCode[];
}

const protectedStartingInventories = new WeakSet<StartingInventoryContract>();
const CANONICAL_ORDINAL_PATTERN = /^(?:0|[1-9][0-9]{0,37})$/;
const SOURCE_KINDS = new Set<ExecutionSourceKind>([
  "broker_csv",
  "broker_api",
  "owner_manual",
  "paper_trade",
  "legacy_migration",
]);
const EVIDENCE_CLASSES = new Set<ExecutionEvidenceClass>([
  "broker_confirmed",
  "owner_reported",
  "hypothetical",
  "migrated_unverified",
]);

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
    return typeof input.value === "string" && CANONICAL_ORDINAL_PATTERN.test(input.value);
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

function compatibleEvidence(
  sourceKind: ExecutionSourceKind,
  evidenceClass: ExecutionEvidenceClass,
): boolean {
  if (evidenceClass === "broker_confirmed") {
    return sourceKind === "broker_csv" || sourceKind === "broker_api";
  }
  if (sourceKind === "owner_manual") {
    return evidenceClass === "owner_reported" || evidenceClass === "hypothetical";
  }
  if (sourceKind === "paper_trade") return evidenceClass === "hypothetical";
  if (sourceKind === "legacy_migration") return evidenceClass === "migrated_unverified";
  return evidenceClass !== "migrated_unverified";
}

function compareCanonicalOrdinal(left: string, right: string): number {
  return left.length !== right.length
    ? left.length - right.length
    : left < right
      ? -1
      : left > right
        ? 1
        : 0;
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

export function startingInventoryManifestLedgerKey(
  identity: StartingInventoryLedgerIdentity,
): string {
  return [
    identity.canonicalOwnerKey,
    identity.canonicalAccountKey,
    identity.stableInstrumentKey,
    identity.currency.toLowerCase(),
  ].join(":");
}

export function isVerifiedStartingInventoryContract(
  input: unknown,
): input is StartingInventoryContract {
  return verifyStartingInventoryContract(input).ok;
}

function startingInventoryContent(input: Omit<StartingInventoryContract, "contractDigest">): object {
  return {
    policyVersion: input.policyVersion,
    state: input.state,
    asOf: input.asOf,
    coverageState: input.coverageState,
    ledgerIdentity: input.ledgerIdentity,
    priorLots: input.priorLots,
  };
}

export function verifyStartingInventoryContract(
  input: unknown,
): ExactResult<StartingInventoryContract, StartingInventoryFailure> {
  if (!isRecord(input)) return failure(["ti_v3_starting_inventory_input_invalid"]);
  const suppliedDigest = parseCanonicalContentDigest(input.contractDigest);
  if (
    input.policyVersion !== STARTING_INVENTORY_POLICY_VERSION ||
    !suppliedDigest.ok ||
    !String(suppliedDigest.value).startsWith("ti_v3:starting_inventory:v1:")
  ) return failure(["ti_v3_starting_inventory_input_invalid"]);
  if (protectedStartingInventories.has(input as StartingInventoryContract)) {
    const { contractDigest: _digest, ...content } = input as unknown as StartingInventoryContract;
    const identity = createCanonicalContentIdentity("starting_inventory", STARTING_INVENTORY_DIGEST_VERSION, content);
    return identity.ok && identity.value.identifier === suppliedDigest.value
      ? { ok: true, value: input as unknown as StartingInventoryContract }
      : failure(["ti_v3_starting_inventory_input_invalid"]);
  }
  const rebuilt = buildStartingInventoryContract({
    state: input.state,
    asOf: input.asOf,
    coverageState: input.coverageState,
    ledgerIdentity: input.ledgerIdentity,
    priorLots: input.priorLots,
  });
  if (!rebuilt.ok || rebuilt.value.contractDigest !== suppliedDigest.value) {
    return failure(["ti_v3_starting_inventory_input_invalid"]);
  }
  return rebuilt;
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
  const asOf = parseCanonicalUtcTimestamp(input.asOf, "nanosecond");
  if (!asOf.ok) reasons.push("ti_v3_starting_inventory_as_of_invalid");
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
  if (!("proven_flat accepted_prior_lots unknown".split(" ") as string[]).includes(
    typeof state === "string" ? state : "",
  )) {
    reasons.push("ti_v3_starting_inventory_state_invalid");
  }
  const coverageState = input.coverageState;
  if (!("complete incomplete_prior_charges unknown".split(" ") as string[]).includes(
    typeof coverageState === "string" ? coverageState : "",
  )) {
    reasons.push("ti_v3_starting_inventory_coverage_invalid");
  }
  if (!Array.isArray(input.priorLots)) {
    reasons.push("ti_v3_starting_inventory_prior_lots_invalid");
  }
  if (
    reasons.length > 0 ||
    identity === null ||
    !currency.ok ||
    !asOf.ok ||
    !Array.isArray(input.priorLots)
  ) {
    return failure(reasons);
  }
  if (
    (state === "accepted_prior_lots" && input.priorLots.length === 0) ||
    (state !== "accepted_prior_lots" && input.priorLots.length !== 0) ||
    (state === "unknown" && coverageState !== "unknown") ||
    (state === "proven_flat" && coverageState !== "complete") ||
    (state === "accepted_prior_lots" && coverageState === "unknown")
  ) {
    return failure([
      "ti_v3_starting_inventory_prior_lots_invalid",
      "ti_v3_starting_inventory_coverage_invalid",
    ]);
  }

  const priorLots: AcceptedPriorLot[] = [];
  const lotIds = new Set<string>();
  const sourceExecutionDigests = new Set<string>();
  const fifoOrdinals = new Set<string>();
  let priorDirection: "long" | "short" | null = null;
  for (const priorLotInput of input.priorLots) {
    if (!isRecord(priorLotInput)) {
      reasons.push("ti_v3_starting_inventory_prior_lots_invalid");
      continue;
    }
    const quantity = parseExactQuantity(priorLotInput.remainingQuantity);
    const price = parseExactPrice(priorLotInput.price);
    const lotCurrency = parseCurrencyCode(priorLotInput.currency);
    const acquiredAt = parseCanonicalUtcTimestamp(priorLotInput.acquiredAt, "nanosecond");
    const executionDigest = parseCanonicalContentDigest(priorLotInput.sourceExecutionDigest);
    const documentDigest = parseCanonicalContentDigest(priorLotInput.sourceDocumentDigest);
    const sourceKind = priorLotInput.sourceKind;
    const evidenceClass = priorLotInput.evidenceClass;
    const provenanceValid =
      typeof priorLotInput.lotId === "string" &&
      /^prior_lot_[a-z0-9][a-z0-9_-]{0,95}$/.test(priorLotInput.lotId) &&
      (priorLotInput.direction === "long" || priorLotInput.direction === "short") &&
      acquiredAt.ok &&
      acquiredAt.value < asOf.value &&
      typeof priorLotInput.fifoOrdinal === "string" &&
      CANONICAL_ORDINAL_PATTERN.test(priorLotInput.fifoOrdinal) &&
      quantity.ok &&
      quantity.value !== "0" &&
      price.ok &&
      priorLotInput.basisPolicy === PRIOR_INVENTORY_BASIS_POLICY &&
      (priorLotInput.chargeCoverageState === "complete" ||
        priorLotInput.chargeCoverageState === "incomplete") &&
      typeof priorLotInput.sourceIdentity === "string" &&
      /^source_[a-z0-9][a-z0-9_-]*$/.test(priorLotInput.sourceIdentity) &&
      typeof sourceKind === "string" &&
      SOURCE_KINDS.has(sourceKind as ExecutionSourceKind) &&
      typeof evidenceClass === "string" &&
      EVIDENCE_CLASSES.has(evidenceClass as ExecutionEvidenceClass) &&
      compatibleEvidence(sourceKind as ExecutionSourceKind, evidenceClass as ExecutionEvidenceClass) &&
      validLocator(priorLotInput.originalSourceRowLocator) &&
      executionDigest.ok &&
      typeof priorLotInput.sourceExecutionDigest === "string" &&
      priorLotInput.sourceExecutionDigest.startsWith("ti_v3:canonical_execution:") &&
      documentDigest.ok &&
      typeof priorLotInput.sourceDocumentDigest === "string" &&
      priorLotInput.sourceDocumentDigest.startsWith("ti_v3:canonical_source_document:");
    if (!provenanceValid || !lotCurrency.ok) {
      reasons.push(
        acquiredAt.ok && acquiredAt.value >= asOf.value
          ? "ti_v3_starting_inventory_prior_lot_order_invalid"
          : "ti_v3_starting_inventory_prior_lot_provenance_invalid",
      );
      continue;
    }
    if (lotIds.has(priorLotInput.lotId as string)) {
      reasons.push("ti_v3_starting_inventory_prior_lot_duplicate_id");
    }
    if (sourceExecutionDigests.has(priorLotInput.sourceExecutionDigest as string)) {
      reasons.push("ti_v3_starting_inventory_prior_lot_duplicate_execution");
    }
    if (fifoOrdinals.has(priorLotInput.fifoOrdinal as string)) {
      reasons.push("ti_v3_starting_inventory_prior_lot_order_invalid");
    }
    lotIds.add(priorLotInput.lotId as string);
    sourceExecutionDigests.add(priorLotInput.sourceExecutionDigest as string);
    fifoOrdinals.add(priorLotInput.fifoOrdinal as string);

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
    if (!Array.isArray(priorLotInput.signedCharges)) {
      reasons.push("ti_v3_starting_inventory_prior_charge_invalid");
      continue;
    }
    const signedCharges: AcceptedPriorCharge[] = [];
    for (const chargeInput of priorLotInput.signedCharges) {
      if (!isRecord(chargeInput)) {
        reasons.push("ti_v3_starting_inventory_prior_charge_invalid");
        continue;
      }
      const amount = parseExactCharge(chargeInput.amount);
      const chargeCurrency = parseCurrencyCode(chargeInput.currency);
      if (
        typeof chargeInput.kind !== "string" ||
        !/^[a-z][a-z0-9_]{1,63}$/.test(chargeInput.kind) ||
        !amount.ok ||
        !chargeCurrency.ok ||
        chargeCurrency.value !== currency.value
      ) {
        reasons.push("ti_v3_starting_inventory_prior_charge_invalid");
        continue;
      }
      signedCharges.push(
        Object.freeze({
          kind: chargeInput.kind,
          amount: amount.value,
          currency: chargeCurrency.value,
        }),
      );
    }
    signedCharges.sort((left, right) =>
      compareUnicodeCodePoints(
        `${left.kind}:${left.currency}:${left.amount}`,
        `${right.kind}:${right.currency}:${right.amount}`,
      ),
    );
    priorDirection = priorLotInput.direction as "long" | "short";
    priorLots.push(
      Object.freeze({
        lotId: priorLotInput.lotId as string,
        direction: priorDirection,
        acquiredAt: acquiredAt.value,
        fifoOrdinal: priorLotInput.fifoOrdinal as string,
        remainingQuantity: quantity.value,
        price: price.value,
        basisPolicy: PRIOR_INVENTORY_BASIS_POLICY,
        signedCharges: Object.freeze(signedCharges),
        chargeCoverageState: priorLotInput.chargeCoverageState as "complete" | "incomplete",
        canonicalOwnerKey: priorLotInput.canonicalOwnerKey as string,
        canonicalAccountKey: priorLotInput.canonicalAccountKey as string,
        stableInstrumentKey: priorLotInput.stableInstrumentKey as string,
        currency: lotCurrency.value,
        sourceIdentity: priorLotInput.sourceIdentity as string,
        sourceKind: sourceKind as ExecutionSourceKind,
        evidenceClass: evidenceClass as ExecutionEvidenceClass,
        sourceDocumentDigest: documentDigest.value as CanonicalSourceDocumentDigest,
        originalSourceRowLocator: freezeLocator(
          priorLotInput.originalSourceRowLocator as CanonicalSourceRowLocator,
        ),
        sourceExecutionDigest: executionDigest.value as CanonicalExecutionDigest,
      }),
    );
  }
  if (reasons.length > 0) return failure(reasons);
  const hasIncompleteCharges = priorLots.some(
    (lot) => lot.chargeCoverageState === "incomplete",
  );
  if (
    (coverageState === "complete" && hasIncompleteCharges) ||
    (coverageState === "incomplete_prior_charges" && !hasIncompleteCharges)
  ) {
    return failure(["ti_v3_starting_inventory_coverage_invalid"]);
  }
  priorLots.sort((left, right) => {
    const acquired = compareUnicodeCodePoints(left.acquiredAt, right.acquiredAt);
    if (acquired !== 0) return acquired;
    const ordinal = compareCanonicalOrdinal(left.fifoOrdinal, right.fifoOrdinal);
    if (ordinal !== 0) return ordinal;
    return compareUnicodeCodePoints(left.lotId, right.lotId);
  });

  const ledgerIdentity: StartingInventoryLedgerIdentity = Object.freeze({
    canonicalOwnerKey: identity.canonicalOwnerKey as string,
    canonicalAccountKey: identity.canonicalAccountKey as string,
    stableInstrumentKey: identity.stableInstrumentKey as string,
    currency: currency.value,
  });
  const content = {
    policyVersion: STARTING_INVENTORY_POLICY_VERSION,
    state: state as StartingInventoryState,
    asOf: asOf.value,
    coverageState: coverageState as StartingInventoryCoverageState,
    ledgerIdentity,
    priorLots: Object.freeze(priorLots),
  } as const;
  const identityResult = createCanonicalContentIdentity(
    "starting_inventory",
    STARTING_INVENTORY_DIGEST_VERSION,
    startingInventoryContent(content as Omit<StartingInventoryContract, "contractDigest">),
  );
  if (!identityResult.ok) return failure(["ti_v3_starting_inventory_input_invalid"]);
  const contract: StartingInventoryContract = Object.freeze({
    ...content,
    contractDigest: identityResult.value.identifier,
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
    asOf: verified.value.content.executedAt,
    coverageState: state === "unknown" ? "unknown" : "complete",
    ledgerIdentity: {
      canonicalOwnerKey: verified.value.content.canonicalOwnerKey,
      canonicalAccountKey: verified.value.content.canonicalAccountKey,
      stableInstrumentKey: verified.value.content.stableInstrumentKey,
      currency: verified.value.content.currency,
    },
    priorLots: [],
  });
}
