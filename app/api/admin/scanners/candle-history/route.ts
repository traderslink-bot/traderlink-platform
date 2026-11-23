import { hasCandleHistoryOwnerAccess } from "@/src/modules/market-data/server/candle-history-owner";
import { CANDLE_HISTORY_FRAMES, eligibleHistorySymbols, parseCandleHistorySettings } from "@/src/modules/market-data/candle-history/settings";
import { readCandleHistoryRoster } from "@/src/modules/market-data/candle-history/roster";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { readBoundedRequestJson, RequestBodyLimitError } from "@/src/modules/platform/server/http/bounded-request-body";
import { requestAlpacaCandleArchiveAdmin } from "@/src/modules/scanner/alpaca/client";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import { scannerUniverseStore } from "@/src/modules/scanner/live/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

function owner(request: Request) {
  try { return hasCandleHistoryOwnerAccess(requireTraderLinkPlatformRequestIdentity(request.headers)); }
  catch { return false; }
}

export async function GET(request: Request) {
  if (!owner(request)) return reply({ error: "not_found" }, 404);
  try {
    return reply(await requestAlpacaCandleArchiveAdmin());
  } catch {
    return reply({ error: "history_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  return editSettings(request, true);
}

export async function PUT(request: Request) {
  return editSettings(request, false);
}

async function editSettings(request: Request, preview: boolean) {
  if (!owner(request)) return reply({ error: "not_found" }, 404);
  try { requirePlatformMutationRequest(request); }
  catch { return reply({ error: "request_denied" }, 403); }
  let settings;
  try {
    settings = parseCandleHistorySettings(await readBoundedRequestJson(request, 64 * 1024));
  } catch (error) {
    return reply({ error: "invalid_settings" }, error instanceof RequestBodyLimitError ? 413 : 400);
  }
  try {
    const universe = await scannerUniverseStore().readLatestOnOrBefore(easternClock(Date.now()).date);
    const stocks = await readCandleHistoryRoster(settings.marketCapCeiling, universe).catch(() => null);
    if (!stocks) return reply({ error: "universe_unavailable" }, 409);
    if (!preview) return reply(await requestAlpacaCandleArchiveAdmin({ settings, universe: stocks }));
    const roster = eligibleHistorySymbols(stocks, settings);
    // Forecast both regular and extended candle series at dense session coverage.
    const barsPerSession = { "1m": 1_350, "5m": 270, "15m": 90, "30m": 45, "1h": 23, "4h": 6, "1D": 1 };
    const barsPerSymbol = CANDLE_HISTORY_FRAMES.reduce((sum, frame) => {
      const { amount, unit } = settings.retention[frame];
      const sessions = unit === "sessions" ? amount : unit === "months" ? amount * 21 : amount * 5 / 7;
      return sum + sessions * barsPerSession[frame];
    }, 0);
    return reply({
      marketCap: roster.marketCap.size, popular: roster.popular.size, combined: roster.combined.size,
      overlap: roster.marketCap.size + roster.popular.size - roster.combined.size,
      estimatedBytes: Math.round(barsPerSymbol * roster.combined.size * 150),
    });
  } catch (error) {
    return error instanceof Error && error.message === "candle_history_settings_conflict"
      ? reply({ error: "revision_conflict" }, 409)
      : reply({ error: "history_unavailable" }, 503);
  }
}
