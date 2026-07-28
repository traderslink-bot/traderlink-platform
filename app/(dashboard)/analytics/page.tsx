import type { Metadata } from "next";

import { AnalyticsPageFoundation } from "../../dashboard-route-foundations";

export const metadata: Metadata = {
  title: "Analytics Overview | Trader Intelligence",
};

export default function AnalyticsOverviewPage() {
  return (
    <AnalyticsPageFoundation
      chartTitle="Account performance"
      supportingTitle="Period summary"
    />
  );
}
