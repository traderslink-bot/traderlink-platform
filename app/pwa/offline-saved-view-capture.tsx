"use client";

import { useEffect } from "react";

import {
  PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION,
  type PlatformOfflineCoverageFact,
} from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";
import {
  platformOfflinePartitionKey,
  platformOfflineSavedViewRef,
  savePlatformOfflineView,
} from "@/src/modules/platform/client/pwa/offline-projection-store";

type OfflineSavedViewContext = Readonly<{
  accountSelectionRef?: string | null;
  offlineScopeRef?: string;
  pathname?: string;
  status?: string;
}>;

export function OfflineSavedViewCapture<TModel>({
  accountTimezone,
  calculationVersion,
  coverage,
  generatedAtUtc,
  model,
  pathname,
  queryIdentity,
  reportingCurrency,
  routeViewVersion,
  viewKey,
}: {
  accountTimezone: string | null;
  calculationVersion: string;
  coverage: readonly PlatformOfflineCoverageFact[];
  generatedAtUtc: string;
  model: TModel;
  pathname: string;
  queryIdentity: string;
  reportingCurrency: string | null;
  routeViewVersion: string;
  viewKey: string;
}) {
  useEffect(() => {
    if (!navigator.onLine) return;
    const controller = new AbortController();
    const save = async () => {
      const response = await fetch(
        `/api/platform/pwa/projection-context?path=${encodeURIComponent(pathname)}`,
        {
          cache: "no-store",
          credentials: "same-origin",
          headers: { accept: "application/json" },
          signal: controller.signal,
        },
      );
      if (!response.ok) return;
      const context = await response.json() as OfflineSavedViewContext;
      if (
        context.status !== "ready" ||
        context.pathname !== pathname ||
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
      await savePlatformOfflineView<TModel>({
        accountSelectionRef: context.accountSelectionRef,
        accountTimezone,
        calculationVersion,
        coverage,
        generatedAtUtc,
        model,
        offlineScopeRef: context.offlineScopeRef,
        partitionKey,
        pathname,
        queryIdentity,
        ref: platformOfflineSavedViewRef(partitionKey, viewKey),
        reportingCurrency,
        routeViewVersion,
        savedAtUtc,
        schemaVersion: PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION,
        viewKey,
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
    pathname,
    queryIdentity,
    reportingCurrency,
    routeViewVersion,
    viewKey,
  ]);

  return null;
}
