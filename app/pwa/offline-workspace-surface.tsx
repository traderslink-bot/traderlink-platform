"use client";

import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { WorkspaceDashboard } from "@/app/(dashboard)/workspace/workspace-dashboard";
import { DashboardPage, DashboardUnavailableState } from "@/app/dashboard-ui";
import { readPlatformOfflineView } from "@/src/modules/platform/client/pwa/offline-projection-store";
import { PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";
import {
  isPlatformWorkspaceOfflineViewModel,
  PLATFORM_WORKSPACE_OFFLINE_ROUTE_VIEW_VERSION,
  PLATFORM_WORKSPACE_OFFLINE_VIEW_KEY,
  type PlatformWorkspaceOfflineViewModel,
} from "@/src/modules/platform/contracts/platform-workspace-offline-view-contracts";

type WorkspaceSavedViewState =
  | Readonly<{ status: "loading" }>
  | Readonly<{
    model: PlatformWorkspaceOfflineViewModel;
    savedAtUtc: string;
    status: "ready";
  }>
  | Readonly<{ status: "unavailable" }>;

export function OfflineWorkspaceSurface({
  partitionKey,
}: {
  partitionKey: string;
}) {
  const [savedView, setSavedView] = useState<WorkspaceSavedViewState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const view = await readPlatformOfflineView(
          partitionKey,
          PLATFORM_WORKSPACE_OFFLINE_VIEW_KEY,
        );
        if (!active) return;
        if (
          view?.schemaVersion !== PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION ||
          view.pathname !== "/workspace" ||
          view.queryIdentity !== "all-available-history" ||
          view.routeViewVersion !== PLATFORM_WORKSPACE_OFFLINE_ROUTE_VIEW_VERSION ||
          view.viewKey !== PLATFORM_WORKSPACE_OFFLINE_VIEW_KEY ||
          !isPlatformWorkspaceOfflineViewModel(view.model)
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
      <WorkspaceDashboard
        analyticsMetrics={savedView.model.analyticsMetrics}
        offlineSavedAtUtc={savedView.savedAtUtc}
        reviewSummary={savedView.model.reviewSummary}
      />
    );
  }

  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">Workspace</Typography>
      {savedView.status === "loading" ? (
        <Stack
          role="status"
          sx={{ alignItems: "center", minHeight: 320, justifyContent: "center" }}
        >
          <CircularProgress size={28} />
          <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">
            Loading your saved Workspace…
          </Typography>
        </Stack>
      ) : (
        <DashboardUnavailableState
          compact
          description="Open Workspace once while connected so TraderLink can save its latest verified summary on this device."
          title="No saved Workspace is available"
        />
      )}
    </DashboardPage>
  );
}
