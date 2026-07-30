import "server-only";

import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

import { normalizeAnalyticsLabQuery } from "./lab-query-validation";
import type {
  AnalyticsLabQuery,
  AnalyticsLabSavedView,
} from "./lab-types";
import type { AnalyticsLabRuntime } from "./lab-runtime";

const STORE_VERSION = "ti_v3_analytics_lab_saved_views_v1";
const MAXIMUM_VIEWS = 100;

type SavedViewStore = {
  schemaVersion: typeof STORE_VERSION;
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
  views: AnalyticsLabSavedView[];
};

let writeQueue: Promise<void> = Promise.resolve();

function storePath(runtime: AnalyticsLabRuntime): string {
  return join(
    dirname(runtime.authorityDirectory),
    "trader-intelligence-v3-analytics-lab",
    `${runtime.canonicalOwnerKey}.${runtime.canonicalAccountKey}.saved-views.json`,
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString() === value
  );
}

function parseSavedView(value: unknown): AnalyticsLabSavedView {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Saved view is invalid.");
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const expected = ["createdAt", "id", "name", "query", "updatedAt"];
  if (
    keys.length !== expected.length ||
    keys.some((key, index) => key !== expected[index]) ||
    typeof record.id !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      record.id,
    ) ||
    typeof record.name !== "string" ||
    record.name.trim() !== record.name ||
    record.name.length === 0 ||
    record.name.length > 80 ||
    /[\u0000-\u001f\u007f]/.test(record.name) ||
    !isIsoTimestamp(record.createdAt) ||
    !isIsoTimestamp(record.updatedAt) ||
    record.updatedAt < record.createdAt
  ) {
    throw new Error("Saved view is invalid.");
  }
  return {
    id: record.id,
    name: record.name,
    query: normalizeAnalyticsLabQuery(record.query),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function readStore(runtime: AnalyticsLabRuntime): Promise<SavedViewStore> {
  const path = storePath(runtime);
  try {
    const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Saved-view store is invalid.");
    }
    const record = parsed as Record<string, unknown>;
    if (
      record.schemaVersion !== STORE_VERSION ||
      record.canonicalOwnerKey !== runtime.canonicalOwnerKey ||
      record.canonicalAccountKey !== runtime.canonicalAccountKey ||
      !Array.isArray(record.views) ||
      record.views.length > MAXIMUM_VIEWS
    ) {
      throw new Error("Saved-view store is invalid.");
    }
    return {
      schemaVersion: STORE_VERSION,
      canonicalOwnerKey: runtime.canonicalOwnerKey,
      canonicalAccountKey: runtime.canonicalAccountKey,
      views: record.views.map(parseSavedView),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return {
        schemaVersion: STORE_VERSION,
        canonicalOwnerKey: runtime.canonicalOwnerKey,
        canonicalAccountKey: runtime.canonicalAccountKey,
        views: [],
      };
    }
    throw error;
  }
}

async function writeStore(
  runtime: AnalyticsLabRuntime,
  store: SavedViewStore,
): Promise<void> {
  const path = storePath(runtime);
  const directory = dirname(path);
  const temporaryPath = join(
    directory,
    `.${randomUUID()}.saved-views.tmp`,
  );
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporaryPath, `${JSON.stringify(store)}\n`, {
      encoding: "utf8",
      mode: 0o600,
      flush: true,
    });
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function serializeWrite<T>(operation: () => Promise<T>): Promise<T> {
  const previous = writeQueue;
  let release: () => void = () => undefined;
  writeQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

export async function listAnalyticsLabSavedViews(
  runtime: AnalyticsLabRuntime,
): Promise<AnalyticsLabSavedView[]> {
  const store = await readStore(runtime);
  return [...store.views].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export async function persistAnalyticsLabSavedView(
  runtime: AnalyticsLabRuntime,
  name: string,
  query: AnalyticsLabQuery,
): Promise<AnalyticsLabSavedView> {
  return serializeWrite(async () => {
    const normalizedName = name.trim().replace(/\s+/g, " ");
    if (
      normalizedName.length === 0 ||
      normalizedName.length > 80 ||
      /[\u0000-\u001f\u007f]/.test(normalizedName)
    ) {
      throw new Error("The saved-view name is invalid.");
    }
    const normalizedQuery = normalizeAnalyticsLabQuery(query);
    const store = await readStore(runtime);
    if (store.views.length >= MAXIMUM_VIEWS) {
      throw new Error("The saved-view limit has been reached.");
    }
    const now = new Date().toISOString();
    const view: AnalyticsLabSavedView = {
      id: randomUUID(),
      name: normalizedName,
      query: normalizedQuery,
      createdAt: now,
      updatedAt: now,
    };
    await writeStore(runtime, {
      ...store,
      views: [...store.views, view],
    });
    return view;
  });
}

export async function removeAnalyticsLabSavedView(
  runtime: AnalyticsLabRuntime,
  id: string,
): Promise<boolean> {
  return serializeWrite(async () => {
    const store = await readStore(runtime);
    const views = store.views.filter((view) => view.id !== id);
    if (views.length === store.views.length) {
      return false;
    }
    await writeStore(runtime, { ...store, views });
    return true;
  });
}


