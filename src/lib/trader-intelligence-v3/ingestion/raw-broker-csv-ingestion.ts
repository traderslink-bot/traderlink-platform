import {
  buildCanonicalExecution,
  createCanonicalSourceDocumentDigest,
  type BasisContinuityState,
  type CanonicalExecutionEnvelope,
  type InstrumentResolutionState,
  type TimestampSourcePrecision,
} from "../domain";
import { validateParserHardeningInput } from "./parser-hardening";

export const RAW_BROKER_CSV_INGESTION_VERSION =
  "ti_v3_raw_broker_csv_ingestion_v1" as const;

type RequiredColumn = "symbol" | "executedAt" | "side" | "quantity" | "price";
type OptionalColumn = "currency" | "commission" | "fees" | "netCashAmount" | "orderId" | "executionId";

export type RawBrokerCsvColumnMapping = Readonly<Record<RequiredColumn, string> & Partial<Record<OptionalColumn, string>>>;

export interface RawBrokerCsvInstrumentResolution {
  readonly state: InstrumentResolutionState;
  readonly stableInstrumentKey: string | null;
  readonly securityType: string;
  readonly basisContinuityState: BasisContinuityState;
}

export interface RawBrokerCsvIngestionRequest {
  readonly csvUtf8: Uint8Array;
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly sourceIdentity: string;
  readonly sourceSystem: string;
  readonly brokerCode: string;
  readonly columnMapping: RawBrokerCsvColumnMapping;
  readonly defaultCurrency?: string;
  readonly timestampPrecision: TimestampSourcePrecision;
  readonly sourceTimezoneEvidence: string;
  readonly chargeCoverageState?: "complete" | "unknown";
  readonly resolveInstrument: (rawBrokerSymbol: string) => RawBrokerCsvInstrumentResolution;
}

export type RawBrokerCsvIngestionIssueCode =
  | "ti_v3_raw_csv_utf8_invalid"
  | "ti_v3_raw_csv_hardening_rejected"
  | "ti_v3_raw_csv_header_missing"
  | "ti_v3_raw_csv_column_mapping_invalid"
  | "ti_v3_raw_csv_row_invalid";

export type RawBrokerCsvIngestionQualityField =
  | "timestamp"
  | "direction"
  | "quantity"
  | "price"
  | "currency"
  | "instrument"
  | "charges"
  | "net_cash_amount";

export interface RawBrokerCsvIngestionIssue {
  readonly code: RawBrokerCsvIngestionIssueCode;
  readonly rowNumber: string | null;
  readonly detail: string;
  readonly affectedFields: readonly RawBrokerCsvIngestionQualityField[];
}

export interface RawBrokerCsvIngestionResult {
  readonly schemaVersion: typeof RAW_BROKER_CSV_INGESTION_VERSION;
  readonly sourceDocumentDigest: string;
  readonly sourceByteLength: string;
  readonly inputRowCount: string;
  readonly acceptedExecutions: readonly CanonicalExecutionEnvelope[];
  readonly rejectedRowCount: string;
  readonly issues: readonly RawBrokerCsvIngestionIssue[];
}

interface CsvDocument {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

function issue(
  code: RawBrokerCsvIngestionIssueCode,
  rowNumber: string | null,
  detail: string,
  affectedFields: readonly RawBrokerCsvIngestionQualityField[] = [],
): RawBrokerCsvIngestionIssue {
  return Object.freeze({ code, rowNumber, detail, affectedFields: Object.freeze([...affectedFields]) });
}

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function parseCsv(text: string, delimiter: "," | ";" | "\t"): CsvDocument | null {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (character === delimiter && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((character === "\r" || character === "\n") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += character;
  }
  if (quoted) return null;
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  if (rows.length === 0 || rows[0].length === 0) return null;
  const headers = rows[0].map((value) => value.replace(/^\uFEFF/, "").trim());
  if (headers.some((value) => value === "") || new Set(headers.map(normalizeHeader)).size !== headers.length) {
    return null;
  }
  if (rows.slice(1).some((value) => value.length !== headers.length)) return null;
  return Object.freeze({ headers: Object.freeze(headers), rows: Object.freeze(rows.slice(1).map((value) => Object.freeze(value))) });
}

function strictDecimal(raw: string, absolute: boolean): string | null {
  let value = raw.trim();
  if (value === "") return null;
  const parenthesized = /^\(.*\)$/.test(value);
  if (parenthesized) value = value.slice(1, -1).trim();
  if (value.startsWith("$")) value = value.slice(1);
  if (/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(value)) value = value.replace(/,/g, "");
  if (!/^[+-]?(?:0|[0-9]+)(?:\.[0-9]+)?$/.test(value)) return null;
  if (parenthesized && value.startsWith("-")) return null;
  if (parenthesized) value = `-${value.replace(/^\+/, "")}`;
  else value = value.replace(/^\+/, "");
  if (absolute) value = value.replace(/^-/, "");
  return value;
}

function normalizedTimestamp(
  value: string,
  precision: TimestampSourcePrecision,
): string | null {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/.exec(value.trim());
  if (match === null) return null;
  const fraction = (match[2] ?? "").padEnd(9, "0");
  const timestamp = `${match[1]}.${fraction}Z`;
  const expectedFraction = precision === "date" || precision === "minute" || precision === "second"
    ? "000000000"
    : precision === "millisecond"
      ? /000000$/.test(fraction)
      : precision === "microsecond"
        ? /000$/.test(fraction)
        : true;
  return expectedFraction ? timestamp : null;
}

function normalizedSide(value: string): "buy" | "sell" | null {
  const side = value.trim().toLowerCase();
  return side === "buy" ? "buy" : side === "sell" ? "sell" : null;
}

function safeSlug(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return normalized || "broker";
}

function headerIndex(
  document: CsvDocument,
  mapping: RawBrokerCsvColumnMapping,
): ReadonlyMap<string, number> | null {
  const normalized = document.headers.map(normalizeHeader);
  const indexes = new Map<string, number>();
  const usedIndexes = new Set<number>();
  for (const [field, header] of Object.entries(mapping)) {
    if (typeof header !== "string" || header.trim() === "") return null;
    const index = normalized.indexOf(normalizeHeader(header));
    if (index < 0 || indexes.has(field) || usedIndexes.has(index)) return null;
    indexes.set(field, index);
    usedIndexes.add(index);
  }
  return indexes;
}

function field(
  row: readonly string[],
  indexes: ReadonlyMap<string, number>,
  key: string,
): string | null {
  const index = indexes.get(key);
  return index === undefined ? null : row[index]?.trim() ?? null;
}

function optionalIdentifier(value: string | null): string | null {
  return value === null || value === "" ? null : value;
}

/**
 * Converts explicit, UTF-8 broker CSV mappings straight into canonical v3
 * executions. It deliberately rejects local timestamps and inferred mappings:
 * raw source bytes and declared authority are the prerequisite for an exact
 * broker-confirmed source.
 */
export function ingestRawBrokerExecutionCsv(
  request: RawBrokerCsvIngestionRequest,
): RawBrokerCsvIngestionResult {
  const sourceDocumentDigest = createCanonicalSourceDocumentDigest(request.csvUtf8);
  const issues: RawBrokerCsvIngestionIssue[] = [];
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(request.csvUtf8);
  } catch {
    return Object.freeze({
      schemaVersion: RAW_BROKER_CSV_INGESTION_VERSION,
      sourceDocumentDigest,
      sourceByteLength: String(request.csvUtf8.length),
      inputRowCount: "0",
      acceptedExecutions: Object.freeze([]),
      rejectedRowCount: "0",
      issues: Object.freeze([issue("ti_v3_raw_csv_utf8_invalid", null, "CSV source bytes are not valid UTF-8.")]),
    });
  }
  const hardening = validateParserHardeningInput(request.csvUtf8, request.columnMapping);
  if (!hardening.ok || hardening.delimiter === null) {
    return Object.freeze({
      schemaVersion: RAW_BROKER_CSV_INGESTION_VERSION,
      sourceDocumentDigest,
      sourceByteLength: String(request.csvUtf8.length),
      inputRowCount: "0",
      acceptedExecutions: Object.freeze([]),
      rejectedRowCount: "0",
      issues: Object.freeze([issue("ti_v3_raw_csv_hardening_rejected", null, "CSV must pass v3 parser hardening with one unambiguous delimiter.")]),
    });
  }
  const document = parseCsv(text, hardening.delimiter);
  if (document === null) {
    return Object.freeze({
      schemaVersion: RAW_BROKER_CSV_INGESTION_VERSION,
      sourceDocumentDigest,
      sourceByteLength: String(request.csvUtf8.length),
      inputRowCount: "0",
      acceptedExecutions: Object.freeze([]),
      rejectedRowCount: "0",
      issues: Object.freeze([issue("ti_v3_raw_csv_header_missing", null, "CSV must contain one valid header row and consistent data rows.")]),
    });
  }
  const indexes = headerIndex(document, request.columnMapping);
  if (indexes === null || (["symbol", "executedAt", "side", "quantity", "price"] as const).some((key) => !indexes.has(key))) {
    return Object.freeze({
      schemaVersion: RAW_BROKER_CSV_INGESTION_VERSION,
      sourceDocumentDigest,
      sourceByteLength: String(request.csvUtf8.length),
      inputRowCount: "0",
      acceptedExecutions: Object.freeze([]),
      rejectedRowCount: "0",
      issues: Object.freeze([issue("ti_v3_raw_csv_column_mapping_invalid", null, "Every required canonical field needs one explicit source header.")]),
    });
  }
  const accepted: CanonicalExecutionEnvelope[] = [];
  for (let offset = 0; offset < document.rows.length; offset += 1) {
    const row = document.rows[offset];
    const rowNumber = String(offset + 2);
    const symbol = (field(row, indexes, "symbol") ?? "").toUpperCase();
    const timestamp = normalizedTimestamp(field(row, indexes, "executedAt") ?? "", request.timestampPrecision);
    const side = normalizedSide(field(row, indexes, "side") ?? "");
    const quantity = strictDecimal(field(row, indexes, "quantity") ?? "", true);
    const price = strictDecimal(field(row, indexes, "price") ?? "", false);
    const currency = (field(row, indexes, "currency") ?? request.defaultCurrency ?? "").trim().toUpperCase();
    const commission = field(row, indexes, "commission");
    const fees = field(row, indexes, "fees");
    const netCashAmount = field(row, indexes, "netCashAmount");
    const resolution = /^[A-Z0-9._-]{1,32}$/.test(symbol)
      ? request.resolveInstrument(symbol)
      : null;
    if (timestamp === null || side === null || quantity === null || price === null || currency === "" || resolution === null) {
      const affectedFields: RawBrokerCsvIngestionQualityField[] = [];
      if (timestamp === null) affectedFields.push("timestamp");
      if (side === null) affectedFields.push("direction");
      if (quantity === null) affectedFields.push("quantity");
      if (price === null) affectedFields.push("price");
      if (currency === "") affectedFields.push("currency");
      if (resolution === null) affectedFields.push("instrument");
      issues.push(issue("ti_v3_raw_csv_row_invalid", rowNumber, "Required execution fields are missing, malformed, locally timed, or unresolved.", affectedFields));
      continue;
    }
    const charges = [
      ["commission", commission],
      ["fee", fees],
    ] as const;
    const parsedCharges = charges.flatMap(([kind, raw]) => {
      if (raw === null || raw === "") return [];
      const amount = strictDecimal(raw, true);
      return amount === null ? [] : [{ kind, amount, currency }];
    });
    if (parsedCharges.length !== charges.filter(([, raw]) => raw !== null && raw !== "").length) {
      issues.push(issue("ti_v3_raw_csv_row_invalid", rowNumber, "A commission or fee is not an exact decimal.", ["charges"]));
      continue;
    }
    const net = netCashAmount === null || netCashAmount === "" ? null : strictDecimal(netCashAmount, false);
    if (netCashAmount !== null && netCashAmount !== "" && net === null) {
      issues.push(issue("ti_v3_raw_csv_row_invalid", rowNumber, "Broker net cash amount is not an exact decimal.", ["net_cash_amount"]));
      continue;
    }
    const orderId = optionalIdentifier(field(row, indexes, "orderId"));
    const executionId = optionalIdentifier(field(row, indexes, "executionId"));
    const built = buildCanonicalExecution({
      canonicalOwnerKey: request.canonicalOwnerKey,
      canonicalAccountKey: request.canonicalAccountKey,
      sourceIdentity: request.sourceIdentity,
      sourceKind: "broker_csv",
      evidenceClass: "broker_confirmed",
      sourceSystem: request.sourceSystem,
      brokerCode: request.brokerCode,
      sourceDocumentDigest,
      originalSourceRowLocator: { kind: "row_number", value: rowNumber, rowOrderPreserved: true },
      sourceAggregationState: "individual_fill",
      instrumentResolutionState: resolution.state,
      rawBrokerSymbol: symbol,
      stableInstrumentKey: resolution.stableInstrumentKey,
      securityType: resolution.securityType,
      basisContinuityState: resolution.basisContinuityState,
      executedAt: timestamp,
      sourceTimezoneEvidence: request.sourceTimezoneEvidence,
      timestampPrecision: request.timestampPrecision,
      side,
      brokerPositionEffectEvidence: "unknown",
      shortSaleIndicator: "unknown",
      quantity,
      price,
      currency,
      charges: parsedCharges,
      chargeCoverageState: request.chargeCoverageState ?? "unknown",
      brokerReportedNetCashAmount: net,
      orderId,
      executionId,
      brokerExecutionIndex: rowNumber,
      brokerExecutionIndexOrderingScope: "source_document",
      brokerFillSequence: rowNumber,
      executionIdOrderingSemantics: executionId === null || executionId === "" ? "not_declared" : "declared",
      executionIdOrderingNamespace: executionId === null || executionId === "" ? null : `ordering_${safeSlug(request.sourceSystem)}_execution_id`,
      executionIdOrderingScope: executionId === null || executionId === "" ? "not_declared" : "source_document",
      correctionState: "none",
      correctionReference: null,
      validation: { state: "accepted", reasonCodes: [] },
    });
    if (!built.ok) {
      issues.push(issue("ti_v3_raw_csv_row_invalid", rowNumber, built.error.reasonCodes.join(",")));
      continue;
    }
    accepted.push(built.value);
  }
  return Object.freeze({
    schemaVersion: RAW_BROKER_CSV_INGESTION_VERSION,
    sourceDocumentDigest,
    sourceByteLength: String(request.csvUtf8.length),
    inputRowCount: String(document.rows.length),
    acceptedExecutions: Object.freeze(accepted),
    rejectedRowCount: String(issues.filter((entry) => entry.rowNumber !== null).length),
    issues: Object.freeze(issues),
  });
}
