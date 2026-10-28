import { generalNewsIngestResponse } from "@/src/modules/news/server/general-market-news-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function POST(request: Request): Promise<Response> { return generalNewsIngestResponse(request); }
