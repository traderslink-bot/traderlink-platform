// @vitest-environment node
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PlatformOperatorRepository } from "@/src/modules/platform/server/administration/platform-operator-repository";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { platformIdentityMigration } from "@/src/modules/platform/server/database/migrations/0001_platform_identity";
import { platformAdministrationMigration } from "@/src/modules/platform/server/database/migrations/0019_platform_administration";
import { platformDashboardMemberAccessMigration } from "@/src/modules/platform/server/database/migrations/0077_platform_dashboard_member_access";
import { platformMembershipPlatformMigration } from "@/src/modules/platform/server/database/migrations/0148_platform_membership_platform";
import { platformMembershipGenerationAllowancesMigration } from "@/src/modules/platform/server/database/migrations/0150_platform_membership_generation_allowances";
import { platformMembershipFeatureCopyMigration } from "@/src/modules/platform/server/database/migrations/0157_platform_membership_feature_copy";
import { platformMembershipUnifiedEditorMigration } from "@/src/modules/platform/server/database/migrations/0165_platform_membership_unified_editor";
import { PlatformMembershipRepository } from "@/src/modules/platform/server/membership/platform-membership-repository";
import { hasChartsDashboardAccess, hasSharedChartDataAccess } from "./chart-dashboard-access";

const state = vi.hoisted(() => ({
  database: undefined as Database.Database | undefined,
  scannerOrWorkspace: false,
  screenersEnabled: false,
  screeners: false,
}));

vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: (_options: unknown, read: (database: unknown) => unknown) => read(state.database),
}));
vi.mock("@/src/modules/stock-screeners/service", () => ({
  stockScreenersEnabled: () => state.screenersEnabled,
}));
vi.mock("./market-tools-dashboard-access", () => ({
  hasMarketToolsDashboardReadAccess: () => state.scannerOrWorkspace,
  hasStockScreenersDashboardAccess: () => state.screeners,
}));

const member: TraderLinkPlatformRequestIdentity = {
  mode: "platform_session",
  sessionId: "fixture-session",
  scope: { userId: "eb81f76d-90ca-4ad3-88f6-278aa4c3f0c7", workspaceId: "fixture-workspace", workspaceRole: "member", allowedAccountIds: [], activeAccountId: null },
  displayName: null,
  discord: null,
};

const owner: TraderLinkPlatformRequestIdentity = {
  ...member,
  scope: { ...member.scope, userId: "2fec6cb8-dfe3-40f9-8b68-f21dcf0fbddb" },
};
const grantedAtUtc = "2026-11-22T18:00:00.000Z";

function grantOperator() {
  const database = state.database!;
  const repository = new PlatformOperatorRepository(database);
  const grant = repository.insert({
    operatorGrantId: "ee67b050-43ac-446d-b504-22aa5f7fc8a1",
    userId: owner.scope.userId,
    grantedByKind: "bootstrap_console",
    grantedByUserId: null,
    grantReceiptSha256: "0".repeat(64),
    recoveryOfGrantId: null,
    grantedAtUtc,
  });
  return { repository, grant };
}

function setPolicy(mode: "missing" | "off" | "shadow" | "enforced") {
  const database = state.database!;
  if (mode === "missing") {
    database.prepare("DELETE FROM platform_membership_feature_policies WHERE feature_key = ?").run("charts.access");
    return;
  }
  database.prepare(`INSERT INTO platform_membership_feature_policies VALUES (?,?,?,?)
    ON CONFLICT(feature_key) DO UPDATE SET enforcement_mode=excluded.enforcement_mode`)
    .run("charts.access", mode, owner.scope.userId, grantedAtUtc);
}

function grantFeature(userId: string, featureKey: "dashboard.access" | "charts.access" | "journal.access") {
  const repository = new PlatformMembershipRepository(state.database!);
  const plan = repository.createPlan({
    actorUserId: owner.scope.userId,
    planKey: `fixture-${featureKey.replace(".", "-")}`,
    name: "Fixture chart access plan",
    visibility: "private",
    features: [{ featureKey, limitValue: null }],
    atUtc: grantedAtUtc,
  });
  repository.publishPlanVersion({
    actorUserId: owner.scope.userId,
    planVersionId: plan.planVersionId,
    atUtc: grantedAtUtc,
  });
  repository.grantEntitlement({
    actorUserId: owner.scope.userId,
    userId,
    planVersionId: plan.planVersionId,
    sourceType: "subscription",
    sourceRef: randomUUID(),
    startsAtUtc: grantedAtUtc,
    endsAtUtc: "2099-01-01T00:00:00.000Z",
    atUtc: grantedAtUtc,
  });
}

beforeEach(() => {
  const database = new Database(":memory:");
  state.database = database;
  database.pragma("foreign_keys=ON");
  for (const migration of [
    platformIdentityMigration,
    platformAdministrationMigration,
    platformDashboardMemberAccessMigration,
    platformMembershipPlatformMigration,
    platformMembershipGenerationAllowancesMigration,
    platformMembershipFeatureCopyMigration,
    platformMembershipUnifiedEditorMigration,
  ]) {
    for (const statement of migration.statements) database.exec(statement);
  }
  for (const { scope: { userId } } of [member, owner]) {
    database.prepare("INSERT INTO platform_users VALUES (?,?,?,'Fixture user','active',?,?)")
      .run(userId, "test", userId, grantedAtUtc, grantedAtUtc);
  }
  new PlatformMembershipRepository(database).synchronizeBuiltInFeatures(owner.scope.userId, grantedAtUtc);
  setPolicy("enforced");
  state.scannerOrWorkspace = false;
  state.screenersEnabled = false;
  state.screeners = false;
  grantFeature(member.scope.userId, "dashboard.access");
});

afterEach(() => state.database?.close());

it.each(["missing", "off", "shadow"] as const)("admits an authenticated dashboard member with %s Charts policy", mode => {
  setPolicy(mode);
  expect(hasChartsDashboardAccess(member)).toBe(true);
  expect(hasSharedChartDataAccess(member)).toBe(true);
});

it("preserves Discord dashboard admission before the policy table exists", () => {
  state.database!.exec("DROP TABLE platform_membership_feature_policies");
  state.database!.prepare("UPDATE platform_dashboard_member_access_settings SET allow_all_discord_members = 1").run();
  const discordMember = { ...member, discord: { guildOwner: false, roleIds: [] } };
  expect(hasChartsDashboardAccess(discordMember)).toBe(true);
  expect(hasChartsDashboardAccess(member)).toBe(false);
});

it("keeps Charts closed to a billing-only identity during open launch", () => {
  setPolicy("off");
  expect(hasChartsDashboardAccess(owner)).toBe(false);
  expect(hasSharedChartDataAccess(owner)).toBe(false);
});

it("requires an independent current Charts grant for an ordinary member under enforcement", () => {
  expect(hasChartsDashboardAccess(member)).toBe(false);
  expect(hasSharedChartDataAccess(member)).toBe(false);
  grantFeature(member.scope.userId, "charts.access");
  expect(hasChartsDashboardAccess(member)).toBe(true);
  expect(hasSharedChartDataAccess(member)).toBe(true);
});

it.each(["missing", "off", "shadow", "enforced"] as const)("preserves Charts for the active operator with %s policy and no paid grant", mode => {
  setPolicy(mode);
  grantOperator();
  expect(hasChartsDashboardAccess(owner)).toBe(true);
  expect(hasSharedChartDataAccess(owner)).toBe(true);
});

it("denies a revoked operator without a paid grant and still accepts their own current grant", () => {
  const { repository, grant } = grantOperator();
  repository.revoke({
    operatorGrantId: grant.operatorGrantId,
    revokedByKind: "bootstrap_console",
    revokedByUserId: null,
    reasonCode: "fixture_revocation",
    revokedAtUtc: "2026-11-22T18:01:00.000Z",
  });
  expect(hasChartsDashboardAccess(owner)).toBe(false);
  expect(hasSharedChartDataAccess(owner)).toBe(false);
  grantFeature(owner.scope.userId, "charts.access");
  expect(hasChartsDashboardAccess(owner)).toBe(true);
});

it("keeps a different user with workspace ownership on the ordinary paid path", () => {
  grantOperator();
  const workspaceOwner = { ...member, scope: { ...member.scope, workspaceRole: "owner" as const } };
  expect(hasChartsDashboardAccess(workspaceOwner)).toBe(false);
  expect(hasSharedChartDataAccess(workspaceOwner)).toBe(false);
});

it("opens shared data through the independent Scanner and Workspace drawer decision", () => {
  state.scannerOrWorkspace = true;
  expect(hasChartsDashboardAccess(member)).toBe(false);
  expect(hasSharedChartDataAccess(member)).toBe(true);
});

it("opens shared data for admitted Screeners only when the Screeners drawer is enabled", () => {
  state.screeners = true;
  expect(hasSharedChartDataAccess(member)).toBe(false);
  state.screenersEnabled = true;
  expect(hasChartsDashboardAccess(member)).toBe(false);
  expect(hasSharedChartDataAccess(member)).toBe(true);
});

it("requires both Journal access and an active account for shared chart data", () => {
  const journalMember = { ...member, scope: { ...member.scope, allowedAccountIds: ["account"], activeAccountId: "account" } };
  expect(hasSharedChartDataAccess(journalMember)).toBe(false);
  grantFeature(journalMember.scope.userId, "journal.access");
  expect(hasSharedChartDataAccess(member)).toBe(false);
  expect(hasSharedChartDataAccess(journalMember)).toBe(true);
  expect(hasChartsDashboardAccess(journalMember)).toBe(false);
});

it("preserves the local development chart", () => {
  const local = { ...member, mode: "local_development" as const };
  expect(hasChartsDashboardAccess(local)).toBe(true);
  expect(hasSharedChartDataAccess(local)).toBe(true);
});
