import type {
  CanonicalUtcTimestamp,
  TimestampSourcePrecision,
} from "../canonical";
import { parseCanonicalUtcTimestamp } from "../canonical";
import {
  parseAcceptedExecutionQuantity,
  parseCurrencyCode,
  parseExactCharge,
  parseExactMoneyAmount,
  parseExactPrice,
  type CurrencyCode,
  type ExactCharge,
  type ExactMoneyAmount,
  type ExactPrice,
  type ExactQuantity,
  type ExactResult,
} from "../exact";
import {
  createCanonicalContentIdentity,
  parseCanonicalContentDigest,
  type CanonicalExecutionDigest,
  type CanonicalSourceDocumentDigest,
} from "../identity";

export const CANONICAL_EXECUTION_SCHEMA_VERSION =
  "ti_v3_canonical_execution_v1" as const;

export type ExecutionSourceKind =
  | "broker_csv"
  | "broker_api"
  | "owner_manual"
  | "paper_trade"
  | "legacy_migration";

export type ExecutionEvidenceClass =
  | "broker_confirmed"
  | "owner_reported"
  | "hypothetical"
  | "migrated_unverified";

export type SourceAggregationState =
  | "individual_fill"
  | "broker_average_fill"
  | "aggregated_unknown";

export type InstrumentResolutionState =
  | "resolved"
  | "unresolved"
  | "ambiguous"
  | "unsupported";

export type ExecutionValidationState = "accepted" | "quarantined" | "rejected";
export type ExecutionSide = "buy" | "sell";
export type BrokerPositionEffectEvidence =
  | "open"
  | "close"
  | "open_and_close"
  | "unknown";
export type ShortSaleIndicator =
  | "broker_marked_short"
  | "broker_marked_not_short"
  | "unknown";
export type ExecutionCorrectionState =
  | "none"
  | "correction"
  | "bust"
  | "unresolved";
export type BasisContinuityState =
  | "resolved"
  | "corporate_action_unresolved"
  | "symbol_change_unresolved";

export interface CanonicalSourceRowLocator {
  kind: "row_number" | "record_key";
  value: string;
  rowOrderPreserved: boolean;
}

export interface CanonicalExecutionCharge {
  kind: string;
  amount: ExactCharge;
  currency: CurrencyCode;
}

export interface CanonicalExecutionContent {
  schemaVersion: typeof CANONICAL_EXECUTION_SCHEMA_VERSION;
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
  sourceIdentity: string;
  sourceKind: ExecutionSourceKind;
  evidenceClass: ExecutionEvidenceClass;
  sourceSystem: string;
  brokerCode: string;
  sourceDocumentDigest: CanonicalSourceDocumentDigest | null;
  originalSourceRowLocator: CanonicalSourceRowLocator;
  sourceAggregationState: SourceAggregationState;
  instrumentResolutionState: InstrumentResolutionState;
  rawBrokerSymbol: string;
  stableInstrumentKey: string | null;
  securityType: string;
  basisContinuityState: BasisContinuityState;
  executedAt: CanonicalUtcTimestamp;
  sourceTimezoneEvidence: string | null;
  timestampPrecision: TimestampSourcePrecision;
  side: ExecutionSide;
  brokerPositionEffectEvidence: BrokerPositionEffectEvidence;
  shortSaleIndicator: ShortSaleIndicator;
  quantity: ExactQuantity;
  price: ExactPrice;
  currency: CurrencyCode;
  charges: readonly CanonicalExecutionCharge[];
  brokerReportedNetCashAmount: ExactMoneyAmount | null;
  orderId: string | null;
  executionId: string | null;
  brokerExecutionIndex: string | null;
  brokerFillSequence: string | null;
  executionIdOrderingSemantics: "declared" | "not_declared";
  correctionState: ExecutionCorrectionState;
  correctionReference: string | null;
}

export interface CanonicalExecutionValidation {
  state: ExecutionValidationState;
  reasonCodes: readonly string[];
}

export interface CanonicalExecutionEnvelope {
  content: CanonicalExecutionContent;
  validation: CanonicalExecutionValidation;
  canonicalBytes: Uint8Array;
  canonicalContentDigest: CanonicalExecutionDigest;
}

export interface CanonicalExecutionDraft
  extends Omit<
    CanonicalExecutionContent,
    | "schemaVersion"
    | "executedAt"
    | "quantity"
    | "price"
    | "currency"
    | "charges"
    | "brokerReportedNetCashAmount"
    | "sourceDocumentDigest"
  > {
  executedAt: string;
  quantity: string;
  price: string;
  currency: string;
  charges: readonly { kind: string; amount: string; currency: string }[];
  brokerReportedNetCashAmount: string | null;
  sourceDocumentDigest: string | null;
  validation: CanonicalExecutionValidation;
}

export type CanonicalExecutionReasonCode =
  | "ti_v3_execution_owner_key_invalid"
  | "ti_v3_execution_account_key_invalid"
  | "ti_v3_execution_source_identity_invalid"
  | "ti_v3_execution_source_system_invalid"
  | "ti_v3_execution_broker_code_invalid"
  | "ti_v3_execution_evidence_source_conflict"
  | "ti_v3_execution_source_document_digest_invalid"
  | "ti_v3_execution_row_locator_invalid"
  | "ti_v3_execution_instrument_key_invalid"
  | "ti_v3_execution_raw_symbol_invalid"
  | "ti_v3_execution_security_type_invalid"
  | "ti_v3_execution_source_timezone_evidence_invalid"
  | "ti_v3_execution_quantity_invalid"
  | "ti_v3_execution_price_invalid"
  | "ti_v3_execution_currency_invalid"
  | "ti_v3_execution_charge_invalid"
  | "ti_v3_execution_charge_currency_mismatch"
  | "ti_v3_execution_net_cash_invalid"
  | "ti_v3_execution_identifier_invalid"
  | "ti_v3_execution_sequence_invalid"
  | "ti_v3_execution_correction_reference_invalid"
  | "ti_v3_execution_validation_state_invalid"
  | "ti_v3_execution_timestamp_invalid"
  | "ti_v3_execution_digest_failed";

export interface CanonicalExecutionBuildFailure {
  code: "ti_v3_canonical_execution_invalid";
  reasonCodes: readonly CanonicalExecutionReasonCode[];
}

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
const AGGREGATION_STATES = new Set<SourceAggregationState>([
  "individual_fill",
  "broker_average_fill",
  "aggregated_unknown",
]);
const INSTRUMENT_STATES = new Set<InstrumentResolutionState>([
  "resolved",
  "unresolved",
  "ambiguous",
  "unsupported",
]);
const SIDES = new Set<ExecutionSide>(["buy", "sell"]);
const POSITION_EFFECTS = new Set<BrokerPositionEffectEvidence>([
  "open",
  "close",
  "open_and_close",
  "unknown",
]);
const SHORT_INDICATORS = new Set<ShortSaleIndicator>([
  "broker_marked_short",
  "broker_marked_not_short",
  "unknown",
]);
const CORRECTION_STATES = new Set<ExecutionCorrectionState>([
  "none",
  "correction",
  "bust",
  "unresolved",
]);
const BASIS_STATES = new Set<BasisContinuityState>([
  "resolved",
  "corporate_action_unresolved",
  "symbol_change_unresolved",
]);

function validSlug(value: unknown, prefix?: string): value is string {
  return (
    typeof value === "string" &&
    value.length <= 96 &&
    new RegExp(`^${prefix ?? ""}[a-z0-9][a-z0-9_-]*$`).test(value)
  );
}

function validIdentifier(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" && value.length > 0 && value.length <= 128 && !/[\u0000-\u001f]/.test(value))
  );
}

function validSequence(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && /^(?:0|[1-9][0-9]{0,37})$/.test(value));
}

function compatibleEvidence(source: ExecutionSourceKind, evidence: ExecutionEvidenceClass): boolean {
  if (evidence === "broker_confirmed") {
    return source === "broker_csv" || source === "broker_api";
  }
  if (source === "owner_manual") {
    return evidence === "owner_reported" || evidence === "hypothetical";
  }
  if (source === "paper_trade") {
    return evidence === "hypothetical";
  }
  if (source === "legacy_migration") {
    return evidence === "migrated_unverified";
  }
  return evidence !== "migrated_unverified";
}

function uniqueSorted<T extends string>(values: readonly T[]): readonly T[] {
  return [...new Set(values)].sort();
}

export function buildCanonicalExecution(
  draft: CanonicalExecutionDraft,
): ExactResult<CanonicalExecutionEnvelope, CanonicalExecutionBuildFailure> {
  const reasons: CanonicalExecutionReasonCode[] = [];
  if (!validSlug(draft.canonicalOwnerKey, "owner_")) reasons.push("ti_v3_execution_owner_key_invalid");
  if (!validSlug(draft.canonicalAccountKey, "account_")) reasons.push("ti_v3_execution_account_key_invalid");
  if (!validSlug(draft.sourceIdentity, "source_")) reasons.push("ti_v3_execution_source_identity_invalid");
  if (!SOURCE_KINDS.has(draft.sourceKind)) reasons.push("ti_v3_execution_source_identity_invalid");
  if (!EVIDENCE_CLASSES.has(draft.evidenceClass)) reasons.push("ti_v3_execution_evidence_source_conflict");
  if (!validSlug(draft.sourceSystem)) reasons.push("ti_v3_execution_source_system_invalid");
  if (!validSlug(draft.brokerCode)) reasons.push("ti_v3_execution_broker_code_invalid");
  if (!compatibleEvidence(draft.sourceKind, draft.evidenceClass)) reasons.push("ti_v3_execution_evidence_source_conflict");
  if (!AGGREGATION_STATES.has(draft.sourceAggregationState)) reasons.push("ti_v3_execution_source_identity_invalid");
  if (!INSTRUMENT_STATES.has(draft.instrumentResolutionState)) reasons.push("ti_v3_execution_instrument_key_invalid");
  if (typeof draft.rawBrokerSymbol !== "string" || !/^[A-Z0-9._-]{1,32}$/.test(draft.rawBrokerSymbol)) reasons.push("ti_v3_execution_raw_symbol_invalid");
  if (typeof draft.securityType !== "string" || !/^[a-z][a-z0-9_]{1,63}$/.test(draft.securityType)) reasons.push("ti_v3_execution_security_type_invalid");
  if (!BASIS_STATES.has(draft.basisContinuityState)) reasons.push("ti_v3_execution_instrument_key_invalid");
  if (
    (draft.instrumentResolutionState === "resolved" && !validSlug(draft.stableInstrumentKey, "instrument_")) ||
    (draft.instrumentResolutionState !== "resolved" && draft.stableInstrumentKey !== null)
  ) reasons.push("ti_v3_execution_instrument_key_invalid");
  if (
    draft.sourceTimezoneEvidence !== null &&
    (typeof draft.sourceTimezoneEvidence !== "string" || draft.sourceTimezoneEvidence.length > 96 || /[\u0000-\u001f]/.test(draft.sourceTimezoneEvidence))
  ) reasons.push("ti_v3_execution_source_timezone_evidence_invalid");
  if (!SIDES.has(draft.side)) reasons.push("ti_v3_execution_source_identity_invalid");
  if (!POSITION_EFFECTS.has(draft.brokerPositionEffectEvidence)) reasons.push("ti_v3_execution_source_identity_invalid");
  if (!SHORT_INDICATORS.has(draft.shortSaleIndicator)) reasons.push("ti_v3_execution_source_identity_invalid");
  if (!CORRECTION_STATES.has(draft.correctionState)) reasons.push("ti_v3_execution_correction_reference_invalid");
  if (
    (draft.correctionState === "none" && draft.correctionReference !== null) ||
    (draft.correctionState !== "none" && !validIdentifier(draft.correctionReference))
  ) reasons.push("ti_v3_execution_correction_reference_invalid");
  if (!validIdentifier(draft.orderId) || !validIdentifier(draft.executionId)) reasons.push("ti_v3_execution_identifier_invalid");
  if (!validSequence(draft.brokerExecutionIndex) || !validSequence(draft.brokerFillSequence)) reasons.push("ti_v3_execution_sequence_invalid");
  if (
    draft.originalSourceRowLocator === null ||
    !["row_number", "record_key"].includes(draft.originalSourceRowLocator.kind) ||
    !validIdentifier(draft.originalSourceRowLocator.value) ||
    draft.originalSourceRowLocator.value === null ||
    typeof draft.originalSourceRowLocator.rowOrderPreserved !== "boolean"
  ) reasons.push("ti_v3_execution_row_locator_invalid");

  const timestamp = parseCanonicalUtcTimestamp(draft.executedAt, draft.timestampPrecision);
  if (!timestamp.ok) reasons.push("ti_v3_execution_timestamp_invalid");
  const quantity = parseAcceptedExecutionQuantity(draft.quantity);
  if (!quantity.ok) reasons.push("ti_v3_execution_quantity_invalid");
  const price = parseExactPrice(draft.price);
  if (!price.ok) reasons.push("ti_v3_execution_price_invalid");
  const currency = parseCurrencyCode(draft.currency);
  if (!currency.ok) reasons.push("ti_v3_execution_currency_invalid");

  let sourceDocumentDigest: CanonicalSourceDocumentDigest | null = null;
  if (draft.sourceDocumentDigest !== null) {
    const parsedDigest = parseCanonicalContentDigest(draft.sourceDocumentDigest);
    if (!parsedDigest.ok || !draft.sourceDocumentDigest.startsWith("ti_v3:canonical_source_document:")) {
      reasons.push("ti_v3_execution_source_document_digest_invalid");
    } else {
      sourceDocumentDigest = parsedDigest.value as CanonicalSourceDocumentDigest;
    }
  }

  const charges: CanonicalExecutionCharge[] = [];
  for (const charge of draft.charges) {
    const amount = parseExactCharge(charge.amount);
    const chargeCurrency = parseCurrencyCode(charge.currency);
    if (
      typeof charge.kind !== "string" ||
      !/^[a-z][a-z0-9_]{1,63}$/.test(charge.kind) ||
      !amount.ok ||
      !chargeCurrency.ok
    ) {
      reasons.push("ti_v3_execution_charge_invalid");
      continue;
    }
    if (currency.ok && chargeCurrency.value !== currency.value) {
      reasons.push("ti_v3_execution_charge_currency_mismatch");
    }
    charges.push({ kind: charge.kind, amount: amount.value, currency: chargeCurrency.value });
  }
  charges.sort((left, right) =>
    `${left.kind}:${left.currency}:${left.amount}`.localeCompare(
      `${right.kind}:${right.currency}:${right.amount}`,
    ),
  );

  let netCash: ExactMoneyAmount | null = null;
  if (draft.brokerReportedNetCashAmount !== null) {
    const parsedNetCash = parseExactMoneyAmount(draft.brokerReportedNetCashAmount);
    if (!parsedNetCash.ok) reasons.push("ti_v3_execution_net_cash_invalid");
    else netCash = parsedNetCash.value;
  }

  if (
    !["accepted", "quarantined", "rejected"].includes(draft.validation.state) ||
    (draft.validation.state === "accepted" && draft.validation.reasonCodes.length > 0) ||
    (draft.validation.state !== "accepted" && draft.validation.reasonCodes.length === 0) ||
    draft.validation.reasonCodes.some((reason) => !/^ti_v3_[a-z0-9_]+$/.test(reason))
  ) reasons.push("ti_v3_execution_validation_state_invalid");

  if (
    reasons.length > 0 ||
    !timestamp.ok ||
    !quantity.ok ||
    !price.ok ||
    !currency.ok
  ) {
    return {
      ok: false,
      error: { code: "ti_v3_canonical_execution_invalid", reasonCodes: uniqueSorted(reasons) },
    };
  }

  const content: CanonicalExecutionContent = {
    schemaVersion: CANONICAL_EXECUTION_SCHEMA_VERSION,
    canonicalOwnerKey: draft.canonicalOwnerKey,
    canonicalAccountKey: draft.canonicalAccountKey,
    sourceIdentity: draft.sourceIdentity,
    sourceKind: draft.sourceKind,
    evidenceClass: draft.evidenceClass,
    sourceSystem: draft.sourceSystem,
    brokerCode: draft.brokerCode,
    sourceDocumentDigest,
    originalSourceRowLocator: draft.originalSourceRowLocator,
    sourceAggregationState: draft.sourceAggregationState,
    instrumentResolutionState: draft.instrumentResolutionState,
    rawBrokerSymbol: draft.rawBrokerSymbol,
    stableInstrumentKey: draft.stableInstrumentKey,
    securityType: draft.securityType,
    basisContinuityState: draft.basisContinuityState,
    executedAt: timestamp.value,
    sourceTimezoneEvidence: draft.sourceTimezoneEvidence,
    timestampPrecision: draft.timestampPrecision,
    side: draft.side,
    brokerPositionEffectEvidence: draft.brokerPositionEffectEvidence,
    shortSaleIndicator: draft.shortSaleIndicator,
    quantity: quantity.value,
    price: price.value,
    currency: currency.value,
    charges,
    brokerReportedNetCashAmount: netCash,
    orderId: draft.orderId,
    executionId: draft.executionId,
    brokerExecutionIndex: draft.brokerExecutionIndex,
    brokerFillSequence: draft.brokerFillSequence,
    executionIdOrderingSemantics: draft.executionIdOrderingSemantics,
    correctionState: draft.correctionState,
    correctionReference: draft.correctionReference,
  };
  const identity = createCanonicalContentIdentity("canonical_execution", "v1", content);
  if (!identity.ok) {
    return {
      ok: false,
      error: {
        code: "ti_v3_canonical_execution_invalid",
        reasonCodes: ["ti_v3_execution_digest_failed"],
      },
    };
  }
  return {
    ok: true,
    value: {
      content,
      validation: {
        state: draft.validation.state,
        reasonCodes: uniqueSorted(draft.validation.reasonCodes),
      },
      canonicalBytes: identity.value.canonicalBytes,
      canonicalContentDigest: identity.value.identifier as CanonicalExecutionDigest,
    },
  };
}
