import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

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
  foreignKeySuccessLogs: number;
  quickCheckSuccessLogs: number;
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
const PLATFORM_RUNTIME_CHILD_KILL_GRACE_MS = 5_000;
const PLATFORM_RUNTIME_RETRY_MIN_MS = 5_000;
const PLATFORM_RUNTIME_RETRY_MAX_MS = 60_000;
const PLATFORM_RUNTIME_QUICK_CHECK_WORKER_SOURCE = String.raw`
const { statSync } = require("node:fs");
process.once("message", (workerData) => {
let database = null;
let message;
let observedFailure = null;
let foreignKeyDurationMs = 0;
let quickCheckDurationMs = 0;
const identity = {
  dataGeneration: workerData.dataGeneration,
  generation: workerData.generation,
  includeQuickCheck: workerData.includeQuickCheck,
};
function structureFingerprint() {
  const details = statSync(workerData.databasePath);
  const schemaVersion = database.pragma("schema_version", { simple: true });
  return [details.dev, details.ino, String(schemaVersion)].join(":");
}
try {
  const Database = require("better-sqlite3");
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
  const foreignKeyStartedAt = Date.now();
  const foreignKeyRows = database.pragma("foreign_key_check");
  foreignKeyDurationMs = Date.now() - foreignKeyStartedAt;
  let status = foreignKeyRows.length === 0 ? "ok" : "foreign_key_failed";
  if (status !== "ok") observedFailure = status;
  if (status === "ok" && workerData.includeQuickCheck) {
    const quickCheckStartedAt = Date.now();
    process.send({ ...identity, kind: "foreign_key_complete", structureBefore,
      foreignKeyDurationMs, quickCheckStartedAt });
    const rows = database.pragma("quick_check");
    quickCheckDurationMs = Date.now() - quickCheckStartedAt;
    const result = rows.length === 1 ? Object.values(rows[0] || {})[0] : undefined;
    if (result !== "ok") status = observedFailure = "integrity_failed";
  }
  database.exec("COMMIT");
  const structureAfter = structureFingerprint();
  message = {
    ...identity,
    status,
    structureAfter,
    structureBefore,
  };
} catch (error) {
  const code = String(error && error.code || "");
  const corrupt = /^(SQLITE_CORRUPT|SQLITE_NOTADB)(_|$)/.test(code);
  message = {
    ...identity,
    status: observedFailure || (corrupt ? "integrity_failed" : "worker_failed"),
  };
} finally {
  if (database) {
    try { database.close(); } catch { /* Child exit also releases the handle. */ }
  }
}
// IPC is flushed before disconnect. The parent also requires actual process exit.
process.send({ ...message, kind: "result", foreignKeyDurationMs, quickCheckDurationMs },
  () => process.disconnect());
});
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
  let exited = false;
  let receivedResult = false;
  let completeResult = false;
  let foreignKeyComplete = false;
  let overdue = false;
  let phase: "foreign_keys" | "quick_check" | "exit" = "foreign_keys";
  let hardDueAt = startedAt + PLATFORM_RUNTIME_QUICK_CHECK_TIMEOUT_MS;
  let foreignKeyDurationMs = 0;
  let quickCheckDurationMs = 0;
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  let killTimer: ReturnType<typeof setTimeout> | undefined;
  let exitTimer: ReturnType<typeof setTimeout> | undefined;
  const log = (outcome: Parameters<typeof logPlatformRuntimeQuickCheckOutcome>[1]) =>
    logPlatformRuntimeQuickCheckOutcome(state, outcome, startedAt, includeQuickCheck, {
      phase, foreignKeyDurationMs, quickCheckDurationMs, overdue,
    });
  const clearScanTimers = () => {
    clearTimeout(deadlineTimer);
    clearTimeout(readinessTimer);
  };
  const retry = () => {
    if (state.generation !== generation) return;
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
  let child: ChildProcess;
  try {
    child = spawn(process.execPath, ["-e", PLATFORM_RUNTIME_QUICK_CHECK_WORKER_SOURCE], {
      stdio: ["ignore", "ignore", "ignore", "ipc"],
      windowsHide: true,
      // Do not inherit application preload hooks into an isolated native reader.
      env: { ...process.env, NODE_OPTIONS: "" },
    });
  } catch (error) {
    state.quickCheckInFlight = false;
    if (!latchCorruption(error)) retry();
    log("worker_construction_failed");
    schedulePlatformRuntimeQuickCheck(databasePath, state, Date.now());
    return;
  }
  const terminate = () => {
    if (exited || killTimer) return;
    // A signal request is never evidence of exit or permission to overlap readers.
    try { child.kill("SIGTERM"); } catch { /* Escalate once below. */ }
    killTimer = setTimeout(() => {
      if (exited) return;
      try { child.kill("SIGKILL"); } catch { /* Keep the slot and fail closed. */ }
      exitTimer = setTimeout(() => {
        if (!exited) log("worker_exit_pending");
      }, PLATFORM_RUNTIME_CHILD_KILL_GRACE_MS);
      exitTimer.unref();
    }, PLATFORM_RUNTIME_CHILD_KILL_GRACE_MS);
    killTimer.unref();
  };
  const fail = (outcome: Parameters<typeof logPlatformRuntimeQuickCheckOutcome>[1]) => {
    if (settled) return;
    settled = true;
    clearScanTimers();
    retry();
    log(outcome);
    terminate();
  };
  const hardTimeout = () => fail("timeout");
  const armDeadline = () => {
    clearTimeout(deadlineTimer);
    deadlineTimer = setTimeout(hardTimeout, Math.max(0, hardDueAt - Date.now()));
    deadlineTimer.unref();
  };
  // Readiness still fails at the original 120s boundary. Only execution cleanup
  // has a bounded second phase; overdue work never counts as a successful check.
  const readinessTimer = setTimeout(() => {
    if (settled || state.generation !== generation) return;
    overdue = true;
    state.retryPending = true;
    log("verification_overdue");
  }, PLATFORM_RUNTIME_QUICK_CHECK_TIMEOUT_MS);
  readinessTimer.unref();
  armDeadline();
  state.cancelWorker = () => {
    settled = true;
    clearScanTimers();
    terminate();
  };
  child.on("message", (message: unknown) => {
    if (exited || state.generation !== generation) return;
    const result = (message && typeof message === "object" ? message : {}) as {
      kind?: unknown;
      status?: unknown;
      dataGeneration?: unknown;
      generation?: unknown;
      includeQuickCheck?: unknown;
      structureAfter?: unknown;
      structureBefore?: unknown;
      foreignKeyDurationMs?: unknown;
      quickCheckDurationMs?: unknown;
      quickCheckStartedAt?: unknown;
    };
    // Never lose an actual failure queued around timeout/cancellation. Only the
    // exact child identity may latch it; a stale generation cannot affect state.
    if (result.kind === "result" && result.dataGeneration === dataGeneration &&
      result.generation === generation && result.includeQuickCheck === includeQuickCheck &&
      (result.status === "foreign_key_failed" || result.status === "integrity_failed")) {
      if (result.status === "foreign_key_failed") state.foreignKeyCheckFailed = true;
      else state.quickCheckFailed = true;
      settled = true;
      clearScanTimers();
      log(result.status);
      terminate();
      return;
    }
    if (settled) return;
    // Timers can be delayed by other synchronous application work.
    if (Date.now() >= hardDueAt) {
      hardTimeout();
      return;
    }
    if (
      typeof result.dataGeneration !== "number" ||
      typeof result.generation !== "number" ||
      typeof result.includeQuickCheck !== "boolean"
    ) {
      fail("worker_failed");
      return;
    }
    if (
      result.dataGeneration !== dataGeneration ||
      result.generation !== generation ||
      result.includeQuickCheck !== includeQuickCheck
    ) {
      state.requiresFullVerification = true;
      fail("worker_failed");
      return;
    }
    if (result.kind === "foreign_key_complete") {
      if (!includeQuickCheck || foreignKeyComplete || receivedResult ||
        typeof result.structureBefore !== "string" ||
        typeof result.quickCheckStartedAt !== "number" ||
        !Number.isFinite(result.quickCheckStartedAt) ||
        result.quickCheckStartedAt < startedAt ||
        result.quickCheckStartedAt > Date.now()) {
        fail("worker_failed");
        return;
      }
      if (result.structureBefore !== expectedStructureFingerprint) {
        state.requiresFullVerification = true;
        fail("database_identity_changed");
        return;
      }
      foreignKeyComplete = true;
      phase = "quick_check";
      foreignKeyDurationMs = safeScanDuration(result.foreignKeyDurationMs);
      // Only this single validated transition can grant the second phase budget.
      hardDueAt = Math.min(
        result.quickCheckStartedAt + PLATFORM_RUNTIME_QUICK_CHECK_TIMEOUT_MS,
        startedAt + 2 * PLATFORM_RUNTIME_QUICK_CHECK_TIMEOUT_MS,
      );
      armDeadline();
      return;
    }
    if (result.kind !== "result" || receivedResult) {
      fail("worker_failed");
      return;
    }
    receivedResult = true;
    foreignKeyDurationMs = safeScanDuration(result.foreignKeyDurationMs);
    quickCheckDurationMs = safeScanDuration(result.quickCheckDurationMs);
    if (result.status !== "ok" ||
      (includeQuickCheck && !foreignKeyComplete) ||
      typeof result.structureBefore !== "string" ||
      typeof result.structureAfter !== "string") {
      fail("worker_failed");
      return;
    }
    if (result.structureBefore !== expectedStructureFingerprint ||
      result.structureAfter !== expectedStructureFingerprint) {
      state.requiresFullVerification = true;
      fail("database_identity_changed");
      return;
    }
    completeResult = true;
    phase = "exit";
    // Even an apparently complete result cannot reopen until the process exits.
  });
  child.on("error", (error: Error) => {
    if (settled) return;
    if (latchCorruption(error)) {
      settled = true;
      clearScanTimers();
      log("worker_error");
      terminate();
    } else {
      fail("worker_error");
    }
  });
  const onExit = (code: number | null) => {
    if (exited) return;
    exited = true;
    clearScanTimers();
    clearTimeout(killTimer);
    clearTimeout(exitTimer);
    if (!settled && state.generation === generation) {
      if (completeResult && code === 0 && Date.now() < hardDueAt &&
        !state.foreignKeyCheckFailed && !state.quickCheckFailed &&
        !state.requiresFullVerification) {
        state.retryPending = false;
        state.retryCount = 0;
        state.retryNotBefore = 0;
        // Never clear dirty flags from writes after the captured snapshot.
        log("ok");
      } else {
        retry();
        log("worker_early_exit");
      }
    }
    settled = true;
    state.quickCheckInFlight = false;
    state.cancelWorker = null;
    schedulePlatformRuntimeQuickCheck(databasePath, state, Date.now());
  };
  child.once("exit", onExit);
  // spawn errors may emit close without ever creating a process or emitting exit.
  child.once("close", (code: number | null) => {
    if (!exited) onExit(code);
  });
  try {
    child.send({ databasePath, dataGeneration, generation, includeQuickCheck },
      (error) => { if (error) fail("worker_error"); });
  } catch {
    fail("worker_error");
  }
  child.unref();
  child.channel?.unref();
}

function safeScanDuration(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function logPlatformRuntimeQuickCheckOutcome(
  state: RuntimeIntegrityState,
  outcome: "database_identity_changed" | "foreign_key_failed" | "integrity_failed" | "ok" |
    "timeout" | "worker_construction_failed" | "worker_early_exit" |
    "worker_error" | "worker_failed" | "verification_overdue" | "worker_exit_pending",
  startedAt: number,
  includeQuickCheck = false,
  phases?: Readonly<{
    phase: "foreign_keys" | "quick_check" | "exit";
    foreignKeyDurationMs: number;
    quickCheckDurationMs: number;
    overdue: boolean;
  }>,
): void {
  const durationMs = Math.max(0, Date.now() - startedAt);
  try {
    if (outcome === "ok") {
      const counter = includeQuickCheck ? "quickCheckSuccessLogs" : "foreignKeySuccessLogs";
      if (state[counter] >= 2 && !phases?.overdue) return;
      console.info("TraderLink background SQLite integrity scan completed.", {
        durationMs,
        includeQuickCheck,
        ...phases,
      });
      state[counter] += 1;
      return;
    }
    console.warn("TraderLink background SQLite integrity scan requires attention.", {
      durationMs,
      outcome,
      includeQuickCheck,
      ...phases,
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
        foreignKeySuccessLogs: 0,
        quickCheckSuccessLogs: 0,
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
