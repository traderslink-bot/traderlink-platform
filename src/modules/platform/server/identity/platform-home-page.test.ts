// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import DashboardAdmissionTemplate from "@/app/(dashboard)/template";
import { saveHomePage } from "@/app/(dashboard)/account/home-page-actions";
import { GET } from "@/app/dashboard-entry/route";
import manifest from "@/app/manifest";
import { isDashboardSignInNavigation } from "@/app/pwa/dashboard-sign-in-navigation";
import { platformAuthCookieName } from "../authentication/platform-auth-cookies";
import { PlatformDiscordSignInService } from "../authentication/platform-discord-sign-in-service";
import { PlatformLoginService } from "../authentication/platform-login-service";
import { TRADERLINK_PLATFORM_SESSION_COOKIE } from "../authentication/platform-session-service";
import { openPlatformDatabase } from "../database/open-platform-database";
import { platformMigrationManifest } from "../database/platform-migration-manifest";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformMembershipRepository } from "../membership/platform-membership-repository";
import { PlatformUserPreferenceRepository } from "./platform-user-preference-repository";

const requestState = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => requestState.headers }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const origin = "https://app.traderslink.pro";
const discordSubject = "123456789012345678";
const discordGuild = "987654321098765432";
const roots: string[] = [];

afterEach(() => {
  vi.unstubAllEnvs();
  requestState.headers = new Headers();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "platform-home-page-"));
  roots.push(root);
  const databasePath = join(root, "test.sqlite");
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", origin);
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", databasePath);
  vi.stubEnv("TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT", discordSubject);
  vi.stubEnv("DISCORD_GUILD_ID", discordGuild);
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_ENABLED", "1");
  const database = openPlatformDatabase({ mode: "initializer", databasePath, forbiddenRepositoryRoots: [] });
  return { database, databasePath };
}

function cookie(token: string) {
  return `${platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)}=${token}`;
}

async function entry(token: string | null, path = "/dashboard-entry") {
  return GET(new NextRequest(origin + path, { headers: { cookie: token ? cookie(token) : "" } }));
}

describe("Platform home page", () => {
  it("migrates existing preferences and resolves saved pages per user on ordinary and installed opens", async () => {
    const { database } = fixture();
    try {
      const upgrade = platformMigrationManifest.findIndex(item => item.migrationId === "0195_platform_home_page_preference");
      runPlatformMigrations(database, { manifest: platformMigrationManifest.slice(0, upgrade) });
      const login = new PlatformLoginService(database);
      const member = login.signInOAuth({ provider: "google", subject: "ordinary-member", displayName: "Trader" });
      const preferences = new PlatformUserPreferenceRepository(database);
      expect(preferences.getActiveUserAppearance(member.session.userId)).toBe("dark");

      runPlatformMigrations(database);
      expect(preferences.getActiveUserAppearance(member.session.userId)).toBe("dark");
      expect(preferences.getActiveUserHomePage(member.session.userId)).toBe("welcome");
      expect((await entry(member.token)).headers.get("location")).toBe(origin + "/home");

      const trader = new PlatformDiscordSignInService(database).signIn({
        authSubject: discordSubject,
        username: "fixture-trader",
        globalDisplayName: "Trader",
        avatarHash: null,
        guildId: discordGuild,
        joinedAtUtc: null,
        roleIds: [],
        guildOwner: false,
      }, { deferDemoActivation: true });

      const at = new Date().toISOString();
      const memberships = new PlatformMembershipRepository(database);
      memberships.synchronizeBuiltInFeatures(trader.userId, at);
      const plan = memberships.createPlan({ actorUserId: trader.userId, planKey: "home-fixture",
        name: "Journal", visibility: "public", atUtc: at, features: [{ featureKey: "journal.access", limitValue: null }],
      });
      memberships.publishPlanVersion({ actorUserId: trader.userId, planVersionId: plan.planVersionId, atUtc: at });
      memberships.grantEntitlement({ actorUserId: trader.userId, userId: trader.userId, planVersionId: plan.planVersionId,
        sourceType: "free_plan", sourceRef: "home-fixture", startsAtUtc: at, endsAtUtc: null, atUtc: at,
      });

      requestState.headers = new Headers({ cookie: cookie(trader.session.token) });
      for (const [homePage, href] of [
        ["trading-workspace", "/trading-workspace"],
        ["scanners", "/scanners"],
        ["screeners", "/screeners"],
      ] as const) {
        expect(await saveHomePage(homePage)).toEqual({ ok: true, homePage });
        expect((await entry(trader.session.token)).headers.get("location")).toBe(origin + href);
      }

      const installed = manifest();
      expect(installed.id).toBe("/workspace");
      expect(installed.start_url).toBe("/dashboard-entry?launch=pwa");
      const installedEntry = await entry(trader.session.token, installed.start_url);
      expect(installedEntry.headers.get("location")).toBe(origin + "/screeners");
      expect(installedEntry.headers.get("cache-control")).toContain("no-store");
      expect(installedEntry.headers.get("vary")).toBe("Cookie");
      expect((await entry(null, installed.start_url)).headers.get("location")).toBe(origin + "/login");
      expect((await entry("invalid-token")).headers.get("location")).toBe("https://traderslink.pro/beta");

      vi.stubEnv("TRADERLINK_STOCK_SCREENERS_ENABLED", "0");
      expect((await entry(trader.session.token)).headers.get("location")).toBe(origin + "/home");
      expect(preferences.getActiveUserHomePage(trader.userId)).toBe("screeners");
      expect(await saveHomePage("screeners")).toMatchObject({ ok: false });
      expect(await saveHomePage("/admin/journal")).toMatchObject({ ok: false });

      expect(await saveHomePage("journal-workspace")).toEqual({ ok: true, homePage: "journal-workspace" });
      const signInEntry = "/dashboard-entry?auth=connected&workspaceRetry=1";
      expect(isDashboardSignInNavigation(new URL(signInEntry, origin))).toBe(true);
      const afterSignIn = new URL((await entry(trader.session.token, signInEntry)).headers.get("location")!);
      expect(afterSignIn.pathname + afterSignIn.search).toBe("/workspace?auth=connected&workspaceRetry=1");
      expect(isDashboardSignInNavigation(afterSignIn)).toBe(true);

      requestState.headers = new Headers({ cookie: cookie(member.token), "x-traderlink-page-path": "/home" });
      expect(await DashboardAdmissionTemplate({ children: "Home" })).toBe("Home");
      requestState.headers.set("x-traderlink-page-path", "/scanners");
      requestState.headers.set("x-traderlink-page-return-to", "/scanners?view=all");
      await expect(DashboardAdmissionTemplate({ children: "scanners" })).rejects.toMatchObject({
        digest: expect.stringContaining("/access-required?returnTo=%2Fscanners%3Fview%3Dall"),
      });
      expect(await saveHomePage("trading-workspace")).toMatchObject({ ok: false });
      expect((await entry(member.token)).headers.get("location")).toBe(origin + "/home");
      expect(preferences.getActiveUserHomePage(trader.userId)).toBe("journal-workspace");

      requestState.headers = new Headers();
      expect(await saveHomePage("welcome")).toMatchObject({ ok: false });
    } finally {
      database.close();
    }
  }, 30000);
});
