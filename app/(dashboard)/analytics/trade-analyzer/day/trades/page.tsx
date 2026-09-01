import type { Metadata } from "next";

import { TradeAnalysisPage } from "../../../trade-analysis-page";

export const metadata: Metadata = { title: "Your analyzed trades | TraderLink Platform" };

export default async function AnalyzedTradesPage({ searchParams }: {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  return <TradeAnalysisPage baseHref="/analytics/trade-analyzer/day/trades" searchParams={await searchParams} view="trades" />;
}
