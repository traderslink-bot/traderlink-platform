import type { Metadata } from "next";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  createJournalCompareTradesOfflineViewModel,
  JOURNAL_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_OFFLINE_ROUTE_VIEW_VERSION,
  journalOfflineRouteCoverage,
} from "@/src/modules/journal/contracts/journal-offline-route-view-contracts";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { readTradeExplorerPageModel } from "../trade-explorer-service";
import { listTradeExplorerComparisonStudies } from "../trade-explorer-comparison-study-runtime";
import TradeExplorerComparisonClient from "./trade-explorer-comparison-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Compare trades | TraderLink Platform",
  description: "Compare two to four factual groups of your completed trades.",
};

export default async function TradeExplorerComparisonPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const [model, studies] = await Promise.all([
    readTradeExplorerPageModel(scope),
    Promise.resolve(listTradeExplorerComparisonStudies(scope)),
  ]);
  return (
    <>
      <OfflineSavedViewCapture
        accountTimezone={null}
        calculationVersion="journal-compare-trades-v1"
        coverage={journalOfflineRouteCoverage("compare-trades")}
        generatedAtUtc={new Date().toISOString()}
        model={createJournalCompareTradesOfflineViewModel(model, studies)}
        pathname="/analytics/trade-explorer/compare"
        queryIdentity={`basis=${model.initialQuery.moneyBasis}`}
        reportingCurrency={model.initialQuery.currency ?? null}
        routeViewVersion={JOURNAL_OFFLINE_ROUTE_VIEW_VERSION}
        viewKey={JOURNAL_OFFLINE_ROUTE_VIEW_KEYS["compare-trades"]}
      />
      <TradeExplorerComparisonClient initialStudies={studies} model={model} />
    </>
  );
}
