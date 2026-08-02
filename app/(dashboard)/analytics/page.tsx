import type { Metadata } from "next";

import { AnalyticsServerPage } from "../../journal-analytics-server-page";

export const metadata: Metadata = {
  title: "Analytics Overview | Trader Intelligence",
};

export default function AnalyticsOverviewPage() {
  return <AnalyticsServerPage page="overview" />;
}
