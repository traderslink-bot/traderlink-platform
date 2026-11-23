import type { ScannerSecurityType } from "../security-types";
import { validDate } from "../universe-validation";

const root = "https://www.nasdaqtrader.com/dynamic/SymDir/";
const types: ReadonlyArray<readonly [RegExp, ScannerSecurityType]> = [
  [/^(?:common stock|common shares?)\b/iu, "COMMON"],
  [/^ordinary shares?\b/iu, "ORDINARY"],
  [/^(?:american deposit[ao]ry (?:shares?|receipts?)|ADSs?|ADRs?)\b/iu, "DEPOSITARY"],
  [/^preferred (?:stock|shares?)\b/iu, "PREFERRED"],
  [/^warrants?\b/iu, "WARRANT"],
  [/^rights?\b/iu, "RIGHT"],
  [/^units?\b/iu, "UNIT"],
];
const equityTypeSuffix = /\b(common stock|common shares?|ordinary shares?|american deposit[ao]ry (?:shares?|receipts?))(?: of beneficial interest)?\s*$/iu;
const underlyingSecurity = /\b(?:warrants?|rights?|units?|options?|notes?)\b.*\b(?:purchase|buy|acquire|subscribe|exercisable|representing|consisting|convertible)\b/iu;

function listingType(name: string, etf: string): ScannerSecurityType | undefined {
  if (etf === "Y") return "ETF";
  if (etf !== "N") return;
  const separator = name.lastIndexOf(" - ");
  if (separator < 0 && underlyingSecurity.test(name)) return;
  const description = separator >= 0
    ? name.slice(separator + 3).trim().replace(/^(?:(?:class|series) [A-Z\d-]+ )?(?:non-voting )?/iu, "")
    : equityTypeSuffix.exec(name)?.[1];
  if (!description) return;
  return types.find(([pattern]) => pattern.test(description))?.[1];
}

export function parseNasdaqSecurityTypes(body: string, file: "nasdaqlisted" | "otherlisted", date: string) {
  if (Buffer.byteLength(body) > 2_000_000) throw Error("listing_directory_size");
  const lines = body.trim().split(/\r?\n/u);
  const nasdaq = file === "nasdaqlisted";
  const header = nasdaq ? "Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares"
    : "ACT Symbol|Security Name|Exchange|CQS Symbol|ETF|Round Lot Size|Test Issue|NASDAQ Symbol";
  const footer = /^File Creation Time: (\d{2})(\d{2})(\d{4})\d{2}:\d{2}\|/u.exec(lines.at(-1) ?? "");
  if (lines[0] !== header || !footer || lines.length > 20_000) throw Error("listing_directory_format");
  const created = `${footer[3]}-${footer[1]}-${footer[2]}`;
  const daysOld = (Date.parse(date) - Date.parse(created)) / 86_400_000;
  if (!validDate(created) || !validDate(date) || daysOld < 0 || daysOld > 7) throw Error("listing_directory_stale");
  const entries = new Map<string, ScannerSecurityType | undefined>();
  for (const line of lines.slice(1, -1)) {
    const fields = line.split("|");
    if (fields.length !== 8) throw Error("listing_directory_format");
    if (fields[nasdaq ? 3 : 6] !== "N") continue;
    const exchange = nasdaq ? "NASDAQ" : fields[2] === "A" ? "AMEX" : fields[2] === "N" ? "NYSE" : undefined;
    if (!exchange) continue;
    const type = listingType(fields[1], fields[nasdaq ? 6 : 4]);
    for (const symbol of nasdaq ? [fields[0]] : [fields[3], fields[7]]) {
      if (!/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol)) continue;
      const key = exchange + "/" + symbol;
      entries.set(key, entries.has(key) && entries.get(key) !== type ? undefined : type);
    }
  }
  return entries;
}

export async function readNasdaqSecurityTypes(date: string, request: typeof fetch) {
  const names = ["nasdaqlisted", "otherlisted"] as const;
  const sources = await Promise.allSettled(names.map(async file => {
    const response = await request(root + file + ".txt", {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) throw Error("listing_directory_unavailable");
    return parseNasdaqSecurityTypes(await response.text(), file, date);
  }));
  return new Map(sources.flatMap(source => source.status === "fulfilled" ? [...source.value] : []));
}
