import { describe, expect, it } from "vitest";
import { derivedMembershipPlanNotificationKeys, includedMembershipPlanNotifications, isMembershipPlanSelectableFeature } from "./membership-plan-notifications";

const feature = (key: string, limit: number | null = null) => ({ key, limit });

describe("Plan news notification choices", () => {
  it("does not grant notifications from Dashboard news alone", () => {
    const features = [feature("news.access")];
    expect(includedMembershipPlanNotifications(features)).toEqual([]);
    expect(derivedMembershipPlanNotificationKeys(features)).toEqual([]);
  });
  it("keeps press release notifications as an internal Stock Press Releases setting", () => {
    const key = "notifications.press_release";
    expect(isMembershipPlanSelectableFeature(key)).toBe(false);
    expect(includedMembershipPlanNotifications([feature("news.access"), feature(key)]).map(item => item.feature)).toEqual([key]);
    expect(derivedMembershipPlanNotificationKeys([feature("news.access"), feature(key)])).toEqual(["notifications.access"]);
  });
  it("does not duplicate explicit notification features during publication", () => {
    const features = [feature("news.access"), feature("notifications.press_release"), feature("news.week_ahead")];
    const publishedKeys = [...features.map(f => f.key),
      ...derivedMembershipPlanNotificationKeys(features)];
    expect(publishedKeys).toEqual(["news.access", "notifications.press_release", "news.week_ahead", "notifications.access", "notifications.market_news"]);
    expect(new Set(publishedKeys).size).toBe(publishedKeys.length);
  });
  it("retains automatic notifications for other features without adding news alerts", () => {
    expect(derivedMembershipPlanNotificationKeys([feature("journal.access"), feature("watchlist.access")]))
      .toEqual(["notifications.access", "notifications.watchlist", "notifications.data_decision"]);
  });
  it("lists Week Ahead as the feature while its notification permission stays internal", () => {
    const stored = [feature("news.access"), feature("news.week_ahead"), feature("notifications.access"), feature("notifications.press_release"), feature("notifications.market_news")];
    expect(stored.filter(f => isMembershipPlanSelectableFeature(f.key)).map(f => f.key))
      .toEqual(["news.access", "news.week_ahead"]);
  });
  it("does not grant alerts for metered features with a zero allowance", () => {
    expect(derivedMembershipPlanNotificationKeys([feature("trade_analyzer.analyses", 0)])).toEqual([]);
  });
});
