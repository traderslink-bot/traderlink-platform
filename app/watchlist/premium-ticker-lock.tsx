import { WatchlistPlanUpgrade } from "./watchlist-plan-upgrade";
export function PremiumTickerLock({ upgradeHref }: { upgradeHref?: string | null }) {
  return <section className="academy-card watchlist-access-card">
    <h2 className="academy-card-title">Ticker access required</h2>
    <p>Already have access? <a href="/api/auth/discord/login?returnTo=%2Fwatchlist">Sign in</a></p>
    <WatchlistPlanUpgrade href={upgradeHref} feature="Ticker" />
  </section>;
}
