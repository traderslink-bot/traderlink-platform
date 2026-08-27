import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AcademyShell } from "@/app/academy/academy-shell";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { authorizeWatchlistPageAccess } from "@/src/modules/watchlist/server/access/watchlist-access-service";
import {
  buildWatchlistPreviewMetadata,
  isWatchlistPreviewCrawlerUserAgent,
} from "@/src/lib/live-watchlist/watchlist-preview";
import { LiveWatchlistIndexClient } from "./live-watchlist-client";
import { WatchlistPresenceRecorder } from "./watchlist-presence-recorder";
import { WatchlistVisitRecorder } from "./watchlist-visit-recorder";
import { WatchlistDashboardFrame } from "./watchlist-dashboard-frame";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildWatchlistPreviewMetadata("/watchlist");

export default async function LiveWatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string | string[] }>;
}) {
  const authStatus = normalizeSearchParam((await searchParams).auth);
  const requestHeaders = await headers();
  const isPreviewCrawler = isWatchlistPreviewCrawlerUserAgent(
    requestHeaders.get("user-agent"),
  );
  const access = await authorizeWatchlistPageAccess();
  if (!access.ok) {
    if (access.reason === "login_required" && !authStatus && !isPreviewCrawler) {
      redirect(`/api/auth/discord/login?returnTo=${encodeURIComponent("/watchlist")}`);
    }
    return (
      <WatchlistAccessMessage
        authStatus={authStatus}
        returnTo="/watchlist"
      />
    );
  }

  const state = await new LiveWatchlistStore().listSymbols();
  return (
    <WatchlistDashboardFrame>
      <div className="academy-container watchlist-container">
        <WatchlistVisitRecorder pageKey="index" pageKind="index" />
        <WatchlistPresenceRecorder />
        <LiveWatchlistIndexClient initialState={state} />
      </div>
    </WatchlistDashboardFrame>
  );
}

function WatchlistAccessMessage({
  authStatus,
  returnTo,
}: {
  authStatus?: string;
  returnTo: string;
}) {
  const notice = getWatchlistAuthNotice(authStatus);
  return (
    <AcademyShell forcedTheme="light">
      <div className="academy-container">
        <section className="academy-hero">
          <div className="academy-card watchlist-access-card">
            <p className="academy-eyebrow">Live Watchlist</p>
            <h1 className="academy-title">Log in to view the live watchlist</h1>
            <p className="academy-lede">
              Log in with your TradersLink Discord account to view the live watchlist.
            </p>
            {notice ? (
              <div className="academy-auth-alert academy-auth-alert-warning" role="alert">
                <p className="academy-auth-alert-title">{notice.title}</p>
                <p>{notice.body}</p>
              </div>
            ) : null}
            <Link
              href={`/api/auth/discord/login?returnTo=${encodeURIComponent(returnTo)}${
                authStatus === "join-discord" ? "&prompt=consent" : ""
              }`}
              className="academy-card-action"
            >
              Log in with Discord
            </Link>
          </div>
        </section>
      </div>
    </AcademyShell>
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
