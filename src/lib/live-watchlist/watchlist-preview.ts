import type { Metadata } from "next";

const WATCHLIST_TITLE = "TradersLink Live Watchlist";
const WATCHLIST_DESCRIPTION =
  "Premium TradersLink live watchlist with ticker levels, market context, and trader reads from the Discord workflow.";
const PREVIEW_CRAWLER_USER_AGENT =
  /\b(discordbot|twitterbot|facebookexternalhit|slackbot|linkedinbot|telegrambot|whatsapp|skypeuripreview|embedly|pinterest|googlebot|bingbot)\b/i;

export function isWatchlistPreviewCrawlerUserAgent(
  userAgent: string | null | undefined,
): boolean {
  return PREVIEW_CRAWLER_USER_AGENT.test(userAgent ?? "");
}

export function isWatchlistPath(path: string): boolean {
  return path === "/watchlist" || path.startsWith("/watchlist/");
}

export function buildWatchlistPreviewMetadata(path = "/watchlist"): Metadata {
  const target = getWatchlistPreviewTarget(path);
  return {
    title: target.title,
    description: target.description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: target.title,
      description: target.description,
      url: target.path,
      siteName: "TradersLink",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: target.title,
      description: target.description,
    },
  };
}

export function renderWatchlistPreviewHtml({
  origin,
  path,
}: {
  origin: string;
  path: string;
}): string {
  const target = getWatchlistPreviewTarget(path);
  const absoluteUrl = new URL(target.path, origin).toString();
  const title = escapeHtml(target.title);
  const description = escapeHtml(target.description);
  const url = escapeHtml(absoluteUrl);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="noindex,nofollow">
  <meta property="og:site_name" content="TradersLink">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${description}</p>
    <p><a href="${url}">Open watchlist</a></p>
  </main>
</body>
</html>`;
}

function getWatchlistPreviewTarget(path: string): {
  path: string;
  title: string;
  description: string;
} {
  const safePath = normalizeWatchlistPath(path);
  const symbol = getWatchlistSymbol(safePath);

  if (symbol) {
    return {
      path: `/watchlist/${encodeURIComponent(symbol)}`,
      title: `${symbol} Live Watchlist | TradersLink`,
      description: `Premium TradersLink watchlist details for ${symbol}, including ticker levels, market context, and trader reads.`,
    };
  }

  return {
    path: "/watchlist",
    title: WATCHLIST_TITLE,
    description: WATCHLIST_DESCRIPTION,
  };
}

function normalizeWatchlistPath(path: string): string {
  try {
    const parsed = new URL(path, "https://traderslink.pro");
    return isWatchlistPath(parsed.pathname) ? parsed.pathname : "/watchlist";
  } catch {
    return "/watchlist";
  }
}

function getWatchlistSymbol(path: string): string | null {
  const match = /^\/watchlist\/([^/?#]+)$/.exec(path);
  if (!match) {
    return null;
  }

  const decoded = decodeURIComponent(match[1] ?? "").trim().toUpperCase();
  if (!decoded || decoded === "ARCHIVE" || !/^[A-Z0-9._-]{1,12}$/.test(decoded)) {
    return null;
  }
  return decoded;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
