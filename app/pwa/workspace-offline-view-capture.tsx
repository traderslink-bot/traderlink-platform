"use client";

import { useEffect } from "react";

import {
  PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION,
  type PlatformOfflineCoverageFact,
} from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";
import {
  PLATFORM_WORKSPACE_OFFLINE_ROUTE_VIEW_VERSION,
  PLATFORM_WORKSPACE_OFFLINE_VIEW_KEY,
  type PlatformWorkspaceOfflineViewModel,
} from "@/src/modules/platform/contracts/platform-workspace-offline-view-contracts";
import {
  platformOfflinePartitionKey,
  platformOfflineSavedViewRef,
  savePlatformOfflineView,
} from "@/src/modules/platform/client/pwa/offline-projection-store";

type WorkspaceCaptureContext = Readonly<{
  accountSelectionRef?: string | null;
  offlineScopeRef?: string;
  pathname?: string;
  status?: string;
}>;

export function WorkspaceOfflineViewCapture({
  accountTimezone,
  calculationVersion,
  coverage,
  generatedAtUtc,
  model,
  reportingCurrency,
}: {
  accountTimezone: string | null;
  calculationVersion: string;
  coverage: readonly PlatformOfflineCoverageFact[];
  generatedAtUtc: string;
  model: PlatformWorkspaceOfflineViewModel;
  reportingCurrency: string | null;
}) {
  useEffect(() => {
    if (!navigator.onLine) return;
    const controller = new AbortController();

    const save = async () => {
      const response = await fetch(
        "/api/platform/pwa/projection-context?path=%2Fworkspace",
        {
          cache: "no-store",
          credentials: "same-origin",
          headers: { accept: "application/json" },
          signal: controller.signal,
        },
      );
      if (!response.ok) return;
      const context = await response.json() as WorkspaceCaptureContext;
      if (
        context.status !== "ready" ||
        context.pathname !== "/workspace" ||
        typeof context.offlineScopeRef !== "string" ||
        typeof context.accountSelectionRef !== "string"
      ) {
        return;
      }
      const partitionKey = platformOfflinePartitionKey(
        context.offlineScopeRef,
        context.accountSelectionRef,
      );
      const savedAtUtc = new Date().toISOString();
      await savePlatformOfflineView({
        accountSelectionRef: context.accountSelectionRef,
        accountTimezone,
        calculationVersion,
        coverage,
        generatedAtUtc,
        model,
        offlineScopeRef: context.offlineScopeRef,
        partitionKey,
        pathname: "/workspace",
        queryIdentity: "all-available-history",
        ref: platformOfflineSavedViewRef(
          partitionKey,
          PLATFORM_WORKSPACE_OFFLINE_VIEW_KEY,
        ),
        reportingCurrency,
        routeViewVersion: PLATFORM_WORKSPACE_OFFLINE_ROUTE_VIEW_VERSION,
        savedAtUtc,
        schemaVersion: PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION,
        viewKey: PLATFORM_WORKSPACE_OFFLINE_VIEW_KEY,
      });
    };

    void save().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
    });
    return () => controller.abort();
  }, [
    accountTimezone,
    calculationVersion,
    coverage,
    generatedAtUtc,
    model,
    reportingCurrency,
  ]);

  return null;
}
