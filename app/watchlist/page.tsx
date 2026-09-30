import type { Metadata } from "next";

import { WatchlistHomepageShell } from "./watchlist-homepage-shell";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { projectLiveWatchlistList } from "@/src/lib/live-watchlist/live-watchlist-list";
import { authorizeWatchlistPageAccess } from "@/src/modules/watchlist/server/access/watchlist-access-service";
import {
  buildWatchlistPreviewMetadata,
} from "@/src/lib/live-watchlist/watchlist-preview";
import { LiveWatchlistIndexClient } from "./live-watchlist-client";
import { WatchlistVisitRecorder } from "./watchlist-visit-recorder";
import { WatchlistDashboardFrame } from "./watchlist-dashboard-frame";
import { WatchlistPublicPreview } from "./watchlist-public-preview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildWatchlistPreviewMetadata("/watchlist");

export default async function LiveWatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string | string[] }>;
}) {
  const authStatus = normalizeSearchParam((await searchParams).auth);
  const access = await authorizeWatchlistPageAccess();
  if (!access.ok) {
    return (
      <WatchlistAccessMessage
        authStatus={authStatus}
      />
    );
  }

  const state = await new LiveWatchlistStore().listSymbols();
  return (
    <WatchlistDashboardFrame>
      <div className="academy-container watchlist-container">
        <WatchlistVisitRecorder pageKey="index" pageKind="index" />
        <LiveWatchlistIndexClient initialState={projectLiveWatchlistList(state)} />
      </div>
    </WatchlistDashboardFrame>
  );
}

function WatchlistAccessMessage({
  authStatus,
}: {
  authStatus?: string;
}) {
  const notice = getWatchlistAuthNotice(authStatus);
  return (
    <WatchlistHomepageShell>
      <WatchlistPublicPreview notice={notice} retryConsent={authStatus === "join-discord"} />
    </WatchlistHomepageShell>
  );
}

function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getWatchlistAuthNotice(authStatus: string | undefined) {
  switch (authStatus) {
    case "missing-config":
      return {
        title: "Discord login is not configured locally",
        body: "Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET for this localhost app, then retry Discord login.",
      };
    case "failed":
      return {
        title: "Discord login failed",
        body: "Try logging in again. If it keeps failing, the Discord app callback or credentials may need attention.",
      };
    case "join-discord":
      return {
        title: "Discord membership required",
        body: "Join the TradersLink Discord first, then return here and log in again.",
      };
    case "invalid-state":
      return {
        title: "Login session expired",
        body: "Start Discord login again from this page.",
      };
    default:
      return null;
  }
}
