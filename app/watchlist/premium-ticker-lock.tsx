import { WatchlistPlanUpgrade } from "./watchlist-plan-upgrade";
export function PremiumTickerLock({ upgradeHref, premium = true }: { upgradeHref?: string | null; premium?: boolean }) {
  return <section className="academy-card watchlist-access-card">
    <h2 className="academy-card-title">Ticker access required</h2>
    <p>Already have access? <a href="/login?returnTo=%2Fwatchlist">Sign in</a></p>
    <WatchlistPlanUpgrade premium={premium} href={upgradeHref} feature="Ticker" />
  </section>;
}
