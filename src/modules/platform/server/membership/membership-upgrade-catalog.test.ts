import { describe, expect, it } from "vitest";
import { membershipUpgradeCatalog } from "./membership-upgrade-catalog";
import type { PlatformMembershipCatalogPlan } from "./platform-membership-catalog-repository";
function plan(id: string, type: "plan" | "addon" = "plan", billing: "free" | "month" | "year" = "month", currency = "USD"): PlatformMembershipCatalogPlan {
  return { planId: id, planVersionId: id, name: id, description: "", features: [], packageType: type,
    offers: [{ offerId: id, name: id, provider: "stripe", providerLabel: "Stripe", channel: "website", billingKind: billing === "free" ? "free" : "recurring",
      currency: billing === "free" ? null : currency, initialAmountMinor: 0, renewalAmountMinor: 0, billingPeriodDays: null,
      billingInterval: billing === "free" ? null : billing, billingIntervalCount: billing === "free" ? null : 1, accessDurationDays: null,
      externalCheckoutUrl: null, automaticConfirmation: true, trials: [] }] };
}
describe("feature upgrades include add-on selection context", () => {
  it("keeps free/monthly bases when only an add-on supplies a feature", () => {
    const base = plan("monthly"), free = plan("free", "plan", "free"), addon = plan("analyzer", "addon");
    const all = [base, free, addon, plan("annual", "plan", "year"), plan("unrelated", "addon"), plan("cad", "plan", "month", "CAD")];
    expect(membershipUpgradeCatalog([addon], all).map(p => p.planId)).toEqual(["monthly", "free", "analyzer"]);
  });
  it("does not widen ticker-specific matching add-ons or matched base plans", () => {
    const permitted = plan("selected", "addon"), forbidden = plan("other", "addon"), base = plan("base");
    expect(membershipUpgradeCatalog([permitted], [base, permitted, forbidden])).toEqual([base, permitted]);
    expect(membershipUpgradeCatalog([base], [base, permitted])).toEqual([base]);
  });
  it("retains the exact matching add-on version rather than widening by stable package", () => {
    const matching = plan("package", "addon");
    const otherVersion = { ...matching, planVersionId: "different-version" };
    const base = plan("base");
    expect(membershipUpgradeCatalog([matching], [base, otherVersion, matching])).toEqual([base, matching]);
  });
  it("does not offer context for incompatible or expiring add-ons", () => {
    const addon = plan("addon", "addon", "year"), base = plan("base");
    expect(membershipUpgradeCatalog([addon], [base, addon])).toEqual([addon]);
    const original = plan("expiring", "addon");
    const expiring = { ...original, offers: [{ ...original.offers[0], accessDurationDays: 30 }] };
    expect(membershipUpgradeCatalog([expiring], [base, expiring])).toEqual([expiring]);
  });
});
