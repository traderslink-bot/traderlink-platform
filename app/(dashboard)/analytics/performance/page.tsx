import type { Metadata } from "next";

import { AnalyticsPageFoundation } from "../../../dashboard-route-foundations";

export const metadata: Metadata = {
  title: "Performance | Trader Intelligence",
};

export default function PerformancePage() {
  return (
    <AnalyticsPageFoundation
      chartTitle="Cumulative and period P/L"
      supportingTitle="What changed"
    />
  );
}
