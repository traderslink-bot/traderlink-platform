export type ParserHardeningReasonCode =
  | "ti_v3_parser_duplicate_raw_header"
  | "ti_v3_parser_duplicate_normalized_header"
  | "ti_v3_parser_mapping_collision"
  | "ti_v3_parser_unclosed_quote"
  | "ti_v3_parser_inconsistent_row_width"
  | "ti_v3_parser_unsupported_encoding"
  | "ti_v3_parser_control_character"
  | "ti_v3_parser_oversized_cell"
  | "ti_v3_parser_ambiguous_delimiter"
  | "ti_v3_parser_conflicting_duplicate_execution_id"
  | "ti_v3_parser_payload_oversized";

export interface ParserHardeningIssue {
  readonly code: ParserHardeningReasonCode;
  readonly rowIndex?: number;
  readonly field?: string;
}

export interface ParserHardeningResult {
  readonly ok: boolean;
  readonly delimiter: "," | ";" | "\t" | null;
  readonly issues: readonly ParserHardeningIssue[];
}

export const PARSER_MAX_PAYLOAD_BYTES = 10_000_000;
const MAX_CELL_LENGTH = 100_000;

function exceedsUtf8Limit(text: string): boolean {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length && text.charCodeAt(index + 1) >= 0xdc00 && text.charCodeAt(index + 1) <= 0xdfff) { bytes += 4; index += 1; }
    else bytes += 3;
    if (bytes > PARSER_MAX_PAYLOAD_BYTES) return true;
  }
  return false;
}

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[$#]/g, "").replace(/[^a-z0-9]+/g, "");
}

function delimiterCount(line: string, delimiter: "," | ";" | "\t"): number {
  let count = 0;
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"') {
      if (quoted && line[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (line[index] === delimiter && !quoted) count += 1;
  }
  return count;
}

function chooseDelimiter(text: string): { readonly delimiter: "," | ";" | "\t" | null; readonly ambiguous: boolean } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "").slice(0, 8);
  const scored = ([",", ";", "\t"] as const).map((delimiter) => ({ delimiter, score: lines.reduce((total, line) => total + delimiterCount(line, delimiter), 0) })).sort((left, right) => right.score - left.score);
  if (!scored[0] || scored[0].score === 0) return { delimiter: null, ambiguous: false };
  return { delimiter: scored[0].delimiter, ambiguous: scored[1]?.score === scored[0].score };
}

function parseStrictRows(text: string, delimiter: "," | ";" | "\t", issues: ParserHardeningIssue[]): string[][] | null {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"') {
      if (quoted && next === '"') {
        if (cell.length >= MAX_CELL_LENGTH) {
          issues.push({ code: "ti_v3_parser_oversized_cell", rowIndex: rows.length + 1 });
          return null;
        }
        cell += '"';
        index += 1;
      }
      else quoted = !quoted;
      continue;
    }
    if (character === delimiter && !quoted) { row.push(cell); cell = ""; continue; }
    if ((character === "\r" || character === "\n") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = ""; continue;
    }
    if (cell.length >= MAX_CELL_LENGTH) {
      issues.push({ code: "ti_v3_parser_oversized_cell", rowIndex: rows.length + 1 });
      return null;
    }
    cell += character;
  }
  if (quoted) issues.push({ code: "ti_v3_parser_unclosed_quote", rowIndex: rows.length + 1 });
  row.push(cell); rows.push(row);
  return rows.filter((value) => value.some((entry) => entry.trim() !== ""));
}

export function validateParserHardeningInput(input: string | Uint8Array, columnMapping: Readonly<Record<string, string | readonly string[] | undefined>> = {}): ParserHardeningResult {
  const issues: ParserHardeningIssue[] = [];
  let text: string;
  if (typeof input === "string") {
    if (input.length > PARSER_MAX_PAYLOAD_BYTES || exceedsUtf8Limit(input)) {
      return { ok: false, delimiter: null, issues: Object.freeze([{ code: "ti_v3_parser_payload_oversized" }]) };
    }
    text = input;
  } else {
    if (input.length > PARSER_MAX_PAYLOAD_BYTES) {
      return { ok: false, delimiter: null, issues: Object.freeze([{ code: "ti_v3_parser_payload_oversized" }]) };
    }
    if ((input[0] === 0xff && input[1] === 0xfe) || (input[0] === 0xfe && input[1] === 0xff)) {
      issues.push({ code: "ti_v3_parser_unsupported_encoding" });
      return { ok: false, delimiter: null, issues: Object.freeze(issues) };
    }
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(input); }
    catch { issues.push({ code: "ti_v3_parser_unsupported_encoding" }); return { ok: false, delimiter: null, issues: Object.freeze(issues) }; }
  }
  if (/[^\t\r\n\u0020-\u007e\u00a0-\uffff]/u.test(text)) issues.push({ code: "ti_v3_parser_control_character" });
  const selected = chooseDelimiter(text);
  if (selected.ambiguous) issues.push({ code: "ti_v3_parser_ambiguous_delimiter" });
  if (selected.delimiter === null) return { ok: issues.length === 0, delimiter: null, issues: Object.freeze(issues) };
  const rows = parseStrictRows(text, selected.delimiter, issues);
  if (rows === null) return { ok: false, delimiter: selected.delimiter, issues: Object.freeze(issues) };
  const headerIndex = rows.findIndex((row) => {
    const normalized = row.map(normalizeHeader);
    return normalized.some((value) => ["symbol", "ticker", "instrument", "instrumentcode"].includes(value)) &&
      normalized.some((value) => ["quantity", "qty", "shares", "filledqty"].includes(value)) &&
      normalized.some((value) => ["price", "tradeprice", "tprice", "avgprice", "filledprice"].includes(value));
  });
  const resolvedHeaderIndex = headerIndex < 0 ? 0 : headerIndex;
  const headers = rows[resolvedHeaderIndex] ?? [];
  const rawSeen = new Set<string>();
  const normalizedSeen = new Set<string>();
  headers.forEach((header) => {
    const raw = header.replace(/^\uFEFF/, "").trim();
    const normalized = normalizeHeader(header);
    if (rawSeen.has(raw)) issues.push({ code: "ti_v3_parser_duplicate_raw_header", field: raw });
    if (normalizedSeen.has(normalized)) issues.push({ code: "ti_v3_parser_duplicate_normalized_header", field: normalized });
    rawSeen.add(raw); normalizedSeen.add(normalized);
  });
  const mappingOwner = new Map<string, string>();
  for (const [field, aliases] of Object.entries(columnMapping)) {
    const values = Array.isArray(aliases) ? aliases : typeof aliases === "string" ? [aliases] : [];
    for (const alias of values) {
      const normalized = normalizeHeader(alias);
      const owner = mappingOwner.get(normalized);
      if (owner !== undefined && owner !== field) issues.push({ code: "ti_v3_parser_mapping_collision", field: normalized });
      mappingOwner.set(normalized, field);
    }
  }
  const isSectionedReport = normalizeHeader(headers[1] ?? "") === "header";
  const dataRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row, index }) => index > resolvedHeaderIndex && (!isSectionedReport || (row[0]?.trim() === headers[0]?.trim() && normalizeHeader(row[1] ?? "") === "data")));
  for (const { row, index } of dataRows) {
    if (row.length !== headers.length) issues.push({ code: "ti_v3_parser_inconsistent_row_width", rowIndex: index + 1 });
  }
  const executionIndex = headers.findIndex((header) => ["executionid", "execid", "tradeid", "brokerexecutionid"].includes(normalizeHeader(header)));
  if (executionIndex >= 0) {
    const seen = new Map<string, string>();
    for (const { row, index } of dataRows) {
      const id = row[executionIndex]?.trim();
      if (!id) continue;
      const canonicalRow = JSON.stringify(row);
      const prior = seen.get(id);
      if (prior !== undefined && prior !== canonicalRow) issues.push({ code: "ti_v3_parser_conflicting_duplicate_execution_id", rowIndex: index + 1, field: "executionId" });
      seen.set(id, canonicalRow);
    }
  }
  return { ok: issues.length === 0, delimiter: selected.delimiter, issues: Object.freeze(issues) };
}
