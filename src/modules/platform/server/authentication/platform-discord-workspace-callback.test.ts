// @vitest-environment node
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPlatformDatabase } from "../database/open-platform-database";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { GET } from "../../../../../app/api/auth/discord/callback/route";
import { PLATFORM_DISCORD_OAUTH_STATE_COOKIE, PLATFORM_DISCORD_OAUTH_PROMPT_COOKIE, PLATFORM_DISCORD_OAUTH_RETURN_TO_COOKIE } from "./platform-discord-oauth-cookies";
import { PlatformLoginService } from "./platform-login-service";
import { PlatformSessionRepository } from "./platform-session-repository";
import { PlatformSessionService } from "./platform-session-service";
const roots: string[] = [];
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "discord-workspace-callback-")); roots.push(root);
  const path = join(root, randomUUID()+".sqlite");
  const database = openPlatformDatabase({ mode: "initializer", databasePath: path, forbiddenRepositoryRoots: [] });
  try { runPlatformMigrations(database); } finally { database.close(); }
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", path);
  vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "https://app.traderslink.pro");
  vi.stubEnv("DISCORD_CLIENT_ID", "synthetic-client-id"); vi.stubEnv("DISCORD_CLIENT_SECRET", "synthetic-secret");
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/oauth2/token")) return Response.json({ access_token: "synthetic-access", token_type: "Bearer", scope: "identify guilds guilds.members.read", expires_in: 3600 });
    if (url.endsWith("/users/@me")) return Response.json({ id: "123456789012345678", username: "synthetic-trader", global_name: "Trader" });
    if (url.endsWith("/users/@me/guilds")) return Response.json([]);
    if (url.includes("/guilds/")) return Response.json({ message: "Unknown Member", code: 10007 }, { status: 404 });
    throw Error("Unexpected provider request");
  }));
  return path;
}
describe("Discord callback admission without a plan or server membership", () => {
  it.each(["/workspace", "/workspace?panel=journal", "/rules"])("retains the session and applies the landing boundary for %s", async returnTo => {
    const databasePath = fixture();
    const response = await GET(new NextRequest("https://app.traderslink.pro/api/auth/discord/callback?code=synthetic-code&state=synthetic-state", {
      headers: { cookie: `${PLATFORM_DISCORD_OAUTH_STATE_COOKIE}=synthetic-state; ${PLATFORM_DISCORD_OAUTH_PROMPT_COOKIE}=consent; ${PLATFORM_DISCORD_OAUTH_RETURN_TO_COOKIE}=${encodeURIComponent(returnTo)}` },
    }));
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe(returnTo.startsWith("/workspace") ? "/workspace" : "/access-required");
    if (returnTo === "/rules") expect(location.searchParams.get("returnTo")).toBe("/rules");
    if (returnTo.includes("panel=")) expect(location.searchParams.get("panel")).toBe("journal");
    const cookie = response.headers.get("set-cookie")!;
    const token = cookie.match(/tl_platform_session=([^; ,]+)/)?.[1]; expect(token).toBeTruthy();
    const database = openPlatformDatabase({ mode: "runtime", databasePath, forbiddenRepositoryRoots: [] });
    try {
      expect(new PlatformSessionService(new PlatformSessionRepository(database)).resolve(token!)?.authProvider).toBe("discord");
      expect(database.prepare("SELECT count(*) AS n FROM platform_discord_memberships").get()).toEqual({ n: 0 });
    } finally { database.close(); }
  }, 30000);
});


describe("connecting Discord to an existing Google account", () => {
  it.each([["2024-06-01T12:34:56.123456+00:00", "/account/login"], ["2024-06-01T14:34:56.123456+02:00", "/workspace"]])("normalizes the provider membership timestamp %s and returns to %s", async (joinedAt, returnTo) => {
    const databasePath = fixture();
    const database = openPlatformDatabase({ mode: "runtime", databasePath, forbiddenRepositoryRoots: [] });
    const service = new PlatformLoginService(database);
    const google = service.signInOAuth({ provider: "google", subject: "synthetic-google-subject", displayName: "Trader" });
    const intent = service.createLinkIntent(google.token, "discord");
    database.close();
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/oauth2/token")) return Response.json({ access_token: "synthetic-access", token_type: "Bearer", scope: "identify guilds guilds.members.read", expires_in: 3600 });
      if (url.endsWith("/users/@me")) return Response.json({ id: "123456789012345678", username: "synthetic-trader", global_name: "Trader" });
      if (url.endsWith("/users/@me/guilds")) return Response.json([]);
      if (url.includes("/guilds/")) return Response.json({ roles: [], joined_at: joinedAt });
      throw Error("Unexpected provider request");
    }));
    const response = await GET(new NextRequest("https://app.traderslink.pro/api/auth/discord/callback?code=synthetic-code&state=link.synthetic", {
      headers: { cookie: `${PLATFORM_DISCORD_OAUTH_STATE_COOKIE}=link.synthetic; ${PLATFORM_DISCORD_OAUTH_PROMPT_COOKIE}=consent; ${PLATFORM_DISCORD_OAUTH_RETURN_TO_COOKIE}=${encodeURIComponent(returnTo)}; tl_provider_link=${intent}; tl_provider_link_method=discord; tl_platform_session=${google.token}` },
    }));
    expect(new URL(response.headers.get("location")!).pathname).toBe(returnTo);
    expect(new URL(response.headers.get("location")!).searchParams.get("connected")).toBe("discord");
    const token = response.headers.get("set-cookie")?.match(/tl_platform_session=([^; ,]+)/)?.[1];
    expect(token).toBeTruthy();
    const verified = openPlatformDatabase({ mode: "runtime", databasePath, forbiddenRepositoryRoots: [] });
    try {
      expect(new PlatformSessionService(new PlatformSessionRepository(verified)).resolve(token!)?.userId).toBe(google.session.userId);
      expect(verified.prepare("SELECT joined_at_utc FROM platform_discord_memberships").get()).toEqual({ joined_at_utc: "2024-06-01T12:34:56.123Z" });
      expect(verified.prepare("SELECT count(*) AS n FROM platform_users").get()).toEqual({ n: 1 });
      expect(verified.prepare("SELECT count(*) AS n FROM platform_auth_identities WHERE status='active'").get()).toEqual({ n: 2 });
    } finally { verified.close(); }
  }, 30000);
});
