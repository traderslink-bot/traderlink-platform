import { readIndicatorsPremiumOnly, saveIndicatorsPremiumOnly } from "@/src/modules/watchlist/server/access/watchlist-indicators-visibility";
import { readLevelsPremiumOnly, saveLevelsPremiumOnly } from '@/src/modules/watchlist/server/access/watchlist-levels-visibility';
import { withWatchlistAdminDatabase } from "@/src/modules/watchlist/server/access/watchlist-admin-authorization";
import { requireJournalAdminMutationRequest } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { analysisVisibilitySymbol, readAnalysisPremiumOnly, saveAnalysisPremiumOnly, readTickerPremiumOnly, saveTickerPremiumOnly, readRowHiddenFromFree, saveRowHiddenFromFree, readHiddenTickerAddedVisible, saveHiddenTickerAddedVisible } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });

export async function GET(request: Request) {
  const symbol = (new URL(request.url).searchParams.get("symbol") ?? "").toUpperCase();
  const control = new URL(request.url).searchParams.get("control") ?? "analysis";
  try {
    return withWatchlistAdminDatabase(request.headers, db => {
      if (!["analysis", "ticker", "levels", "row", "added", "indicators", "all"].includes(control)) return json({ error: "Invalid access setting." }, 400);
      if (!analysisVisibilitySymbol.test(symbol)) return json({ error: "Invalid ticker." }, 400);
      try {
        if (control === "all") return json({ symbol, settings: db.transaction(() => ({
          indicators: readIndicatorsPremiumOnly(db, symbol), ticker: readTickerPremiumOnly(db, symbol), analysis: readAnalysisPremiumOnly(db, symbol),
          levels: readLevelsPremiumOnly(db, symbol), row: readRowHiddenFromFree(db, symbol), added: readHiddenTickerAddedVisible(db, symbol),
        })).deferred() });
        return json({ symbol, premiumOnly: (control === "indicators" ? readIndicatorsPremiumOnly : control === "added" ? readHiddenTickerAddedVisible : control === "row" ? readRowHiddenFromFree : control === "levels" ? readLevelsPremiumOnly : control === "ticker" ? readTickerPremiumOnly : readAnalysisPremiumOnly)(db, symbol) });
      } catch { return json({ error: "Analysis access could not be loaded." }, 503); }
    });
  } catch { return json({ error: "Not found." }, 404); }
}

export async function POST(request: Request) {
  try { requireJournalAdminMutationRequest(request); withWatchlistAdminDatabase(request.headers, () => true); }
  catch { return json({ error: "Not found." }, 404); }
  let input: { symbol?: unknown; premiumOnly?: unknown; control?: unknown };
  try {
    const body = await request.text();
    if (body.length > 256) return json({ error: "Invalid access setting." }, 400);
    input = JSON.parse(body);
  } catch { return json({ error: "Invalid access setting." }, 400); }
  if (!input || typeof input.symbol !== "string" || !analysisVisibilitySymbol.test(input.symbol) || typeof input.premiumOnly !== "boolean")
    return json({ error: "Invalid access setting." }, 400);
  const symbol = input.symbol, premiumOnly = input.premiumOnly;
  const control = input.control ?? "analysis";
  if (control !== "analysis" && control !== "ticker" && control !== "levels" && control !== "row" && control !== "added" && control !== "indicators") return json({ error: "Invalid access setting." }, 400);
  try {
    withWatchlistAdminDatabase(request.headers, (db, scope) => (control === "indicators" ? saveIndicatorsPremiumOnly : control === "added" ? saveHiddenTickerAddedVisible : control === "row" ? saveRowHiddenFromFree : control === "levels" ? saveLevelsPremiumOnly : control === "ticker" ? saveTickerPremiumOnly : saveAnalysisPremiumOnly)(db, { symbol, premiumOnly, actorUserId: scope.userId }));
    return json({ symbol, premiumOnly });
  } catch { return json({ error: "Analysis access was not saved. Try again." }, 503); }
}
