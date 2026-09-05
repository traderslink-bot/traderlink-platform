import type { Metadata } from "next";

import { TradeAnalysisPage } from "../../../trade-analysis-page";

export const metadata: Metadata = { title: "Scaling out | TraderLink Platform" };

export default async function ScalingOutAnalysisPage({ searchParams }: {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  return <TradeAnalysisPage baseHref="/analytics/trade-analyzer/day/scaling-out" searchParams={await searchParams} view="scaling-out" />;
}
