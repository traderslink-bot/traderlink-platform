import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "cache-control": "private, no-store, max-age=0" };

export function GET(request: Request): Response {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    if (!hasPressReleaseDashboardAccess(identity)) {
      return Response.json({ status: "unavailable" }, { headers, status: 403 });
    }
    const parameters = new URL(request.url).searchParams;
    const articleId = parameters.get("articleId");
    if (articleId !== null) {
      if (!articleId || articleId.length > 128) {
        return Response.json({ status: "unavailable" }, { headers, status: 400 });
      }
      const article = withReadonlyPlatformDatabase({}, (database) =>
        new PressReleaseDashboardRepository(database).find({
          articleId, channel: "news_filtered", scope: identity.scope,
        }));
      return Response.json({ article, status: article ? "ready" : "unavailable" }, {
        headers, status: article ? 200 : 404,
      });
    }
    const expanded = parameters.get("view") === "expanded";
    const articles = withReadonlyPlatformDatabase({}, (database) =>
      new PressReleaseDashboardRepository(database).list({
        channel: "news_filtered",
        limit: expanded ? 60 : 6,
        scope: identity.scope,
      }));
    // Preserve the expanded scanner contract; the six-headline card needs no
    // article body, analysis or metadata until an article is opened.
    const responseArticles = parameters.get("view") === "summary"
      ? articles.map(({ id, ticker, headline, isRead }) => ({ id, ticker, headline, isRead }))
      : articles;
    return Response.json({ articles: responseArticles, status: "ready" }, { headers });
  } catch (error) {
    return Response.json(
      { status: "unavailable" },
      { headers, status: isTraderLinkPlatformError(error) ? 400 : 500 },
    );
  }
}
