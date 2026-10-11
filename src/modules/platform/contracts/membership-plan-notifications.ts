import type { MembershipNotificationCategory } from "./membership-notification-features";

/** Parent features control associated notifications in the unified plan editor.
 * Market halts is itself a standalone feature; its existing storage key is kept. */
export const MEMBERSHIP_PLAN_NOTIFICATION_PARENTS = Object.freeze([
  { category: "market_halt", feature: "notifications.market_halt", label: "Market halts", metered: false },
  { category: "press_release", feature: "news.access", label: "Press releases", metered: false },
  { category: "market_news", feature: "news.access", label: "Week Ahead", metered: false },
  { category: "watchlist", feature: "watchlist.access", label: "Watchlist", metered: false },
  { category: "ai_review", feature: "ai.reviews", label: "AI Reviews", metered: false },
  { category: "broker_connection", feature: "broker.connections", label: "Broker connections", metered: true },
  { category: "broker_import", feature: "journal.imports", label: "Broker imports", metered: false },
  { category: "statement_import", feature: "journal.imports", label: "Statement imports", metered: false },
  { category: "data_decision", feature: "journal.access", label: "Data Decisions", metered: false },
  { category: "chart_update", feature: "trade_analyzer.analyses", label: "Trade Analyzer updates", metered: true },
] satisfies readonly { category: MembershipNotificationCategory; feature: string; label: string; metered: boolean }[]);

const derivedKeys = new Set<string>(["notifications.access", ...MEMBERSHIP_PLAN_NOTIFICATION_PARENTS
  .filter(item => item.category !== "market_halt").map(item => `notifications.${item.category}`)]);

export function isMembershipPlanSelectableFeature(key: string): boolean {
  return !derivedKeys.has(key);
}

export function includedMembershipPlanNotifications(features: readonly { key: string; limit: number | null }[]) {
  const byKey = new Map(features.map(feature => [feature.key, feature]));
  return MEMBERSHIP_PLAN_NOTIFICATION_PARENTS.filter(parent => {
    const feature = byKey.get(parent.feature);
    return feature !== undefined && (!parent.metered || feature.limit === null || feature.limit > 0);
  });
}

export function derivedMembershipPlanNotificationKeys(features: readonly { key: string; limit: number | null }[]): string[] {
  const categories = includedMembershipPlanNotifications(features);
  return categories.length ? ["notifications.access", ...categories.filter(item => item.category !== "market_halt").map(item => `notifications.${item.category}`)] : [];
}
