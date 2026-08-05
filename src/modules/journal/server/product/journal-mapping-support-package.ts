import { createHash } from "node:crypto";

export type JournalMappingSupportPackage = Readonly<{
  contractVersion: "journal_statement_mapping_support_v1";
  brokerName: string;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
  detectedEncoding: "utf-8" | "unknown";
  detectedDelimiter: "comma" | "semicolon" | "tab" | "unknown";
  recordCount: number;
  recordShapeCounts: readonly Readonly<{
    fieldCount: number;
    recordCount: number;
  }>[];
  tables: readonly Readonly<{
    tableLabel: string;
    tableKind: "sectioned" | "tabular";
    headerRowIndex: number;
    structuralSignatureSha256: string;
    headerLabels: readonly string[];
    suggestedMapping: Readonly<Record<string, string>>;
    dataRowCount: number;
    columns: readonly Readonly<{
      label: string;
      emptyCount: number;
      nonEmptyCount: number;
      maximumLengthBucket: string;
      observedShapes: readonly string[];
    }>[];
  }>[];
  failureCode: string;
  privacy: Readonly<{
    rawValuesIncluded: false;
    rawRowsIncluded: false;
    originalFilenameIncluded: false;
    sourcePathIncluded: false;
  }>;
}>;

export type JournalMappingSupportPackageV2 = Readonly<{
  contractVersion: "journal_statement_mapping_support_v2";
  fileKind: "delimited_text";
  brokerLabel: string;
  detectedEncoding: "utf-8" | "unknown";
  detectedDelimiter: "comma" | "semicolon" | "tab" | "unknown";
  recordFieldCounts: readonly number[];
  tables: readonly Readonly<{
    ordinal: number;
    tableLabel: string;
    tableKind: "sectioned" | "tabular";
    headerRowIndex: number;
    structuralSignatureSha256: string;
    fieldCount: number;
    headerLabels: readonly string[];
    suggestedMapping: Readonly<Record<string, string>>;
  }>[];
  statementLayoutSignatureSha256: string | null;
  failureCategory:
    | "none"
    | "format_not_supported"
    | "parse_failed"
    | "mapping_failed"
    | "inspection_failed"
    | "privacy_review_required";
  privacy: Readonly<{
    privacyReviewRequired: boolean;
    brokerLabelReplaced: boolean;
    replacedLabelCount: number;
    rawValuesIncluded: false;
    rawRowsIncluded: false;
    originalFilenameIncluded: false;
    sourcePathIncluded: false;
    sourceFileHashIncluded: false;
    sourceFileSizeIncluded: false;
    dataDependentCountsIncluded: false;
  }>;
}>;

type ParsedRecord = readonly string[];

function safeBrokerName(value: string): string {
  const normalized = value.trim().replace(/[\u0000-\u001f\u007f]/gu, "");
  return normalized.length > 0 && normalized.length <= 120
    ? normalized
    : "Broker not specified";
}

function normalized(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "");
}

function looksLikeHeader(value: string): boolean {
  const text = value.trim();
  return text.length > 0 && text.length <= 120 && /[A-Za-z]/u.test(text) &&
    !/^[-+]?\d+(?:\.\d+)?$/u.test(text) &&
    !/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/u.test(text) &&
    !/@/u.test(text);
}

function safeHeader(value: string, index: number): string {
  const text = value.trim().replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ");
  return looksLikeHeader(text) ? text : `Column ${index + 1}`;
}

function normalizedHeader(value: string): string {
  return value.trim().normalize("NFKC").toLowerCase()
    .replace(/[^a-z0-9]+/gu, "");
}

const SAFE_HEADER_WORDS = new Set([
  "account", "action", "amount", "asset", "average", "avg", "balance",
  "broker", "buy", "cash", "charge", "charges", "commission", "comm",
  "contract", "cost", "currency", "cusip", "date", "datetime", "description",
  "direction", "exchange", "exec", "executed", "execution", "fee", "fees",
  "field", "fill", "filled", "gross", "header", "id", "identifier", "info",
  "information", "instrument", "isin", "market", "name", "net", "open",
  "order", "position", "price", "primary", "proceeds", "qty", "quantity", "reference",
  "row", "security", "section", "sell", "shares", "side", "statement",
  "stock", "symbol", "table", "ticker", "time", "total", "trade", "trades",
  "transaction", "type", "value",
]);

function hardenedLabel(value: string, fallback: string): Readonly<{
  label: string;
  replaced: boolean;
}> {
  const original = value.normalize("NFKC");
  const text = original.trim().replace(/\s+/gu, " ");
  const words = text.toLowerCase().match(/[a-z]+/gu) ?? [];
  const compactTokens = text.match(/[A-Za-z0-9]+/gu) ?? [];
  const unsafe =
    original !== original.replace(/[\u0000-\u001f\u007f]/gu, "") ||
    text.length < 1 ||
    text.length > 80 ||
    /^[=+\-@]/u.test(text) ||
    !/^[A-Za-z0-9][A-Za-z0-9 .,_()/&#%+\-]*$/u.test(text) ||
    /(?:https?:\/\/|www\.|mailto:|@[^ ]+\.|[A-Za-z]:\\|\\\\|\.\.\/)/iu.test(text) ||
    /^[-+]?\d+(?:\.\d+)?$/u.test(text) ||
    /\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b/u.test(text) ||
    /\d{4,}/u.test(text) ||
    compactTokens.some((token) =>
      /^[0-9a-f]{16,}$/iu.test(token) ||
      (/^[A-Z0-9]{4,}$/u.test(token) &&
        !SAFE_HEADER_WORDS.has(token.toLowerCase()))) ||
    words.length === 0 ||
    !words.some((word) => SAFE_HEADER_WORDS.has(word));
  return unsafe
    ? Object.freeze({ label: fallback, replaced: true })
    : Object.freeze({ label: text, replaced: false });
}

function hardenedBrokerLabel(value: string): Readonly<{
  label: string;
  replaced: boolean;
}> {
  const original = value.normalize("NFKC");
  const text = original.trim().replace(/\s+/gu, " ");
  const unsafe =
    original !== original.replace(/[\u0000-\u001f\u007f]/gu, "") ||
    text.length < 1 ||
    text.length > 80 ||
    /^[=+\-@]/u.test(text) ||
    !/^[A-Za-z0-9][A-Za-z0-9 .,&()'\-]*$/u.test(text) ||
    /(?:https?:\/\/|www\.|mailto:|@[^ ]+\.|[A-Za-z]:\\|\\\\|\.\.\/)/iu.test(text) ||
    /\d{4,}/u.test(text) ||
    text.match(/[A-Za-z]/gu)?.length === undefined;
  return unsafe
    ? Object.freeze({ label: "Broker not specified", replaced: true })
    : Object.freeze({ label: text, replaced: false });
}

function safeFailureCategory(
  failureCode: string,
): JournalMappingSupportPackageV2["failureCategory"] {
  if (failureCode === "none") return "none";
  if (failureCode.includes("PARSE")) return "parse_failed";
  if (failureCode.includes("MAPPING")) return "mapping_failed";
  if (failureCode === "format_not_supported") return "format_not_supported";
  return "inspection_failed";
}

export function journalStatementLayoutSignature(input: Readonly<{
  fileKind: JournalMappingSupportPackageV2["fileKind"];
  encoding: JournalMappingSupportPackageV2["detectedEncoding"];
  delimiter: JournalMappingSupportPackageV2["detectedDelimiter"];
  tables: JournalMappingSupportPackageV2["tables"];
  recordFieldCounts: readonly number[];
}>): string {
  const payload = [
    "journal_statement_mapping_support_v2",
    input.fileKind,
    input.encoding,
    input.delimiter === "unknown" ? null : input.delimiter,
    input.tables.map((table) => [
      table.ordinal,
      table.tableKind,
      table.structuralSignatureSha256,
    ]),
    [...new Set(input.recordFieldCounts)].sort((left, right) => left - right),
  ];
  return createHash("sha256")
    .update(`${JSON.stringify(payload)}\n`, "utf8")
    .digest("hex");
}

export function createJournalMappingSupportPackageV2(
  inspection: JournalMappingSupportPackage,
): JournalMappingSupportPackageV2 {
  const broker = hardenedBrokerLabel(inspection.brokerName);
  let replacedLabelCount = 0;
  const transformedTables = inspection.tables.map((table, tableIndex) => {
    const tableLabel = hardenedLabel(table.tableLabel, `Section ${tableIndex + 1}`);
    if (tableLabel.replaced) replacedLabelCount += 1;
    const headers = table.headerLabels.map((label, columnIndex) => {
      const hardened = hardenedLabel(label, `Column ${columnIndex + 1}`);
      if (hardened.replaced) replacedLabelCount += 1;
      return hardened.label;
    });
    const structuralSignatureSha256 = journalStatementStructuralSignature({
      delimiter: inspection.detectedDelimiter,
      tableKind: table.tableKind,
      tableLabel: tableLabel.label,
      headerLabels: headers,
    });
    return Object.freeze({
      ordinal: tableIndex + 1,
      tableLabel: tableLabel.label,
      tableKind: table.tableKind,
      headerRowIndex: table.headerRowIndex,
      structuralSignatureSha256,
      fieldCount: headers.length,
      headerLabels: Object.freeze(headers),
      suggestedMapping: suggestedMapping(headers),
    });
  });
  const tables = Object.freeze(transformedTables);
  const recordFieldCounts = Object.freeze(inspection.recordShapeCounts
    .map((shapeEntry) => shapeEntry.fieldCount)
    .filter((fieldCount, index, values) => values.indexOf(fieldCount) === index)
    .sort((left, right) => left - right));
  const privacyReviewRequired =
    replacedLabelCount > 0 ||
    inspection.detectedEncoding !== "utf-8" ||
    inspection.detectedDelimiter === "unknown" ||
    tables.length === 0;
  const failureCategory = privacyReviewRequired
    ? "privacy_review_required" as const
    : safeFailureCategory(inspection.failureCode);
  const result: JournalMappingSupportPackageV2 = Object.freeze({
    contractVersion: "journal_statement_mapping_support_v2" as const,
    fileKind: "delimited_text" as const,
    brokerLabel: broker.label,
    detectedEncoding: inspection.detectedEncoding,
    detectedDelimiter: inspection.detectedDelimiter,
    recordFieldCounts,
    tables,
    statementLayoutSignatureSha256: privacyReviewRequired
      ? null
      : journalStatementLayoutSignature({
          fileKind: "delimited_text",
          encoding: inspection.detectedEncoding,
          delimiter: inspection.detectedDelimiter,
          tables,
          recordFieldCounts,
        }),
    failureCategory,
    privacy: Object.freeze({
      privacyReviewRequired,
      brokerLabelReplaced: broker.replaced,
      replacedLabelCount,
      rawValuesIncluded: false as const,
      rawRowsIncluded: false as const,
      originalFilenameIncluded: false as const,
      sourcePathIncluded: false as const,
      sourceFileHashIncluded: false as const,
      sourceFileSizeIncluded: false as const,
      dataDependentCountsIncluded: false as const,
    }),
  });
  assertJournalMappingSupportPackageV2Privacy(result);
  return result;
}

export function assertJournalMappingSupportPackageV2Privacy(
  value: JournalMappingSupportPackageV2,
): void {
  const serialized = JSON.stringify(value);
  if (
    serialized.length > 256_000 ||
    /"(?:sourceFileSha256|sourceFileSizeBytes|recordCount|dataRowCount|emptyCount|nonEmptyCount)"/u
      .test(serialized) ||
    value.tables.length > 200 ||
    value.recordFieldCounts.some((fieldCount) =>
      !Number.isSafeInteger(fieldCount) || fieldCount < 1 || fieldCount > 4096) ||
    value.tables.some((table, tableIndex) =>
      table.ordinal !== tableIndex + 1 ||
      table.fieldCount !== table.headerLabels.length ||
      !/^[0-9a-f]{64}$/u.test(table.structuralSignatureSha256) ||
      table.headerLabels.some((label, columnIndex) => {
        const hardened = hardenedLabel(label, `Column ${columnIndex + 1}`);
        return hardened.replaced && label !== `Column ${columnIndex + 1}`;
      })) ||
    (value.statementLayoutSignatureSha256 !== null &&
      !/^[0-9a-f]{64}$/u.test(value.statementLayoutSignatureSha256))
  ) {
    throw new Error("TRADERLINK_JOURNAL_MAPPING_SUPPORT_PRIVACY_FAILED");
  }
}

export function restoreJournalInternalMappingContractFromV2(
  value: unknown,
  inspection: JournalMappingSupportPackage,
  browserPackage: JournalMappingSupportPackageV2,
): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const browserTable = browserPackage.tables.find((table) =>
    table.structuralSignatureSha256 === record.structuralSignatureSha256 &&
    table.tableKind === record.tableKind &&
    table.headerRowIndex === record.headerRowIndex);
  if (!browserTable) return value;
  const internalTable = inspection.tables[browserTable.ordinal - 1];
  if (!internalTable || !record.columns || typeof record.columns !== "object" ||
    Array.isArray(record.columns)) return value;
  const internalByBrowserLabel = new Map(
    browserTable.headerLabels.map((label, index) => [
      normalizedHeader(label),
      internalTable.headerLabels[index],
    ]),
  );
  const restoredColumns = Object.fromEntries(
    Object.entries(record.columns as Record<string, unknown>).map(([field, label]) => [
      field,
      typeof label === "string"
        ? internalByBrowserLabel.get(normalizedHeader(label)) ?? label
        : label,
    ]),
  );
  return Object.freeze({
    ...record,
    structuralSignatureSha256: internalTable.structuralSignatureSha256,
    tableLabel: internalTable.tableLabel,
    orderedHeaders: Object.freeze([...internalTable.headerLabels]),
    columns: Object.freeze(restoredColumns),
  });
}

export function sanitizeJournalInternalMappingContractForV2(
  value: unknown,
  inspection: JournalMappingSupportPackage,
  browserPackage: JournalMappingSupportPackageV2,
): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const internalTableIndex = inspection.tables.findIndex((table) =>
    table.structuralSignatureSha256 === record.structuralSignatureSha256 &&
    table.tableKind === record.tableKind &&
    table.headerRowIndex === record.headerRowIndex);
  if (internalTableIndex < 0) return value;
  const internalTable = inspection.tables[internalTableIndex];
  const browserTable = browserPackage.tables[internalTableIndex];
  if (!internalTable || !browserTable || !record.columns ||
    typeof record.columns !== "object" || Array.isArray(record.columns)) return value;
  const browserByInternalLabel = new Map(
    internalTable.headerLabels.map((label, index) => [
      normalizedHeader(label),
      browserTable.headerLabels[index],
    ]),
  );
  const sanitizedColumns = Object.fromEntries(
    Object.entries(record.columns as Record<string, unknown>).map(([field, label]) => [
      field,
      typeof label === "string"
        ? browserByInternalLabel.get(normalizedHeader(label)) ?? `Column`
        : label,
    ]),
  );
  return Object.freeze({
    ...record,
    brokerName: browserPackage.brokerLabel,
    structuralSignatureSha256: browserTable.structuralSignatureSha256,
    tableLabel: browserTable.tableLabel,
    orderedHeaders: Object.freeze([...browserTable.headerLabels]),
    columns: Object.freeze(sanitizedColumns),
  });
}

function suggestedMapping(labels: readonly string[]): Readonly<Record<string, string>> {
  const hints: Readonly<Record<string, readonly string[]>> = Object.freeze({
    symbol: Object.freeze(["symbol", "ticker", "stock", "security", "instrument"]),
    timestamp: Object.freeze(["timestamp", "datetime", "tradetime", "executiontime", "filltime"]),
    date: Object.freeze(["date", "tradedate", "executiondate", "filldate"]),
    time: Object.freeze(["time", "tradetime", "executiontime", "filltime"]),
    side: Object.freeze(["side", "action", "direction", "buysell", "instruction"]),
    quantity: Object.freeze(["quantity", "qty", "shares", "filledqty", "executedqty"]),
    price: Object.freeze(["price", "fillprice", "executionprice", "averageprice", "avgprice"]),
    currency: Object.freeze(["currency", "curr", "ccy"]),
    fees: Object.freeze(["fee", "fees", "commission", "charges", "costs"]),
    executionId: Object.freeze(["executionid", "execid", "tradeid", "fillid", "transactionid"]),
  });
  const output: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(hints)) {
    const match = labels.find((label) => aliases.includes(normalizedHeader(label)));
    if (match) output[field] = match;
  }
  return Object.freeze(output);
}

export function journalStatementStructuralSignature(input: Readonly<{
  delimiter: JournalMappingSupportPackage["detectedDelimiter"];
  tableKind: "sectioned" | "tabular";
  tableLabel: string;
  headerLabels: readonly string[];
}>): string {
  return createHash("sha256").update(`${JSON.stringify([
    "journal_statement_structure_v1",
    input.delimiter,
    input.tableKind,
    normalizedHeader(input.tableLabel),
    input.headerLabels.map(normalizedHeader),
  ])}\n`, "utf8").digest("hex");
}

function delimiterName(delimiter: string | null): JournalMappingSupportPackage["detectedDelimiter"] {
  if (delimiter === ",") return "comma";
  if (delimiter === ";") return "semicolon";
  if (delimiter === "\t") return "tab";
  return "unknown";
}

function delimiterCount(line: string, delimiter: string): number {
  let quoted = false;
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"') {
      if (quoted && line[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && line[index] === delimiter) count += 1;
  }
  return count;
}

function detectDelimiter(text: string): string | null {
  const lines = text.split(/\r?\n/u).filter((line) => line.trim()).slice(0, 20);
  const candidates = [",", ";", "\t"];
  const scores = candidates.map((delimiter) => ({
    delimiter,
    score: lines.reduce((sum, line) => sum + delimiterCount(line, delimiter), 0),
  })).sort((left, right) => right.score - left.score);
  return scores[0] && scores[0].score > 0 ? scores[0].delimiter : null;
}

function parse(text: string, delimiter: string): readonly ParsedRecord[] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
      continue;
    }
    if (character === '"' && field.length === 0) quoted = true;
    else if (character === delimiter) {
      record.push(field);
      field = "";
    } else if (character === "\r" || character === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else field += character;
  }
  if (quoted) throw new Error("unterminated_quote");
  if (field.length > 0 || record.length > 0) records.push([...record, field]);
  return Object.freeze(records.map((item) => Object.freeze(item)));
}

function shape(value: string): string {
  const text = value.trim();
  if (/^[-+]?\d+$/u.test(text)) return "integer";
  if (/^[-+]?(?:\d+\.\d+|\.\d+)$/u.test(text)) return "decimal";
  if (/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}[ T,]+\d{1,2}:\d{2}/u.test(text)) return "date_time";
  if (/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/u.test(text)) return "date";
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/u.test(text)) return "time";
  if (/^[A-Z]{3}$/u.test(text)) return "three_letter_code";
  if (/^(?:buy|sell|b|s)$/iu.test(text)) return "trade_side_token";
  if (/^[A-Za-z0-9_-]+$/u.test(text)) return "identifier_or_text";
  return "text";
}

function lengthBucket(length: number): string {
  if (length <= 8) return "0-8";
  if (length <= 16) return "9-16";
  if (length <= 32) return "17-32";
  if (length <= 64) return "33-64";
  return "65+";
}

function tableProfile(
  tableLabel: string,
  tableKind: "sectioned" | "tabular",
  headerRowIndex: number,
  delimiter: JournalMappingSupportPackage["detectedDelimiter"],
  headerValues: readonly string[],
  rows: readonly ParsedRecord[],
  offset: number,
): JournalMappingSupportPackage["tables"][number] {
  const labels = headerValues.map(safeHeader);
  return Object.freeze({
    tableLabel,
    tableKind,
    headerRowIndex,
    structuralSignatureSha256: journalStatementStructuralSignature({
      delimiter,
      tableKind,
      tableLabel,
      headerLabels: labels,
    }),
    headerLabels: Object.freeze(labels),
    suggestedMapping: suggestedMapping(labels),
    dataRowCount: rows.length,
    columns: Object.freeze(labels.map((label, index) => {
      const values = rows.map((row) => row[index + offset]?.trim() ?? "");
      const nonEmpty = values.filter(Boolean);
      return Object.freeze({
        label,
        emptyCount: values.length - nonEmpty.length,
        nonEmptyCount: nonEmpty.length,
        maximumLengthBucket: lengthBucket(
          nonEmpty.reduce((maximum, value) => Math.max(maximum, value.length), 0),
        ),
        observedShapes: Object.freeze([...new Set(nonEmpty.map(shape))].sort()),
      });
    })),
  });
}

function tables(
  records: readonly ParsedRecord[],
  delimiter: JournalMappingSupportPackage["detectedDelimiter"],
): JournalMappingSupportPackage["tables"] {
  const sectionHeaders = records.map((record, headerRowIndex) => ({ record, headerRowIndex }))
    .filter(({ record }) => normalized(record[1] ?? "") === "header" && record.length > 2);
  if (sectionHeaders.length > 0) {
    return Object.freeze(sectionHeaders.slice(0, 200).map(({ record: header, headerRowIndex }, index) => {
      const section = header[0] ?? "";
      const data = records.filter((record) =>
        record[0] === section && normalized(record[1] ?? "") === "data");
      return tableProfile(
        looksLikeHeader(section) ? safeHeader(section, index) : `Section ${index + 1}`,
        "sectioned",
        headerRowIndex,
        delimiter,
        header.slice(2),
        data,
        2,
      );
    }));
  }
  const headerIndex = records.findIndex((record) =>
    record.length > 1 && record.filter(looksLikeHeader).length / record.length >= 0.6);
  if (headerIndex < 0) return Object.freeze([]);
  const header = records[headerIndex];
  const data = records.slice(headerIndex + 1).filter((record) =>
    record.length === header.length);
  return Object.freeze([tableProfile(
    "Primary table",
    "tabular",
    headerIndex,
    delimiter,
    header,
    data,
    0,
  )]);
}

export function createJournalMappingSupportPackage(input: Readonly<{
  sourceBytes: Uint8Array;
  brokerName: string;
  failureCode: string;
}>): JournalMappingSupportPackage {
  const sourceFileSha256 = createHash("sha256").update(input.sourceBytes).digest("hex");
  let encoding: JournalMappingSupportPackage["detectedEncoding"] = "unknown";
  let delimiter: string | null = null;
  let records: readonly ParsedRecord[] = Object.freeze([]);
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(input.sourceBytes);
    encoding = "utf-8";
    delimiter = detectDelimiter(text);
    if (delimiter) records = parse(text, delimiter);
  } catch {
    records = Object.freeze([]);
  }
  const shapeCounts = new Map<number, number>();
  for (const record of records) {
    shapeCounts.set(record.length, (shapeCounts.get(record.length) ?? 0) + 1);
  }
  return Object.freeze({
    contractVersion: "journal_statement_mapping_support_v1" as const,
    brokerName: safeBrokerName(input.brokerName),
    sourceFileSha256,
    sourceFileSizeBytes: input.sourceBytes.byteLength,
    detectedEncoding: encoding,
    detectedDelimiter: delimiterName(delimiter),
    recordCount: records.length,
    recordShapeCounts: Object.freeze([...shapeCounts.entries()]
      .sort(([left], [right]) => left - right)
      .map(([fieldCount, recordCount]) => Object.freeze({ fieldCount, recordCount }))),
    tables: tables(records, delimiterName(delimiter)),
    failureCode: input.failureCode,
    privacy: Object.freeze({
      rawValuesIncluded: false as const,
      rawRowsIncluded: false as const,
      originalFilenameIncluded: false as const,
      sourcePathIncluded: false as const,
    }),
  });
}
