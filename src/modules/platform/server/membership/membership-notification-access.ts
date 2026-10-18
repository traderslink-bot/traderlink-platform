import type Database from "better-sqlite3";
import { membershipNotificationFeature, type MembershipNotificationCategory } from "../../contracts/membership-notification-features";
import { assertMembershipFeature, evaluateMembershipFeature } from "./platform-membership-access";

function notificationProduct(category: MembershipNotificationCategory): string | null {
  return category === "press_release" ? "news.access" : category === "market_news" ? "news.week_ahead" : null;
}

/** Commercial permissions supplement (never replace) recipient identity and opt-in. */
export function canReceiveMembershipNotification(database: Database.Database, userId: string,
  category: MembershipNotificationCategory): boolean {
  const product = notificationProduct(category);
  return (product === null || evaluateMembershipFeature(database, userId, product).allowed) &&
    evaluateMembershipFeature(database, userId, "notifications.access").allowed &&
    evaluateMembershipFeature(database, userId, membershipNotificationFeature(category)).allowed;
}

/** Disabling remains possible after downgrade; callers assert only selected categories. */
export function assertMembershipNotification(database: Database.Database, userId: string,
  category: MembershipNotificationCategory): void {
  const product = notificationProduct(category);
  if (product !== null) assertMembershipFeature(database, userId, product);
  assertMembershipFeature(database, userId, "notifications.access");
  assertMembershipFeature(database, userId, membershipNotificationFeature(category));
}
