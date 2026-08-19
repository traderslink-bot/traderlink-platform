importScripts("/pwa-trade-sync.js");

const SHELL_CACHE = "traderlink-pwa-shell-v3";
const SHELL_ASSETS = Object.freeze([
  "/offline.html",
  "/pwa-offline-dashboard.js",
  "/icons/traderlink-192.png",
  "/icons/traderlink-512.png",
  "/icons/traderlink-maskable-512.png",
]);

function clearCurrentOfflineScope() {
  return new Promise((resolve) => {
    const request = indexedDB.open("traderlink-pwa-v1", 2);
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
    });
    request.addEventListener("success", () => {
      const database = request.result;
      const transaction = database.transaction("deviceState", "readwrite");
      transaction.objectStore("deviceState").delete("current");
      transaction.addEventListener("complete", () => {
        database.close();
        resolve();
      });
      transaction.addEventListener("error", () => {
        database.close();
        resolve();
      });
    });
    request.addEventListener("error", () => resolve());
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
  event.waitUntil(
    self.registration.showNotification("TraderLink Platform", {
      body: "You have a new TraderLink update.",
      icon: "/icons/traderlink-192.png",
      badge: "/icons/traderlink-192.png",
      data: { path: "/notifications" },
      tag: "traderlink-update",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" })
      .then(async (clients) => {
        const existingClient = clients.find((client) => "focus" in client);
        if (existingClient) {
          await existingClient.navigate("/notifications");
          return existingClient.focus();
        }
        return self.clients.openWindow("/notifications");
      }),
  );
});
