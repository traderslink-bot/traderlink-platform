// @vitest-environment node
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as enterDashboard } from "@/app/dashboard-entry/route";
import { removePlatformDatabaseTestFixture } from "@/src/test/platform-database-fixture";
import { MARKET_TOOL_MEMBERSHIP_KEYS } from "../../contracts/membership-market-tools";
import { platformAuthCookieName } from "../authentication/platform-auth-cookies";
import { PlatformLoginService } from "../authentication/platform-login-service";
import { TRADERLINK_PLATFORM_SESSION_COOKIE } from "../authentication/platform-session-service";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity, requireTraderLinkPlatformRequestIdentity } from "../authentication/require-platform-request-scope";
import { openPlatformDatabase } from "../database/open-platform-database";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { hasPlatformMembershipFeature } from "../membership/platform-membership-access";
import { PlatformMembershipRepository } from "../membership/platform-membership-repository";
import { hasMarketToolDashboardAdmission } from "../membership/membership-market-tool-access";
import { readPlatformHomeAccess } from "./platform-home-page-access";
import { PlatformUserPreferenceRepository } from "./platform-user-preference-repository";

const origin = "https://app.traderslink.pro";
const roots: string[] = [];
afterEach(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) await removePlatformDatabaseTestFixture(root);
}, 20_000);

describe("Tool-only native Platform sessions", () => {
  it.each([...Object.values(MARKET_TOOL_MEMBERSHIP_KEYS), "existing_owner", "pre_paywall"] as const)("checks Home for %s without Discord, Community or Journal grants", async key => {
    const ownerCase = key === "existing_owner";
    const prePaywallCase = key === "pre_paywall";
    const noToolGrantCase = ownerCase || prePaywallCase;
    const root = mkdtempSync(join(tmpdir(), "platform-tool-home-"));
    roots.push(root);
    const databasePath = join(root, "fixture.sqlite");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", origin);
    vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", databasePath);
    vi.stubEnv("TRADERLINK_STOCK_SCREENERS_ENABLED", "1");
    vi.stubEnv("TRADERLINK_MARKET_TOOLS_ACCESS_MODE", "standard");
    vi.stubEnv("TRADERLINK_MARKET_TOOLS_REVIEW_USER_IDS", [randomUUID(), randomUUID()].join(","));
    vi.stubEnv("TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT", "123456789012345678");
    vi.stubEnv("DISCORD_GUILD_ID", "987654321098765432");
    const network = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("No provider requests in this fixture"));
    const database = openPlatformDatabase({ mode: "initializer", databasePath, forbiddenRepositoryRoots: [] });
    try {
      runPlatformMigrations(database);
      const login = new PlatformLoginService(database);
      const member = login.signInOAuth({ provider: "google", subject: randomUUID(), displayName: "Synthetic standalone member" });
      const other = login.signInOAuth({ provider: "google", subject: randomUUID(), displayName: "Synthetic non-member" });
      const at = new Date().toISOString();
      const memberships = new PlatformMembershipRepository(database);
      memberships.synchronizeBuiltInFeatures(member.session.userId, at);
      const plan = memberships.createPlan({ actorUserId: member.session.userId, planKey: `tools-${randomUUID()}`, name: "Synthetic tools only",
        visibility: "private", features: [{ featureKey: noToolGrantCase ? "dashboard.access" : key, limitValue: null }], atUtc: at });
      memberships.publishPlanVersion({ actorUserId: member.session.userId, planVersionId: plan.planVersionId, atUtc: at });
      const subscriptionId = randomUUID();
      if (!noToolGrantCase) {
        memberships.registerProvider({ actorUserId: member.session.userId, providerKey: "qa_tools", label: "Synthetic only",
          integrationMode: "manual", configurationState: "test", atUtc: at });
        const offerId = memberships.createOffer({ actorUserId: member.session.userId, planVersionId: plan.planVersionId,
          name: "Synthetic paid subscription", provider: "qa_tools", channel: "website", billingKind: "recurring", currency: "USD",
          initialAmountMinor: 1000, renewalAmountMinor: 1000, billingPeriodDays: null, billingInterval: "month", billingIntervalCount: 1, atUtc: at });
        database.prepare("UPDATE platform_membership_offers SET status='active' WHERE offer_id=?").run(offerId);
        database.prepare(`INSERT INTO platform_membership_provider_subscriptions
          (provider_subscription_id,user_id,offer_id,provider,external_subscription_ref,lifecycle_state,
           current_period_start_utc,cancel_at_period_end,created_at_utc,updated_at_utc)
          VALUES (?,?,?,'qa_tools',?,'active',?,0,?,?)`).run(subscriptionId, member.session.userId, offerId, `synthetic-${subscriptionId}`, at, at, at);
      }
      const grantId = memberships.grantEntitlement({ actorUserId: member.session.userId, userId: member.session.userId,
        planVersionId: plan.planVersionId, sourceType: ownerCase ? "owner_grant" : prePaywallCase ? "free_plan" : "subscription", sourceRef: subscriptionId, startsAtUtc: at, endsAtUtc: null, atUtc: at });
      for (const feature of [...(prePaywallCase ? [] : Object.values(MARKET_TOOL_MEMBERSHIP_KEYS)), "dashboard.access", "journal.access", "watchlist.access"]) {
        database.prepare("INSERT INTO platform_membership_feature_policies VALUES (?,'enforced',?,?)").run(feature, member.session.userId, at);
      }
      const operatorGrantId = randomUUID();
      if (ownerCase) {
        database.prepare(`INSERT INTO platform_operator_grants
          (operator_grant_id,user_id,authority_key,operator_role,grant_state,granted_by_kind,grant_receipt_sha256,granted_at_utc,updated_at_utc)
          VALUES (?,?,'journal_administration','journal_owner_admin','active','bootstrap_console',?,?,?)`)
          .run(operatorGrantId, member.session.userId, "0".repeat(64), at, at);
      }
      if (noToolGrantCase) {
        expect(database.prepare("SELECT COUNT(*) n FROM platform_membership_provider_subscriptions").get()).toEqual({ n: 0 });
        for (const feature of Object.values(MARKET_TOOL_MEMBERSHIP_KEYS)) {
          expect(hasPlatformMembershipFeature(database, member.session.userId, feature)).toBe(false);
        }
      }
      const headers = new Headers({ cookie: `${platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)}=${member.token}` });
      const identity = requireTraderLinkPlatformRequestIdentity(headers);
      expect(identity).toMatchObject({ mode: "platform_session", scope: { userId: member.session.userId } });
      const access = readPlatformHomeAccess(database, identity, headers);
      expect(access.dashboard).toBe(true);
      expect(access.homePages.welcome).toBe(true);
      expect(access.homePages.scanners).toBe(prePaywallCase || key === "scanners.access");
      expect(access.homePages.screeners).toBe(prePaywallCase || key === "screeners.access");
      expect(access.homePages["trading-workspace"]).toBe(false);
      expect(access.charts).toBe(false);
      expect(access.journal).toBe(ownerCase);
      for (const feature of ["watchlist.access", "journal.access", "community.access"]) {
        expect(hasPlatformMembershipFeature(database, member.session.userId, feature)).toBe(false);
      }
      expect(database.prepare("SELECT COUNT(*) n FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord'").get(member.session.userId)).toEqual({ n: 0 });
      expect(database.prepare("SELECT COUNT(*) n FROM traderlink_community_memberships WHERE user_id=?").get(member.session.userId)).toEqual({ n: 0 });
      const response = await enterDashboard(new NextRequest(origin + "/dashboard-entry", { headers }));
      expect(response.headers.get("location")).toBe(origin + "/home");
      const savedHome = key === "screeners.access" ? "screeners" : key === "scanners.access" ? "scanners" : "welcome";
      new PlatformUserPreferenceRepository(database).updateActiveUserHomePage({ homePage: savedHome, userId: member.session.userId, updatedAtUtc: at });
      const saved = await enterDashboard(new NextRequest(origin + "/dashboard-entry", { headers }));
      expect(saved.headers.get("location")).toBe(origin + (savedHome === "welcome" ? "/home" : `/${savedHome}`));
      const denied = new Headers({ cookie: `${platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)}=${other.token}` });
      expect(() => requireTraderLinkPlatformRequestIdentity(denied)).toThrow();
      if (prePaywallCase) {
        const billingOnly = requireTraderLinkPlatformAuthenticatedRequestIdentity(denied);
        expect(hasMarketToolDashboardAdmission(database, billingOnly)).toBe(false);
        for (const mode of ["off", "shadow", "enforced"] as const) {
          for (const feature of Object.values(MARKET_TOOL_MEMBERSHIP_KEYS)) {
            database.prepare(`INSERT INTO platform_membership_feature_policies VALUES (?,?,?,?)
              ON CONFLICT(feature_key) DO UPDATE SET enforcement_mode=excluded.enforcement_mode`).run(feature, mode, member.session.userId, at);
          }
          const released = readPlatformHomeAccess(database, identity, headers);
          expect(released.homePages.scanners).toBe(mode !== "enforced");
          expect(released.homePages.screeners).toBe(mode !== "enforced");
          expect(released.charts).toBe(mode !== "enforced");
          expect(released.homePages.welcome).toBe(mode !== "enforced");
        }
        database.prepare("UPDATE platform_membership_feature_policies SET enforcement_mode='off' WHERE feature_key='scanners.access'").run();
        const scannerOnlyRelease = readPlatformHomeAccess(database, identity, headers);
        expect(scannerOnlyRelease.homePages.scanners).toBe(true);
        expect(scannerOnlyRelease.homePages.screeners).toBe(false);
        expect(scannerOnlyRelease.charts).toBe(false);
        expect(scannerOnlyRelease.homePages.welcome).toBe(true);
        database.prepare("UPDATE platform_membership_feature_policies SET enforcement_mode='enforced' WHERE feature_key='scanners.access'").run();
        database.prepare("UPDATE platform_membership_feature_policies SET enforcement_mode='off' WHERE feature_key='screeners.access'").run();
        vi.stubEnv("TRADERLINK_STOCK_SCREENERS_ENABLED", "0");
        expect(readPlatformHomeAccess(database, identity, headers).homePages.welcome).toBe(false);
        database.prepare("UPDATE platform_membership_feature_policies SET enforcement_mode='off' WHERE feature_key IN ('scanners.access','screeners.access','charts.access')").run();
        const disabledScreeners = readPlatformHomeAccess(database, identity, headers);
        expect(disabledScreeners.homePages.screeners).toBe(false);
        expect(disabledScreeners.homePages.scanners).toBe(true);
        expect(disabledScreeners.charts).toBe(true);
      }
      if (ownerCase) {
        memberships.grantEntitlement({ actorUserId: member.session.userId, userId: other.session.userId,
          planVersionId: plan.planVersionId, sourceType: "free_plan", sourceRef: randomUUID(), startsAtUtc: at, endsAtUtc: null, atUtc: at });
        const ordinaryIdentity = requireTraderLinkPlatformRequestIdentity(denied);
        for (const mode of ["off", "enforced"]) {
          database.prepare("UPDATE platform_membership_feature_policies SET enforcement_mode=? WHERE feature_key='charts.access'").run(mode);
          const ownerAccess = readPlatformHomeAccess(database, identity, headers);
          expect(ownerAccess.charts).toBe(true);
          expect(ownerAccess.homePages.welcome).toBe(true);
          const ordinaryAccess = readPlatformHomeAccess(database, ordinaryIdentity, denied);
          expect(ordinaryAccess.charts).toBe(mode !== "enforced");
          expect(ordinaryAccess.homePages.welcome).toBe(mode !== "enforced");
        }
        const revokedAt = new Date().toISOString();
        database.prepare(`UPDATE platform_operator_grants SET grant_state='revoked',revoked_by_kind='bootstrap_console',
          revoked_reason_code='test_revocation',revoked_at_utc=?,updated_at_utc=? WHERE operator_grant_id=?`)
          .run(revokedAt, revokedAt, operatorGrantId);
        const revokedAccess = readPlatformHomeAccess(database, identity, headers);
        expect(revokedAccess.charts).toBe(false);
        expect(revokedAccess.homePages.welcome).toBe(false);
      }
      database.prepare("UPDATE platform_membership_entitlements SET status='revoked' WHERE entitlement_id=?").run(grantId);
      expect(() => requireTraderLinkPlatformRequestIdentity(headers)).toThrow();
      expect(network).not.toHaveBeenCalled();
    } finally {
      database.close();
    }
  }, 30_000);
});
