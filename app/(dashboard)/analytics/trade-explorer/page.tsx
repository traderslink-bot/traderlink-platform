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
import { listTradeExplorerSavedViews } from "./trade-explorer-saved-view-runtime";
import { readTradeExplorerPageModel } from "./trade-explorer-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Trade Explorer | TraderLink Platform",
  description: "Explore your confirmed Trade Tracker results.",
};

export default async function TradeExplorerPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>) {
  const parameters = await searchParams;
  const rank = parameters.rank === "pnl" || parameters.rank === "trades" ? parameters.rank : null;
  const tickerView = parameters.view === "tickers" && rank !== null;
  const date = (value: string | string[] | undefined): string | null =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : null;
  const startDate = date(parameters.startDate);
  const endDate = date(parameters.endDate);
  const scope = await requireTraderLinkPlatformPageScope();
  const [model, savedViews] = await Promise.all([
    readTradeExplorerPageModel(scope, tickerView ? { endDate, rank, startDate } : undefined),
    Promise.resolve(listTradeExplorerSavedViews(scope)),
  ]);
  return (
    <>
      <OfflineSavedViewCapture
        accountTimezone={null}
        calculationVersion="journal-trade-explorer-v1"
        coverage={journalOfflineRouteCoverage("trade-explorer")}
        generatedAtUtc={new Date().toISOString()}
        model={createJournalTradeExplorerOfflineViewModel(model)}
        pathname="/analytics/trade-explorer"
        queryIdentity={`basis=${model.initialQuery.moneyBasis}`}
        reportingCurrency={model.initialQuery.currency ?? null}
        routeViewVersion={JOURNAL_OFFLINE_ROUTE_VIEW_VERSION}
        viewKey={JOURNAL_OFFLINE_ROUTE_VIEW_KEYS["trade-explorer"]}
      />
      <TradeExplorerClient initialResultView={tickerView ? "tickers" : "trades"} initialSavedViews={savedViews} model={model} />
    </>
  );
}
