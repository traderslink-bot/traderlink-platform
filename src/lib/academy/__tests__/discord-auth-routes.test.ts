import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET as callbackGET } from "../../../../app/api/auth/discord/callback/route";
import { GET as loginGET } from "../../../../app/api/auth/discord/login/route";
import {
  ACADEMY_OAUTH_PROMPT_COOKIE,
  ACADEMY_OAUTH_RETURN_TO_COOKIE,
  ACADEMY_OAUTH_STATE_COOKIE,
} from "../academy-progress-store";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { TRADERLINK_PLATFORM_SESSION_COOKIE } from "@/src/modules/platform/server/authentication/platform-session-service";

const roots: string[] = [];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("Discord Academy auth routes", () => {
  it("keeps users with an active Platform session out of Discord OAuth", async () => {
    const sessionToken = createPlatformSession({ roles: [] });

    const response = await loginGET(
      new NextRequest(
        "https://traderslink.pro/api/auth/discord/login?returnTo=%2Facademy%2F",
        {
          headers: {
            cookie: `${TRADERLINK_PLATFORM_SESSION_COOKIE}=${sessionToken}`,
          },
        },
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/academy/",
    );
  });

  it("starts Discord OAuth silently and shares state across TradersLink hosts", async () => {
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");

    const response = await loginGET(
      new NextRequest("https://traderslink.pro/api/auth/discord/login"),
    );
    const location = response.headers.get("location");
    const redirectUrl = new URL(location ?? "");

    expect(redirectUrl.origin).toBe("https://discord.com");
    expect(redirectUrl.searchParams.get("prompt")).toBe("none");

    const setCookieHeader = getSetCookieHeaders(response).join("\n");
    expect(setCookieHeader).toContain(ACADEMY_OAUTH_STATE_COOKIE);
    expect(setCookieHeader).toContain(`${ACADEMY_OAUTH_PROMPT_COOKIE}=none`);
    expect(setCookieHeader).toContain(
      `${ACADEMY_OAUTH_RETURN_TO_COOKIE}=%2Fwatchlist`,
    );
    expect(setCookieHeader).toContain("Domain=.traderslink.pro");
    expect(setCookieHeader).toContain(
      `${ACADEMY_OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0`,
    );
  });

  it("refreshes Discord roles when an Academy member without Premium requests the watchlist", async () => {
    const sessionToken = createPlatformSession({ roles: [] });
    vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "200");
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");

    const response = await loginGET(
      new NextRequest(
        "https://traderslink.pro/api/auth/discord/login?returnTo=%2Fwatchlist%2FALBT",
        {
          headers: {
            cookie: `${TRADERLINK_PLATFORM_SESSION_COOKIE}=${sessionToken}`,
          },
        },
      ),
    );

    const authorizeUrl = new URL(response.headers.get("location") ?? "");
    expect(authorizeUrl.origin).toBe("https://discord.com");
    expect(authorizeUrl.searchParams.get("prompt")).toBe("consent");
    expect(authorizeUrl.searchParams.get("scope")).toContain("guilds.members.read");

    const setCookieHeader = getSetCookieHeaders(response).join("\n");
    expect(setCookieHeader).toContain(`${ACADEMY_OAUTH_PROMPT_COOKIE}=consent`);
  });

  it("reuses a Premium member session for the requested watchlist page", async () => {
    const sessionToken = createPlatformSession({ roles: ["200"] });
    vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "200");

    const response = await loginGET(
      new NextRequest(
        "https://traderslink.pro/api/auth/discord/login?returnTo=%2Fwatchlist%2FALBT",
        {
          headers: {
            cookie: `${TRADERLINK_PLATFORM_SESSION_COOKIE}=${sessionToken}`,
          },
        },
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/watchlist/ALBT",
    );
  });

  it("falls back to a consent prompt when silent Discord OAuth is unavailable", async () => {
    const response = await callbackGET(
      new NextRequest(
        "https://traderslink.pro/api/auth/discord/callback?error=consent_required&state=state-1",
        {
          headers: {
            cookie: [
              `${ACADEMY_OAUTH_STATE_COOKIE}=state-1`,
              `${ACADEMY_OAUTH_PROMPT_COOKIE}=none`,
              `${ACADEMY_OAUTH_RETURN_TO_COOKIE}=/watchlist/ALBT`,
            ].join("; "),
          },
        },
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/api/auth/discord/login?prompt=consent&returnTo=%2Fwatchlist%2FALBT",
    );

    const setCookieHeader = getSetCookieHeaders(response).join("\n");
    expect(getSetCookieHeaders(response).some((cookie) =>
      cookie.includes(`${ACADEMY_OAUTH_STATE_COOKIE}=;`) &&
      cookie.includes("Max-Age=0") &&
      cookie.includes("Domain=.traderslink.pro")
    )).toBe(true);
    expect(setCookieHeader).toContain(
      `${ACADEMY_OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0`,
    );
  });

  it("rejects external return targets instead of creating an open redirect", async () => {
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");

    const response = await loginGET(
      new NextRequest(
        "https://traderslink.pro/api/auth/discord/login?returnTo=https%3A%2F%2Fevil.example%2Fsteal",
      ),
    );

    const setCookieHeader = getSetCookieHeaders(response).join("\n");
    expect(setCookieHeader).toContain(
      `${ACADEMY_OAUTH_RETURN_TO_COOKIE}=%2Fwatchlist`,
    );
  });

  it("allows every server member into Academy without requiring Premium", async () => {
    createPlatformDatabase();
    stubDiscordOAuth({ roles: [] });
    vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "200");

    const response = await callbackGET(
      callbackRequest("/academy/getting-started"),
    );

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/academy/getting-started?auth=connected",
    );
    expect(getSetCookieHeaders(response).join("\n")).toContain(
      TRADERLINK_PLATFORM_SESSION_COOKIE,
    );
  });

  it("creates a site session but blocks a non-Premium member from the watchlist", async () => {
    createPlatformDatabase();
    stubDiscordOAuth({ roles: [] });
    vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "200");

    const response = await callbackGET(callbackRequest("/watchlist/ALBT"));

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/watchlist/ALBT?auth=premium-required",
    );
    expect(getSetCookieHeaders(response).join("\n")).toContain(
      TRADERLINK_PLATFORM_SESSION_COOKIE,
    );
  });

  it("returns a Premium server member to the requested watchlist page", async () => {
    createPlatformDatabase();
    stubDiscordOAuth({ roles: ["200"] });
    vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "200");

    const response = await callbackGET(callbackRequest("/watchlist/ALBT"));

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/watchlist/ALBT?auth=connected",
    );
    expect(getSetCookieHeaders(response).join("\n")).toContain(
      TRADERLINK_PLATFORM_SESSION_COOKIE,
    );
  });

  it("returns the Discord server owner to the requested watchlist page", async () => {
    createPlatformDatabase();
    stubDiscordOAuth({ roles: [], owner: true });
    vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "200");

    const response = await callbackGET(callbackRequest("/watchlist/ALBT"));

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/watchlist/ALBT?auth=connected",
    );
    expect(getSetCookieHeaders(response).join("\n")).toContain(
      TRADERLINK_PLATFORM_SESSION_COOKIE,
    );
  });
});

function createPlatformDatabase(): string {
  const root = mkdtempSync(join(tmpdir(), "traderlink-discord-route-"));
  roots.push(root);
  const databasePath = join(root, `${randomUUID()}.sqlite`);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath,
    forbiddenRepositoryRoots: [],
  });
  try {
    runPlatformMigrations(database);
  } finally {
    database.close();
  }
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", databasePath);
  vi.stubEnv("DISCORD_GUILD_ID", "1433570740430573642");
  return databasePath;
}

function createPlatformSession({
  roles,
  owner = false,
}: {
  roles: string[];
  owner?: boolean;
}): string {
  const databasePath = createPlatformDatabase();
  const database = openPlatformDatabase({
    mode: "runtime",
    databasePath,
    forbiddenRepositoryRoots: [],
  });
  try {
    return new PlatformDiscordSignInService(database).signIn({
      authSubject: "123456789012345678",
      username: "server-member",
      globalDisplayName: "Server Member",
      avatarHash: null,
      guildId: "1433570740430573642",
      roleIds: roles,
      guildOwner: owner,
      joinedAtUtc: "2026-07-21T00:00:00.000Z",
    }).session.token;
  } finally {
    database.close();
  }
}

function callbackRequest(returnTo: string): NextRequest {
  return new NextRequest(
    "https://traderslink.pro/api/auth/discord/callback?code=oauth-code&state=state-1",
    {
      headers: {
        cookie: [
          `${ACADEMY_OAUTH_STATE_COOKIE}=state-1`,
          `${ACADEMY_OAUTH_PROMPT_COOKIE}=consent`,
          `${ACADEMY_OAUTH_RETURN_TO_COOKIE}=${encodeURIComponent(returnTo)}`,
        ].join("; "),
      },
    },
  );
}

function stubDiscordOAuth({
  roles,
  owner = false,
}: {
  roles: string[];
  owner?: boolean;
}): void {
  vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
  vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          access_token: "access-token",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "identify guilds guilds.members.read",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "discord-member",
          username: "server-member",
          global_name: "Server Member",
          avatar: null,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ joined_at: "2026-07-21T00:00:00.000Z", roles }),
      )
      .mockResolvedValueOnce(
        Response.json([
          {
            id: "1433570740430573642",
            name: "TradersLink",
            owner,
          },
        ]),
      ),
  );
}

function getSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  return headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
}
