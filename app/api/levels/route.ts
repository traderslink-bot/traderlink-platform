import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { getStockLevels } from "@/src/modules/stock-levels/server/stock-levels-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: { symbol?: unknown };
  try { body = await request.json() as { symbol?: unknown }; } catch { return Response.json({ state: "unavailable", code: "invalid_symbol", message: "Enter a valid ticker." }, { status: 400 }); }
  try {
    return Response.json(await getStockLevels(requireTraderLinkPlatformRequestScope(request.headers), body.symbol), { headers: { "cache-control": "private, no-store, max-age=0" } });
  } catch { return Response.json({ state: "unavailable", code: "runtime_unavailable", message: "A reliable Stock Levels map is unavailable right now. Try again later." }, { status: 503 }); }
}
