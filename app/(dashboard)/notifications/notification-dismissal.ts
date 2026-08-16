"use client";

const STORAGE_PREFIX = "traderlink:notification-dismissed:v1";

function storageKey(notificationRef: string): string {
  return `${STORAGE_PREFIX}:${notificationRef}`;
}

export function isNotificationDismissed(notificationRef: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(notificationRef)) === "dismissed";
  } catch {
    return false;
  }
}

export function dismissNotification(notificationRef: string): void {
  try {
    window.localStorage.setItem(storageKey(notificationRef), "dismissed");
  } catch {
    // The notification still closes for this open page when browser storage is unavailable.
  }
}
