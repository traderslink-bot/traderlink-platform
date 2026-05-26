import type { Metadata } from "next";
import inconsistentShareSizing from "@/src/docs/trade-analysis-request-fixtures/inconsistent-share-sizing.json";
import longLoser from "@/src/docs/trade-analysis-request-fixtures/long-loser.json";
import longWinner from "@/src/docs/trade-analysis-request-fixtures/long-winner.json";
import openPosition from "@/src/docs/trade-analysis-request-fixtures/open-position.json";
import partialExits from "@/src/docs/trade-analysis-request-fixtures/partial-exits.json";
import rapidFireExecutionCluster from "@/src/docs/trade-analysis-request-fixtures/rapid-fire-execution-cluster.json";
import repeatedAddsBeforeReduction from "@/src/docs/trade-analysis-request-fixtures/repeated-adds-before-reduction.json";
import shortLoser from "@/src/docs/trade-analysis-request-fixtures/short-loser.json";
import shortWinner from "@/src/docs/trade-analysis-request-fixtures/short-winner.json";
import { runTraderAnalyticsReport } from "@/src/lib/trader-analytics";
import { TraderAnalyticsDebugClient } from "./trader-analytics-debug-client";

export const metadata: Metadata = {
  title: "Trader Analytics Debug | Trader Intelligence",
};

export const dynamic = "force-dynamic";

const SAMPLE_BATCH = {
  requests: [
    longWinner,
    longLoser,
    shortWinner,
    shortLoser,
    openPosition,
    partialExits,
    repeatedAddsBeforeReduction,
    inconsistentShareSizing,
    rapidFireExecutionCluster,
  ],
};

export default function TraderAnalyticsDebugPage() {
  const initialRequestText = JSON.stringify(SAMPLE_BATCH, null, 2);
  const initialReport = runTraderAnalyticsReport({
    source: "page:/debug/trader-analytics/sample",
    document: SAMPLE_BATCH,
    generatedAt: new Date().toISOString(),
  });

  return (
    <TraderAnalyticsDebugClient
      initialReport={initialReport}
      initialRequestText={initialRequestText}
    />
  );
}
