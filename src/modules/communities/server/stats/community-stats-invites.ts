import {isCommunityReviewDiscordGuild} from "../community-review-discord-guild";
import type Database from 'better-sqlite3';
import {createHash} from 'node:crypto';
import {statsHistoryIdentityHash} from './community-stats-history-storage';
type Invite={key:string;channel:string|null;creator:string|null;name:string|null;uses:number|null;max:number|null;created:string|null;expires:string|null;temporary:number;vanity:number};
type Join={id:string;at:string};
type Guild={communityId:string;guildId:string;valid:()=>boolean};
type Session={guild:Guild;baseline:Map<string,number>|null;checked:number;retry:number;joins:Join[];timer:ReturnType<typeof setTimeout>|null;generation:number;version:number;owner:string;ownerDiscord:string};
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const id=(v:unknown)=>typeof v==='string'&&/^\d{1,32}$/u.test(v)?v:null;
const text=(v:unknown)=>typeof v==='string'?v.slice(0,80):null;
const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
export {statsAttributionReady} from "./community-stats-attribution-ready";
import {statsAttributionReady} from "./community-stats-attribution-ready";
const hash=(community:string,code:string)=>createHash('sha256').update(community+'\0'+code).digest('hex');
/** A single serialized REST queue, attached to the verified Gateway lifetime. No import-time requests. */
export class CommunityStatsInvites{
  private sessions=new Map<string,Session>();private busy=false;private stopped=false;private globalRetry=0;
  constructor(private readonly db:Database.Database,private readonly token:string,private readonly request:typeof fetch=fetch){}
  start(guild:Guild):void{
    if(!isCommunityReviewDiscordGuild(guild.guildId)||process.env.TRADERLINK_COMMUNITY_STATS_ENABLED!=="1"||!statsAttributionReady(this.db)||this.stopped)return;
    const old=this.sessions.get(guild.communityId);if(old?.timer)clearTimeout(old.timer);
    const config=this.db.prepare(`SELECT s.discord_configuration_version AS version,c.owner_user_id AS owner,i.auth_subject AS ownerDiscord FROM community_stats_settings s JOIN traderlink_communities c ON c.community_id=s.community_id JOIN platform_users u ON u.user_id=c.owner_user_id AND u.status='active' JOIN platform_auth_identities i ON i.user_id=c.owner_user_id AND i.auth_provider='discord' AND i.status='active' WHERE s.community_id=? AND s.discord_enabled=1`).get(guild.communityId) as {version:number;owner:string;ownerDiscord:string}|undefined;
    if(!config)return;
    const session:Session={...config,guild,baseline:null,checked:0,retry:0,joins:[],timer:null,generation:(old?.generation??0)+1};
    this.sessions.set(guild.communityId,session);this.schedule(session,0);
  }
  stop():void{this.stopped=true;for(const s of this.sessions.values())if(s.timer)clearTimeout(s.timer);this.sessions.clear();}
  invalidate(communityId:string):void{const s=this.sessions.get(communityId);if(!s)return;if(s.timer)clearTimeout(s.timer);s.baseline=null;s.generation++;this.sessions.delete(communityId);}
  join(communityId:string,user:unknown,joined:unknown,at:string):void{
    if(process.env.TRADERLINK_COMMUNITY_STATS_ENABLED!=="1"||!statsAttributionReady(this.db))return;const member=id(user);if(!member)return;
    if(this.db.prepare(`SELECT 1 FROM community_stats_history_exclusions WHERE community_id=? AND identity_hash=?`).get(communityId,statsHistoryIdentityHash(communityId,member)))return;
    const s=this.sessions.get(communityId);if(!s||!this.current(s))return;
    const supplied=date(joined),delay=supplied?Date.parse(at)-Date.parse(supplied):NaN;
    const when=supplied&&delay>=0&&supplied>="2015-01-01T00:00:00.000Z"?supplied:at;
    const inserted=this.db.prepare(`INSERT INTO community_stats_invite_joins VALUES(?,?,?,NULL,'unknown') ON CONFLICT DO NOTHING`).run(communityId,member,when);
    if(!inserted.changes||!Number.isFinite(delay)||delay<0||delay>120000)return;
    s.joins.push({id:member,at:when});this.schedule(s,1500);
  }
  inviteEvent(communityId:string,kind:string,data:Record<string,unknown>,at:string):void{
    if(!statsAttributionReady(this.db))return;const s=this.sessions.get(communityId);if(!s||!this.current(s)||typeof data.code!=="string")return;
    const key=hash(communityId,data.code),channel=id(data.channel_id),creator=object(data.inviter);
    const selected=(this.db.prepare(`SELECT channel_ids_json FROM community_stats_settings WHERE community_id=?`).get(communityId) as {channel_ids_json:string}).channel_ids_json;
    s.baseline=null;s.generation++;
    if(kind==="INVITE_DELETE")this.db.prepare(`UPDATE community_stats_invites SET active=0,checked_at_utc=? WHERE community_id=? AND invite_hash=?`).run(at,communityId,key);
    else if(channel&&(JSON.parse(selected) as string[]).includes(channel)){
      const creatorId=id(creator.id),erased=creatorId&&this.db.prepare(`SELECT 1 FROM community_stats_history_exclusions WHERE community_id=? AND identity_hash=?`).get(communityId,statsHistoryIdentityHash(communityId,creatorId));
      this.db.prepare(`INSERT INTO community_stats_invites VALUES(?,?,?,?,?,0,?,?,?, ?,0,1,?) ON CONFLICT(community_id,invite_hash) DO UPDATE SET active=1,checked_at_utc=excluded.checked_at_utc`).run(communityId,key,channel,erased?null:creatorId,erased?null:text(creator.username),Number.isSafeInteger(data.max_uses)?data.max_uses:null,date(data.created_at),typeof data.max_age==='number'&&Number.isSafeInteger(data.max_age)&&data.max_age>0&&data.max_age<=604800&&date(data.created_at)?new Date(Date.parse(String(data.created_at))+data.max_age*1000).toISOString():null,data.temporary===true?1:0,at);
    }
    this.schedule(s,1500);
  }
  private state(s:Session,status:string):void{this.db.prepare(`INSERT INTO community_stats_attribution_state VALUES(?,'invites',?,?) ON CONFLICT(community_id,source) DO UPDATE SET status=excluded.status,checked_at_utc=excluded.checked_at_utc`).run(s.guild.communityId,status,new Date().toISOString());}
  private schedule(s:Session,delay:number):void{if(s.timer)clearTimeout(s.timer);s.timer=setTimeout(()=>{s.timer=null;void this.refresh(s).catch(()=>{if(this.current(s)){s.baseline=null;this.state(s,'Connection interrupted');this.schedule(s,60000);}});},delay);s.timer.unref?.();}
  private current(s:Session):boolean{return isCommunityReviewDiscordGuild(s.guild.guildId)&&process.env.TRADERLINK_COMMUNITY_STATS_ENABLED==="1"&&!this.stopped&&this.sessions.get(s.guild.communityId)===s&&s.guild.valid()&&!!this.db.prepare(`SELECT 1 FROM community_stats_settings s JOIN traderlink_communities c ON c.community_id=s.community_id WHERE s.community_id=? AND s.discord_enabled=1 AND s.discord_configuration_version=? AND c.discord_guild_id=? AND c.status='active' AND c.owner_user_id=? AND EXISTS(SELECT 1 FROM platform_users u WHERE u.user_id=c.owner_user_id AND u.status='active') AND EXISTS(SELECT 1 FROM platform_auth_identities i WHERE i.user_id=c.owner_user_id AND i.auth_provider='discord' AND i.auth_subject=? AND i.status='active')`).get(s.guild.communityId,s.version,s.guild.guildId,s.owner,s.ownerDiscord);}
  private async get(path:string,s:Session):Promise<{status:number;body:unknown}>{
    if(!this.current(s))throw new Error("Community collection access changed.");
    const response=await this.request('https://discord.com/api/v10'+path,{headers:{Authorization:'Bot '+this.token},signal:AbortSignal.timeout(10000),redirect:'error'});
    if(response.status===429){let retry=60;try{const data=object(await response.json());retry=Math.max(1,Math.min(86400,Number(data.retry_after)||60));if(data.global===true)this.globalRetry=Date.now()+retry*1000;}catch{/* bounded retry below */}s.retry=Date.now()+retry*1000;return {status:429,body:null};}
    return {status:response.status,body:response.ok?await response.json():null};
  }
  private async refresh(s:Session):Promise<void>{
    if(!this.current(s))return;
    if(this.busy||Math.max(s.retry,this.globalRetry)>Date.now()){this.schedule(s,Math.max(1000,Math.max(s.retry,this.globalRetry)-Date.now()));return;}
    this.busy=true;const generation=s.generation,started=Date.now(),pending=s.joins.splice(0);
    try{
      const result=await this.get(`/guilds/${s.guild.guildId}/invites`,s);
      if(!this.current(s)||generation!==s.generation)return;
      if(result.status!==200||!Array.isArray(result.body)){s.baseline=null;this.state(s,result.status===403?'Needs Manage Server permission':result.status===429?'Waiting for Discord':'Connection interrupted');return;}
      const invites:Invite[]=[];
      for(const raw of result.body){const row=object(raw),creator=object(row.inviter),channel=object(row.channel);if(typeof row.code!=='string')continue;
        invites.push({key:hash(s.guild.communityId,row.code),channel:id(channel.id),creator:id(creator.id),name:text(creator.username),uses:Number.isSafeInteger(row.uses)&&Number(row.uses)>=0?Number(row.uses):null,max:Number.isSafeInteger(row.max_uses)?Number(row.max_uses):null,created:date(row.created_at),expires:date(row.expires_at),temporary:row.temporary===true?1:0,vanity:0});}
      const vanity=await this.get(`/guilds/${s.guild.guildId}/vanity-url`,s);
      if(!this.current(s)||generation!==s.generation)return;
      const v=object(vanity.body);if(vanity.status===200&&typeof v.code==='string'&&Number.isSafeInteger(v.uses)&&Number(v.uses)>=0)invites.push({key:hash(s.guild.communityId,v.code),channel:null,creator:null,name:null,uses:Number(v.uses),max:null,created:null,expires:null,temporary:0,vanity:1});
      const changes=invites.filter(i=>i.uses!==null&&s.baseline?.has(i.key)&&i.uses!==(s.baseline.get(i.key)??0));
      // Inference only: a single join, a single +1 counter, a fresh uninterrupted baseline.
      // New/deleted invites, concurrent joins, REST races and reconnects stay unknown.
      const candidate=s.baseline&&started-s.checked<=90000&&pending.length===1&&s.joins.length===0&&changes.length===1&&(changes[0].uses??0)-(s.baseline.get(changes[0].key)??0)===1&&invites.every(i=>s.baseline!.has(i.key))&&[...s.baseline.keys()].every(key=>invites.some(i=>i.key===key))&&[200,404].includes(vanity.status)?changes[0]:null;
      const selection=JSON.parse((this.db.prepare(`SELECT channel_ids_json FROM community_stats_settings WHERE community_id=?`).get(s.guild.communityId) as {channel_ids_json:string}).channel_ids_json) as string[];
      const included=invites.filter(invite=>invite.vanity===1||!!invite.channel&&selection.includes(invite.channel));
      const at=new Date().toISOString();this.db.transaction(()=>{
        this.db.prepare(`UPDATE community_stats_invites SET active=0 WHERE community_id=? AND (vanity=0 OR ?=1)`).run(s.guild.communityId,[200,404].includes(vanity.status)?1:0);
        const write=this.db.prepare(`INSERT INTO community_stats_invites VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?) ON CONFLICT(community_id,invite_hash) DO UPDATE SET channel_id=excluded.channel_id,creator_id=excluded.creator_id,creator_name=excluded.creator_name,uses=excluded.uses,max_uses=excluded.max_uses,created_at_utc=coalesce(excluded.created_at_utc,community_stats_invites.created_at_utc),expires_at_utc=excluded.expires_at_utc,temporary=excluded.temporary,active=1,checked_at_utc=excluded.checked_at_utc`);
        for(const invite of included){const erased=invite.creator&&this.db.prepare(`SELECT 1 FROM community_stats_history_exclusions WHERE community_id=? AND identity_hash=?`).get(s.guild.communityId,statsHistoryIdentityHash(s.guild.communityId,invite.creator));write.run(s.guild.communityId,invite.key,invite.channel,erased?null:invite.creator,erased?null:invite.name,invite.uses,invite.max,invite.created,invite.expires,invite.temporary,invite.vanity,at);}
        for(const invite of included)this.db.prepare(`INSERT INTO community_stats_invite_usage VALUES(?,?,?,?,?) ON CONFLICT(community_id,invite_hash,date_utc) DO UPDATE SET uses=excluded.uses,checked_at_utc=excluded.checked_at_utc WHERE community_stats_invite_usage.uses IS NOT excluded.uses`).run(s.guild.communityId,invite.key,at.slice(0,10),invite.uses,at);
        if(candidate&&included.some(invite=>invite.key===candidate.key))this.db.prepare(`UPDATE community_stats_invite_joins SET invite_hash=?,method='estimated' WHERE community_id=? AND discord_user_id=? AND joined_at_utc=?`).run(candidate.key,s.guild.communityId,pending[0].id,pending[0].at);
        this.state(s,vanity.status===429?'Waiting for Discord':vanity.status===403||included.some(invite=>invite.uses===null)?'Needs Manage Server permission':![200,404].includes(vanity.status)?'Connection interrupted':'Connected');
      })();
      // A join received during I/O makes this sample unsuitable as the next attribution baseline.
      s.baseline=s.joins.length||![200,404].includes(vanity.status)?null:new Map(invites.flatMap(i=>i.uses===null?[]:[[i.key,i.uses] as [string,number]]));s.checked=Date.now();
    }finally{this.busy=false;if(this.current(s))this.schedule(s,Math.max(s.joins.length?1500:60000,s.retry-Date.now(),this.globalRetry-Date.now()));}
  }
}
