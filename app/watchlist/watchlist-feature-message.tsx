import Link from "next/link";

export function WatchlistFeatureMessage({ feature }: { feature: "ticker_details" | "trade_analysis" }) {
  const title = feature === "ticker_details" ? "Ticker details" : "Trade analysis & preparation";
  return <article className="academy-card">
    <h2 className="academy-card-title">{title}</h2>
    <p className="academy-card-text">Your current plans do not include {title.toLowerCase()}. Choose a plan that includes this feature to get access.</p>
    <Link className="academy-card-action" href={`/plans?feature=watchlist.${feature}`}>View plans with this feature</Link>
    <p className="academy-card-text">If no public plan is available, contact the owner about access.</p>
  </article>;
}
