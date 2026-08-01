import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { initializeTraderLinkPlatformDatabase } from "@/src/scripts/initialize-traderlink-platform-database";
import { verifyTraderLinkPlatformDatabase } from "@/src/scripts/verify-traderlink-platform-database";
import { openPlatformDatabase } from "./open-platform-database";
import { platformMigrationManifest } from "./platform-migration-manifest";
import { runPlatformMigrations } from "./run-platform-migrations";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function pathFor(name: string): string {
  const root = mkdtempSync(join(tmpdir(), "traderlink-initialization-modes-"));
  roots.push(root);
  return join(root, `${name}.sqlite`);
}

describe("runtime and explicit initializer modes", () => {
  it("runtime rejects an absent path without creating it", () => {
    const path = pathFor("absent");
    expect(() =>
      openPlatformDatabase({
        mode: "runtime",
        databasePath: path,
        forbiddenRepositoryRoots: [],
      }),
    ).toThrowError("TRADERLINK_PLATFORM_DATABASE_MISSING");
    expect(existsSync(path)).toBe(false);
  });

  it("runtime rejects zero-byte, unmanaged, partial, and tampered targets", () => {
    const zero = pathFor("zero");
    writeFileSync(zero, "");
    expect(() =>
      openPlatformDatabase({
        mode: "runtime",
        databasePath: zero,
        forbiddenRepositoryRoots: [],
      }),
    ).toThrowError("TRADERLINK_PLATFORM_DATABASE_EMPTY");

    const unmanaged = pathFor("unmanaged");
    const unmanagedDb = new Database(unmanaged);
    unmanagedDb.exec("CREATE TABLE unmanaged (id TEXT) STRICT");
    unmanagedDb.close();
    expect(() =>
      openPlatformDatabase({
        mode: "runtime",
        databasePath: unmanaged,
        forbiddenRepositoryRoots: [],
      }),
    ).toThrowError("TRADERLINK_PLATFORM_UNMANAGED_SCHEMA");

    const partial = pathFor("partial");
    const partialDb = openPlatformDatabase({
      mode: "initializer",
      databasePath: partial,
      forbiddenRepositoryRoots: [],
    });
    runPlatformMigrations(partialDb, { manifest: [platformMigrationManifest[0]] });
    partialDb.close();
    expect(() =>
      openPlatformDatabase({
        mode: "runtime",
        databasePath: partial,
        forbiddenRepositoryRoots: [],
      }),
    ).toThrowError("TRADERLINK_PLATFORM_MIGRATIONS_PENDING");

    const tampered = pathFor("tampered");
    initializeTraderLinkPlatformDatabase({
      databasePath: tampered,
      forbiddenRepositoryRoots: [],
    });
    const tamperDb = new Database(tampered);
    tamperDb.exec("DROP INDEX journal_account_source_identities_account");
    tamperDb.close();
    expect(() =>
      openPlatformDatabase({
        mode: "runtime",
        databasePath: tampered,
        forbiddenRepositoryRoots: [],
      }),
    ).toThrowError("TRADERLINK_PLATFORM_SCHEMA_MISMATCH");
  });

  it("the explicit initializer alone creates and idempotently reopens a complete target", () => {
    const path = pathFor("complete");
    expect(existsSync(path)).toBe(false);
    expect(
      initializeTraderLinkPlatformDatabase({
        databasePath: path,
        forbiddenRepositoryRoots: [],
      }).appliedThisRun,
    ).toHaveLength(2);
    expect(
      initializeTraderLinkPlatformDatabase({
        databasePath: path,
        forbiddenRepositoryRoots: [],
      }).appliedThisRun,
    ).toEqual([]);
    const runtime = openPlatformDatabase({
      mode: "runtime",
      databasePath: path,
      forbiddenRepositoryRoots: [],
    });
    runtime.close();
  });

  it("the explicit initializer accepts existing zero-byte and zero-table targets", () => {
    const zeroByte = pathFor("initializer-zero-byte");
    writeFileSync(zeroByte, "");
    expect(
      initializeTraderLinkPlatformDatabase({
        databasePath: zeroByte,
        forbiddenRepositoryRoots: [],
      }).appliedThisRun,
    ).toHaveLength(2);

    const zeroTable = pathFor("initializer-zero-table");
    const zeroTableDatabase = new Database(zeroTable);
    zeroTableDatabase.exec("VACUUM");
    zeroTableDatabase.close();
    expect(
      initializeTraderLinkPlatformDatabase({
        databasePath: zeroTable,
        forbiddenRepositoryRoots: [],
      }).appliedThisRun,
    ).toHaveLength(2);
  });

  it("the explicit initializer rejects an unmanaged target without adopting it", () => {
    const path = pathFor("initializer-unmanaged");
    const unmanaged = new Database(path);
    unmanaged.exec("CREATE TABLE unmanaged (id TEXT) STRICT");
    unmanaged.close();

    expect(() =>
      initializeTraderLinkPlatformDatabase({
        databasePath: path,
        forbiddenRepositoryRoots: [],
      }),
    ).toThrowError("TRADERLINK_PLATFORM_UNMANAGED_SCHEMA");
    const inspection = new Database(path, { readonly: true, fileMustExist: true });
    try {
      expect(
        inspection
          .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name")
          .all(),
      ).toEqual([{ name: "unmanaged" }]);
    } finally {
      inspection.close();
    }
  });

  it("the read-only verifier rejects a completed database with a changed persistence pragma", () => {
    const path = pathFor("verifier-pragma-rejection");
    initializeTraderLinkPlatformDatabase({
      databasePath: path,
      forbiddenRepositoryRoots: [],
    });
    const changed = new Database(path);
    changed.pragma("journal_mode = DELETE");
    changed.close();

    expect(() =>
      verifyTraderLinkPlatformDatabase({
        databasePath: path,
        expectEmptyFoundation: true,
        forbiddenRepositoryRoots: [],
      }),
    ).toThrowError("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
  });
});
