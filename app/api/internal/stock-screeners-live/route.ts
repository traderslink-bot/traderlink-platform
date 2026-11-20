import { screenerLivePost } from "@/src/modules/stock-screeners/private-publication-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) { return screenerLivePost(request); }
