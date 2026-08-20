"use client";

import { OfflineSavedViewCapture } from "./offline-saved-view-capture";
import type { PlatformOfflineCoverageFact } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";
import {
  PLATFORM_WORKSPACE_OFFLINE_ROUTE_VIEW_VERSION,
  PLATFORM_WORKSPACE_OFFLINE_VIEW_KEY,
  type PlatformWorkspaceOfflineViewModel,
} from "@/src/modules/platform/contracts/platform-workspace-offline-view-contracts";

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
  return (
    <OfflineSavedViewCapture
      accountTimezone={accountTimezone}
      calculationVersion={calculationVersion}
      coverage={coverage}
      generatedAtUtc={generatedAtUtc}
      model={model}
      pathname="/workspace"
      queryIdentity="all-available-history"
      reportingCurrency={reportingCurrency}
      routeViewVersion={PLATFORM_WORKSPACE_OFFLINE_ROUTE_VIEW_VERSION}
      viewKey={PLATFORM_WORKSPACE_OFFLINE_VIEW_KEY}
    />
  );
}
