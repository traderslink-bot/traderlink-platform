import { beforeEach, expect, it, vi } from "vitest";
import type { HostedPaidQaManifest, hostedQaRuntime } from "./partner-alert-hosted-qa-authority";
import type { PlatformPremiumNativePurchase } from "../../platform/server/membership/platform-premium-whop-native";
const state = vi.hoisted(() => ({ active: true, abort: new AbortController(), blocked: "", spent: [] as string[], destinations: new Map<string, string>(),
  manifest: null as unknown as HostedPaidQaManifest, runtime: null as unknown as ReturnType<typeof hostedQaRuntime> }));
vi.mock("server-only", () => ({}));
// Transport policy unit tests only. Actual issuer/Core/journal have native tests.
vi.mock("./partner-alert-hosted-qa-authority", () => ({
  assertPartnerAlertHostedQaCurrent: () => { if (!state.active) throw new Error("expired"); },
  hostedQaManifest: () => state.manifest, hostedQaRuntime: () => state.runtime, hostedQaPremiumReadToken: () => "unit-premium",
  hostedQaSignal: () => state.abort.signal,
  reserveHostedQaBudget: (_cap: unknown, counter: string) => { if (state.blocked === counter) throw new Error("budget"); state.spent.push(counter); },
  hostedQaKnownSource: (_cap: unknown, channel: string, id: string) => channel === "11" && id === "91",
  ownsHostedQaNonce: (_cap: unknown, nonce: string) => nonce === "a".repeat(25),
  ownsHostedQaDestination: (_cap: unknown, channel: string, id: string) => state.destinations.get(id) === channel,
  recordHostedQaDestination: (_cap: unknown, channel: string, id: string) => state.destinations.set(id, channel),
}));
import { createPartnerAlertHostedQaDiscordTransport, createPartnerAlertHostedQaWhopTransport } from "./partner-alert-hosted-qa-transports";
const cap = { kind: "hosted_paid_qa_authority" as const };
const purchase = { offer: { environment: "sandbox", scopeRef: "premium", accountId: "biz_unit", productId: "prod_unit", planId: "plan_unit" },
  payer: { kind: "bound", whopUserId: "user_unit", whopUserRefHmac: "a".repeat(64), linkId: "10000000-0000-4000-8000-000000000001" } } as PlatformPremiumNativePurchase;
beforeEach(() => {
  state.active = true; state.abort = new AbortController(); state.blocked = ""; state.spent = []; state.destinations.clear();
  state.manifest = { mode: "roles", guildId: "1559172784813514803", botUserId: "1554300060483715162", buyerUserId: "buyer", buyerDiscordUserId: "123", permittedAuthorId: "124",
    bindings: [{ mappingId: "mapping", sourceChannelId: "11", destinationChannelId: "12", roleId: "13" }], protectedRoleIds: ["14"] } as unknown as HostedPaidQaManifest;
  state.runtime = { trusted: { readCurrentConfiguration: () => ({ discordBotToken: "unit-bot" }) },
    core: { runForUsers: (_ids: string[], fn: () => unknown) => fn(), memberRepository: () => ({
      resolveUserAuthority: () => ({ kind: "linked", authorityKey: "authority" }), captureV2: () => ({ kind: "snapshot", ticket: {} }),
      nativePurchaseV2: () => ({ kind: "purchase", purchase }),
    }) } } as unknown as ReturnType<typeof hostedQaRuntime>;
});
const bot = { authorization: "Bot unit-bot" };
it.each([
  ["https://discord.com/api/v10/guilds/999/members/123/roles/13", "PUT"],
  ["https://discord.com/api/v10/guilds/1559172784813514803/members/999/roles/13", "PUT"],
  ["https://discord.com/api/v10/guilds/1559172784813514803/members/123/roles/14", "DELETE"],
  ["https://discord.com/api/v10/channels/999/messages", "POST"],
  ["https://foreign.example.invalid/api/v10/users/@me", "GET"],
])("rejects out-of-scope endpoint before HTTP %s", async (url, method) => {
  const fetch = vi.fn<typeof globalThis.fetch>(); const transport = createPartnerAlertHostedQaDiscordTransport(cap, fetch);
  await expect(transport(url, { method, headers: bot })).rejects.toThrow(); expect(fetch).not.toHaveBeenCalled();
});
it("spends a role budget before the real adapter and preserves the exact role/member path", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => { expect(state.spent).toEqual(["http", "roleWrites"]); expect(init?.redirect).toBe("manual"); return new Response(null, { status: 204 }); });
  await createPartnerAlertHostedQaDiscordTransport(cap, fetch)("https://discord.com/api/v10/guilds/1559172784813514803/members/123/roles/13", { method: "PUT", headers: bot });
  expect(fetch).toHaveBeenCalledOnce();
});
it("never starts an HTTP effect when the effect budget or cancellation has ended", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(); const transport = createPartnerAlertHostedQaDiscordTransport(cap, fetch);
  state.blocked = "roleWrites";
  await expect(transport("https://discord.com/api/v10/guilds/1559172784813514803/members/123/roles/13", { method: "PUT", headers: bot })).rejects.toThrow("budget");
  state.blocked = ""; const abort = new AbortController(); abort.abort();
  await expect(transport("https://discord.com/api/v10/users/@me", { headers: bot, signal: abort.signal })).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
it("holds a response when its actual parent ends during the await", async () => {
  const transport = createPartnerAlertHostedQaDiscordTransport(cap, async () => { state.active = false; return Response.json({ id: "123" }); });
  await expect(transport("https://discord.com/api/v10/users/@me", { headers: bot })).rejects.toThrow("expired");
});
it("only accepts a tracked nonce and suppressed mentions before a message send", async () => {
  state.manifest = { ...state.manifest, mode: "mirroring" };
  const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({ id: "92", channel_id: "12", author: { id: state.manifest.botUserId }, nonce: "a".repeat(25) }));
  const transport = createPartnerAlertHostedQaDiscordTransport(cap, fetch);
  const body = { content: "Synthetic QA", allowed_mentions: { parse: [] }, flags: 4, nonce: "a".repeat(25), enforce_nonce: true };
  await expect(transport("https://discord.com/api/v10/channels/12/messages", { method: "POST", headers: bot, body: JSON.stringify({ ...body, nonce: "b".repeat(25) }) })).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
  await transport("https://discord.com/api/v10/channels/12/messages", { method: "POST", headers: bot, body: JSON.stringify(body) });
  expect(state.destinations.get("92")).toBe("12"); expect(fetch).toHaveBeenCalledOnce();
});
it("refuses a different bot credential without using it", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  await expect(createPartnerAlertHostedQaDiscordTransport(cap, fetch)("https://discord.com/api/v10/users/@me", { headers: { authorization: "Bot another" } })).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
it("Whop keeps the native buyer/account, pinned version and GET-only sandbox boundary", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({}));
  const transport = createPartnerAlertHostedQaWhopTransport(cap, purchase, fetch);
  const headers = { authorization: "Bearer unit-premium", "api-version-date": "2026-10-27-2" };
  await expect(transport("https://api.whop.com/api/v1/memberships?account_id=biz_unit&user_id=user_unit&product_ids=prod_unit", { headers })).rejects.toThrow();
  await expect(transport("https://sandbox-api.whop.com/api/v1/memberships?account_id=biz_unit&user_id=user_other&product_ids=prod_unit", { headers })).rejects.toThrow();
  await expect(transport("https://sandbox-api.whop.com/api/v1/memberships?account_id=biz_unit&account_id=biz_other&user_id=user_unit&product_ids=prod_unit", { headers })).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
  await transport("https://sandbox-api.whop.com/api/v1/memberships?account_id=biz_unit&user_id=user_unit&product_ids=prod_unit", { headers });
  expect(fetch).toHaveBeenCalledOnce();
});
