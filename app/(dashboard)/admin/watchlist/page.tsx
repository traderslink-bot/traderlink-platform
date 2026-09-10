import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DashboardPage } from "@/app/dashboard-template";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { readWatchlistUsageAdminSnapshot } from "@/src/modules/watchlist/server/watchlist-usage-service";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { WatchlistRuntimeAdminClient } from "./watchlist-runtime-admin-client";
import { WatchlistUsageAdminPanel } from "./watchlist-usage-admin-panel";
import { WatchlistDailyRecapsAdminPanel } from "./watchlist-daily-recaps-admin-panel";
import { readDailyRecapFinalItems, readDailyRecapFinalDraft, readDailyRecapOwnerCandidates, readDailyRecapStorageSummary, readDailyRecapPostHistory } from "@/src/modules/watchlist/server/daily-recaps/daily-recap-owner-service";

export const metadata: Metadata = {
  description: "Manage the private TradersLink Watchlist runtime.",
  title: "Watchlist Admin | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WatchlistRuntimeAdminPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasWatchlistDashboardNavigationAccess(identity)) notFound();
  let usage: ReturnType<typeof readWatchlistUsageAdminSnapshot> | null = null;
  try {
    usage = readWatchlistUsageAdminSnapshot();
  } catch {
    usage = null;
  }
  const dateParts = new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", timeZone: "America/New_York", year: "numeric" }).formatToParts(new Date());
  const part = (type: string) => dateParts.find((value) => value.type === type)?.value ?? "";
  const recapDate = `${part("year")}-${part("month")}-${part("day")}`;
  let recapCandidates: ReturnType<typeof readDailyRecapOwnerCandidates> = [];
  let recapStorage: ReturnType<typeof readDailyRecapStorageSummary> | null = null;
  let recapPosts: ReturnType<typeof readDailyRecapPostHistory> = [];
  let finalDraft: string | null = null;
  let finalItems: ReturnType<typeof readDailyRecapFinalItems> = [];
  try { finalItems = readDailyRecapFinalItems(recapDate, identity.scope.userId); } catch { finalItems = []; }
  try { finalDraft = readDailyRecapFinalDraft(recapDate, identity.scope.userId); } catch { finalDraft = null; }
  try { recapCandidates = [...readDailyRecapOwnerCandidates(recapDate)]; } catch { recapCandidates = []; }
  try { recapStorage = readDailyRecapStorageSummary(); } catch { recapStorage = null; }
  try { recapPosts = readDailyRecapPostHistory(recapDate, identity.scope.userId); } catch { recapPosts = []; }
  return (
    <DashboardPage>
      <WatchlistRuntimeAdminClient dailyRecapsPanel={<WatchlistDailyRecapsAdminPanel initialFinalItems={finalItems} initialFinalDraft={finalDraft} initialDate={recapDate} initialCandidates={recapCandidates} initialStorage={recapStorage} initialPosts={recapPosts} />} usagePanel={<WatchlistUsageAdminPanel usage={usage} />} />
    </DashboardPage>
  );
}
