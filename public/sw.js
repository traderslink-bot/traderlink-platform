importScripts("/pwa-trade-sync.js");

const SHELL_CACHE = "traderlink-pwa-shell-v4";
const SHELL_ASSETS = Object.freeze([
  "/offline.html",
  "/pwa-offline-dashboard.js",
  "/icons/traderlink-192.png",
  "/icons/traderlink-512.png",
  "/icons/traderlink-maskable-512.png",
]);

async function unsubscribeCurrentPushDevice() {
  try {
    const subscription = await self.registration.pushManager.getSubscription();
    await subscription?.unsubscribe();
  } catch {
    // The push service will expire an unreachable subscription server-side.
  }
}

function safeDestinationPath(value) {
  return typeof value === "string" && value.length <= 512 && value.startsWith("/") &&
    !value.startsWith("//") && !value.includes("\\") && !value.includes("://")
    ? value
    : "/notifications";
}

function clearCurrentOfflineScope() {
  return new Promise((resolve) => {
    const request = indexedDB.open("traderlink-pwa-v1", 3);
    request.addEventListener("upgradeneeded", () => {
      const database = request.result;
      const transaction = request.transaction;
      const outbox = database.objectStoreNames.contains("manualTradeOutbox")
        ? transaction.objectStore("manualTradeOutbox")
        : database.createObjectStore("manualTradeOutbox", { keyPath: "ref" });
      if (!outbox.indexNames.contains("partitionKey")) {
        outbox.createIndex("partitionKey", "partitionKey", { unique: false });
      }
      const projections = database.objectStoreNames.contains("offlineProjections")
        ? transaction.objectStore("offlineProjections")
        : database.createObjectStore("offlineProjections", { keyPath: "ref" });
      if (!projections.indexNames.contains("partitionKey")) {
        projections.createIndex("partitionKey", "partitionKey", { unique: false });
      }
      if (!projections.indexNames.contains("updatedAtUtc")) {
        projections.createIndex("updatedAtUtc", "lastSyncedAtUtc", { unique: false });
      }
      if (!database.objectStoreNames.contains("deviceState")) {
        database.createObjectStore("deviceState", { keyPath: "key" });
      }
      const savedViews = database.objectStoreNames.contains("savedViews")
        ? transaction.objectStore("savedViews")
        : database.createObjectStore("savedViews", { keyPath: "ref" });
      if (!savedViews.indexNames.contains("partitionKey")) {
        savedViews.createIndex("partitionKey", "partitionKey", { unique: false });
      }
      if (!savedViews.indexNames.contains("updatedAtUtc")) {
        savedViews.createIndex("updatedAtUtc", "savedAtUtc", { unique: false });
      }
    });
    request.addEventListener("success", () => {
      const database = request.result;
      const transaction = database.transaction("deviceState", "readwrite");
      transaction.objectStore("deviceState").delete("current");
      transaction.addEventListener("complete", () => {
        database.close();
        void unsubscribeCurrentPushDevice().then(resolve);
      });
      transaction.addEventListener("error", () => {
        database.close();
        void unsubscribeCurrentPushDevice().then(resolve);
      });
    });
    request.addEventListener("error", () => {
      void unsubscribeCurrentPushDevice().then(resolve);
    });
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("traderlink-pwa-shell-") && key !== SHELL_CACHE)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.method === "POST" && url.pathname === "/api/auth/logout") {
    event.respondWith(
      fetch(request).then(async (response) => {
        await clearCurrentOfflineScope();
        return response;
      }),
    );
    return;
  }
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedFallback = await caches.match("/offline.html");
        return cachedFallback ?? Response.error();
      }),
    );
    return;
  }

  if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request)),
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
