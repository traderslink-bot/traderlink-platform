import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AcademyShell } from "@/app/academy/academy-shell";
import { getCurrentAcademySession } from "@/app/academy/academy-server-session";
import {
  hasPremiumWatchlistAccess,
  isLocalWatchlistAuthBypassEnabled,
} from "@/src/lib/live-watchlist/live-watchlist-auth";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { LiveWatchlistDetailClient } from "../live-watchlist-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return {
    title: `${symbol.toUpperCase()} Live Watchlist | TradersLink`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function LiveWatchlistSymbolPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const session = await getCurrentAcademySession();
  const authBypass = isLocalWatchlistAuthBypassEnabled();
  if ((!session && !authBypass) || (session && !hasPremiumWatchlistAccess(session))) {
    const returnTo = `/watchlist/${encodeURIComponent(symbol.toUpperCase())}`;
    return (
      <AcademyShell>
        <div className="academy-container">
          <section className="academy-hero">
            <div className="academy-hero-copy">
              <p className="academy-eyebrow">Premium Watchlist</p>
              <h1 className="academy-title">Premium access required</h1>
              <p className="academy-lede">
                Log in with a premium TradersLink Discord account to view ticker details.
              </p>
              <Link
                href={
                  session
                    ? "/watchlist"
                    : `/api/auth/discord/login?returnTo=${encodeURIComponent(returnTo)}`
                }
                className="academy-card-action"
              >
                {session ? "Back to watchlist" : "Log in with Discord"}
              </Link>
            </div>
          </section>
        </div>
      </AcademyShell>
    );
  }

  const state = await new LiveWatchlistStore().getSymbol(symbol);
  if (!state) {
    notFound();
  }
  const health = await new LiveWatchlistStore().getHealth();

  return (
    <AcademyShell>
      <div className="academy-container">
        <LiveWatchlistDetailClient
          initialMarketDataStatus={health.marketDataStatus}
          initialSymbol={state}
        />
      </div>
    </AcademyShell>
  );
}
