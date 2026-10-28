import { generalNewsArticleResponse } from "@/src/modules/news/server/general-market-news-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ articleId: string }> }): Promise<Response> {
  return generalNewsArticleResponse(request, (await context.params).articleId);
}
