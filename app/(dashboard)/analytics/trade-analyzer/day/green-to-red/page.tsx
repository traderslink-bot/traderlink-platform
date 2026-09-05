import type { Metadata } from "next";

import { TradeAnalysisPage } from "../../../trade-analysis-page";

export const metadata: Metadata = { title: "Green to red | TraderLink Platform" };

export default async function GreenToRedAnalysisPage({ searchParams }: {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  return <TradeAnalysisPage baseHref="/analytics/trade-analyzer/day/green-to-red" searchParams={await searchParams} view="green-to-red" />;
}
