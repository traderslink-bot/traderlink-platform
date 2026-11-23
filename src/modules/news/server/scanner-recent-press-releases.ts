import "server-only";

import type Database from "better-sqlite3";
import { recentScannerTradingDates, scannerNewsEasternDate } from "../contracts/scanner-news-trading-dates";
import { newsArticleLink, newsSummaryUnavailable } from "../contracts/news-outbound-link";

const routeTags = ["default", "spike", "market_cap_under_30m", "market_cap_30m_to_50m", "market_cap_50m_to_100m"];

type ArticleRow = {
  id: string; ticker: string; headline: string; slug: string; created_at: string; published_at: string;
  summary: string | null; source_url: string | null; event_type: string | null; metadata_json: string;
};

function articleTypeLabel(row: ArticleRow): string {
  const parsed: unknown = JSON.parse(row.metadata_json);
  const metadata = parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown> : {};
  const eventType = (row.event_type || "").toLowerCase();
  const recordedForm = typeof metadata.filingType === "string"
    ? metadata.filingType.trim().toUpperCase().replace(/^(?:SEC\s+)?FORM\s+/, "").replace(/\s+/g, " ") : "";
  // Accept only a short recorded form identifier, never derive a form from headline prose.
  const form = /^[A-Z0-9][A-Z0-9./ -]{0,23}$/.test(recordedForm)
    && (/\d/.test(recordedForm) || /^(?:EFFECT|CORRESP|UPLOAD|CERT|RW|AW|DRS(?:\/A)?|POS AM)$/.test(recordedForm))
    ? recordedForm : null;
  let secSource = false;
  try {
    const hostname = new URL(row.source_url || "").hostname.toLowerCase();
    secSource = hostname === "sec.gov" || hostname.endsWith(".sec.gov");
  } catch { /* An absent source does not establish a filing type. */ }
  if (secSource || eventType.startsWith("sec_")
    || (form && !eventType.startsWith("press_release"))) {
    return form ? `SEC ${form}` : "SEC Filing";
  }
  if (eventType.startsWith("press_release")) return "Press Release";
  return "News";
}

function articleLink(row: ArticleRow): string | null {
  const metadata = JSON.parse(row.metadata_json) as Record<string, unknown> | null;
  return newsArticleLink(`/news/${encodeURIComponent(row.ticker)}/${encodeURIComponent(row.slug)}`,
    newsSummaryUnavailable(row.summary, row.event_type, metadata ?? {}), row.source_url);
}

export function listScannerRecentPressReleases(database: Database.Database, ticker: string, now = new Date()) {
  const window = recentScannerTradingDates(scannerNewsEasternDate(now));
  const includedDates = new Set(window.dates);
  // The ticker index bounds the query; the Eastern-date filter below handles DST and closed dates.
  const rows = database.prepare(`
    SELECT id, ticker, headline, slug, created_at, published_at, summary, source_url, event_type, metadata_json
    FROM news_articles
    WHERE ticker = ? AND created_at >= ? AND created_at <= ?
      AND route_tag IN (${routeTags.map(() => "?").join(", ")})
    ORDER BY created_at DESC, id ASC
  `).all(ticker, `${window.dates[4]}T00:00:00.000Z`, now.toISOString(), ...routeTags) as ArticleRow[];
  const articles = rows.filter((row) => includedDates.has(scannerNewsEasternDate(row.created_at))).map((row) => ({
    id: row.id, ticker: row.ticker, headline: row.headline, createdAt: row.created_at, publishedAt: row.published_at,
    savedDate: scannerNewsEasternDate(row.created_at), url: articleLink(row), typeLabel: articleTypeLabel(row),
  }));
  return { ...window, articles };
}
