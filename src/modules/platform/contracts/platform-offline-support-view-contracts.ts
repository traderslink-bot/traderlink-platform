import type { PlatformNotification } from "./platform-notification-contracts";
import type { PlatformOfflineCoverageFact } from "./platform-offline-saved-view-contracts";

export const PLATFORM_OFFLINE_SUPPORT_VIEW_VERSION = "platform-support-view-v1" as const;
export const PLATFORM_OFFLINE_NOTIFICATIONS_VIEW_KEY = "platform:notifications:current" as const;

export type PlatformOfflineNotificationsViewModel = Readonly<{
  kind: "notifications";
  notifications: readonly PlatformNotification[];
  version: 1;
}>;

export function createPlatformOfflineNotificationsViewModel(
  notifications: readonly PlatformNotification[],
): PlatformOfflineNotificationsViewModel {
  return Object.freeze({
    kind: "notifications",
    notifications: Object.freeze(notifications.map((notification, index) => Object.freeze({
      ...notification,
      notificationRef: `offline-notification-${index + 1}`,
    }))),
    version: 1,
  });
}

export const PLATFORM_OFFLINE_NOTIFICATIONS_COVERAGE: readonly PlatformOfflineCoverageFact[] = Object.freeze([
  Object.freeze({
    key: "notifications",
    label: "Saved notifications",
    reason: null,
    status: "available",
  }),
  Object.freeze({
    key: "notification_changes",
    label: "Read, dismiss and preference changes",
    reason: "Reconnect to change notification status or delivery preferences.",
    status: "unavailable",
  }),
]);

export function isPlatformOfflineNotificationsViewModel(
  value: unknown,
): value is PlatformOfflineNotificationsViewModel {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    (value as Record<string, unknown>).kind === "notifications" &&
    (value as Record<string, unknown>).version === 1 &&
    Array.isArray((value as Record<string, unknown>).notifications);
}
