import { MembershipFeatureAccessNotice } from "../../membership-feature-access-notice";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  createJournalTradeExplorerOfflineViewModel,
  JOURNAL_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_OFFLINE_ROUTE_VIEW_VERSION,
  journalOfflineRouteCoverage,
} from "@/src/modules/journal/contracts/journal-offline-route-view-contracts";
import { requireMembershipPreviewPageScope } from "@/src/modules/platform/server/membership/platform-membership-page-access";

import TradeExplorerClient from "./trade-explorer-client";
import { listTradeExplorerSavedViews } from "./trade-explorer-saved-view-runtime";
import { readTradeExplorerPageModel } from "./trade-explorer-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Trade Explorer | TraderLink Platform",
  description: "Explore your confirmed Trade Tracker results.",
};

let timingWindow = { startedAt: 0, count: 0 };

function logTradeExplorerTiming(
  phases: ReadonlyMap<string, number>,
  started: number,
  pageStartedEpochMs: number,
  traceId: string | null,
  railwayRequestId: string | null,
  proxyToPageMs: number | null,
): void {
  try {
    const now = Date.now();
    if (now - timingWindow.startedAt >= 60_000) timingWindow = { startedAt: now, count: 0 };
    if (timingWindow.count >= 20) return;
    timingWindow.count += 1;
    console.info("trade_explorer_page_timing", {
      trace_id: traceId,
      railway_request_id: railwayRequestId,
      page_start_epoch_ms: pageStartedEpochMs,
      page_end_epoch_ms: now,
      proxy_to_page_ms: proxyToPageMs,
      phases: Object.fromEntries([...phases].map(([name, value]) => [name, Number(value.toFixed(1))])),
      total_ms: Number((performance.now() - started).toFixed(1)),
    });
  } catch { /* Diagnostics cannot change page results. */ }
}

export default async function TradeExplorerPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>) {
  const pageStartedEpochMs = Date.now();
  const started = performance.now();
  const phases = new Map<string, number>();
  const record = (name: string, value: number) => {
    if (Number.isFinite(value)) phases.set(name, value);
  };
  const requestHeaders = await headers();
  const candidateTraceId = requestHeaders.get("x-traderlink-speed-id");
  const traceId = candidateTraceId && /^[0-9a-f-]{36}$/u.test(candidateTraceId)
    ? candidateTraceId : null;
  const proxyStartedAt = Number(requestHeaders.get("x-traderlink-speed-start-ms"));
  const proxyElapsed = Date.now() - proxyStartedAt;
  const proxyToPageMs = traceId && Number.isSafeInteger(proxyStartedAt) &&
    proxyElapsed >= 0 && proxyElapsed <= 600_000 ? proxyElapsed : null;
  const candidateRailwayRequestId = requestHeaders.get("x-railway-request-id");
  const railwayRequestId = traceId && candidateRailwayRequestId &&
    /^[A-Za-z0-9_-]{12,64}$/u.test(candidateRailwayRequestId)
    ? candidateRailwayRequestId : null;
  const parameters = await searchParams;
  const rank = parameters.rank === "pnl" || parameters.rank === "trades" ? parameters.rank : null;
  const tickerView = parameters.view === "tickers" && rank !== null;
  const date = (value: string | string[] | undefined): string | null =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : null;
  const startDate = date(parameters.startDate);
  const endDate = date(parameters.endDate);
  const scopeStarted = performance.now();
  const scope = await requireMembershipPreviewPageScope("analytics.trade_explorer");
  record("scope", performance.now() - scopeStarted);
  if (!scope) return <MembershipFeatureAccessNotice feature="analytics.trade_explorer" title="Trade Explorer" message="Find the patterns behind your results. Unlock Trade Explorer to explore your trades, filters and saved views." />;
  const modelStarted = performance.now();
  const modelPromise = readTradeExplorerPageModel(
    scope,
    tickerView ? { endDate, rank, startDate } : undefined,
    record,
  ).finally(() => record("model_total", performance.now() - modelStarted));
  const savedViewsStarted = performance.now();
  const savedViewsPromise = Promise.resolve(listTradeExplorerSavedViews(scope));
  record("saved_views", performance.now() - savedViewsStarted);
  const [model, savedViews] = await Promise.all([
    modelPromise,
    savedViewsPromise,
  ]);
  const offlineStarted = performance.now();
  const offlineModel = createJournalTradeExplorerOfflineViewModel(model);
  record("offline_model", performance.now() - offlineStarted);
  logTradeExplorerTiming(phases, started, pageStartedEpochMs, traceId,
    railwayRequestId, proxyToPageMs);
  return (
    <>
      <OfflineSavedViewCapture
        accountTimezone={null}
        calculationVersion="journal-trade-explorer-v1"
        coverage={journalOfflineRouteCoverage("trade-explorer")}
        generatedAtUtc={new Date().toISOString()}
        model={offlineModel}
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
