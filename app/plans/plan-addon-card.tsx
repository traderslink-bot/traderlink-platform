import type { PlatformMembershipCatalogPlan } from "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { defaultMembershipFeatureCopy } from "@/src/modules/platform/contracts/membership-feature-copy";
import { formatMembershipNewsDelay, isMembershipNewsDelay } from "@/src/modules/platform/contracts/membership-news-delays";
import { formatWatchlistBudget } from "@/src/modules/platform/contracts/membership-watchlist-budget";
import { membershipAllowanceInBrief } from "@/src/modules/platform/contracts/membership-product-features";
import { PlanPrice } from "./plan-price";
import styles from "./plan-catalog.module.css";

export function PlanAddonCard({ plan }: { plan: PlatformMembershipCatalogPlan }) {
  const prices = plan.displayOnly ? (plan.displayPrices ?? []).flatMap(price => price.terms ? [price.terms] : []) : plan.offers;
  const amendmentOffer=plan.displayOnly?undefined:plan.offers.find(o=>o.accessDurationDays===null&&(o.billingKind==='free'||o.provider==='stripe'&&o.billingKind==='recurring'&&o.billingInterval==='month'&&o.billingIntervalCount===1&&o.initialAmountMinor===o.renewalAmountMinor));
  return <article className={`${styles.frame} ${styles.addonFrame}`} aria-label={`${plan.name} add-on`}>
    <div className={styles.card}>
      <span className={styles.addonBadge}>Add-on</span>
      <div className={styles.cardHeader}>
        <h3 className={styles.name}>{plan.name}</h3>
        <div className={styles.headerPrices}>{prices.map((price, index) => <PlanPrice key={index} price={price} />)}</div>
      </div>
      {plan.description ? <p className={styles.description}>{plan.description}</p> : null}
      {plan.requiresDiscord ? <p className={styles.discordRequirement}>Requires a connected Discord account for Discord benefits. You can connect later.</p> : null}
      <ul className={styles.features}>{plan.features.map(feature => {
        const copy = defaultMembershipFeatureCopy(feature.featureKey, feature.label);
        const brief = feature.brief ?? copy.brief;
        const details = feature.details ?? copy.details;
        const content = <><span className={styles.featureTitle}><strong>{feature.label}</strong>{feature.kind === "limit" && !membershipAllowanceInBrief(feature.featureKey) ? <span className={styles.allowance}>
                          {isMembershipNewsDelay(feature.featureKey) ? formatMembershipNewsDelay(feature.limitValue)
                            : feature.featureKey === "private_watchlist.cost_microusd" ? formatWatchlistBudget(feature.limitValue)
                              : feature.limitValue === null ? "Unlimited" : feature.limitValue}
                          {feature.metered && feature.limitValue !== null
                            ? feature.privatePeriod ? feature.privatePeriod.kind === "calendar_month" ? " per calendar month (UTC)"
                              : feature.privatePeriod.kind === "lifetime" ? " · no reset"
                                : ` every ${feature.privatePeriod.days} ${feature.privatePeriod.days === 1 ? "day" : "days"}`
                              : feature.resetDays === undefined ? " · reset period unavailable"
                              : feature.resetDays === null ? " · no reset"
                                : ` every ${feature.resetDays} ${feature.resetDays === 1 ? "day" : "days"}`
                            : null}
                        </span> : null}</span>{brief ? <span className={styles.brief}>{brief}</span> : null}</>;
        return <li key={feature.featureKey} className={styles.feature}>{details ? <details><summary aria-label={`More details about ${feature.label}`}>{content}</summary><p>{details}</p></details> : <div className={styles.featureContent}>{content}</div>}</li>;
      })}</ul>
      {amendmentOffer?<p className={styles.addonInstruction}><a className={styles.addonUpgradeLink} href={`/account/membership?addonOfferId=${encodeURIComponent(amendmentOffer.offerId)}`}>Add to your current plan</a></p>:null}
      <p className={styles.addonInstruction}>{plan.displayOnly ? "Preview package — purchases are not available yet." : "Select this add-on inside your chosen plan above."}</p>
    </div>
  </article>;
}
