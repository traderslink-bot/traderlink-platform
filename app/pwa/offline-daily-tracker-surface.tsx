"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { DaySessionView } from "@/app/(dashboard)/trade-tracker/[sessionDate]/day-session-view";
import { ManualExecutionEntry } from "@/app/(dashboard)/trade-tracker/manual-execution-entry";
import { TradeTrackerUnsavedChangesProvider } from "@/app/(dashboard)/trade-tracker/trade-tracker-unsaved-changes";
import { DashboardPage, DashboardUnavailableState } from "@/app/dashboard-ui";
import {
  isJournalDailyTrackerOfflineViewModel,
  journalDailyTrackerOfflineViewKey,
  JOURNAL_DAILY_TRACKER_OFFLINE_ROUTE_VIEW_VERSION,
  type JournalDailyTrackerOfflineViewModel,
} from "@/src/modules/journal/contracts/journal-daily-tracker-offline-view-contracts";
import { readPlatformOfflineView } from "@/src/modules/platform/client/pwa/offline-projection-store";
import { PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

type SavedDailyState =
  | Readonly<{ status: "loading" | "unavailable" }>
  | Readonly<{ model: JournalDailyTrackerOfflineViewModel; savedAtUtc: string; status: "ready" }>;

function requestedDate(pathname: string, timezone: string): string | null {
  const datedRoute = /^\/trade-tracker\/(\d{4}-\d{2}-\d{2})$/u.exec(pathname);
  if (datedRoute) return datedRoute[1];
  if (pathname !== "/trade-tracker") return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit", month: "2-digit", timeZone: timezone, year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function OfflineDailyTrackerSurface({
  accountCurrency,
  accountSelectionRef,
  accountTimezone,
  offlineScopeRef,
  partitionKey,
  pathname,
}: {
  accountCurrency: string;
  accountSelectionRef: string;
  accountTimezone: string;
  offlineScopeRef: string;
  partitionKey: string;
  pathname: string;
}) {
  const date = requestedDate(pathname, accountTimezone);
  const [savedView, setSavedView] = useState<SavedDailyState>(
    date ? { status: "loading" } : { status: "unavailable" },
  );
  useEffect(() => {
    let active = true;
    if (!date) {
      return () => { active = false; };
    }
    const viewKey = journalDailyTrackerOfflineViewKey(date);
    void readPlatformOfflineView(partitionKey, viewKey)
      .then((view) => {
        if (!active) return;
        if (
          view?.schemaVersion !== PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION ||
          view.pathname !== pathname ||
          view.routeViewVersion !== JOURNAL_DAILY_TRACKER_OFFLINE_ROUTE_VIEW_VERSION ||
          view.viewKey !== viewKey ||
          view.queryIdentity !== `date:${date}` ||
          !isJournalDailyTrackerOfflineViewModel(view.model) ||
          view.model.data.date !== date
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
  }, [date, partitionKey, pathname]);

  const entry = pathname === "/trade-tracker" && date ? (
    <Box id="daily-execution-entry" sx={{ scrollMarginTop: 96 }}>
      <ManualExecutionEntry
        accountCurrency={accountCurrency}
        accountTimezone={accountTimezone}
        defaultSessionDate={date}
        expectedAccountSelectionRef={accountSelectionRef}
        offlineScopeRef={offlineScopeRef}
        tracker="day"
      />
    </Box>
  ) : null;

  if (savedView.status !== "ready") {
    return (
      <TradeTrackerUnsavedChangesProvider>
        <DashboardPage>
          <Typography component="h1" variant="h1">Session Tracker</Typography>
          {entry}
          {savedView.status === "loading" ? (
            <Stack role="status" sx={{ alignItems: "center", justifyContent: "center", minHeight: 320 }}>
              <CircularProgress size={28} />
              <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">Loading your saved trading day…</Typography>
            </Stack>
          ) : (
            <DashboardUnavailableState
              compact
              description="Open this Session Tracker date once while connected so TraderLink can save its latest trades, notes and review on this device."
              title="No saved trading day is available"
            />
          )}
        </DashboardPage>
      </TradeTrackerUnsavedChangesProvider>
    );
  }

  return (
    <TradeTrackerUnsavedChangesProvider>
      <DaySessionView
        data={{
          ...savedView.model.data,
          expectedAccountSelectionRef: accountSelectionRef,
        }}
        offlineSavedAtUtc={savedView.savedAtUtc}
        readOnly
        topContent={entry}
      />
    </TradeTrackerUnsavedChangesProvider>
  );
}
