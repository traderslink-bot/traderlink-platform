"use client";

import type { MembershipPlanEditor, MembershipPlanEditorFeature, MembershipPlanFeatureChoice } from "@/src/modules/platform/contracts/membership-plan-editor";
import { formatMembershipNewsDelay, isMembershipNewsDelay } from "@/src/modules/platform/contracts/membership-news-delays";
import { formatWatchlistBudget } from "@/src/modules/platform/contracts/membership-watchlist-budget";
import { isMembershipPlanSelectableFeature } from "@/src/modules/platform/contracts/membership-plan-notifications";
import styles from "../../../plans/plan-catalog.module.css";

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
  return <article className={styles.frame} aria-label="Plan card preview" style={{ maxWidth: 560 }}>
    <div className={styles.card}>
      <h3 className={styles.name}>{plan.name || "Plan name"}</h3>
      {prices.map(price => <div key={price.id}>
        <div className={styles.price}>{price.billing === "free" ? "Free" : `${price.currency} ${price.initialPrice || "—"}`}</div>
        <div>{price.name || "Access option"}</div>
        {price.billing === "recurring" ? <p>Then {price.currency} {price.renewalPrice || "—"} every {price.intervalCount ?? "—"} {price.interval}{price.intervalCount === 1 ? "" : "s"}.</p> : null}
        {price.accessDays ? <p>{price.accessDays} days of access.</p> : price.billing === "lifetime" ? <p>Lifetime access.</p> : null}
      </div>)}
      {plan.description ? <p className={styles.description}>{plan.description}</p> : null}
      <ul className={styles.features}>
        {plan.features.filter(feature => isMembershipPlanSelectableFeature(feature.key)).map(feature => {
          const definition = definitions.get(feature.key);
          if (!definition) return null;
          const brief = feature.brief ?? definition.brief;
          const details = feature.details ?? definition.details;
          return <li key={feature.key} className={styles.feature}>
            <strong>{definition.label}</strong>
            {definition.kind === "limit" ? <span className={styles.allowance}>{allowance(feature)}</span> : null}
            {brief ? <p>{brief}</p> : null}
            {details ? <details><summary aria-label={`More details about ${definition.label}`}>More details</summary><p>{details}</p></details> : null}
          </li>;
        })}
      </ul>
      <div className={styles.footer}>
        {plan.displayOnly ? <p>Display only — purchases are not enabled.</p> : prices.map(price => <div key={price.id} className={styles.offer}>
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
