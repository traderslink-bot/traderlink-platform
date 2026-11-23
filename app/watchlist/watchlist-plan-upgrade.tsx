import { watchlistUpgradeDestination, watchlistUpgradeLinkProps } from "./watchlist-upgrade-destination";
import styles from "./premium-analysis-card.module.css";

/** Receives only public upgrade destinations. Null keeps private offers private. */
export function WatchlistPlanUpgrade({ href, feature, premium = false }: { href: string | null | undefined; feature: string; premium?: boolean }) {
  const destination = watchlistUpgradeDestination(href, feature, premium);
  const legacyPremium = premium && href === undefined;
  return <p className={styles.notice}>
    {legacyPremium ? "Available to Premium members." : `Unlock ${feature.toLowerCase()} with a plan or add-on.`}{" "}
    {destination ? <a href={destination} {...watchlistUpgradeLinkProps(destination)}>
      {legacyPremium ? "Access Premium" : "View plans with this feature"}
    </a> : "Contact the owner about access."}
  </p>;
}
