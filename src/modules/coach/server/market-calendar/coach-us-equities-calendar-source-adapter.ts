import { createHash } from "node:crypto";

export const COACH_NASDAQ_CALENDAR_URL =
  "https://www.nasdaqtrader.com/Trader.aspx?id=Calendar" as const;
export const COACH_NYSE_CALENDAR_URL =
  "https://www.nyse.com/trade/hours-calendars" as const;

const MAX_SOURCE_BYTES = 1_000_000;
const SOURCE_TIMEOUT_MS = 10_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const MONTHS = Object.freeze(new Map([
  ["january", 1], ["february", 2], ["march", 3], ["april", 4],
  ["may", 5], ["june", 6], ["july", 7], ["august", 8],
  ["september", 9], ["october", 10], ["november", 11], ["december", 12],
]));

export type CoachOfficialCalendarSourceDocument = Readonly<{
  url: typeof COACH_NASDAQ_CALENDAR_URL | typeof COACH_NYSE_CALENDAR_URL;
  contentSha256: string;
  html: string;
}>;

export type CoachParsedOfficialCalendarYear = Readonly<{
  targetYear: number;
  closedDates: readonly string[];
  earlyCloseDates: readonly string[];
  normalizedCalendarSha256: string;
}>;

export class CoachCalendarSourceError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CoachCalendarSourceError";
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;|&#160;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;|&#34;/giu, '"')
    .replace(/&apos;|&#39;/giu, "'")
    .replace(/&ndash;|&#8211;/giu, "-")
    .replace(/&mdash;|&#8212;/giu, "-")
    .replace(/&rsquo;|&#8217;/giu, "'")
    .replace(/&lsquo;|&#8216;/giu, "'")
    .replace(/&#(\d+);/gu, (_match, decimal: string) =>
      String.fromCodePoint(Number(decimal)))
    .replace(/&#x([0-9a-f]+);/giu, (_match, hexadecimal: string) =>
      String.fromCodePoint(Number.parseInt(hexadecimal, 16)));
}

function plainText(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/gu, " "))
    .replace(/\s+/gu, " ")
    .trim();
}

function textLines(html: string): readonly string[] {
  return Object.freeze(decodeEntities(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
    .replace(/<\/(?:p|div|li|tr|h[1-6])>|<br\s*\/?>/giu, "\n")
    .replace(/<[^>]+>/gu, " "))
    .split(/\r?\n/gu)
    .map((line) => line.replace(/\s+/gu, " ").trim())
    .filter(Boolean));
}

function tableRows(html: string): readonly (readonly string[])[] {
  return Object.freeze(Array.from(html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/giu))
    .map((row) => Object.freeze(Array.from(row[1]!.matchAll(
      /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/giu,
    )).map((cell) => plainText(cell[1]!))))
    .filter((row) => row.length > 0));
}

function isoDate(year: number, month: number, day: number): string | null {
  const value = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const instant = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(instant.getTime()) && instant.toISOString().slice(0, 10) === value
    ? value
    : null;
}

function explicitDates(value: string, targetYear: number): readonly string[] {
  const dates = new Set<string>();
  const pattern = /(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/giu;
  for (const match of value.matchAll(pattern)) {
    const year = Number(match[3]);
    if (year !== targetYear) continue;
    const month = MONTHS.get(match[1]!.toLowerCase());
    const date = month ? isoDate(year, month, Number(match[2])) : null;
    if (date) dates.add(date);
  }
  return Object.freeze([...dates].sort());
}

function explicitMonthDay(value: string, targetYear: number): string | null {
  const match = value.match(/(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:\D|$)/iu);
  if (!match) return null;
  const month = MONTHS.get(match[1]!.toLowerCase());
  return month ? isoDate(targetYear, month, Number(match[2])) : null;
}

function normalizedResult(
  targetYear: number,
  closedDatesInput: Iterable<string>,
  earlyCloseDatesInput: Iterable<string>,
): CoachParsedOfficialCalendarYear {
  const closedDates = Object.freeze([...new Set(closedDatesInput)].sort());
  const earlyCloseDates = Object.freeze([...new Set(earlyCloseDatesInput)].sort());
  if (closedDates.length < 9 || closedDates.length > 12 ||
      earlyCloseDates.length < 1 || earlyCloseDates.length > 4 ||
      earlyCloseDates.some((date) => closedDates.includes(date))) {
    throw new CoachCalendarSourceError("CALENDAR_SOURCE_SHAPE_INVALID");
  }
  const normalizedCalendarSha256 = sha256(JSON.stringify({
    targetYear,
    closedDates,
    earlyCloseDates,
  }));
  return Object.freeze({
    targetYear,
    closedDates,
    earlyCloseDates,
    normalizedCalendarSha256,
  });
}

export function parseCoachNasdaqCalendarYear(
  html: string,
  targetYear: number,
): CoachParsedOfficialCalendarYear {
  const pageText = plainText(html);
  if (!new RegExp(`Holiday Schedule\\s+${targetYear}(?:\\D|$)`, "iu").test(pageText)) {
    throw new CoachCalendarSourceError("NASDAQ_TARGET_YEAR_UNAVAILABLE");
  }
  const closedDates = new Set<string>();
  const earlyCloseDates = new Set<string>();
  for (const cells of tableRows(html)) {
    const rowText = cells.join(" | ");
    const dates = explicitDates(rowText, targetYear);
    if (dates.length !== 1) continue;
    if (/\bclosed\b/iu.test(rowText)) closedDates.add(dates[0]!);
    else if (/early\s+close/iu.test(rowText) && /1\s*:\s*00\s*p\.?m\.?/iu.test(rowText)) {
      earlyCloseDates.add(dates[0]!);
    }
  }
  return normalizedResult(targetYear, closedDates, earlyCloseDates);
}

export function parseCoachNyseCalendarYear(
  html: string,
  targetYear: number,
): CoachParsedOfficialCalendarYear {
  const rows = tableRows(html);
  const header = rows.find((row) => row.includes(String(targetYear)) &&
    row.some((cell) => /^holiday$/iu.test(cell)));
  const yearColumn = header?.findIndex((cell) => cell === String(targetYear)) ?? -1;
  if (!header || yearColumn < 1) {
    throw new CoachCalendarSourceError("NYSE_TARGET_YEAR_UNAVAILABLE");
  }
  const closedDates = new Set<string>();
  for (const cells of rows) {
    const value = cells[yearColumn];
    if (!value) continue;
    const date = explicitMonthDay(value, targetYear);
    if (date) closedDates.add(date);
  }
  const earlyCloseDates = new Set<string>();
  for (const line of textLines(html)) {
    if (!/will\s+close\s+early\s+at\s+1\s*:\s*00\s*p\.?m\.?/iu.test(line)) continue;
    for (const date of explicitDates(line, targetYear)) earlyCloseDates.add(date);
  }
  return normalizedResult(targetYear, closedDates, earlyCloseDates);
}

function allowedFinalUrl(requestedUrl: string, finalUrl: string): boolean {
  try {
    const requested = new URL(requestedUrl);
    const final = new URL(finalUrl);
    return final.protocol === "https:" && final.hostname === requested.hostname;
  } catch {
    return false;
  }
}

async function readBoundedResponseBytes(response: Response): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) throw new CoachCalendarSourceError("CALENDAR_SOURCE_RESPONSE_REJECTED");
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      byteLength += result.value.byteLength;
      if (byteLength > MAX_SOURCE_BYTES) {
        throw new CoachCalendarSourceError("CALENDAR_SOURCE_RESPONSE_REJECTED");
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }
  if (byteLength === 0) {
    throw new CoachCalendarSourceError("CALENDAR_SOURCE_RESPONSE_REJECTED");
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function fetchCoachOfficialCalendarSource(
  url: CoachOfficialCalendarSourceDocument["url"],
  fetcher: typeof fetch = fetch,
): Promise<CoachOfficialCalendarSourceDocument> {
  let response: Response;
  try {
    response = await fetcher(url, {
      cache: "no-store",
      headers: { accept: "text/html", "user-agent": "TraderLink-Calendar-Verification/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    });
  } catch {
    throw new CoachCalendarSourceError("CALENDAR_SOURCE_FETCH_FAILED");
  }
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (!response.ok || !contentType.includes("text/html") ||
      (declaredLength > 0 && declaredLength > MAX_SOURCE_BYTES) ||
      !allowedFinalUrl(url, response.url || url)) {
    throw new CoachCalendarSourceError("CALENDAR_SOURCE_RESPONSE_REJECTED");
  }
  const bytes = await readBoundedResponseBytes(response);
  const html = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return Object.freeze({ url, contentSha256: sha256(html), html });
}
