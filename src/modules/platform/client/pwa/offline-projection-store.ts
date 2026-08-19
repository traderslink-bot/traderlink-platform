"use client";

import {
  PLATFORM_OFFLINE_DATABASE_NAME,
  PLATFORM_OFFLINE_DATABASE_VERSION,
  PLATFORM_OFFLINE_DEVICE_STATE_STORE,
  PLATFORM_OFFLINE_MAX_PROJECTIONS_PER_PARTITION,
  PLATFORM_OFFLINE_OUTBOX_STORE,
  PLATFORM_OFFLINE_PARTITION_INDEX,
  PLATFORM_OFFLINE_PROJECTION_STORE,
  type PlatformOfflineDeviceState,
  type PlatformOfflineProjection,
} from "@/src/modules/platform/contracts/platform-offline-projection-contracts";

const PROJECTION_UPDATED_INDEX = "updatedAtUtc";
const OPAQUE_REF_PATTERN = /^[0-9a-f]{64}$/u;

export const PLATFORM_OFFLINE_DATA_CHANGED_EVENT =
  "traderlink:pwa-offline-data-changed";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("abort", () => reject(transaction.error));
    transaction.addEventListener("error", () => reject(transaction.error));
  });
}

function installStores(database: IDBDatabase, transaction: IDBTransaction): void {
  const outbox = database.objectStoreNames.contains(PLATFORM_OFFLINE_OUTBOX_STORE)
    ? transaction.objectStore(PLATFORM_OFFLINE_OUTBOX_STORE)
    : database.createObjectStore(PLATFORM_OFFLINE_OUTBOX_STORE, { keyPath: "ref" });
  if (!outbox.indexNames.contains(PLATFORM_OFFLINE_PARTITION_INDEX)) {
    outbox.createIndex(PLATFORM_OFFLINE_PARTITION_INDEX, "partitionKey", { unique: false });
  }

  const projections = database.objectStoreNames.contains(PLATFORM_OFFLINE_PROJECTION_STORE)
    ? transaction.objectStore(PLATFORM_OFFLINE_PROJECTION_STORE)
    : database.createObjectStore(PLATFORM_OFFLINE_PROJECTION_STORE, { keyPath: "ref" });
  if (!projections.indexNames.contains(PLATFORM_OFFLINE_PARTITION_INDEX)) {
    projections.createIndex(PLATFORM_OFFLINE_PARTITION_INDEX, "partitionKey", { unique: false });
  }
  if (!projections.indexNames.contains(PROJECTION_UPDATED_INDEX)) {
    projections.createIndex(PROJECTION_UPDATED_INDEX, "lastSyncedAtUtc", { unique: false });
  }

  if (!database.objectStoreNames.contains(PLATFORM_OFFLINE_DEVICE_STATE_STORE)) {
    database.createObjectStore(PLATFORM_OFFLINE_DEVICE_STATE_STORE, { keyPath: "key" });
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      PLATFORM_OFFLINE_DATABASE_NAME,
      PLATFORM_OFFLINE_DATABASE_VERSION,
    );
    request.addEventListener("upgradeneeded", () => {
      installStores(request.result, request.transaction!);
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
    request.addEventListener("blocked", () => {
      reject(new Error("Offline data is being updated in another TraderLink window."));
    });
  });
}

export function platformOfflinePartitionKey(
  offlineScopeRef: string,
  accountSelectionRef: string | null,
): string {
  if (
    !OPAQUE_REF_PATTERN.test(offlineScopeRef) ||
    (accountSelectionRef !== null && !OPAQUE_REF_PATTERN.test(accountSelectionRef))
  ) {
    throw new Error("Offline data scope is unavailable.");
  }
  return `${offlineScopeRef}:${accountSelectionRef ?? "platform"}`;
}

function notifyChanged(): void {
  window.dispatchEvent(new Event(PLATFORM_OFFLINE_DATA_CHANGED_EVENT));
}

export async function recordPlatformOfflineDeviceState(
  state: PlatformOfflineDeviceState,
): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(PLATFORM_OFFLINE_DEVICE_STATE_STORE, "readwrite");
    transaction.objectStore(PLATFORM_OFFLINE_DEVICE_STATE_STORE).put(state);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
  notifyChanged();
}

export async function savePlatformOfflineProjection(
  projection: PlatformOfflineProjection,
): Promise<void> {
  const database = await openDatabase();
  try {
    const readTransaction = database.transaction(PLATFORM_OFFLINE_PROJECTION_STORE, "readonly");
    const partitionRecords = await requestResult(
      readTransaction.objectStore(PLATFORM_OFFLINE_PROJECTION_STORE)
        .index(PLATFORM_OFFLINE_PARTITION_INDEX).getAll(projection.partitionKey),
    ) as PlatformOfflineProjection[];
    await transactionComplete(readTransaction);
    const transaction = database.transaction(PLATFORM_OFFLINE_PROJECTION_STORE, "readwrite");
    const store = transaction.objectStore(PLATFORM_OFFLINE_PROJECTION_STORE);
    store.put(projection);
    partitionRecords
      .filter((record) => record.ref !== projection.ref)
      .sort((left, right) => right.lastSyncedAtUtc.localeCompare(left.lastSyncedAtUtc))
      .slice(PLATFORM_OFFLINE_MAX_PROJECTIONS_PER_PARTITION - 1)
      .forEach((record) => store.delete(record.ref));
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
  notifyChanged();
}

export type PlatformOfflineStorageSummary = Readonly<{
  approximateBytes: number;
  lastSyncedAtUtc: string | null;
  pendingTradeCount: number;
  projectionCount: number;
}>;

export async function readPlatformOfflineStorageSummary(
  partitionKey: string,
): Promise<PlatformOfflineStorageSummary> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(
      [PLATFORM_OFFLINE_PROJECTION_STORE, PLATFORM_OFFLINE_OUTBOX_STORE],
      "readonly",
    );
    const projectionRequest = requestResult(
      transaction.objectStore(PLATFORM_OFFLINE_PROJECTION_STORE)
        .index(PLATFORM_OFFLINE_PARTITION_INDEX).getAll(partitionKey),
    );
    const outboxRequest = requestResult(
      transaction.objectStore(PLATFORM_OFFLINE_OUTBOX_STORE)
        .index(PLATFORM_OFFLINE_PARTITION_INDEX).getAll(partitionKey),
    );
    const [projections, outbox] = await Promise.all([
      projectionRequest,
      outboxRequest,
    ]) as [PlatformOfflineProjection[], readonly Readonly<{ entries?: unknown; state?: string }>[]];
    await transactionComplete(transaction);
    const lastSyncedAtUtc = projections
      .map((projection) => projection.lastSyncedAtUtc)
      .sort((left, right) => right.localeCompare(left))[0] ?? null;
    return Object.freeze({
      approximateBytes: new Blob([JSON.stringify(projections)]).size,
      lastSyncedAtUtc,
      pendingTradeCount: outbox.filter((record) =>
        record.entries && record.state !== "saved_to_traderlink").length,
      projectionCount: projections.length,
    });
  } finally {
    database.close();
  }
}

export async function removePlatformOfflinePartition(
  partitionKey: string,
): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(
      [
        PLATFORM_OFFLINE_DEVICE_STATE_STORE,
        PLATFORM_OFFLINE_OUTBOX_STORE,
        PLATFORM_OFFLINE_PROJECTION_STORE,
      ],
      "readwrite",
    );
    const outboxStore = transaction.objectStore(PLATFORM_OFFLINE_OUTBOX_STORE);
    const projectionStore = transaction.objectStore(PLATFORM_OFFLINE_PROJECTION_STORE);
    const deviceStore = transaction.objectStore(PLATFORM_OFFLINE_DEVICE_STATE_STORE);
    const [outboxKeys, projectionKeys, current] = await Promise.all([
      requestResult(outboxStore.index(PLATFORM_OFFLINE_PARTITION_INDEX).getAllKeys(partitionKey)),
      requestResult(projectionStore.index(PLATFORM_OFFLINE_PARTITION_INDEX).getAllKeys(partitionKey)),
      requestResult(deviceStore.get("current")),
    ]) as [IDBValidKey[], IDBValidKey[], PlatformOfflineDeviceState | undefined];
    outboxKeys.forEach((key) => outboxStore.delete(key));
    projectionKeys.forEach((key) => projectionStore.delete(key));
    if (current?.partitionKey === partitionKey) {
      deviceStore.delete("current");
    }
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
  notifyChanged();
  window.dispatchEvent(new Event("traderlink:pwa-manual-trade-outbox-changed"));
}
