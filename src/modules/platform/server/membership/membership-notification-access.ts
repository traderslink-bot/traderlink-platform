import type Database from "better-sqlite3";
import { membershipNotificationFeature, type MembershipNotificationCategory } from "../../contracts/membership-notification-features";
import { assertMembershipFeature, evaluateMembershipFeature } from "./platform-membership-access";

/** Commercial permissions supplement (never replace) recipient identity and opt-in. */
export function canReceiveMembershipNotification(database: Database.Database, userId: string,
  category: MembershipNotificationCategory): boolean {
  return evaluateMembershipFeature(database, userId, "notifications.access").allowed &&
    evaluateMembershipFeature(database, userId, membershipNotificationFeature(category)).allowed;
}

/** Disabling remains possible after downgrade; callers assert only selected categories. */
export function assertMembershipNotification(database: Database.Database, userId: string,
  category: MembershipNotificationCategory): void {
  assertMembershipFeature(database, userId, "notifications.access");
  assertMembershipFeature(database, userId, membershipNotificationFeature(category));
}
