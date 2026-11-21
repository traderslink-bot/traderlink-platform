import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import { LiveWatchlistIndexClient } from "@/app/watchlist/live-watchlist-client";
import type { LiveWatchlistListSymbol } from "../live-watchlist-list";

const privateTicker: LiveWatchlistListSymbol = {
  symbol: "PRIVATE",
  status: "stale",
  updatedAt: 1,
  firstPostedAt: null,
  watchlistGroup: "private",
  watchlistSlotState: "active",
  latestPrice: null,
};

function renderWatchlist(symbols: LiveWatchlistListSymbol[]) {
  return renderToStaticMarkup(createElement(LiveWatchlistIndexClient, {
    initialState: { generatedAt: 1, marketDataStatus: "closed", marketDataUpdatedAt: null, symbols },
  }));
}

it("shows the empty state when private and ineligible follow-up entries have no visible section", () => {
  const html = renderWatchlist([
    privateTicker,
    {
      ...privateTicker,
      symbol: "FOLLOWUP",
      watchlistGroup: undefined,
      watchlistSlotState: "followup",
      reversalWatchEligible: false,
    },
  ]);

  expect(html).toContain("No tickers are currently in the watchlist");
  expect(html).not.toContain('href="/watchlist/PRIVATE"');
  expect(html).not.toContain('href="/watchlist/FOLLOWUP"');
});

it("keeps the empty state hidden when a member-facing ticker is visible", () => {
  const html = renderWatchlist([
    privateTicker,
    { ...privateTicker, symbol: "VISIBLE", watchlistGroup: "main" },
  ]);

  expect(html).not.toContain("No tickers are currently in the watchlist");
  expect(html).toContain('href="/watchlist/VISIBLE"');
});
