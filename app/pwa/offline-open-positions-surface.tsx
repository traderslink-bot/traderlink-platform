"use client";

import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import {
  OpenPositionsView,
  type OpenPositionTrackingView,
} from "@/app/(dashboard)/trades/open/open-positions-view";
import { DashboardPage, DashboardUnavailableState } from "@/app/dashboard-ui";
import { readPlatformOfflineView } from "@/src/modules/platform/client/pwa/offline-projection-store";
import {
  isJournalOpenPositionsOfflineViewModel,
  JOURNAL_OPEN_POSITIONS_OFFLINE_ROUTE_VIEW_VERSION,
  JOURNAL_OPEN_POSITIONS_OFFLINE_VIEW_KEY,
  type JournalOpenPositionsOfflineViewModel,
} from "@/src/modules/journal/contracts/journal-open-positions-offline-view-contracts";
import { PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

type OpenPositionsSavedViewState =
  | Readonly<{ status: "loading" }>
  | Readonly<{
    model: JournalOpenPositionsOfflineViewModel;
    savedAtUtc: string;
    status: "ready";
  }>
  | Readonly<{ status: "unavailable" }>;

function offlinePositionStyles(
  model: JournalOpenPositionsOfflineViewModel,
): Readonly<Record<string, OpenPositionTrackingView>> {
  return Object.freeze(Object.fromEntries(
    Object.entries(model.positionStyles).map(([roundTripId, style]) => [
      roundTripId,
      Object.freeze({ style }),
    ]),
  ));
}

export function OfflineOpenPositionsSurface({
  partitionKey,
}: {
  partitionKey: string;
}) {
  const [savedView, setSavedView] = useState<OpenPositionsSavedViewState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const view = await readPlatformOfflineView(
          partitionKey,
          JOURNAL_OPEN_POSITIONS_OFFLINE_VIEW_KEY,
        );
        if (!active) return;
        if (
          view?.schemaVersion !== PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION ||
          view.pathname !== "/trades/open" ||
          view.queryIdentity !== "confirmed-open-positions" ||
          view.routeViewVersion !== JOURNAL_OPEN_POSITIONS_OFFLINE_ROUTE_VIEW_VERSION ||
          view.viewKey !== JOURNAL_OPEN_POSITIONS_OFFLINE_VIEW_KEY ||
          !isJournalOpenPositionsOfflineViewModel(view.model)
        ) {
          setSavedView({ status: "unavailable" });
          return;
        }
        setSavedView({
          model: view.model,
          savedAtUtc: view.savedAtUtc,
          status: "ready",
        });
      } catch {
        if (active) setSavedView({ status: "unavailable" });
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [partitionKey]);

  if (savedView.status === "ready") {
    return (
      <OpenPositionsView
        offlineSavedAtUtc={savedView.savedAtUtc}
        positionStyles={offlinePositionStyles(savedView.model)}
        result={savedView.model.result}
      />
    );
  }

  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">Open Positions</Typography>
      {savedView.status === "loading" ? (
        <Stack
          role="status"
          sx={{ alignItems: "center", justifyContent: "center", minHeight: 320 }}
        >
          <CircularProgress size={28} />
          <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">
            Loading your saved open positions…
          </Typography>
        </Stack>
      ) : (
        <DashboardUnavailableState
          compact
          description="Open Open Positions once while connected so TraderLink can save its latest confirmed positions on this device."
          title="No saved open positions are available"
        />
      )}
    </DashboardPage>
  );
}
