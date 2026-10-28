import { generalNewsFeedResponse } from "@/src/modules/news/server/general-market-news-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request): Response { return generalNewsFeedResponse(request); }
