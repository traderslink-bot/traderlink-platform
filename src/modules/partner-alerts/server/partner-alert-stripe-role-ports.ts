import { isCommunityReviewDiscordGuild } from "@/src/modules/communities/server/community-review-discord-guild";
import { createPartnerAlertReviewDiscordRoleRest as createPartnerAlertDiscordRoleRest } from "./partner-alert-review-discord";
import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

import { createPartnerAlertManagedRoleTransport } from "./partner-alert-managed-role-transport";
import { partnerAlertOutputBindingMatches, type PartnerAlertProviderOutputBinding } from "./partner-alert-provider-runtime-configuration";
import { PartnerAlertRoleWorker, type PartnerAlertRoleAuthority } from "./partner-alert-role-worker";
import type { PartnerAlertStripeRoleIntent } from "./partner-alert-stripe-role-reconciliation";
import type { PartnerAlertSubscriberOffer } from "./partner-alert-subscriber-access";

type OutputConfiguration = Readonly<{
  discordBotUserId: string;
  discordBotToken: string;
  outputConfigurationRef: string;
  outputBindings: readonly PartnerAlertProviderOutputBinding[];
}>;

export function createPartnerAlertStripeRolePorts(db: Database.Database, input: Readonly<{
  readOutput: () => OutputConfiguration | null;
  bindCurrentAuthority: (target: PartnerAlertSubscriberOffer) => PartnerAlertRoleAuthority | null;
  protectedRoleIds: readonly string[];
  nowUtc: () => string;
  reportFailure: () => void;
  discordFetch?: typeof fetch;
}>) {
  return (intent: Pick<PartnerAlertStripeRoleIntent, "scope" | "offerId" | "offerVersion">) => {
    const output = input.readOutput();
    if (!output || !input.protectedRoleIds.length || input.protectedRoleIds.some(id => !/^[1-9][0-9]{0,19}$/u.test(id))) return null;
    const snapshot = JSON.stringify(output);
    const readBinding = (mappingId: string) => {
      if (mappingId !== intent.scope.mappingId || JSON.stringify(input.readOutput()) !== snapshot) return null;
      const target = db.prepare(`SELECT m.source_guild_id,m.source_channel_id,m.destination_guild_id,
        m.destination_channel_id,m.destination_role_id,m.review_state,m.revision,m.approved_revision,p.status
        FROM partner_alert_mappings m JOIN partner_alert_partners p ON p.community_id=m.community_id
        WHERE m.mapping_id=? AND m.community_id=? AND m.ever_approved=1`).get(mappingId, intent.scope.communityId) as
        { source_guild_id: string; source_channel_id: string; destination_guild_id: string;
          destination_channel_id: string | null; destination_role_id: string | null;
          review_state: string; revision: number; approved_revision: number | null; status: string } | undefined;
      if (!target?.destination_role_id || !target.destination_channel_id
        || !isCommunityReviewDiscordGuild(target.source_guild_id) || !isCommunityReviewDiscordGuild(target.destination_guild_id)
        || !partnerAlertOutputBindingMatches(output.outputBindings, {
          communityId: intent.scope.communityId, sourceGuildId: target.source_guild_id, sourceChannelId: target.source_channel_id,
          destinationGuildId: target.destination_guild_id, destinationChannelId: target.destination_channel_id,
          destinationRoleId: target.destination_role_id,
        })) return null;
      return { mappingId, guildId: target.destination_guild_id, channelId: target.destination_channel_id,
        roleId: target.destination_role_id, guildPermissions: "0",
        allowGrant: target.review_state === "approved" && target.approved_revision === target.revision
          && (target.status === "active" || target.status === "publishing_paused") };
    };
    const outputRole = readBinding(intent.scope.mappingId);
    if (!outputRole || input.protectedRoleIds.includes(outputRole.roleId)) return null;
    const mappingIds = db.prepare(`SELECT mapping_id FROM partner_alert_offer_channels
      WHERE community_id=? AND offer_id=? AND offer_version=? ORDER BY mapping_id LIMIT 101`)
      .pluck().all(intent.scope.communityId, intent.offerId, intent.offerVersion) as string[];
    if (mappingIds.length > 100 || !mappingIds.includes(intent.scope.mappingId)) return null;
    const authority = input.bindCurrentAuthority({ userId: intent.scope.userId, communityId: intent.scope.communityId,
      offerId: intent.offerId, offerVersion: intent.offerVersion, mappingIds });
    if (!authority) return null;
    const transport = createPartnerAlertManagedRoleTransport({
      botUserId: output.discordBotUserId, forbiddenRoleIds: [outputRole.guildId, ...input.protectedRoleIds], readBinding,
      createRest: scope => createPartnerAlertDiscordRoleRest({ botUserId: output.discordBotUserId, botToken: output.discordBotToken,
        maximumDurationMs: 5000, transport: input.discordFetch ?? fetch }, scope),
    });
    return { authority, worker: new PartnerAlertRoleWorker(db, authority, transport, {
      enabled: true, nowUtc: input.nowUtc, createId: randomUUID, attention: input.reportFailure,
    }) };
  };
}
