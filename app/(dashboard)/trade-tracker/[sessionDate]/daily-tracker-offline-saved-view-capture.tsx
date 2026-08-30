"use client";

import { useMemo } from "react";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  createJournalDailyTrackerOfflineViewModel,
  journalDailyTrackerOfflineCoverage,
  journalDailyTrackerOfflineViewKey,
  JOURNAL_DAILY_TRACKER_OFFLINE_ROUTE_VIEW_VERSION,
} from "@/src/modules/journal/contracts/journal-daily-tracker-offline-view-contracts";

import type { DaySessionData } from "./day-session-types";

const DAILY_TRACKER_OFFLINE_COVERAGE = journalDailyTrackerOfflineCoverage();

export type DailyTrackerOfflineCaptureMetadata = Readonly<{
  generatedAtUtc: string;
  pathname: string;
  queryIdentity: string;
}>;

export function DailyTrackerOfflineSavedViewCapture({
  data,
  metadata,
}: Readonly<{
  data: DaySessionData;
  metadata: DailyTrackerOfflineCaptureMetadata;
}>) {
  const model = useMemo(
    () => createJournalDailyTrackerOfflineViewModel(data),
    [data],
  );

  return (
    <OfflineSavedViewCapture
      accountTimezone={data.timezone}
      calculationVersion="journal-daily-tracker-v1"
      coverage={DAILY_TRACKER_OFFLINE_COVERAGE}
      generatedAtUtc={metadata.generatedAtUtc}
      model={model}
      pathname={metadata.pathname}
      queryIdentity={metadata.queryIdentity}
      reportingCurrency={data.currency}
      routeViewVersion={JOURNAL_DAILY_TRACKER_OFFLINE_ROUTE_VIEW_VERSION}
      viewKey={journalDailyTrackerOfflineViewKey(data.date)}
    />
  );
}
