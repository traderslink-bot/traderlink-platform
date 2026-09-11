import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname } from "node:path";
import { Worker } from "node:worker_threads";

import Database from "better-sqlite3";

import {
  resolvePlatformDatabaseConfig,
  validatePlatformDatabasePath,
} from "./platform-database-config";
import { platformFailure } from "./platform-migration-contract";
import {
  verifyCompletedPlatformDatabase,
  verifyPlatformDatabaseAfterDataChange,
} from "./run-platform-migrations";

export type PlatformDatabaseOpenMode = "runtime" | "initializer";

const runtimeIntegrityCacheKey =
  "__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints" as const;

type RuntimeIntegrityState = {
  dataGeneration: number;
  dirtySinceQuickCheck: boolean;
  fingerprint: string;
  generation: number;
  lastQuickCheckStartedAt: number;
  quickCheckFailed: boolean;
  quickCheckInFlight: boolean;
  quickCheckSuccessLogged: boolean;
  quickCheckTimer: ReturnType<typeof setTimeout> | null;
  requiresFullVerification: boolean;
  structureFingerprint: string;
};

type RuntimeIntegrityProcessState = typeof globalThis & {
  [runtimeIntegrityCacheKey]: Map<string, RuntimeIntegrityState | string> | undefined;
};

export const PLATFORM_RUNTIME_QUICK_CHECK_INTERVAL_MS = 60_000;
const PLATFORM_RUNTIME_QUICK_CHECK_TIMEOUT_MS = 30_000;
const PLATFORM_RUNTIME_QUICK_CHECK_WORKER_SOURCE = String.raw`
const { parentPort, workerData } = require("node:worker_threads");
const Database = require("better-sqlite3");
const { statSync } = require("node:fs");
let database = null;
function structureFingerprint() {
  const details = statSync(workerData.databasePath);
  const schemaVersion = database.pragma("schema_version", { simple: true });
  return [details.dev, details.ino, String(schemaVersion)].join(":");
}
try {
  database = new Database(workerData.databasePath, {
    readonly: true,
    fileMustExist: true,
    timeout: 5000,
  });
  database.pragma("query_only = ON");
  database.pragma("busy_timeout = 5000");
  const structureBefore = structureFingerprint();
  const rows = database.pragma("quick_check");
  const result = rows.length === 1 ? Object.values(rows[0] || {})[0] : undefined;
  const structureAfter = structureFingerprint();
  parentPort.postMessage({
    dataGeneration: workerData.dataGeneration,
    generation: workerData.generation,
    status: result === "ok" ? "ok" : "integrity_failed",
    structureAfter,
    structureBefore,
  });
} catch {
  parentPort.postMessage({
    dataGeneration: workerData.dataGeneration,
    generation: workerData.generation,
    status: "worker_failed",
  });
} finally {
  if (database) database.close();
}
`;

export type PlatformDatabasePragmaEvidence = Readonly<{
  foreignKeys: number;
  busyTimeout: number;
  journalMode: string;
  synchronous: number;
}>;

export function readSinglePlatformDatabasePragmaValue(
  database: Database.Database,
  pragma: string,
): unknown {
  const rows = database.pragma(pragma) as readonly Record<string, unknown>[];
  return rows.length === 1 ? Object.values(rows[0] ?? {})[0] : undefined;
}

export function readPlatformDatabasePragmaEvidence(
  database: Database.Database,
): PlatformDatabasePragmaEvidence {
  return Object.freeze({
    foreignKeys: Number(
      readSinglePlatformDatabasePragmaValue(database, "foreign_keys"),
    ),
    busyTimeout: Number(
      readSinglePlatformDatabasePragmaValue(database, "busy_timeout"),
    ),
    journalMode: String(
      readSinglePlatformDatabasePragmaValue(database, "journal_mode"),
    ).toLowerCase(),
    synchronous: Number(
      readSinglePlatformDatabasePragmaValue(database, "synchronous"),
    ),
  });
}

function verifyPlatformDatabaseSessionPragmas(
  evidence: PlatformDatabasePragmaEvidence,
): void {
  if (evidence.foreignKeys !== 1) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      pragma: "foreign_keys",
    });
  }
  if (evidence.busyTimeout !== 5000) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      pragma: "busy_timeout",
    });
  }
}

export function configurePlatformDatabaseConnection(
  database: Database.Database,
  mode: PlatformDatabaseOpenMode,
): void {
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  if (mode === "initializer") {
    database.pragma("journal_mode = WAL");
    database.pragma("synchronous = NORMAL");
  }
  const evidence = readPlatformDatabasePragmaEvidence(database);
  verifyPlatformDatabaseSessionPragmas(evidence);
  if (mode === "initializer") verifyPlatformDatabaseConnectionPragmas(database);
}

export function verifyPlatformDatabasePersistencePragmas(
  database: Database.Database,
): void {
  const evidence = readPlatformDatabasePragmaEvidence(database);
  if (evidence.journalMode !== "wal") {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      pragma: "journal_mode",
    });
  }
  if (evidence.synchronous !== 1) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      pragma: "synchronous",
    });
  }
}

export function verifyPlatformDatabaseConnectionPragmas(
  database: Database.Database,
): PlatformDatabasePragmaEvidence {
  const evidence = readPlatformDatabasePragmaEvidence(database);
  verifyPlatformDatabaseSessionPragmas(evidence);
  verifyPlatformDatabasePersistencePragmas(database);
  return evidence;
}

function readPlatformDatabaseFileFingerprint(path: string): string {
  if (!existsSync(path)) return "absent";
  const details = statSync(path);
  return [details.dev, details.ino, details.size, details.mtimeMs].join(":");
}

export function readPlatformRuntimeDatabaseFingerprint(
  database: Database.Database,
  databasePath: string,
): string {
  const schemaVersion = readSinglePlatformDatabasePragmaValue(
    database,
    "schema_version",
  );
  return [
    readPlatformDatabaseFileFingerprint(databasePath),
    readPlatformDatabaseFileFingerprint(`${databasePath}-wal`),
    String(schemaVersion),
  ].join(":");
}

function readPlatformRuntimeDatabaseStructureFingerprint(
  database: Database.Database,
  databasePath: string,
): string {
  const details = statSync(databasePath);
  return [
    details.dev,
    details.ino,
    String(readSinglePlatformDatabasePragmaValue(database, "schema_version")),
  ].join(":");
}

function readVerifiedRuntimeDatabaseFingerprints(): Map<
  string,
  RuntimeIntegrityState | string
> {
  const processState = globalThis as RuntimeIntegrityProcessState;
  return (processState[runtimeIntegrityCacheKey] ??=
    new Map<string, RuntimeIntegrityState | string>());
}

function startPlatformRuntimeQuickCheck(
  databasePath: string,
  state: RuntimeIntegrityState,
  now: number,
): void {
  state.lastQuickCheckStartedAt = now;
  state.quickCheckInFlight = true;
  state.dirtySinceQuickCheck = false;
  const dataGeneration = state.dataGeneration;
  const generation = state.generation;
  const expectedStructureFingerprint = state.structureFingerprint;
  const startedAt = now;
  let settled = false;
  let worker: Worker;
  try {
    worker = new Worker(PLATFORM_RUNTIME_QUICK_CHECK_WORKER_SOURCE, {
      eval: true,
      workerData: { databasePath, dataGeneration, generation },
    });
  } catch {
    state.quickCheckInFlight = false;
    state.requiresFullVerification = true;
    logPlatformRuntimeQuickCheckOutcome(
      state,
      "worker_construction_failed",
      startedAt,
    );
    return;
  }
  worker.unref();
  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    void worker.terminate();
    if (state.generation !== generation) return;
    state.quickCheckInFlight = false;
    state.requiresFullVerification = true;
    logPlatformRuntimeQuickCheckOutcome(state, "timeout", startedAt);
  }, PLATFORM_RUNTIME_QUICK_CHECK_TIMEOUT_MS);
  timeout.unref();
  worker.once("message", (message: unknown) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    if (state.generation !== generation) return;
    state.quickCheckInFlight = false;
    const status = message && typeof message === "object" && "status" in message
      ? (message as { status?: unknown }).status
      : null;
    const workerResult = message as {
      dataGeneration?: unknown;
      generation?: unknown;
      structureAfter?: unknown;
      structureBefore?: unknown;
    };
    if (
      workerResult.dataGeneration !== dataGeneration ||
      workerResult.generation !== generation
    ) {
      state.requiresFullVerification = true;
      logPlatformRuntimeQuickCheckOutcome(state, "worker_failed", startedAt);
    } else if (status === "worker_failed") {
      state.requiresFullVerification = true;
      logPlatformRuntimeQuickCheckOutcome(state, "worker_failed", startedAt);
    } else if (
      workerResult.structureBefore !== expectedStructureFingerprint ||
      workerResult.structureAfter !== expectedStructureFingerprint
    ) {
      state.requiresFullVerification = true;
      logPlatformRuntimeQuickCheckOutcome(
        state,
        "database_identity_changed",
        startedAt,
      );
    } else if (status === "integrity_failed") {
      state.quickCheckFailed = true;
      logPlatformRuntimeQuickCheckOutcome(
        state,
        "integrity_failed",
        startedAt,
      );
    } else if (status !== "ok") {
      state.requiresFullVerification = true;
      logPlatformRuntimeQuickCheckOutcome(state, "worker_failed", startedAt);
    } else {
      logPlatformRuntimeQuickCheckOutcome(state, "ok", startedAt);
    }
    schedulePlatformRuntimeQuickCheck(databasePath, state, Date.now());
  });
  worker.once("error", () => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    if (state.generation !== generation) return;
    state.quickCheckInFlight = false;
    state.requiresFullVerification = true;
    logPlatformRuntimeQuickCheckOutcome(state, "worker_error", startedAt);
  });
  worker.once("exit", () => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    if (state.generation !== generation) return;
    state.quickCheckInFlight = false;
    state.requiresFullVerification = true;
    logPlatformRuntimeQuickCheckOutcome(state, "worker_early_exit", startedAt);
  });
}

function logPlatformRuntimeQuickCheckOutcome(
  state: RuntimeIntegrityState,
  outcome: "database_identity_changed" | "integrity_failed" | "ok" |
    "timeout" | "worker_construction_failed" | "worker_early_exit" |
    "worker_error" | "worker_failed",
  startedAt: number,
): void {
  const durationMs = Math.max(0, Date.now() - startedAt);
  try {
    if (outcome === "ok") {
      if (state.quickCheckSuccessLogged) return;
      console.info("TraderLink background SQLite quick check completed.", {
        durationMs,
      });
      state.quickCheckSuccessLogged = true;
      return;
    }
    console.warn("TraderLink background SQLite quick check requires attention.", {
      durationMs,
      outcome,
    });
  } catch {
    // Diagnostics must never alter database verification behavior.
  }
}

function schedulePlatformRuntimeQuickCheck(
  databasePath: string,
  state: RuntimeIntegrityState,
  now: number,
): void {
  if (
    !state.dirtySinceQuickCheck ||
    state.quickCheckInFlight ||
    state.quickCheckTimer ||
    state.quickCheckFailed ||
    state.requiresFullVerification
  ) {
    return;
  }
  const delay = Math.max(
    0,
    Math.min(
      PLATFORM_RUNTIME_QUICK_CHECK_INTERVAL_MS,
      state.lastQuickCheckStartedAt + PLATFORM_RUNTIME_QUICK_CHECK_INTERVAL_MS - now,
    ),
  );
  if (delay === 0) {
    startPlatformRuntimeQuickCheck(databasePath, state, now);
    return;
  }
  state.quickCheckTimer = setTimeout(() => {
    state.quickCheckTimer = null;
    if (state.dirtySinceQuickCheck && !state.quickCheckInFlight) {
      startPlatformRuntimeQuickCheck(databasePath, state, Date.now());
    }
  }, delay);
  state.quickCheckTimer.unref();
}

function recordSuccessfulFullRuntimeVerification(
  state: RuntimeIntegrityState,
  fingerprint: string,
  structureFingerprint: string,
): void {
  if (state.quickCheckTimer) clearTimeout(state.quickCheckTimer);
  state.dirtySinceQuickCheck = false;
  state.dataGeneration = 0;
  state.fingerprint = fingerprint;
  state.generation += 1;
  state.lastQuickCheckStartedAt = Date.now();
  state.quickCheckFailed = false;
  state.quickCheckInFlight = false;
  state.quickCheckTimer = null;
  state.requiresFullVerification = false;
  state.structureFingerprint = structureFingerprint;
}

export function verifyPlatformRuntimeDatabaseIntegrity(
  database: Database.Database,
  databasePath: string,
): void {
  const fingerprint = readPlatformRuntimeDatabaseFingerprint(
    database,
    databasePath,
  );
  const structureFingerprint = readPlatformRuntimeDatabaseStructureFingerprint(
    database,
    databasePath,
  );
  const verifiedFingerprints = readVerifiedRuntimeDatabaseFingerprints();
  const cached = verifiedFingerprints.get(databasePath);
  const existing = cached && typeof cached === "object" ? cached : undefined;
  if (existing?.quickCheckFailed) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "quick_check",
    });
  }
  if (existing?.requiresFullVerification) {
    verifyCompletedPlatformDatabase(database);
    recordSuccessfulFullRuntimeVerification(
      existing,
      fingerprint,
      structureFingerprint,
    );
    return;
  }
  if (existing?.fingerprint === fingerprint) {
    return;
  }
  if (!existing || existing.structureFingerprint !== structureFingerprint) {
    verifyCompletedPlatformDatabase(database);
    const verifiedAt = Date.now();
    if (existing) {
      recordSuccessfulFullRuntimeVerification(
        existing,
        fingerprint,
        structureFingerprint,
      );
    } else {
      verifiedFingerprints.set(databasePath, {
        dataGeneration: 0,
        dirtySinceQuickCheck: false,
        fingerprint,
        generation: 0,
        lastQuickCheckStartedAt: verifiedAt,
        quickCheckFailed: false,
        quickCheckInFlight: false,
        quickCheckSuccessLogged: false,
        quickCheckTimer: null,
        requiresFullVerification: false,
        structureFingerprint,
      });
    }
    return;
  }

  verifyPlatformDatabaseAfterDataChange(database);
  existing.dataGeneration += 1;
  existing.dirtySinceQuickCheck = true;
  existing.fingerprint = fingerprint;
  existing.structureFingerprint = structureFingerprint;
  schedulePlatformRuntimeQuickCheck(databasePath, existing, Date.now());
}

export function openPlatformDatabase(
  options: Readonly<{
    mode: PlatformDatabaseOpenMode;
    databasePath?: string;
    environment?: NodeJS.ProcessEnv;
    forbiddenRepositoryRoots?: readonly string[];
  }>,
): Database.Database {
  const databasePath = options.databasePath
    ? validatePlatformDatabasePath(options.databasePath, options)
    : resolvePlatformDatabaseConfig(options).databasePath;
  const exists = existsSync(databasePath);
  if (options.mode === "runtime" && !exists) {
    platformFailure("TRADERLINK_PLATFORM_DATABASE_MISSING");
  }
  if (options.mode === "runtime" && exists && statSync(databasePath).size === 0) {
    platformFailure("TRADERLINK_PLATFORM_DATABASE_EMPTY");
  }
  if (options.mode === "initializer" && !existsSync(dirname(databasePath))) {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  let database: Database.Database | null = null;
  try {
    database = new Database(databasePath, {
      fileMustExist: options.mode === "runtime",
      timeout: 5000,
    });
    configurePlatformDatabaseConnection(database, options.mode);
    if (options.mode === "runtime") {
      verifyPlatformRuntimeDatabaseIntegrity(database, databasePath);
      verifyPlatformDatabaseConnectionPragmas(database);
    }
    return database;
  } catch (error) {
    database?.close();
    throw error;
  }
}

export function withPlatformDatabase<T>(
  options: Parameters<typeof openPlatformDatabase>[0],
  operation: (database: Database.Database) => T,
): T {
  const database = openPlatformDatabase(options);
  try {
    return operation(database);
  } finally {
    database.close();
  }
}
