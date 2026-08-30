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
import {
  scheduleOfflineProjectionContextRead,
  useOfflineProjectionRequestScope,
  type OfflineProjectionContext,
} from "./offline-projection-context";

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
  const requestScope = useOfflineProjectionRequestScope();
  useEffect(() => {
    if (!navigator.onLine || !requestScope) return;
    const save = (context: OfflineProjectionContext | null) => {
      if (
        !context ||
        context.status !== "ready" ||
        context.pathname !== pathname ||
        typeof context.offlineScopeRef !== "string" ||
        typeof context.accountSelectionRef !== "string" ||
        context.offlineScopeRef !== requestScope.offlineScopeRef ||
        context.accountSelectionRef !== requestScope.accountSelectionRef
      ) {
        return;
      }
      const partitionKey = platformOfflinePartitionKey(
        context.offlineScopeRef,
        context.accountSelectionRef,
      );
      const savedAtUtc = new Date().toISOString();
      void savePlatformOfflineView<TModel>({
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
      }).catch(() => undefined);
    };
    return scheduleOfflineProjectionContextRead({
      onContext: save,
      pathname,
      scope: requestScope,
    });
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
    requestScope,
    viewKey,
  ]);

  return null;
}
