import type { Metadata } from "next";

import { AnalyticsServerPage } from "../../../analytics-server-page";

export const metadata: Metadata = {
  title: "Results | Trader Intelligence",
};

export default function ResultsPage() {
  return <AnalyticsServerPage page="results" />;
}
