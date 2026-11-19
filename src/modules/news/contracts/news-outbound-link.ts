import { publicNewsUrl } from "./public-news-url";

/** Presentation only: never use this to rewrite stored publisher identities. */
export function newsSourceLink(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/u, "");
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password
      || hostname === "nuntiobot.com" || hostname.endsWith(".nuntiobot.com")) return null;
    return url.href;
  } catch { return null; }
}

export const SUMMARY_UNAVAILABLE_MESSAGE = "Summary could not be generated.";

export function newsSummaryUnavailable(summary: string | null | undefined, eventType: string | null | undefined, metadata: Record<string, unknown>): boolean {
  return !summary?.trim()
    || ["headline_only_fallback", "businesswire_headline_only", "sec_unreadable_fallback", "market_cap_stale_skip"].includes(String(metadata.articleSourceMode || ""))
    || eventType === "press_release_unreadable"
    || summary.trim().startsWith("Full article text is currently unavailable.")
    || summary.trim().startsWith("Summary could not be generated");
}

export function newsArticleLink(publicPath: string, summaryUnavailable: boolean, sourceUrl: string | null | undefined): string | null {
  return summaryUnavailable ? newsSourceLink(sourceUrl) : publicNewsUrl(publicPath);
}

/** Existing local reader paths stay local; external links share the source guard. */
export function newsDisplayLink(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) {
    return newsSourceLink(publicNewsUrl(value)) ? value : null;
  }
  return newsSourceLink(value);
}

/** Dashboard article details stay inside the app; only failed AI has a source action. */
export function dashboardPressReleaseSourceLink(article: { summaryUnavailable: boolean; sourceUrl: string | null }): string | null {
  return article.summaryUnavailable ? dashboardNewsLink(article.sourceUrl) : null;
}
export function dashboardNewsLink(value: string | null | undefined): string | null {
  const link = newsDisplayLink(value);
  if (!link) return null;
  const url = new URL(link, "https://app.traderslink.pro");
  if (["traderslink.pro", "www.traderslink.pro", "app.traderslink.pro"].includes(url.hostname)
    && /^\/(?:news|pr)(?:\/|$)/u.test(url.pathname)) return null;
  return link;
}
