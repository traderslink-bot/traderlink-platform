import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET as callbackGET } from "../../../../app/api/auth/discord/callback/route";
import { GET as loginGET } from "../../../../app/api/auth/discord/login/route";
import {
  ACADEMY_OAUTH_PROMPT_COOKIE,
  ACADEMY_OAUTH_STATE_COOKIE,
  ACADEMY_SESSION_COOKIE,
  AcademyProgressStore,
} from "../academy-progress-store";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Discord Academy auth routes", () => {
  it("keeps users with an active Academy session out of Discord OAuth", async () => {
    vi.stubEnv("ACADEMY_PROGRESS_STORAGE", "sqlite");
    vi.stubEnv(
      "TRADER_INTELLIGENCE_DB_PATH",
      join(tmpdir(), `traderslink-academy-auth-${randomUUID()}.sqlite`),
    );

    const store = new AcademyProgressStore();
    await store.upsertUser({
      discordUserId: "discord-1",
      username: "academy-user",
      globalName: "Academy User",
      avatar: null,
      guildId: "guild-1",
      joinedAt: null,
      rawUser: {},
      rawMember: {},
    });
    const session = await store.createSession("discord-1");

    const response = await loginGET(
      new NextRequest("https://traderslink.pro/api/auth/discord/login", {
        headers: {
          cookie: `${ACADEMY_SESSION_COOKIE}=${session.token}`,
        },
      }),
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
    expect(setCookieHeader).toContain("Domain=.traderslink.pro");
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
            ].join("; "),
          },
        },
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://traderslink.pro/api/auth/discord/login?prompt=consent",
    );
  });
});

function getSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  return headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
}
