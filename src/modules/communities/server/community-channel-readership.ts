import type Database from "better-sqlite3";

type Role={id:string;permissions:string};
type Overwrite={id:string;type:number;allow:string;deny:string};
const id=/^\d{1,32}$/;
const bits=/^\d{1,32}$/;
/** Fresh Discord membership + roles + channel overwrites. No app audience override. */
export async function readCommunityViewerChannels(db:Database.Database,slug:string,userId:string,token:string,request:typeof fetch=fetch,channelTypes:readonly number[]=[0,5]):Promise<readonly string[]>{
 const target=db.prepare(`SELECT c.discord_guild_id,i.auth_subject FROM traderlink_communities c JOIN traderlink_community_memberships m ON m.community_id=c.community_id AND m.user_id=? AND m.status='active' JOIN platform_auth_identities i ON i.user_id=m.user_id AND i.auth_provider='discord' AND i.status='active' WHERE c.slug=? AND c.status='active'`).get(userId,slug) as {discord_guild_id:string;auth_subject:string}|undefined;
 if(!target||!token||!id.test(target.discord_guild_id)||!id.test(target.auth_subject))return [];
 const guildId=target.discord_guild_id,memberId=target.auth_subject;
 async function get(path:string){const response=await request(`https://discord.com/api/v10/${path}`,{headers:{Authorization:`Bot ${token}`},cache:"no-store",signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error("Discord viewing access unavailable");return response.json();}
 try{
  const [guild,member,roles,channels]=await Promise.all([get(`guilds/${guildId}`),get(`guilds/${guildId}/members/${memberId}`),get(`guilds/${guildId}/roles`),get(`guilds/${guildId}/channels`)]) as [{id:string;owner_id:string},{user:{id:string};roles:string[]},Role[],{id:string;guild_id?:string;type:number;permission_overwrites:Overwrite[]}[]];
  if(guild.id!==guildId||member.user?.id!==memberId||!Array.isArray(member.roles)||member.roles.some(value=>!id.test(value))||!Array.isArray(roles)||roles.some(role=>!id.test(role.id)||!bits.test(role.permissions))||!Array.isArray(channels))return [];
  const everyone=roles.find(role=>role.id===guildId);if(!everyone)return [];
  const selected=new Set(member.roles);let base=BigInt(everyone.permissions);
  for(const role of roles)if(selected.has(role.id))base|=BigInt(role.permissions);
  const administrator=guild.owner_id===memberId||Boolean(base&BigInt(8));
  return channels.filter(channel=>{
   if(!id.test(channel.id)||(channel.guild_id!==undefined&&channel.guild_id!==guildId)||!channelTypes.includes(channel.type))return false;
   const overwrites=channel.permission_overwrites;if(!Array.isArray(overwrites)||overwrites.some(item=>!id.test(item.id)||![0,1].includes(item.type)||!bits.test(item.allow)||!bits.test(item.deny)))return false;
   if(administrator)return true;
   let permissions=base;const apply=(deny:bigint,allow:bigint)=>{permissions=(permissions&~deny)|allow;};
   const all=overwrites.find(item=>item.type===0&&item.id===guildId);if(all)apply(BigInt(all.deny),BigInt(all.allow));
   let deny=BigInt(0),allow=BigInt(0);for(const item of overwrites)if(item.type===0&&item.id!==guildId&&selected.has(item.id)){deny|=BigInt(item.deny);allow|=BigInt(item.allow);}apply(deny,allow);
   const personal=overwrites.find(item=>item.type===1&&item.id===memberId);if(personal)apply(BigInt(personal.deny),BigInt(personal.allow));
   return Boolean(permissions&BigInt(1024));
  }).map(channel=>channel.id);
 }catch{return [];}
}
/** Publishing pause keeps historical channel association; missing Discord channels and unassociated legacy items never fall back to Everyone. */
export function mayReadCommunityPublication(db:Database.Database,communityId:string,objectType:"alert"|"watchlist",objectId:string,readableChannelIds:readonly string[]):boolean{
 if(!readableChannelIds.length)return false;
 const row=db.prepare(`SELECT destination_ids_json FROM traderlink_community_publication_distribution WHERE community_id=? AND object_type=? AND object_id=?`).get(communityId,objectType,objectId) as {destination_ids_json:string}|undefined;
 if(!row)return false;
 const destinations=JSON.parse(row.destination_ids_json) as string[];
 if(!Array.isArray(destinations)||!destinations.length)return false;
 const viewable=new Set(readableChannelIds);
 return destinations.some(destination=>{
  const channel=db.prepare(`SELECT discord_channel_id FROM traderlink_community_discord_destinations WHERE community_id=? AND destination_id=? AND content_type=?`).get(communityId,destination,objectType==="alert"?"alerts":"watchlists") as {discord_channel_id:string}|undefined;
  return Boolean(channel&&viewable.has(channel.discord_channel_id));
 });
}
