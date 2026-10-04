import { canViewWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";
import { PremiumTickerLock } from "@/app/watchlist/premium-ticker-lock";
import { canViewWatchlistAnalysisPrices } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";
import { headers } from "next/headers";
import Link from "next/link";
import { readWatchlistFeatureAccess } from "@/src/modules/watchlist/server/access/watchlist-feature-access";
import { watchlistDetailProjection } from "@/src/lib/live-watchlist/watchlist-member-projection";
import { WatchlistFeatureMessage } from "../../watchlist-feature-message";
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
              <p className="academy-eyebrow">Live Watchlist</p>
              <h1 className="academy-title">
                Log in to view archived ticker details
              </h1>
              <p className="academy-lede">
                Log in with your TradersLink Discord account to view this archived ticker.
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

  const features = readWatchlistFeatureAccess(access.principal.platformUserId);
  if (!features.tickerDetails) return <WatchlistDashboardFrame><div className="academy-container"><WatchlistFeatureMessage feature="ticker_details" /><Link href="/watchlist">Back to watchlist</Link></div></WatchlistDashboardFrame>;
  const archive = await new LiveWatchlistStore().getArchive(archiveId);
  if (!archive) {
    notFound();
  }

  if (!canViewWatchlistTicker(await headers(), archive.symbol)) return <WatchlistDashboardFrame><PremiumTickerLock /></WatchlistDashboardFrame>;
  return (
    <WatchlistDashboardFrame>
      <div className="academy-container">
        <LiveWatchlistArchiveDetailClient archive={{ ...archive, state: watchlistDetailProjection(archive.state, features.tradeAnalysis, canViewWatchlistAnalysisPrices(await headers(), archive.symbol)) }} />
      </div>
    </WatchlistDashboardFrame>
  );
}

function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
