import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { readAppliedPlatformMigrations } from "@/src/modules/platform/server/database/platform-migration-registry";
import { verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";

type CountRow = Readonly<{ count: number }>;
type Baseline = Readonly<{ protected_lesson_slugs?: readonly string[] }>;
type Aliases = Readonly<{ aliases?: readonly unknown[] }>;

function count(database: Database.Database, tableName: string): number {
  return database.prepare<[], CountRow>(`SELECT COUNT(*) AS count FROM ${tableName}`)
    .get()?.count ?? -1;
}

function fail(check: string): never {
  throw new Error(`TRADERLINK_ACADEMY_PROGRESS_VERIFICATION_FAILED:${check}`);
}

function main(): void {
  const databasePath = resolvePlatformDatabaseConfig().databasePath;
  const before = Object.freeze({
    sizeBytes: statSync(databasePath).size,
    sha256: createHash("sha256").update(readFileSync(databasePath)).digest("hex"),
  });
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
    timeout: 5_000,
  });
  let evidence: Readonly<Record<string, unknown>>;
  try {
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");
    database.pragma("query_only = ON");
    verifyCompletedPlatformDatabase(database);
    const migrations = readAppliedPlatformMigrations(database);
    const counts = Object.freeze({
      platformUsers: count(database, "platform_users"),
      platformAuthIdentities: count(database, "platform_auth_identities"),
      platformAuthSessions: count(database, "platform_auth_sessions"),
      academyCompletions: count(database, "academy_lesson_completions"),
      academyEvents: count(database, "academy_lesson_completion_events"),
    });
    const backfill = database.prepare<[], CountRow>(`SELECT COUNT(*) AS count
FROM platform_users user
JOIN platform_auth_identities identity
  ON identity.user_id = user.user_id
  AND identity.auth_provider = user.auth_provider
  AND identity.auth_subject = user.auth_subject
WHERE user.status = 'active' AND identity.status = 'active'
  AND user.auth_provider = 'development_local'`).get()?.count ?? -1;
    if (
      migrations.length !== platformMigrationManifest.length ||
      !migrations.some(
        (migration) => migration.migration_id === "0013_academy_progress",
      ) ||
      counts.platformUsers !== 1 ||
      counts.platformAuthIdentities !== 1 ||
      backfill !== 1 ||
      counts.platformAuthSessions < 0 ||
      counts.academyCompletions < 0 ||
      counts.academyEvents < counts.academyCompletions ||
      (database.pragma("foreign_key_check") as unknown[]).length !== 0 ||
      database.pragma("quick_check", { simple: true }) !== "ok"
    ) {
      fail("database_boundary");
    }

    const baseline = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "academy/_data/progress-slug-baseline.json"),
        "utf8",
      ),
    ) as Baseline;
    const aliases = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "academy/_data/progress-slug-aliases.json"),
        "utf8",
      ),
    ) as Aliases;
    const protectedSlugs = baseline.protected_lesson_slugs ?? [];
    const aliasRows = aliases.aliases ?? [];
    if (
      protectedSlugs.length !== 107 ||
      new Set(protectedSlugs).size !== protectedSlugs.length ||
      aliasRows.length !== 0
    ) {
      fail("protected_slug_boundary");
    }
    evidence = Object.freeze({
      status: "ok",
      identifiersRedacted: true,
      migrationCount: migrations.length,
      latestMigration: migrations.at(-1)?.migration_id,
      protectedSlugCount: protectedSlugs.length,
      aliasCount: aliasRows.length,
      counts,
    });
  } finally {
    database.close();
  }
  const after = Object.freeze({
    sizeBytes: statSync(databasePath).size,
    sha256: createHash("sha256").update(readFileSync(databasePath)).digest("hex"),
  });
  if (before.sizeBytes !== after.sizeBytes || before.sha256 !== after.sha256) {
    fail("database_changed");
  }
  process.stdout.write(`${JSON.stringify({
    ...evidence,
    database: { ...after, state: "unchanged" },
  })}\n`);
}

main();
