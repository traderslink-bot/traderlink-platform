import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import { openPlatformDatabase } from "./open-platform-database";
import {
  calculatePlatformSchemaDigest,
  calculatePlatformSchemaDigestFromRows,
  readPlatformSchemaRows,
} from "./platform-schema-digest";
import { runPlatformMigrations, verifyCompletedPlatformDatabase } from "./run-platform-migrations";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function initializedDatabase(): Database.Database {
  const root = mkdtempSync(join(tmpdir(), "traderlink-schema-digest-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "digest.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database);
  return database;
}

describe("platform schema digest", () => {
  it("is stable for the exact ordered schema serialization and line endings", () => {
    const database = initializedDatabase();
    try {
      const rows = readPlatformSchemaRows(database);
      expect(calculatePlatformSchemaDigest(database)).toBe(
        calculatePlatformSchemaDigestFromRows(rows),
      );
      expect(
        calculatePlatformSchemaDigestFromRows(
          rows.map((row) => ({ ...row, sql: row.sql.replace(/\n/gu, "\r\n") })),
        ),
      ).toBe(calculatePlatformSchemaDigest(database));
    } finally {
      database.close();
    }
  });

  it.each([
    ["altered table", "ALTER TABLE platform_users ADD COLUMN unexpected TEXT"],
    ["removed explicit index", "DROP INDEX platform_memberships_active_user"],
    [
      "changed explicit index",
      `DROP INDEX platform_memberships_active_user;
CREATE INDEX platform_memberships_active_user
  ON platform_workspace_memberships(workspace_id, user_id)
  WHERE status = 'active'`,
    ],
    ["unexpected view", "CREATE VIEW unexpected_view AS SELECT user_id FROM platform_users"],
    [
      "unexpected trigger",
      "CREATE TRIGGER unexpected_trigger AFTER UPDATE ON platform_users BEGIN SELECT 1; END",
    ],
  ])("rejects %s drift", (_name, statement) => {
    const database = initializedDatabase();
    try {
      database.exec(statement);
      expect(() => verifyCompletedPlatformDatabase(database)).toThrowError(
        "TRADERLINK_PLATFORM_SCHEMA_MISMATCH",
      );
    } finally {
      database.close();
    }
  });

  it("uses the unmanaged-table safeguard for an unexpected application table", () => {
    const database = initializedDatabase();
    try {
      database.exec("CREATE TABLE unexpected_table (id TEXT) STRICT");
      expect(() => verifyCompletedPlatformDatabase(database)).toThrowError(
        "TRADERLINK_PLATFORM_UNMANAGED_SCHEMA",
      );
    } finally {
      database.close();
    }
  });
});
