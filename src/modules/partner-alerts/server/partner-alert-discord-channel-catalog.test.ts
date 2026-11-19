import { describe, expect, it } from "vitest";

import { createPartnerAlertDiscordChannelCatalog, createPartnerAlertDiscordRoleObserver } from "./partner-alert-discord-channel-catalog";

const guildId = "200000000000000002";
const botUserId = "300000000000000003";
const readable = (BigInt(1) << BigInt(10)) | (BigInt(1) << BigInt(16));

function response(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
}
function configuration(transport: (url: string, init: RequestInit) => Promise<Response>, maximumDurationMs = 1_000) {
  return { botToken: "x".repeat(40), botUserId, maximumDurationMs, transport };
}

describe("Partner Channel Discord source catalog", () => {
  it("separates selectable channels from unavailable channels using GET requests", async () => {
    const requests: string[] = [];
    const values = new Map<string, unknown>([
      [`/api/v10/guilds/${guildId}`, { id: guildId, name: "Northstar Trading" }],
      ["/api/v10/users/@me", { id: botUserId, bot: true }],
      [`/api/v10/guilds/${guildId}/members/${botUserId}`, { user: { id: botUserId }, roles: [] }],
      [`/api/v10/guilds/${guildId}/roles`, [{ id: guildId, permissions: readable.toString() }]],
      [`/api/v10/guilds/${guildId}/channels`, [
        { id: "400000000000000004", guild_id: guildId, type: 0, name: "Alerts", permission_overwrites: [] },
        { id: "400000000000000005", guild_id: guildId, type: 2, name: "Voice", permission_overwrites: [] },
        { id: "400000000000000006", guild_id: guildId, type: 0, name: "Private", permission_overwrites: [
          { id: guildId, type: 0, allow: "0", deny: (BigInt(1) << BigInt(10)).toString() },
        ] },
        { id: "400000000000000007", guild_id: guildId, type: 5, name: "Broadcasts", permission_overwrites: [] },
        { id: "400000000000000008", guild_id: guildId, type: 4, name: "Category", permission_overwrites: [] },
        { id: "400000000000000009", guild_id: botUserId, type: 0, name: "Foreign", permission_overwrites: [] },
        { id: "400000000000000010", guild_id: guildId, type: 0, name: "Unverified" },
      ]],
    ]);
    const catalog = createPartnerAlertDiscordChannelCatalog(configuration(async (url, init) => {
        expect(init.method).toBe("GET"); requests.push(new URL(url).pathname);
        return response(values.get(new URL(url).pathname));
      }));
    await expect(catalog(guildId, new AbortController().signal)).resolves.toEqual({
      guildName: "Northstar Trading", channels: [
        { channelId: "400000000000000004", name: "Alerts" },
        { channelId: "400000000000000007", name: "Broadcasts" },
      ],
      unavailableChannels: [
        { channelId: "400000000000000006", name: "Private", reason: "missing_bot_permissions" },
        { channelId: "400000000000000010", name: "Unverified", reason: "permissions_unverified" },
        { channelId: "400000000000000005", name: "Voice", reason: "unsupported_type" },
      ],
    });
    expect(requests).toEqual(["/api/v10/users/@me", `/api/v10/guilds/${guildId}/members/${botUserId}`,
      `/api/v10/guilds/${guildId}/roles`, `/api/v10/guilds/${guildId}/channels`, `/api/v10/guilds/${guildId}`]);
    values.set(`/api/v10/guilds/${guildId}`, { id: guildId, name: "Northstar Markets" });
    values.set(`/api/v10/guilds/${guildId}/channels`, [
      { id: "400000000000000004", guild_id: guildId, type: 0, name: "Market alerts", permission_overwrites: [] },
      { id: "400000000000000006", guild_id: guildId, type: 0, name: "Private", permission_overwrites: [] },
    ]);
    await expect(catalog(guildId, new AbortController().signal)).resolves.toEqual({
      guildName: "Northstar Markets", channels: [
        { channelId: "400000000000000004", name: "Market alerts" },
        { channelId: "400000000000000006", name: "Private" },
      ], unavailableChannels: [],
    });
    values.set(`/api/v10/guilds/${guildId}`, { id: botUserId, name: "Wrong guild" });
    await expect(catalog(guildId, new AbortController().signal)).rejects.toThrow("unavailable");
  });

  it("fails closed for a mismatched bot identity", async () => {
    let calls = 0;
    const catalog = createPartnerAlertDiscordChannelCatalog(configuration(async () => {
      calls += 1; return response({ id: "999999999999999999", bot: true });
    }));
    await expect(catalog(guildId, new AbortController().signal)).rejects.toThrow("unavailable");
    expect(calls).toBe(1);
  });

  it("cancels a streaming body that exceeds the byte limit", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(1_000_001)); },
      cancel() { cancelled = true; },
    });
    const catalog = createPartnerAlertDiscordChannelCatalog(configuration(async () =>
      new Response(body, { status: 200, headers: { "content-type": "application/json" } })));
    await expect(catalog(guildId, new AbortController().signal)).rejects.toThrow("unavailable");
    expect(cancelled).toBe(true);
  });

  it("applies one aggregate deadline and aborts the active request", async () => {
    let aborted = false;
    const catalog = createPartnerAlertDiscordChannelCatalog(configuration(async (_url, init) =>
      await new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => { aborted = true; reject(new Error("aborted")); }, { once: true });
      }), 100));
    await expect(catalog(guildId, new AbortController().signal)).rejects.toThrow();
    expect(aborted).toBe(true);
  });

  it("never calls Discord when the caller is already aborted", async () => {
    const caller = new AbortController(); caller.abort(); let calls = 0;
    const catalog = createPartnerAlertDiscordChannelCatalog(configuration(async () => {
      calls += 1; return response({});
    }));
    await expect(catalog(guildId, caller.signal)).rejects.toThrow("unavailable");
    expect(calls).toBe(0);
  });

  it("propagates caller abort while a response body is streaming", async () => {
    const caller = new AbortController(); let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new TextEncoder().encode("{")); },
      cancel() { cancelled = true; },
    });
    const catalog = createPartnerAlertDiscordChannelCatalog(configuration(async () =>
      new Response(body, { status: 200, headers: { "content-type": "application/json" } })));
    const pending = catalog(guildId, caller.signal); caller.abort();
    await expect(pending).rejects.toThrow("unavailable");
    expect(cancelled).toBe(true);
  });

  it.each([
    { user: { id: "999999999999999999" }, roles: [] },
    { user: { id: botUserId }, roles: [guildId, guildId] },
  ])("fails closed for an invalid guild member %#", async member => {
    let calls = 0;
    const values = [{ id: botUserId, bot: true }, member];
    const catalog = createPartnerAlertDiscordChannelCatalog(configuration(async () => response(values[calls++])));
    await expect(catalog(guildId, new AbortController().signal)).rejects.toThrow("unavailable");
    expect(calls).toBe(2);
  });

  it("fails closed when the member role set is not present in the guild role list", async () => {
    let calls = 0;
    const values = [
      { id: botUserId, bot: true },
      { user: { id: botUserId }, roles: ["500000000000000005"] },
      [{ id: guildId, permissions: readable.toString() }],
    ];
    const catalog = createPartnerAlertDiscordChannelCatalog(configuration(async () => response(values[calls++])));
    await expect(catalog(guildId, new AbortController().signal)).rejects.toThrow("unavailable");
    expect(calls).toBe(3);
  });

  it.each<ResponseInit>([
    { status: 403, headers: { "content-type": "application/json" } },
    { status: 200, headers: { "content-type": "text/plain" } },
    { status: 200, headers: { "content-type": "application/json", "content-length": "1000001" } },
  ])("cancels an early-refused response body %#", async init => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
    const catalog = createPartnerAlertDiscordChannelCatalog(configuration(async () => new Response(body, init)));
    await expect(catalog(guildId, new AbortController().signal)).rejects.toThrow("unavailable");
    await Promise.resolve();
    expect(cancelled).toBe(true);
  });
});

describe("Partner Channel Discord role observation", () => {
  const discordUserId = "400000000000000004";
  const roleId = "500000000000000005";
  const now = () => "2026-11-14T12:00:00.000Z";

  it("reads the exact linked member and observes role removal on the next check", async () => {
    let roles = [roleId];
    const observe = createPartnerAlertDiscordRoleObserver(configuration(async (url, init) => {
      expect(init.method).toBe("GET");
      expect(init.redirect).toBe("manual");
      const target = new URL(url);
      expect(target.origin).toBe("https://discord.com");
      if (target.pathname === "/api/v10/users/@me") return response({ id: botUserId, bot: true });
      expect(target.pathname).toBe(`/api/v10/guilds/${guildId}/members/${discordUserId}`);
      return response({ user: { id: discordUserId }, roles });
    }), now);
    await expect(observe({ guildId, discordUserId })).resolves.toMatchObject({
      guildId, discordUserId, roleIds: [roleId], validUntilUtc: "2026-11-14T12:00:15.000Z",
    });
    roles = [];
    await expect(observe({ guildId, discordUserId })).resolves.toMatchObject({ roleIds: [] });
  });

  it("rejects a mismatched member response instead of using its roles", async () => {
    const observe = createPartnerAlertDiscordRoleObserver(configuration(async url =>
      url.endsWith("/users/@me") ? response({ id: botUserId, bot: true })
        : response({ user: { id: botUserId }, roles: [roleId] })), now);
    await expect(observe({ guildId, discordUserId })).resolves.toBeNull();
  });
});
