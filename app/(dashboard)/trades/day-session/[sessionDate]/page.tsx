import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  DashboardPage,
  DashboardUnavailableState,
} from "../../../../dashboard-template";

import { getDaySessionDesignPreview } from "./day-session-preview-data";
import { DaySessionView } from "./day-session-view";

export const metadata: Metadata = {
  description: "Review one trading day by ticker and completed round trip.",
  title: "Day Session | Trader Intelligence",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DaySessionPage({
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
    return <DaySessionView data={getDaySessionDesignPreview(sessionDate)} />;
  }

  return (
    <DashboardPage>
      <DashboardUnavailableState
        actionHref="/trades/day-sessions"
        actionLabel="View Day Sessions"
        description="The governed Day Session data connection will be added after the visual design is approved."
        title="Day Session preview is not active"
      />
    </DashboardPage>
  );
}

