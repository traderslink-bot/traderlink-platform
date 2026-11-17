import "server-only";
import {assertCommunityStagingQaCapability,type CommunityStagingQaCapability} from "../community-staging-qa-capability";
import {isCommunityReviewDiscordGuild} from "../community-review-discord-guild";
import type Database from "better-sqlite3";
import {CommunityStatsRepository} from "./community-stats-repository";
import {statsBotChannels} from "./community-stats-channel-selection";
import {statsPublicChannels} from "./community-stats-discord-events";
import {recordStatsBotMessage,nextStatsReactionRefresh,statsReactionRefreshReady,type StatsReactionRefresh} from "./community-stats-message-populations";

type Data=Record<string,unknown>;
const object=(value:unknown):Data=>value&&typeof value==="object"&&!Array.isArray(value)?value as Data:{};
const id=(value:unknown):value is string=>typeof value==="string"&&/^\d{1,32}$/u.test(value);
const instant=(value:unknown):string|null=>typeof value==="string"&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():null;
const text=(value:unknown):string|null=>typeof value==="string"?value.slice(0,80):null;
import {statsHistoryIdentityHash,statsHistoryReady,ensureStatsHistoryJob} from "./community-stats-history-storage";
type Community={communityId:string;guildId:string;version:number;selected:string[];ownerId:string;topologyAt:string};
type Job={channel_id:string;parent_id:string|null;kind:"messages"|"archived"|"active";cursor:string|null;snapshot_at_utc:string};
type Topology={threads:Set<string>;roles:unknown;channels:Map<string,{name:string;type:number}>;at:number;topologyAt:string;member?:unknown;phase:"guild"|"member"|"channels"|"ready"};
/** History must be readable by everyone, not only by the bot's elevated role. */
export function statsPublicHistoryChannels(guildId:string,roles:unknown,channels:unknown){
  const result=statsPublicChannels(guildId,roles,channels);
  const everyone=Array.isArray(roles)?roles.map(object).find(role=>role.id===guildId):null;
  for(const channel of Array.isArray(channels)?channels.map(object):[]){
    if(!id(channel.id)||!result.has(channel.id))continue;
    let permissions=BigInt(String(everyone?.permissions??"0")),restricted=false;
    for(const overwrite of Array.isArray(channel.permission_overwrites)?channel.permission_overwrites.map(object):[]){
      const deny=BigInt(String(overwrite.deny??"0")),allow=BigInt(String(overwrite.allow??"0"));
      if(overwrite.id===guildId&&overwrite.type===0)permissions=(permissions&~deny)|allow;
      else if((deny&BigInt(65536))!==BigInt(0))restricted=true;
    }
    if(restricted||(permissions&BigInt(65536))===BigInt(0))result.delete(channel.id);
  }
  return result;
}
class HistoryRequestError extends Error{constructor(readonly reason:string,readonly retrySeconds:number,readonly blocked=false){super(reason);}}

/** Hosted single-writer background task: at most one REST request per tick, no Gateway or bodies stored. */
export class CommunityStatsHistory {
  private botId:string|null=null;
  private botToken:string|null=null;
  private busy=false;
  private nextCommunity=0;
  private refreshNext=true;
  private topology=new Map<string,Topology>();
  constructor(private readonly db:Database.Database,private readonly request:typeof fetch=fetch,private readonly review?:CommunityStagingQaCapability){if(review)assertCommunityStagingQaCapability(review,db);}
  private eligible(communityId:string):Community|null{
    if(this.review&&communityId!==this.review.run.communityId)return null;
    const row=this.db.prepare(`SELECT c.discord_guild_id AS guildId,s.discord_configuration_version AS version,s.channel_ids_json AS channels,i.auth_subject AS ownerId,
      coalesce((SELECT max(last_observed_at_utc) FROM community_stats_channels WHERE community_id=c.community_id),'') AS topologyAt
      FROM traderlink_communities c JOIN platform_users u ON u.user_id=c.owner_user_id AND u.status='active'
      JOIN platform_auth_identities i ON i.user_id=u.user_id AND i.auth_provider='discord' AND i.status='active'
      JOIN community_stats_settings s ON s.community_id=c.community_id AND s.discord_enabled=1
      JOIN community_stats_source_state d ON d.community_id=c.community_id AND d.source='discord' AND d.status='collecting'
      JOIN community_stats_source_state m ON m.community_id=c.community_id AND m.source='membership' AND m.status='collecting'
      WHERE c.community_id=? AND c.status='active' AND d.checked_at_utc>=? AND m.checked_at_utc>=?
      AND NOT EXISTS(SELECT 1 FROM traderlink_community_lifecycle l WHERE l.community_id=c.community_id AND l.removed_at_utc IS NOT NULL)`)
      .get(communityId,new Date(Date.now()-90_000).toISOString(),new Date(Date.now()-90_000).toISOString()) as {guildId:string;version:number;channels:string;ownerId:string;topologyAt:string}|undefined;
    if(!row||!isCommunityReviewDiscordGuild(row.guildId))return null;
    const selected=JSON.parse(row.channels) as string[];
    return selected.length&&selected.every(id)?{communityId,guildId:row.guildId,version:row.version,selected,ownerId:row.ownerId,topologyAt:row.topologyAt}:null;
  }
  private async get(path:string,token:string,community:Community):Promise<unknown>{
    this.review?.assertActive();
    const current=this.eligible(community.communityId);
    if(!current||current.guildId!==community.guildId||current.version!==community.version||current.ownerId!==community.ownerId)throw new HistoryRequestError("Community collection access changed.",300,true);
    const response=await this.request(`https://discord.com/api/v10${path}`,{headers:{Authorization:`Bot ${token}`},signal:AbortSignal.timeout(10_000),redirect:"error",cache:"no-store"});
    if(!response.ok){
      const retry=Number(response.headers.get("retry-after"));
      if(response.status===429){const body=object(await response.json());throw new HistoryRequestError("Rate limited; retry scheduled.",Math.max(1,Number(body.retry_after)||retry||60));}
      throw new HistoryRequestError(response.status===401?"Bot credentials need attention.":[403,404].includes(response.status)?"History is inaccessible or no longer exists.":"Discord history request failed.",response.status===401?3600:300,[403,404].includes(response.status));
    }
    // Stream to enforce a memory budget even when Content-Length is absent.
    const reader=response.body?.getReader();if(!reader)throw new Error("Missing Discord response.");
    const decoder=new TextDecoder();let body="",bytes=0;
    try{for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.length;if(bytes>4_000_000)throw new Error("History response exceeded budget.");body+=decoder.decode(chunk.value,{stream:true});}body+=decoder.decode();}finally{await reader.cancel();}
    this.review?.assertActive();
    return JSON.parse(body);
  }
  private job(community:Community,channel:string,kind:Job["kind"],at:string,parent:string|null=null):void{
    ensureStatsHistoryJob(this.db,community.communityId,community.version,channel,kind,at,parent);
  }
  private importThreads(community:Community,raw:unknown,at:string,publicChannels:Map<string,{name:string;type:number}>):Data[]{
    if(!Array.isArray(raw))throw new Error("Invalid public thread response.");
    const threads=raw.map(object);
    for(const thread of threads){
      if((thread.guild_id!==undefined&&thread.guild_id!==community.guildId)||![10,11].includes(Number(thread.type))||!id(thread.id)||!id(thread.parent_id)||!community.selected.includes(thread.parent_id)||!publicChannels.has(thread.parent_id))continue;
      this.job(community,thread.id,"messages",at,thread.parent_id);
    }
    return threads;
  }
  private importMessage(community:Community,job:Job,message:Data,at:string,channels:Map<string,{name:string;type:number}>):boolean{
    const user=object(message.author),occurred=instant(message.timestamp);
    if(!id(message.id)||message.channel_id!==job.channel_id||!occurred||occurred<"2015-01-01T00:00:00.000Z"||occurred>job.snapshot_at_utc)return false;
    // Totals have no reactor identities or add times; reports join them to member messages.
    if(message.reactions!==undefined&&(!Array.isArray(message.reactions)||message.reactions.some(raw=>!Number.isSafeInteger(object(raw).count)||Number(object(raw).count)<0)))throw new Error("Invalid reaction counts.");
    const reactions=Array.isArray(message.reactions)?message.reactions.map(object).reduce((sum,reaction)=>sum+Number(reaction.count),0):0;
    if(!Number.isSafeInteger(reactions))throw new Error("Reaction count exceeds its numeric range.");
    this.db.prepare(`INSERT INTO community_stats_reaction_snapshots VALUES(?,?,?,?,?,?) ON CONFLICT(community_id,message_id) DO UPDATE SET reactions=excluded.reactions,observed_at_utc=excluded.observed_at_utc`).run(community.communityId,job.channel_id,message.id,occurred,reactions,at);
    if(![0,19].includes(Number(message.type??0)))return false;
    if(user.bot===true||message.webhook_id){
      recordStatsBotMessage(this.db,community.communityId,message.id,job.channel_id,occurred,message.webhook_id?"webhook":"bot");
      return false;
    }
    if(!id(user.id))return false;
    const excluded=this.db.prepare(`SELECT erased_at_utc FROM community_stats_history_exclusions WHERE community_id=? AND identity_hash=?`).get(community.communityId,statsHistoryIdentityHash(community.communityId,user.id)) as {erased_at_utc:string}|undefined;
    if(excluded&&occurred<=excluded.erased_at_utc)return false;
    const reference=object(message.message_reference),reply=Number(reference.type??0)===0&&id(reference.message_id)?reference.message_id:null;
    const forum=job.parent_id&&[15,16].includes(channels.get(job.parent_id)?.type??-1);
    const repo=new CommunityStatsRepository(this.db);
    const inserted=repo.recordEvent(community.communityId,{eventId:`message:${message.id}`,discordUserId:user.id,platformUserId:null,surface:"discord",kind:forum&&message.id===job.channel_id?"forum_post":reply||job.parent_id?"thread_reply":"message",occurredAtUtc:occurred,receivedAtUtc:at,channelId:job.channel_id,username:text(user.username),displayName:text(user.global_name),nickname:null,nicknameState:"not_collected",identityObservedAtUtc:at,contentId:null,contentType:null,title:null,path:null,authorUserId:null,durationSeconds:0,replyToEventId:reply?`message:${reply}`:null,replyDelaySeconds:null,sourceLinkId:null});
    if(reply&&!inserted)this.db.prepare(`UPDATE community_stats_events SET reply_to_event_id=coalesce(reply_to_event_id,?) WHERE community_id=? AND event_id=?`).run(`message:${reply}`,community.communityId,`message:${message.id}`);
    if(inserted)this.db.prepare(`UPDATE community_stats_events SET evidence='imported_message' WHERE community_id=? AND event_id=?`).run(community.communityId,`message:${message.id}`);
    return inserted;
  }
  async tick(communityIds:readonly string[],token:string):Promise<void>{
    if(process.env.TRADERLINK_COMMUNITY_STATS_ENABLED!=="1"||this.busy||!statsHistoryReady(this.db))return;
    this.review?.historyTick();
    this.busy=true;
    let community:Community|null=null,job:Job|undefined,refresh:StatsReactionRefresh|undefined;
    try{
      const at=new Date().toISOString();
      const ordered=[...communityIds.slice(this.nextCommunity),...communityIds.slice(0,this.nextCommunity)];
      this.nextCommunity=communityIds.length?(this.nextCommunity+1)%communityIds.length:0;
      for(const communityId of ordered){
        const candidate=this.eligible(communityId);if(!candidate)continue;
        this.job(candidate,candidate.guildId,"active",at);
        const waiting=this.db.prepare(`SELECT min(retry_at_utc) AS retry FROM community_stats_history_jobs WHERE community_id=? AND configuration_version=? AND status!='complete'`).get(communityId,candidate.version) as {retry:string|null};
        const reactionDue=nextStatsReactionRefresh(this.db,communityId,at);
        if(waiting.retry&&waiting.retry>at&&!reactionDue)continue;
        const unfinished=this.db.prepare(`SELECT 1 FROM community_stats_history_jobs WHERE community_id=? AND configuration_version=? AND status IN('pending','running','blocked') LIMIT 1`).get(communityId,candidate.version);
        const exists=this.db.prepare(`SELECT 1 FROM community_stats_history_jobs WHERE community_id=? AND configuration_version=? LIMIT 1`).get(communityId,candidate.version);
        if(exists&&!unfinished&&!reactionDue)continue;
        community=candidate;break;
      }
      if(!community)return;
      if(this.botToken!==token){this.botId=null;this.botToken=token;this.topology.clear();}
      if(!this.botId){const bot=object(await this.get("/users/@me",token,community));if(!id(bot.id))throw new Error("Bot identity unavailable.");this.botId=bot.id;return;}
      const key=`${community.communityId}:${community.version}`;
      let topology=this.topology.get(key);
      if(!topology||topology.topologyAt!==community.topologyAt||Date.now()-topology.at>600_000){topology={threads:new Set(),roles:[],channels:new Map(),at:Date.now(),topologyAt:community.topologyAt,phase:"guild"};this.topology.set(key,topology);}
      if(topology.phase==="guild"){
        const guild=object(await this.get(`/guilds/${community.guildId}`,token,community));
        if(guild.id!==community.guildId||guild.owner_id!==community.ownerId)throw new HistoryRequestError("Community ownership could not be verified.",300);
        topology.roles=guild.roles;topology.phase="member";return;
      }
      if(topology.phase==="member"){topology.member=await this.get(`/guilds/${community.guildId}/members/${this.botId}`,token,community);if(object(object(topology.member).user).id!==this.botId)throw new Error("Bot membership unavailable.");topology.phase="channels";return;}
      if(topology.phase==="channels"){
        const channels=await this.get(`/guilds/${community.guildId}/channels`,token,community);
        topology.channels=statsBotChannels(community.guildId,topology.roles,channels,topology.member,true);
        // A persisted thread ID is not current guild evidence. Rediscover thread
        // inventories after refreshing topology; completed message scans stay intact.
        this.db.prepare("UPDATE community_stats_history_jobs SET status='pending',cursor=NULL,retry_at_utc=? WHERE community_id=? AND configuration_version=? AND kind IN('active','archived')").run(at,community.communityId,community.version);
        topology.phase="ready";topology.at=Date.now();return;
      }
      new CommunityStatsRepository(this.db).transaction(()=>{
        for(const channelId of community!.selected){const channel=topology!.channels.get(channelId);if(!channel){
          this.job(community!,channelId,"messages",at);
          this.db.prepare(`UPDATE community_stats_history_jobs SET status='blocked',reason='The bot cannot read history in this selected channel.',checked_at_utc=?,retry_at_utc=? WHERE community_id=? AND configuration_version=? AND channel_id=? AND kind='messages' AND status!='complete'`).run(at,new Date(Date.parse(at)+300_000).toISOString(),community!.communityId,community!.version,channelId);
          continue;
        }
          if(![15,16].includes(channel.type))this.job(community!,channelId,"messages",at);
          if([0,5,15,16].includes(channel.type))this.job(community!,channelId,"archived",at);
        }
        this.job(community!,community!.guildId,"active",at);
      });
      job=this.db.prepare(`SELECT channel_id,parent_id,kind,cursor,snapshot_at_utc FROM community_stats_history_jobs WHERE community_id=? AND configuration_version=? AND status!='complete' AND retry_at_utc<=? ORDER BY CASE status WHEN 'blocked' THEN 1 ELSE 0 END,checked_at_utc,CASE kind WHEN 'active' THEN 0 WHEN 'messages' THEN 1 ELSE 2 END,channel_id LIMIT 1`).get(community.communityId,community.version,at) as Job|undefined;
      refresh=nextStatsReactionRefresh(this.db,community.communityId,at);
      if(refresh&&(this.refreshNext||!job)){
        this.refreshNext=false;
        const selected=community.selected;
        const parent=selected.includes(refresh.channel_id)?refresh.channel_id:(this.db.prepare(`SELECT parent_id FROM community_stats_history_jobs WHERE community_id=? AND channel_id=? AND parent_id IN(SELECT value FROM json_each(?)) ORDER BY configuration_version DESC LIMIT 1`).get(community.communityId,refresh.channel_id,JSON.stringify(selected)) as {parent_id:string}|undefined)?.parent_id;
        if(!parent||!topology.channels.has(parent)||(!topology.channels.has(refresh.channel_id)&&!topology.threads.has(refresh.channel_id))){
          this.db.prepare(`DELETE FROM community_stats_reaction_refresh WHERE community_id=? AND message_id=? AND version=?`).run(community.communityId,refresh.message_id,refresh.version);return;
        }
        const response=object(await this.get(`/channels/${refresh.channel_id}/messages/${refresh.message_id}`,token,community));
        const current=this.eligible(community.communityId);
        if(!current||current.version!==community.version||current.ownerId!==community.ownerId||current.topologyAt!==community.topologyAt||JSON.stringify(current.selected)!==JSON.stringify(selected))return;
        if(response.id!==refresh.message_id||response.channel_id!==refresh.channel_id)throw new Error("Invalid reaction refresh response.");
        const observed=new Date().toISOString();
        new CommunityStatsRepository(this.db).transaction(()=>{
          this.importMessage(community!,{channel_id:refresh!.channel_id,parent_id:parent===refresh!.channel_id?null:parent,kind:"messages",cursor:null,snapshot_at_utc:observed},response,observed,topology!.channels);
          // A newer Gateway change during I/O must remain queued for another authoritative count.
          this.db.prepare(`DELETE FROM community_stats_reaction_refresh WHERE community_id=? AND message_id=? AND version=?`).run(community!.communityId,refresh!.message_id,refresh!.version);
        });return;
      }
      this.refreshNext=true;refresh=undefined;
      if(!job)return;
      const parent=job.parent_id??job.channel_id;
      if(job.kind!=="active"&&(!community.selected.includes(parent)||!topology.channels.has(parent)))throw new HistoryRequestError("Selected channel is no longer accessible.",300,true);
      if(job.kind!=="active"&&job.channel_id!==parent&&!topology.threads.has(job.channel_id))throw new HistoryRequestError("Thread needs fresh server inventory verification.",300,true);
      if(job.kind==="active"&&job.channel_id!==community.guildId)throw new HistoryRequestError("Server history target changed.",300,true);
      const path=job.kind==="active"?`/guilds/${community.guildId}/threads/active`:job.kind==="archived"?`/channels/${job.channel_id}/threads/archived/public?limit=100${job.cursor?`&before=${encodeURIComponent(job.cursor)}`:""}`:`/channels/${job.channel_id}/messages?limit=100${job.cursor?`&before=${job.cursor}`:""}`;
      const response=await this.get(path,token,community);
      const current=this.eligible(community.communityId);
      if(!current||current.version!==community.version||current.ownerId!==community.ownerId||current.topologyAt!==community.topologyAt||JSON.stringify(current.selected)!==JSON.stringify(community.selected))return;
      new CommunityStatsRepository(this.db).transaction(()=>{
        let cursor:string|null=null,complete=false,recovered=0,scanned=0,oldest:string|null=null;
        if(job!.kind==="messages"){
          if(!Array.isArray(response)||response.length>100)throw new Error("Invalid message history response.");
          const messages=response.map(object);scanned=messages.length;
          for(const message of messages){if(!id(message.id))throw new Error("Invalid history message ID.");if(this.importMessage(community!,job!,message,at,topology!.channels))recovered++;const time=instant(message.timestamp);if(time&&(!oldest||time<oldest))oldest=time;}
          cursor=messages.length?String(messages.reduce((a,b)=>BigInt(String(a.id))<BigInt(String(b.id))?a:b).id):job!.cursor;
          complete=messages.length<100;
          if(!complete&&job!.cursor&&BigInt(cursor!)>=BigInt(job!.cursor))throw new Error("History cursor did not advance.");
          const messageIds=JSON.stringify(messages.map(message=>`message:${message.id}`));
          this.db.prepare(`UPDATE community_stats_events AS e SET reply_delay_seconds=(SELECT max(0,cast(round((julianday(e.occurred_at_utc)-julianday(p.occurred_at_utc))*86400) AS INTEGER)) FROM community_stats_events p WHERE p.community_id=e.community_id AND p.event_id=e.reply_to_event_id AND p.discord_user_id!=e.discord_user_id AND p.occurred_at_utc<=e.occurred_at_utc) WHERE e.community_id=? AND e.evidence='imported_message' AND e.reply_to_event_id IS NOT NULL AND e.reply_delay_seconds IS NULL AND(e.event_id IN(SELECT value FROM json_each(?)) OR e.reply_to_event_id IN(SELECT value FROM json_each(?)))`).run(community!.communityId,messageIds,messageIds);
        }else{
          const data=object(response),threads=this.importThreads(community!,data.threads,at,topology!.channels);scanned=threads.length;
          for(const thread of threads)if([10,11].includes(Number(thread.type))&&id(thread.id)&&id(thread.parent_id)&&community!.selected.includes(thread.parent_id)&&topology!.channels.has(thread.parent_id)&&(thread.guild_id===undefined||thread.guild_id===community!.guildId))topology!.threads.add(thread.id);
          complete=job!.kind==="active"||data.has_more===false;
          if(!complete){const times=threads.map(thread=>instant(object(thread.thread_metadata).archive_timestamp)).filter((time):time is string=>!!time).sort();cursor=times[0]??null;if(!cursor||job!.cursor&&cursor>=job!.cursor)throw new Error("Archived-thread cursor did not advance.");}
        }
        this.db.prepare(`UPDATE community_stats_history_jobs SET cursor=?,status=?,scanned=scanned+?,recovered=recovered+?,oldest_at_utc=CASE WHEN oldest_at_utc IS NULL THEN ? WHEN ? IS NULL THEN oldest_at_utc ELSE min(oldest_at_utc,?) END,checked_at_utc=?,retry_at_utc=?,reason=? WHERE community_id=? AND configuration_version=? AND channel_id=? AND kind=?`).run(cursor,complete?"complete":"running",scanned,recovered,oldest,oldest,oldest,at,at,complete?"Accessible surviving records scanned; deleted records and historical permissions remain unknown.":null,community!.communityId,community!.version,job!.channel_id,job!.kind);
      });
    }catch(error){
      const at=new Date().toISOString(),failure=error instanceof HistoryRequestError?error:new HistoryRequestError("History paused after an invalid response or connection failure.",300);
      if(community){
        const retry=new Date(Date.now()+Math.max(1,Number.isFinite(failure.retrySeconds)?failure.retrySeconds:300)*1000).toISOString();
        if(refresh){
          this.db.prepare(`UPDATE community_stats_reaction_refresh SET retry_at_utc=? WHERE community_id=? AND message_id=?`).run(retry,community.communityId,refresh.message_id);
        }
        if(refresh&&failure.blocked){
          // Keep the last counted value; inaccessible messages cannot be asserted to have zero reactions.
        }else if(job&&failure.blocked){
          // An inaccessible archive must not hold up other readable channels.
          this.db.prepare(`UPDATE community_stats_history_jobs SET status='blocked',retry_at_utc=?,reason=?,checked_at_utc=? WHERE community_id=? AND configuration_version=? AND channel_id=? AND kind=?`).run(retry,failure.reason,at,community.communityId,community.version,job.channel_id,job.kind);
        }else{
          // Persist global backoff so restarts cannot hammer a rate-limited route.
          this.db.prepare(`UPDATE community_stats_history_jobs SET retry_at_utc=max(retry_at_utc,?),reason=?,checked_at_utc=? WHERE status!='complete'`).run(retry,failure.reason,at);
          if(statsReactionRefreshReady(this.db))this.db.prepare(`UPDATE community_stats_reaction_refresh SET retry_at_utc=max(retry_at_utc,?)`).run(retry);
        }
        this.topology.delete(`${community.communityId}:${community.version}`);
      }
    }finally{this.busy=false;}
  }
}
