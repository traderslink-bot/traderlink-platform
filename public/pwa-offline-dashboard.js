(function renderTraderLinkOfflineDashboard() {
  const DATABASE_NAME = "traderlink-pwa-v1";
  const DATABASE_VERSION = 3;
  const OUTBOX_STORE = "manualTradeOutbox";
  const PROJECTION_STORE = "offlineProjections";
  const SAVED_VIEW_STORE = "savedViews";
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
        const savedViews = database.objectStoreNames.contains(SAVED_VIEW_STORE)
          ? transaction.objectStore(SAVED_VIEW_STORE)
          : database.createObjectStore(SAVED_VIEW_STORE, { keyPath: "ref" });
        if (!savedViews.indexNames.contains(PARTITION_INDEX)) {
          savedViews.createIndex(PARTITION_INDEX, "partitionKey", { unique: false });
        }
        if (!savedViews.indexNames.contains("updatedAtUtc")) {
          savedViews.createIndex("updatedAtUtc", "savedAtUtc", { unique: false });
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

  function transactionComplete(transaction) {
    return new Promise((resolve, reject) => {
      transaction.addEventListener("complete", () => resolve());
      transaction.addEventListener("abort", () => reject(transaction.error));
      transaction.addEventListener("error", () => reject(transaction.error));
    });
  }

  async function putOutboxRecord(record) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(OUTBOX_STORE, "readwrite");
      transaction.objectStore(OUTBOX_STORE).put(record);
      await transactionComplete(transaction);
    } finally {
      database.close();
    }
  }

  async function pendingOutboxCount(partitionKey) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(OUTBOX_STORE, "readonly");
      const records = await requestResult(
        transaction.objectStore(OUTBOX_STORE).index(PARTITION_INDEX).getAll(partitionKey),
      );
      await transactionComplete(transaction);
      return records.filter((record) =>
        record.entries && record.state !== "saved_to_traderlink").length;
    } finally {
      database.close();
    }
  }

  async function requestBackgroundSync() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync?.register("traderlink-trade-outbox");
    } catch {
      // Foreground and reconnect retries remain available.
    }
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

  function offlineTracker(pathname) {
    if (pathname === "/quick-trade-entry") return "quick";
    if (pathname === "/trade-tracker/swings" || pathname.startsWith("/trade-tracker/swings/")) {
      return "swing";
    }
    return "day";
  }

  function validOfflineEntryState(state) {
    const opaque = /^[0-9a-f]{64}$/u;
    if (
      state?.version !== 2 || !opaque.test(state.offlineScopeRef ?? "") ||
      !opaque.test(state.accountSelectionRef ?? "") ||
      state.partitionKey !== `${state.offlineScopeRef}:${state.accountSelectionRef}` ||
      !/^[A-Z]{3}$/u.test(state.accountCurrency ?? "") ||
      typeof state.accountTimezone !== "string" || state.accountTimezone.length > 64
    ) {
      return false;
    }
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: state.accountTimezone }).format(0);
      return true;
    } catch {
      return false;
    }
  }

  function localTimestamp(timezone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      month: "2-digit",
      second: "2-digit",
      timeZone: timezone,
      year: "numeric",
    }).formatToParts(new Date());
    const part = (type) => parts.find((candidate) => candidate.type === type)?.value ?? "";
    return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}`;
  }

  function subtractCalendarDays(value, days) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10);
  }

  function canonicalDecimal(value, positive) {
    const trimmed = value.trim();
    const candidate = trimmed.startsWith(".") ? `0${trimmed}` : trimmed;
    const match = /^(\d+)(?:\.(\d+))?$/u.exec(candidate);
    if (!match) return null;
    const whole = (match[1] ?? "0").replace(/^0+(?=\d)/u, "");
    const fraction = (match[2] ?? "").replace(/0+$/u, "");
    const normalized = fraction ? `${whole}.${fraction}` : whole;
    if (normalized.length > 128 || (positive && normalized === "0")) return null;
    return normalized;
  }

  function field(label, input) {
    const wrapper = create("label", { className: "entry-field" });
    wrapper.append(create("span", { text: label }), input);
    return wrapper;
  }

  function entryInput(type, fieldName, value = "") {
    const input = create("input");
    input.type = type;
    input.dataset.field = fieldName;
    input.value = value;
    if (type === "time") input.step = "1";
    if (["quantity", "price", "fees"].includes(fieldName)) input.inputMode = "decimal";
    return input;
  }

  function renderOfflineEntry(main, state, pathname) {
    const card = create("section", { className: "entry-card" });
    card.append(create("h2", { text: "Enter trades offline" }));
    if (!validOfflineEntryState(state)) {
      card.append(create("p", {
        text: "Reconnect once with this Trade Tracker account selected before using offline entry on this device.",
      }));
      main.append(card);
      return;
    }

    const tracker = offlineTracker(pathname);
    const trackerLabel = tracker === "swing"
      ? "Swing Trade Tracker"
      : tracker === "quick" ? "Quick Trade Entry" : "Daily Trade Tracker";
    card.append(create("p", {
      text: `${trackerLabel} saves these executions only on this device until TraderLink can check them. Use the exact date, time, price and quantity shown by your broker. Times use ${state.accountTimezone}.`,
    }));

    const form = create("form");
    const rows = create("div", { className: "execution-list" });
    const message = create("div");
    const pending = create("div", { className: "pending-count" });
    let nextRow = 1;

    function updateRemoveButtons() {
      const allRows = rows.querySelectorAll(".execution-row");
      allRows.forEach((row) => {
        row.querySelector(".remove-execution").disabled = allRows.length === 1;
      });
    }

    function addExecution(side = "BUY", date = localTimestamp(state.accountTimezone).slice(0, 10)) {
      const row = create("div", { className: "execution-row" });
      row.dataset.rowRef = `row-${nextRow}`;
      nextRow += 1;
      row.append(create("span", {
        className: "execution-number",
        text: `Execution ${rows.children.length + 1}`,
      }));
      row.append(field("Trading date", entryInput("date", "date", date)));
      const symbol = entryInput("text", "symbol");
      symbol.autocomplete = "off";
      symbol.maxLength = 64;
      symbol.placeholder = "NVDA";
      row.append(field("Ticker", symbol));
      const sideInput = create("select");
      sideInput.dataset.field = "side";
      for (const value of ["BUY", "SELL"]) {
        const option = create("option", { text: value === "BUY" ? "Buy" : "Sell" });
        option.value = value;
        option.selected = value === side;
        sideInput.append(option);
      }
      row.append(field("Side", sideInput));
      row.append(field("Execution time", entryInput("time", "time")));
      row.append(field("Quantity", entryInput("text", "quantity")));
      row.append(field("Price", entryInput("text", "price")));
      const fees = entryInput("text", "fees");
      fees.placeholder = "Optional";
      row.append(field("Fees", fees));
      const remove = create("button", { className: "remove-execution", text: "Remove" });
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove execution ${rows.children.length + 1}`);
      remove.addEventListener("click", () => {
        row.remove();
        Array.from(rows.children).forEach((candidate, index) => {
          candidate.querySelector(".execution-number").textContent = `Execution ${index + 1}`;
        });
        updateRemoveButtons();
      });
      row.append(remove);
      rows.append(row);
      updateRemoveButtons();
    }

    function setMessage(kind, text) {
      message.className = `entry-message ${kind}`;
      message.textContent = text;
    }

    async function refreshPending() {
      const count = await pendingOutboxCount(state.partitionKey);
      pending.textContent = count === 0
        ? "No saved trade entries are waiting on this device."
        : `${count} saved trade ${count === 1 ? "entry remains" : "entries remain"} on this device.`;
    }

    addExecution("BUY");
    addExecution("SELL");
    form.append(rows);
    const actions = create("div", { className: "entry-actions" });
    const actionLeft = create("div", { className: "entry-actions-left" });
    const add = create("button", { className: "secondary-button", text: "Add execution" });
    add.type = "button";
    add.addEventListener("click", () => addExecution());
    const save = create("button", { className: "primary-button", text: "Save executions on this device" });
    save.type = "submit";
    actionLeft.append(add, save);
    const reconnect = create("a", { className: "secondary-button", href: pathname, text: "Try reconnecting" });
    actions.append(actionLeft, reconnect);
    form.append(actions, message, pending);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.className = "";
      message.textContent = "";
      save.disabled = true;
      try {
        const current = localTimestamp(state.accountTimezone);
        const entries = Array.from(rows.querySelectorAll(".execution-row")).map((row) => {
          const value = (name) => row.querySelector(`[data-field='${name}']`).value.trim();
          const date = value("date");
          const time = value("time");
          const symbol = value("symbol").toUpperCase();
          const quantity = canonicalDecimal(value("quantity"), true);
          const price = canonicalDecimal(value("price"), true);
          const feeText = value("fees");
          const fees = feeText === "" ? null : canonicalDecimal(feeText, false);
          if (
            !/^\d{4}-\d{2}-\d{2}$/u.test(date) || !/^\d{2}:\d{2}(?::\d{2})?$/u.test(time) ||
            symbol.length < 1 || symbol.length > 64 || /[\u0000-\u001f\u007f]/u.test(symbol) ||
            !quantity || !price || (feeText !== "" && fees === null)
          ) {
            throw new Error("Complete every execution with a valid date, time, ticker, quantity and price. Fees may be left blank.");
          }
          const localTime = time.length === 5 ? `${time}:00` : time;
          const side = value("side").toLowerCase();
          if (side !== "buy" && side !== "sell") {
            throw new Error("Choose Buy or Sell for every execution.");
          }
          if (`${date}T${localTime}` > current) {
            throw new Error("Future execution times cannot be saved.");
          }
          return {
            clientRowRef: row.dataset.rowRef,
            localDate: date,
            localTime,
            sourceTimezone: state.accountTimezone,
            normalizedSymbol: symbol,
            tradeCurrency: state.accountCurrency,
            side,
            quantityDecimal: quantity,
            priceDecimal: price,
            feesDecimal: fees,
          };
        });
        if (entries.length < 1 || entries.length > 200) {
          throw new Error("Enter between 1 and 200 executions.");
        }
        const dates = [...new Set(entries.map((entry) => entry.localDate))];
        if (tracker === "day" && dates.length !== 1) {
          throw new Error("Enter executions for one trading day at a time.");
        }
        const earliestRecentDate = subtractCalendarDays(current.slice(0, 10), 6);
        if (tracker === "day" && dates.some((date) => date < earliestRecentDate)) {
          throw new Error("Daily Trade Tracker accepts today or the previous six calendar days. Use Quick Trade Entry for older executions.");
        }
        if (tracker === "swing" && dates.sort().at(-1) < earliestRecentDate) {
          throw new Error("A new Swing entry must include a current or recently completed execution.");
        }
        const timestamp = new Date().toISOString();
        await putOutboxRecord({
          version: 1,
          ref: crypto.randomUUID(),
          partitionKey: state.partitionKey,
          offlineScopeRef: state.offlineScopeRef,
          accountSelectionRef: state.accountSelectionRef,
          tracker,
          entries,
          idempotencyKey: crypto.randomUUID(),
          createdAtUtc: timestamp,
          updatedAtUtc: timestamp,
          state: "saved_on_device",
          issue: null,
          attempts: 0,
          commitAttempted: false,
          duplicateResolution: "review_required",
          result: null,
        });
        await requestBackgroundSync();
        setMessage("success", `${entries.length} execution${entries.length === 1 ? "" : "s"} saved on this device. TraderLink will check them after you reconnect.`);
        rows.replaceChildren();
        addExecution("BUY");
        addExecution("SELL");
        await refreshPending();
      } catch (error) {
        setMessage("error", error instanceof Error ? error.message : "The executions could not be saved on this device.");
      } finally {
        save.disabled = false;
      }
    });

    void refreshPending().catch(() => {
      pending.textContent = "Saved entries remain on this device until TraderLink can check them.";
    });
    card.append(form);
    main.append(card);
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
          : item?.mode === "full_offline_entry"
            ? "The last page view was not saved, but you can still enter completed broker executions below."
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
        create("p", { text: "Trades already saved on this device stay queued for sync. You can add completed broker executions below, even after reopening the installed app without a connection." }),
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
      const item = matchingNavigationItem(state, pathname);
      if (item?.mode === "full_offline_entry") {
        renderOfflineEntry(mainElement, state, pathname);
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
