import type { Metadata } from "next";

import { AnalyticsPageFoundation } from "../../../dashboard-route-foundations";

export const metadata: Metadata = {
  title: "Results | Trader Intelligence",
};

export default function ResultsPage() {
  return (
    <AnalyticsPageFoundation
      chartTitle="Trade result distribution"
      supportingTitle="Winner and loser profile"
    />
  );
}
