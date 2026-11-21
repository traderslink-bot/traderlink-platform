import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { readMarketHaltDetectionSettings, saveMarketHaltDetectionSettings } from "@/src/modules/news/server/market-halt-detection-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
function owner(request: Request): boolean {
  try { return hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(request.headers)); }
  catch { return false; }
}
export async function GET(request: Request): Promise<Response> {
  if (!owner(request)) return reply({ error: "Not found." }, 404);
  try { return reply({ settings: readMarketHaltDetectionSettings() }); }
  catch { return reply({ error: "Halt detection settings are unavailable. Try refreshing." }, 503); }
}
export async function POST(request: Request): Promise<Response> {
  if (!owner(request)) return reply({ error: "Not found." }, 404);
  try { requirePlatformMutationRequest(request); }
  catch { return reply({ error: "This request could not be verified. Refresh the page." }, 403); }
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: "Choose a detection source and On or Off." }, 400);
  let input;
  try {
    let bytes = 0; const chunks: Uint8Array[] = [];
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > 2048) { await reader.cancel(); return reply({ error: "The settings request is too large." }, 413); }
      chunks.push(value);
    }
    input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    if (!input || typeof input.enabled !== "boolean" || !["alpaca", "official"].includes(input.source)
      || !Number.isSafeInteger(input.revision) || input.revision < 0) throw Error("invalid");
  } catch { return reply({ error: "Choose a detection source and On or Off." }, 400); }
  finally { reader.releaseLock(); }
  try { return reply({ settings: await saveMarketHaltDetectionSettings({ enabled: input.enabled, source: input.source, revision: input.revision }) }); }
  catch (error) {
    const conflict = error instanceof Error && error.message === "halt_settings_conflict";
    return reply({ error: conflict ? "Settings changed elsewhere. Refresh before saving again." : "Settings could not be saved. Refresh to check the saved values." }, conflict ? 409 : 503);
  }
}
