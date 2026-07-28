import type { Metadata } from "next";

import { AnalyticsPageFoundation } from "../../../dashboard-route-foundations";

export const metadata: Metadata = {
  title: "Execution | Trader Intelligence",
};

export default function ExecutionPage() {
  return (
    <AnalyticsPageFoundation
      chartTitle="Execution profile"
      supportingTitle="Costs and position size"
    />
  );
}
