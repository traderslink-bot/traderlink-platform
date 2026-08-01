import { platformMigrationFileEntries } from "./platform-migration-manifest";
import {
  verifyPlatformMigrationFileEntry,
  verifyTraderLinkPlatformMigrationFiles,
} from "@/src/scripts/verify-traderlink-platform-migration-files";

describe("static platform migration file contract", () => {
  it("matches every configured filename, literal ID, namespace, and global order", () => {
    expect(verifyTraderLinkPlatformMigrationFiles(process.cwd())).toEqual([
      expect.objectContaining({
        migrationId: "0001_platform_identity",
        moduleNamespace: "platform",
        executionOrder: 1,
      }),
      expect.objectContaining({
        migrationId: "0002_journal_account_boundary",
        moduleNamespace: "journal",
        executionOrder: 2,
      }),
    ]);
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
