"use client";

import type {
  JournalManualTradeOfflineDuplicateResolution,
  JournalManualTradeCommitStatus,
  JournalManualTradeEntry,
  JournalManualTradePreview,
  JournalManualTrackerKind,
} from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import type { DailyTradeAnalyzerQueueOutcome } from "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

const DATABASE_NAME = "traderlink-pwa-v1";
const DATABASE_VERSION = 3;
const OUTBOX_STORE = "manualTradeOutbox";
const PARTITION_INDEX = "partitionKey";
const PROJECTION_STORE = "offlineProjections";
const SAVED_VIEW_STORE = "savedViews";
const DEVICE_STATE_STORE = "deviceState";
const OPAQUE_REF_PATTERN = /^[0-9a-f]{64}$/u;
const RECEIPT_RETENTION_MS = 24 * 60 * 60 * 1_000;
const STALE_SYNC_MS = 2 * 60 * 1_000;

export const MANUAL_TRADE_OUTBOX_CHANGED_EVENT =
  "traderlink:pwa-manual-trade-outbox-changed";

export type ManualTradeOutboxState =
  | "saved_on_device"
  | "syncing"
  | "needs_review"
  | "saved_to_traderlink";

export type ManualTradeOutboxIssue =
  | "account_changed"
  | "check_details"
  | "possible_duplicate"
  | "sign_in_required"
  | null;

export type ManualTradeSubmission = Readonly<{
  tracker: JournalManualTrackerKind;
  entries: readonly JournalManualTradeEntry[];
  expectedAccountSelectionRef: string;
  idempotencyKey: string;
}>;

export type ManualTradeOutboxRecord = Readonly<{
  version: 1;
  ref: string;
  partitionKey: string;
  offlineScopeRef: string;
  accountSelectionRef: string;
  tracker: JournalManualTrackerKind;
  entries: readonly JournalManualTradeEntry[] | null;
  idempotencyKey: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  state: ManualTradeOutboxState;
  issue: ManualTradeOutboxIssue;
  attempts: number;
  commitAttempted: boolean;
  duplicateResolution: JournalManualTradeOfflineDuplicateResolution;
  result: Readonly<{
    acceptedExecutionCount: number;
    pendingDecisionCount: number;
    savedAtUtc: string;
  }> | null;
}>;

export type ManualTradeSubmitResult = Readonly<{
  acceptedExecutionCount: number;
  affectedDates: readonly string[];
  analyzerQueueOutcome: DailyTradeAnalyzerQueueOutcome | null;
  pendingDecisionCount: number;
}>;

type PreviewResponse = Readonly<{
  status?: string;
  code?: string;
  preview?: JournalManualTradePreview;
}>;

type CommitResponse = Readonly<{
  status?: string;
  code?: string;
  result?: Readonly<{
    acceptedExecutionCount?: number;
    affectedDates?: readonly string[];
    analyzerQueueOutcome?: DailyTradeAnalyzerQueueOutcome | null;
    pendingDecisionCount?: number;
  }>;
}>;

type StatusResponse = Readonly<{
  status?: string;
  code?: string;
  result?: JournalManualTradeCommitStatus;
}>;

export class ManualTradeNetworkError extends Error {
  constructor(
    readonly stage: "status" | "preview" | "commit",
  ) {
    super("TraderLink could not be reached.");
    this.name = "ManualTradeNetworkError";
  }
}

export class ManualTradeNeedsReviewError extends Error {
  constructor(
    readonly code: string | undefined,
  ) {
    super("The saved trade needs your review.");
    this.name = "ManualTradeNeedsReviewError";
  }
}

function partitionKey(
  offlineScopeRef: string,
  accountSelectionRef: string,
): string {
  if (
    !OPAQUE_REF_PATTERN.test(offlineScopeRef) ||
    !OPAQUE_REF_PATTERN.test(accountSelectionRef)
  ) {
    throw new Error("Offline trade scope is unavailable.");
  }
  return `${offlineScopeRef}:${accountSelectionRef}`;
}

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

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.addEventListener("upgradeneeded", () => {
      const database = request.result;
      const store = database.objectStoreNames.contains(OUTBOX_STORE)
        ? request.transaction!.objectStore(OUTBOX_STORE)
        : database.createObjectStore(OUTBOX_STORE, { keyPath: "ref" });
      if (!store.indexNames.contains(PARTITION_INDEX)) {
        store.createIndex(PARTITION_INDEX, "partitionKey", { unique: false });
      }
      const projections = database.objectStoreNames.contains(PROJECTION_STORE)
        ? request.transaction!.objectStore(PROJECTION_STORE)
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
        ? request.transaction!.objectStore(SAVED_VIEW_STORE)
        : database.createObjectStore(SAVED_VIEW_STORE, { keyPath: "ref" });
      if (!savedViews.indexNames.contains(PARTITION_INDEX)) {
        savedViews.createIndex(PARTITION_INDEX, "partitionKey", {
          unique: false,
        });
      }
      if (!savedViews.indexNames.contains("updatedAtUtc")) {
        savedViews.createIndex("updatedAtUtc", "savedAtUtc", { unique: false });
      }
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
    request.addEventListener("blocked", () => {
      reject(new Error("Offline trade storage is being updated in another tab."));
    });
  });
}

function notifyOutboxChanged(): void {
  window.dispatchEvent(new Event(MANUAL_TRADE_OUTBOX_CHANGED_EVENT));
}

function trackerStyle(tracker: JournalManualTrackerKind) {
  return tracker === "swing"
    ? "swing" as const
    : tracker === "quick"
      ? "other" as const
      : "day_trade" as const;
}

function confirmations(preview: JournalManualTradePreview) {
  const values = preview.groups.map((group) => Object.freeze({
    groupRef: group.groupRef,
    relationship: group.allowedRelationships.find(
      (value) => value !== "not_finished",
    ) ?? "not_finished",
    style: trackerStyle(preview.tracker),
    existingPositionRef: group.existingPosition?.positionRef ?? null,
    completeExecutionSetConfirmed: true,
  }));
  if (values.some((value) => value.relationship === "not_finished")) {
    throw new ManualTradeNeedsReviewError(
      "TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT",
    );
  }
  return values;
}

async function responseBody<T>(response: Response): Promise<T | null> {
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
}

async function requestWithNetworkBoundary(
  stage: ManualTradeNetworkError["stage"],
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new ManualTradeNetworkError(stage);
  }
}

function reviewOrNetworkFailure(
  response: Response,
  code: string | undefined,
  stage: ManualTradeNetworkError["stage"],
): never {
  if (response.status >= 500) throw new ManualTradeNetworkError(stage);
  throw new ManualTradeNeedsReviewError(code);
}

export async function submitManualTradeOnline(
  submission: ManualTradeSubmission,
  options: Readonly<{
    checkCommittedFirst?: boolean;
    offlineDuplicateResolution?: JournalManualTradeOfflineDuplicateResolution;
  }> = {},
): Promise<ManualTradeSubmitResult> {
  const headers = {
    "content-type": "application/json",
    [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
  };
  if (options.checkCommittedFirst) {
    const statusResponse = await requestWithNetworkBoundary(
      "status",
      "/api/platform/journal/manual-trades/status",
      {
        body: JSON.stringify(submission),
        credentials: "same-origin",
        headers,
        method: "POST",
      },
    );
    const statusBody = await responseBody<StatusResponse>(statusResponse);
    if (!statusResponse.ok || statusBody?.status !== "ready" || !statusBody.result) {
      reviewOrNetworkFailure(
        statusResponse,
        statusBody?.code,
        "status",
      );
    }
    if (statusBody.result.committed) {
      return Object.freeze({
        acceptedExecutionCount: statusBody.result.acceptedExecutionCount,
        affectedDates: statusBody.result.affectedDates,
        analyzerQueueOutcome: null,
        pendingDecisionCount: statusBody.result.pendingDecisionCount,
      });
    }
  }

  const previewResponse = await requestWithNetworkBoundary(
    "preview",
    "/api/platform/journal/manual-trades/preview",
    {
      body: JSON.stringify({
        entries: submission.entries,
        expectedAccountSelectionRef: submission.expectedAccountSelectionRef,
        tracker: submission.tracker,
      }),
      credentials: "same-origin",
      headers,
      method: "POST",
    },
  );
  const previewBody = await responseBody<PreviewResponse>(previewResponse);
  if (
    !previewResponse.ok ||
    previewBody?.status !== "ready" ||
    !previewBody.preview
  ) {
    reviewOrNetworkFailure(
      previewResponse,
      previewBody?.code,
      "preview",
    );
  }

  const commitResponse = await requestWithNetworkBoundary(
    "commit",
    "/api/platform/journal/manual-trades/commit",
    {
      body: JSON.stringify({
        confirmations: confirmations(previewBody.preview),
        entries: submission.entries,
        expectedAccountSelectionRef: submission.expectedAccountSelectionRef,
        idempotencyKey: submission.idempotencyKey,
        ...(options.offlineDuplicateResolution
          ? {
              offlineSync: {
                duplicateResolution: options.offlineDuplicateResolution,
              },
            }
          : {}),
        previewRef: previewBody.preview.previewRef,
        tracker: submission.tracker,
      }),
      credentials: "same-origin",
      headers,
      method: "POST",
    },
  );
  const commitBody = await responseBody<CommitResponse>(commitResponse);
  if (
    !commitResponse.ok ||
    commitBody?.status !== "ready" ||
    !commitBody.result
  ) {
    reviewOrNetworkFailure(
      commitResponse,
      commitBody?.code,
      "commit",
    );
  }
  return Object.freeze({
    acceptedExecutionCount:
      commitBody.result.acceptedExecutionCount ?? submission.entries.length,
    affectedDates: Object.freeze(commitBody.result.affectedDates ?? []),
    analyzerQueueOutcome: commitBody.result.analyzerQueueOutcome ?? null,
    pendingDecisionCount: commitBody.result.pendingDecisionCount ?? 0,
  });
}

function nowInTimezone(timezone: string): string {
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
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}`;
}

function assertOfflineEntries(entries: readonly JournalManualTradeEntry[]): void {
  if (entries.length < 1 || entries.length > 200) {
    throw new Error("Enter between 1 and 200 executions.");
  }
  for (const entry of entries) {
    if (`${entry.localDate}T${entry.localTime}` > nowInTimezone(entry.sourceTimezone)) {
      throw new Error("Future execution times cannot be saved.");
    }
  }
}

async function putRecord(record: ManualTradeOutboxRecord): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readwrite");
    transaction.objectStore(OUTBOX_STORE).put(record);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
  notifyOutboxChanged();
}

async function getRecord(ref: string): Promise<ManualTradeOutboxRecord | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readonly");
    const value = await requestResult(
      transaction.objectStore(OUTBOX_STORE).get(ref),
    ) as ManualTradeOutboxRecord | undefined;
    await transactionComplete(transaction);
    return value ?? null;
  } finally {
    database.close();
  }
}

export async function queueManualTradeSubmission(input: Readonly<{
  offlineScopeRef: string;
  submission: ManualTradeSubmission;
  commitAttempted?: boolean;
}>): Promise<ManualTradeOutboxRecord> {
  assertOfflineEntries(input.submission.entries);
  const timestamp = new Date().toISOString();
  const record = Object.freeze({
    version: 1 as const,
    ref: crypto.randomUUID(),
    partitionKey: partitionKey(
      input.offlineScopeRef,
      input.submission.expectedAccountSelectionRef,
    ),
    offlineScopeRef: input.offlineScopeRef,
    accountSelectionRef: input.submission.expectedAccountSelectionRef,
    tracker: input.submission.tracker,
    entries: Object.freeze(input.submission.entries.map((entry) => Object.freeze({
      ...entry,
    }))),
    idempotencyKey: input.submission.idempotencyKey,
    createdAtUtc: timestamp,
    updatedAtUtc: timestamp,
    state: "saved_on_device" as const,
    issue: null,
    attempts: 0,
    commitAttempted: input.commitAttempted ?? false,
    duplicateResolution: "review_required" as const,
    result: null,
  });
  await putRecord(record);
  await requestBackgroundSync();
  return record;
}

export async function listManualTradeOutbox(input: Readonly<{
  offlineScopeRef: string;
  accountSelectionRef: string;
}>): Promise<readonly ManualTradeOutboxRecord[]> {
  const key = partitionKey(input.offlineScopeRef, input.accountSelectionRef);
  const database = await openDatabase();
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readonly");
    const records = await requestResult(
      transaction.objectStore(OUTBOX_STORE).index(PARTITION_INDEX).getAll(key),
    ) as ManualTradeOutboxRecord[];
    await transactionComplete(transaction);
    return Object.freeze(records.sort((left, right) =>
      right.createdAtUtc.localeCompare(left.createdAtUtc)));
  } finally {
    database.close();
  }
}

function issueForCode(code: string | undefined): ManualTradeOutboxIssue {
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

async function claimRecord(
  ref: string,
  force: boolean,
  duplicateResolution?: JournalManualTradeOfflineDuplicateResolution,
): Promise<ManualTradeOutboxRecord | null> {
  const current = await getRecord(ref);
  if (!current || !current.entries || !current.idempotencyKey) return null;
  const staleSync = current.state === "syncing" &&
    Date.now() - Date.parse(current.updatedAtUtc) > STALE_SYNC_MS;
  if (
    current.state === "saved_to_traderlink" ||
    (current.state === "needs_review" && !force) ||
    (current.state === "syncing" && !staleSync)
  ) {
    return null;
  }
  const claimed = Object.freeze({
    ...current,
    state: "syncing" as const,
    issue: null,
    attempts: current.attempts + 1,
    duplicateResolution:
      duplicateResolution ?? current.duplicateResolution ?? "review_required",
    updatedAtUtc: new Date().toISOString(),
  });
  await putRecord(claimed);
  return claimed;
}

export async function syncManualTradeOutboxRecord(
  ref: string,
  options: Readonly<{
    force?: boolean;
    duplicateResolution?: JournalManualTradeOfflineDuplicateResolution;
  }> = {},
): Promise<ManualTradeOutboxRecord | null> {
  const claimed = await claimRecord(
    ref,
    options.force ?? false,
    options.duplicateResolution,
  );
  if (!claimed || !claimed.entries || !claimed.idempotencyKey) return null;
  const submission = Object.freeze({
    tracker: claimed.tracker,
    entries: claimed.entries,
    expectedAccountSelectionRef: claimed.accountSelectionRef,
    idempotencyKey: claimed.idempotencyKey,
  });
  try {
    const result = await submitManualTradeOnline(submission, {
      checkCommittedFirst: claimed.commitAttempted,
      offlineDuplicateResolution:
        claimed.duplicateResolution ?? "review_required",
    });
    const savedAtUtc = new Date().toISOString();
    const saved = Object.freeze({
      ...claimed,
      entries: null,
      idempotencyKey: null,
      state: "saved_to_traderlink" as const,
      issue: null,
      commitAttempted: true,
      result: Object.freeze({ ...result, savedAtUtc }),
      updatedAtUtc: savedAtUtc,
    });
    await putRecord(saved);
    return saved;
  } catch (error) {
    const updatedAtUtc = new Date().toISOString();
    if (error instanceof ManualTradeNetworkError) {
      const waiting = Object.freeze({
        ...claimed,
        state: "saved_on_device" as const,
        issue: null,
        commitAttempted:
          claimed.commitAttempted || error.stage === "commit",
        updatedAtUtc,
      });
      await putRecord(waiting);
      return waiting;
    }
    const review = Object.freeze({
      ...claimed,
      state: "needs_review" as const,
      issue: issueForCode(
        error instanceof ManualTradeNeedsReviewError ? error.code : undefined,
      ),
      updatedAtUtc,
    });
    await putRecord(review);
    return review;
  }
}

export async function syncManualTradeOutbox(input: Readonly<{
  offlineScopeRef: string;
  accountSelectionRef: string;
}>): Promise<readonly ManualTradeOutboxRecord[]> {
  const records = [...await listManualTradeOutbox(input)]
    .sort((left, right) => left.createdAtUtc.localeCompare(right.createdAtUtc));
  const results: ManualTradeOutboxRecord[] = [];
  for (const record of records) {
    if (record.state === "saved_to_traderlink" || record.state === "needs_review") {
      continue;
    }
    const result = await syncManualTradeOutboxRecord(record.ref);
    if (result) results.push(result);
  }
  return Object.freeze(results);
}

export async function removeManualTradeOutboxRecord(input: Readonly<{
  ref: string;
  offlineScopeRef: string;
  accountSelectionRef: string;
}>): Promise<void> {
  const current = await getRecord(input.ref);
  if (
    !current ||
    current.partitionKey !== partitionKey(
      input.offlineScopeRef,
      input.accountSelectionRef,
    )
  ) {
    return;
  }
  const database = await openDatabase();
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readwrite");
    transaction.objectStore(OUTBOX_STORE).delete(input.ref);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
  notifyOutboxChanged();
}

export async function pruneManualTradeReceipts(): Promise<void> {
  const database = await openDatabase();
  let changed = false;
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readwrite");
    const store = transaction.objectStore(OUTBOX_STORE);
    const records = await requestResult(store.getAll()) as ManualTradeOutboxRecord[];
    for (const record of records) {
      if (
        record.state === "saved_to_traderlink" &&
        Date.now() - Date.parse(record.updatedAtUtc) > RECEIPT_RETENTION_MS
      ) {
        store.delete(record.ref);
        changed = true;
      }
    }
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
  if (changed) notifyOutboxChanged();
}

export async function requestBackgroundSync(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const syncRegistration = registration as ServiceWorkerRegistration & {
      sync?: { register(tag: string): Promise<void> };
    };
    await syncRegistration.sync?.register("traderlink-trade-outbox");
  } catch {
    // Foreground, resume, reconnect and Sync now remain the required fallbacks.
  }
}

export function manualTradeOutboxIssueMessage(
  issue: ManualTradeOutboxIssue,
): string {
  if (issue === "sign_in_required") {
    return "Sign in again, then try syncing this saved trade.";
  }
  if (issue === "account_changed") {
    return "Choose the Trade Tracker account where this trade was entered, then try again.";
  }
  if (issue === "possible_duplicate") {
    return "These executions match a trade already saved to TraderLink. Nothing was added again.";
  }
  return "Check the execution details and try again. Nothing was added twice.";
}
