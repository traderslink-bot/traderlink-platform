// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { createPartnerAlertStripeDiscordTestGuild } from "./partner-alert-stripe-discord-test-guild";

afterEach(() => vi.unstubAllGlobals());

it("creates disposable Discord fixtures, checks the full member role set, and restores the baseline", async () => {
  const guildId = "810000000000000001";
  const memberId = "810000000000000002";
  const botId = "810000000000000003";
  const channelId = "810000000000000004";
  const originalRole = "810000000000000005";
  const channelRole = "810000000000000006";
  const sentinel = "810000000000000007";
  const members = new Set([originalRole]);
  const roleIds = [channelRole, sentinel];
  const removedFixtures: string[] = [];
  const fetchMock = vi.fn(async (url: string, request: RequestInit) => {
    const path = new URL(url).pathname.replace("/api/v10", "");
    const guildPath = `/guilds/${guildId}`;
    const memberPath = `${guildPath}/members/${memberId}`;
    if (request.method === "GET" && path === "/users/@me") return Response.json({ id: botId, bot: true });
    if (request.method === "GET" && path === guildPath) return Response.json({ id: guildId });
    if (request.method === "GET" && path === memberPath) return Response.json({ user: { id: memberId }, roles: [...members] });
    if (request.method === "POST" && path === `${guildPath}/roles`) {
      return Response.json({ id: roleIds.shift(), managed: false, permissions: "0" }, { status: 201 });
    }
    if (request.method === "GET" && path === `${guildPath}/channels`) {
      return Response.json([{ id: channelId, guild_id: guildId, type: 0 }]);
    }
    if (request.method === "PUT" && path.startsWith(`${memberPath}/roles/`)) {
      members.add(path.split("/").at(-1)!);
      return new Response(null, { status: 204 });
    }
    if (request.method === "DELETE") {
      const id = path.split("/").at(-1)!;
      expect([channelRole, sentinel]).toContain(id);
      removedFixtures.push(id);
      members.delete(id);
      return new Response(null, { status: 204 });
    }
    throw new Error("Unexpected Discord fixture operation");
  });
  vi.stubGlobal("fetch", fetchMock);
  const fixture = await createPartnerAlertStripeDiscordTestGuild({
    guildId, memberId, botToken: "synthetic-test-bot-token-only",
  });
  try {
    await fixture.prepare();
    await fixture.verify(true);
    members.delete(channelRole);
    await fixture.verify(false);
    members.delete(originalRole);
    await expect(fixture.verify(false)).rejects.toThrow("exact role set");
    members.add(originalRole);
  } finally { await fixture.cleanup(); }
  expect(removedFixtures).toEqual([sentinel, channelRole]);
  expect([...members]).toEqual([originalRole]);
});
