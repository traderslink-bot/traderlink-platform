import type { Metadata } from "next";

import { AnalyticsServerPage } from "../../../journal-analytics-server-page";

export const metadata: Metadata = {
  title: "Performance | Trader Intelligence",
};

export default function PerformancePage() {
  return <AnalyticsServerPage page="performance" />;
}
