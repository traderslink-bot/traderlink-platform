import { describe, expect, it } from "vitest";
import { moveMembershipCardFeature, orderMembershipFeatures } from "./membership-plan-feature-order";
import { ensureJournalPlanFoundation, newMembershipProductFeature as f, storedMembershipProductFeatures } from "./membership-product-features";
import { isMembershipPlanSelectableFeature } from "./membership-plan-notifications";

const visible = (features: ReturnType<typeof f>[]) => features.filter(feature => isMembershipPlanSelectableFeature(feature.key)).map(feature => feature.key);
describe("Plan card feature ordering", () => {
  it("moves products past nested settings without changing any allowances", () => {
    const input = ensureJournalPlanFoundation([f("journal.access"), f("journal.accounts", 3), { ...f("trade_analyzer.analyses", 3), resetDays: 5 }, f("analytics.trade_explorer"), f("analytics.exports")]);
    const snapshot = JSON.stringify(input);
    const moved = moveMembershipCardFeature(input, "analytics.trade_explorer", "up");
    expect(visible(moved)).toEqual(["journal.access", "analytics.trade_explorer", "trade_analyzer.analyses"]);
    expect(moved.find(feature => feature.key === "journal.accounts")?.limit).toBe(3);
    expect(moved.find(feature => feature.key === "trade_analyzer.analyses")?.resetDays).toBe(5);
    expect(moved.find(feature => feature.key === "analytics.exports")).toBe(input.find(feature => feature.key === "analytics.exports"));
    expect(JSON.stringify(input)).toBe(snapshot);
    expect(visible(storedMembershipProductFeatures(moved))).toEqual(visible(moved));
  });
  it("handles boundaries, hidden settings and unknown keys without removing features", () => {
    const input = ensureJournalPlanFoundation([f("journal.access"), f("news.access")]);
    expect(moveMembershipCardFeature(input, "journal.access", "up")).toEqual(input);
    expect(moveMembershipCardFeature(input, "news.access", "down")).toEqual(input);
    expect(moveMembershipCardFeature(input, "journal.accounts", "up")).toEqual(input);
    expect(moveMembershipCardFeature(input, "missing", "down")).toEqual(input);
  });
  it("restores saved order for editor and public catalog and appends unranked features stably", () => {
    const input = [f("analytics.trade_explorer"), f("journal.access"), f("trade_analyzer.analyses"), f("news.access")];
    const order = ["trade_analyzer.analyses", "journal.access", "analytics.trade_explorer"];
    expect(orderMembershipFeatures(input, order, feature => feature.key).map(feature => feature.key)).toEqual([...order, "news.access"]);
    expect(orderMembershipFeatures(input, [], feature => feature.key)).toEqual(input);
  });
});
