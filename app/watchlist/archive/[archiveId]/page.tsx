import { WatchlistMembershipNotice } from "../../watchlist-membership-notice";
import { WatchlistPlanUpgrade } from "@/app/watchlist/watchlist-plan-upgrade";
import { readWatchlistUpgradeLinks } from "@/src/modules/watchlist/server/access/watchlist-plan-policy";
import { canViewWatchlistLevels } from '@/src/modules/watchlist/server/access/watchlist-levels-visibility';
import { canViewPrivateWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";
import { canViewWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";
import { PremiumTickerLock } from "@/app/watchlist/premium-ticker-lock";
import { canViewWatchlistAnalysisPrices } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";
import { headers } from "next/headers";
import Link from "next/link";
import { readWatchlistFeatureAccess } from "@/src/modules/watchlist/server/access/watchlist-feature-access";
import { watchlistDetailProjection } from "@/src/lib/live-watchlist/watchlist-member-projection";
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
    if (access.reason === "membership_required") return <WatchlistMembershipNotice />;
    const loginRequired = access.reason === "login_required";
    const returnTo = `/watchlist/archive/${encodeURIComponent(archiveId.toUpperCase())}`;
    if (loginRequired && !authStatus) {
      redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
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
                Sign in to TradersLink to view this archived ticker.
              </p>
              <Link
                href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
                className="academy-card-action"
              >
                Sign in
              </Link>
            </div>
          </section>
        </div>
      </AcademyShell>
    );
  }

  const features = readWatchlistFeatureAccess(access.principal.platformUserId);
  const archive = await new LiveWatchlistStore().getArchive(archiveId);
  if (!archive) {
    notFound();
  }

  if (!canViewPrivateWatchlistTicker(await headers(), archive.symbol) || archive.state.watchlistGroup === "private") notFound();
  if (!features.tickerDetails) return <WatchlistDashboardFrame><div className="academy-container"><WatchlistPlanUpgrade feature="Ticker details" href={readWatchlistUpgradeLinks(archive.symbol).ticker === undefined ? "/plans?feature=watchlist.ticker_details" : readWatchlistUpgradeLinks(archive.symbol).ticker} /><Link href="/watchlist">Back to watchlist</Link></div></WatchlistDashboardFrame>;
  if (!canViewWatchlistTicker(await headers(), archive.symbol)) return <WatchlistDashboardFrame><PremiumTickerLock upgradeHref={readWatchlistUpgradeLinks(archive.symbol).ticker} /></WatchlistDashboardFrame>;
  return (
    <WatchlistDashboardFrame>
      <div className="academy-container">
        <LiveWatchlistArchiveDetailClient archive={{ ...archive, state: watchlistDetailProjection(archive.state, features.tradeAnalysis, canViewWatchlistAnalysisPrices(await headers(), archive.symbol), canViewWatchlistLevels(await headers(), archive.symbol), readWatchlistUpgradeLinks(archive.symbol), features.indicators) }} />
      </div>
    </WatchlistDashboardFrame>
  );
}

function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
