import Database from "better-sqlite3";

import {
  resolvePlatformDatabaseConfig,
  validatePlatformDatabasePath,
} from "./platform-database-config";
import {
  verifyPlatformDatabaseConnectionPragmas,
  verifyPlatformRuntimeDatabaseIntegrity,
} from "./open-platform-database";

export function openReadonlyPlatformDatabase(
  options: Readonly<{
    databasePath?: string;
    environment?: NodeJS.ProcessEnv;
    forbiddenRepositoryRoots?: readonly string[];
  }> = {},
): Database.Database {
  const databasePath = options.databasePath
    ? validatePlatformDatabasePath(options.databasePath, options)
    : resolvePlatformDatabaseConfig(options).databasePath;
  let database: Database.Database | null = null;
  try {
    database = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
      timeout: 5_000,
    });
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");
    database.pragma("query_only = ON");
    verifyPlatformRuntimeDatabaseIntegrity(database, databasePath);
    verifyPlatformDatabaseConnectionPragmas(database);
    return database;
  } catch (error) {
    database?.close();
    throw error;
  }
}

export function withReadonlyPlatformDatabase<T>(
  options: Parameters<typeof openReadonlyPlatformDatabase>[0],
  operation: (database: Database.Database) => T,
): T {
  const database = openReadonlyPlatformDatabase(options);
  try {
    return operation(database);
  } finally {
    database.close();
  }
}
