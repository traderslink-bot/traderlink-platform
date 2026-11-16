import "server-only";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { readAnalysisPremiumOnly, readTickerPremiumOnly } from "../access/watchlist-analysis-visibility";
import { readLevelsPremiumOnly } from "../access/watchlist-levels-visibility";
import type { FreeChatVisibility } from "./watchlist-free-chat-delivery";

export function readFreeChatVisibility(symbol: string, requirePublicListing: boolean): FreeChatVisibility {
  return withReadonlyPlatformDatabase({}, database => database.transaction(() => {
    if (requirePublicListing) {
      const row = database.prepare<[string], { state_json: string }>(
        "SELECT state_json FROM live_watchlist_symbols WHERE symbol = ?",
      ).get(symbol);
      const listing = row ? JSON.parse(row.state_json) : null;
      if (!listing || !["live", "stale"].includes(listing.status) || listing.watchlistGroup === "private") {
        throw new Error("Ticker is not on the member Watchlist.");
      }
    }
    return {
      ticker: readTickerPremiumOnly(database, symbol),
      analysis: readAnalysisPremiumOnly(database, symbol),
      levels: readLevelsPremiumOnly(database, symbol),
    };
  })());
}
