import { platformMigrationFileEntries } from "./platform-migration-manifest";
import {
  verifyPlatformMigrationFileEntry,
  verifyPlatformMigrationFileEntries,
  verifyTraderLinkPlatformMigrationFiles,
} from "@/src/scripts/verify-traderlink-platform-migration-files";

describe("static platform migration file contract", () => {
  it("matches every configured filename, literal ID, namespace, and global order", () => {
    expect(verifyTraderLinkPlatformMigrationFiles(process.cwd())).toEqual(
      [...platformMigrationFileEntries].sort((left, right) => left.migration.executionOrder - right.migration.executionOrder).map((entry) => ({
        sourcePath: entry.sourcePath,
        migrationId: entry.migration.migrationId,
        moduleNamespace: entry.migration.moduleNamespace,
        executionOrder: entry.migration.executionOrder,
      })),
    );
    expect(platformMigrationFileEntries.slice(149, 151).map(({ migration }) => [
      migration.migrationId,
      migration.executionOrder,
    ])).toEqual([
      ["0186_daily_trade_analyzer_alpaca_cache", 223],
      ["0187_journal_chart_entries", 224],
    ]);
  });

  it("accepts either TypeScript string quote style without changing migration identity", () => {
    const entry = platformMigrationFileEntries[0];
    expect(verifyPlatformMigrationFileEntry(entry,
      `export const migration = {moduleNamespace: '${entry.migration.moduleNamespace}', migrationId: '${entry.migration.migrationId}', executionOrder: ${entry.migration.executionOrder}};`,
    ).migrationId).toBe(entry.migration.migrationId);
    expect(() => verifyPlatformMigrationFileEntry(entry,
      `export const migration = {moduleNamespace: '${entry.migration.moduleNamespace}', migrationId: 'wrong', executionOrder: ${entry.migration.executionOrder}};`,
    )).toThrowError("TRADERLINK_MIGRATION_FILE_ID_MISMATCH");
  });

  it("rejects a filename that does not match the exported literal migration ID", () => {
    const entry = platformMigrationFileEntries[0];
    expect(() =>
      verifyPlatformMigrationFileEntry(
        { ...entry, sourcePath: "src/modules/platform/server/database/migrations/9999_wrong.ts" },
        `export const migration = {moduleNamespace: "platform", migrationId: "0001_platform_identity", executionOrder: 1};`,
      ),
    ).toThrowError("TRADERLINK_MIGRATION_FILE_ID_MISMATCH");
  });
  it.each(["single", "double"])("accepts %s quoted descriptor keys without changing metadata", style => {
    const entry = platformMigrationFileEntries[0], quote = style === "single" ? "'" : '"';
    const body = `${quote}moduleNamespace${quote}: '${entry.migration.moduleNamespace}', ${quote}migrationId${quote}: '${entry.migration.migrationId}', ${quote}executionOrder${quote}: ${entry.migration.executionOrder}`;
    expect(verifyPlatformMigrationFileEntry(entry, `export const migration = Object.freeze({${body}} as const);`).migrationId).toBe(entry.migration.migrationId);
  });
  it.each(["comment", "string", "local_decoy", "dynamic_id", "computed_key", "duplicate", "getter", "namespace", "order", "arithmetic"])("refuses %s descriptor spoof or nonliteral metadata", kind => {
    const entry = platformMigrationFileEntries[0];
    const fields = `moduleNamespace: 'platform', migrationId: '${entry.migration.migrationId}', executionOrder: ${entry.migration.executionOrder}`;
    const valid = `export const migration = {${fields}};`;
    const sources: Record<string, string> = {
      comment: `// ${valid}`,
      string: `export const text = ${JSON.stringify(valid)};`,
      local_decoy: `const decoy = {${fields}}; export const migration = {moduleNamespace:'platform', migrationId: unknownId, executionOrder:1};`,
      dynamic_id: valid.replace(`'${entry.migration.migrationId}'`, "unknownId"),
      computed_key: valid.replace("migrationId:", "['migrationId']:"),
      duplicate: valid.replace("migrationId:", "migrationId:'wrong', migrationId:"),
      getter: valid.replace(`migrationId: '${entry.migration.migrationId}'`, `get migrationId() { return '${entry.migration.migrationId}'; }`),
      namespace: valid.replace("'platform'", "'wrong'"),
      order: valid.replace(`executionOrder: ${entry.migration.executionOrder}`, "executionOrder: 9999"),
      arithmetic: valid.replace(`executionOrder: ${entry.migration.executionOrder}`, `executionOrder: ${entry.migration.executionOrder} + 0`),
    };
    expect(() => verifyPlatformMigrationFileEntry(entry, sources[kind])).toThrowError("TRADERLINK_MIGRATION_FILE_ID_MISMATCH");
  });

  it("verifies unordered declarations in canonical execution order without mutating the declaration list", () => {
    const entries = [platformMigrationFileEntries[1], platformMigrationFileEntries[0]];
    const before = entries.map(entry => entry.migration.migrationId);
    const result = verifyPlatformMigrationFileEntries(entries, entry => `export const migration = {
      moduleNamespace:'${entry.migration.moduleNamespace}', migrationId:'${entry.migration.migrationId}', executionOrder:${entry.migration.executionOrder}
    };`);
    expect(result.map(entry => entry.migrationId)).toEqual(before.toReversed());
    expect(entries.map(entry => entry.migration.migrationId)).toEqual(before);
  });
  it.each(["id", "order"])("refuses duplicate global %s before reading source", kind => {
    const first = platformMigrationFileEntries[0], second = platformMigrationFileEntries[1];
    const entries = [first, {...second, migration:{...second.migration,
      ...(kind === "id" ? {migrationId:first.migration.migrationId} : {executionOrder:first.migration.executionOrder})}}];
    let reads = 0;
    expect(() => verifyPlatformMigrationFileEntries(entries, () => { reads += 1; return ""; }))
      .toThrowError(kind === "id" ? "TRADERLINK_MIGRATION_ID_CONFLICT" : "TRADERLINK_MIGRATION_ORDER_CONFLICT");
    expect(reads).toBe(0);
  });

});
