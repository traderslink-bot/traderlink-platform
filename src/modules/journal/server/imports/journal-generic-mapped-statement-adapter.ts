import { createHash } from "node:crypto";

import type {
  JournalAdapterExecution,
  JournalAdapterSourceRow,
  JournalCoverageInterval,
  JournalImportIssue,
} from "../../contracts/journal-import-contracts";
import { platformFailure, TraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  normalizeBrokerDecimal,
  normalizeIbkrExecutionTime,
  normalizeJournalCurrency,
  normalizeJournalStockSymbol,
} from "./journal-value-normalization";
import { calculateSourceFileEvidence, decodeStrictUtf8Source } from "./record-preserving-csv";
import {
  journalStatementStructuralSignature,
  type JournalMappingSupportPackage,
} from "../product/journal-mapping-support-package";

export const JOURNAL_GENERIC_MAPPED_STATEMENT_ADAPTER_ID =
  "generic_mapped_statement" as const;
export const JOURNAL_GENERIC_MAPPED_STATEMENT_ADAPTER_VERSION =
  "generic_mapped_statement_v1" as const;
export const JOURNAL_GENERIC_MAPPED_STATEMENT_PARSER_VERSION =
  "record_preserving_delimited_v1" as const;
export const JOURNAL_GENERIC_MAPPED_STATEMENT_MAPPING_VERSION =
  "user_confirmed_statement_mapping_v1" as const;

export const JOURNAL_GENERIC_MAPPING_FIELDS = Object.freeze([
  "symbol",
  "timestamp",
  "date",
  "time",
  "side",
  "quantity",
  "price",
  "currency",
  "fees",
  "executionId",
] as const);

export type JournalGenericMappingField = typeof JOURNAL_GENERIC_MAPPING_FIELDS[number];

export type JournalGenericStatementMappingContract = Readonly<{
  contractVersion: "user_confirmed_statement_mapping_v1";
  brokerName: string;
  structuralSignatureSha256: string;
  delimiter: "comma" | "semicolon" | "tab";
  tableKind: "sectioned" | "tabular";
  tableLabel: string;
  headerRowIndex: number;
  orderedHeaders: readonly string[];
  columns: Readonly<Partial<Record<JournalGenericMappingField, string>>>;
  sideValues: Readonly<{
    buy: readonly string[];
    sell: readonly string[];
  }>;
  defaultCurrency: string;
  feeSignConvention: "cost_positive" | "cash_effect";
  sourceTimezone: string;
}>;

export type JournalGenericMappedStatementPreview = Readonly<{
  adapterId: typeof JOURNAL_GENERIC_MAPPED_STATEMENT_ADAPTER_ID;
  adapterVersion: typeof JOURNAL_GENERIC_MAPPED_STATEMENT_ADAPTER_VERSION;
  parserVersion: typeof JOURNAL_GENERIC_MAPPED_STATEMENT_PARSER_VERSION;
  mappingVersion: typeof JOURNAL_GENERIC_MAPPED_STATEMENT_MAPPING_VERSION;
  mappingContract: JournalGenericStatementMappingContract;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
  statementPeriodStartDate: string | null;
  statementPeriodEndDate: string | null;
  sourceTimezone: string;
  rows: readonly JournalAdapterSourceRow[];
  issues: readonly JournalImportIssue[];
  coverageIntervals: readonly JournalCoverageInterval[];
  executions: readonly JournalAdapterExecution[];
  positionFacts: readonly [];
}>;

type DelimitedRecord = Readonly<{
  recordOrdinal: number;
  fields: readonly string[];
  rawRecord: string;
  rawRecordSha256: string;
  rawFieldsJson: string;
  contentFingerprintSha256: string;
  occurrenceOrdinal: number;
}>;

const DELIMITERS = Object.freeze({
  comma: ",",
  semicolon: ";",
  tab: "\t",
} as const);

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizedHeader(value: string): string {
  return value.trim().normalize("NFKC").toLowerCase()
    .replace(/[^a-z0-9]+/gu, "");
}

function safeBrokerName(value: string): string {
  const normalized = value.trim().replace(/[\u0000-\u001f\u007f]/gu, "");
  if (normalized.length < 1 || normalized.length > 120) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      field: "brokerName",
    });
  }
  return normalized;
}

/** The broker label is chosen by the trader before the statement is uploaded. */
export function normalizeJournalConfirmedBrokerName(value: unknown): string {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", { field: "brokerName" });
  }
  const normalized = value.trim().normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/gu, "").replace(/\s+/gu, " ");
  if (normalized.length < 1 || normalized.length > 80) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", { field: "brokerName" });
  }
  return normalized;
}

function safeHeader(value: string, field: string): string {
  const normalized = value.trim().replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ");
  if (normalized.length < 1 || normalized.length > 120) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", { field });
  }
  return normalized;
}

function parseRecords(text: string, delimiter: string): readonly DelimitedRecord[] {
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
      reason: "unsafe_control_character",
    });
  }
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const parsed: Array<Readonly<{ fields: readonly string[]; rawRecord: string }>> = [];
  let fields: string[] = [];
  let field = "";
  let rawRecord = "";
  let quoted = false;
  let quotedFieldClosed = false;
  const finish = () => {
    if (parsed.length >= 500_000) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
        reason: "record_count_exceeded",
      });
    }
    parsed.push(Object.freeze({
      fields: Object.freeze([...fields, field]),
      rawRecord,
    }));
    fields = [];
    field = "";
    rawRecord = "";
    quotedFieldClosed = false;
  };
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      rawRecord += character;
      if (character !== '"') field += character;
      else if (source[index + 1] === '"') {
        rawRecord += '"';
        field += '"';
        index += 1;
      } else {
        quoted = false;
        quotedFieldClosed = true;
      }
      if (field.length > 1024 * 1024) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
          reason: "field_size_exceeded",
        });
      }
      continue;
    }
    if (character === '"') {
      if (field.length !== 0 || quotedFieldClosed) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
          reason: "unexpected_quote",
        });
      }
      quoted = true;
      rawRecord += character;
    } else if (character === delimiter) {
      if (fields.length >= 4096) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
          reason: "field_count_exceeded",
        });
      }
      fields.push(field);
      field = "";
      quotedFieldClosed = false;
      rawRecord += character;
    } else if (character === "\r" || character === "\n") {
      finish();
      if (character === "\r" && source[index + 1] === "\n") index += 1;
    } else {
      if (quotedFieldClosed) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
          reason: "characters_after_closing_quote",
        });
      }
      field += character;
      rawRecord += character;
    }
  }
  if (quoted) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
      reason: "unterminated_quote",
    });
  }
  if (rawRecord.length > 0 || field.length > 0 || fields.length > 0) finish();
  const occurrences = new Map<string, number>();
  return Object.freeze(parsed.map((record, index) => {
    const rawFieldsJson = JSON.stringify(record.fields);
    const contentFingerprintSha256 = sha256(rawFieldsJson);
    const occurrenceOrdinal = (occurrences.get(contentFingerprintSha256) ?? 0) + 1;
    occurrences.set(contentFingerprintSha256, occurrenceOrdinal);
    return Object.freeze({
      recordOrdinal: index + 1,
      fields: record.fields,
      rawRecord: record.rawRecord,
      rawRecordSha256: sha256(record.rawRecord),
      rawFieldsJson,
      contentFingerprintSha256,
      occurrenceOrdinal,
    });
  }));
}

function canonicalTimestamp(value: string): string {
  let normalized = value.trim().replace("T", " ");
  const yearFirstSlash = /^(\d{4})\/(\d{1,2})\/(\d{1,2})(.*)$/u.exec(normalized);
  if (yearFirstSlash) {
    normalized = `${yearFirstSlash[1]}-${yearFirstSlash[2]!.padStart(2, "0")}-${yearFirstSlash[3]!.padStart(2, "0")}${yearFirstSlash[4]}`;
  }
  if (/(?:^|[ ,T])\d{1,2}:\d{2}$/u.test(normalized)) normalized += ":00";
  return normalized.replace(/\s+/gu, " ");
}

function normalizedSide(value: string): string {
  return value.trim().normalize("NFKC").toLowerCase()
    .replace(/[^a-z0-9]+/gu, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJournalGenericStatementMappingContract(
  value: unknown,
): JournalGenericStatementMappingContract {
  if (!isRecord(value) || !isRecord(value.columns) || !isRecord(value.sideValues)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "mapping_contract_invalid",
    });
  }
  const stringField = (field: string): string => {
    const candidate = value[field];
    if (typeof candidate !== "string") {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
        reason: "mapping_contract_invalid",
      });
    }
    return candidate;
  };
  const columns = Object.fromEntries(Object.entries(value.columns).map(([field, header]) => {
    if (typeof header !== "string") {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
        reason: "mapping_contract_invalid",
      });
    }
    return [field, header];
  })) as Partial<Record<JournalGenericMappingField, string>>;
  const sideValues = value.sideValues;
  const sideArray = (field: "buy" | "sell"): readonly string[] => {
    const candidate = sideValues[field];
    if (!Array.isArray(candidate) || candidate.some((entry) => typeof entry !== "string")) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
        reason: "mapping_contract_invalid",
      });
    }
    return Object.freeze([...candidate] as string[]);
  };
  if (
    !Array.isArray(value.orderedHeaders) ||
    value.orderedHeaders.some((entry) => typeof entry !== "string") ||
    !Number.isSafeInteger(value.headerRowIndex)
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "mapping_contract_invalid",
    });
  }
  const mapping = Object.freeze({
    contractVersion: stringField("contractVersion") as JournalGenericStatementMappingContract["contractVersion"],
    brokerName: stringField("brokerName"),
    structuralSignatureSha256: stringField("structuralSignatureSha256"),
    delimiter: stringField("delimiter") as JournalGenericStatementMappingContract["delimiter"],
    tableKind: stringField("tableKind") as JournalGenericStatementMappingContract["tableKind"],
    tableLabel: stringField("tableLabel"),
    headerRowIndex: Number(value.headerRowIndex),
    orderedHeaders: Object.freeze([...(value.orderedHeaders as string[])]),
    columns: Object.freeze(columns),
    sideValues: Object.freeze({ buy: sideArray("buy"), sell: sideArray("sell") }),
    defaultCurrency: stringField("defaultCurrency"),
    feeSignConvention: stringField("feeSignConvention") as JournalGenericStatementMappingContract["feeSignConvention"],
    sourceTimezone: stringField("sourceTimezone"),
  });
  return validateMapping(mapping);
}

function validateMapping(
  mapping: JournalGenericStatementMappingContract,
): JournalGenericStatementMappingContract {
  if (
    mapping.contractVersion !== JOURNAL_GENERIC_MAPPED_STATEMENT_MAPPING_VERSION ||
    !/^[0-9a-f]{64}$/u.test(mapping.structuralSignatureSha256) ||
    !(mapping.delimiter in DELIMITERS) ||
    !["sectioned", "tabular"].includes(mapping.tableKind) ||
    !Number.isSafeInteger(mapping.headerRowIndex) ||
    mapping.headerRowIndex < 0 ||
    mapping.orderedHeaders.length < 2 ||
    mapping.orderedHeaders.length > 4096
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "mapping_contract_invalid",
    });
  }
  if (!["cost_positive", "cash_effect"].includes(mapping.feeSignConvention)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "fee_sign_convention_invalid",
    });
  }
  safeBrokerName(mapping.brokerName);
  safeHeader(mapping.tableLabel, "tableLabel");
  const headers = mapping.orderedHeaders.map((header, index) =>
    safeHeader(header, `header${index}`));
  const normalizedHeaders = headers.map(normalizedHeader);
  if (
    normalizedHeaders.some((header) => header.length === 0) ||
    new Set(normalizedHeaders).size !== normalizedHeaders.length
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "duplicate_or_invalid_header",
    });
  }
  const mappedHeaders = Object.entries(mapping.columns);
  if (mappedHeaders.some(([field, header]) =>
    !JOURNAL_GENERIC_MAPPING_FIELDS.includes(field as JournalGenericMappingField) ||
    typeof header !== "string" ||
    !normalizedHeaders.includes(normalizedHeader(header)))) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "mapped_header_missing",
    });
  }
  for (const required of ["symbol", "side", "quantity", "price"] as const) {
    if (!mapping.columns[required]) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
        reason: `required_${required}_mapping_missing`,
      });
    }
  }
  if (!mapping.columns.timestamp && !(mapping.columns.date && mapping.columns.time)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "timestamp_mapping_missing",
    });
  }
  normalizeJournalCurrency(mapping.defaultCurrency);
  normalizeIbkrExecutionTime("2026-01-01, 12:00:00", mapping.sourceTimezone);
  const buy = mapping.sideValues.buy.map(normalizedSide).filter(Boolean);
  const sell = mapping.sideValues.sell.map(normalizedSide).filter(Boolean);
  if (buy.length === 0 || sell.length === 0 || buy.some((value) => sell.includes(value))) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "side_mapping_invalid",
    });
  }
  return mapping;
}

function issue(
  recordOrdinal: number | null,
  issueCode: string,
  severity: "info" | "warning" | "error",
  isBlocking = false,
  chainHint?: JournalImportIssue["chainHint"],
): JournalImportIssue {
  return Object.freeze({
    recordOrdinal,
    issueScope: recordOrdinal === null ? "import" as const : "execution" as const,
    issueCode,
    severity,
    isBlocking,
    ...(chainHint ? { chainHint } : {}),
  });
}

function dateAt(executedAtUtc: string, timezone: string): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(executedAtUtc)).filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function previewGenericMappedStatement(input: Readonly<{
  sourceBytes: Uint8Array;
  mapping: JournalGenericStatementMappingContract;
}>): JournalGenericMappedStatementPreview {
  const mapping = validateMapping(input.mapping);
  const evidence = calculateSourceFileEvidence(input.sourceBytes);
  const records = parseRecords(
    decodeStrictUtf8Source(input.sourceBytes),
    DELIMITERS[mapping.delimiter],
  );
  const header = records[mapping.headerRowIndex];
  if (!header) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "header_row_missing",
    });
  }
  const headerOffset = mapping.tableKind === "sectioned" ? 2 : 0;
  const actualHeaders = header.fields.slice(headerOffset).map((value, index) =>
    safeHeader(value, `sourceHeader${index}`));
  const actualSignature = journalStatementStructuralSignature({
    delimiter: mapping.delimiter,
    tableKind: mapping.tableKind,
    tableLabel: mapping.tableLabel,
    headerLabels: actualHeaders,
  });
  if (
    actualSignature !== mapping.structuralSignatureSha256 ||
    JSON.stringify(actualHeaders.map(normalizedHeader)) !==
      JSON.stringify(mapping.orderedHeaders.map(normalizedHeader))
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "statement_structure_changed",
    });
  }
  if (
    mapping.tableKind === "sectioned" &&
    (
      normalizedHeader(header.fields[0] ?? "") !== normalizedHeader(mapping.tableLabel) ||
      normalizedHeader(header.fields[1] ?? "") !== "header"
    )
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "statement_section_changed",
    });
  }
  const indexByHeader = new Map(
    actualHeaders.map((label, index) => [normalizedHeader(label), index + headerOffset]),
  );
  const indexFor = (field: JournalGenericMappingField): number | null => {
    const label = mapping.columns[field];
    return label ? indexByHeader.get(normalizedHeader(label)) ?? null : null;
  };
  const columnIndexes = Object.freeze(Object.fromEntries(
    JOURNAL_GENERIC_MAPPING_FIELDS.map((field) => [field, indexFor(field)]),
  ) as Record<JournalGenericMappingField, number | null>);
  const sideBuy = new Set([
    "buy", "b", "bought", "bot", "buytocover", "cover",
    ...mapping.sideValues.buy,
  ].map(normalizedSide));
  const sideSell = new Set([
    "sell", "s", "sold", "sld", "sellshort", "short",
    ...mapping.sideValues.sell,
  ].map(normalizedSide));
  const issues: JournalImportIssue[] = [];
  const executions: Array<Omit<JournalAdapterExecution, "contentOccurrenceOrdinal">> = [];
  const classifications = new Map<number, JournalAdapterSourceRow["classification"]>();
  for (const record of records) classifications.set(record.recordOrdinal, "automatic_non_execution");
  const selectedRecords = records.filter((record) => {
    if (mapping.tableKind === "sectioned") {
      return normalizedHeader(record.fields[0] ?? "") === normalizedHeader(mapping.tableLabel) &&
        normalizedHeader(record.fields[1] ?? "") === "data";
    }
    return record.recordOrdinal > header.recordOrdinal &&
      record.fields.length === actualHeaders.length;
  });
  for (const record of selectedRecords) {
    const value = (field: JournalGenericMappingField): string | null => {
      const index = columnIndexes[field];
      return index === null ? null : record.fields[index]?.trim() || null;
    };
    const rawSymbol = value("symbol");
    const rawSide = value("side");
    const rawQuantity = value("quantity");
    const rawPrice = value("price");
    const timestamp = value("timestamp") ?? (
      value("date") && value("time") ? `${value("date")}, ${value("time")}` : null
    );
    if (!rawSymbol || !rawSide || !rawQuantity || !timestamp) {
      classifications.set(record.recordOrdinal, "needs_correction");
      issues.push(issue(record.recordOrdinal, "execution_required_fact_missing", "warning"));
      continue;
    }
    try {
      const normalizedSymbol = normalizeJournalStockSymbol(rawSymbol);
      const tradeCurrency = normalizeJournalCurrency(value("currency") ?? mapping.defaultCurrency);
      const sourceTimestampText = canonicalTimestamp(timestamp);
      const executedAtUtc = normalizeIbkrExecutionTime(
        sourceTimestampText,
        mapping.sourceTimezone,
      );
      const sideToken = normalizedSide(rawSide);
      const side = sideBuy.has(sideToken)
        ? "buy" as const
        : sideSell.has(sideToken)
          ? "sell" as const
          : null;
      if (!side) throw new Error("side_unmapped");
      const signedQuantity = normalizeBrokerDecimal(rawQuantity, "quantityDecimal");
      if (signedQuantity === "0") throw new Error("zero_quantity");
      const quantityDecimal = signedQuantity.startsWith("-")
        ? signedQuantity.slice(1)
        : signedQuantity;
      const priceDecimal = rawPrice
        ? normalizeBrokerDecimal(rawPrice, "priceDecimal", { positive: true })
        : null;
      if (!priceDecimal) {
        issues.push(issue(record.recordOrdinal, "execution_price_missing", "warning", false, {
          normalizedSymbol,
          assetClass: "stock",
          tradeCurrency,
          effectiveAtUtc: executedAtUtc,
        }));
      }
      const rawFee = value("fees");
      let feesDecimal = rawFee ? normalizeBrokerDecimal(rawFee, "feesDecimal") : null;
      if (
        feesDecimal &&
        mapping.feeSignConvention === "cost_positive" &&
        !feesDecimal.startsWith("-")
      ) feesDecimal = `-${feesDecimal}`;
      if (feesDecimal === "0") feesDecimal = null;
      const normalizedContentIdentity = sha256(JSON.stringify([
        "execution-content-v1",
        "stock",
        normalizedSymbol,
        tradeCurrency,
        executedAtUtc,
        side,
        quantityDecimal,
        priceDecimal,
      ]));
      const rawExecutionId = value("executionId");
      const providerExecutionIdentity = rawExecutionId &&
        rawExecutionId.length <= 256 &&
        !/[\u0000-\u001f\u007f]/u.test(rawExecutionId)
        ? rawExecutionId
        : null;
      if (rawExecutionId && !providerExecutionIdentity) {
        issues.push(issue(record.recordOrdinal, "provider_execution_identity_invalid", "warning"));
      }
      executions.push(Object.freeze({
        recordOrdinal: record.recordOrdinal,
        normalizedSymbol,
        assetClass: "stock" as const,
        tradeCurrency,
        sourceTimestampText,
        sourceTimezone: mapping.sourceTimezone,
        timeParserVersion: "user_confirmed_local_datetime_v1",
        executedAtUtc,
        sourceOrderKey: `${executedAtUtc}|${normalizedContentIdentity}`,
        side,
        quantityDecimal,
        priceDecimal,
        feesDecimal,
        feeCurrency: feesDecimal === null ? null : tradeCurrency,
        feeSignConvention: feesDecimal === null ? "not_reported" as const : "cash_effect" as const,
        factCompleteness: priceDecimal === null ? "price_missing" as const : "complete" as const,
        providerExecutionIdentity,
        normalizedContentIdentity,
      }));
      classifications.set(record.recordOrdinal, "mapped_execution");
    } catch (error) {
      if (error instanceof TraderLinkPlatformError || error instanceof Error) {
        classifications.set(record.recordOrdinal, "needs_correction");
        const issueCode = error instanceof Error && error.message === "side_unmapped"
          ? "execution_side_unmapped"
          : error instanceof Error && error.message === "zero_quantity"
            ? "execution_zero_quantity"
            : error instanceof TraderLinkPlatformError &&
                error.safeContext.field === "sourceTimestampText"
              ? "execution_time_invalid"
              : error instanceof TraderLinkPlatformError &&
                  error.safeContext.field === "quantityDecimal"
                ? "execution_quantity_invalid"
                : error instanceof TraderLinkPlatformError &&
                    error.safeContext.field === "priceDecimal"
                  ? "execution_price_invalid"
                  : error instanceof TraderLinkPlatformError &&
                      error.safeContext.field === "feesDecimal"
                    ? "execution_fees_invalid"
                    : "execution_fact_invalid";
        issues.push(issue(record.recordOrdinal, issueCode, "warning"));
        continue;
      }
      throw error;
    }
  }
  if (executions.length === 0) {
    issues.push(issue(null, "mapped_statement_has_no_valid_executions", "error", true));
  }
  issues.push(issue(null, "statement_period_missing", "warning"));
  const occurrenceCounts = new Map<string, number>();
  const completeExecutions: JournalAdapterExecution[] = executions.map((execution) => {
    const contentOccurrenceOrdinal =
      (occurrenceCounts.get(execution.normalizedContentIdentity) ?? 0) + 1;
    occurrenceCounts.set(execution.normalizedContentIdentity, contentOccurrenceOrdinal);
    return Object.freeze({
      ...execution,
      contentOccurrenceOrdinal,
      sourceOrderKey: `${execution.executedAtUtc}|${execution.normalizedContentIdentity}|${String(contentOccurrenceOrdinal).padStart(8, "0")}`,
    });
  });
  const dates = completeExecutions.map((execution) =>
    dateAt(execution.executedAtUtc, mapping.sourceTimezone)).sort();
  const coverageIntervals: readonly JournalCoverageInterval[] = dates.length > 0
    ? Object.freeze([Object.freeze({
        assetClass: "stock" as const,
        coverageKind: "unknown" as const,
        localStartDate: dates[0]!,
        localEndDate: dates.at(-1)!,
        sourceTimezone: mapping.sourceTimezone,
      })])
    : Object.freeze([]);
  const rows: readonly JournalAdapterSourceRow[] = Object.freeze(records.map((record) =>
    Object.freeze({
      ...record,
      sectionName: mapping.tableKind === "sectioned" ? mapping.tableLabel : "Mapped statement",
      recordType: record.recordOrdinal === header.recordOrdinal
        ? "Header"
        : classifications.get(record.recordOrdinal) === "mapped_execution" ||
          classifications.get(record.recordOrdinal) === "needs_correction"
          ? "Data"
          : null,
      assetCategory: classifications.get(record.recordOrdinal) === "mapped_execution"
        ? "Stocks"
        : null,
      classification: classifications.get(record.recordOrdinal) ?? "automatic_non_execution",
    })));
  return Object.freeze({
    adapterId: JOURNAL_GENERIC_MAPPED_STATEMENT_ADAPTER_ID,
    adapterVersion: JOURNAL_GENERIC_MAPPED_STATEMENT_ADAPTER_VERSION,
    parserVersion: JOURNAL_GENERIC_MAPPED_STATEMENT_PARSER_VERSION,
    mappingVersion: JOURNAL_GENERIC_MAPPED_STATEMENT_MAPPING_VERSION,
    mappingContract: Object.freeze({
      ...mapping,
      brokerName: safeBrokerName(mapping.brokerName),
      orderedHeaders: Object.freeze([...mapping.orderedHeaders]),
      columns: Object.freeze({ ...mapping.columns }),
      sideValues: Object.freeze({
        buy: Object.freeze([...mapping.sideValues.buy]),
        sell: Object.freeze([...mapping.sideValues.sell]),
      }),
    }),
    sourceFileSha256: evidence.sha256,
    sourceFileSizeBytes: evidence.sizeBytes,
    statementPeriodStartDate: null,
    statementPeriodEndDate: null,
    sourceTimezone: mapping.sourceTimezone,
    rows,
    issues: Object.freeze(issues),
    coverageIntervals,
    executions: Object.freeze(completeExecutions),
    positionFacts: Object.freeze([] as []),
  });
}

export function mappingContractFromSupportTable(input: Readonly<{
  brokerName: string;
  sourceTimezone: string;
  defaultCurrency: string;
  table: JournalMappingSupportPackage["tables"][number];
  delimiter: JournalMappingSupportPackage["detectedDelimiter"];
  columns: Readonly<Partial<Record<JournalGenericMappingField, string>>>;
  buyValues?: readonly string[];
  sellValues?: readonly string[];
  feeSignConvention?: "cost_positive" | "cash_effect";
}>): JournalGenericStatementMappingContract {
  if (input.delimiter === "unknown") {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      reason: "delimiter_unknown",
    });
  }
  return Object.freeze({
    contractVersion: JOURNAL_GENERIC_MAPPED_STATEMENT_MAPPING_VERSION,
    brokerName: safeBrokerName(input.brokerName),
    structuralSignatureSha256: input.table.structuralSignatureSha256,
    delimiter: input.delimiter,
    tableKind: input.table.tableKind,
    tableLabel: input.table.tableLabel,
    headerRowIndex: input.table.headerRowIndex,
    orderedHeaders: Object.freeze([...input.table.headerLabels]),
    columns: Object.freeze({ ...input.columns }),
    sideValues: Object.freeze({
      buy: Object.freeze(input.buyValues?.length ? [...input.buyValues] : ["buy", "b"]),
      sell: Object.freeze(input.sellValues?.length ? [...input.sellValues] : ["sell", "s"]),
    }),
    defaultCurrency: normalizeJournalCurrency(input.defaultCurrency),
    feeSignConvention: input.feeSignConvention ?? "cost_positive",
    sourceTimezone: input.sourceTimezone,
  });
}
