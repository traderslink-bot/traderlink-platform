import { describe, expect, it, vi } from "vitest";

import { createPartnerAlertDiscordResourceVerifier } from "./partner-alert-discord-provider-verification";
import type { PartnerAlertResourceVerificationTarget } from "./partner-alert-provider-verification";

const at = "2026-11-02T12:00:00.000Z";
const target: PartnerAlertResourceVerificationTarget = Object.freeze({
  communityId: "20000000-0000-4000-8000-000000000002",
  sourceGuildId: "200000000000000002", sourceChannelId: "300000000000000003",
  destinationGuildId: "100000000000000001", destinationChannelId: "400000000000000004",
  destinationRoleId: "500000000000000005",
});
const bot = "600000000000000006";
const sourceBotRole = "700000000000000007";
const destinationBotRole = "800000000000000008";
const foreignRole = "900000000000000009";
const bit = (position: number) => BigInt(1) << BigInt(position);
const sourceRead = bit(10) | bit(16);
const botDestination = bit(10) | bit(11) | bit(16) | bit(28);
const subscriberRead = bit(10) | bit(16);
const subscriberWrites = bit(6) | bit(11) | bit(12) | bit(14) | bit(15) | bit(17)
  | bit(35) | bit(36) | bit(38) | bit(45) | bit(46);

function responses(extraDestinationOverwrite: unknown = null) {
  return new Map<string, unknown>([
    ["/users/@me", { id: bot, bot: true }],
    [`/guilds/${target.sourceGuildId}/members/${bot}`, { user: { id: bot }, roles: [sourceBotRole] }],
    [`/guilds/${target.sourceGuildId}/roles`, [
      { id: target.sourceGuildId, position: 0, permissions: sourceRead.toString(), managed: false },
      { id: sourceBotRole, position: 2, permissions: "0", managed: false },
    ]],
    [`/channels/${target.sourceChannelId}`, { id: target.sourceChannelId, guild_id: target.sourceGuildId,
      type: 0, permission_overwrites: [] }],
    [`/guilds/${target.destinationGuildId}/members/${bot}`, { user: { id: bot }, roles: [destinationBotRole] }],
    [`/guilds/${target.destinationGuildId}/roles`, [
      { id: target.destinationGuildId, position: 0, permissions: "0", managed: false },
      { id: target.destinationRoleId, position: 5, permissions: "0", managed: false },
      { id: destinationBotRole, position: 10, permissions: botDestination.toString(), managed: false },
      { id: foreignRole, position: 3, permissions: "0", managed: false },
    ]],
    [`/channels/${target.destinationChannelId}`, { id: target.destinationChannelId,
      guild_id: target.destinationGuildId, type: 0, permission_overwrites: [
        { id: target.destinationGuildId, type: 0, allow: "0", deny: bit(10).toString() },
        { id: target.destinationRoleId, type: 0, allow: subscriberRead.toString(), deny: subscriberWrites.toString() },
        { id: destinationBotRole, type: 0, allow: (bit(10) | bit(11) | bit(16)).toString(), deny: "0" },
        ...(extraDestinationOverwrite === null ? [] : [extraDestinationOverwrite]),
      ] }],
  ]);
}

function fixture(extraDestinationOverwrite: unknown = null, exclusive = true) {
  const data = responses(extraDestinationOverwrite);
  const transport = vi.fn(async (url: string, init: RequestInit) => {
    expect(init.method).toBe("GET"); expect(init.redirect).toBe("manual");
    expect(new Headers(init.headers).get("authorization")).toBe("Bot test-discord-token-1234567890");
    const path = new URL(url).pathname.replace("/api/v10", "");
    const body = data.get(path);
    return body === undefined ? new Response("{}", { status: 404, headers: { "content-type": "application/json" } })
      : new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const isDestinationRoleExclusive = vi.fn(async () => exclusive);
  const verify = createPartnerAlertDiscordResourceVerifier({ botToken: "test-discord-token-1234567890",
    botUserId: bot, messageContentIntentEnabled: true, maximumEvidenceAgeMs: 60_000,
    nowUtc: () => at, transport, isDestinationRoleExclusive });
  return { verify, transport, isDestinationRoleExclusive };
}

describe("Partner Channel Discord resource verification", () => {
  it("qualifies the exact readable source and private read-only managed destination", async () => {
    const f = fixture();
    await expect(f.verify(target, new AbortController().signal)).resolves.toEqual({ ...target,
      sourceTextChannel: true, sourceReadable: true, messageContentAvailable: true,
      destinationReadOnly: true, destinationPrivate: true, destinationRoleManageable: true,
      destinationRoleExclusiveToTradersLink: true, observedAtUtc: at,
      validUntilUtc: "2026-11-02T12:01:00.000Z",
    });
    expect(f.isDestinationRoleExclusive).toHaveBeenCalledWith(target);
    expect(f.transport).toHaveBeenCalledTimes(7);
  });

  it("rejects an alternate non-TradersLink role that can view the destination", async () => {
    const f = fixture({ id: foreignRole, type: 0, allow: bit(10).toString(), deny: "0" });
    await expect(f.verify(target, new AbortController().signal)).rejects.toThrow(/unavailable/);
  });

  it("requires server-owned exclusive-role evidence before any Discord request", async () => {
    const f = fixture(null, false);
    await expect(f.verify(target, new AbortController().signal)).rejects.toThrow(/unavailable/);
    expect(f.transport).not.toHaveBeenCalled();
  });

  it("does no registry or provider work for an already-cancelled request", async () => {
    const f = fixture(); const controller = new AbortController(); controller.abort();
    await expect(f.verify(target, controller.signal)).rejects.toThrow(/cancelled/);
    expect(f.isDestinationRoleExclusive).not.toHaveBeenCalled();
    expect(f.transport).not.toHaveBeenCalled();
  });
});
