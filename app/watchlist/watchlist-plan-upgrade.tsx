/** Receives only public upgrade destinations. Null keeps private offers private. */
export function WatchlistPlanUpgrade({ href, feature }: { href: string | null | undefined; feature: string }) {
  const keys:Readonly<Record<string,string>>={"Ticker":"watchlist.ticker_details","Ticker details":"watchlist.ticker_details","Trade analysis":"watchlist.trade_analysis","Trade analysis & preparation":"watchlist.trade_analysis","Levels":"watchlist.levels","Support and Resistance":"watchlist.levels","Indicator card":"watchlist.indicators","Watchlist":"watchlist.access"};
  const destination=href===undefined?`/plans?feature=${keys[feature]??"watchlist.access"}`:href;
  return <p>Unlock {feature.toLowerCase()} with a plan or add-on.{" "}
    {destination ? <a href={destination}>View plans with this feature</a> : "Contact the owner about access."}</p>;
}
