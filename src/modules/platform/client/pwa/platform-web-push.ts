"use client";

import { PLATFORM_MUTATION_REQUEST_HEADER } from "../../contracts/platform-request-security";
import type { PlatformNotificationCategory } from "../../contracts/platform-notification-contracts";

export type PlatformWebPushBrowserState =
  | "checking"
  | "denied"
  | "enabled"
  | "off"
  | "unsupported";

type PushConfigResponse = Readonly<{
  applicationServerKey?: string;
  status?: string;
}>;

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

export async function enablePlatformWebPush(
  categories: readonly PlatformNotificationCategory[],
): Promise<void> {
  if (!supported()) throw new Error("Push notifications are not supported in this browser.");
  const publicKey = await pushConfiguration();
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(permission === "denied"
      ? "Push notifications are blocked in this browser's settings."
      : "Push notifications were not enabled.");
  }
  const workerRegistration = await registration();
  let subscription = await workerRegistration.pushManager.getSubscription();
  let created = false;
  if (!subscription) {
    subscription = await workerRegistration.pushManager.subscribe({
      applicationServerKey: applicationServerKey(publicKey),
      userVisibleOnly: true,
    });
    created = true;
  }
  const response = await fetch("/api/platform/pwa/push/subscription", {
    body: JSON.stringify({ categories, subscription: subscription.toJSON() }),
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
}

export async function disablePlatformWebPush(): Promise<void> {
  if (!supported()) return;
  const subscription = await (await registration()).pushManager.getSubscription();
  if (!subscription) return;
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
  if (!serverRemoved) {
    throw new Error("Push was turned off on this device. TraderLink will finish removing the expired subscription automatically.");
  }
}
