export const NEWS_FILTERS_FEATURE = "news.filters_sorting";
export const NEWS_SORTS = ["newest", "oldest", "cap_asc", "cap_desc", "ticker"] as const;
export type NewsFilters = {
  search: string; tickers: string; minCap: string; maxCap: string; capStatus: "any" | "known" | "unknown";
  datePeriod: "any" | "custom" | "today" | "last_7_days" | "last_30_days";
  from: string; to: string; type: "all" | "press_release" | "earnings" | "financing" | "sec";
  read: "all" | "unread" | "read"; summary: "all" | "available" | "unavailable";
  sort: typeof NEWS_SORTS[number];
};
export const DEFAULT_NEWS_FILTERS: NewsFilters = { search: "", tickers: "", minCap: "", maxCap: "", capStatus: "any", datePeriod: "any", from: "", to: "", type: "all", read: "all", summary: "all", sort: "newest" };
export function parseNewsFilters(input: unknown, reference = new Date()): NewsFilters {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid filters.");
  const raw = input as Record<string, unknown>;
  const result = { ...DEFAULT_NEWS_FILTERS };
  for (const key of Object.keys(result) as (keyof NewsFilters)[]) {
    if (raw[key] !== undefined) {
      if (typeof raw[key] !== "string" || raw[key].length > 200) throw new Error("Invalid filters.");
      Object.assign(result, { [key]: raw[key].trim() });
    }
  }
  const choices: Partial<Record<keyof NewsFilters, readonly string[]>> = { datePeriod: ["any", "custom", "today", "last_7_days", "last_30_days"], capStatus: ["any", "known", "unknown"], type: ["all", "press_release", "earnings", "financing", "sec"], read: ["all", "unread", "read"], summary: ["all", "available", "unavailable"], sort: NEWS_SORTS };
  for (const [key, values] of Object.entries(choices)) if (!values.includes(result[key as keyof NewsFilters])) throw new Error("Invalid filter choice.");
  for (const key of ["minCap", "maxCap"] as const) if (result[key] && (!/^\d+(?:\.\d{1,6})?$/u.test(result[key]) || Number(result[key]) > 1e9)) throw new Error("Enter a valid market cap in USD millions.");
  if (result.minCap && result.maxCap && Number(result.minCap) > Number(result.maxCap)) throw new Error("Minimum market cap must not exceed maximum.");
  if (result.capStatus === "unknown" && (result.minCap || result.maxCap)) throw new Error("Clear market cap limits to show unknown values.");
  if (result.datePeriod === "any" && (result.from || result.to)) result.datePeriod = "custom";
  if (result.datePeriod === "custom" && !result.from && !result.to) result.datePeriod = "any";
  if (["today", "last_7_days", "last_30_days"].includes(result.datePeriod)) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(reference);
    const value = (key: string) => parts.find(part => part.type === key)?.value;
    result.to = `${value("year")}-${value("month")}-${value("day")}`;
    const days = result.datePeriod === "last_7_days" ? 7 : result.datePeriod === "last_30_days" ? 30 : 1;
    result.from = new Date(Date.parse(result.to + "T12:00:00Z") - (days - 1) * 86400000).toISOString().slice(0, 10);
  }
  for (const key of ["from", "to"] as const) if (result[key] && (!/^\d{4}-\d{2}-\d{2}$/u.test(result[key]) || !Number.isFinite(Date.parse(result[key])) || new Date(result[key]).toISOString().slice(0, 10) !== result[key])) throw new Error("Enter a valid date.");
  if (result.from && result.to && result.from > result.to) throw new Error("From date must not follow To date.");
  const tickers = result.tickers.toUpperCase().split(/[\s,]+/u).filter(Boolean);
  if (tickers.length > 20 || tickers.some(ticker => !/^[A-Z0-9][A-Z0-9.\-^]{0,31}$/u.test(ticker))) throw new Error("Enter up to 20 tickers separated by commas.");
  result.tickers = [...new Set(tickers)].join(", ");
  return result;
}
/** Display metadata without an explicit suffix/currency is ambiguous, never infer units. */
export function marketCapUsd(value: unknown, recordedUsd?: unknown): number | null {
  if ((typeof recordedUsd === "number" || (typeof recordedUsd === "string" && /^\d+(?:\.\d+)?$/u.test(recordedUsd))) && Number.isFinite(Number(recordedUsd)) && Number(recordedUsd) >= 0) return Number(recordedUsd);
  if (typeof value !== "string") return null;
  const match = /^\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*([KMBT])\s*$/iu.exec(value);
  if (!match) return null;
  const scales: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
  const amount = Number(match[1].replaceAll(",", "")) * scales[match[2].toUpperCase()];
  return Number.isFinite(amount) ? amount : null;
}
const easternParts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
export function easternDayStart(day: string, following = false): string {
  const target = Date.parse(day + "T00:00:00Z") + (following ? 86400000 : 0);
  let value = target;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(easternParts.formatToParts(new Date(value)).map(part => [part.type, part.value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    value += target - represented;
  }
  return new Date(value).toISOString();
}
