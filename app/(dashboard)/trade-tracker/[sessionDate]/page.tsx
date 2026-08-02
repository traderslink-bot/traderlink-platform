import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  DashboardPage,
  DashboardUnavailableState,
} from "../../../dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { getReplacementDaySession } from "../trade-tracker-platform-data";
import { getDaySessionDesignPreview } from "./day-session-preview-data";
import { DaySessionView } from "./day-session-view";

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
  searchParams: Promise<{ currency?: string; preview?: string }>;
}) {
  const { sessionDate } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) notFound();

  const query = await searchParams;
  const designPreview = process.env.NODE_ENV !== "production" &&
    query.preview === "design";
  if (designPreview) {
    return <DaySessionView data={getDaySessionDesignPreview(sessionDate)} designPreview />;
  }

  const scope = await requireTraderLinkPlatformPageScope();
  const data = getReplacementDaySession(scope, {
    date: sessionDate,
    currency: query.currency?.toUpperCase() ?? null,
  });
  if (data) return <DaySessionView data={data} readOnly />;

  return (
    <DashboardPage>
      <DashboardUnavailableState
        actionHref="/trade-tracker"
        actionLabel="Open latest traded day"
        description="This date is not present in the accepted Journal activity available to Trade Tracker. No V3 or sample rows are substituted."
        title="No trades for this day"
      />
    </DashboardPage>
  );
}
