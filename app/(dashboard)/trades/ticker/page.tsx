import type { Metadata } from "next";

import { TradeTableFoundation } from "../../../dashboard-route-foundations";

export const metadata: Metadata = {
  title: "Trades by Ticker | Trader Intelligence",
};

export default function TradesByTickerPage() {
  return (
    <TradeTableFoundation
      columns={["Ticker", "Trading days", "Round trips", "Long / short", "Net P/L", "Win rate"]}
      filters={["Date", "Profitability", "Side", "Session", "Execution"]}
      unavailableDescription="Ticker-level history will be grouped here across dates. Opening a ticker will reuse the same detail page for full history or one selected trading day."
    />
  );
}
