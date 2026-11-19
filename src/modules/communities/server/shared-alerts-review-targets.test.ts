// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { isCommunityReviewDiscordGuild } from "./community-review-discord-guild";
import { SharedAlertsDiscord } from "./shared-alerts-discord";
import { isSharedAlertReviewGuild, isSharedAlertReviewTarget } from "./shared-alerts-review-targets";

const tests = "1559172784813514803", main = "1433570740430573642";
const designated = ["1546033958448529508", "1546034056725008385", "1546033844468187156"];
const ordinary = "1433570740430573999", bot = "1554300060483715162";

describe("Shared-only production review destinations", () => {
  it("keeps the generic Community policy unchanged while admitting only the two Shared metadata guilds", () => {
    expect(isCommunityReviewDiscordGuild(main)).toBe(false);
    expect(isCommunityReviewDiscordGuild(tests)).toBe(true);
    expect(isSharedAlertReviewGuild(main)).toBe(true);
    expect(isSharedAlertReviewGuild(tests)).toBe(true);
    expect(isSharedAlertReviewGuild("1")).toBe(false);
    expect(isSharedAlertReviewGuild(undefined)).toBe(false);
  });

  it("limits Main to exact designated channels and requires a valid Tests channel ID", () => {
    for (const channel of designated) expect(isSharedAlertReviewTarget(main, channel)).toBe(true);
    expect(isSharedAlertReviewTarget(main, ordinary)).toBe(false);
    expect(isSharedAlertReviewTarget("1", designated[0])).toBe(false);
    expect(isSharedAlertReviewTarget(tests, "1559172786176401410")).toBe(true);
    for (const invalid of ["", "../messages", "1?x=1", "1".repeat(33), null]) expect(isSharedAlertReviewTarget(tests, invalid)).toBe(false);
  });

  it("filters ordinary Main channels before an Administrator permission shortcut", async () => {
    const request = vi.fn(async (resource: Parameters<typeof fetch>[0]) => {
      const pathname = new URL(String(resource)).pathname;
      if (pathname === "/api/v10/users/@me") return Response.json({ id: bot });
      if (pathname === `/api/v10/guilds/${main}/channels`) return Response.json([...designated, ordinary].map(id => ({ id, guild_id: main, name: id, type: 0, permission_overwrites: [] })));
      if (pathname === `/api/v10/guilds/${main}/roles`) return Response.json([{ id: main, permissions: "8" }]);
      if (pathname === `/api/v10/guilds/${main}/members/${bot}`) return Response.json({ roles: [] });
      throw new Error(`Unexpected metadata path: ${pathname}`);
    });
    const discord = new SharedAlertsDiscord("isolated-test-token", request as typeof fetch);
    expect((await discord.channels(main)).map(channel => channel.channelId).sort()).toEqual([...designated].sort());
    const count = request.mock.calls.length;
    await expect(discord.verifyChannel(main, ordinary)).rejects.toMatchObject({ code: "unavailable" });
    expect(request).toHaveBeenCalledTimes(count);
  });

  it("still denies a designated Main channel when the bot cannot send or read history", async () => {
    const request = vi.fn(async (resource: Parameters<typeof fetch>[0]) => {
      const pathname = new URL(String(resource)).pathname;
      if (pathname === "/api/v10/users/@me") return Response.json({ id: bot });
      if (pathname.endsWith("/channels")) return Response.json([{ id: designated[0], guild_id: main, name: "alerts", type: 0, permission_overwrites: [] }]);
      if (pathname.endsWith("/roles")) return Response.json([{ id: main, permissions: "1024" }]);
      if (pathname.endsWith(`/members/${bot}`)) return Response.json({ roles: [] });
      throw new Error("Unexpected metadata request");
    });
    const discord = new SharedAlertsDiscord("isolated-test-token", request as typeof fetch);
    expect(await discord.channels(main)).toEqual([]);
    await expect(discord.verifyChannel(main, designated[0])).rejects.toMatchObject({ code: "channel_unavailable" });
  });
});
