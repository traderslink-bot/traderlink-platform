import { describe, expect, it } from "vitest";
import { combinedMembershipPrice, combinedMembershipFeatures } from "./membership-addons";
import { newMembershipProductFeature as f, storedMembershipProductFeatures } from "./membership-product-features";
const monthly = (amount: number, currency = "USD") => ({ billingKind: "recurring", currency, initialAmountMinor: amount, renewalAmountMinor: amount, billingPeriodDays: null, billingInterval: "month", billingIntervalCount: 1 });
const free = { ...monthly(0), billingKind: "free" };
describe("Plan add-ons", () => {
  it("adds exact monthly prices for paid and free base plans and multiple add-ons", () => {
    expect(combinedMembershipPrice([monthly(2000), monthly(1025), monthly(550)]).renewalAmountMinor).toBe(3575);
    expect(combinedMembershipPrice([free, monthly(1025)]).renewalAmountMinor).toBe(1025);
    expect(combinedMembershipPrice([free, free]).billingKind).toBe("free");
    expect(() => combinedMembershipPrice([monthly(1), monthly(2, "CAD")])).toThrow(/same currency/);
    expect(() => combinedMembershipPrice([{ ...monthly(10), billingInterval: "year" }])).toThrow(/monthly or free/);
    expect(() => combinedMembershipPrice([monthly(Number.MAX_SAFE_INTEGER), monthly(1)])).toThrow(/too large/);
  });
  it("sums allowances, unions permissions, retains unlimited and preserves input", () => {
    const packages = [[f("journal.accounts", 1), f("levels.generations", 10), f("journal.access")], [f("journal.accounts", 2), f("levels.generations", 20), f("journal.access")]];
    const before = JSON.stringify(packages); const kinds = new Map([["journal.accounts", "limit"], ["levels.generations", "limit"]]);
    const combined = combinedMembershipFeatures(packages, kinds);
    expect(combined.find(x => x.key === "levels.generations")?.limit).toBe(30);
    expect(combined.find(x => x.key === "journal.accounts")?.limit).toBe(3);
    expect(combined.filter(x => x.key === "journal.access")).toHaveLength(1);
    expect(combinedMembershipFeatures([...packages, [f("levels.generations")]], kinds).find(x => x.key === "levels.generations")?.limit).toBeNull();
    expect(JSON.stringify(packages)).toBe(before);
    expect(() => combinedMembershipFeatures([[{ ...f("levels.generations", 10), resetDays: 5 }], [{ ...f("levels.generations", 20), resetDays: 30 }]], kinds)).toThrow(/different reset periods/);
  });
  it("does not add mandatory Journal permissions to unrelated add-on packages", () => {
    expect(storedMembershipProductFeatures([f("levels.generations", 10)], "addon").map(x => x.key)).toEqual(["levels.generations"]);
  });
});
