import { platformMigrationFileEntries } from "./platform-migration-manifest";
import {
  verifyPlatformMigrationFileEntry,
  verifyTraderLinkPlatformMigrationFiles,
} from "@/src/scripts/verify-traderlink-platform-migration-files";

describe("static platform migration file contract", () => {
  it("matches every configured filename, literal ID, namespace, and global order", () => {
    expect(verifyTraderLinkPlatformMigrationFiles(process.cwd())).toEqual(
      platformMigrationFileEntries.map((entry) => ({
        sourcePath: entry.sourcePath,
        migrationId: entry.migration.migrationId,
        moduleNamespace: entry.migration.moduleNamespace,
        executionOrder: entry.migration.executionOrder,
      })),
    );
    expect(platformMigrationFileEntries.at(-1)?.migration.migrationId).toBe(
      "0184_platform_watchlist_usage_user_recent",
    );
  });

  it("accepts either TypeScript string quote style without changing migration identity", () => {
    const entry = platformMigrationFileEntries[0];
    expect(verifyPlatformMigrationFileEntry(entry,
      `moduleNamespace: '${entry.migration.moduleNamespace}', migrationId: '${entry.migration.migrationId}', executionOrder: ${entry.migration.executionOrder},`,
    ).migrationId).toBe(entry.migration.migrationId);
    expect(() => verifyPlatformMigrationFileEntry(entry,
      `moduleNamespace: '${entry.migration.moduleNamespace}', migrationId: 'wrong', executionOrder: ${entry.migration.executionOrder},`,
    )).toThrowError("TRADERLINK_MIGRATION_FILE_ID_MISMATCH");
  });

  it("rejects a filename that does not match the exported literal migration ID", () => {
    const entry = platformMigrationFileEntries[0];
    expect(() =>
      verifyPlatformMigrationFileEntry(
        { ...entry, sourcePath: "src/modules/platform/server/database/migrations/9999_wrong.ts" },
        `moduleNamespace: "platform", migrationId: "0001_platform_identity", executionOrder: 1,`,
      ),
    ).toThrowError("TRADERLINK_MIGRATION_FILE_ID_MISMATCH");
  });
});
