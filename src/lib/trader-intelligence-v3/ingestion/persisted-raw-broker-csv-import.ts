import { Buffer } from "node:buffer";

import { parseStrictCanonicalJson, serializeCanonicalValue } from "../domain/canonical";
import type { ExactResult } from "../domain/exact";
import { validateArray, validateExactRecord } from "../domain/foundation";
import {
  createCanonicalContentIdentity,
  createCanonicalSourceDocumentDigest,
  type CanonicalContentDigest,
  type CanonicalExecutionDigest,
  type CanonicalSourceDocumentDigest,
} from "../domain/identity";
import {
  buildCanonicalExecution,
  type CanonicalExecutionContent,
  type CanonicalExecutionValidation,
} from "../domain/execution";
import {
  ingestRawBrokerExecutionCsv,
  type RawBrokerCsvColumnMapping,
  type RawBrokerCsvIngestionIssue,
  type RawBrokerCsvIngestionRequest,
  type RawBrokerCsvIngestionResult,
} from "./raw-broker-csv-ingestion";

export const PERSISTED_RAW_BROKER_CSV_IMPORT_VERSION =
  "ti_v3_persisted_raw_broker_csv_import_v1" as const;

export interface PersistedCanonicalExecution {
  readonly content: CanonicalExecutionContent;
  readonly validation: CanonicalExecutionValidation;
  readonly canonicalContentDigest: CanonicalExecutionDigest;
}

export interface PersistedRawBrokerCsvImport {
  readonly schemaVersion: typeof PERSISTED_RAW_BROKER_CSV_IMPORT_VERSION;
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly sourceIdentity: string;
  readonly sourceSystem: string;
  readonly brokerCode: string;
  readonly columnMapping: RawBrokerCsvColumnMapping;
  readonly defaultCurrency: string | null;
  readonly timestampPrecision: RawBrokerCsvIngestionRequest["timestampPrecision"];
  readonly sourceTimezoneEvidence: string;
  readonly chargeCoverageState: "complete" | "unknown";
  readonly sourceBytesBase64: string;
  readonly sourceDocumentDigest: CanonicalSourceDocumentDigest;
  readonly sourceByteLength: string;
  readonly inputRowCount: string;
  readonly acceptedExecutionCount: string;
  readonly acceptedExecutions: readonly PersistedCanonicalExecution[];
  readonly rejectedRowCount: string;
  readonly issues: readonly RawBrokerCsvIngestionIssue[];
  readonly persistenceDigest: CanonicalContentDigest;
}

export type PersistedRawBrokerCsvImportFailure = Readonly<{
  code: "ti_v3_persisted_raw_csv_invalid" | "ti_v3_persisted_raw_csv_identity_mismatch";
  path: string;
}>;

const REQUIRED_MAPPING = ["symbol", "executedAt", "side", "quantity", "price"];
const OPTIONAL_MAPPING = ["currency", "commission", "fees", "netCashAmount", "orderId", "executionId"];
const TIMESTAMP_PRECISIONS = new Set(["date", "minute", "second", "millisecond", "microsecond", "nanosecond"]);
const CHARGE_COVERAGE = new Set(["complete", "unknown"]);
const ISSUE_CODES = new Set(["ti_v3_raw_csv_utf8_invalid", "ti_v3_raw_csv_hardening_rejected", "ti_v3_raw_csv_header_missing", "ti_v3_raw_csv_column_mapping_invalid", "ti_v3_raw_csv_row_invalid"]);
const ISSUE_FIELDS = new Set(["timestamp", "direction", "quantity", "price", "currency", "instrument", "charges", "net_cash_amount"]);

function failure(
  code: PersistedRawBrokerCsvImportFailure["code"],
  path: string,
): ExactResult<never, PersistedRawBrokerCsvImportFailure> {
  return { ok: false, error: { code, path } };
}

function isCount(value: unknown): value is string {
  return typeof value === "string" && /^(?:0|[1-9][0-9]{0,9})$/.test(value);
}

function isKey(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,95}$/.test(value);
}

function exactRecord(
  value: unknown,
  required: readonly string[],
  path: string,
): Record<string, unknown> | null {
  const result = validateExactRecord(value, required, [], path);
  return result.ok ? result.value : null;
}

function mapExecution(execution: ReturnType<typeof buildCanonicalExecution> extends ExactResult<infer Result, unknown> ? Result : never): PersistedCanonicalExecution {
  return Object.freeze({
    content: execution.content,
    validation: execution.validation,
    canonicalContentDigest: execution.canonicalContentDigest,
  });
}

function recordContent(record: Omit<PersistedRawBrokerCsvImport, "persistenceDigest">): Omit<PersistedRawBrokerCsvImport, "persistenceDigest"> {
  return record;
}

function issueIsValid(issue: unknown): issue is RawBrokerCsvIngestionIssue {
  const record = exactRecord(issue, ["code", "rowNumber", "detail", "affectedFields"], "$.issues[]");
  if (
    record === null ||
    typeof record.code !== "string" ||
    !ISSUE_CODES.has(record.code) ||
    (record.rowNumber !== null && !isCount(record.rowNumber)) ||
    typeof record.detail !== "string"
  ) return false;
  const fields = validateArray(record.affectedFields, "$.issues[].affectedFields", ISSUE_FIELDS.size);
  return fields.ok && fields.value.every((field) => typeof field === "string" && ISSUE_FIELDS.has(field));
}

function sourceBytes(value: unknown): Uint8Array | null {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;
  try {
    const decoded = Buffer.from(value, "base64");
    return decoded.toString("base64") === value ? new Uint8Array(decoded) : null;
  } catch {
    return null;
  }
}

function sourceResultMatches(
  record: PersistedRawBrokerCsvImport,
  result: RawBrokerCsvIngestionResult,
): boolean {
  return (
    record.sourceDocumentDigest === result.sourceDocumentDigest &&
    record.sourceByteLength === result.sourceByteLength &&
    record.inputRowCount === result.inputRowCount &&
    record.rejectedRowCount === result.rejectedRowCount &&
    record.acceptedExecutions.length === result.acceptedExecutions.length &&
    record.acceptedExecutions.every((entry, index) =>
      entry.canonicalContentDigest === result.acceptedExecutions[index]?.canonicalContentDigest,
    ) &&
    record.issues.length === result.issues.length &&
    record.issues.every((entry, index) => {
      const candidate = result.issues[index];
      return (
        entry.code === candidate?.code &&
        entry.rowNumber === candidate.rowNumber &&
        entry.detail === candidate.detail &&
        entry.affectedFields.length === candidate.affectedFields.length &&
        entry.affectedFields.every((field, fieldIndex) =>
          field === candidate.affectedFields[fieldIndex],
        )
      );
    })
  );
}

export function buildPersistedRawBrokerCsvImport(
  request: RawBrokerCsvIngestionRequest,
  result: RawBrokerCsvIngestionResult,
): ExactResult<PersistedRawBrokerCsvImport, PersistedRawBrokerCsvImportFailure> {
  const sourceDocumentDigest = createCanonicalSourceDocumentDigest(request.csvUtf8);
  if (
    result.sourceDocumentDigest !== sourceDocumentDigest ||
    result.sourceByteLength !== String(request.csvUtf8.length)
  ) return failure("ti_v3_persisted_raw_csv_identity_mismatch", "$.ingestion");

  const acceptedExecutions: PersistedCanonicalExecution[] = [];
  for (let index = 0; index < result.acceptedExecutions.length; index += 1) {
    const execution = result.acceptedExecutions[index];
    const rebuilt = buildCanonicalExecution({
      ...execution.content,
      validation: execution.validation,
    });
    if (
      !rebuilt.ok ||
      rebuilt.value.canonicalContentDigest !== execution.canonicalContentDigest ||
      rebuilt.value.content.canonicalOwnerKey !== request.canonicalOwnerKey ||
      rebuilt.value.content.canonicalAccountKey !== request.canonicalAccountKey ||
      rebuilt.value.content.sourceIdentity !== request.sourceIdentity ||
      rebuilt.value.content.sourceSystem !== request.sourceSystem ||
      rebuilt.value.content.brokerCode !== request.brokerCode ||
      rebuilt.value.content.sourceDocumentDigest !== sourceDocumentDigest ||
      rebuilt.value.validation.state !== "accepted"
    ) return failure("ti_v3_persisted_raw_csv_identity_mismatch", "$.acceptedExecutions[" + index + "]");
    acceptedExecutions.push(mapExecution(rebuilt.value));
  }

  const withoutDigest = {
    schemaVersion: PERSISTED_RAW_BROKER_CSV_IMPORT_VERSION,
    canonicalOwnerKey: request.canonicalOwnerKey,
    canonicalAccountKey: request.canonicalAccountKey,
    sourceIdentity: request.sourceIdentity,
    sourceSystem: request.sourceSystem,
    brokerCode: request.brokerCode,
    columnMapping: Object.freeze({ ...request.columnMapping }),
    defaultCurrency: request.defaultCurrency ?? null,
    timestampPrecision: request.timestampPrecision,
    sourceTimezoneEvidence: request.sourceTimezoneEvidence,
    chargeCoverageState: request.chargeCoverageState ?? "unknown",
    sourceBytesBase64: Buffer.from(request.csvUtf8).toString("base64"),
    sourceDocumentDigest,
    sourceByteLength: result.sourceByteLength,
    inputRowCount: result.inputRowCount,
    acceptedExecutionCount: String(acceptedExecutions.length),
    acceptedExecutions: Object.freeze(acceptedExecutions),
    rejectedRowCount: result.rejectedRowCount,
    issues: Object.freeze(result.issues.map((issue) => Object.freeze({
      code: issue.code,
      rowNumber: issue.rowNumber,
      detail: issue.detail,
      affectedFields: Object.freeze([...issue.affectedFields]),
    }))),
  };
  const identity = createCanonicalContentIdentity("canonical_content", "v1", withoutDigest);
  return identity.ok
    ? { ok: true, value: Object.freeze({ ...withoutDigest, persistenceDigest: identity.value.identifier }) }
    : failure("ti_v3_persisted_raw_csv_invalid", "$");
}

export function ingestAndBuildPersistedRawBrokerCsvImport(
  request: RawBrokerCsvIngestionRequest,
): ExactResult<PersistedRawBrokerCsvImport, PersistedRawBrokerCsvImportFailure> {
  return buildPersistedRawBrokerCsvImport(request, ingestRawBrokerExecutionCsv(request));
}

export function verifyPersistedRawBrokerCsvImport(
  value: unknown,
): ExactResult<PersistedRawBrokerCsvImport, PersistedRawBrokerCsvImportFailure> {
  const fields = [
    "schemaVersion", "canonicalOwnerKey", "canonicalAccountKey", "sourceIdentity",
    "sourceSystem", "brokerCode", "columnMapping", "defaultCurrency",
    "timestampPrecision", "sourceTimezoneEvidence", "chargeCoverageState",
    "sourceBytesBase64", "sourceDocumentDigest", "sourceByteLength",
    "inputRowCount", "acceptedExecutionCount", "acceptedExecutions",
    "rejectedRowCount", "issues", "persistenceDigest",
  ];
  const raw = exactRecord(value, fields, "$");
  if (
    raw === null ||
    raw.schemaVersion !== PERSISTED_RAW_BROKER_CSV_IMPORT_VERSION ||
    !isKey(raw.canonicalOwnerKey) ||
    !isKey(raw.canonicalAccountKey) ||
    !isKey(raw.sourceIdentity) ||
    !isKey(raw.sourceSystem) ||
    !isKey(raw.brokerCode) ||
    (raw.defaultCurrency !== null && (typeof raw.defaultCurrency !== "string" || !/^[A-Z]{3}$/.test(raw.defaultCurrency))) ||
    typeof raw.timestampPrecision !== "string" ||
    !TIMESTAMP_PRECISIONS.has(raw.timestampPrecision) ||
    typeof raw.sourceTimezoneEvidence !== "string" ||
    raw.sourceTimezoneEvidence.length === 0 ||
    typeof raw.chargeCoverageState !== "string" ||
    !CHARGE_COVERAGE.has(raw.chargeCoverageState) ||
    !isCount(raw.sourceByteLength) ||
    !isCount(raw.inputRowCount) ||
    !isCount(raw.acceptedExecutionCount) ||
    !isCount(raw.rejectedRowCount) ||
    typeof raw.persistenceDigest !== "string"
  ) return failure("ti_v3_persisted_raw_csv_invalid", "$");

  const mapping = validateExactRecord(raw.columnMapping, REQUIRED_MAPPING, OPTIONAL_MAPPING, "$.columnMapping");
  if (
    !mapping.ok ||
    !Object.values(mapping.value).every((header) => typeof header === "string" && header.length > 0)
  ) return failure("ti_v3_persisted_raw_csv_invalid", "$.columnMapping");

  const bytes = sourceBytes(raw.sourceBytesBase64);
  if (
    bytes === null ||
    raw.sourceByteLength !== String(bytes.length) ||
    typeof raw.sourceDocumentDigest !== "string" ||
    createCanonicalSourceDocumentDigest(bytes) !== raw.sourceDocumentDigest
  ) return failure("ti_v3_persisted_raw_csv_identity_mismatch", "$.sourceDocumentDigest");

  const executions = validateArray(raw.acceptedExecutions, "$.acceptedExecutions");
  const issues = validateArray(raw.issues, "$.issues");
  if (
    !executions.ok ||
    !issues.ok ||
    raw.acceptedExecutionCount !== String(executions.value.length) ||
    raw.rejectedRowCount !== String(issues.value.filter((issue) => {
      const candidate = issue as { rowNumber?: unknown };
      return candidate.rowNumber !== null;
    }).length) ||
    !issues.value.every(issueIsValid)
  ) return failure("ti_v3_persisted_raw_csv_identity_mismatch", "$.receipts");

  const acceptedExecutions: PersistedCanonicalExecution[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < executions.value.length; index += 1) {
    const entry = exactRecord(executions.value[index], ["content", "validation", "canonicalContentDigest"], "$.acceptedExecutions[]");
    if (entry === null) return failure("ti_v3_persisted_raw_csv_invalid", "$.acceptedExecutions[" + index + "]");
    const rebuilt = buildCanonicalExecution({
      ...(entry.content as Record<string, unknown>),
      validation: entry.validation,
    });
    if (
      !rebuilt.ok ||
      rebuilt.value.canonicalContentDigest !== entry.canonicalContentDigest ||
      seen.has(rebuilt.value.canonicalContentDigest) ||
      rebuilt.value.content.canonicalOwnerKey !== raw.canonicalOwnerKey ||
      rebuilt.value.content.canonicalAccountKey !== raw.canonicalAccountKey ||
      rebuilt.value.content.sourceIdentity !== raw.sourceIdentity ||
      rebuilt.value.content.sourceSystem !== raw.sourceSystem ||
      rebuilt.value.content.brokerCode !== raw.brokerCode ||
      rebuilt.value.content.sourceDocumentDigest !== raw.sourceDocumentDigest ||
      rebuilt.value.validation.state !== "accepted"
    ) return failure("ti_v3_persisted_raw_csv_identity_mismatch", "$.acceptedExecutions[" + index + "]");
    seen.add(rebuilt.value.canonicalContentDigest);
    acceptedExecutions.push(mapExecution(rebuilt.value));
  }

  const withoutDigest = {
    schemaVersion: PERSISTED_RAW_BROKER_CSV_IMPORT_VERSION,
    canonicalOwnerKey: raw.canonicalOwnerKey,
    canonicalAccountKey: raw.canonicalAccountKey,
    sourceIdentity: raw.sourceIdentity,
    sourceSystem: raw.sourceSystem,
    brokerCode: raw.brokerCode,
    columnMapping: Object.freeze({ ...mapping.value }) as RawBrokerCsvColumnMapping,
    defaultCurrency: raw.defaultCurrency,
    timestampPrecision: raw.timestampPrecision as RawBrokerCsvIngestionRequest["timestampPrecision"],
    sourceTimezoneEvidence: raw.sourceTimezoneEvidence,
    chargeCoverageState: raw.chargeCoverageState as "complete" | "unknown",
    sourceBytesBase64: raw.sourceBytesBase64 as string,
    sourceDocumentDigest: raw.sourceDocumentDigest as CanonicalSourceDocumentDigest,
    sourceByteLength: raw.sourceByteLength,
    inputRowCount: raw.inputRowCount,
    acceptedExecutionCount: raw.acceptedExecutionCount,
    acceptedExecutions: Object.freeze(acceptedExecutions),
    rejectedRowCount: raw.rejectedRowCount,
    issues: Object.freeze(issues.value as RawBrokerCsvIngestionIssue[]),
  };
  const identity = createCanonicalContentIdentity("canonical_content", "v1", recordContent(withoutDigest));
  if (!identity.ok || identity.value.identifier !== raw.persistenceDigest) {
    return failure("ti_v3_persisted_raw_csv_identity_mismatch", "$.persistenceDigest");
  }
  return { ok: true, value: Object.freeze({ ...withoutDigest, persistenceDigest: identity.value.identifier }) };
}

export function serializePersistedRawBrokerCsvImport(
  record: PersistedRawBrokerCsvImport,
): ExactResult<string, PersistedRawBrokerCsvImportFailure> {
  const verified = verifyPersistedRawBrokerCsvImport(record);
  const serialized = verified.ok ? serializeCanonicalValue(verified.value) : verified;
  return serialized.ok
    ? { ok: true, value: serialized.value.json }
    : failure("ti_v3_persisted_raw_csv_invalid", "$");
}

export function parsePersistedRawBrokerCsvImport(
  source: string,
): ExactResult<PersistedRawBrokerCsvImport, PersistedRawBrokerCsvImportFailure> {
  const parsed = parseStrictCanonicalJson(source);
  return parsed.ok
    ? verifyPersistedRawBrokerCsvImport(parsed.value)
    : failure("ti_v3_persisted_raw_csv_invalid", "$");
}

export function replayPersistedRawBrokerCsvImport(
  record: PersistedRawBrokerCsvImport,
  resolveInstrument: RawBrokerCsvIngestionRequest["resolveInstrument"],
): ExactResult<RawBrokerCsvIngestionResult, PersistedRawBrokerCsvImportFailure> {
  const verified = verifyPersistedRawBrokerCsvImport(record);
  if (!verified.ok) return verified;
  const current = verified.value;
  const replayed = ingestRawBrokerExecutionCsv({
    csvUtf8: new Uint8Array(Buffer.from(current.sourceBytesBase64, "base64")),
    canonicalOwnerKey: current.canonicalOwnerKey,
    canonicalAccountKey: current.canonicalAccountKey,
    sourceIdentity: current.sourceIdentity,
    sourceSystem: current.sourceSystem,
    brokerCode: current.brokerCode,
    columnMapping: current.columnMapping,
    defaultCurrency: current.defaultCurrency ?? undefined,
    timestampPrecision: current.timestampPrecision,
    sourceTimezoneEvidence: current.sourceTimezoneEvidence,
    chargeCoverageState: current.chargeCoverageState,
    resolveInstrument,
  });
  return sourceResultMatches(current, replayed)
    ? { ok: true, value: replayed }
    : failure("ti_v3_persisted_raw_csv_identity_mismatch", "$.replay");
}
