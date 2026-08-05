import type { Metadata } from "next";

import { ResultsAnalyticsPage } from "../results-analytics-page";

export const metadata: Metadata = {
  title: "Results | Trader Intelligence",
};

export default async function ResultsPage({ searchParams }: { searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>> }) {
  return <ResultsAnalyticsPage searchParams={await searchParams} />;
}
