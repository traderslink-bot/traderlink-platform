import type { Metadata } from "next";

import { AnalyticsServerPage } from "../../../journal-analytics-server-page";

export const metadata: Metadata = {
  title: "Execution | Trader Intelligence",
};

export default function ExecutionPage() {
  return <AnalyticsServerPage page="execution" />;
}
