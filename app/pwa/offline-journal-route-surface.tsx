"use client";

import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import TradeExplorerComparisonClient from "@/app/(dashboard)/analytics/trade-explorer/compare/trade-explorer-comparison-client";
import TradeExplorerClient from "@/app/(dashboard)/analytics/trade-explorer/trade-explorer-client";
import { CalendarClient } from "@/app/(dashboard)/calendar/calendar-client";
import { RuleResultsClient } from "@/app/(dashboard)/rules/results/rule-results-client";
import { RulesClient } from "@/app/(dashboard)/rules/rules-client";
import { TradeCandleReviewClient } from "@/app/(dashboard)/trades/candle-review/trade-candle-review-client";
import { DashboardPage, DashboardUnavailableState } from "@/app/dashboard-ui";
import {
  isJournalOfflineRouteViewModel,
  JOURNAL_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_OFFLINE_ROUTE_VIEW_VERSION,
  type JournalOfflineRouteKind,
  type JournalOfflineRouteViewModel,
} from "@/src/modules/journal/contracts/journal-offline-route-view-contracts";
import { readPlatformOfflineView } from "@/src/modules/platform/client/pwa/offline-projection-store";
import type { JournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
import { PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

type SavedRouteState =
  | Readonly<{ status: "loading" | "unavailable" }>
  | Readonly<{ model: JournalOfflineRouteViewModel; savedAtUtc: string; status: "ready" }>;

const ROUTES: Readonly<Record<string, JournalOfflineRouteKind>> = Object.freeze({
  "/analytics/trade-explorer": "trade-explorer",
  "/analytics/trade-explorer/compare": "compare-trades",
  "/calendar": "calendar",
  "/rules": "trading-rules",
  "/rules/results": "rule-results",
  "/trades/candle-review": "candle-review",
});

function routeTitle(kind: JournalOfflineRouteKind): string {
  if (kind === "calendar") return "Trading Calendar";
  if (kind === "trade-explorer") return "Trade Explorer";
  if (kind === "compare-trades") return "Compare trades";
  if (kind === "trading-rules") return "Trading Rules";
  if (kind === "rule-results") return "Rule Results";
  return "Candle Review";
}

export function journalOfflineRouteKind(pathname: string): JournalOfflineRouteKind | null {
  return ROUTES[pathname] ?? null;
}

export function OfflineJournalRouteSurface({
  accountSelectionRef,
  kind,
  partitionKey,
  pathname,
}: {
  accountSelectionRef: string;
  kind: JournalOfflineRouteKind;
  partitionKey: string;
  pathname: string;
}) {
  const [savedView, setSavedView] = useState<SavedRouteState>({ status: "loading" });
  useEffect(() => {
    let active = true;
    const viewKey = JOURNAL_OFFLINE_ROUTE_VIEW_KEYS[kind];
    void readPlatformOfflineView(partitionKey, viewKey)
      .then((view) => {
        if (!active) return;
        if (
          view?.schemaVersion !== PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION ||
          view.pathname !== pathname ||
          view.routeViewVersion !== JOURNAL_OFFLINE_ROUTE_VIEW_VERSION ||
          view.viewKey !== viewKey ||
          !isJournalOfflineRouteViewModel(view.model, kind)
        ) {
          setSavedView({ status: "unavailable" });
          return;
        }
        setSavedView({ model: view.model, savedAtUtc: view.savedAtUtc, status: "ready" });
      })
      .catch(() => {
        if (active) setSavedView({ status: "unavailable" });
      });
    return () => { active = false; };
  }, [kind, partitionKey, pathname]);

  if (savedView.status !== "ready") {
    return (
      <DashboardPage>
        <Typography component="h1" variant="h1">{routeTitle(kind)}</Typography>
        {savedView.status === "loading" ? (
          <Stack role="status" sx={{ alignItems: "center", justifyContent: "center", minHeight: 320 }}>
            <CircularProgress size={28} />
            <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">Loading your saved page…</Typography>
          </Stack>
        ) : (
          <DashboardUnavailableState
            compact
            description={`Open ${routeTitle(kind)} once while connected so TraderLink can save its latest information on this device.`}
            title={`No saved ${routeTitle(kind)} view is available`}
          />
        )}
      </DashboardPage>
    );
  }

  const { model, savedAtUtc } = savedView;
  if (model.kind === "calendar") {
    return (
      <CalendarClient
        availableMonths={model.availableMonths}
        availableWeekOptions={model.availableWeekOptions}
        availableWeeks={model.availableWeeks}
        initialData={model.initialData}
        initialFilters={model.initialFilters}
        initialView={{
          ...model.initialView,
          expectedAccountSelectionRef: accountSelectionRef as JournalAccountSelectionRef,
        }}
        offlineSavedAtUtc={savedAtUtc}
        selectedMonth={model.selectedMonth}
        selectedWeek={model.selectedWeek}
      />
    );
  }
  if (model.kind === "trade-explorer") {
    return <TradeExplorerClient model={{ ...model.model, expectedAccountSelectionRef: accountSelectionRef }} offlineSavedAtUtc={savedAtUtc} />;
  }
  if (model.kind === "compare-trades") {
    return <TradeExplorerComparisonClient initialStudies={model.studies} model={{ ...model.model, expectedAccountSelectionRef: accountSelectionRef }} offlineSavedAtUtc={savedAtUtc} />;
  }
  if (model.kind === "trading-rules") {
    return (
      <RulesClient
        initialRuleIdeas={model.initialRuleIdeas}
        initialView={model.initialView}
        monetaryMultiplier={model.monetaryMultiplier}
        offlineSavedAtUtc={savedAtUtc}
        reportingCurrency={model.reportingCurrency}
        sourceCurrency={model.sourceCurrency}
      />
    );
  }
  if (model.kind === "rule-results") {
    return <RuleResultsClient initialView={model.initialView} offlineSavedAtUtc={savedAtUtc} />;
  }
  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">Candle Review</Typography>
      <TradeCandleReviewClient
        currency={model.currency}
        initialReview={model.initialReview}
        offlineSavedAtUtc={savedAtUtc}
        selectionRef={accountSelectionRef}
        trade={model.trade}
      />
    </DashboardPage>
  );
}
