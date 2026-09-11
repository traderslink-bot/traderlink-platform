import { timingSafeEqual } from "node:crypto";

import {
  findNewsArticleForWatchlistAi,
  isWatchlistAiTargetSessionDate,
} from "@/src/lib/news/news-article-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = { "cache-control": "no-store" };

function jsonError(status: number, code: string, extra: Record<string, string> = {}): Response {
  return Response.json({ code, ...extra }, { status, headers: responseHeaders });
}

function tokensMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorizedWatchlistPublisher(request: Request): boolean | null {
  const expectedToken = process.env.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN?.trim();
  if (!expectedToken) {
    return null;
  }
  const authorization = request.headers.get("authorization") ?? "";
  const bearerToken = /^Bearer\s+(.+)$/i.exec(authorization)?.[1]?.trim() ?? "";
  return tokensMatch(bearerToken, expectedToken);
}

function normalizeTicker(value: string): string | null {
  const trimmed = value.trim();
  return /^[A-Za-z0-9.-]{1,32}$/.test(trimmed) ? trimmed.toUpperCase() : null;
}

function publicOrigin(request: Request): string {
  const configured = process.env.NEWS_PUBLIC_BASE_URL?.trim();
  return (configured ? configured : new URL(request.url).origin).replace(/\/+$/g, "");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ ticker: string }> },
): Promise<Response> {
  const authorization = isAuthorizedWatchlistPublisher(request);
  if (authorization === null) {
    return jsonError(503, "news_source_unavailable");
  }
  if (!authorization) {
    return jsonError(401, "unauthorized");
  }

  const ticker = normalizeTicker((await context.params).ticker);
  if (!ticker) {
    return jsonError(400, "invalid_ticker");
  }

  const targetSessionDate = new URL(request.url).searchParams.get("targetSessionDate") ?? "";
  if (!isWatchlistAiTargetSessionDate(targetSessionDate)) {
    return jsonError(400, "invalid_target_session_date");
  }

  try {
    const selection = await findNewsArticleForWatchlistAi(ticker, targetSessionDate);
    if (!selection) {
      return jsonError(404, "no_eligible_article", {
        requestedTicker: ticker,
        targetSessionDate,
      });
    }

    const articlePath = `/news/${encodeURIComponent(selection.article.ticker)}/${encodeURIComponent(selection.article.slug)}`;
    return Response.json({
      contractVersion: "traderslink_watchlist_ai_source_v1",
      requestedTicker: ticker,
      targetSessionDate,
      eligibility: {
        status: "eligible",
        timeZone: "America/New_York",
        windowStartDateEt: selection.windowStartDateEt,
        windowEndDateEt: selection.windowEndDateEt,
        includedWeekdaysEt: selection.includedWeekdaysEt,
      },
      article: {
        articleId: selection.article.id,
        revision: selection.article.revision,
        contentSha256: selection.article.contentSha256,
        ticker: selection.article.ticker,
        publicUrl: `${publicOrigin(request)}${articlePath}`,
        headline: selection.article.headline,
        processedContent: selection.article.articleText,
        publishedAt: selection.article.publishedAt,
        observedAt: selection.article.updatedAt,
        publishedDateEt: selection.publishedDateEt,
        recency: selection.recency,
        eventType: selection.article.eventType,
        routeTag: selection.article.routeTag,
        sourceClass: "traderslink_processed",
        provenanceKey: `${selection.article.id}:${selection.article.revision}:${selection.article.contentSha256}`,
      },
    }, { headers: responseHeaders });
  } catch (error) {
    console.error("Watchlist AI article source lookup failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError(503, "news_source_unavailable");
  }
}
