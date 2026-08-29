import type { Metadata } from "next";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  createJournalDailyTrackerOfflineViewModel,
  journalDailyTrackerOfflineCoverage,
  journalDailyTrackerOfflineViewKey,
  JOURNAL_DAILY_TRACKER_OFFLINE_ROUTE_VIEW_VERSION,
} from "@/src/modules/journal/contracts/journal-daily-tracker-offline-view-contracts";
import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
} from "../../dashboard-template";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { readJournalFirstExecutionOnboardingStatus } from "@/src/modules/journal/server/product/journal-first-execution-onboarding";
import { readMoomooMarketDataAccess } from "@/src/modules/level-analysis/server/moomoo-market-data-access";

import {
  getReplacementReportingDaySession,
  getReplacementTradeTrackerAccount,
} from "./trade-tracker-platform-data";
import { ManualExecutionEntry } from "./manual-execution-entry";
import { TradeTrackerWorkingDayPreview } from "./working-day-preview";
import { DaySessionView } from "./[sessionDate]/day-session-view";
import { TradeTrackerUnsavedChangesProvider } from "./trade-tracker-unsaved-changes";

export const metadata: Metadata = {
  description: "Enter and review the current trading week's Trade Tracker executions.",
  title: "Daily Trade Tracker | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DESIGN_PREVIEW_SESSION_DATE = "2026-07-28";
const DEMO_TRADE_TRACKER_LAST_DAY = "2026-08-27";

function currentDateInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date());
  const part = (type: "day" | "month" | "year") =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default async function TradeTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{
    currency?: string;
    gettingStarted?: string;
    moomoo?: string;
    preview?: string;
  }>;
}) {
  const query = await searchParams;
  const designPreview = process.env.NODE_ENV !== "production" &&
    query.preview === "design";
  if (designPreview) {
    return <TradeTrackerWorkingDayPreview sessionDate={DESIGN_PREVIEW_SESSION_DATE} />;
  }

  const scope = await requireTraderLinkPlatformPageScope();
  const onboardingStatus = readJournalFirstExecutionOnboardingStatus(scope);
  const showFirstExecutionCallout = query.gettingStarted === "daily-entry" &&
    !onboardingStatus.activeAccountIsDemo &&
    !onboardingStatus.hasRealAcceptedExecution;
  const demoAccountSelectionRef = onboardingStatus.activeAccountIsDemo
    ? currentJournalAccountSelectionRef(scope)
    : null;
  const showMoomooConnectedStatus = showFirstExecutionCallout &&
    query.moomoo === "connected" && onboardingStatus.hasActiveMoomooConnection;
  const account = getReplacementTradeTrackerAccount(scope);
  const moomooMarketDataAccess = withReadonlyPlatformDatabase({}, (database) =>
    readMoomooMarketDataAccess(database, scope));
  const utcDate = new Date().toISOString().slice(0, 10);
  const reportingDate = demoAccountSelectionRef ? DEMO_TRADE_TRACKER_LAST_DAY : utcDate;
  const initialData = await getReplacementReportingDaySession(scope, {
    date: reportingDate,
  });
  const accountTimezone = account?.tradingTimezone ?? initialData?.timezone ?? "UTC";
  const currentDate = demoAccountSelectionRef ? DEMO_TRADE_TRACKER_LAST_DAY : currentDateInTimezone(accountTimezone);
  const data = currentDate === reportingDate
    ? initialData
    : await getReplacementReportingDaySession(scope, {
        date: currentDate,
      });
  const topContent = (
    <>
      {showFirstExecutionCallout ? (
        <DashboardPanel title="Ready to add your first execution">
          <Stack spacing={0.75} sx={{ maxWidth: 760 }}>
            {showMoomooConnectedStatus ? (
              <Typography color="success.main" sx={{ fontWeight: 700 }} variant="body2">
                Moomoo is connected. Your eligible completed trades can now receive Trade Analyzer reviews.
              </Typography>
            ) : null}
            <Typography color="text.secondary" variant="body2">
              Use the form below to enter the exact date, time, price, quantity, and Buy or Sell side shown by your broker.
            </Typography>
          </Stack>
        </DashboardPanel>
      ) : null}
      {!demoAccountSelectionRef && moomooMarketDataAccess.shouldShowConnectionGuidance && !showFirstExecutionCallout ? (
        <Stack spacing={0.75} sx={{ alignItems: "flex-start", maxWidth: 900, mt: 1 }}>
          <Typography color="error.main" sx={{ fontWeight: 700 }} variant="body2">
            You need a data connection if you want your trades analyzed and a chart trade replay.
          </Typography>
          <DashboardPrimaryAction href="/account/trading" size="small">
            Connect Data
          </DashboardPrimaryAction>
        </Stack>
      ) : null}
      {!demoAccountSelectionRef ? (
        <ManualExecutionEntry
          accountCurrency={account?.baseCurrency ?? data?.currency ?? "USD"}
          accountTimezone={accountTimezone}
          defaultSessionDate={currentDate}
          expectedAccountSelectionRef={currentJournalAccountSelectionRef(scope)}
          key="manual-execution-entry"
          onboarding={showFirstExecutionCallout}
          offlineScopeRef={currentPlatformOfflineScopeRef(scope)}
        />
      ) : null}
    </>
  );
  if (data) {
    const generatedAtUtc = new Date().toISOString();
    return (
      <TradeTrackerUnsavedChangesProvider>
        <OfflineSavedViewCapture
          accountTimezone={data.timezone}
          calculationVersion="journal-daily-tracker-v1"
          coverage={journalDailyTrackerOfflineCoverage()}
          generatedAtUtc={generatedAtUtc}
          model={createJournalDailyTrackerOfflineViewModel(data)}
          pathname="/trade-tracker"
          queryIdentity={`date:${data.date}`}
          reportingCurrency={data.currency}
          routeViewVersion={JOURNAL_DAILY_TRACKER_OFFLINE_ROUTE_VIEW_VERSION}
          viewKey={journalDailyTrackerOfflineViewKey(data.date)}
        />
        <DaySessionView
          data={data}
          demoAccount={demoAccountSelectionRef !== null}
          readOnly={demoAccountSelectionRef !== null}
          topContent={topContent}
        />
      </TradeTrackerUnsavedChangesProvider>
    );
  }

  return (
    <TradeTrackerUnsavedChangesProvider>
      <DashboardPage>
        <Typography component="h1" variant="h1">Daily Trade Tracker</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 900 }} variant="body2">
          The Daily Trade Tracker helps you review one trading day and the trades you took on that particular day. Add tags, notes and track rules for each trade. Add notes and track rules that apply to the trading day as a whole.
        </Typography>
        <Typography color="error.main" sx={{ fontWeight: 700, maxWidth: 900 }} variant="body2">
          Notes, rules, tags and trade information will appear below after you submit your executions.
        </Typography>
        {topContent}
      </DashboardPage>
    </TradeTrackerUnsavedChangesProvider>
  );
}
