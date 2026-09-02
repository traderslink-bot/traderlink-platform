import type {
  PrecacheEntry,
  SerwistGlobalConfig,
  SerwistPlugin,
} from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    traderLinkPwaTradeSync: {
      syncCurrentScopeOutbox: () => Promise<void>;
    };
  }
}

declare const self: ServiceWorkerGlobalScope;

type TraderLinkNotificationAction = Readonly<{
  action: string;
  title: string;
}>;

async function unsubscribeCurrentPushDevice(): Promise<void> {
  try {
    const subscription = await self.registration.pushManager.getSubscription();
    await subscription?.unsubscribe();
  } catch {
    // The push service will expire an unreachable subscription server-side.
  }
}

function safeDestinationPath(value: unknown): string {
  return typeof value === "string" &&
    value.length <= 512 &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes("://")
    ? value
    : "/notifications";
}

function safeNotificationText(value: unknown, fallback: string, maximum: number): string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum
    ? value.trim()
    : fallback;
}

function safeTicker(value: unknown): string | null {
  return typeof value === "string" && /^[A-Z0-9.-]{1,24}$/u.test(value)
    ? value
    : null;
}

const offlineNavigationPlugin: SerwistPlugin = {
  async handlerDidError({ request }) {
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return undefined;
    if (url.pathname === "/offline") {
      return serwist.matchPrecache("/offline");
    }
    const intendedPath = safeDestinationPath(url.pathname);
    const offlineUrl = new URL("/offline", self.location.origin);
    offlineUrl.searchParams.set("path", intendedPath);
    return Response.redirect(offlineUrl.href, 302);
  },
};

function clearCurrentOfflineScope(): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.open("traderlink-pwa-v1", 3);
    request.addEventListener("upgradeneeded", () => {
      const database = request.result;
      const transaction = request.transaction;
      const outbox = database.objectStoreNames.contains("manualTradeOutbox")
        ? transaction?.objectStore("manualTradeOutbox")
        : database.createObjectStore("manualTradeOutbox", { keyPath: "ref" });
      if (outbox && !outbox.indexNames.contains("partitionKey")) {
        outbox.createIndex("partitionKey", "partitionKey", { unique: false });
      }
      const projections = database.objectStoreNames.contains("offlineProjections")
        ? transaction?.objectStore("offlineProjections")
        : database.createObjectStore("offlineProjections", { keyPath: "ref" });
      if (projections && !projections.indexNames.contains("partitionKey")) {
        projections.createIndex("partitionKey", "partitionKey", { unique: false });
      }
      if (projections && !projections.indexNames.contains("updatedAtUtc")) {
        projections.createIndex("updatedAtUtc", "lastSyncedAtUtc", { unique: false });
      }
      if (!database.objectStoreNames.contains("deviceState")) {
        database.createObjectStore("deviceState", { keyPath: "key" });
      }
      const savedViews = database.objectStoreNames.contains("savedViews")
        ? transaction?.objectStore("savedViews")
        : database.createObjectStore("savedViews", { keyPath: "ref" });
      if (savedViews && !savedViews.indexNames.contains("partitionKey")) {
        savedViews.createIndex("partitionKey", "partitionKey", {
          unique: false,
        });
      }
      if (savedViews && !savedViews.indexNames.contains("updatedAtUtc")) {
        savedViews.createIndex("updatedAtUtc", "savedAtUtc", { unique: false });
      }
    });
    request.addEventListener("success", () => {
      const database = request.result;
      const transaction = database.transaction("deviceState", "readwrite");
      transaction.objectStore("deviceState").delete("current");
      const finish = () => {
        database.close();
        void unsubscribeCurrentPushDevice().then(resolve);
      };
      transaction.addEventListener("complete", finish);
      transaction.addEventListener("error", finish);
    });
    request.addEventListener("error", () => {
      void unsubscribeCurrentPushDevice().then(resolve);
    });
  });
}

const serwist = new Serwist({
  cacheId: "traderlink-public-shell",
  clientsClaim: true,
  importScripts: ["/pwa-trade-sync.js"],
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  runtimeCaching: [
    {
      matcher: ({ request, sameOrigin }) =>
        sameOrigin && request.mode === "navigate",
      handler: new NetworkOnly({ plugins: [offlineNavigationPlugin] }),
    },
  ],
  skipWaiting: true,
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    url.origin === self.location.origin &&
    request.method === "POST" &&
    url.pathname === "/api/auth/logout"
  ) {
    event.respondWith(
      fetch(request).then(async (response) => {
        await clearCurrentOfflineScope();
        return response;
      }),
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "traderlink-trade-outbox") return;
  event.waitUntil(
    self.traderLinkPwaTradeSync.syncCurrentScopeOutbox()
      .then(() => self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      }))
      .then((clients) => Promise.all(clients.map((client) =>
        client.postMessage({ type: "traderlink:pwa-sync-request" }))
      )),
  );
});

self.addEventListener("push", (event) => {
  let path = "/notifications";
  let title = "TraderLink Platform";
  let body = "You have a new TraderLink update.";
  let tag = "traderlink-update";
  let muteHaltTicker: string | null = null;
  let actions: TraderLinkNotificationAction[] = [];
  try {
    const data = event.data?.json();
    if (data?.version === 1 || data?.version === 2 || data?.version === 3) {
      path = safeDestinationPath(data.destinationPath);
      title = safeNotificationText(data.notificationTitle, title, 120);
      body = safeNotificationText(data.notificationBody, body, 240);
      tag = safeNotificationText(data.notificationTag, tag, 160);
      muteHaltTicker = safeTicker(data.muteHaltTicker);
      if (muteHaltTicker && Array.isArray(data.notificationActions)) {
        actions = data.notificationActions
          .filter((action: unknown) => action && typeof action === "object" &&
            (action as { action?: unknown }).action === "mute-halt-ticker")
          .slice(0, 1)
          .map(() => ({ action: "mute-halt-ticker", title: "Mute for today" }));
      }
    }
  } catch {
    path = "/notifications";
  }
  const notificationOptions: NotificationOptions & Readonly<{
    actions: readonly TraderLinkNotificationAction[];
  }> = {
    body,
    icon: "/icons/traderlink-192.png",
    badge: "/icons/traderlink-192.png",
    actions,
    data: { muteHaltTicker, path },
    tag,
  };
  event.waitUntil(self.registration.showNotification(title, notificationOptions));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const ticker = safeTicker(event.notification.data?.muteHaltTicker);
  const path = event.action === "mute-halt-ticker" && ticker
    ? `/workspace?muteHaltTicker=${encodeURIComponent(ticker)}`
    : safeDestinationPath(event.notification.data?.path);
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" })
      .then(async (clients) => {
        const existingClient = clients.find((client) => "focus" in client);
        if (existingClient) {
          await existingClient.navigate(path);
          return existingClient.focus();
        }
        return self.clients.openWindow(path);
      }),
  );
});

serwist.addEventListeners();
