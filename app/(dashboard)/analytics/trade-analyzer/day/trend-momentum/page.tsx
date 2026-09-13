import type { Metadata } from "next";
import { TradeAnalysisPage } from "../../../trade-analysis-page";

export const metadata: Metadata = { title: "Trend & Momentum | TraderLink Platform" };

export default async function TrendMomentumPage({ searchParams }: {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  return <TradeAnalysisPage baseHref="/analytics/trade-analyzer/day/trend-momentum" searchParams={await searchParams} view="trend-momentum" />;
}
