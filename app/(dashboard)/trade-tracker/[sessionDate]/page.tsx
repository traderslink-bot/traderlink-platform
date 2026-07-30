import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  DashboardPage,
  DashboardUnavailableState,
} from "../../../dashboard-template";

import { getGovernedDaySession } from "../trade-tracker-data";
import { getDaySessionDesignPreview } from "./day-session-preview-data";
import { DaySessionView } from "./day-session-view";

export const metadata: Metadata = {
  description: "Review one trading day by ticker and completed round trip.",
  title: "Trade Tracker | Trader Intelligence",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TradeTrackerDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionDate: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { sessionDate } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) notFound();

  const designPreview =
    process.env.NODE_ENV !== "production" &&
    (await searchParams).preview === "design";
  if (designPreview) {
    return (
      <DaySessionView
        data={getDaySessionDesignPreview(sessionDate)}
        designPreview
      />
    );
  }

  const data = await getGovernedDaySession(sessionDate);
  if (data) return <DaySessionView data={data} />;

  return (
    <DashboardPage>
      <DashboardUnavailableState
        actionHref="/trade-tracker"
        actionLabel="Open latest traded day"
        description="This date is not present in the verified closed-trade data available to Trade Tracker."
        title="No verified trades for this day"
      />
    </DashboardPage>
  );
}
