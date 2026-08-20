import type { Metadata } from "next";

import { Box } from "@mui/material";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  createJournalSwingTrackerOfflineViewModel,
  JOURNAL_SWING_TRACKER_OFFLINE_ROUTE_VIEW_VERSION,
  JOURNAL_SWING_TRACKER_OFFLINE_VIEW_KEY,
  journalSwingTrackerOfflineCoverage,
} from "@/src/modules/journal/contracts/journal-swing-tracker-offline-view-contracts";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import { DashboardPage, DashboardUnavailableState } from "../../../dashboard-template";
import { ManualExecutionEntry } from "../manual-execution-entry";
import {
  getReplacementSwingTrackerPositions,
  getReplacementSwingPositionDetail,
  getReplacementTradeTrackerAccount,
} from "../trade-tracker-platform-data";
import { SwingTrackerView } from "./swing-tracker-view";

export const metadata: Metadata = {
  description: "Track active and recently completed intentional swing trades.",
  title: "Swing Trade Tracker | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function currentDateInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date());
  const part = (type: "day" | "month" | "year") =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function initialSymbol(value: string | undefined): string {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z0-9.^/_-]{1,32}$/u.test(normalized) ? normalized : "";
}

export default async function SwingTradeTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    direction?: string;
    symbol?: string;
  }>;
}) {
  const scope = await requireTraderLinkPlatformPageScope();
  const account = getReplacementTradeTrackerAccount(scope);
  if (!account) {
    return (
      <DashboardPage>
        <DashboardUnavailableState
          actionHref="/account"
          actionLabel="Choose a Trade Tracker account"
          description="Select the Trade Tracker account whose swing trades you want to review."
          title="No Trade Tracker account selected"
        />
      </DashboardPage>
    );
  }
  const query = await searchParams;
  const reviewDate = currentDateInTimezone(account.tradingTimezone);
  const positions = getReplacementSwingTrackerPositions(scope, reviewDate);
  const detail = (positionRef: string) =>
    getReplacementSwingPositionDetail(scope, positionRef, reviewDate);
  const action = query.action === "add" || query.action === "reduce" || query.action === "close" || query.action === "record"
    ? query.action
    : null;
  const direction = query.direction === "short" ? "short" : "long";
  const entry = (
    <Box id="swing-execution-entry" key="swing-execution-entry" sx={{ scrollMarginTop: 96 }}>
      <ManualExecutionEntry
        accountCurrency={account.baseCurrency}
        accountTimezone={account.tradingTimezone}
        defaultSessionDate={reviewDate}
        expectedAccountSelectionRef={currentJournalAccountSelectionRef(scope)}
        initialAction={action}
        initialDirection={direction}
        initialSymbol={initialSymbol(query.symbol)}
        offlineScopeRef={currentPlatformOfflineScopeRef(scope)}
        tracker="swing"
      />
    </Box>
  );
  const active = await Promise.all(
    positions.active.map((position) => detail(position.positionRef)),
  );
  const completed = await Promise.all(
    positions.completed.map((position) => detail(position.positionRef)),
  );
  const offlineModel = createJournalSwingTrackerOfflineViewModel({
    active,
    completed,
    reviewDate,
  });
  const generatedAtUtc = new Date().toISOString();
  return (
    <>
      <OfflineSavedViewCapture
        accountTimezone={account.tradingTimezone}
        calculationVersion="journal-swing-tracker-v1"
        coverage={journalSwingTrackerOfflineCoverage()}
        generatedAtUtc={generatedAtUtc}
        model={offlineModel}
        pathname="/trade-tracker/swings"
        queryIdentity={`current:${reviewDate}`}
        reportingCurrency={account.baseCurrency}
        routeViewVersion={JOURNAL_SWING_TRACKER_OFFLINE_ROUTE_VIEW_VERSION}
        viewKey={JOURNAL_SWING_TRACKER_OFFLINE_VIEW_KEY}
      />
      <SwingTrackerView
        active={active}
        completed={completed}
        expectedAccountSelectionRef={currentJournalAccountSelectionRef(scope)}
        reviewDate={reviewDate}
        topContent={entry}
      />
    </>
  );
}
