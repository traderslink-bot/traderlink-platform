import { describe, expect, it } from "vitest";
import { ensureJournalPlanFoundation, membershipAllowanceInBrief, membershipProductBrief, membershipProductDescription, membershipProductLabel, newMembershipProductFeature as f, storedMembershipProductFeatures, toggleMembershipProduct } from "./membership-product-features";
import { isMembershipPlanSelectableFeature, derivedMembershipPlanNotificationKeys } from "./membership-plan-notifications";

describe("Product-oriented plan features", () => {
  it("lists Watchlist once with nested card permissions preserved for publication", () => {
    const children = ["watchlist.ticker_details", "watchlist.trade_analysis", "watchlist.levels", "watchlist.indicators"];
    for (const key of children) expect(isMembershipPlanSelectableFeature(key)).toBe(false);
    const features = [f("watchlist.access"), ...children.map(key => f(key))];
    expect(storedMembershipProductFeatures(features)).toEqual(expect.arrayContaining(features));
    expect(membershipProductLabel("watchlist.trade_analysis", "")).toBe("Trade analysis");
    expect(membershipProductLabel("watchlist.levels", "")).toBe("Support and Resistance");
    expect(membershipProductDescription("watchlist.access", features, "")).toContain("Indicator card");
    expect(toggleMembershipProduct(features, "watchlist.access", false).some(feature => children.includes(feature.key))).toBe(false);
  });
  it("keeps analysis-page access separate and puts Levels Generator allowance in its brief", () => {
    expect(isMembershipPlanSelectableFeature("trade_analyzer.analysis")).toBe(true);
    expect(membershipProductLabel("trade_analyzer.analysis", "")).toBe("Trade Analyzer Analysis");
    expect(membershipProductLabel("levels.generations", "Levels Generator generations")).toBe("Levels Generator");
    expect(membershipAllowanceInBrief("levels.generations")).toBe(true);
    const features = [{ ...f("levels.generations", 3), resetDays: 5 }];
    expect(membershipProductDescription("levels.generations", features, "")).toBe("3 level generations every 5 days.");
    expect(membershipProductBrief("levels.generations", features, "Generate levels.", "")).toBe("Generate levels. 3 level generations every 5 days.");
    expect(membershipProductDescription("levels.generations", [f("levels.generations")], "")).toBe("Unlimited level generations.");
  });
  it("keeps technical permissions and nested settings out of feature lists", () => {
    for (const key of ["dashboard.access", "journal.accounts", "journal.manual_entry", "news.visibility_delay_seconds", "news.notification_delay_seconds", "notifications.press_release", "notifications.market_news", "journal.rules", "journal.custom_rules", "journal.preset_rules", "journal.custom_tags"]) {
      expect(isMembershipPlanSelectableFeature(key)).toBe(false);
    }
    for (const key of ["news.access", "news.week_ahead", "journal.calendar", "analytics.compare_trades", "journal.imports"]) expect(isMembershipPlanSelectableFeature(key)).toBe(true);
    expect(membershipProductLabel("news.access", "Dashboard news")).toBe("Stock Press Releases");
    expect(membershipProductLabel("trade_analyzer.analyses", "Trade Analyzer analyses")).toBe("Trade Analyzer");
    expect(membershipProductLabel("journal.access", "Journal")).toBe("Trading Journal");
  });
  it("describes instant notifications or three-minute delayed news without notifications", () => {
    expect(membershipProductDescription("news.access", [f("news.access"), f("notifications.press_release")], ""))
      .toBe("Instant notifications when news hits the market.");
    expect(membershipProductDescription("news.access", [f("news.access"), f("news.visibility_delay_seconds", 180)], ""))
      .toBe("Press releases are delayed 3 minutes without notifications.");
  });
  it("retains separate news/notification timing inside one product", () => {
    const features = [f("news.access"), f("notifications.press_release"), f("news.visibility_delay_seconds", 180), f("news.notification_delay_seconds", 60)];
    expect(storedMembershipProductFeatures(features)).toEqual(expect.arrayContaining(features));
    expect(membershipProductDescription("news.access", features, "")).toContain("Notifications are delayed 1 minute.");
  });
  it("removes nested permissions when their product is deselected", () => {
    const selected = toggleMembershipProduct([], "news.access", true);
    selected.push(f("notifications.press_release"));
    expect(toggleMembershipProduct(selected, "news.access", false)).toEqual([]);
    const stored = storedMembershipProductFeatures([f("news.visibility_delay_seconds", 180), f("journal.imports")]);
    expect(stored.some(feature => feature.key === "news.visibility_delay_seconds")).toBe(false);
    expect(stored.some(feature => feature.key === "journal.imports")).toBe(true);
  });
  it("includes manual entry in Journal copy and imports only when selected", () => {
    expect(membershipProductDescription("journal.access", [f("journal.access")], "")).toContain("Manually enter your trades");
    expect(membershipProductDescription("journal.access", [f("journal.access"), f("journal.imports")], "")).toContain("Manually enter and import");
  });
  it("pairs Week Ahead with its notifications", () => {
    expect(derivedMembershipPlanNotificationKeys([f("news.week_ahead")])).toEqual(["notifications.access", "notifications.market_news"]);
  });
  it("defaults Calendar to both views and describes Rules allowance/presets", () => {
    const calendar = toggleMembershipProduct([], "journal.calendar", true);
    expect(membershipProductDescription("journal.calendar", calendar, "")).toContain("monthly and weekly");
    expect(membershipProductDescription("journal.rules", [f("journal.rules"), f("journal.custom_rules", 5), f("journal.preset_rules")], ""))
      .toContain("5 active custom rules across your Journal accounts, with preset rules included");
  });
  it("always includes Journal and Rules while preserving the chosen rule types and allowance", () => {
    const baseline = ensureJournalPlanFoundation([]);
    expect(baseline.map(feature => feature.key)).toEqual(["journal.access", "journal.accounts", "journal.rules", "journal.custom_rules", "journal.custom_tags"]);
    expect(toggleMembershipProduct(baseline, "journal.access", false)).toEqual(baseline);
    const configured = ensureJournalPlanFoundation([f("journal.custom_rules", 5), f("journal.preset_rules")]);
    expect(configured.find(feature => feature.key === "journal.custom_rules")?.limit).toBe(5);
    expect(configured.some(feature => feature.key === "journal.preset_rules")).toBe(true);
    expect(membershipProductDescription("journal.access", configured, "")).toContain("5 active custom rules");
  });
  it("keeps custom tags inside Journal with numeric, zero and Unlimited descriptions", () => {
    for (const limit of [0, 5, null]) {
      const configured = ensureJournalPlanFoundation([f("journal.custom_tags", limit)]);
      expect(configured.find(feature => feature.key === "journal.custom_tags")?.limit).toBe(limit);
      const copy = membershipProductDescription("journal.access", configured, "");
      expect(copy).toContain("Preset tags");
      expect(copy).toContain(limit === 0 ? "no custom tags" : limit === null ? "unlimited custom tags" : "5 active custom tags");
    }
  });
  it("puts analysis quantity and reset length in the brief rather than the title", () => {
    const features = [{ ...f("trade_analyzer.analyses", 3), resetDays: 5 }];
    expect(membershipAllowanceInBrief("trade_analyzer.analyses")).toBe(true);
    expect(membershipProductBrief("trade_analyzer.analyses", features, null, "Review your trades."))
      .toBe("Review your trades. 3 trade analyses every 5 days.");
    expect(membershipProductBrief("trade_analyzer.analyses", features, "Study your entries.", ""))
      .toContain("3 trade analyses every 5 days.");
    expect(membershipProductBrief("trade_analyzer.analyses", [f("trade_analyzer.analyses")], null, ""))
      .toBe("Unlimited trade analyses.");
  });
  it("keeps account quantity inside the Trading Journal brief and preserves existing allowances", () => {
    const configured = ensureJournalPlanFoundation([f("journal.accounts", 3)]);
    expect(configured.find(feature => feature.key === "journal.accounts")?.limit).toBe(3);
    expect(membershipProductBrief("journal.access", configured, null, "")).toContain("Includes 3 Journal accounts.");
    expect(membershipProductBrief("journal.access", configured, "Keep your trading record.", ""))
      .toBe("Keep your trading record. Includes 3 Journal accounts.");
    expect(membershipProductBrief("journal.access", [f("journal.accounts")], null, ""))
      .toContain("Unlimited Journal accounts.");
  });
  it("treats reports and exports as an optional Trade Explorer setting", () => {
    expect(isMembershipPlanSelectableFeature("analytics.exports")).toBe(false);
    const enabled = [f("analytics.trade_explorer"), f("analytics.exports")];
    expect(storedMembershipProductFeatures(enabled)).toEqual(expect.arrayContaining(enabled));
    expect(membershipProductDescription("analytics.trade_explorer", enabled, "Explore your trades.")).toContain("Reports and exports included.");
    expect(membershipProductBrief("analytics.trade_explorer", enabled, "Explore your trades.", "")).toBe("Explore your trades. Reports and exports included.");
    expect(membershipProductDescription("analytics.trade_explorer", [f("analytics.trade_explorer")], "")).toBe("Reports and exports not included.");
    expect(toggleMembershipProduct(enabled, "analytics.trade_explorer", false)).toEqual([]);
    expect(storedMembershipProductFeatures([f("analytics.exports")]).some(feature => feature.key === "analytics.exports")).toBe(false);
  });
});
