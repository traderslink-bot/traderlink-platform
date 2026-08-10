import type { Metadata } from "next";

import { AnalyticsOverviewPage as AnalyticsOverviewContent } from "./analytics-overview-page";

export const metadata: Metadata = {
  title: "Analytics Overview | Trade Tracker",
};

export default async function AnalyticsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  return <AnalyticsOverviewContent searchParams={await searchParams} />;
}
