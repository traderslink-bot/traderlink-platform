import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { withWatchlistIndicatorMoomooAccess } from "@/src/modules/watchlist/server/moomoo-watchlist-candle-bridge";
import { MARKET_DATA_FEATURES, changeMarketDataProvider, marketDataSelection, type MarketDataFeature, type MarketDataProvider } from "@/src/modules/market-data/server/provider-settings";
import { readWatchlistMarketDataProfile, changeWatchlistMarketDataProfile } from "@/src/modules/watchlist/server/watchlist-market-data-profile";
import type { MarketDataControl } from "@/src/modules/market-data/provider-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
function owner(request: Request) {
  try { return hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(request.headers)); }
  catch { return false; }
}
async function selections(): Promise<MarketDataControl[]> {
  return Promise.all(MARKET_DATA_FEATURES.map(async feature => {
    if (feature !== "watchlist") return { feature, ...marketDataSelection(feature), available: true };
    try {
      const selected = await readWatchlistMarketDataProfile();
      return { feature, provider: selected.profile === null ? "custom" : selected.profile === "alpaca" ? "alpaca" : "moomoo", revision: selected.revision, available: !selected.changing, synchronized: selected.synchronized };
    } catch { return { feature, ...marketDataSelection(feature), available: false }; }
  }));
}
export async function GET(request: Request) {
  if (!owner(request)) return reply({ error: "not_found" }, 404);
  try { return reply({ selections: await selections() }); }
  catch { return reply({ error: "selection_unavailable" }, 503); }
}
export async function POST(request: Request) {
  if (!owner(request)) return reply({ error: "not_found" }, 404);
  try { requirePlatformMutationRequest(request); } catch { return reply({ error: "invalid_request" }, 403); }
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: "invalid_request" }, 400);
  let input: { feature: MarketDataFeature; provider: MarketDataProvider; revision: number };
  try {
    const chunks: Uint8Array[] = []; let bytes = 0;
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength; if (bytes > 1024) { await reader.cancel(); return reply({ error: "invalid_request" }, 413); }
      chunks.push(value);
    }
    input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    if (!input || !MARKET_DATA_FEATURES.includes(input.feature) || !["alpaca", "moomoo"].includes(input.provider)
      || !Number.isSafeInteger(input.revision) || input.revision < 0) return reply({ error: "invalid_request" }, 400);
  } catch { return reply({ error: "invalid_request" }, 400); }
  finally { reader.releaseLock(); }
  try {
    if (input.feature === "watchlist") {
      await changeWatchlistMarketDataProfile(input.provider === "alpaca" ? "alpaca" : "previous", input.revision);
    } else {
      if (input.provider === "moomoo" && input.feature !== "scanners") await withWatchlistIndicatorMoomooAccess(async () => undefined);
      await changeMarketDataProvider(input.feature, input.revision, input.provider);
    }
    return reply({ selections: await selections() });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const conflict = /(?:conflict|busy)$/.test(code);
    return reply({ error: conflict ? "selection_changed" : "switch_unavailable" }, conflict ? 409 : 503);
  }
}
