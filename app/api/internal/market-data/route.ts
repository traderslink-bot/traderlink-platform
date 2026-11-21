import { screenerControlGet, screenerControlPost } from "@/src/modules/stock-screeners/private-publication-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return screenerControlGet(request); }
export async function POST(request: Request) { return screenerControlPost(request); }
