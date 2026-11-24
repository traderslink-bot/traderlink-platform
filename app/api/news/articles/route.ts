import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { timingSafeEqual } from "node:crypto";
import { publicNewsUrl } from "@/src/modules/news/contracts/public-news-url";
import { revalidatePath } from "next/cache";

import {
  type NewsArticleInput,
  upsertNewsArticle,
} from "@/src/lib/news/news-article-store";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { loadPlatformWebPushConfiguration } from "@/src/modules/platform/server/notifications/platform-web-push-configuration";
import { PlatformWebPushDeliveryService } from "@/src/modules/platform/server/notifications/platform-web-push-delivery-service";
import { PressReleaseWebPushRepository } from "@/src/modules/news/server/press-release-web-push-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ ok: false, code, message }, { status });
}

type PublisherAuthorization = "authorized" | "unconfigured" | "unauthorized";

function tokensMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function authorizePublisher(request: Request): PublisherAuthorization {
  const expectedToken = process.env.NEWS_PUBLISH_TOKEN?.trim();
  if (!expectedToken) return "unconfigured";

  const authHeader = request.headers.get("authorization") || "";
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const headerToken = request.headers.get("x-news-publish-token") || "";

  return tokensMatch(bearerToken, expectedToken) ||
    tokensMatch(headerToken, expectedToken)
    ? "authorized"
    : "unauthorized";
}

export async function POST(request: Request): Promise<Response> {
  const authorization = authorizePublisher(request);
  if (authorization === "unconfigured") {
    return jsonError(
      503,
      "news_publisher_unavailable",
      "News publishing is not configured.",
    );
  }
  if (authorization !== "authorized") {
    return jsonError(401, "unauthorized", "Invalid news publish token.");
  }

  let input: NewsArticleInput;

  try {
    input = (await request.json()) as NewsArticleInput;
  } catch {
    return jsonError(400, "invalid_json", "Request body must be valid JSON.");
  }

  try {
    const article = await upsertNewsArticle(input);
    const articlePath = `/news/${encodeURIComponent(
      article.ticker,
    )}/${encodeURIComponent(article.slug)}`;
    const freeArticlePath = `/news/free/${encodeURIComponent(
      article.ticker,
    )}/${encodeURIComponent(article.slug)}`;

    revalidatePath(articlePath);
    revalidatePath(freeArticlePath);
    revalidatePath(`/news/${article.ticker}`);
    revalidatePath("/news");
    revalidatePath("/press-releases", "layout");

    try {
      const configuration = loadPlatformWebPushConfiguration();
      const database = openPlatformDatabase({ mode: "runtime" });
      try {
        const repository = new PressReleaseWebPushRepository(database, configuration.encryption);
        repository.enqueueArticle({ ...article, routeTag: typeof input.routeTag === "string" ? input.routeTag.trim().toLowerCase() : null });
        await new PlatformWebPushDeliveryService(repository, configuration).runAvailable(100);
      } finally {
        database.close();
      }
    } catch (error) {
      console.error("News article push delivery could not be queued.", {
        articleId: article.id,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }

    return Response.json({
      ok: true,
      contractVersion: "traderslink_news_article_publish_v1",
      article: {
        id: article.id,
        ticker: article.ticker,
        slug: article.slug,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        revision: article.revision,
        contentSha256: article.contentSha256,
      },
      articlePath,
      articleUrl: publicNewsUrl(articlePath),
      freeArticlePath,
      freeArticleUrl: publicNewsUrl(freeArticlePath),
    });
  } catch (error) {
    if (isTraderLinkPlatformError(error) && error.safeContext.reason === "source_issuer_conflict") {
      return Response.json({
        ok: false, code: "news_article_issuer_conflict", retryable: false,
        message: "This source URL or event already belongs to another recorded ticker. Review the issuer before resubmitting.",
      }, { status: 409 });
    }
    console.error("News article publish rejected.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError(
      400,
      "invalid_news_article",
      "The News article could not be accepted.",
    );
  }
}
