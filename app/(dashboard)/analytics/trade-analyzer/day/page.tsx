import type { Metadata } from "next";

import { TradeAnalysisPage } from "../../trade-analysis-page";

export const metadata: Metadata = { title: "Day Trade Analysis | TraderLink Platform" };

export default async function DayTradeAnalysisPage({ searchParams }: {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  return <TradeAnalysisPage baseHref="/analytics/trade-analyzer/day" searchParams={await searchParams} view="day" />;
}
