import type { Metadata } from "next";

import { TradeAnalysisPage } from "../../../trade-analysis-page";

export const metadata: Metadata = { title: "Candle Patterns | TraderLink Platform" };

export default async function CandlePatternsAnalysisPage({ searchParams }: {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  return <TradeAnalysisPage baseHref="/analytics/trade-analyzer/day/candle-patterns" searchParams={await searchParams} view="candle-patterns" />;
}
