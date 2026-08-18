import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  TRADE_EXPLORER_COMPARISON_STUDY_VERSION,
  type TradeExplorerComparisonStudyPayload,
} from "@/src/modules/journal-analytics/contracts/trade-explorer-comparison-study";
import { TradeExplorerComparisonStudyRepository } from "@/src/modules/journal-analytics/server/trade-explorer-comparison-study-repository";
import { TradeExplorerComparisonStudyService } from "@/src/modules/journal-analytics/server/trade-explorer-comparison-study-service";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

const timestamp = "2026-08-18T16:00:00.000Z";

function id(sequence: number): string {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function payload(groupCount: number): TradeExplorerComparisonStudyPayload {
  const normalizedStudyJson = JSON.stringify({
    comparisonVersion: "trade_explorer_comparison_v1",
    groups: Array.from({ length: groupCount }, (_value, index) => ({
      name: `Group ${index + 1}`,
      query: { startDate: "2026-01-01", endDate: "2026-12-31" },
    })),
  });
  return Object.freeze({
    studyVersion: TRADE_EXPLORER_COMPARISON_STUDY_VERSION,
    normalizedStudyJson,
    studySha256: createHash("sha256").update(normalizedStudyJson, "utf8").digest("hex"),
  });
}

const root = mkdtempSync(join(tmpdir(), "traderlink-comparison-studies-"));
const database = openPlatformDatabase({
  mode: "initializer",
  databasePath: join(root, "journal.sqlite"),
  forbiddenRepositoryRoots: [],
});

try {
  runPlatformMigrations(database, { now: () => new Date(timestamp) });
  const userId = id(1);
  const workspaceId = id(2);
  const firstAccountId = id(3);
  const secondAccountId = id(4);
  database.exec("BEGIN IMMEDIATE");
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'verification', 'owner', 'Owner', 'active', ?, ?)`).run(userId, timestamp, timestamp);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Workspace', 'America/New_York', 'active', ?, ?)`).run(workspaceId, timestamp, timestamp);
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(workspaceId, userId, userId, timestamp, timestamp);
  const insertAccount = database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'USD', 'America/New_York', 'active', ?, ?, ?)`);
  insertAccount.run(firstAccountId, workspaceId, "First", userId, timestamp, timestamp);
  insertAccount.run(secondAccountId, workspaceId, "Second", userId, timestamp, timestamp);
  database.exec("COMMIT");

  let nextId = 100;
  const service = new TradeExplorerComparisonStudyService(
    new TradeExplorerComparisonStudyRepository(database),
    { createId: () => id(nextId++), now: () => new Date(timestamp) },
  );
  const scope = (accountId: string): AccountScope => Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    accountId,
  });
  const firstScope = scope(firstAccountId);
  const secondScope = scope(secondAccountId);
  const created = service.create(firstScope, { name: "Periods", payload: payload(2) });
  const updated = service.update(firstScope, {
    studyId: created.studyId,
    expectedRevision: created.revision,
    name: "Four groups",
    payload: payload(4),
  });
  let staleRejected = false;
  try {
    service.update(firstScope, {
      studyId: created.studyId,
      expectedRevision: created.revision,
      name: "Stale",
      payload: payload(2),
    });
  } catch {
    staleRejected = true;
  }
  const isolated = service.list(secondScope).length === 0;
  service.retire(firstScope, {
    studyId: updated.studyId,
    expectedRevision: updated.revision,
  });
  const activeAfterRetirement = service.list(firstScope).length;
  const versionCount = Number((database.prepare(`SELECT COUNT(*) AS count
FROM journal_trade_explorer_comparison_study_versions`).get() as { count: number }).count);

  if (!staleRejected || !isolated || activeAfterRetirement !== 0 || versionCount !== 3) {
    throw new Error("Trade Explorer comparison-study verification failed.");
  }
  console.log(JSON.stringify({
    valid: true,
    accountIsolation: isolated,
    staleUpdateRejected: staleRejected,
    immutableVersions: versionCount,
    activeAfterRetirement,
  }));
} finally {
  database.close();
  rmSync(root, { recursive: true, force: true });
}
