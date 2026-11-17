// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";
import { COMMUNITY_REVIEW_DISCORD_GUILD_ID as guild } from "@/src/modules/communities/server/community-review-discord-guild";
import { createPartnerAlertReviewDiscordTransport, createPartnerAlertReviewDiscordChannelCatalog,
  createPartnerAlertReviewDiscordRoleObserver, createPartnerAlertReviewDiscordRoleRest,
  createPartnerAlertReviewDiscordResourceVerifier, createPartnerAlertReviewDiscordMessageRest } from "./partner-alert-review-discord";
import { createPartnerAlertStripeRolePorts } from "./partner-alert-stripe-role-ports";

const other = "1559172784813514804", channel = "850000000000000001", role = "850000000000000002";
const member = "850000000000000003", bot = "850000000000000004";
const api = "https://discord.com/api/v10";
const inventoryPath = `${api}/guilds/${guild}/channels`;
const channelData = { id: channel, guild_id: guild, type: 0, permission_overwrites: [] };
const target = { communityId: "10000000-0000-4000-8000-000000000001", sourceGuildId: guild,
  sourceChannelId: "850000000000000005", destinationGuildId: guild, destinationChannelId: channel, destinationRoleId: role };
type Transport = (url: string, init: RequestInit) => Promise<Response>;
function config(transport: Transport = vi.fn<Transport>(async () => Response.json({}))) {
  return { botToken: "synthetic-review-discord-token", botUserId: bot, maximumDurationMs: 1000, transport };
}

describe("Paid native Discord review boundary", () => {
  it.each([other, "", undefined, Number(guild)])("denies non-exact guild target %s before I/O", async value => {
    const transport = vi.fn<Transport>(async () => Response.json({}));
    const request = createPartnerAlertReviewDiscordTransport(transport);
    await expect(request(`${api}/guilds/${String(value)}/roles`, { method: "GET" })).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(["GET", "PUT", "DELETE"])("permits exact approved guild %s requests", async method => {
    const transport = vi.fn<Transport>(async () => new Response(null, { status: 204 }));
    const request = createPartnerAlertReviewDiscordTransport(transport);
    await request(`${api}/guilds/${guild}/members/${member}/roles/${role}`, { method });
    expect(transport).toHaveBeenCalledOnce();
  });
  it("rejects changed origin, webhook and unscoped endpoints", async () => {
    const transport = vi.fn<Transport>(async () => Response.json({}));
    const request = createPartnerAlertReviewDiscordTransport(transport);
    for (const url of [`https://discord.com.evil.test/api/v10/guilds/${guild}/roles`,
      `${api}/webhooks/123/token`, `${api}/users/${member}`]) {
      await expect(request(url, { method: "GET" })).rejects.toThrow();
    }
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([other, undefined, Number(guild)])("denies unverified channel guild %s without reading that channel", async actualGuild => {
    const transport = vi.fn<Transport>(async () => Response.json([{ ...channelData, guild_id: actualGuild }]));
    const request = createPartnerAlertReviewDiscordTransport(transport);
    for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
      await expect(request(`${api}/channels/${channel}/messages/123`, { method })).rejects.toThrow();
    }
    expect(transport.mock.calls.map(([url]) => url)).toEqual(Array(4).fill(inventoryPath));
  });
  it("rejects a foreign channel absent from the approved inventory without foreign HTTP reads", async () => {
    const transport = vi.fn<Transport>(async () => Response.json([{ ...channelData, id: role }]));
    const request = createPartnerAlertReviewDiscordTransport(transport);
    await expect(request(`${api}/channels/${channel}`, { method: "GET" })).rejects.toThrow();
    await expect(request(`${api}/channels/${channel}/messages/123`, { method: "DELETE" })).rejects.toThrow();
    expect(transport.mock.calls.map(([url]) => url)).toEqual([inventoryPath, inventoryPath]);
  });
  it("checks approved-guild inventory immediately before each message request", async () => {
    const transport = vi.fn<Transport>(async (url: string) => url === inventoryPath
      ? Response.json([channelData]) : new Response(null, { status: 204 }));
    const request = createPartnerAlertReviewDiscordTransport(transport);
    await request(`${api}/channels/${channel}/messages/123`, { method: "DELETE" });
    expect(transport.mock.calls.map(([url]) => url)).toEqual([
      inventoryPath, `${api}/channels/${channel}/messages/123`,
    ]);
    expect(transport.mock.calls.every(([, init]) => init.redirect === "manual" && init.cache === "no-store")).toBe(true);
  });
  it("returns verified channel metadata from the inventory without another channel HTTP read", async () => {
    const transport = vi.fn<Transport>(async () => Response.json([channelData]));
    const response = await createPartnerAlertReviewDiscordTransport(transport)(`${api}/channels/${channel}`, { method: "GET" });
    expect(await response.json()).toEqual(channelData);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(transport.mock.calls.map(([url]) => url)).toEqual([inventoryPath]);
  });
  it.each([{}, [null], [channelData, channelData], [{ ...channelData, type: 11 }],
    Array(501).fill(channelData)].map(inventory => ({ inventory })))
  ("denies malformed, duplicate, unsupported or oversized inventory %#", async ({ inventory }) => {
    const transport = vi.fn<Transport>(async () => Response.json(inventory));
    await expect(createPartnerAlertReviewDiscordTransport(transport)(`${api}/channels/${channel}/messages`, { method: "POST" })).rejects.toThrow();
    expect(transport.mock.calls.map(([url]) => url)).toEqual([inventoryPath]);
  });
  it("rechecks the inventory on retries rather than trusting prior membership", async () => {
    let present = true;
    const transport = vi.fn<Transport>(async (url: string) => url === inventoryPath
      ? Response.json(present ? [channelData] : []) : new Response(null, { status: 204 }));
    const request = createPartnerAlertReviewDiscordTransport(transport);
    await request(`${api}/channels/${channel}/messages/123`, { method: "DELETE" });
    present = false;
    await expect(request(`${api}/channels/${channel}/messages/123`, { method: "DELETE" })).rejects.toThrow();
    expect(transport.mock.calls.filter(([url]) => url.includes("/messages"))).toHaveLength(1);
    expect(transport.mock.calls.filter(([url]) => url === inventoryPath)).toHaveLength(2);
  });
  it("refuses dispatch after the inventory request is aborted", async () => {
    const controller = new AbortController();
    const transport = vi.fn<Transport>(async () => {
      controller.abort();
      return Response.json([channelData]);
    });
    await expect(createPartnerAlertReviewDiscordTransport(transport)(`${api}/channels/${channel}/messages`, {
      method: "POST", signal: controller.signal,
    })).rejects.toThrow();
    expect(transport.mock.calls.map(([url]) => url)).toEqual([inventoryPath]);
  });
  it.each(["create", "edit", "delete"] as const)("retains the scope check across the final inventory await before %s", async action => {
    let current = true, inventories = 0;
    const transport = vi.fn<Transport>(async (url: string) => {
      if (url === inventoryPath) {
        inventories++;
        if (inventories === (action === "create" ? 1 : 2)) current = false;
        return Response.json([channelData]);
      }
      return Response.json({ id: member, channel_id: channel, author: { id: bot } });
    });
    const rest = createPartnerAlertReviewDiscordMessageRest(config(transport), {
      canReadSource: () => true, readDestination: () => target, verifyPrivateDestination: async () => {},
    });
    const outcome = await rest[action]({ mappingId: "mapping", channelId: channel, messageId: member,
      content: "test", nonce: "a".repeat(25), suppressMentions: true, stillCurrent: () => current });
    expect(outcome.kind).not.toBe("confirmed");
    expect(inventories).toBe(action === "create" ? 1 : 2);
    expect(transport.mock.calls.filter(([, init]) => init.method !== "GET")).toEqual([]);
  });
  it.each(["replacement", "in-place"])("rechecks %s mapping changes after inventory with a live caller ticket", async change => {
    let currentTarget = { ...target };
    const transport = vi.fn<Transport>(async () => {
      if (change === "replacement") currentTarget = { ...target, destinationRoleId: member };
      else currentTarget.destinationRoleId = member;
      return Response.json([channelData]);
    });
    const rest = createPartnerAlertReviewDiscordMessageRest(config(transport), {
      canReadSource: () => true, readDestination: () => currentTarget, verifyPrivateDestination: async () => {},
    });
    const outcome = await rest.create({ mappingId: "mapping", channelId: channel,
      content: "test", nonce: "a".repeat(25), suppressMentions: true, stillCurrent: () => true });
    expect(outcome.kind).not.toBe("confirmed");
    expect(transport.mock.calls.map(([url]) => url)).toEqual([inventoryPath]);
  });
  it.each(["create", "edit", "delete"] as const)("still permits a current approved %s", async action => {
    const transport = vi.fn<Transport>(async (url: string, init) => url === inventoryPath
      ? Response.json([channelData]) : init.method === "DELETE" ? new Response(null, { status: 204 })
        : Response.json({ id: member, channel_id: channel, author: { id: bot } }));
    const rest = createPartnerAlertReviewDiscordMessageRest(config(transport), {
      canReadSource: () => true, readDestination: () => target, verifyPrivateDestination: async () => {},
    });
    expect(await rest[action]({ mappingId: "mapping", channelId: channel, messageId: member,
      content: "test", nonce: "a".repeat(25), suppressMentions: true, stillCurrent: () => true }))
      .toMatchObject({ kind: "confirmed", channelId: channel, messageId: member });
  });
  it("rejects source catalogs and provider verification before the identity read", async () => {
    const transport = vi.fn<Transport>(async () => Response.json({}));
    const catalog = createPartnerAlertReviewDiscordChannelCatalog(config(transport));
    expect(() => catalog(other, AbortSignal.timeout(1000))).toThrow();
    const verify = createPartnerAlertReviewDiscordResourceVerifier({ ...config(transport),
      messageContentIntentEnabled: true, maximumEvidenceAgeMs: 1000,
      nowUtc: () => new Date().toISOString(), isDestinationRoleExclusive: () => true });
    expect(() => verify({ ...target, sourceGuildId: other }, AbortSignal.timeout(1000))).toThrow();
    expect(() => verify({ ...target, destinationGuildId: other }, AbortSignal.timeout(1000))).toThrow();
    expect(transport).not.toHaveBeenCalled();
  });
  it("holds a queued or historical wrong-guild role scope before transport construction", async () => {
    const transport = vi.fn<Transport>(async () => Response.json({}));
    expect(() => createPartnerAlertReviewDiscordRoleRest(config(transport), { guildId: other, roleId: role })).toThrow();
    const observe = createPartnerAlertReviewDiscordRoleObserver(config(transport), () => new Date().toISOString());
    expect(await observe({ guildId: other, discordUserId: member })).toBeNull();
    expect(transport).not.toHaveBeenCalled();
  });
  it("observes the approved exact member and preserves role scoping", async () => {
    const transport = vi.fn<Transport>(async (url: string) => Response.json(url.endsWith("/users/@me")
      ? { id: bot, bot: true } : { user: { id: member }, roles: [role] }));
    const observe = createPartnerAlertReviewDiscordRoleObserver(config(transport), () => "2026-11-17T12:00:00.000Z");
    expect(await observe({ guildId: guild, discordUserId: member })).toMatchObject({ guildId: guild, roleIds: [role] });
    expect(transport.mock.calls.map(([url]) => url)).toEqual([`${api}/users/@me`, `${api}/guilds/${guild}/members/${member}`]);
  });
  it.each(["create", "edit", "delete"] as const)("rejects historical mapping %s outside the guild without I/O", async action => {
    const transport = vi.fn<Transport>(async () => Response.json({}));
    const rest = createPartnerAlertReviewDiscordMessageRest(config(transport), {
      canReadSource: () => true,
      readDestination: () => ({ ...target, sourceGuildId: other }),
      verifyPrivateDestination: async () => {},
    });
    const input = { mappingId: "mapping", channelId: channel, messageId: member,
      content: "test", nonce: "a".repeat(25), suppressMentions: true as const, stillCurrent: () => true };
    expect(await rest[action](input)).toMatchObject({ kind: "not_written" });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(["sourceGuildId", "destinationGuildId"] as const)("rejects an old approved mapping with wrong %s before binding authority", key => {
    const legacy = { ...target, [key]: other };
    const row = { source_guild_id: legacy.sourceGuildId, source_channel_id: legacy.sourceChannelId,
      destination_guild_id: legacy.destinationGuildId, destination_channel_id: channel, destination_role_id: role,
      review_state: "approved", revision: 1, approved_revision: 1, status: "active" };
    const database = { prepare: () => ({ get: () => row }) } as unknown as Database.Database;
    const bindCurrentAuthority = vi.fn(() => null), discordFetch = vi.fn<typeof fetch>();
    const ports = createPartnerAlertStripeRolePorts(database, {
      readOutput: () => ({ discordBotUserId: bot, discordBotToken: "synthetic-token", outputConfigurationRef: "fixture",
        outputBindings: [legacy] }), bindCurrentAuthority, protectedRoleIds: [member],
      nowUtc: () => "2026-11-17T12:00:00.000Z", reportFailure: vi.fn(), discordFetch,
    });
    expect(ports({ scope: { communityId: target.communityId, userId: "buyer", mappingId: "mapping" },
      offerId: "offer", offerVersion: 1 })).toBeNull();
    expect(bindCurrentAuthority).not.toHaveBeenCalled();
    expect(discordFetch).not.toHaveBeenCalled();
  });
});
