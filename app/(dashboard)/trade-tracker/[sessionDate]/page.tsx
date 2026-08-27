import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  createJournalDailyTrackerOfflineViewModel,
  journalDailyTrackerOfflineCoverage,
  journalDailyTrackerOfflineViewKey,
  JOURNAL_DAILY_TRACKER_OFFLINE_ROUTE_VIEW_VERSION,
} from "@/src/modules/journal/contracts/journal-daily-tracker-offline-view-contracts";
import {
  DashboardPage,
  DashboardUnavailableState,
} from "../../../dashboard-template";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { readMoomooMarketDataAccess } from "@/src/modules/level-analysis/server/moomoo-market-data-access";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import { readJournalFirstExecutionOnboardingStatus } from "@/src/modules/journal/server/product/journal-first-execution-onboarding";

import {
  getReplacementReportingDaySession,
  getReplacementTradeTrackerAccount,
} from "../trade-tracker-platform-data";
import { getDaySessionDesignPreview } from "./day-session-preview-data";
import { DaySessionView } from "./day-session-view";
import { ManualExecutionEntry } from "../manual-execution-entry";
import { TradeTrackerUnsavedChangesProvider } from "../trade-tracker-unsaved-changes";

export const metadata: Metadata = {
  description: "Review one trading day by ticker and completed round trip.",
  title: "Trade Tracker | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TradeTrackerDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionDate: string }>;
  searchParams: Promise<{
    currency?: string;
    event?: string;
    interval?: string;
    preview?: string;
    trade?: string;
  }>;
}) {
  const { sessionDate } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) notFound();

  const query = await searchParams;
  const designPreview = process.env.NODE_ENV !== "production" &&
    query.preview === "design";
  if (designPreview) {
    return (
      <TradeTrackerUnsavedChangesProvider>
        <DaySessionView data={getDaySessionDesignPreview(sessionDate)} designPreview />
      </TradeTrackerUnsavedChangesProvider>
    );
  }

  const scope = await requireTraderLinkPlatformPageScope();
  const onboardingStatus = readJournalFirstExecutionOnboardingStatus(scope);
  const demoAccountSelectionRef = onboardingStatus.activeAccountIsDemo
    ? currentJournalAccountSelectionRef(scope)
    : null;
  const account = getReplacementTradeTrackerAccount(scope);
  const moomooMarketDataAccess = withReadonlyPlatformDatabase({}, (database) =>
    readMoomooMarketDataAccess(database, scope));
  const data = await getReplacementReportingDaySession(scope, {
    date: sessionDate,
  });
  if (data) {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
    const interval = query.interval === "5m" || query.interval === "15m" || query.interval === "1h"
      ? query.interval
      : "1m";
    const initialAnalyzerFocus = query.trade && uuid.test(query.trade)
      ? {
          eventId: query.event && uuid.test(query.event) ? query.event : null,
          interval,
          roundTripId: query.trade,
        } as const
      : null;
    return (
      <TradeTrackerUnsavedChangesProvider>
        <OfflineSavedViewCapture
          accountTimezone={data.timezone}
          calculationVersion="journal-daily-tracker-v1"
          coverage={journalDailyTrackerOfflineCoverage()}
          generatedAtUtc={new Date().toISOString()}
          model={createJournalDailyTrackerOfflineViewModel(data)}
          pathname={`/trade-tracker/${data.date}`}
          queryIdentity={`date:${data.date}`}
          reportingCurrency={data.currency}
          routeViewVersion={JOURNAL_DAILY_TRACKER_OFFLINE_ROUTE_VIEW_VERSION}
          viewKey={journalDailyTrackerOfflineViewKey(data.date)}
        />
        <DaySessionView
          data={data}
          initialAnalyzerFocus={initialAnalyzerFocus}
          readOnly={demoAccountSelectionRef !== null}
          showMoomooConnectionGuidance={!demoAccountSelectionRef &&
            moomooMarketDataAccess.shouldShowConnectionGuidance}
          topContent={
            !demoAccountSelectionRef ? <ManualExecutionEntry
              accountCurrency={account?.baseCurrency ?? data.currency}
              accountTimezone={account?.tradingTimezone ?? data.timezone}
              defaultSessionDate={data.date}
              expectedAccountSelectionRef={currentJournalAccountSelectionRef(scope)}
              key="manual-execution-entry"
              offlineScopeRef={currentPlatformOfflineScopeRef(scope)}
            /> : null
          }
        />
      </TradeTrackerUnsavedChangesProvider>
    );
  }

  return (
    <DashboardPage>
      <DashboardUnavailableState
        actionHref="/trade-tracker"
        actionLabel="Open latest traded day"
        description="This date is not present in the accepted Trade Tracker activity. No V3 or sample rows are substituted."
        title="No trades for this day"
      />
    </DashboardPage>
  );
}
