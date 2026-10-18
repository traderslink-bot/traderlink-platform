import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { requireJournalAdminMutationRequest } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { parseSetupConfiguration, savedSetupPublicationIdentity, watchlistSetupStore } from "@/src/modules/watchlist/server/setups/setup-store";
import { readWatchlistSetupRuntimeFailure } from "@/src/modules/watchlist/server/setups/setup-runtime";
import { watchlistSetupFeedStatus } from "@/src/modules/watchlist/server/setups/setup-shared-feed-runtime";
import { watchlistMoomooAdmission } from "@/src/modules/watchlist/server/setups/setup-admission-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers });
function owner(request: Request): boolean {
  try { return withJournalAdminDatabase(request.headers, () => true); } catch { return false; }
}

export async function GET(request: Request): Promise<Response> {
  if (!owner(request)) return json({ error: "Not found." }, 404);
  try {
    const store = watchlistSetupStore(), configuration = await store.configuration();
    const symbol = new URL(request.url).searchParams.get("symbol");
    const population = await new LiveWatchlistStore().listSymbols();
    const tickers = population.symbols.filter(ticker => ticker.status !== "deactivated" && ticker.firstPostedAt).map(ticker => {
      const raw = (ticker as typeof ticker & { indicatorPublicationIdentity?: unknown }).indicatorPublicationIdentity;
      const publicationIdentity = typeof raw === "string" && savedSetupPublicationIdentity.test(raw) ? raw : null;
      return { symbol: ticker.symbol, publicationIdentity };
    });
    if (symbol !== null) {
      const ticker = tickers.find(item => item.symbol === symbol);
      if (!ticker?.publicationIdentity) return json({ error: "Saved publication identity is unavailable." }, 404);
      return json({ record: await store.latest(symbol, ticker.publicationIdentity), storage: store.status(),
        runtimeFailure: readWatchlistSetupRuntimeFailure(ticker.publicationIdentity), runtimeFailureRetention: "current_process_only" });
    }
    return json({ configuration, tickers, storage: store.status(), deliveryEnabled: false,
      feed: watchlistSetupFeedStatus(), admission: watchlistMoomooAdmission().status() });
  } catch { return json({ error: "Setup controls could not be loaded." }, 503); }
}

export async function POST(request: Request): Promise<Response> {
  try { requireJournalAdminMutationRequest(request); } catch { return json({ error: "Not found." }, 404); }
  if (!owner(request)) return json({ error: "Not found." }, 404);
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Invalid settings." }, 400);
    let body = "", size = 0;
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const chunk = await reader.read(); if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 16_384) { await reader.cancel(); return json({ error: "Settings are too large." }, 400); }
        body += decoder.decode(chunk.value, { stream: true });
      }
      body += decoder.decode();
    } finally { reader.releaseLock(); }
    let configuration;
    try { configuration = parseSetupConfiguration(JSON.parse(body)); }
    catch { return json({ error: "Invalid setup settings." }, 400); }
    // Outbound setup delivery is a later acceptance checkpoint, not a fake switch.
    if (configuration.settings.notifyConfirmed || configuration.settings.notifyForming)
      return json({ error: "Setup notification delivery is not enabled." }, 400);
    return json({ configuration: await watchlistSetupStore().saveConfiguration(configuration, configuration.revision) });
  } catch (error) {
    return (error as Error).message === "setup_configuration_changed"
      ? json({ error: "Setup settings changed. Reload them before saving." }, 409)
      : json({ error: "Setup settings were not saved." }, 503);
  }
}
