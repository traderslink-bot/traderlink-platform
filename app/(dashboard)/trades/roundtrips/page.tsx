import type { Metadata } from "next";

import { TradeTableFoundation } from "../../../dashboard-route-foundations";

export const metadata: Metadata = {
  title: "Round Trips | Trader Intelligence",
};

export default function RoundTripsPage() {
  return (
    <TradeTableFoundation
      columns={["Date", "Ticker", "Side", "Session", "Duration", "Net P/L", "Status"]}
      filters={["Date", "Result", "Side", "Session"]}
      unavailableDescription="Verified completed round trips will appear here with professional filtering, sorting, grouping, column controls, and saved views."
    />
  );
}
