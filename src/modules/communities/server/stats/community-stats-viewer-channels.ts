import "server-only";
import type Database from "better-sqlite3";
import {readCommunityViewerChannels} from "../community-channel-readership";
import {isCommunityReviewDiscordGuild} from "../community-review-discord-guild";
import {statsBotChannels} from "./community-stats-channel-selection";
import {isStatsReviewGuild,isStatsReviewChannel} from "./community-stats-review-policy";

type Data=Record<string,unknown>;
const object=(value:unknown):Data=>value&&typeof value==="object"&&!Array.isArray(value)?value as Data:{};
const id=(value:unknown):value is string=>typeof value==="string"&&/^\d{1,32}$/u.test(value);
type Target={community_id:string;discord_guild_id:string;auth_subject:string;owner_user_id:string};

/** Actual Discord viewing rights, restricted to Stats' explicit review scope.
 * This is not a publishing grant or an audience override. */
export async function readCommunityStatsViewerChannels(
  db:Database.Database,slug:string,userId:string,token:string,request:typeof fetch=fetch,channelTypes:readonly number[]=[0,5],
):Promise<readonly string[]>{
  const target=()=>db.prepare(`SELECT c.community_id,c.discord_guild_id,c.owner_user_id,i.auth_subject
    FROM traderlink_communities c JOIN traderlink_community_memberships m ON m.community_id=c.community_id AND m.user_id=? AND m.status='active'
    JOIN platform_users u ON u.user_id=m.user_id AND u.status='active'
    JOIN platform_auth_identities i ON i.user_id=m.user_id AND i.auth_provider='discord' AND i.status='active'
    WHERE c.slug=? AND c.status='active' AND NOT EXISTS(SELECT 1 FROM traderlink_community_lifecycle l WHERE l.community_id=c.community_id AND l.removed_at_utc IS NOT NULL)`)
    .get(userId,slug) as Target|undefined;
  const before=target();
  if(!before||!token||!isStatsReviewGuild(before.discord_guild_id)||!id(before.auth_subject))return [];
  if(isCommunityReviewDiscordGuild(before.discord_guild_id))return readCommunityViewerChannels(db,slug,userId,token,request,channelTypes);
  async function get(resource:string):Promise<unknown>{
    const response=await request(`https://discord.com/api/v10/${resource}`,{headers:{Authorization:`Bot ${token}`},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new Error("Discord viewing access unavailable");
    return response.json();
  }
  try{
    const guildId=before.discord_guild_id;
    const [rawGuild,rawMember,roles,rawChannels]=await Promise.all([get(`guilds/${guildId}`),get(`guilds/${guildId}/members/${before.auth_subject}`),get(`guilds/${guildId}/roles`),get(`guilds/${guildId}/channels`)]);
    const after=target(),guild=object(rawGuild),member=object(rawMember);
    if(!after||JSON.stringify(after)!==JSON.stringify(before)||guild.id!==guildId||!id(guild.owner_id)||object(member.user).id!==before.auth_subject||!Array.isArray(rawChannels))return [];
    const channels=rawChannels.map(object).filter(channel=>isStatsReviewChannel(guildId,channel.id)&&channelTypes.includes(Number(channel.type))
      &&typeof channel.type==="number"&&Array.isArray(channel.permission_overwrites)
      &&channel.permission_overwrites.every(value=>{const overwrite=object(value);return id(overwrite.id)&&[0,1].includes(overwrite.type as number)&&id(overwrite.allow)&&id(overwrite.deny);}));
    // The owner bypass is based on the actual guild response, never app role labels.
    return [...statsBotChannels(guildId,roles,channels,member,false,guild.owner_id).keys()];
  }catch{return [];}
}
