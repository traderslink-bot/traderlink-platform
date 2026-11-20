import { screenerControlGet } from "@/src/modules/stock-screeners/private-publication-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return screenerControlGet(request, "selection"); }
