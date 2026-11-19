import type Database from "better-sqlite3";
import { assertCommunityReviewDiscordGuild } from "./community-review-discord-guild";
import {canBotPublish} from "./community-discord-resources";

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

export type CommunityReviewDeliveryScope = Readonly<{
  guildId: string;
  channelIds: readonly string[];
}>;

/** Resolve channels only within the approved guild, then recheck the stored target after I/O. */
export async function verifyCommunityReviewDeliveryChannel(
  database: Database.Database,
  target: CommunityReviewDeliveryTarget,
  token: string,
  request: typeof fetch,
  scope?: CommunityReviewDeliveryScope,
): Promise<void> {
  if (scope) {
    if (target.discord_guild_id !== scope.guildId || !scope.channelIds.includes(target.discord_channel_id)) {
      throw new Error("Community delivery target is outside the sealed staging scope.");
    }
  } else assertCommunityReviewDiscordGuild(target.discord_guild_id);
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
  const headers={ Authorization: `Bot ${token}` };
  const responses=await Promise.all([
    request(`https://discord.com/api/v10/guilds/${target.discord_guild_id}/channels`,{headers,cache:"no-store",signal:AbortSignal.timeout(8000)}),
    request(`https://discord.com/api/v10/guilds/${target.discord_guild_id}/roles`,{headers,cache:"no-store",signal:AbortSignal.timeout(8000)}),
    request("https://discord.com/api/v10/users/@me",{headers,cache:"no-store",signal:AbortSignal.timeout(8000)}),
  ]);
  const failed=responses.find(response=>!response.ok);if(failed)throw new CommunityReviewDiscordChannelError(failed);
  const [channels,roles,bot]=await Promise.all(responses.map(response=>response.json())) as [Array<{id?:string;guild_id?:string;type?:number;permission_overwrites?:Array<{id:string;type:number;allow:string;deny:string}>}>,Array<{id:string;name:string;permissions:string}>,{id?:string;bot?:boolean}];
  if(!bot.id||bot.bot!==true)throw new Error("Discord bot identity is unavailable.");
  const memberResponse=await request(`https://discord.com/api/v10/guilds/${target.discord_guild_id}/members/${bot.id}`,{headers,cache:"no-store",signal:AbortSignal.timeout(8000)});
  if(!memberResponse.ok)throw new CommunityReviewDiscordChannelError(memberResponse);
  const member=await memberResponse.json() as {roles?:string[];communication_disabled_until?:string|null};
  const channel=Array.isArray(channels)?channels.find(item=>item.id===target.discord_channel_id&&item.guild_id===target.discord_guild_id&&[0,5].includes(item.type??-1)):undefined;
  const timedOut=Boolean(member.communication_disabled_until&&Date.parse(member.communication_disabled_until)>Date.now());
  if(!channel||!Array.isArray(channel.permission_overwrites)||!Array.isArray(roles)||!Array.isArray(member.roles)||timedOut||!canBotPublish(target.discord_guild_id,bot.id,member.roles,roles,channel.permission_overwrites)) {
    throw new Error("Discord channel is outside the approved server or unavailable.");
  }
  if (!current()) throw new Error("Community delivery target changed during verification.");
}
