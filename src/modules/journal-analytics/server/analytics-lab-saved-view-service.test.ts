import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import { prepareAnalyticsLabSavedViewPayload } from "@/app/(dashboard)/analytics/lab/analytics-lab-platform-query";
import type { AnalyticsLabPlatformQuery } from "@/app/(dashboard)/analytics/lab/analytics-lab-platform-types";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { JournalAnalyticsSavedViewRepository } from "./analytics-lab-saved-view-repository";
import { JournalAnalyticsSavedViewService } from "./analytics-lab-saved-view-service";

const roots: string[] = [];
const at = "2026-08-02T12:00:00.000Z";

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function id(sequence: number): string {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function setup() {
  const root = mkdtempSync(join(tmpdir(), "traderlink-saved-views-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "journal.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date(at) });
  const userId = id(1);
  const workspaceId = id(2);
  const firstAccountId = id(3);
  const secondAccountId = id(4);
  database.exec("BEGIN IMMEDIATE");
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'test', 'owner', 'Owner', 'active', ?, ?)`).run(userId, at, at);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'Workspace', 'America/New_York', 'active', ?, ?)`).run(
    workspaceId,
    at,
    at,
  );
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(
    workspaceId,
    userId,
    userId,
    at,
    at,
  );
  const insertAccount = database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'USD', 'America/New_York', 'active', ?, ?, ?)`);
  insertAccount.run(firstAccountId, workspaceId, "Day trading", userId, at, at);
  insertAccount.run(secondAccountId, workspaceId, "Long term", userId, at, at);
  database.exec("COMMIT");
  let nextId = 100;
  const repository = new JournalAnalyticsSavedViewRepository(database);
  const service = new JournalAnalyticsSavedViewService(repository, {
    createId: () => id(nextId++),
    now: () => new Date(at),
  });
  const scope = (accountId: string): AccountScope => Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    accountId,
  });
  return Object.freeze({
    database,
    firstScope: scope(firstAccountId),
    secondScope: scope(secondAccountId),
    repository,
    service,
  });
}

function query(
  metricId = "net_pnl",
  expectedAccountSelectionRef = "selection-ref",
): AnalyticsLabPlatformQuery {
  return Object.freeze({
    expectedAccountSelectionRef,
    metricId,
    grouping: "closing_day",
    moneyBasis: "net",
    currency: "USD",
    symbol: null,
    direction: null,
    provenance: null,
    outcome: null,
    entryWeekday: null,
    entryTimeBucketMinutes: 30,
    entryTimeBucket: null,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    minimumHoldingSeconds: null,
    maximumHoldingSeconds: null,
    minimumEnteredQuantity: null,
    maximumEnteredQuantity: null,
    minimumPositionQuantity: null,
    maximumPositionQuantity: null,
    minimumEntryNotional: null,
    maximumEntryNotional: null,
    evidenceRows: 24,
  });
}

describe("Journal Analytics saved views", () => {
  it("versions create, update and retirement while isolating Journal accounts", () => {
    const context = setup();
    const firstPayload = prepareAnalyticsLabSavedViewPayload(query()).payload;
    const created = context.service.create(context.firstScope, {
      name: "  Daily results  ",
      payload: firstPayload,
    });
    expect(created).toMatchObject({ name: "Daily results", revision: 1 });
    expect(context.service.list(context.firstScope)).toHaveLength(1);
    expect(context.service.list(context.secondScope)).toEqual([]);

    const updated = context.service.update(context.firstScope, {
      savedViewId: created.savedViewId,
      expectedRevision: 1,
      name: "Daily gross results",
      payload: prepareAnalyticsLabSavedViewPayload(query("gross_pnl")).payload,
    });
    expect(updated).toMatchObject({
      name: "Daily gross results",
      revision: 2,
    });
    expect(() => context.service.update(context.firstScope, {
      savedViewId: created.savedViewId,
      expectedRevision: 1,
      name: "Stale",
      payload: firstPayload,
    })).toThrowError("TRADERLINK_ANALYTICS_SAVED_VIEW_CONFLICT");
    expect(context.database.prepare(`SELECT COUNT(*) AS count
FROM journal_analytics_saved_view_versions WHERE saved_view_id = ?`).get(
      created.savedViewId,
    )).toEqual({ count: 2 });

    context.service.retire(context.firstScope, {
      savedViewId: created.savedViewId,
      expectedRevision: 2,
    });
    expect(context.service.list(context.firstScope)).toEqual([]);
    expect(context.database.prepare(`SELECT lifecycle_state, revision
FROM journal_analytics_saved_views WHERE saved_view_id = ?`).get(
      created.savedViewId,
    )).toEqual({ lifecycle_state: "retired", revision: 3 });
    expect(context.database.prepare(`SELECT COUNT(*) AS count
FROM journal_analytics_saved_view_versions WHERE saved_view_id = ?`).get(
      created.savedViewId,
    )).toEqual({ count: 3 });
    expect(() => context.database.prepare(`DELETE FROM journal_analytics_saved_view_versions
WHERE saved_view_id = ?`).run(created.savedViewId)).toThrowError(
      /journal_analytics_saved_view_version_immutable/u,
    );
    context.database.close();
  });

  it("rejects noncanonical payloads, control characters and digest tampering", () => {
    const context = setup();
    const payload = prepareAnalyticsLabSavedViewPayload(query()).payload;
    expect(() => context.service.create(context.firstScope, {
      name: "Bad\nname",
      payload,
    })).toThrowError("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID");
    expect(() => context.service.create(context.firstScope, {
      name: "Tampered",
      payload: { ...payload, normalizedQueryJson: '{"metricId":"gross_pnl"}' },
    })).toThrowError("TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID");
    expect(context.service.list(context.firstScope)).toEqual([]);
    context.database.close();
  });

  it("enforces 100 active views per Journal account in service and schema", () => {
    const context = setup();
    const payload = prepareAnalyticsLabSavedViewPayload(query()).payload;
    for (let index = 1; index <= 100; index += 1) {
      context.service.create(context.firstScope, {
        name: `View ${index}`,
        payload,
      });
    }
    expect(context.service.list(context.firstScope)).toHaveLength(100);
    expect(() => context.service.create(context.firstScope, {
      name: "View 101",
      payload,
    })).toThrowError("TRADERLINK_ANALYTICS_SAVED_VIEW_CONFLICT");
    expect(context.service.create(context.secondScope, {
      name: "Other account view",
      payload,
    })).toMatchObject({ revision: 1 });

    context.database.exec("BEGIN IMMEDIATE");
    const viewId = id(900);
    const versionId = id(901);
    context.database.prepare(`INSERT INTO journal_analytics_saved_view_versions (
  saved_view_version_id, workspace_id, account_id, saved_view_id,
  version_number, event_kind, name, query_version, normalized_query_json,
  query_sha256, lifecycle_state, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, 1, 'created', 'Bypass', ?, ?, ?, 'active', ?, ?)`)
      .run(versionId, context.firstScope.workspaceId, context.firstScope.accountId,
        viewId, payload.queryVersion, payload.normalizedQueryJson,
        payload.querySha256, context.firstScope.userId, at);
    expect(() => context.database.prepare(`INSERT INTO journal_analytics_saved_views (
  saved_view_id, workspace_id, account_id, current_version_id,
  lifecycle_state, revision, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', 1, ?, ?, ?)`).run(
      viewId,
      context.firstScope.workspaceId,
      context.firstScope.accountId,
      versionId,
      context.firstScope.userId,
      at,
      at,
    )).toThrowError(/journal_analytics_saved_view_limit/u);
    context.database.exec("ROLLBACK");
    context.database.close();
  });
});
