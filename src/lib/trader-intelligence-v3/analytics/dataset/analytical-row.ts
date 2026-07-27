import {
  addExactDecimals,
  parseCurrencyCode,
  parseExactMoneyAmount,
  parseExactQuantity,
  type CurrencyCode,
  type ExactResult,
} from "../../domain/exact";
import type {
  CanonicalContentDigest,
  CanonicalExecutionDigest,
} from "../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateCanonicalDate,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateDigestArray,
  validateKeyArray,
  validateReasonCode,
  validateReasonCodes,
  validateTimestampValue,
  validateTimezone,
  type AnalyticalContractFailure,
} from "../contracts/contract-validation";
import type {
  CanonicalSession,
  CanonicalWeekday,
} from "../adapters/session-policy";

export const ANALYTICAL_ROW_VERSION = "ti_v3_analytical_row_v1" as const;

export type ExactMoneyFact = Readonly<
  | {
      readonly state: "available";
      readonly amount: string;
      readonly currency: CurrencyCode;
    }
  | {
      readonly state: "unavailable";
      readonly reasonCode: string;
    }
>;

export type ExactQuantityFact = Readonly<
  | { readonly state: "available"; readonly quantity: string }
  | { readonly state: "unavailable"; readonly reasonCode: string }
>;

export interface AnalyticalChargeKindAmount {
  readonly kind: string;
  readonly amount: string;
}

/**
 * A completed round trip may be attributed to a source only when every
 * supporting execution carries the same source identity. This prevents a
 * broker/import query from silently assigning a mixed-source trade to one of
 * its inputs.
 */
export type AnalyticalSourceAuthority = Readonly<
  | {
      readonly state: "available";
      readonly sourceIdentity: string;
      readonly sourceKind: "broker_csv" | "broker_api" | "owner_manual" | "paper_trade" | "legacy_migration";
      readonly sourceSystem: string;
      readonly brokerCode: string;
      readonly evidenceClass: "broker_confirmed" | "owner_reported" | "hypothetical" | "migrated_unverified";
    }
  | {
      readonly state: "unavailable";
      readonly reasonCode: string;
    }
>;

type AvailableAnalyticalSourceAuthority = Extract<
  AnalyticalSourceAuthority,
  { readonly state: "available" }
>;

export interface AnalyticalRow {
  readonly schemaVersion: typeof ANALYTICAL_ROW_VERSION;
  readonly semanticRoundTripKey: string;
  readonly supportingExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly supportingOccurrenceKeys: readonly string[];
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly stableInstrumentKey: string;
  readonly displayedSymbol: string;
  readonly displayedSymbolStatus:
    | "non_authoritative_stable_symbol"
    | "non_authoritative_symbol_changed_first_entry_selected";
  readonly direction: "long" | "short";
  readonly sourceAuthority: AnalyticalSourceAuthority;
  readonly currency: CurrencyCode;
  readonly firstEntryAt: string;
  readonly finalExitAt: string;
  readonly timezone: string;
  readonly dateBasis: "trade_close_date";
  readonly sessionDate: string;
  readonly weekday: CanonicalWeekday;
  readonly session: CanonicalSession;
  readonly sequenceInPartition: string;
  readonly grossPnl: string;
  readonly signedCharges: string;
  readonly signedChargesByKind: readonly AnalyticalChargeKindAmount[];
  readonly chargeKindCoverageState: "complete" | "unknown";
  readonly netPnl: string;
  readonly entryNotional: ExactMoneyFact;
  readonly shareQuantity: ExactQuantityFact;
  readonly lifecycleState: "closed_flat_to_flat";
  readonly coverageState: "exact" | "limited";
  readonly evidenceQuality:
    | "verified_exact"
    | "verified_exact_with_limitations";
  readonly limitationCodes: readonly string[];
  readonly rowDigest: CanonicalContentDigest;
}

const WEEKDAYS = new Set<CanonicalWeekday>([
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
]);
const SESSIONS = new Set<CanonicalSession>([
  "premarket", "regular", "after_hours", "overnight", "not_applicable",
]);
const SOURCE_KINDS = new Set<AvailableAnalyticalSourceAuthority["sourceKind"]>([
  "broker_csv", "broker_api", "owner_manual", "paper_trade", "legacy_migration",
]);
const EVIDENCE_CLASSES = new Set<AvailableAnalyticalSourceAuthority["evidenceClass"]>([
  "broker_confirmed", "owner_reported", "hypothetical", "migrated_unverified",
]);
const MONEY_BOUNDS = Object.freeze({
  maximumSignificantDigits: 48,
  maximumScale: 24,
  allowNegative: true,
  allowZero: true,
});

function parseChargeKinds(
  input: unknown,
  signedCharges: string,
  coverageState: "complete" | "unknown",
  path: string,
): ExactResult<readonly AnalyticalChargeKindAmount[], AnalyticalContractFailure> {
  if (!Array.isArray(input) || input.length > 64) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  const values: AnalyticalChargeKindAmount[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const entry = validateContractRecord(input[index], ["kind", "amount"], [], `${path}[${index}]`);
    if (!entry.ok || typeof entry.value.kind !== "string" || !/^[a-z][a-z0-9_]{1,63}$/.test(entry.value.kind)) {
      return contractFailure("ti_v3_analytics_contract_invalid", `${path}[${index}]`);
    }
    const amount = parseExactMoneyAmount(entry.value.amount);
    if (!amount.ok) return contractFailure("ti_v3_analytics_contract_invalid", `${path}[${index}].amount`);
    values.push(Object.freeze({ kind: entry.value.kind, amount: amount.value }));
  }
  const ordered = [...values].sort((left, right) => left.kind.localeCompare(right.kind));
  if (new Set(ordered.map((entry) => entry.kind)).size !== ordered.length) {
    return contractFailure("ti_v3_analytics_contract_duplicate_identity", path);
  }
  if (coverageState === "complete") {
    let total = "0";
    for (const entry of ordered) {
      const summed = addExactDecimals(total, entry.amount, MONEY_BOUNDS);
      if (!summed.ok) return contractFailure("ti_v3_analytics_contract_invalid", path);
      total = summed.value;
    }
    if (total !== signedCharges) {
      return contractFailure("ti_v3_analytics_contract_reference_mismatch", path);
    }
  }
  return { ok: true, value: Object.freeze(ordered) };
}

function parseMoneyFact(
  input: unknown,
  expectedCurrency: CurrencyCode,
  path: string,
): ExactResult<ExactMoneyFact, AnalyticalContractFailure> {
  const record = validateContractRecord(
    input,
    ["state"],
    ["amount", "currency", "reasonCode"],
    path,
  );
  if (!record.ok) return record;
  if (record.value.state === "available") {
    if (Object.keys(record.value).length !== 3) {
      return contractFailure("ti_v3_analytics_contract_invalid", path);
    }
    const amount = parseExactMoneyAmount(record.value.amount);
    const currency = parseCurrencyCode(record.value.currency);
    if (!amount.ok) return contractFailure("ti_v3_analytics_contract_invalid", `${path}.amount`);
    if (!currency.ok || currency.value !== expectedCurrency) {
      return contractFailure("ti_v3_analytics_contract_currency_mismatch", `${path}.currency`);
    }
    return {
      ok: true,
      value: Object.freeze({ state: "available", amount: amount.value, currency: currency.value }),
    };
  }
  if (record.value.state === "unavailable") {
    if (Object.keys(record.value).length !== 2) {
      return contractFailure("ti_v3_analytics_contract_invalid", path);
    }
    const reason = validateReasonCode(record.value.reasonCode, `${path}.reasonCode`);
    return reason.ok
      ? { ok: true, value: Object.freeze({ state: "unavailable", reasonCode: reason.value }) }
      : reason;
  }
  return contractFailure("ti_v3_analytics_contract_invalid", `${path}.state`);
}

function parseQuantityFact(
  input: unknown,
  path: string,
): ExactResult<ExactQuantityFact, AnalyticalContractFailure> {
  const record = validateContractRecord(input, ["state"], ["quantity", "reasonCode"], path);
  if (!record.ok) return record;
  if (record.value.state === "available") {
    if (Object.keys(record.value).length !== 2) {
      return contractFailure("ti_v3_analytics_contract_invalid", path);
    }
    const quantity = parseExactQuantity(record.value.quantity);
    return quantity.ok
      ? { ok: true, value: Object.freeze({ state: "available", quantity: quantity.value }) }
      : contractFailure("ti_v3_analytics_contract_invalid", `${path}.quantity`);
  }
  if (record.value.state === "unavailable") {
    if (Object.keys(record.value).length !== 2) {
      return contractFailure("ti_v3_analytics_contract_invalid", path);
    }
    const reason = validateReasonCode(record.value.reasonCode, `${path}.reasonCode`);
    return reason.ok
      ? { ok: true, value: Object.freeze({ state: "unavailable", reasonCode: reason.value }) }
      : reason;
  }
  return contractFailure("ti_v3_analytics_contract_invalid", `${path}.state`);
}

function parseSourceAuthority(
  input: unknown,
  path: string,
): ExactResult<AnalyticalSourceAuthority, AnalyticalContractFailure> {
  const record = validateContractRecord(
    input,
    ["state"],
    ["sourceIdentity", "sourceKind", "sourceSystem", "brokerCode", "evidenceClass", "reasonCode"],
    path,
  );
  if (!record.ok) return record;
  if (record.value.state === "unavailable") {
    if (Object.keys(record.value).length !== 2) {
      return contractFailure("ti_v3_analytics_contract_invalid", path);
    }
    const reason = validateReasonCode(record.value.reasonCode, `${path}.reasonCode`);
    return reason.ok
      ? { ok: true, value: Object.freeze({ state: "unavailable", reasonCode: reason.value }) }
      : reason;
  }
  if (record.value.state !== "available" || Object.keys(record.value).length !== 6) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  const sourceIdentity = validateContractKey(record.value.sourceIdentity, `${path}.sourceIdentity`);
  const sourceSystem = validateContractKey(record.value.sourceSystem, `${path}.sourceSystem`);
  const brokerCode = validateContractKey(record.value.brokerCode, `${path}.brokerCode`);
  if (
    !sourceIdentity.ok || !sourceIdentity.value.startsWith("source_") ||
    !sourceSystem.ok || !brokerCode.ok ||
    typeof record.value.sourceKind !== "string" || !SOURCE_KINDS.has(record.value.sourceKind as AvailableAnalyticalSourceAuthority["sourceKind"]) ||
    typeof record.value.evidenceClass !== "string" || !EVIDENCE_CLASSES.has(record.value.evidenceClass as AvailableAnalyticalSourceAuthority["evidenceClass"])
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  return {
    ok: true,
    value: Object.freeze({
      state: "available",
      sourceIdentity: sourceIdentity.value,
      sourceKind: record.value.sourceKind as AvailableAnalyticalSourceAuthority["sourceKind"],
      sourceSystem: sourceSystem.value,
      brokerCode: brokerCode.value,
      evidenceClass: record.value.evidenceClass as AvailableAnalyticalSourceAuthority["evidenceClass"],
    }),
  };
}

export function buildAnalyticalRow(
  input: unknown,
): ExactResult<AnalyticalRow, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "semanticRoundTripKey", "supportingExecutionDigests",
    "supportingOccurrenceKeys", "canonicalOwnerKey", "canonicalAccountKey",
    "stableInstrumentKey", "displayedSymbol", "displayedSymbolStatus", "direction", "sourceAuthority",
    "currency", "firstEntryAt", "finalExitAt", "timezone", "dateBasis",
    "sessionDate", "weekday", "session", "sequenceInPartition", "grossPnl",
    "signedCharges", "netPnl", "entryNotional", "shareQuantity", "lifecycleState",
    "coverageState", "evidenceQuality", "limitationCodes",
  ], ["signedChargesByKind", "chargeKindCoverageState"]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYTICAL_ROW_VERSION) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  }
  const roundTripKey = validateContractKey(record.value.semanticRoundTripKey, "$.semanticRoundTripKey", 512);
  if (!roundTripKey.ok) return roundTripKey;
  const executions = validateDigestArray(
    record.value.supportingExecutionDigests,
    "$.supportingExecutionDigests",
    "canonical_execution",
    1_000,
    true,
  );
  if (!executions.ok || executions.value.length === 0) {
    return executions.ok
      ? contractFailure("ti_v3_analytics_contract_invalid", "$.supportingExecutionDigests")
      : executions;
  }
  const occurrences = validateKeyArray(
    record.value.supportingOccurrenceKeys,
    "$.supportingOccurrenceKeys",
    { maximumItems: 1_000, preserveOrder: true },
  );
  if (!occurrences.ok) return occurrences;
  if (occurrences.value.length !== executions.value.length) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.supportingOccurrenceKeys");
  }
  const owner = validateContractKey(record.value.canonicalOwnerKey, "$.canonicalOwnerKey");
  if (!owner.ok || !owner.value.startsWith("owner_")) return owner.ok ? contractFailure("ti_v3_analytics_contract_invalid", "$.canonicalOwnerKey") : owner;
  const account = validateContractKey(record.value.canonicalAccountKey, "$.canonicalAccountKey");
  if (!account.ok || !account.value.startsWith("account_")) return account.ok ? contractFailure("ti_v3_analytics_contract_invalid", "$.canonicalAccountKey") : account;
  const instrument = validateContractKey(record.value.stableInstrumentKey, "$.stableInstrumentKey");
  if (!instrument.ok || !instrument.value.startsWith("instrument_")) return instrument.ok ? contractFailure("ti_v3_analytics_contract_invalid", "$.stableInstrumentKey") : instrument;
  if (typeof record.value.displayedSymbol !== "string" || !/^[A-Z0-9._-]{1,32}$/.test(record.value.displayedSymbol)) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.displayedSymbol");
  }
  const displayedSymbolStatus = record.value.displayedSymbolStatus;
  if (displayedSymbolStatus !== "non_authoritative_stable_symbol" && displayedSymbolStatus !== "non_authoritative_symbol_changed_first_entry_selected") {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.displayedSymbolStatus");
  }
  if (record.value.direction !== "long" && record.value.direction !== "short") {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.direction");
  }
  const sourceAuthority = parseSourceAuthority(record.value.sourceAuthority, "$.sourceAuthority");
  if (!sourceAuthority.ok) return sourceAuthority;
  const currency = parseCurrencyCode(record.value.currency);
  if (!currency.ok) return contractFailure("ti_v3_analytics_contract_invalid", "$.currency");
  const firstEntryAt = validateTimestampValue(record.value.firstEntryAt, "$.firstEntryAt");
  if (!firstEntryAt.ok) return firstEntryAt;
  const finalExitAt = validateTimestampValue(record.value.finalExitAt, "$.finalExitAt");
  if (!finalExitAt.ok) return finalExitAt;
  if (firstEntryAt.value > finalExitAt.value) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.finalExitAt");
  }
  const timezone = validateTimezone(record.value.timezone, "$.timezone");
  if (!timezone.ok) return timezone;
  if (record.value.dateBasis !== "trade_close_date") {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.dateBasis");
  }
  const sessionDate = validateCanonicalDate(record.value.sessionDate, "$.sessionDate");
  if (!sessionDate.ok) return sessionDate;
  if (typeof record.value.weekday !== "string" || !WEEKDAYS.has(record.value.weekday as CanonicalWeekday)) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.weekday");
  }
  if (typeof record.value.session !== "string" || !SESSIONS.has(record.value.session as CanonicalSession)) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.session");
  }
  const sequence = validateCanonicalCount(record.value.sequenceInPartition, "$.sequenceInPartition");
  if (!sequence.ok || sequence.value === "0") return sequence.ok ? contractFailure("ti_v3_analytics_contract_invalid", "$.sequenceInPartition") : sequence;
  const gross = parseExactMoneyAmount(record.value.grossPnl);
  const charges = parseExactMoneyAmount(record.value.signedCharges);
  const net = parseExactMoneyAmount(record.value.netPnl);
  if (!gross.ok) return contractFailure("ti_v3_analytics_contract_invalid", "$.grossPnl");
  if (!charges.ok) return contractFailure("ti_v3_analytics_contract_invalid", "$.signedCharges");
  if (!net.ok) return contractFailure("ti_v3_analytics_contract_invalid", "$.netPnl");
  const chargeKindCoverageState = record.value.chargeKindCoverageState === undefined
    ? "unknown"
    : record.value.chargeKindCoverageState;
  if (chargeKindCoverageState !== "complete" && chargeKindCoverageState !== "unknown") {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.chargeKindCoverageState");
  }
  const signedChargesByKind = parseChargeKinds(
    record.value.signedChargesByKind === undefined ? [] : record.value.signedChargesByKind,
    charges.value,
    chargeKindCoverageState,
    "$.signedChargesByKind",
  );
  if (!signedChargesByKind.ok) return signedChargesByKind;
  const entryNotional = parseMoneyFact(record.value.entryNotional, currency.value, "$.entryNotional");
  if (!entryNotional.ok) return entryNotional;
  const shareQuantity = parseQuantityFact(record.value.shareQuantity, "$.shareQuantity");
  if (!shareQuantity.ok) return shareQuantity;
  if (record.value.lifecycleState !== "closed_flat_to_flat") return contractFailure("ti_v3_analytics_contract_invalid", "$.lifecycleState");
  if (record.value.coverageState !== "exact" && record.value.coverageState !== "limited") return contractFailure("ti_v3_analytics_contract_invalid", "$.coverageState");
  if (record.value.evidenceQuality !== "verified_exact" && record.value.evidenceQuality !== "verified_exact_with_limitations") return contractFailure("ti_v3_analytics_contract_invalid", "$.evidenceQuality");
  const limitations = validateReasonCodes(record.value.limitationCodes, "$.limitationCodes");
  if (!limitations.ok) return limitations;
  if ((limitations.value.length === 0) !== (record.value.coverageState === "exact" && record.value.evidenceQuality === "verified_exact")) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.limitationCodes");
  }
  const content = {
    schemaVersion: ANALYTICAL_ROW_VERSION,
    semanticRoundTripKey: roundTripKey.value,
    supportingExecutionDigests: executions.value as readonly CanonicalExecutionDigest[],
    supportingOccurrenceKeys: occurrences.value,
    canonicalOwnerKey: owner.value,
    canonicalAccountKey: account.value,
    stableInstrumentKey: instrument.value,
    displayedSymbol: record.value.displayedSymbol,
    displayedSymbolStatus,
    direction: record.value.direction,
    sourceAuthority: sourceAuthority.value,
    currency: currency.value,
    firstEntryAt: firstEntryAt.value,
    finalExitAt: finalExitAt.value,
    timezone: timezone.value,
    dateBasis: "trade_close_date" as const,
    sessionDate: sessionDate.value,
    weekday: record.value.weekday as CanonicalWeekday,
    session: record.value.session as CanonicalSession,
    sequenceInPartition: sequence.value,
    grossPnl: gross.value,
    signedCharges: charges.value,
    signedChargesByKind: signedChargesByKind.value,
    chargeKindCoverageState,
    netPnl: net.value,
    entryNotional: entryNotional.value,
    shareQuantity: shareQuantity.value,
    lifecycleState: "closed_flat_to_flat" as const,
    coverageState: record.value.coverageState,
    evidenceQuality: record.value.evidenceQuality,
    limitationCodes: limitations.value,
  };
  return finalizeContentAddressedAuthority("analytical_row", content, "rowDigest") as ExactResult<AnalyticalRow, AnalyticalContractFailure>;
}

export function verifyAnalyticalRow(
  input: unknown,
): ExactResult<AnalyticalRow, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "semanticRoundTripKey", "supportingExecutionDigests",
    "supportingOccurrenceKeys", "canonicalOwnerKey", "canonicalAccountKey",
    "stableInstrumentKey", "displayedSymbol", "displayedSymbolStatus", "direction", "sourceAuthority",
    "currency", "firstEntryAt", "finalExitAt", "timezone", "dateBasis",
    "sessionDate", "weekday", "session", "sequenceInPartition", "grossPnl",
    "signedCharges", "netPnl", "entryNotional", "shareQuantity", "lifecycleState",
    "coverageState", "evidenceQuality", "limitationCodes", "rowDigest",
    "signedChargesByKind", "chargeKindCoverageState",
  ]);
  if (!record.ok) return record;
  const digest = validateClaimedDigest(record.value.rowDigest, "$.rowDigest", "analytical_row");
  if (!digest.ok) return digest;
  const { rowDigest: _rowDigest, ...content } = record.value;
  void _rowDigest;
  const rebuilt = buildAnalyticalRow(content);
  if (!rebuilt.ok || rebuilt.value.rowDigest !== digest.value) {
    return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.rowDigest");
  }
  return rebuilt;
}
