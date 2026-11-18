import type Database from "better-sqlite3";
import { assertCommunityReviewDiscordGuild } from "./community-review-discord-guild";

export class CommunityReviewDiscordChannelError extends Error {
  constructor(readonly response: Response) {
    super("Discord destination verification unavailable.");
  }
}

export type CommunityReviewDeliveryTarget = Readonly<{
  community_id: string;
  destination_id: string;
  discord_channel_id: string;
  discord_guild_id: string;
  delivery_id?: string;
  action_id?: string;
  revision_id?: string;
  object_type?: string;
  object_id?: string;
}>;

/** Resolve channels only within the approved guild, then recheck the stored target after I/O. */
export async function verifyCommunityReviewDeliveryChannel(
  database: Database.Database,
  target: CommunityReviewDeliveryTarget,
  token: string,
  request: typeof fetch,
): Promise<void> {
  assertCommunityReviewDiscordGuild(target.discord_guild_id);
  const current = () => {
    if (target.delivery_id && !database.prepare("SELECT 1 FROM traderlink_community_content_deliveries WHERE delivery_id=? AND status='sending'").get(target.delivery_id)) return false;
    if (target.action_id) {
      if (!database.prepare("SELECT 1 FROM traderlink_community_publication_actions WHERE action_id=? AND status='sending' AND revision_id=?").get(target.action_id, target.revision_id)) return false;
      const latest = database.prepare("SELECT revision_id FROM traderlink_community_publication_revisions WHERE community_id=? AND object_type=? AND object_id=? ORDER BY rowid DESC LIMIT 1").get(target.community_id, target.object_type, target.object_id) as { revision_id: string } | undefined;
      if (latest?.revision_id !== target.revision_id) return false;
    }
    return database.prepare(`SELECT 1 FROM traderlink_community_discord_destinations x
    JOIN traderlink_communities c ON c.community_id=x.community_id
    WHERE x.community_id=? AND x.destination_id=? AND x.status='active' AND c.status='active'
      AND x.discord_channel_id=? AND c.discord_guild_id=?`)
    .get(target.community_id, target.destination_id, target.discord_channel_id, target.discord_guild_id);
  };
  if (!current() || !/^[0-9]{1,32}$/u.test(target.discord_channel_id)) throw new Error("Community delivery target changed.");
  const response = await request(`https://discord.com/api/v10/guilds/${target.discord_guild_id}/channels`, {
    headers: { Authorization: `Bot ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new CommunityReviewDiscordChannelError(response);
  const channels = await response.json() as { id?: string; guild_id?: string; type?: number }[];
  if (!Array.isArray(channels) || !channels.some(channel => channel.id === target.discord_channel_id
    && channel.guild_id === target.discord_guild_id && [0, 5].includes(channel.type ?? -1))) {
    throw new Error("Discord channel is outside the approved server or unavailable.");
  }
  if (!current()) throw new Error("Community delivery target changed during verification.");
}
