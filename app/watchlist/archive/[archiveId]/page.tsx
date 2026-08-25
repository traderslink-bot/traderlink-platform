import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AcademyShell } from "@/app/academy/academy-shell";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { authorizeWatchlistPageAccess } from "@/src/modules/watchlist/server/access/watchlist-access-service";
import { LiveWatchlistArchiveDetailClient } from "../../live-watchlist-client";
import { WatchlistDashboardFrame } from "../../watchlist-dashboard-frame";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ archiveId: string }>;
}): Promise<Metadata> {
  const { archiveId } = await params;
  return {
    title: `${archiveId.toUpperCase()} Archived Watchlist | TradersLink`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function LiveWatchlistArchiveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ archiveId: string }>;
  searchParams: Promise<{ auth?: string | string[] }>;
}) {
  const { archiveId } = await params;
  const authStatus = normalizeSearchParam((await searchParams).auth);
  const access = await authorizeWatchlistPageAccess();
  if (!access.ok) {
    const loginRequired = access.reason === "login_required";
    const returnTo = `/watchlist/archive/${encodeURIComponent(archiveId.toUpperCase())}`;
    if (loginRequired && !authStatus) {
      redirect(`/api/auth/discord/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    return (
      <AcademyShell forcedTheme="light">
        <div className="academy-container">
          <section className="academy-hero">
            <div className="academy-card watchlist-access-card">
              <p className="academy-eyebrow">Premium Watchlist</p>
              <h1 className="academy-title">
                {loginRequired ? "Log in to view archived ticker details" : "Premium access required"}
              </h1>
              <p className="academy-lede">
                {loginRequired
                  ? "Log in with your TradersLink Discord account to view this archived ticker."
                  : access.error}
              </p>
              <Link
                href={`/api/auth/discord/login?returnTo=${encodeURIComponent(returnTo)}`}
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

  const archive = await new LiveWatchlistStore().getArchive(archiveId);
  if (!archive) {
    notFound();
  }

  return (
    <WatchlistDashboardFrame>
      <div className="academy-container">
        <LiveWatchlistArchiveDetailClient archive={archive} />
      </div>
    </WatchlistDashboardFrame>
  );
}

function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
