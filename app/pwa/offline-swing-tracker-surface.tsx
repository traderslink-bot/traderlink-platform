"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { ManualExecutionEntry } from "@/app/(dashboard)/trade-tracker/manual-execution-entry";
import { SwingTrackerView } from "@/app/(dashboard)/trade-tracker/swings/swing-tracker-view";
import type { ReplacementSwingPositionDetail } from "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data";
import { DashboardPage, DashboardUnavailableState } from "@/app/dashboard-ui";
import { readPlatformOfflineView } from "@/src/modules/platform/client/pwa/offline-projection-store";
import {
  isJournalSwingTrackerOfflineViewModel,
  JOURNAL_SWING_TRACKER_OFFLINE_ROUTE_VIEW_VERSION,
  JOURNAL_SWING_TRACKER_OFFLINE_VIEW_KEY,
  type JournalSwingTrackerOfflinePosition,
  type JournalSwingTrackerOfflineViewModel,
} from "@/src/modules/journal/contracts/journal-swing-tracker-offline-view-contracts";
import { PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

type SavedSwingState =
  | Readonly<{ status: "loading" | "unavailable" }>
  | Readonly<{ model: JournalSwingTrackerOfflineViewModel; savedAtUtc: string; status: "ready" }>;

function currentDateInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit", month: "2-digit", timeZone: timezone, year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function presentationPosition(
  position: JournalSwingTrackerOfflinePosition,
): ReplacementSwingPositionDetail {
  const localRef = `offline-${position.positionKey}`;
  const detail: ReplacementSwingPositionDetail = {
    ...position,
    availableTags: [],
    executions: position.executions.map((execution) => ({
      ...execution,
      feesDecimal: execution.reportingFeesDecimal,
      manualEdit: null,
      sourceTimestampText: execution.executedAtUtc,
    })),
    latestSwingNote: null,
    notes: position.notes.map((note) => ({ ...note, positionRef: localRef })),
    positionRef: localRef,
    reviewDateSwingNote: null,
    rules: [],
    tags: position.tags.map((name, index) => ({
      assignmentCount: 1,
      name,
      revision: "offline",
      tagId: `offline-tag-${index}`,
    })),
  };
  return detail;
}

export function OfflineSwingTrackerSurface({
  accountCurrency,
  accountSelectionRef,
  accountTimezone,
  offlineScopeRef,
  partitionKey,
}: {
  accountCurrency: string;
  accountSelectionRef: string;
  accountTimezone: string;
  offlineScopeRef: string;
  partitionKey: string;
}) {
  const [savedView, setSavedView] = useState<SavedSwingState>({ status: "loading" });
  useEffect(() => {
    let active = true;
    void readPlatformOfflineView(partitionKey, JOURNAL_SWING_TRACKER_OFFLINE_VIEW_KEY)
      .then((view) => {
        if (!active) return;
        if (
          view?.schemaVersion !== PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION ||
          view.pathname !== "/trade-tracker/swings" ||
          view.routeViewVersion !== JOURNAL_SWING_TRACKER_OFFLINE_ROUTE_VIEW_VERSION ||
          view.viewKey !== JOURNAL_SWING_TRACKER_OFFLINE_VIEW_KEY ||
          !isJournalSwingTrackerOfflineViewModel(view.model) ||
          view.queryIdentity !== `current:${view.model.reviewDate}`
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
  }, [partitionKey]);

  if (savedView.status !== "ready") {
    return (
      <DashboardPage>
        <Typography component="h1" variant="h1">Swing Trade Tracker</Typography>
        {savedView.status === "loading" ? (
          <Stack role="status" sx={{ alignItems: "center", justifyContent: "center", minHeight: 320 }}>
            <CircularProgress size={28} />
            <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">Loading your saved swing trades…</Typography>
          </Stack>
        ) : (
          <DashboardUnavailableState
            compact
            description="Open Swing Trade Tracker once while connected so TraderLink can save its latest positions on this device."
            title="No saved swing trades are available"
          />
        )}
      </DashboardPage>
    );
  }
  const entry = (
    <Box id="swing-execution-entry" sx={{ scrollMarginTop: 96 }}>
      <ManualExecutionEntry
        accountCurrency={accountCurrency}
        accountTimezone={accountTimezone}
        defaultSessionDate={currentDateInTimezone(accountTimezone)}
        expectedAccountSelectionRef={accountSelectionRef}
        offlineScopeRef={offlineScopeRef}
        tracker="swing"
      />
    </Box>
  );
  return (
    <SwingTrackerView
      active={savedView.model.active.map(presentationPosition)}
      completed={savedView.model.completed.map(presentationPosition)}
      expectedAccountSelectionRef={accountSelectionRef}
      offlineSavedAtUtc={savedView.savedAtUtc}
      reviewDate={savedView.model.reviewDate}
      topContent={entry}
    />
  );
}
