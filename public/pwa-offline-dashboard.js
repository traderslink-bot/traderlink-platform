(function renderTraderLinkOfflineDashboard() {
  const DATABASE_NAME = "traderlink-pwa-v1";
  const DATABASE_VERSION = 2;
  const OUTBOX_STORE = "manualTradeOutbox";
  const PROJECTION_STORE = "offlineProjections";
  const DEVICE_STATE_STORE = "deviceState";
  const PARTITION_INDEX = "partitionKey";

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.addEventListener("upgradeneeded", () => {
        const database = request.result;
        const transaction = request.transaction;
        const outbox = database.objectStoreNames.contains(OUTBOX_STORE)
          ? transaction.objectStore(OUTBOX_STORE)
          : database.createObjectStore(OUTBOX_STORE, { keyPath: "ref" });
        if (!outbox.indexNames.contains(PARTITION_INDEX)) {
          outbox.createIndex(PARTITION_INDEX, "partitionKey", { unique: false });
        }
        const projections = database.objectStoreNames.contains(PROJECTION_STORE)
          ? transaction.objectStore(PROJECTION_STORE)
          : database.createObjectStore(PROJECTION_STORE, { keyPath: "ref" });
        if (!projections.indexNames.contains(PARTITION_INDEX)) {
          projections.createIndex(PARTITION_INDEX, "partitionKey", { unique: false });
        }
        if (!projections.indexNames.contains("updatedAtUtc")) {
          projections.createIndex("updatedAtUtc", "lastSyncedAtUtc", { unique: false });
        }
        if (!database.objectStoreNames.contains(DEVICE_STATE_STORE)) {
          database.createObjectStore(DEVICE_STATE_STORE, { keyPath: "key" });
        }
      });
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  }

  function normalizePathname(pathname) {
    if (typeof pathname !== "string" || !pathname.startsWith("/")) return "/workspace";
    return pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  }

  function formatTimestamp(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "an earlier online visit"
      : new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date);
  }

  function create(tagName, options) {
    const element = document.createElement(tagName);
    if (options?.className) element.className = options.className;
    if (options?.text) element.textContent = options.text;
    if (options?.href) element.setAttribute("href", options.href);
    return element;
  }

  function renderNavigation(container, state, pathname) {
    const brand = create("a", { className: "brand", href: "/workspace" });
    const icon = create("img");
    icon.setAttribute("alt", "");
    icon.setAttribute("src", "/icons/traderlink-192.png");
    brand.append(icon, create("span", { text: "TraderLink Platform" }));
    container.append(brand);
    for (const group of state?.navigation ?? []) {
      const section = create("section", { className: "nav-group" });
      section.append(create("h2", { text: group.label }));
      for (const item of group.items ?? []) {
        section.append(create("a", {
          className: normalizePathname(item.href) === pathname ? "nav-link active" : "nav-link",
          href: item.href,
          text: item.label,
        }));
      }
      container.append(section);
    }
  }

  function onlineRequiredMessage(pathname) {
    if (pathname.startsWith("/ai-chat")) return "AI Chat needs an internet connection to create a new response.";
    if (pathname.startsWith("/charts")) return "Market Charts needs an internet connection for live market data.";
    if (pathname.startsWith("/imports")) return "Trade imports need an internet connection so TraderLink can safely check the source.";
    if (pathname.startsWith("/data-decisions")) return "Data Decision changes need an internet connection and the current Journal facts.";
    if (pathname.startsWith("/account")) return "Account and security changes need an internet connection.";
    if (pathname.startsWith("/analytics/lab")) return "Analytics Lab needs an internet connection for its current product checks.";
    return "This page needs an internet connection and current TraderLink information.";
  }

  function matchingNavigationItem(state, pathname) {
    return (state?.navigation ?? [])
      .flatMap((group) => group.items ?? [])
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((left, right) => right.href.length - left.href.length)[0];
  }

  function renderEmpty(main, state, pathname) {
    const item = matchingNavigationItem(state, pathname);
    main.append(
      create("div", { className: "status", text: "Offline" }),
      create("h1", { text: item?.label ?? "TraderLink Platform" }),
      create("p", {
        className: "lead",
        text: item?.mode === "online_required"
          ? onlineRequiredMessage(pathname)
          : "This page has not been saved on this device yet. Open it once while online to keep a bounded read-only copy here.",
      }),
    );
  }

  function renderProjection(main, projection) {
    main.append(
      create("div", {
        className: "status",
        text: `Offline · Last updated ${formatTimestamp(projection.lastSyncedAtUtc)}`,
      }),
      create("h1", { text: projection.title }),
      create("p", {
        className: "lead",
        text: "This is the last information TraderLink saved on this device. It is read-only and may be older than the Journal.",
      }),
    );
    if (projection.routeMode === "full_offline_entry") {
      const entryNotice = create("div", { className: "notice" });
      entryNotice.append(
        create("strong", { text: "Offline trade entry" }),
        create("p", { text: "Trades already saved on this device stay queued for sync. Keep this installed app open to add another offline execution; a full page reload needs a connection before the entry form can reopen." }),
      );
      main.append(entryNotice);
    }
    const grid = create("div", { className: "projection-grid" });
    for (const block of projection.blocks ?? []) {
      const card = create("section", { className: "projection-card" });
      if (block.heading) card.append(create("h2", { text: block.heading }));
      const list = create("ul");
      for (const line of block.lines ?? []) list.append(create("li", { text: line }));
      card.append(list);
      grid.append(card);
    }
    main.append(grid);
  }

  async function load() {
    const database = await openDatabase();
    try {
      const state = await requestResult(
        database.transaction(DEVICE_STATE_STORE, "readonly")
          .objectStore(DEVICE_STATE_STORE).get("current"),
      );
      const pathname = normalizePathname(window.location.pathname);
      let projection = null;
      if (state?.partitionKey) {
        projection = await requestResult(
          database.transaction(PROJECTION_STORE, "readonly")
            .objectStore(PROJECTION_STORE).get(`${state.partitionKey}:${pathname}`),
        );
      }
      const navigationElement = document.getElementById("offline-navigation");
      const mainElement = document.getElementById("offline-content");
      renderNavigation(navigationElement, state, pathname);
      if (projection?.partitionKey === state?.partitionKey && projection?.pathname === pathname) {
        renderProjection(mainElement, projection);
      } else {
        renderEmpty(mainElement, state, pathname);
      }
    } finally {
      database.close();
    }
  }

  load().catch(() => {
    const main = document.getElementById("offline-content");
    main.append(
      create("div", { className: "status", text: "Offline" }),
      create("h1", { text: "TraderLink is offline" }),
      create("p", { className: "lead", text: "Reconnect to open TraderLink. No saved Journal information was available to show." }),
    );
  });
})();
