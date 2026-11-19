import { parseNewsFilters, type NewsFilters } from "./press-release-filters";

export const MAX_SAVED_NEWS_VIEWS = 20;
export type SavedNewsView = Readonly<{
  id: string; name: string; filters: NewsFilters; revision: number;
  alertsEnabled: boolean; alertsStartedAt: string | null;
}>;
export type NewsViewPreference = Readonly<{ filters: NewsFilters; revision: number }>;
export type SaveNewsViewInput = Readonly<{
  id: string | null; revision: number | null; name: string; filters: unknown; alertsEnabled: boolean;
}>;
export function newsViewName(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 60 || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error("Enter a view name of up to 60 characters.");
  }
  return value.trim();
}
export function encodeNewsFilters(input: unknown): string {
  return JSON.stringify({ version: 1, filters: parseNewsFilters(input) });
}
export function decodeNewsFilters(json: string, reference = new Date()): NewsFilters {
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("filters" in value)) throw new Error("This saved view could not be read.");
  return parseNewsFilters(value.filters, reference);
}
export function newsAlertFilters(input: unknown, reference = new Date()): NewsFilters {
  return { ...parseNewsFilters(input, reference), read: "all", sort: "newest" };
}
export function newsViewFilterSummary(filters: NewsFilters): string {
  const labels: string[] = [];
  if (filters.search) labels.push(`Search: ${filters.search}`);
  if (filters.tickers) labels.push(filters.tickers);
  if (filters.minCap || filters.maxCap) labels.push(`${filters.minCap ? "$" + filters.minCap + "M or more" : "Any minimum"}${filters.maxCap ? ", below $" + filters.maxCap + "M" : ""}`);
  if (filters.capStatus !== "any") labels.push(filters.capStatus === "unknown" ? "Unknown market cap" : "Known market cap");
  if (filters.datePeriod === "today") labels.push("Today (ET)");
  else if (filters.datePeriod === "last_7_days") labels.push("Last 7 days (ET)");
  else if (filters.datePeriod === "last_30_days") labels.push("Last 30 days (ET)");
  else if (filters.from || filters.to) labels.push(`${filters.from || "Any date"} to ${filters.to || "any date"} (ET)`);
  if (filters.type !== "all") labels.push({ press_release: "Press releases", earnings: "Earnings", financing: "Financing", sec: "SEC filings" }[filters.type]);
  if (filters.summary !== "all") labels.push(filters.summary === "available" ? "Summary available" : "Summary unavailable");
  return labels.join(" · ") || "All press releases";
}
