import type { Metadata } from "next";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  createJournalTradeExplorerOfflineViewModel,
  JOURNAL_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_OFFLINE_ROUTE_VIEW_VERSION,
  journalOfflineRouteCoverage,
} from "@/src/modules/journal/contracts/journal-offline-route-view-contracts";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import TradeExplorerClient from "./trade-explorer-client";
import { readTradeExplorerPageModel } from "./trade-explorer-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Trade Explorer | TraderLink Platform",
  description: "Explore your confirmed Trade Tracker results.",
};

export default async function TradeExplorerPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const model = await readTradeExplorerPageModel(scope);
  return (
    <>
      <OfflineSavedViewCapture
        accountTimezone={null}
        calculationVersion="journal-trade-explorer-v1"
        coverage={journalOfflineRouteCoverage("trade-explorer")}
        generatedAtUtc={new Date().toISOString()}
        model={createJournalTradeExplorerOfflineViewModel(model)}
        pathname="/analytics/trade-explorer"
        queryIdentity="current"
        reportingCurrency={model.initialQuery.currency ?? null}
        routeViewVersion={JOURNAL_OFFLINE_ROUTE_VIEW_VERSION}
        viewKey={JOURNAL_OFFLINE_ROUTE_VIEW_KEYS["trade-explorer"]}
      />
      <TradeExplorerClient model={model} />
    </>
  );
}
