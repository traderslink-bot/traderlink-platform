import "server-only";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { SharedAlertsRepository, type SharedAlertOwnerContext } from "@/src/modules/communities/server/shared-alerts-repository";
import { SharedAlertsDiscord } from "@/src/modules/communities/server/shared-alerts-discord";
import { SharedAlertError } from "@/src/modules/communities/server/shared-alerts-errors";
import type { SharedAlertActor } from "@/src/modules/communities/contracts/shared-alerts-contracts";
import { sharedAlertAwareDiscordRequest } from "@/src/modules/communities/server/shared-alerts-rate-limits";

export function withSharedAlerts<T>(operation: (repository: SharedAlertsRepository) => T): T {
  return withPlatformDatabase({ mode: "runtime" }, database => operation(new SharedAlertsRepository(database)));
}

export async function verifySharedOwner(owner: SharedAlertOwnerContext, discord: SharedAlertsDiscord): Promise<void> {
  if (withSharedAlerts(repository => repository.ownerIsFresh(owner))) return;
  let matches: boolean;
  try { matches = await discord.verifyOwner(owner.guildId, owner.discordUserId); }
  catch { withSharedAlerts(repository => repository.recordOwnerCheck(owner, "unavailable")); throw new SharedAlertError("discord_unavailable"); }
  withSharedAlerts(repository => repository.recordOwnerCheck(owner, matches ? "verified" : "changed"));
  if (!matches) throw new SharedAlertError("not_owner");
}

export async function sharedOwnerContext(slug: string, userId: string) {
  if (slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) throw new SharedAlertError("not_owner");
  const owner = withSharedAlerts(repository => repository.localOwner(slug, userId));
  const request = sharedAlertAwareDiscordRequest(fetch, operation => withSharedAlerts(repository => operation(repository.database)));
  const discord = new SharedAlertsDiscord(process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim() ?? "", request);
  await verifySharedOwner(owner, discord);
  return { owner, actor: { communityId: owner.communityId, userId } satisfies SharedAlertActor, discord };
}

export async function verifySharedParticipants(actor: SharedAlertActor, requestId: string, discord: SharedAlertsDiscord) {
  const participants = withSharedAlerts(repository => {
    const request = repository.requestForActor(actor, requestId);
    return { request, source: repository.ownerContext(request.source_community_id), receiver: repository.ownerContext(request.receiver_community_id) };
  });
  await Promise.all([verifySharedOwner(participants.source, discord), verifySharedOwner(participants.receiver, discord)]);
  return participants;
}
