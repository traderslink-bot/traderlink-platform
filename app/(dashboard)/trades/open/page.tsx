import type { Metadata } from "next";

import { TradeTableFoundation } from "../../../dashboard-route-foundations";

export const metadata: Metadata = {
  title: "Open Positions | Trader Intelligence",
};

export default function OpenPositionsPage() {
  return (
    <TradeTableFoundation
      columns={["Opened", "Ticker", "Side", "Quantity", "Average entry", "Age", "Status"]}
      filters={["Age", "Side", "Account"]}
      unavailableDescription="Unclosed execution lifecycles will appear here. Overnight positions are not automatically labelled as swing trades."
    />
  );
}
