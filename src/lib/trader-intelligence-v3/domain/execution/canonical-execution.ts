import type {
  CanonicalUtcTimestamp,
  TimestampSourcePrecision,
} from "../canonical";
import {
  compareUnicodeCodePoints,
  parseCanonicalUtcTimestamp,
} from "../canonical";
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

export type ExecutionOrderingScope =
  | "not_declared"
  | "source_document"
  | "source_identity_global";

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
  brokerExecutionIndexOrderingScope: ExecutionOrderingScope;
  brokerFillSequence: string | null;
  executionIdOrderingSemantics: "declared" | "not_declared";
  executionIdOrderingNamespace: string | null;
  executionIdOrderingScope: ExecutionOrderingScope;
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
  | "ti_v3_execution_input_invalid"
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
  | "ti_v3_execution_ordering_semantics_invalid"
  | "ti_v3_execution_ordering_namespace_invalid"
  | "ti_v3_execution_ordering_scope_invalid"
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
const ORDERING_SCOPES = new Set<ExecutionOrderingScope>([
  "not_declared",
  "source_document",
  "source_identity_global",
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildFailure(
  reasonCodes: readonly CanonicalExecutionReasonCode[],
): ExactResult<never, CanonicalExecutionBuildFailure> {
  return {
    ok: false,
    error: {
      code: "ti_v3_canonical_execution_invalid",
      reasonCodes: uniqueSorted(reasonCodes),
    },
  };
}

export function buildCanonicalExecution(
  input: unknown,
): ExactResult<CanonicalExecutionEnvelope, CanonicalExecutionBuildFailure> {
  if (!isRecord(input)) {
    return buildFailure(["ti_v3_execution_input_invalid"]);
  }
  const draft = input;
  const reasons: CanonicalExecutionReasonCode[] = [];
  const sourceKindValid =
    typeof draft.sourceKind === "string" &&
    SOURCE_KINDS.has(draft.sourceKind as ExecutionSourceKind);
  const evidenceClassValid =
    typeof draft.evidenceClass === "string" &&
    EVIDENCE_CLASSES.has(draft.evidenceClass as ExecutionEvidenceClass);
  const aggregationStateValid =
    typeof draft.sourceAggregationState === "string" &&
    AGGREGATION_STATES.has(draft.sourceAggregationState as SourceAggregationState);
  const instrumentStateValid =
    typeof draft.instrumentResolutionState === "string" &&
    INSTRUMENT_STATES.has(draft.instrumentResolutionState as InstrumentResolutionState);
  const sideValid =
    typeof draft.side === "string" && SIDES.has(draft.side as ExecutionSide);
  const positionEffectValid =
    typeof draft.brokerPositionEffectEvidence === "string" &&
    POSITION_EFFECTS.has(
      draft.brokerPositionEffectEvidence as BrokerPositionEffectEvidence,
    );
  const shortIndicatorValid =
    typeof draft.shortSaleIndicator === "string" &&
    SHORT_INDICATORS.has(draft.shortSaleIndicator as ShortSaleIndicator);
  const correctionStateValid =
    typeof draft.correctionState === "string" &&
    CORRECTION_STATES.has(draft.correctionState as ExecutionCorrectionState);
  const basisStateValid =
    typeof draft.basisContinuityState === "string" &&
    BASIS_STATES.has(draft.basisContinuityState as BasisContinuityState);

  if (!validSlug(draft.canonicalOwnerKey, "owner_")) {
    reasons.push("ti_v3_execution_owner_key_invalid");
  }
  if (!validSlug(draft.canonicalAccountKey, "account_")) {
    reasons.push("ti_v3_execution_account_key_invalid");
  }
  if (!validSlug(draft.sourceIdentity, "source_")) {
    reasons.push("ti_v3_execution_source_identity_invalid");
  }
  if (!sourceKindValid) reasons.push("ti_v3_execution_source_identity_invalid");
  if (!evidenceClassValid) reasons.push("ti_v3_execution_evidence_source_conflict");
  if (!validSlug(draft.sourceSystem)) {
    reasons.push("ti_v3_execution_source_system_invalid");
  }
  if (!validSlug(draft.brokerCode)) {
    reasons.push("ti_v3_execution_broker_code_invalid");
  }
  if (
    sourceKindValid &&
    evidenceClassValid &&
    !compatibleEvidence(
      draft.sourceKind as ExecutionSourceKind,
      draft.evidenceClass as ExecutionEvidenceClass,
    )
  ) {
    reasons.push("ti_v3_execution_evidence_source_conflict");
  }
  if (!aggregationStateValid) reasons.push("ti_v3_execution_source_identity_invalid");
  if (!instrumentStateValid) reasons.push("ti_v3_execution_instrument_key_invalid");
  if (
    typeof draft.rawBrokerSymbol !== "string" ||
    !/^[A-Z0-9._-]{1,32}$/.test(draft.rawBrokerSymbol)
  ) {
    reasons.push("ti_v3_execution_raw_symbol_invalid");
  }
  if (
    typeof draft.securityType !== "string" ||
    !/^[a-z][a-z0-9_]{1,63}$/.test(draft.securityType)
  ) {
    reasons.push("ti_v3_execution_security_type_invalid");
  }
  if (!basisStateValid) reasons.push("ti_v3_execution_instrument_key_invalid");
  if (
    !instrumentStateValid ||
    (draft.instrumentResolutionState === "resolved" &&
      !validSlug(draft.stableInstrumentKey, "instrument_")) ||
    (draft.instrumentResolutionState !== "resolved" && draft.stableInstrumentKey !== null)
  ) {
    reasons.push("ti_v3_execution_instrument_key_invalid");
  }
  if (
    draft.sourceTimezoneEvidence !== null &&
    (typeof draft.sourceTimezoneEvidence !== "string" ||
      draft.sourceTimezoneEvidence.length > 96 ||
      /[\u0000-\u001f]/.test(draft.sourceTimezoneEvidence))
  ) {
    reasons.push("ti_v3_execution_source_timezone_evidence_invalid");
  }
  if (!sideValid) reasons.push("ti_v3_execution_source_identity_invalid");
  if (!positionEffectValid) reasons.push("ti_v3_execution_source_identity_invalid");
  if (!shortIndicatorValid) reasons.push("ti_v3_execution_source_identity_invalid");
  if (!correctionStateValid) {
    reasons.push("ti_v3_execution_correction_reference_invalid");
  }
  if (
    !correctionStateValid ||
    (draft.correctionState === "none" && draft.correctionReference !== null) ||
    (draft.correctionState !== "none" && !validIdentifier(draft.correctionReference))
  ) {
    reasons.push("ti_v3_execution_correction_reference_invalid");
  }
  if (!validIdentifier(draft.orderId) || !validIdentifier(draft.executionId)) {
    reasons.push("ti_v3_execution_identifier_invalid");
  }
  if (
    !validSequence(draft.brokerExecutionIndex) ||
    !validSequence(draft.brokerFillSequence)
  ) {
    reasons.push("ti_v3_execution_sequence_invalid");
  }

  const locator = isRecord(draft.originalSourceRowLocator)
    ? draft.originalSourceRowLocator
    : null;
  if (
    locator === null ||
    !["row_number", "record_key"].includes(
      typeof locator.kind === "string" ? locator.kind : "",
    ) ||
    !validIdentifier(locator.value) ||
    locator.value === null ||
    typeof locator.rowOrderPreserved !== "boolean"
  ) {
    reasons.push("ti_v3_execution_row_locator_invalid");
  }

  const timestamp = parseCanonicalUtcTimestamp(
    draft.executedAt,
    draft.timestampPrecision,
  );
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
    if (
      !parsedDigest.ok ||
      typeof draft.sourceDocumentDigest !== "string" ||
      !draft.sourceDocumentDigest.startsWith("ti_v3:canonical_source_document:")
    ) {
      reasons.push("ti_v3_execution_source_document_digest_invalid");
    } else {
      sourceDocumentDigest = parsedDigest.value as CanonicalSourceDocumentDigest;
    }
  }

  const brokerIndexScopeValid =
    typeof draft.brokerExecutionIndexOrderingScope === "string" &&
    ORDERING_SCOPES.has(
      draft.brokerExecutionIndexOrderingScope as ExecutionOrderingScope,
    );
  const executionIdScopeValid =
    typeof draft.executionIdOrderingScope === "string" &&
    ORDERING_SCOPES.has(draft.executionIdOrderingScope as ExecutionOrderingScope);
  if (!brokerIndexScopeValid || !executionIdScopeValid) {
    reasons.push("ti_v3_execution_ordering_scope_invalid");
  }
  if (
    brokerIndexScopeValid &&
    ((draft.brokerExecutionIndex === null &&
      draft.brokerExecutionIndexOrderingScope !== "not_declared") ||
      (draft.brokerExecutionIndexOrderingScope === "source_document" &&
        sourceDocumentDigest === null))
  ) {
    reasons.push("ti_v3_execution_ordering_scope_invalid");
  }
  const orderingSemanticsValid =
    draft.executionIdOrderingSemantics === "declared" ||
    draft.executionIdOrderingSemantics === "not_declared";
  if (!orderingSemanticsValid) {
    reasons.push("ti_v3_execution_ordering_semantics_invalid");
  }
  const orderingNamespaceValid =
    draft.executionIdOrderingNamespace === null ||
    validSlug(draft.executionIdOrderingNamespace, "ordering_");
  if (!orderingNamespaceValid) {
    reasons.push("ti_v3_execution_ordering_namespace_invalid");
  }
  if (
    orderingSemanticsValid &&
    (draft.executionIdOrderingSemantics === "declared"
      ? draft.executionId === null ||
        !validSlug(draft.executionIdOrderingNamespace, "ordering_") ||
        !executionIdScopeValid ||
        draft.executionIdOrderingScope === "not_declared" ||
        (draft.executionIdOrderingScope === "source_document" &&
          sourceDocumentDigest === null)
      : draft.executionIdOrderingNamespace !== null ||
        draft.executionIdOrderingScope !== "not_declared")
  ) {
    reasons.push("ti_v3_execution_ordering_semantics_invalid");
  }

  const charges: CanonicalExecutionCharge[] = [];
  if (!Array.isArray(draft.charges)) {
    reasons.push("ti_v3_execution_charge_invalid");
  } else {
    for (const chargeInput of draft.charges) {
      if (!isRecord(chargeInput)) {
        reasons.push("ti_v3_execution_charge_invalid");
        continue;
      }
      const amount = parseExactCharge(chargeInput.amount);
      const chargeCurrency = parseCurrencyCode(chargeInput.currency);
      if (
        typeof chargeInput.kind !== "string" ||
        !/^[a-z][a-z0-9_]{1,63}$/.test(chargeInput.kind) ||
        !amount.ok ||
        !chargeCurrency.ok
      ) {
        reasons.push("ti_v3_execution_charge_invalid");
        continue;
      }
      if (currency.ok && chargeCurrency.value !== currency.value) {
        reasons.push("ti_v3_execution_charge_currency_mismatch");
      }
      charges.push({
        kind: chargeInput.kind,
        amount: amount.value,
        currency: chargeCurrency.value,
      });
    }
  }
  charges.sort((left, right) =>
    compareUnicodeCodePoints(
      `${left.kind}:${left.currency}:${left.amount}`,
      `${right.kind}:${right.currency}:${right.amount}`,
    ),
  );

  let netCash: ExactMoneyAmount | null = null;
  if (draft.brokerReportedNetCashAmount !== null) {
    const parsedNetCash = parseExactMoneyAmount(draft.brokerReportedNetCashAmount);
    if (!parsedNetCash.ok) reasons.push("ti_v3_execution_net_cash_invalid");
    else netCash = parsedNetCash.value;
  }

  const validation = isRecord(draft.validation) ? draft.validation : null;
  const validationState = validation?.state;
  const validationReasons = validation?.reasonCodes;
  const validationReasonsValid =
    Array.isArray(validationReasons) &&
    validationReasons.every(
      (reason) =>
        typeof reason === "string" && /^ti_v3_[a-z0-9_]+$/.test(reason),
    );
  if (
    validation === null ||
    !["accepted", "quarantined", "rejected"].includes(
      typeof validationState === "string" ? validationState : "",
    ) ||
    !validationReasonsValid ||
    (validationState === "accepted" && validationReasons.length > 0) ||
    (validationState !== "accepted" &&
      validationReasonsValid &&
      validationReasons.length === 0)
  ) {
    reasons.push("ti_v3_execution_validation_state_invalid");
  }

  if (
    reasons.length > 0 ||
    !timestamp.ok ||
    !quantity.ok ||
    !price.ok ||
    !currency.ok ||
    locator === null ||
    validation === null ||
    !validationReasonsValid
  ) {
    return buildFailure(reasons);
  }

  const content: CanonicalExecutionContent = {
    schemaVersion: CANONICAL_EXECUTION_SCHEMA_VERSION,
    canonicalOwnerKey: draft.canonicalOwnerKey as string,
    canonicalAccountKey: draft.canonicalAccountKey as string,
    sourceIdentity: draft.sourceIdentity as string,
    sourceKind: draft.sourceKind as ExecutionSourceKind,
    evidenceClass: draft.evidenceClass as ExecutionEvidenceClass,
    sourceSystem: draft.sourceSystem as string,
    brokerCode: draft.brokerCode as string,
    sourceDocumentDigest,
    originalSourceRowLocator: {
      kind: locator.kind as CanonicalSourceRowLocator["kind"],
      value: locator.value as string,
      rowOrderPreserved: locator.rowOrderPreserved as boolean,
    },
    sourceAggregationState: draft.sourceAggregationState as SourceAggregationState,
    instrumentResolutionState:
      draft.instrumentResolutionState as InstrumentResolutionState,
    rawBrokerSymbol: draft.rawBrokerSymbol as string,
    stableInstrumentKey: draft.stableInstrumentKey as string | null,
    securityType: draft.securityType as string,
    basisContinuityState: draft.basisContinuityState as BasisContinuityState,
    executedAt: timestamp.value,
    sourceTimezoneEvidence: draft.sourceTimezoneEvidence as string | null,
    timestampPrecision: draft.timestampPrecision as TimestampSourcePrecision,
    side: draft.side as ExecutionSide,
    brokerPositionEffectEvidence:
      draft.brokerPositionEffectEvidence as BrokerPositionEffectEvidence,
    shortSaleIndicator: draft.shortSaleIndicator as ShortSaleIndicator,
    quantity: quantity.value,
    price: price.value,
    currency: currency.value,
    charges,
    brokerReportedNetCashAmount: netCash,
    orderId: draft.orderId as string | null,
    executionId: draft.executionId as string | null,
    brokerExecutionIndex: draft.brokerExecutionIndex as string | null,
    brokerExecutionIndexOrderingScope:
      draft.brokerExecutionIndexOrderingScope as ExecutionOrderingScope,
    brokerFillSequence: draft.brokerFillSequence as string | null,
    executionIdOrderingSemantics: draft.executionIdOrderingSemantics as
      | "declared"
      | "not_declared",
    executionIdOrderingNamespace: draft.executionIdOrderingNamespace as string | null,
    executionIdOrderingScope:
      draft.executionIdOrderingScope as ExecutionOrderingScope,
    correctionState: draft.correctionState as ExecutionCorrectionState,
    correctionReference: draft.correctionReference as string | null,
  };
  const identity = createCanonicalContentIdentity(
    "canonical_execution",
    "v1",
    content,
  );
  if (!identity.ok) {
    return buildFailure(["ti_v3_execution_digest_failed"]);
  }
  return {
    ok: true,
    value: {
      content: identity.value.canonicalValue as unknown as CanonicalExecutionContent,
      validation: {
        state: validationState as ExecutionValidationState,
        reasonCodes: uniqueSorted(validationReasons as string[]),
      },
      canonicalBytes: identity.value.canonicalBytes,
      canonicalContentDigest:
        identity.value.identifier as CanonicalExecutionDigest,
    },
  };
}
