import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
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

function clearCurrentOfflineScope(): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.open("traderlink-pwa-v1", 2);
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
      handler: new NetworkOnly(),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
  skipWaiting: false,
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
  try {
    const data = event.data?.json();
    if (data?.version === 1) path = safeDestinationPath(data.destinationPath);
  } catch {
    path = "/notifications";
  }
  event.waitUntil(
    self.registration.showNotification("TraderLink Platform", {
      body: "You have a new TraderLink update.",
      icon: "/icons/traderlink-192.png",
      badge: "/icons/traderlink-192.png",
      data: { path },
      tag: "traderlink-update",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = safeDestinationPath(event.notification.data?.path);
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
