import "server-only";
import type Database from "better-sqlite3";
import { notificationDefaultEnabled } from "@/src/modules/platform/server/notifications/platform-notification-defaults";

/** Preference candidates only. Callers still enforce access and a confirmed delivery target. */
export function readWatchlistNotificationCandidates(database: Database.Database) {
  const defaultEnabled = notificationDefaultEnabled(database);
  return database.prepare<[], { user_id: string; web_push_enabled: number; email_enabled: number }>(`
    SELECT users.user_id,
      COALESCE(preference.web_push_enabled, ${defaultEnabled}) AS web_push_enabled,
      COALESCE(preference.email_enabled, ${defaultEnabled}) AS email_enabled
    FROM platform_users users
    LEFT JOIN platform_watchlist_notification_preferences preference ON preference.user_id = users.user_id
    WHERE users.status = 'active' AND
      (COALESCE(preference.web_push_enabled, ${defaultEnabled}) = 1 OR
       COALESCE(preference.email_enabled, ${defaultEnabled}) = 1)
      AND (EXISTS (SELECT 1 FROM platform_web_push_subscriptions subscription
        WHERE subscription.user_id = users.user_id AND subscription.state = 'active')
      OR EXISTS (SELECT 1 FROM platform_notification_email_addresses email
        WHERE email.user_id = users.user_id AND email.state = 'confirmed'))
  `).all();
}
