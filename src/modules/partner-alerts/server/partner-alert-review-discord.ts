import "server-only";

import { COMMUNITY_REVIEW_DISCORD_GUILD_ID, assertCommunityReviewDiscordGuild,
  isCommunityReviewDiscordGuild } from "@/src/modules/communities/server/community-review-discord-guild";
import { createPartnerAlertDiscordChannelCatalog, createPartnerAlertDiscordRoleObserver,
  readPartnerAlertDiscordJson, cancelPartnerAlertDiscordBody, validatePartnerAlertDiscordConfiguration,
  type PartnerAlertDiscordChannelCatalogConfiguration } from "./partner-alert-discord-channel-catalog";
import { createPartnerAlertDiscordRoleRest } from "./partner-alert-discord-role-rest";
import { createPartnerAlertDiscordResourceVerifier } from "./partner-alert-discord-provider-verification";
import { createPartnerAlertDiscordMessageRest } from "./partner-alert-discord-message-rest";
import type { PartnerAlertResourceVerificationTarget } from "./partner-alert-provider-verification";

export function isPartnerAlertReviewDiscordTarget(target: Pick<PartnerAlertResourceVerificationTarget,
  "sourceGuildId" | "destinationGuildId">): boolean {
  return isCommunityReviewDiscordGuild(target.sourceGuildId)
    && isCommunityReviewDiscordGuild(target.destinationGuildId);
}

/** Discover channel metadata only through the approved guild's fresh inventory.
 * Never contact a submitted channel to find out which guild owns it. */
export function createPartnerAlertReviewDiscordTransport(transport: PartnerAlertDiscordChannelCatalogConfiguration["transport"],
  stillCurrent: () => boolean = () => true)
  : PartnerAlertDiscordChannelCatalogConfiguration["transport"] {
  return async (input, init) => {
    const url = new URL(input);
    if (url.origin !== "https://discord.com" || url.username || url.password || url.hash
      || !url.pathname.startsWith("/api/v10/")) throw new Error("Discord review target unavailable.");
    const safeInit = { ...init, redirect: "manual" as const, cache: "no-store" as const };
    const path = url.pathname.slice("/api/v10".length);
    const guild = /^\/guilds\/([^/]+)(?:\/|$)/u.exec(path)?.[1];
    if (guild !== undefined) {
      assertCommunityReviewDiscordGuild(guild);
      return transport(input, safeInit);
    }
    if ((path === "/users/@me" || path === "/gateway/bot") && (init.method ?? "GET") === "GET") {
      return transport(input, safeInit);
    }
    const channel = /^\/channels\/([1-9][0-9]{0,19})(?:\/|$)/u.exec(path)?.[1];
    if (!channel) throw new Error("Discord review endpoint unavailable.");
    const signal = init.signal ?? AbortSignal.timeout(5_000);
    const current = () => !signal.aborted && stillCurrent();
    if (!current()) throw new Error("Discord channel verification expired.");
    const inventory = await transport(`https://discord.com/api/v10/guilds/${COMMUNITY_REVIEW_DISCORD_GUILD_ID}/channels`, {
      method: "GET", signal, headers: init.headers,
      redirect: "manual", cache: "no-store" });
    try {
      if (inventory.status !== 200 || !current()) throw new Error("Discord channel guild unavailable.");
      const channels = await readPartnerAlertDiscordJson(inventory, signal);
      if (!Array.isArray(channels) || channels.length > 500
        || channels.some(row => !row || typeof row !== "object" || Array.isArray(row))) {
        throw new Error("Discord channel inventory unavailable.");
      }
      const matches = channels.filter((row: Record<string, unknown>) => row.id === channel);
      if (matches.length !== 1) throw new Error("Discord channel identity unavailable.");
      const data = matches[0] as Record<string, unknown>;
      assertCommunityReviewDiscordGuild(data.guild_id);
      if (data.type !== 0 && data.type !== 5) throw new Error("Discord channel type unavailable.");
      if (!current()) throw new Error("Discord channel verification expired.");
      if (path === `/channels/${channel}` && (init.method ?? "GET") === "GET") {
        return Response.json(data, { headers: { "cache-control": "no-store" } });
      }
      return transport(input, { ...safeInit, signal });
    } finally {
      cancelPartnerAlertDiscordBody(inventory.body);
    }
  };
}

function guarded(configuration: PartnerAlertDiscordChannelCatalogConfiguration, stillCurrent?: () => boolean) {
  return { ...configuration, transport: createPartnerAlertReviewDiscordTransport(configuration.transport, stillCurrent) };
}

export function createPartnerAlertReviewDiscordChannelCatalog(configuration: PartnerAlertDiscordChannelCatalogConfiguration) {
  const catalog = createPartnerAlertDiscordChannelCatalog(guarded(configuration));
  return (guildId: string, signal: AbortSignal) => {
    assertCommunityReviewDiscordGuild(guildId);
    return catalog(guildId, signal);
  };
}

export function createPartnerAlertReviewDiscordRoleObserver(configuration: PartnerAlertDiscordChannelCatalogConfiguration,
  nowUtc: () => string): ReturnType<typeof createPartnerAlertDiscordRoleObserver> {
  const observe = createPartnerAlertDiscordRoleObserver(guarded(configuration), nowUtc);
  return (target, signal) => isCommunityReviewDiscordGuild(target.guildId) ? observe(target, signal) : Promise.resolve(null);
}

export function createPartnerAlertReviewDiscordRoleRest(configuration: PartnerAlertDiscordChannelCatalogConfiguration,
  scope: Parameters<typeof createPartnerAlertDiscordRoleRest>[1]) {
  assertCommunityReviewDiscordGuild(scope.guildId);
  return createPartnerAlertDiscordRoleRest(guarded(configuration), scope);
}

export function createPartnerAlertReviewDiscordResourceVerifier(configuration: Parameters<typeof createPartnerAlertDiscordResourceVerifier>[0]) {
  const verify = createPartnerAlertDiscordResourceVerifier({ ...configuration,
    transport: createPartnerAlertReviewDiscordTransport(configuration.transport) });
  return (target: PartnerAlertResourceVerificationTarget, signal: AbortSignal) => {
    assertCommunityReviewDiscordGuild(target.sourceGuildId);
    assertCommunityReviewDiscordGuild(target.destinationGuildId);
    return verify(target, signal);
  };
}

export function createPartnerAlertReviewDiscordMessageRest(configuration: PartnerAlertDiscordChannelCatalogConfiguration,
  scope: Parameters<typeof createPartnerAlertDiscordMessageRest>[1]) {
  validatePartnerAlertDiscordConfiguration(configuration);
  const guardedScope: typeof scope = {
    ...scope,
    canReadSource: (guildId, channelId) => isCommunityReviewDiscordGuild(guildId) && scope.canReadSource(guildId, channelId),
    readDestination: (...args) => {
      const target = scope.readDestination(...args);
      return target && isPartnerAlertReviewDiscordTarget(target) ? target : null;
    },
  };
  const rest = (current: () => boolean) => createPartnerAlertDiscordMessageRest(guarded(configuration, current), guardedScope);
  const targetCurrent = (mappingId: string, channelId: string, action: "create" | "edit" | "delete") => {
    const initial = guardedScope.readDestination(mappingId, channelId, action);
    const expected = initial === null ? null : JSON.stringify(initial);
    return () => expected !== null
      && JSON.stringify(guardedScope.readDestination(mappingId, channelId, action)) === expected;
  };
  const write = (input: { mappingId: string; channelId: string; stillCurrent: () => boolean }, action: "create" | "edit" | "delete") => {
    const current = targetCurrent(input.mappingId, input.channelId, action);
    return rest(() => input.stillCurrent() && current());
  };
  return {
    hydrate: (guildId: string, channelId: string, messageId: string, stillCurrent: () => boolean) =>
      rest(() => stillCurrent() && guardedScope.canReadSource(guildId, channelId))
        .hydrate(guildId, channelId, messageId, stillCurrent),
    verifyDestination: (mappingId: string, channelId: string, action: "create" | "edit" | "delete") =>
      rest(targetCurrent(mappingId, channelId, action)).verifyDestination(mappingId, channelId, action),
    create: (input: Parameters<ReturnType<typeof rest>["create"]>[0]) => write(input, "create").create(input),
    edit: (input: Parameters<ReturnType<typeof rest>["edit"]>[0]) => write(input, "edit").edit(input),
    delete: (input: Parameters<ReturnType<typeof rest>["delete"]>[0]) => write(input, "delete").delete(input),
  };
}
