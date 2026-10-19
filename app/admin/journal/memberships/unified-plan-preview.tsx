"use client";

import type { MembershipPlanEditor, MembershipPlanEditorFeature, MembershipPlanFeatureChoice } from "@/src/modules/platform/contracts/membership-plan-editor";
import { formatMembershipNewsDelay, isMembershipNewsDelay } from "@/src/modules/platform/contracts/membership-news-delays";
import { formatWatchlistBudget } from "@/src/modules/platform/contracts/membership-watchlist-budget";
import { isMembershipPlanSelectableFeature } from "@/src/modules/platform/contracts/membership-plan-notifications";
import { membershipAllowanceInBrief, membershipProductBrief } from "@/src/modules/platform/contracts/membership-product-features";
import styles from "../../../plans/plan-catalog.module.css";
import { PlanPrice } from "../../../plans/plan-price";
import { editorPriceTerms } from "@/src/modules/platform/contracts/membership-price-card";

function allowance(feature: MembershipPlanEditorFeature): string {
  if (isMembershipNewsDelay(feature.key)) return formatMembershipNewsDelay(feature.limit);
  const value = feature.key === "private_watchlist.cost_microusd" ? formatWatchlistBudget(feature.limit)
    : feature.limit === null ? "Unlimited" : String(feature.limit);
  if (feature.limit === null) return value;
  const privateMeter = ["private_watchlist.ticker_additions", "private_watchlist.generations", "private_watchlist.cost_microusd"].includes(feature.key);
  if (privateMeter) {
    const period = feature.period ?? { kind: "calendar_month", days: null };
    return `${value}${period.kind === "calendar_month" ? " per calendar month (UTC)" : period.kind === "lifetime" ? " · no reset"
      : ` every ${period.days ?? "—"} days`}`;
  }
  if (["levels.generations", "trade_analyzer.analyses"].includes(feature.key)) {
    return `${value}${feature.resetDays === null ? " · no reset" : ` every ${feature.resetDays} days`}`;
  }
  return value;
}

/** Visual-only preview: intentionally contains no checkout form, link or action. */
export function UnifiedPlanPreview({ plan, features }: { plan: MembershipPlanEditor; features: readonly MembershipPlanFeatureChoice[] }) {
  const definitions = new Map(features.map(feature => [feature.key, feature]));
  const prices = plan.prices.filter(price => price.enabled);
  return <article className={`${styles.frame} ${plan.packageType === "addon" ? styles.addonFrame : ""}`} aria-label="Plan card preview" style={{ maxWidth: plan.packageType === "addon" ? 760 : 368 }}>
    <div className={styles.card}>
      {plan.packageType === "addon" ? <span className={styles.addonBadge}>Add-on</span> : null}
      <div className={styles.cardHeader}>
      <h3 className={styles.name}>{plan.name || "Plan name"}</h3>
      <div className={styles.headerPrices}>
      {prices.map(price => <div key={price.id}>
        <PlanPrice price={editorPriceTerms(price)} />
        {prices.length > 1 ? <div className={styles.priceNote}>{price.name || "Access option"}</div> : null}
        {price.accessDays ? <p>{price.accessDays} days of access.</p> : price.billing === "lifetime" ? <p>Lifetime access.</p> : null}
      </div>)}
      </div>
      </div>
      {plan.description ? <p className={styles.description}>{plan.description}</p> : null}
      <ul className={styles.features}>
        {plan.features.filter(feature => isMembershipPlanSelectableFeature(feature.key)).map(feature => {
          const definition = definitions.get(feature.key);
          if (!definition) return null;
          const brief = membershipProductBrief(feature.key, plan.features, feature.brief, definition.brief);
          const details = feature.details ?? definition.details;
          const content = <>
            <span className={styles.featureTitle}><strong>{definition.label}</strong>
              {definition.kind === "limit" && !membershipAllowanceInBrief(feature.key) ? <span className={styles.allowance}>{allowance(feature)}</span> : null}</span>
            {brief ? <span className={styles.brief}>{brief}</span> : null}
          </>;
          return <li key={feature.key} className={styles.feature}>
            {details ? <details><summary aria-label={`More details about ${definition.label}`}>{content}</summary><p>{details}</p></details>
              : <div className={styles.featureContent}>{content}</div>}
          </li>;
        })}
      </ul>
      <div className={styles.footer}>
        {plan.packageType === "addon" ? <p className={styles.addonInstruction}>Add this package to a monthly or free plan.</p> : plan.displayOnly ? <>
          <div className={styles.purchaseNotice}><span>Purchases are not available for this display-only plan.</span></div>
          <button type="button" className={styles.previewAction} disabled>
            {prices.length && prices.every(price => price.billing === "free") ? "Get access" : "Buy now"}
          </button>
        </> : prices.map(price => <div key={price.id} className={styles.offer}>
          <strong>{price.name || "Access option"}</strong>
          <p>{price.channel === "website" ? "Website" : price.channel === "discord" ? "Discord" : price.channel === "both" ? "Website and Discord" : "Private access"}</p>
          {price.trials.filter(trial => trial.enabled).map(trial => <div key={trial.id}>
            <p>{trial.name || "Trial"} · {trial.durationDays ?? "—"} days · {!trial.price || Number(trial.price) === 0 ? "Free" : `${price.currency} ${trial.price}`}</p>
            <p>{trial.endBehavior === "renew" ? `Continues at ${price.currency} ${price.renewalPrice || "—"} every ${price.intervalCount ?? "—"} ${price.interval}${price.intervalCount === 1 ? "" : "s"}.` : "Access ends when the trial ends."}</p>
          </div>)}
          <button type="button" className={styles.previewAction} disabled>{price.billing === "free" ? "Get access" : "Choose this plan"}</button>
        </div>)}
      </div>
    </div>
  </article>;
}
