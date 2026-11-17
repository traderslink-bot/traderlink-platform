import "server-only";

import { assertCommunityReviewDiscordGuild, isCommunityReviewDiscordGuild } from "@/src/modules/communities/server/community-review-discord-guild";
import { createPartnerAlertDiscordChannelCatalog, createPartnerAlertDiscordRoleObserver,
  readPartnerAlertDiscordJson, cancelPartnerAlertDiscordBody,
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

/** Native Paid boundary. Guild-less message endpoints require a fresh channel
 * metadata read; a database label or submitted channel ID cannot approve a guild. */
export function createPartnerAlertReviewDiscordTransport(transport: PartnerAlertDiscordChannelCatalogConfiguration["transport"])
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
    const metadataPath = `https://discord.com/api/v10/channels/${channel}`;
    const metadata = await transport(metadataPath, { method: "GET", signal, headers: init.headers,
      redirect: "manual", cache: "no-store" });
    try {
      if (!metadata.ok || signal.aborted) throw new Error("Discord channel guild unavailable.");
      const data = await readPartnerAlertDiscordJson(metadata.clone(), signal) as Record<string, unknown>;
      if (data?.id !== channel) throw new Error("Discord channel identity changed.");
      assertCommunityReviewDiscordGuild(data.guild_id);
      if (signal.aborted) throw new Error("Discord channel verification expired.");
      if (url.href === metadataPath && (init.method ?? "GET") === "GET") return metadata;
    } catch (error) {
      cancelPartnerAlertDiscordBody(metadata.body);
      throw error;
    }
    cancelPartnerAlertDiscordBody(metadata.body);
    return transport(input, safeInit);
  };
}

function guarded(configuration: PartnerAlertDiscordChannelCatalogConfiguration) {
  return { ...configuration, transport: createPartnerAlertReviewDiscordTransport(configuration.transport) };
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
  return createPartnerAlertDiscordMessageRest(guarded(configuration), {
    ...scope,
    canReadSource: (guildId, channelId) => isCommunityReviewDiscordGuild(guildId) && scope.canReadSource(guildId, channelId),
    readDestination: (...args) => {
      const target = scope.readDestination(...args);
      return target && isPartnerAlertReviewDiscordTarget(target) ? target : null;
    },
  });
}
