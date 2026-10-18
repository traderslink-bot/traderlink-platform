import type { MembershipPlanEditorFeature } from "./membership-plan-editor";
import type { MembershipPrice } from "./platform-membership-pricing";

export function combinedMembershipPrice(prices: readonly MembershipPrice[]): MembershipPrice {
  if (!prices.length) throw new Error("This selection has no access options.");
  const paid = prices.filter(p => p.billingKind !== "free");
  const currency = paid[0]?.currency ?? prices[0].currency ?? "USD";
  let initial = 0, renewal = 0;
  for (const price of paid) {
    if (price.billingKind !== "recurring" || price.billingInterval !== "month" || price.billingIntervalCount !== 1) throw new Error("This selection needs monthly or free access options.");
    if (price.currency !== currency) throw new Error("This selection needs prices in the same currency.");
    if (price.initialAmountMinor === null || price.renewalAmountMinor === null) throw new Error("This package's price is not configured.");
    initial += price.initialAmountMinor; renewal += price.renewalAmountMinor;
    if (!Number.isSafeInteger(initial) || !Number.isSafeInteger(renewal) || initial < 0 || renewal < 0) throw new Error("This combined price is too large.");
  }
  return { billingKind: paid.length ? "recurring" : "free", currency, initialAmountMinor: initial,
    renewalAmountMinor: renewal, billingPeriodDays: null, billingInterval: "month", billingIntervalCount: 1 };
}

/** One purchased bundle grants unioned permissions and summed compatible allowances. */
export function combinedMembershipFeatures(packages: readonly (readonly MembershipPlanEditorFeature[])[], kinds: ReadonlyMap<string, string>): MembershipPlanEditorFeature[] {
  const features = new Map<string, MembershipPlanEditorFeature>();
  for (const pack of packages) for (const feature of pack) {
    const previous = features.get(feature.key);
    if (!previous) { features.set(feature.key, structuredClone(feature)); continue; }
    if (kinds.get(feature.key) !== "limit") continue;
    if (feature.key.endsWith("delay_seconds")) { previous.limit = Math.min(previous.limit ?? 0, feature.limit ?? 0); continue; }
    if (previous.limit === null || feature.limit === null) { previous.limit = null; continue; }
    if (previous.limit === 0) { features.set(feature.key, structuredClone(feature)); continue; }
    if (feature.limit === 0) continue;
    if (previous.resetDays !== feature.resetDays || JSON.stringify(previous.period) !== JSON.stringify(feature.period)) throw new Error("This selection has overlapping allowances with different reset periods. Ask the owner to align those package allowances.");
    previous.limit += feature.limit;
    if (!Number.isSafeInteger(previous.limit)) throw new Error("This combined allowance is too large.");
  }
  return [...features.values()].map(feature => kinds.get(feature.key) === "limit" && !feature.key.endsWith("delay_seconds") ? { ...feature, brief: null } : feature);
}
