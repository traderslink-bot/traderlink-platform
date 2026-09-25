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
  verifyPlatformDatabaseStructureAfterDataChange,
} from "./run-platform-migrations";

export type PlatformDatabaseOpenMode = "runtime" | "initializer";

const runtimeIntegrityCacheKey =
  "__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints" as const;

type RuntimeIntegrityState = {
  version: 3;
  cancelWorker: (() => void) | null;
  dataGeneration: number;
  dirtySinceForeignKeyCheck: boolean;
  dirtySinceQuickCheck: boolean;
  foreignKeyCheckFailed: boolean;
  fingerprint: string;
  generation: number;
  lastForeignKeyCheckStartedAt: number;
  lastQuickCheckStartedAt: number;
  quickCheckFailed: boolean;
  quickCheckInFlight: boolean;
  quickCheckSuccessLogged: boolean;
  quickCheckTimer: ReturnType<typeof setTimeout> | null;
  timerDueAt: number;
  requiresFullVerification: boolean;
  retryPending: boolean;
  retryCount: number;
  retryNotBefore: number;
  structureFingerprint: string;
};

type RuntimeIntegrityProcessState = typeof globalThis & {
  [runtimeIntegrityCacheKey]: Map<string, RuntimeIntegrityState | string> | undefined;
};

export const PLATFORM_RUNTIME_QUICK_CHECK_INTERVAL_MS = 60_000;
export const PLATFORM_RUNTIME_FOREIGN_KEY_CHECK_INTERVAL_MS = 5_000;
const PLATFORM_RUNTIME_QUICK_CHECK_TIMEOUT_MS = 120_000;
const PLATFORM_RUNTIME_RETRY_MIN_MS = 5_000;
const PLATFORM_RUNTIME_RETRY_MAX_MS = 60_000;
const PLATFORM_RUNTIME_QUICK_CHECK_WORKER_SOURCE = String.raw`
const { parentPort, workerData } = require("node:worker_threads");
const Database = require("better-sqlite3");
const { statSync } = require("node:fs");
let database = null;
let message;
let observedFailure = null;
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
  // Both scans observe one read-only snapshot; concurrent writers remain in WAL.
  database.exec("BEGIN");
  const structureBefore = structureFingerprint();
  const foreignKeyRows = database.pragma("foreign_key_check");
  let status = foreignKeyRows.length === 0 ? "ok" : "foreign_key_failed";
  if (status !== "ok") observedFailure = status;
  if (workerData.includeQuickCheck) {
    const rows = database.pragma("quick_check");
    const result = rows.length === 1 ? Object.values(rows[0] || {})[0] : undefined;
    if (result !== "ok") status = observedFailure = "integrity_failed";
  }
  database.exec("COMMIT");
  const structureAfter = structureFingerprint();
  message = {
    dataGeneration: workerData.dataGeneration,
    generation: workerData.generation,
    includeQuickCheck: workerData.includeQuickCheck,
    status,
    structureAfter,
    structureBefore,
  };
} catch (error) {
  const code = String(error && error.code || "");
  const corrupt = /^(SQLITE_CORRUPT|SQLITE_NOTADB)(_|$)/.test(code);
  message = {
    dataGeneration: workerData.dataGeneration,
    generation: workerData.generation,
    status: observedFailure || (corrupt ? "integrity_failed" : "worker_failed"),
    includeQuickCheck: workerData.includeQuickCheck,
  };
} finally {
  if (database) {
    try { database.close(); } catch { /* Worker exit also releases the handle. */ }
  }
}
// Release the connection before allowing the scheduler to start another scan.
parentPort.postMessage(message);
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
  const includeQuickCheck = state.dirtySinceQuickCheck &&
    (state.retryPending ||
      now >= state.lastQuickCheckStartedAt + PLATFORM_RUNTIME_QUICK_CHECK_INTERVAL_MS);
  state.lastForeignKeyCheckStartedAt = now;
  state.dirtySinceForeignKeyCheck = false;
  if (includeQuickCheck) {
    state.lastQuickCheckStartedAt = now;
    state.dirtySinceQuickCheck = false;
  }
  state.quickCheckInFlight = true;
  const dataGeneration = state.dataGeneration;
  const generation = state.generation;
  const expectedStructureFingerprint = state.structureFingerprint;
  const startedAt = now;
  let settled = false;
  const retry = () => {
    if (state.generation !== generation) return;
    // A missing result cannot consume pending validation, even without another write.
    state.dirtySinceForeignKeyCheck = true;
    if (includeQuickCheck) state.dirtySinceQuickCheck = true;
    state.retryPending = true;
    state.retryCount = Math.min(state.retryCount + 1, 5);
    state.retryNotBefore = Date.now() + Math.min(
      PLATFORM_RUNTIME_RETRY_MAX_MS,
      PLATFORM_RUNTIME_RETRY_MIN_MS * 2 ** (state.retryCount - 1),
    );
  };
  const latchCorruption = (error: unknown) => {
    const code = error && typeof error === "object" && "code" in error
      ? String(error.code) : "";
    if (!/^(SQLITE_CORRUPT|SQLITE_NOTADB)(_|$)/.test(code)) return false;
    if (state.generation === generation) state.quickCheckFailed = true;
    return true;
  };
  let worker: Worker;
  try {
    worker = new Worker(PLATFORM_RUNTIME_QUICK_CHECK_WORKER_SOURCE, {
      eval: true,
      workerData: { databasePath, dataGeneration, generation, includeQuickCheck },
    });
  } catch (error) {
    state.quickCheckInFlight = false;
    if (!latchCorruption(error)) retry();
    logPlatformRuntimeQuickCheckOutcome(
      state,
      "worker_construction_failed",
      startedAt,
    );
    schedulePlatformRuntimeQuickCheck(databasePath, state, Date.now());
    return;
  }
  worker.unref();
  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    retry();
    // Do not release the single-flight slot until the worker actually exits.
    void worker.terminate().catch(() => undefined);
    if (state.generation === generation) {
      logPlatformRuntimeQuickCheckOutcome(state, "timeout", startedAt);
    }
  }, PLATFORM_RUNTIME_QUICK_CHECK_TIMEOUT_MS);
  timeout.unref();
  state.cancelWorker = () => {
    settled = true;
    clearTimeout(timeout);
    void worker.terminate().catch(() => undefined);
  };
  worker.once("message", (message: unknown) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    if (state.generation !== generation) return;
    const status = message && typeof message === "object" && "status" in message
      ? (message as { status?: unknown }).status
      : null;
    const workerResult = (message && typeof message === "object" ? message : {}) as {
      dataGeneration?: unknown;
      generation?: unknown;
      includeQuickCheck?: unknown;
      structureAfter?: unknown;
      structureBefore?: unknown;
    };
    if (
      typeof workerResult.dataGeneration !== "number" ||
      typeof workerResult.generation !== "number" ||
      typeof workerResult.includeQuickCheck !== "boolean"
    ) {
      retry();
      logPlatformRuntimeQuickCheckOutcome(state, "worker_failed", startedAt);
    } else if (
      workerResult.dataGeneration !== dataGeneration ||
      workerResult.generation !== generation ||
      workerResult.includeQuickCheck !== includeQuickCheck
    ) {
      state.requiresFullVerification = true;
      logPlatformRuntimeQuickCheckOutcome(state, "worker_failed", startedAt);
    } else if (status === "foreign_key_failed") {
      state.foreignKeyCheckFailed = true;
      logPlatformRuntimeQuickCheckOutcome(state, "foreign_key_failed", startedAt);
    } else if (status === "integrity_failed") {
      // SQLite corruption can be reported during FK-only scans as well.
      state.quickCheckFailed = true;
      logPlatformRuntimeQuickCheckOutcome(state, "integrity_failed", startedAt);
    } else if (
      status !== "ok" ||
      typeof workerResult.structureBefore !== "string" ||
      typeof workerResult.structureAfter !== "string"
    ) {
      retry();
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
    } else {
      state.retryPending = false;
      state.retryCount = 0;
      state.retryNotBefore = 0;
      // Do not clear dirty flags: writes since this snapshot still need scanning.
      logPlatformRuntimeQuickCheckOutcome(state, "ok", startedAt);
    }
  });
  worker.once("error", (error: Error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    if (!latchCorruption(error)) retry();
    void worker.terminate().catch(() => undefined);
    if (state.generation === generation) {
      logPlatformRuntimeQuickCheckOutcome(state, "worker_error", startedAt);
    }
  });
  worker.once("exit", () => {
    if (!settled && state.generation === generation) {
      retry();
      logPlatformRuntimeQuickCheckOutcome(state, "worker_early_exit", startedAt);
    }
    settled = true;
    clearTimeout(timeout);
    // A cancelled old generation still owns this slot until its actual exit.
    state.quickCheckInFlight = false;
    state.cancelWorker = null;
    schedulePlatformRuntimeQuickCheck(databasePath, state, Date.now());
  });
}

function logPlatformRuntimeQuickCheckOutcome(
  state: RuntimeIntegrityState,
  outcome: "database_identity_changed" | "foreign_key_failed" | "integrity_failed" | "ok" |
    "timeout" | "worker_construction_failed" | "worker_early_exit" |
    "worker_error" | "worker_failed",
  startedAt: number,
): void {
  const durationMs = Math.max(0, Date.now() - startedAt);
  try {
    if (outcome === "ok") {
      if (state.quickCheckSuccessLogged) return;
      console.info("TraderLink background SQLite integrity scan completed.", {
        durationMs,
      });
      state.quickCheckSuccessLogged = true;
      return;
    }
    console.warn("TraderLink background SQLite integrity scan requires attention.", {
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
    (!state.dirtySinceForeignKeyCheck && !state.dirtySinceQuickCheck) ||
    state.quickCheckInFlight ||
    state.foreignKeyCheckFailed ||
    state.quickCheckFailed ||
    state.requiresFullVerification
  ) {
    return;
  }
  const dueAt = Math.max(state.retryNotBefore, Math.min(
    state.dirtySinceForeignKeyCheck
      ? state.lastForeignKeyCheckStartedAt + PLATFORM_RUNTIME_FOREIGN_KEY_CHECK_INTERVAL_MS
      : Infinity,
    state.dirtySinceQuickCheck
      ? state.lastQuickCheckStartedAt + PLATFORM_RUNTIME_QUICK_CHECK_INTERVAL_MS
      : Infinity,
  ));
  // Writes may bring an FK deadline forward, but must never postpone a scan.
  if (state.quickCheckTimer && state.timerDueAt <= dueAt) return;
  if (state.quickCheckTimer) clearTimeout(state.quickCheckTimer);
  state.quickCheckTimer = null;
  state.timerDueAt = dueAt;
  const delay = Math.max(0, dueAt - now);
  if (delay === 0) {
    startPlatformRuntimeQuickCheck(databasePath, state, now);
    return;
  }
  state.quickCheckTimer = setTimeout(() => {
    state.quickCheckTimer = null;
    schedulePlatformRuntimeQuickCheck(databasePath, state, Date.now());
  }, delay);
  state.quickCheckTimer.unref();
}

function recordSuccessfulFullRuntimeVerification(
  state: RuntimeIntegrityState,
  fingerprint: string,
  structureFingerprint: string,
): void {
  if (state.quickCheckTimer) clearTimeout(state.quickCheckTimer);
  state.generation += 1;
  state.cancelWorker?.();
  state.dirtySinceForeignKeyCheck = false;
  state.dirtySinceQuickCheck = false;
  state.dataGeneration = 0;
  state.fingerprint = fingerprint;
  state.lastQuickCheckStartedAt = Date.now();
  state.lastForeignKeyCheckStartedAt = state.lastQuickCheckStartedAt;
  state.foreignKeyCheckFailed = false;
  state.quickCheckFailed = false;
  state.quickCheckTimer = null;
  state.timerDueAt = 0;
  state.requiresFullVerification = false;
  state.retryPending = false;
  state.retryCount = 0;
  state.retryNotBefore = 0;
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
  const existing = cached && typeof cached === "object" && cached.version === 3
    ? cached : undefined;
  if (existing?.foreignKeyCheckFailed) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "foreign_key_check",
    });
  }
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
    if (existing.retryPending) {
      schedulePlatformRuntimeQuickCheck(databasePath, existing, Date.now());
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "background_verification_pending",
      });
    }
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
        version: 3,
        cancelWorker: null,
        dataGeneration: 0,
        dirtySinceForeignKeyCheck: false,
        dirtySinceQuickCheck: false,
        foreignKeyCheckFailed: false,
        fingerprint,
        generation: 0,
        lastForeignKeyCheckStartedAt: verifiedAt,
        lastQuickCheckStartedAt: verifiedAt,
        quickCheckFailed: false,
        quickCheckInFlight: false,
        quickCheckSuccessLogged: false,
        quickCheckTimer: null,
        timerDueAt: 0,
        requiresFullVerification: false,
        retryPending: false,
        retryCount: 0,
        retryNotBefore: 0,
        structureFingerprint,
      });
    }
    return;
  }

  verifyPlatformDatabaseStructureAfterDataChange(database);
  existing.dataGeneration += 1;
  existing.dirtySinceForeignKeyCheck = true;
  existing.dirtySinceQuickCheck = true;
  existing.fingerprint = fingerprint;
  existing.structureFingerprint = structureFingerprint;
  schedulePlatformRuntimeQuickCheck(databasePath, existing, Date.now());
  if (existing.retryPending) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "background_verification_pending",
    });
  }
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
