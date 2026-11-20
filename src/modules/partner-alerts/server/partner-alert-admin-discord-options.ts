import "server-only";
import { partnerAlertText } from "../contracts/partner-alert-validation";
import { readPartnerAlertDiscordJson } from "./partner-alert-discord-channel-catalog";
import { createPartnerAlertReviewDiscordResourceVerifier, isPartnerAlertReviewDiscordTarget } from "./partner-alert-review-discord";
import { partnerAlertOutputBindingMatches, type PartnerAlertDiscordOutputConfiguration } from "./partner-alert-provider-runtime-configuration";
import type { PartnerAlertMetadataPermit } from "./partner-alert-request-writer";

export type PartnerAlertDiscordOption = Readonly<{ channelId: string; channelName: string | null;
  roleId: string; roleName: string | null; available: boolean; reason: string | null }>;

/** Compose the EXISTING full pair verifier over one bounded actual metadata snapshot.
 * The cache stores only actual Discord JSON; no permissions, receipts or inventory are synthesized.
 * List membership is presentation, never an approval or role capability. */
export async function readPartnerAlertAdminDiscordOptions(input: Readonly<{
  permit: PartnerAlertMetadataPermit; configuration: PartnerAlertDiscordOutputConfiguration;
  messageContentEnabled: boolean; signal: AbortSignal;
  transport: (url: string, init: RequestInit) => Promise<Response>;
}>): Promise<readonly PartnerAlertDiscordOption[]> {
  const { permit, configuration, signal } = input;
  if (!input.messageContentEnabled || !permit.sourceChannelId || !isPartnerAlertReviewDiscordTarget(permit)) {
    throw Error("Receiving choices unavailable.");
  }
  const bindings = configuration.outputBindings.filter(row => row.communityId === permit.communityId
    && row.sourceGuildId === permit.sourceGuildId && row.sourceChannelId === permit.sourceChannelId
    && row.destinationGuildId === permit.destinationGuildId);
  const cache = new Map<string, unknown>();
  let metadataFailed = false;
  const transport = async (url: string, init: RequestInit): Promise<Response> => {
    if (metadataFailed || signal.aborted || (init.method ?? "GET") !== "GET") throw Error("Receiving choices expired.");
    if (!cache.has(url)) {
      if (cache.size >= 16) throw Error("Receiving metadata limit exceeded.");
      try {
        const response = await input.transport(url, { ...init, signal });
        if (response.status !== 200) { void response.body?.cancel().catch(() => undefined); throw Error("Receiving metadata unavailable."); }
        cache.set(url, await readPartnerAlertDiscordJson(response, signal));
      } catch (error) { metadataFailed = true; throw error; }
    }
    return Response.json(cache.get(url));
  };
  const verify = createPartnerAlertReviewDiscordResourceVerifier({ botToken: configuration.discordBotToken,
    botUserId: configuration.discordBotUserId, messageContentIntentEnabled: true,
    maximumEvidenceAgeMs: configuration.discordMaximumEvidenceAgeMs, nowUtc: () => new Date().toISOString(),
    transport, isDestinationRoleExclusive: target => partnerAlertOutputBindingMatches(configuration.outputBindings, target) });
  const name = (raw: unknown, id: string): string | null => {
    const row = Array.isArray(raw) ? raw.find(value => value && typeof value === "object" && value.id === id) : null;
    try { return row ? partnerAlertText(row.name, "discordName", 100) : null; } catch { return null; }
  };
  const options: PartnerAlertDiscordOption[] = [];
  for (const target of bindings) {
    let available = false;
    try { await verify(target, signal); available = true; } catch { if (signal.aborted) throw Error("Receiving choices expired."); }
    const channelName = name(cache.get(`https://discord.com/api/v10/guilds/${target.destinationGuildId}/channels`), target.destinationChannelId);
    const roleName = name(cache.get(`https://discord.com/api/v10/guilds/${target.destinationGuildId}/roles`), target.destinationRoleId);
    available = available && channelName !== null && roleName !== null;
    options.push(Object.freeze({ channelId: target.destinationChannelId, channelName,
      roleId: target.destinationRoleId, roleName, available, reason: available ? null
        : "Could not verify this pair. Check channel privacy and read-only access, the bot’s role hierarchy, and exclusive use of the dedicated role." }));
  }
  return Object.freeze(options);
}
