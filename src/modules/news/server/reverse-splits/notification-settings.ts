import "server-only";
import type Database from "better-sqlite3";
import type { ReverseSplitNotificationSettings } from "../../contracts/reverse-split-notification-contracts";
import { reverseSplitPrivatePreviewEnabled } from "./configuration";
import { reverseSplitOwnerUser, ReverseSplitNotificationStore } from "./notification-store";

export function readReverseSplitNotificationSettings(database: Database.Database, userId: string): ReverseSplitNotificationSettings {
  const fallback = { webPushEnabled: false, emailEnabled: false, available: false, deliveryEnabled: false, pushReady: false, emailReady: false };
  if (!reverseSplitPrivatePreviewEnabled() || !reverseSplitOwnerUser(database, userId)) return fallback;
  try {
    const preferences = new ReverseSplitNotificationStore(database).preferences(userId);
    return { ...preferences, available: true, deliveryEnabled: process.env.REVERSE_SPLIT_NOTIFICATIONS_ENABLED === "true",
      pushReady: Boolean(database.prepare("SELECT 1 FROM platform_web_push_subscriptions WHERE user_id = ? AND state = 'active' LIMIT 1").get(userId)),
      emailReady: Boolean(database.prepare("SELECT 1 FROM platform_notification_email_addresses WHERE user_id = ? AND state = 'confirmed' LIMIT 1").get(userId)) };
  } catch { return fallback; }
}
