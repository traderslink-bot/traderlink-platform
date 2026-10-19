import type Database from "better-sqlite3";
import type {CommunityStatsRequestScope} from "../../contracts/community-stats-contracts";
type Data=Record<string,unknown>;
const object=(v:unknown):Data=>v&&typeof v==="object"&&!Array.isArray(v)?v as Data:{};
const numeric=(v:unknown):v is string=>typeof v==="string"&&/^\d{1,32}$/u.test(v);
/** Resolve the bot's own channel permissions, never the Everyone role alone. */
export function statsBotChannels(guildId:string,roles:unknown,channels:unknown,member:unknown,history=false):Map<string,{name:string;type:number}>{
 const result=new Map<string,{name:string;type:number}>(),bot=object(member),user=object(bot.user);
 if(!numeric(user.id)||!Array.isArray(bot.roles)||!bot.roles.every(numeric)||!Array.isArray(roles)||!Array.isArray(channels))return result;
 const all=roles.map(object);if(all.some(r=>!numeric(r.id)||!numeric(r.permissions)))return result;
 const everyone=all.find(r=>r.id===guildId);if(!everyone)return result;
 const assigned=new Set(bot.roles);let base=BigInt(String(everyone.permissions));for(const r of all)if(assigned.has(String(r.id)))base|=BigInt(String(r.permissions));
 const admin=Boolean(base&BigInt(8));
 for(const c of channels.map(object)){
  if(!numeric(c.id)||![0,2,5,13,15,16].includes(Number(c.type))||!Array.isArray(c.permission_overwrites))continue;
  const overwrites=c.permission_overwrites.map(object);if(overwrites.some(o=>!numeric(o.id)||![0,1].includes(Number(o.type))||!numeric(o.allow)||!numeric(o.deny)))continue;
  let permissions=base;const apply=(deny:bigint,allow:bigint)=>{permissions=(permissions&~deny)|allow;};
  const e=overwrites.find(o=>o.id===guildId&&o.type===0);if(e)apply(BigInt(String(e.deny)),BigInt(String(e.allow)));
  let deny=BigInt(0),allow=BigInt(0);for(const o of overwrites)if(o.type===0&&assigned.has(String(o.id))){deny|=BigInt(String(o.deny));allow|=BigInt(String(o.allow));}apply(deny,allow);
  const own=overwrites.find(o=>o.type===1&&o.id===user.id);if(own)apply(BigInt(String(own.deny)),BigInt(String(own.allow)));
  if(admin||(Boolean(permissions&BigInt(1024))&&(!history||Boolean(permissions&BigInt(65536)))))result.set(c.id,{name:String(c.name??c.id).slice(0,100),type:Number(c.type)});
 }
 return result;
}
/** Selected parent channels plus their public threads; other viewers retain Discord channel access. */
export function statsSelectedChannels(db:Database.Database,scope:Pick<CommunityStatsRequestScope,"communityId"|"isOwner"|"readableChannelIds">):readonly string[]{
 const row=db.prepare(`SELECT channel_ids_json FROM community_stats_settings WHERE community_id=?`).get(scope.communityId) as {channel_ids_json:string}|undefined;
 const raw:unknown=JSON.parse(row?.channel_ids_json??"[]");if(!Array.isArray(raw)||!raw.every(numeric))return [];
 const selected=scope.isOwner?raw:raw.filter(id=>scope.readableChannelIds.includes(id));
 const historyReady=!!db.prepare(`SELECT 1 FROM sqlite_schema WHERE name='community_stats_history_jobs'`).get();
 const threads=historyReady?db.prepare(`SELECT DISTINCT channel_id,parent_id FROM community_stats_history_jobs WHERE community_id=? AND parent_id IS NOT NULL`).all(scope.communityId) as {channel_id:string;parent_id:string}[]:[];
 return [...new Set([...selected,...threads.filter(t=>selected.includes(t.parent_id)&&numeric(t.channel_id)).map(t=>t.channel_id)])];
}
export function statsChannelSql(channels:readonly string[],alias=""):string{
 const prefix=alias?alias+".":"";const ids=channels.filter(numeric).map(id=>"'"+id+"'").join(',')||"NULL";
 return `(${prefix}surface!='discord' OR ${prefix}channel_id IN(${ids}))`;
}

export function statsChannelIdSql(channels:readonly string[],alias=""):string{const ids=channels.filter(numeric).map(id=>"'"+id+"'").join(",")||"NULL";return `${alias?alias+".":""}channel_id IN(${ids})`;}
