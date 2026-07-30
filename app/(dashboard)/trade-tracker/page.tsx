import type { Metadata } from "next";
import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

import { getWorkingDayReviewConfiguration } from "./trade-tracker-data";
import { TradeTrackerWorkingDay } from "./working-day";
import { TradeTrackerWorkingDayPreview } from "./working-day-preview";

export const metadata: Metadata = {
  description: "Review the latest governed trading day.",
  title: "Trade Tracker | Trader Intelligence",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DESIGN_PREVIEW_SESSION_DATE = "2026-07-28";

function currentNewYorkDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).formatToParts(new Date());
  const value = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export default async function TradeTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const designPreview =
    process.env.NODE_ENV !== "production" &&
    (await searchParams).preview === "design";
  if (designPreview) {
    return (
      <TradeTrackerWorkingDayPreview
        sessionDate={DESIGN_PREVIEW_SESSION_DATE}
      />
    );
  }

  const owner = await requireTraderIntelligenceOwnerPageAccess(
    "app/(dashboard)/trade-tracker/page.tsx",
  );
  return (
    <TradeTrackerWorkingDay
      reviewConfiguration={getWorkingDayReviewConfiguration(owner)}
      sessionDate={currentNewYorkDate()}
    />
  );
}
