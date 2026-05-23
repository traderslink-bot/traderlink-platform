import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildDiscordAuthorizeUrl,
  resolveDiscordCurrentGuildMembership,
  shouldRetryDiscordOAuthWithConsent,
  type DiscordOAuthConfig,
} from "../discord-oauth";

const config: DiscordOAuthConfig = {
  clientId: "client-id",
  clientSecret: "client-secret",
  guildId: "guild-1",
  redirectUri: "https://traderslink.pro/api/auth/discord/callback",
  inviteUrl: "https://discord.gg/example",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Discord Academy OAuth helpers", () => {
  it("requests both guild membership and guild list scopes", () => {
    const url = new URL(
      buildDiscordAuthorizeUrl({
        config,
        prompt: "none",
        state: "state-1",
      }),
    );

    expect(url.searchParams.get("scope")).toBe(
      "identify guilds guilds.members.read",
    );
  });

  it("can reuse prior Discord authorization without another consent screen", () => {
    const url = new URL(
      buildDiscordAuthorizeUrl({
        config,
        prompt: "none",
        state: "state-1",
      }),
    );

    expect(url.searchParams.get("prompt")).toBe("none");
  });

  it("can force Discord consent after silent authorization is unavailable", () => {
    const url = new URL(
      buildDiscordAuthorizeUrl({
        config,
        prompt: "consent",
        state: "state-1",
      }),
    );

    expect(url.searchParams.get("prompt")).toBe("consent");
  });

  it("only retries OAuth with consent after a silent authorization failure", () => {
    expect(
      shouldRetryDiscordOAuthWithConsent({
        error: "consent_required",
        prompt: "none",
      }),
    ).toBe(true);
    expect(
      shouldRetryDiscordOAuthWithConsent({
        error: "access_denied",
        prompt: "none",
      }),
    ).toBe(false);
    expect(
      shouldRetryDiscordOAuthWithConsent({
        error: "consent_required",
        prompt: "consent",
      }),
    ).toBe(false);
  });

  it("falls back to the user guild list when member lookup is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 403 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: "guild-1", name: "TradersLink" }],
        }),
    );

    await expect(
      resolveDiscordCurrentGuildMembership({
        accessToken: "token",
        guildId: "guild-1",
      }),
    ).resolves.toEqual({ joined_at: null });
  });

  it("returns null when neither membership check finds the guild", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: "guild-2", name: "Other server" }],
        }),
    );

    await expect(
      resolveDiscordCurrentGuildMembership({
        accessToken: "token",
        guildId: "guild-1",
      }),
    ).resolves.toBeNull();
  });
});
