import "server-only";

import type Database from "better-sqlite3";
import calendar from "./scanner-news-calendar.json";

const easternDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
});
const closedDates = new Set(calendar.closedDates);
const routeTags = ["default", "spike", "market_cap_under_30m", "market_cap_30m_to_50m", "market_cap_50m_to_100m"];
const sourceFallbackModes = new Set([
  "headline_only_fallback", "businesswire_headline_only", "sec_unreadable_fallback", "market_cap_stale_skip",
]);

export function easternSavedDate(value: string | Date): string {
  const parts = easternDateFormatter.formatToParts(typeof value === "string" ? new Date(value) : value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function recentTradingDates(now: Date): { dates: string[]; holidaysCovered: boolean } {
  const cursor = new Date(`${easternSavedDate(now)}T12:00:00.000Z`);
  const dates: string[] = [];
  let holidaysCovered = true;
  while (dates.length < 5) {
    const day = cursor.toISOString().slice(0, 10);
    if (day < calendar.coverageStart || day > calendar.coverageEnd) holidaysCovered = false;
    if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6 && !closedDates.has(day)) dates.push(day);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return { dates, holidaysCovered };
}

type ArticleRow = {
  id: string; ticker: string; headline: string; slug: string; created_at: string;
  summary: string | null; source_url: string | null; event_type: string | null; metadata_json: string;
};

function publicArticleOrigin(): string {
  const configured = process.env.NEWS_PUBLIC_BASE_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    if (url.protocol === "https:" && !url.username && !url.password && !url.port
      && ["app.traderslink.pro", "traderslink.pro", "www.traderslink.pro"].includes(url.hostname)) return url.origin;
  }
  return "https://app.traderslink.pro";
}

function safeSourceUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function articleLink(row: ArticleRow): string | null {
  const metadata = JSON.parse(row.metadata_json) as Record<string, unknown>;
  const summary = row.summary?.trim() || "";
  const unavailable = !summary || sourceFallbackModes.has(String(metadata.articleSourceMode || ""))
    || row.event_type === "press_release_unreadable"
    || summary.startsWith("Full article text is currently unavailable.")
    || summary.startsWith("Summary could not be generated.");
  if (unavailable) return safeSourceUrl(row.source_url);
  return `${publicArticleOrigin()}/news/${encodeURIComponent(row.ticker)}/${encodeURIComponent(row.slug)}`;
}

export function listScannerRecentPressReleases(database: Database.Database, ticker: string, now = new Date()) {
  const window = recentTradingDates(now);
  const includedDates = new Set(window.dates);
  // The ticker index bounds the query; the Eastern-date filter below handles DST and closed dates.
  const rows = database.prepare(`
    SELECT id, ticker, headline, slug, created_at, summary, source_url, event_type, metadata_json
    FROM news_articles
    WHERE ticker = ? AND created_at >= ? AND created_at <= ?
      AND route_tag IN (${routeTags.map(() => "?").join(", ")})
    ORDER BY created_at DESC, id ASC
  `).all(ticker, `${window.dates[4]}T00:00:00.000Z`, now.toISOString(), ...routeTags) as ArticleRow[];
  const articles = rows.filter((row) => includedDates.has(easternSavedDate(row.created_at))).map((row) => ({
    id: row.id, ticker: row.ticker, headline: row.headline, createdAt: row.created_at,
    savedDate: easternSavedDate(row.created_at), url: articleLink(row),
  }));
  return { ...window, articles };
}