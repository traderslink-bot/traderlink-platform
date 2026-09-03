"use client";

import { PLATFORM_MUTATION_REQUEST_HEADER } from "../../contracts/platform-request-security";
import type { PlatformNotificationCategory } from "../../contracts/platform-notification-contracts";

export type PlatformWebPushBrowserState =
  | "checking"
  | "denied"
  | "enabled"
  | "off"
  | "unsupported";

export const PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT = "traderlink:web-push-state-changed";

type PushConfigResponse = Readonly<{
  applicationServerKey?: string;
  status?: string;
}>;

type PushSubscriptionStatusResponse = Readonly<{
  status?: string;
}>;

export type PreparedPlatformWebPush = Readonly<{
  applicationServerKey: string;
  workerRegistration: ServiceWorkerRegistration;
}>;

let preparation: Promise<PreparedPlatformWebPush> | null = null;

function announcePlatformWebPushStateChanged(): void {
  window.dispatchEvent(new Event(PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT));
}

function applicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = window.atob((value + padding).replace(/-/gu, "+").replace(/_/gu, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

function supported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  return await navigator.serviceWorker.ready;
}

export async function readPlatformWebPushBrowserState(): Promise<PlatformWebPushBrowserState> {
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const subscription = await (await registration()).pushManager.getSubscription();
  return subscription ? "enabled" : "off";
}

async function pushConfiguration(): Promise<string> {
  const response = await fetch("/api/platform/pwa/push/config", {
    cache: "no-store",
    credentials: "same-origin",
  });
  const body = await response.json() as PushConfigResponse;
  if (!response.ok || body.status !== "ready" || typeof body.applicationServerKey !== "string") {
    throw new Error("Web Push is not available yet.");
  }
  return body.applicationServerKey;
}

export async function preparePlatformWebPush(): Promise<PreparedPlatformWebPush> {
  if (!supported()) throw new Error("Push notifications are not supported in this browser.");
  preparation ??= Promise.all([pushConfiguration(), registration()]).then(([
    applicationServerKey,
    workerRegistration,
  ]) => Object.freeze({ applicationServerKey, workerRegistration }));
  try {
    return await preparation;
  } catch (error) {
    preparation = null;
    throw error;
  }
}

export async function readPlatformWebPushSubscriptionStatus(): Promise<"active" | "needs_restore"> {
  if (!supported()) throw new Error("Push notifications are not supported in this browser.");
  const subscription = await (await registration()).pushManager.getSubscription();
  if (!subscription) return "needs_restore";
  const response = await fetch("/api/platform/pwa/push/subscription", {
    body: JSON.stringify({ endpoint: subscription.endpoint, operation: "status" }),
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      [PLATFORM_MUTATION_REQUEST_HEADER]: "1",
    },
    method: "POST",
  });
  const body = await response.json() as PushSubscriptionStatusResponse;
  if (!response.ok || (body.status !== "active" && body.status !== "needs_restore")) {
    throw new Error("Push notification status could not be confirmed.");
  }
  return body.status;
}

async function activatePlatformWebPush(
  prepared: PreparedPlatformWebPush,
  categories?: readonly PlatformNotificationCategory[],
): Promise<void> {
  if (!supported()) throw new Error("Push notifications are not supported in this browser.");
  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(permission === "denied"
      ? "Push notifications are blocked in this browser's settings."
      : "Push notifications were not enabled.");
  }
  let subscription = await prepared.workerRegistration.pushManager.getSubscription();
  let created = false;
  if (!subscription) {
    subscription = await prepared.workerRegistration.pushManager.subscribe({
      applicationServerKey: applicationServerKey(prepared.applicationServerKey),
      userVisibleOnly: true,
    });
    created = true;
  }
  const response = await fetch("/api/platform/pwa/push/subscription", {
    body: JSON.stringify({
      ...(categories ? { categories } : {}),
      subscription: subscription.toJSON(),
    }),
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      [PLATFORM_MUTATION_REQUEST_HEADER]: "1",
    },
    method: "POST",
  });
  if (!response.ok) {
    if (created) await subscription.unsubscribe();
    throw new Error(response.status === 503
      ? "Push notifications are not available yet."
      : "Push notifications could not be enabled. Try again.");
  }
  announcePlatformWebPushStateChanged();
}

export async function enablePlatformWebPush(
  categories: readonly PlatformNotificationCategory[],
  prepared: PreparedPlatformWebPush,
): Promise<void> {
  await activatePlatformWebPush(prepared, categories);
}

export async function enablePlatformWebPushWithSavedPreferences(
  prepared: PreparedPlatformWebPush,
): Promise<void> {
  await activatePlatformWebPush(prepared);
}

export async function disablePlatformWebPush(): Promise<void> {
  if (!supported()) return;
  const subscription = await (await registration()).pushManager.getSubscription();
  if (!subscription) {
    announcePlatformWebPushStateChanged();
    return;
  }
  let serverRemoved = false;
  try {
    const response = await fetch("/api/platform/pwa/push/subscription", {
      body: JSON.stringify({ endpoint: subscription.endpoint }),
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        [PLATFORM_MUTATION_REQUEST_HEADER]: "1",
      },
      method: "DELETE",
    });
    serverRemoved = response.ok;
  } finally {
    await subscription.unsubscribe();
  }
  announcePlatformWebPushStateChanged();
  if (!serverRemoved) {
    throw new Error("Push was turned off on this device. TraderLink will finish removing the expired subscription automatically.");
  }
}
