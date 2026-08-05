import type { Metadata } from "next";

import {
  DashboardPage,
  DashboardUnavailableState,
} from "../../dashboard-template";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import {
  getReplacementDaySession,
  getReplacementTradeTrackerAccount,
} from "./trade-tracker-platform-data";
import { ManualExecutionEntry } from "./manual-execution-entry";
import { TradeTrackerWorkingDayPreview } from "./working-day-preview";
import { DaySessionView } from "./[sessionDate]/day-session-view";

export const metadata: Metadata = {
  description: "Enter and review the current trading week's Journal executions.",
  title: "Daily Trade Tracker | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DESIGN_PREVIEW_SESSION_DATE = "2026-07-28";

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
  searchParams: Promise<{ currency?: string; preview?: string }>;
}) {
  const query = await searchParams;
  const designPreview = process.env.NODE_ENV !== "production" &&
    query.preview === "design";
  if (designPreview) {
    return <TradeTrackerWorkingDayPreview sessionDate={DESIGN_PREVIEW_SESSION_DATE} />;
  }

  const scope = await requireTraderLinkPlatformPageScope();
  const account = getReplacementTradeTrackerAccount(scope);
  const utcDate = new Date().toISOString().slice(0, 10);
  const initialData = getReplacementDaySession(scope, {
    date: utcDate,
    currency: query.currency?.toUpperCase() ?? null,
  });
  const accountTimezone = account?.tradingTimezone ?? initialData?.timezone ?? "UTC";
  const currentDate = currentDateInTimezone(accountTimezone);
  const data = currentDate === utcDate
    ? initialData
    : getReplacementDaySession(scope, {
        date: currentDate,
        currency: query.currency?.toUpperCase() ?? null,
      });
  const topContent = (
    <ManualExecutionEntry
      accountCurrency={account?.baseCurrency ?? data?.currency ?? "USD"}
      accountTimezone={accountTimezone}
      defaultSessionDate={currentDate}
      expectedAccountSelectionRef={currentJournalAccountSelectionRef(scope)}
      key="manual-execution-entry"
    />
  );
  if (data) {
    return (
      <DaySessionView
        data={data}
        topContent={topContent}
      />
    );
  }

  return (
    <DashboardPage>
      {topContent}
      <DashboardUnavailableState
        actionHref="/imports"
        actionLabel="Import trades"
        description="No accepted execution activity is available for Trade Tracker. No V3 or sample rows are substituted."
        title="No trading day available"
      />
    </DashboardPage>
  );
}
