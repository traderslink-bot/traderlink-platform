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
      "0018_platform_hosted_transfer_events",
    );
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
