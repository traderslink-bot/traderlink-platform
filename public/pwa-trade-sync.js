(function installTraderLinkTradeSync(worker) {
  const DATABASE_NAME = "traderlink-pwa-v1";
  const DATABASE_VERSION = 3;
  const OUTBOX_STORE = "manualTradeOutbox";
  const PARTITION_INDEX = "partitionKey";
  const PROJECTION_STORE = "offlineProjections";
  const SAVED_VIEW_STORE = "savedViews";
  const DEVICE_STATE_STORE = "deviceState";
  const MUTATION_HEADER = "x-traderlink-journal-mutation";
  const STALE_SYNC_MS = 2 * 60 * 1_000;

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

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.addEventListener("upgradeneeded", () => {
        const database = request.result;
        const store = database.objectStoreNames.contains(OUTBOX_STORE)
          ? request.transaction.objectStore(OUTBOX_STORE)
          : database.createObjectStore(OUTBOX_STORE, { keyPath: "ref" });
        if (!store.indexNames.contains(PARTITION_INDEX)) {
          store.createIndex(PARTITION_INDEX, "partitionKey", { unique: false });
        }
        const projections = database.objectStoreNames.contains(PROJECTION_STORE)
          ? request.transaction.objectStore(PROJECTION_STORE)
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
          ? request.transaction.objectStore(SAVED_VIEW_STORE)
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
      request.addEventListener("blocked", () => reject(request.error));
    });
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  async function putRecord(record) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(OUTBOX_STORE, "readwrite");
      transaction.objectStore(OUTBOX_STORE).put(record);
      await transactionComplete(transaction);
    } finally {
      database.close();
    }
  }

  async function listPartition(partitionKey) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(OUTBOX_STORE, "readonly");
      const records = await requestResult(
        transaction.objectStore(OUTBOX_STORE).index(PARTITION_INDEX).getAll(partitionKey),
      );
      await transactionComplete(transaction);
      return records.sort((left, right) =>
        left.createdAtUtc.localeCompare(right.createdAtUtc));
    } finally {
      database.close();
    }
  }

  function trackerStyle(tracker) {
    if (tracker === "swing") return "swing";
    if (tracker === "quick") return "other";
    return "day_trade";
  }

  function confirmations(preview) {
    const values = preview.groups.map((group) => ({
      groupRef: group.groupRef,
      relationship: group.allowedRelationships.find(
        (value) => value !== "not_finished",
      ) || "not_finished",
      style: trackerStyle(preview.tracker),
      existingPositionRef: group.existingPosition?.positionRef || null,
      completeExecutionSetConfirmed: true,
    }));
    return values.some((value) => value.relationship === "not_finished")
      ? null
      : values;
  }

  function issueForCode(code) {
    if (code === "TRADERLINK_MANUAL_TRADE_OFFLINE_DUPLICATE_CONFLICT") {
      return "possible_duplicate";
    }
    if (
      code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" ||
      code === "TRADERLINK_AUTH_SESSION_INVALID"
    ) {
      return "sign_in_required";
    }
    if (
      code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT" ||
      code === "TRADERLINK_ACCOUNT_ACCESS_DENIED"
    ) {
      return "account_changed";
    }
    return "check_details";
  }

  async function currentScope() {
    let response;
    try {
      response = await fetch("/api/platform/pwa/scope", {
        cache: "no-store",
        credentials: "include",
      });
    } catch {
      return null;
    }
    const body = await readJson(response);
    if (
      !response.ok ||
      body?.status !== "ready" ||
      typeof body.offlineScopeRef !== "string" ||
      typeof body.accountSelectionRef !== "string"
    ) {
      return null;
    }
    return body;
  }

  async function committedStatus(record) {
    const response = await fetch("/api/platform/journal/manual-trades/status", {
      body: JSON.stringify({
        tracker: record.tracker,
        entries: record.entries,
        expectedAccountSelectionRef: record.accountSelectionRef,
        idempotencyKey: record.idempotencyKey,
      }),
      cache: "no-store",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        [MUTATION_HEADER]: "1",
      },
      method: "POST",
    });
    const body = await readJson(response);
    if (!response.ok || body?.status !== "ready" || !body.result) {
      return {
        kind: response.status >= 500 ? "retry" : "review",
        code: body?.code,
      };
    }
    return body.result.committed
      ? { kind: "saved", result: body.result }
      : { kind: "not_saved" };
  }

  async function submit(record) {
    if (record.commitAttempted) {
      const status = await committedStatus(record);
      if (status.kind !== "not_saved") return status;
    }

    const previewResponse = await fetch(
      "/api/platform/journal/manual-trades/preview",
      {
        body: JSON.stringify({
          tracker: record.tracker,
          entries: record.entries,
          expectedAccountSelectionRef: record.accountSelectionRef,
        }),
        cache: "no-store",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          [MUTATION_HEADER]: "1",
        },
        method: "POST",
      },
    );
    const previewBody = await readJson(previewResponse);
    if (
      !previewResponse.ok ||
      previewBody?.status !== "ready" ||
      !previewBody.preview
    ) {
      return {
        kind: previewResponse.status >= 500 ? "retry" : "review",
        code: previewBody?.code,
      };
    }
    const selectedConfirmations = confirmations(previewBody.preview);
    if (!selectedConfirmations) {
      return {
        kind: "review",
        code: "TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT",
      };
    }

    let commitResponse;
    try {
      commitResponse = await fetch(
        "/api/platform/journal/manual-trades/commit",
        {
          body: JSON.stringify({
            confirmations: selectedConfirmations,
            entries: record.entries,
            expectedAccountSelectionRef: record.accountSelectionRef,
            idempotencyKey: record.idempotencyKey,
            offlineSync: {
              duplicateResolution:
                record.duplicateResolution || "review_required",
            },
            previewRef: previewBody.preview.previewRef,
            tracker: record.tracker,
          }),
          cache: "no-store",
          credentials: "include",
          headers: {
            "content-type": "application/json",
            [MUTATION_HEADER]: "1",
          },
          method: "POST",
        },
      );
    } catch {
      return { kind: "retry_after_commit" };
    }
    const commitBody = await readJson(commitResponse);
    if (
      !commitResponse.ok ||
      commitBody?.status !== "ready" ||
      !commitBody.result
    ) {
      return {
        kind: commitResponse.status >= 500 ? "retry_after_commit" : "review",
        code: commitBody?.code,
      };
    }
    return { kind: "saved", result: commitBody.result };
  }

  async function notifyClients() {
    const clients = await worker.clients.matchAll({
      includeUncontrolled: true,
      type: "window",
    });
    for (const client of clients) {
      client.postMessage({ type: "traderlink:pwa-outbox-changed" });
    }
  }

  async function syncCurrentScopeOutbox() {
    const scope = await currentScope();
    if (!scope) return;
    const key = `${scope.offlineScopeRef}:${scope.accountSelectionRef}`;
    const records = await listPartition(key);
    for (const record of records) {
      const staleSync = record.state === "syncing" &&
        Date.now() - Date.parse(record.updatedAtUtc) > STALE_SYNC_MS;
      if (
        !record.entries ||
        !record.idempotencyKey ||
        record.state === "saved_to_traderlink" ||
        record.state === "needs_review" ||
        (record.state === "syncing" && !staleSync)
      ) {
        continue;
      }
      const claimed = {
        ...record,
        state: "syncing",
        issue: null,
        attempts: record.attempts + 1,
        duplicateResolution:
          record.duplicateResolution || "review_required",
        updatedAtUtc: new Date().toISOString(),
      };
      await putRecord(claimed);

      let outcome;
      try {
        outcome = await submit(claimed);
      } catch {
        outcome = { kind: "retry" };
      }
      const updatedAtUtc = new Date().toISOString();
      if (outcome.kind === "saved") {
        await putRecord({
          ...claimed,
          entries: null,
          idempotencyKey: null,
          state: "saved_to_traderlink",
          issue: null,
          commitAttempted: true,
          result: {
            acceptedExecutionCount:
              outcome.result.acceptedExecutionCount ?? claimed.entries.length,
            pendingDecisionCount: outcome.result.pendingDecisionCount ?? 0,
            savedAtUtc: updatedAtUtc,
          },
          updatedAtUtc,
        });
      } else if (outcome.kind === "review") {
        await putRecord({
          ...claimed,
          state: "needs_review",
          issue: issueForCode(outcome.code),
          updatedAtUtc,
        });
      } else {
        await putRecord({
          ...claimed,
          state: "saved_on_device",
          issue: null,
          commitAttempted:
            claimed.commitAttempted || outcome.kind === "retry_after_commit",
          updatedAtUtc,
        });
      }
    }
    await notifyClients();
  }

  worker.traderLinkPwaTradeSync = Object.freeze({ syncCurrentScopeOutbox });
})(self);
