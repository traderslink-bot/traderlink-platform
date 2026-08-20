"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { AnalyticsOverviewView } from "@/app/(dashboard)/analytics/analytics-overview-view";
import { AnalyzedTradesIndex } from "@/app/(dashboard)/analytics/analyzed-trades-index";
import { ExecutionAnalyticsClient } from "@/app/(dashboard)/analytics/execution-analytics-client";
import { ResultsTickerTable } from "@/app/(dashboard)/analytics/results-ticker-table";
import { TimingAnalyticsClient } from "@/app/(dashboard)/analytics/timing/timing-analytics-client";
import { TradeAnalysisClient } from "@/app/(dashboard)/analytics/trade-analysis-client";
import { TradeAnalyzerHelpLink } from "@/app/(dashboard)/analytics/trade-analyzer-help-link";
import { DashboardPage, DashboardUnavailableState } from "@/app/dashboard-ui";
import {
  isJournalAnalyticsOfflineViewModel,
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION,
  type JournalAnalyticsOfflineRouteKind,
  type JournalAnalyticsOfflineViewModel,
} from "@/src/modules/journal-analytics/contracts/journal-analytics-offline-view-contracts";
import { readPlatformOfflineView } from "@/src/modules/platform/client/pwa/offline-projection-store";
import { PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

import { OfflineSavedViewStatus } from "./offline-saved-view-status";

type SavedAnalyticsState =
  | Readonly<{ status: "loading" | "unavailable" }>
  | Readonly<{ model: JournalAnalyticsOfflineViewModel; savedAtUtc: string; status: "ready" }>;

const ROUTES: Readonly<Record<string, JournalAnalyticsOfflineRouteKind>> = Object.freeze({
  "/analytics": "analytics-overview",
  "/analytics/execution": "analytics-execution",
  "/analytics/results": "analytics-results",
  "/analytics/timing": "analytics-timing",
  "/analytics/trade-analyzer/day": "trade-analyzer-day",
  "/analytics/trade-analyzer/day/candle-patterns": "trade-analyzer-candle-patterns",
  "/analytics/trade-analyzer/day/entry-exit": "trade-analyzer-entry-exit",
  "/analytics/trade-analyzer/day/green-to-red": "trade-analyzer-green-to-red",
  "/analytics/trade-analyzer/day/mfe-mae": "trade-analyzer-mfe-mae",
  "/analytics/trade-analyzer/day/trades": "trade-analyzer-trades",
});

const TITLES: Readonly<Record<JournalAnalyticsOfflineRouteKind, string>> = Object.freeze({
  "analytics-execution": "Trade Breakdown",
  "analytics-overview": "Overview",
  "analytics-results": "Ticker",
  "analytics-timing": "Timing",
  "trade-analyzer-candle-patterns": "Candle Patterns",
  "trade-analyzer-day": "Day Trade Analysis",
  "trade-analyzer-entry-exit": "Entry & Exit",
  "trade-analyzer-green-to-red": "Green-to-Red",
  "trade-analyzer-mfe-mae": "MFE & MAE",
  "trade-analyzer-trades": "Analyzed Trades",
});

const ANALYZER_HELP: Readonly<Record<JournalAnalyticsOfflineRouteKind, string | null>> = Object.freeze({
  "analytics-execution": null,
  "analytics-overview": null,
  "analytics-results": null,
  "analytics-timing": null,
  "trade-analyzer-candle-patterns": "/help/trade-analyzer/candle-patterns",
  "trade-analyzer-day": "/help/trade-analyzer/day-trade-analysis",
  "trade-analyzer-entry-exit": "/help/trade-analyzer/entry-exit-analysis",
  "trade-analyzer-green-to-red": "/help/trade-analyzer/green-to-red-analysis",
  "trade-analyzer-mfe-mae": "/help/trade-analyzer/mfe-mae",
  "trade-analyzer-trades": "/help/trade-analyzer/analyzed-trades",
});

export function journalAnalyticsOfflineRouteKind(pathname: string): JournalAnalyticsOfflineRouteKind | null {
  return ROUTES[pathname] ?? null;
}

function AnalyticsHeader({ kind }: { kind: JournalAnalyticsOfflineRouteKind }) {
  const helpHref = ANALYZER_HELP[kind];
  const analyzer = kind.startsWith("trade-analyzer");
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          {analyzer ? "Trade Analyzer" : "Analytics"}
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">{TITLES[kind]}</Typography>
      </Box>
      {helpHref ? <TradeAnalyzerHelpLink href={helpHref} label={TITLES[kind]} size="medium" /> : null}
    </Stack>
  );
}

export function OfflineAnalyticsRouteSurface({ kind, partitionKey, pathname }: {
  kind: JournalAnalyticsOfflineRouteKind;
  partitionKey: string;
  pathname: string;
}) {
  const [savedView, setSavedView] = useState<SavedAnalyticsState>({ status: "loading" });
  useEffect(() => {
    let active = true;
    const viewKey = JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS[kind];
    void readPlatformOfflineView(partitionKey, viewKey).then((view) => {
      if (!active) return;
      if (
        view?.schemaVersion !== PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION ||
        view.pathname !== pathname ||
        view.routeViewVersion !== JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION ||
        view.viewKey !== viewKey ||
        !isJournalAnalyticsOfflineViewModel(view.model, kind)
      ) {
        setSavedView({ status: "unavailable" });
        return;
      }
      setSavedView({ model: view.model, savedAtUtc: view.savedAtUtc, status: "ready" });
    }).catch(() => {
      if (active) setSavedView({ status: "unavailable" });
    });
    return () => { active = false; };
  }, [kind, partitionKey, pathname]);

  if (savedView.status !== "ready") {
    return (
      <DashboardPage>
        <AnalyticsHeader kind={kind} />
        {savedView.status === "loading" ? (
          <Stack role="status" sx={{ alignItems: "center", justifyContent: "center", minHeight: 320 }}>
            <CircularProgress size={28} />
            <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">Loading your saved page…</Typography>
          </Stack>
        ) : (
          <DashboardUnavailableState
            compact
            description={`Open ${TITLES[kind]} once while connected so TraderLink can save its latest results on this device.`}
            title={`No saved ${TITLES[kind]} view is available`}
          />
        )}
      </DashboardPage>
    );
  }

  const { model, savedAtUtc } = savedView;
  if (model.kind === "analytics-overview") {
    return <AnalyticsOverviewView dateRange={model.dateRange} offlineSavedAtUtc={savedAtUtc} response={model.response} />;
  }
  return (
    <DashboardPage>
      <AnalyticsHeader kind={kind} />
      <OfflineSavedViewStatus savedAtUtc={savedAtUtc} />
      {model.kind === "analytics-results" ? (
        <ResultsTickerTable endDate={model.dateRange.endDate} offline rows={model.rows} startDate={model.dateRange.startDate} />
      ) : null}
      {model.kind === "analytics-timing" ? (
        <TimingAnalyticsClient chartData={model.chartData} completedTradeCount={model.completedTradeCount} timezone={model.timezone} />
      ) : null}
      {model.kind === "analytics-execution" ? (
        <ExecutionAnalyticsClient chartData={model.chartData} currency={model.currency} offline rows={model.rows} />
      ) : null}
      {model.kind === "trade-analyzer-trades" ? (
        <AnalyzedTradesIndex
          currency={model.currency}
          endDate={model.dateRange.endDate}
          initialPage={model.page}
          moneyBasis={model.moneyBasis}
          offline
          startDate={model.dateRange.startDate}
        />
      ) : null}
      {"evidenceQuery" in model ? (
        <TradeAnalysisClient
          evidenceQuery={model.evidenceQuery}
          model={model.model}
          offline
          view={model.view}
        />
      ) : null}
    </DashboardPage>
  );
}
