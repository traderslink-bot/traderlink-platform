import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  DashboardPage,
  DashboardUnavailableState,
} from "../../dashboard-template";

import { getLatestGovernedSessionDate } from "./trade-tracker-data";

export const metadata: Metadata = {
  description: "Review the latest governed trading day.",
  title: "Trade Tracker | Trader Intelligence",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DESIGN_PREVIEW_SESSION_DATE = "2026-07-28";

export default async function TradeTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const designPreview =
    process.env.NODE_ENV !== "production" &&
    (await searchParams).preview === "design";
  if (designPreview) {
    redirect(
      `/trade-tracker/${DESIGN_PREVIEW_SESSION_DATE}?preview=design`,
    );
  }

  const latestSessionDate = await getLatestGovernedSessionDate();
  if (latestSessionDate) {
    redirect(`/trade-tracker/${latestSessionDate}`);
  }

  return (
    <DashboardPage>
      <DashboardUnavailableState
        description="Trade Tracker needs verified closed-trade data before it can select your latest traded day."
        title="No verified traded day is available"
      />
    </DashboardPage>
  );
}
