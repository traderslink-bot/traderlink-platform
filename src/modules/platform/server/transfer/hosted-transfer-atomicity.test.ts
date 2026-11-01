// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
vi.mock("server-only", () => ({}));
import { openPlatformDatabase } from "../database/open-platform-database";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { prepareHostedTransfer } from "./hosted-transfer-preview-service";
import { executeHostedTransfer } from "./hosted-transfer-service";
import { hostedTransferSha256, type HostedTransferModule } from "./hosted-transfer-contract";
import type { HostedSourceSnapshots } from "./hosted-source-snapshot-reader";
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const now = new Date("2026-10-31T12:00:00.000Z");
const digest = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
describe("whole hosted transfer transaction", () => {
  it.each(["later_module", "reconciliation", "success"])("handles %s without partial identities", (variant) => {
    const root = mkdtempSync(join(tmpdir(), "security-transfer-")); roots.push(root);
    const path = join(root, "target.sqlite");
    const db = openPlatformDatabase({ mode: "initializer", databasePath: path, forbiddenRepositoryRoots: [] });
    try {
      runPlatformMigrations(db, { now: () => now });
      const base = {
        academy: { users: [{ authSubject: "123456789012345678", username: "synthetic", globalDisplayName: null }], completions: [] },
        watchlist: { symbols: [{ symbol: "ABCD", status: "live", updated_at: 1, state_json: "{}", revision: 1 }], health: [], archives: [] },
        news: { articles: [], versions: [] }, affiliate: { invites: [], attributions: [], pendingUnmappedRowCount: 0 },
      };
      const sources: HostedSourceSnapshots = {
        academy: { ...base.academy, sha256: hostedTransferSha256(base.academy) },
        watchlist: { ...base.watchlist, sha256: hostedTransferSha256(base.watchlist) },
        news: { ...base.news, sha256: hostedTransferSha256(base.news) },
        affiliate: { ...base.affiliate, sha256: hostedTransferSha256(base.affiliate) },
      };
      const prepared = prepareHostedTransfer(db, sources);
      if (variant === "later_module") db.exec("CREATE TRIGGER security_fail BEFORE INSERT ON live_watchlist_symbols BEGIN SELECT RAISE(ABORT, 'synthetic_later_module_failure'); END");
      if (variant === "reconciliation") db.exec("CREATE TRIGGER security_fail BEFORE INSERT ON platform_hosted_transfer_events WHEN NEW.event_kind='reconciled' BEGIN SELECT RAISE(ABORT, 'synthetic_reconciliation_failure'); END");
      db.pragma("wal_checkpoint(TRUNCATE)");
      const backup = join(root, "backup.sqlite"), restored = join(root, "restored.sqlite");
      copyFileSync(path, backup); copyFileSync(path, restored);
      const byModule = Object.fromEntries(prepared.preview.modules.map(module => [module.module, module.sourceSnapshotSha256])) as Record<HostedTransferModule, string>;
      const times = Object.fromEntries(prepared.preview.modules.map(module => [module.module, now.toISOString()])) as Record<HostedTransferModule, string>;
      const execute = () => executeHostedTransfer({ database: db, databasePath: path, prepared, now, authorization: {
        authorized: true, previewSha256: prepared.preview.previewSha256, targetDatabaseFileSha256: digest(path),
        targetBackupPath: backup, targetBackupSha256: digest(backup), targetRestorePath: restored, targetRestoreSha256: digest(restored),
        targetBackupCompletedAtUtc: now.toISOString(), sourceSnapshotSha256ByModule: byModule, sourceBackupCompletedAtUtcByModule: times,
      } });
      if (variant === "success") {
        expect(execute().status).toBe("executed_and_reconciled");
        expect(db.prepare("SELECT COUNT(*) AS count FROM platform_users").get()).toEqual({ count: 1 });
      } else {
        expect(execute).toThrowError(variant === "later_module" ? "synthetic_later_module_failure" : "synthetic_reconciliation_failure");
        expect(db.prepare("SELECT COUNT(*) AS count FROM platform_users").get()).toEqual({ count: 0 });
        expect(db.prepare("SELECT COUNT(*) AS count FROM platform_auth_identities").get()).toEqual({ count: 0 });
        expect(db.prepare("SELECT COUNT(*) AS count FROM live_watchlist_symbols").get()).toEqual({ count: 0 });
        expect(db.prepare("SELECT COUNT(*) AS count FROM platform_hosted_transfer_events").get()).toEqual({ count: 0 });
      }
    } finally { db.close(); }
  });
});
