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
