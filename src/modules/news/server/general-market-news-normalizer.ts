import { createHash } from "node:crypto";
import { GENERAL_NEWS_LIMITS, type NormalizedGeneralNews } from "../contracts/general-market-news-contracts";

export function newsTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  const day = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== value.slice(0, 10)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}
export function safeNewsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      !url.hostname.includes(".") || /[\[\]:]/.test(url.hostname) ||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) ||
      /\.(?:local|localhost|internal|test)$/i.test(url.hostname)) return null;
    for (const key of [...url.searchParams.keys()]) {
      if (/token|secret|password|authorization|signature|api.?key/i.test(key)) return null;
      if (/^(utm_.+|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    }
    url.hash = "";
    return url.toString();
  } catch { return null; }
}
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function normalizeGeneralNews(value: unknown, receivedAt: string): NormalizedGeneralNews {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_article");
  const input = value as Record<string, unknown>;
  const headline = typeof input.title === "string" ? input.title.replace(/\s+/gu, " ").trim() : "";
  if (!headline || headline.length > 1000 || !newsTimestamp(receivedAt) ||
    !["general", "ticker"].includes(String(input.collection))) throw new Error("invalid_article");
  const publishedAt = newsTimestamp(input.date);
  if (publishedAt && Date.parse(publishedAt) > Date.parse(receivedAt) + 86_400_000) throw new Error("invalid_date");
  const sourceUrl = safeNewsUrl(input.link);
  // Date is required for URL-less identity; fetch time must not mint duplicates.
  if (!sourceUrl && !publishedAt) throw new Error("missing_article_identity");
  const symbols = Array.isArray(input.symbols) ? [...new Set(input.symbols.filter((s): s is string =>
    typeof s === "string" && /^[A-Z0-9][A-Z0-9.\-^]{0,39}$/i.test(s)).map(s => s.toUpperCase()))].sort() : [];
  if (symbols.length > 100) throw new Error("too_many_symbols");
  const tags = Array.isArray(input.tags) ? [...new Set(input.tags.filter((t): t is string =>
    typeof t === "string" && t.length > 0 && t.length <= 100))].slice(0, 30) : [];
  const raw = typeof input.content === "string" ? input.content.replace(/\u0000/g, "").trim() : "";
  const bodyTruncated = Buffer.byteLength(raw) > GENERAL_NEWS_LIMITS.bodyBytes || input.bodyTruncated === true;
  const body = Buffer.from(raw).subarray(0, GENERAL_NEWS_LIMITS.bodyBytes).toString("utf8").replace(/\uFFFD$/u, "") || null;
  const id = hash(`eodhd:${sourceUrl ?? `${headline.toLowerCase()}:${publishedAt}`}`);
  return {
    id, headline, publishedAt, receivedAt, sourceUrl,
    source: sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, "") : null,
    symbols, tags, body, bodyTruncated, collection: input.collection as "general" | "ticker",
    contentHash: hash(JSON.stringify([headline, publishedAt, body, bodyTruncated, sourceUrl])),
  };
}
