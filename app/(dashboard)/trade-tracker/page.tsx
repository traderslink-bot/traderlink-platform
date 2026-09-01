import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
} from "../../dashboard-template";
import { DashboardPageDescription } from "../dashboard-page-description";
import { DashboardAppearanceText } from "../dashboard-appearance-text";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { readJournalFirstExecutionOnboardingStatus } from "@/src/modules/journal/server/product/journal-first-execution-onboarding";
import {
  journalScopeCurrentDate,
  readJournalDemoScopeClock,
} from "@/src/modules/journal/server/demo/journal-demo-scope-clock";
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
  const demoClock = readJournalDemoScopeClock(scope);
  if (onboardingStatus.activeAccountIsDemo) {
    if (!demoClock) throw new Error("TRADERLINK_DEMO_CLOCK_UNAVAILABLE");
    redirect(`/trade-tracker/${demoClock.today}`);
  }
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
  const reportingDate = journalScopeCurrentDate(demoClock, "UTC");
  const initialData = await getReplacementReportingDaySession(scope, {
    date: reportingDate,
  });
  const accountTimezone = account?.tradingTimezone ?? initialData?.timezone ?? "UTC";
  const currentDate = journalScopeCurrentDate(demoClock, accountTimezone);
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
        <DaySessionView
          data={data}
          demoAccount={demoAccountSelectionRef !== null}
          offlineCapture={{
            generatedAtUtc,
            pathname: "/trade-tracker",
            queryIdentity: `date:${data.date}`,
          }}
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
        <DashboardPageDescription maxWidth={900} variant="body2">
          The Daily Trade Tracker helps you review one trading day and the trades you took on that particular day. Add tags, notes and track rules for each trade. Add notes and track rules that apply to the trading day as a whole.
        </DashboardPageDescription>
        <DashboardAppearanceText lightColor="error.main" sx={{ fontWeight: 700, maxWidth: 900 }} variant="body2">
          Notes, rules, tags and trade information will appear below after you submit your executions.
        </DashboardAppearanceText>
        {topContent}
      </DashboardPage>
    </TradeTrackerUnsavedChangesProvider>
  );
}
