/**
 * Privacy-safe contract shared by notification storage, server reads and the
 * dashboard. Notification text must never contain statement rows, broker
 * credentials, account identifiers or raw AI-repair evidence.
 */
export const PLATFORM_NOTIFICATION_CATEGORIES = [
  "ai_review",
  "broker_connection",
  "broker_import",
  "chart_update",
  "data_decision",
  "statement_import",
] as const;

export type PlatformNotificationCategory =
  (typeof PLATFORM_NOTIFICATION_CATEGORIES)[number];

export const PLATFORM_NOTIFICATION_DELIVERY_CHANNELS = [
  "in_app",
  "discord_dm",
  "web_push",
] as const;

export type PlatformNotificationDeliveryChannel =
  (typeof PLATFORM_NOTIFICATION_DELIVERY_CHANNELS)[number];

export const PLATFORM_NOTIFICATION_KINDS = [
  "ai_review_ready",
  "ai_review_needs_attention",
  "broker_connection_reauthorization_required",
  "broker_import_completed",
  "broker_import_failed",
  "chart_update_ready",
  "data_decision_needs_review",
  "statement_import_completed",
  "statement_import_needs_action",
  "statement_ai_repair_started",
  "statement_ai_repair_completed",
  "statement_ai_repair_failed",
] as const;

export type PlatformNotificationKind =
  (typeof PLATFORM_NOTIFICATION_KINDS)[number];

/** An opaque, user-scoped notification suitable for client rendering. */
export type PlatformNotification = Readonly<{
  category: PlatformNotificationCategory;
  destinationPath: string | null;
  kind: PlatformNotificationKind;
  notificationRef: string;
  occurredAtUtc: string;
  readAtUtc: string | null;
  summary: string;
  title: string;
}>;

/** Delivery preferences are opt-in per remote channel; in-app is always kept. */
export type PlatformNotificationPreferences = Readonly<{
  discordDmCategories: readonly PlatformNotificationCategory[];
  webPushCategories: readonly PlatformNotificationCategory[];
}>;

export const DEFAULT_PLATFORM_NOTIFICATION_PREFERENCES: PlatformNotificationPreferences =
  Object.freeze({
    discordDmCategories: Object.freeze([]),
    webPushCategories: Object.freeze([]),
  });
