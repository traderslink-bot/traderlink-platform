/** Receives only public upgrade destinations. Null keeps private offers private. */
export function WatchlistPlanUpgrade({ href, feature, premium = false }: { href: string | null | undefined; feature: string; premium?: boolean }) {
  if (premium && href === undefined) return <p>Available to Premium members.{" "}
    <a href="https://whop.com/traderslink-1049/premium-access-2026" style={{ textDecoration: "underline" }}>Get Premium</a></p>;
  const keys:Readonly<Record<string,string>>={"Ticker":"watchlist.ticker_details","Ticker details":"watchlist.ticker_details","Trade analysis":"watchlist.trade_analysis","Trade analysis & preparation":"watchlist.trade_analysis","Levels":"watchlist.levels","Support and Resistance":"watchlist.levels","Indicator card":"watchlist.indicators","Watchlist":"watchlist.access"};
  const destination=href===undefined?`/plans?feature=${keys[feature]??"watchlist.access"}`:href;
  return <p>Unlock {feature.toLowerCase()} with a plan or add-on.{" "}
    {destination ? <a href={destination}>View plans with this feature</a> : "Contact the owner about access."}</p>;
}
