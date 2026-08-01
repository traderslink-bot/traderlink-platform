import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";

import {
  resolvePlatformDatabaseConfig,
  validatePlatformDatabasePath,
} from "./platform-database-config";
import { platformFailure } from "./platform-migration-contract";
import { verifyCompletedPlatformDatabase } from "./run-platform-migrations";

export type PlatformDatabaseOpenMode = "runtime" | "initializer";

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
      verifyCompletedPlatformDatabase(database);
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
