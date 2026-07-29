import type { Metadata } from "next";

import { AnalyticsServerPage } from "../../analytics-server-page";

export const metadata: Metadata = {
  title: "Analytics Overview | Trader Intelligence",
};

export default function AnalyticsOverviewPage() {
  return <AnalyticsServerPage page="overview" />;
}
