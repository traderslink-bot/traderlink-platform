import "server-only";
import type Database from "better-sqlite3";
import {randomUUID} from "node:crypto";
import {CommunityStatsRepository} from "./community-stats-repository";
import {CommunityStatsDiscordEvents,statsDiscordMember,statsPublicChannels} from "./community-stats-discord-events";

type Guild={communityId:string;guildId:string;selected:Set<string>;channels:Set<string>;afk:string|null;ready:boolean;readyAt:string|null;chunks:Set<number>;chunkCount:number;seen:Set<string>;nonce:string;initialVoice:Map<string,string>;threadIds:Set<string>;forumThreadIds:Set<string>;forumParents:Set<string>;baselineChanged:Set<string>;gapSince:string|null;ownerVerified:boolean;awaitingRoster:boolean;requestedAt:string|null};
type Packet={op:number;s?:number;t?:string;d?:unknown};
type Data=Record<string,unknown>;
const object=(value:unknown):Data=>value&&typeof value==="object"&&!Array.isArray(value)?value as Data:{};
const now=()=>new Date().toISOString();

/** One metadata-only Gateway connection. No connections are made by module import. */
export class CommunityStatsDiscordGateway{
  private socket:WebSocket|null=null;
  private heartbeat:ReturnType<typeof setInterval>|null=null;
  private reconnect:ReturnType<typeof setTimeout>|null=null;
  private firstHeartbeat:ReturnType<typeof setTimeout>|null=null;
  private acknowledged=true;
  private stopped=false;
  private fatal=false;
  private sequence:number|null=null;
  private sessionId:string|null=null;
  private resumeUrl:string|null=null;
  private retry=0;
  private lastConfirmed:string|null=null;
  private guilds=new Map<string,Guild>();
  constructor(private readonly database:()=>Database.Database,private readonly token:string,communities:readonly {communityId:string;guildId:string;channelIds:readonly string[]}[]){
    for(const community of communities)this.guilds.set(community.guildId,{...community,selected:new Set(community.channelIds),channels:new Set(),afk:null,ready:false,readyAt:null,chunks:new Set(),chunkCount:0,seen:new Set(),nonce:`stats-${community.communityId}`.slice(0,32),initialVoice:new Map(),threadIds:new Set(),forumThreadIds:new Set(),forumParents:new Set(),baselineChanged:new Set(),gapSince:null,ownerVerified:false,awaitingRoster:false,requestedAt:null});
    const repo=this.repository(),cutoff=new Date(Date.now()-90*86_400_000).toISOString();
    for(const guild of this.guilds.values()){const last=repo.db.prepare(`SELECT max(until_utc) AS at FROM community_stats_coverage WHERE community_id=? AND source='discord' AND state='observed'`).get(guild.communityId) as {at:string|null};if(last.at)guild.gapSince=last.at<cutoff?cutoff:last.at;}
  }
  start():void{if(!this.socket&&!this.stopped&&!this.fatal)this.connect();}
  stop():void{this.stopped=true;this.clearTimers();const socket=this.socket;this.socket=null;socket?.close(1000);try{this.disconnect("disabled");}catch(error){console.error("Stats shutdown persistence deferred.",{errorName:error instanceof Error?error.name:"UnknownError"});}}
  private clearTimers():void{if(this.heartbeat)clearInterval(this.heartbeat);if(this.firstHeartbeat)clearTimeout(this.firstHeartbeat);if(this.reconnect)clearTimeout(this.reconnect);this.heartbeat=null;this.firstHeartbeat=null;this.reconnect=null;}
  private send(op:number,d:unknown):void{if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({op,d}));}
  private repository():CommunityStatsRepository{return new CommunityStatsRepository(this.database());}
  private requestRoster(guild:Guild,atUtc:string):void{guild.nonce=randomUUID().replaceAll("-","");guild.awaitingRoster=true;guild.requestedAt=atUtc;guild.chunkCount=0;this.send(8,{guild_id:guild.guildId,query:"",limit:0,nonce:guild.nonce});}
  private disconnect(reason:string):void{
    const at=now(),repo=this.repository(),lastConfirmed=this.lastConfirmed;
    this.lastConfirmed=null;
    repo.transaction(()=>{for(const guild of this.guilds.values()){
      guild.gapSince=guild.gapSince??lastConfirmed??at;
      if(lastConfirmed)for(const source of ["discord","membership"] as const)repo.coverage(guild.communityId,source,lastConfirmed,at,"gap","disconnected");
      const pending=repo.db.prepare(`SELECT discord_user_id FROM community_stats_voice_state WHERE community_id=?`).all(guild.communityId) as {discord_user_id:string}[];
      for(const person of pending)repo.closeVoice(guild.communityId,person.discord_user_id,at,true);
      repo.source(guild.communityId,"discord",this.fatal?"unavailable":"gap",at,reason);
      repo.source(guild.communityId,"membership",this.fatal?"unavailable":"gap",at,reason);
      guild.ready=false;guild.readyAt=null;guild.ownerVerified=false;guild.awaitingRoster=false;guild.requestedAt=null;
    }});
  }
  private connect():void{
    if(this.stopped||this.fatal)return;
    const base=this.sessionId&&this.resumeUrl?this.resumeUrl:"wss://gateway.discord.gg";
    const socket=new WebSocket(`${base}/?v=10&encoding=json`);this.socket=socket;
    socket.onmessage=event=>{
      if(this.stopped||this.socket!==socket||typeof event.data!=="string")return;
      if(event.data.length>4_000_000){this.fail("gateway_frame_exceeded_metadata_budget");return;}
      try{const packet=JSON.parse(event.data) as Packet;this.packet(packet);}catch{this.fail("invalid_gateway_event");}
    };
    socket.onerror=()=>{if(this.socket===socket)this.fail("gateway_connection_failed");};
    socket.onclose=event=>{
      if(this.socket!==socket)return;this.socket=null;
      if([4007,4009].includes(event.code)){this.sessionId=null;this.resumeUrl=null;this.sequence=null;}
      if([4004,4010,4011,4012,4013,4014].includes(event.code)){this.fatal=true;try{this.disconnect(event.code===4014?"required_intent_not_enabled":"gateway_configuration_unavailable");}catch(error){console.error("Stats unavailable-state persistence deferred.",{errorName:error instanceof Error?error.name:"UnknownError"});}this.clearTimers();return;}
      this.fail("gateway_disconnected");
    };
  }
  private fail(reason:string):void{
    if(this.stopped||this.fatal||this.reconnect)return;
    this.clearTimers();const old=this.socket;this.socket=null;old?.close(4000);
    try{this.disconnect(reason);}catch(error){console.error("Stats gap persistence deferred.",{errorName:error instanceof Error?error.name:"UnknownError"});}
    const delay=Math.min(300_000,1000*2**Math.min(this.retry++,8))+Math.floor(Math.random()*1000);
    this.reconnect=setTimeout(()=>{this.reconnect=null;this.connect();},delay);this.reconnect.unref?.();
  }
  private beat():void{if(!this.acknowledged){this.fail("heartbeat_not_acknowledged");return;}this.acknowledged=false;this.send(1,this.sequence);}
  private packet(packet:Packet):void{
    if(Number.isInteger(packet.s))this.sequence=packet.s!;
    const data=object(packet.d);
    if(packet.op===10){
      const interval=Number(data.heartbeat_interval);if(!Number.isFinite(interval)||interval<1000||interval>300_000){this.fail("invalid_heartbeat_interval");return;}
      this.acknowledged=true;
      this.firstHeartbeat=setTimeout(()=>{this.beat();this.heartbeat=setInterval(()=>this.beat(),interval);this.heartbeat.unref?.();},Math.random()*interval);this.firstHeartbeat.unref?.();
      if(this.sessionId)this.send(6,{token:this.token,session_id:this.sessionId,seq:this.sequence});
      else this.send(2,{token:this.token,intents:1667,properties:{os:"linux",browser:"TraderLink Community Stats",device:"TraderLink Community Stats"}});
      return;
    }
    if(packet.op===1){this.beat();return;}
    if(packet.op===7){this.fail("gateway_reconnect");return;}
    if(packet.op===9){if(packet.d!==true){this.sessionId=null;this.resumeUrl=null;this.sequence=null;}this.fail("gateway_session_invalid");return;}
    if(packet.op===11){this.acknowledged=true;this.confirm();return;}
    if(packet.op!==0||!packet.t)return;
    if(packet.t==="READY"){
      if(typeof data.session_id!=="string"||typeof data.resume_gateway_url!=="string")throw new Error("Invalid gateway session.");
      const url=new URL(data.resume_gateway_url);if(url.protocol!=="wss:"||!/(^|\.)discord\.gg$/u.test(url.hostname))throw new Error("Invalid gateway resume URL.");
      this.sessionId=data.session_id;this.resumeUrl=url.origin;return;
    }
    if(packet.t==="RESUMED"){
      // A resumed member stream does not include an authoritative current voice snapshot.
      // Re-identify to obtain GUILD_CREATE before claiming complete collection again.
      this.sessionId=null;this.resumeUrl=null;this.sequence=null;this.fail("refresh_snapshot_after_resume");return;
    }
    const guild=this.guilds.get(String(["GUILD_CREATE","GUILD_UPDATE","GUILD_DELETE"].includes(packet.t)?data.id:data.guild_id));if(!guild)return;
    const repo=this.repository(),at=now();
    if(packet.t==="GUILD_CREATE"&&data.unavailable===true){
      guild.ready=false;guild.readyAt=null;guild.ownerVerified=false;guild.awaitingRoster=false;guild.requestedAt=null;
      guild.channels.clear();guild.initialVoice.clear();guild.chunks.clear();guild.seen.clear();guild.baselineChanged.clear();
      guild.gapSince=guild.gapSince??this.lastConfirmed??at;
      repo.transaction(()=>{
        for(const source of ["discord","membership"] as const){
          repo.source(guild.communityId,source,"unavailable",at,"Discord server verification is temporarily unavailable.");
          if(this.lastConfirmed)repo.coverage(guild.communityId,source,this.lastConfirmed,at,"gap","disconnected");
        }
        const voices=repo.db.prepare(`SELECT discord_user_id FROM community_stats_voice_state WHERE community_id=?`).all(guild.communityId) as {discord_user_id:string}[];
        for(const voice of voices)repo.closeVoice(guild.communityId,voice.discord_user_id,at,true);
      });return;
    }
    if(packet.t==="GUILD_CREATE"||packet.t==="GUILD_UPDATE"&&typeof data.owner_id==="string"){
      const owner=repo.db.prepare(`SELECT i.auth_subject AS id FROM traderlink_communities c JOIN platform_auth_identities i ON i.user_id=c.owner_user_id AND i.auth_provider='discord' AND i.status='active' JOIN platform_users u ON u.user_id=i.user_id AND u.status='active' WHERE c.community_id=? AND c.discord_guild_id=? AND c.status='active'`).get(guild.communityId,guild.guildId) as {id:string}|undefined;
      guild.ownerVerified=typeof data.owner_id==="string"&&owner?.id===data.owner_id;
      if(!guild.ownerVerified){
        guild.ready=false;guild.readyAt=null;
        repo.transaction(()=>{for(const source of ["discord","membership"] as const){repo.source(guild.communityId,source,"unavailable",at,"Community ownership needs verification before reconnecting collection.");if(this.lastConfirmed)repo.coverage(guild.communityId,source,this.lastConfirmed,at,"gap","permissions");}
          const voices=repo.db.prepare(`SELECT discord_user_id FROM community_stats_voice_state WHERE community_id=?`).all(guild.communityId) as {discord_user_id:string}[];for(const voice of voices)repo.closeVoice(guild.communityId,voice.discord_user_id,at,true);
        });return;
      }
    }
    if(!guild.ownerVerified)return;
    if(packet.t==="GUILD_UPDATE"&&Object.hasOwn(data,"afk_channel_id")&&data.afk_channel_id!==guild.afk){
      // Refresh the authoritative voice snapshot before using a changed AFK exclusion.
      this.sessionId=null;this.resumeUrl=null;this.fail("afk_channel_changed");return;
    }
    if(packet.t==="GUILD_CREATE"){
      guild.afk=typeof data.afk_channel_id==="string"?data.afk_channel_id:null;
      guild.initialVoice.clear();for(const raw of Array.isArray(data.voice_states)?data.voice_states:[]){const voice=object(raw);if(typeof voice.user_id==="string"&&typeof voice.channel_id==="string")guild.initialVoice.set(voice.user_id,voice.channel_id);}
      const channels=statsPublicChannels(guild.guildId,data.roles,data.channels);
      guild.channels=new Set([...channels.keys()].filter(channel=>guild.selected.has(channel)));guild.threadIds.clear();guild.forumThreadIds.clear();guild.forumParents=new Set([...channels].filter(([,channel])=>[15,16].includes(channel.type)).map(([id])=>id));
      repo.transaction(()=>{
        repo.db.prepare(`DELETE FROM community_stats_channels WHERE community_id=?`).run(guild.communityId);
        for(const [channelId,channel] of channels)repo.db.prepare(`INSERT INTO community_stats_channels(community_id,channel_id,name,channel_type,public_readable,last_observed_at_utc) VALUES(?,?,?,?,1,?)`).run(guild.communityId,channelId,channel.name,channel.type,at);
        repo.db.prepare(`DELETE FROM community_stats_roles WHERE community_id=?`).run(guild.communityId);
        for(const raw of Array.isArray(data.roles)?data.roles:[]){const role=object(raw);if(typeof role.id==="string"&&typeof role.name==="string")repo.db.prepare(`INSERT INTO community_stats_roles(community_id,role_id,name,last_observed_at_utc) VALUES(?,?,?,?)`).run(guild.communityId,role.id,role.name.slice(0,100),at);}
      });
      guild.ready=false;guild.readyAt=null;guild.seen.clear();guild.chunks.clear();guild.baselineChanged.clear();
      for(const raw of Array.isArray(data.threads)?data.threads:[]){const thread=object(raw);if(Number(thread.type)===11&&guild.channels.has(String(thread.parent_id))&&typeof thread.id==="string"){guild.channels.add(thread.id);guild.threadIds.add(thread.id);if(guild.forumParents.has(String(thread.parent_id)))guild.forumThreadIds.add(thread.id);}}
      this.requestRoster(guild,at);return;
    }
    if(packet.t==="GUILD_MEMBERS_CHUNK"){
      if(!guild.awaitingRoster||data.nonce!==guild.nonce||!Array.isArray(data.members))return;
      const count=Number(data.chunk_count),index=Number(data.chunk_index);if(!Number.isSafeInteger(count)||count<1||count>100000||!Number.isSafeInteger(index)||index<0||index>=count||(guild.chunkCount!==0&&guild.chunkCount!==count)){this.fail("invalid_roster_chunk");return;}
      repo.transaction(()=>{for(const raw of data.members as unknown[]){const member=statsDiscordMember(raw,true);if(member&&!guild.baselineChanged.has(member.discordUserId)){guild.seen.add(member.discordUserId);repo.nativeMember(guild.communityId,member,at);}}});
      guild.chunkCount=count;guild.chunks.add(index);
      if(guild.chunkCount>0&&guild.chunks.size===guild.chunkCount){
        repo.transaction(()=>{
          const existing=repo.db.prepare(`SELECT discord_user_id FROM community_stats_members WHERE community_id=? AND active=1`).all(guild.communityId) as {discord_user_id:string}[];
          for(const person of existing)if(!guild.seen.has(person.discord_user_id))repo.leave(guild.communityId,person.discord_user_id,at,"snapshot_absent");
          if(guild.gapSince)for(const source of ["discord","membership"] as const)repo.coverage(guild.communityId,source,guild.gapSince,at,"gap","disconnected");guild.gapSince=null;
          repo.source(guild.communityId,"membership","collecting",at);
          const complete=guild.selected.size>0&&[...guild.selected].every(channel=>guild.channels.has(channel));
          repo.source(guild.communityId,"discord",complete?"collecting":"unavailable",at,complete?null:"Select public channels that are readable by every eligible member.");
          if(complete)for(const [userId,channelId] of guild.initialVoice){
            const person=repo.db.prepare(`SELECT is_bot FROM community_stats_members WHERE community_id=? AND discord_user_id=? AND active=1`).get(guild.communityId,userId) as {is_bot:number}|undefined;
            if(person?.is_bot===0&&guild.channels.has(channelId)&&channelId!==guild.afk)repo.beginVoice(guild.communityId,userId,channelId,at);
          }
        });guild.ready=guild.selected.size>0&&[...guild.selected].every(channel=>guild.channels.has(channel));guild.readyAt=at;guild.seen.clear();
        guild.initialVoice.clear();guild.awaitingRoster=false;guild.requestedAt=null;guild.chunks.clear();guild.baselineChanged.clear();
      }return;
    }
    if(packet.t==="GUILD_DELETE"||packet.t.startsWith("CHANNEL_")||packet.t.startsWith("GUILD_ROLE_")){
      // Permission topology changes fail closed until a fresh guild snapshot is obtained.
      guild.ready=false;guild.channels.clear();this.sessionId=null;this.resumeUrl=null;this.fail("permissions_changed");return;
    }
    if(packet.t==="VOICE_STATE_UPDATE"&&!guild.readyAt){if(typeof data.user_id==="string"){if(typeof data.channel_id==="string")guild.initialVoice.set(data.user_id,data.channel_id);else guild.initialVoice.delete(data.user_id);}return;}
    if(!guild.readyAt&&packet.t.startsWith("GUILD_MEMBER_")){const user=object(data.user);if(typeof user.id==="string"){guild.baselineChanged.add(user.id);if(packet.t==="GUILD_MEMBER_REMOVE")guild.seen.delete(user.id);else guild.seen.add(user.id);}}
    if(!guild.ready&&!packet.t.startsWith("GUILD_MEMBER_"))return;
    if(packet.t==="THREAD_CREATE"||packet.t==="THREAD_UPDATE"){
      const threadId=String(data.id??"");guild.channels.delete(threadId);
      guild.threadIds.delete(threadId);guild.forumThreadIds.delete(threadId);if(Number(data.type)===11&&guild.channels.has(String(data.parent_id))){guild.channels.add(threadId);guild.threadIds.add(threadId);if(guild.forumParents.has(String(data.parent_id)))guild.forumThreadIds.add(threadId);}return;
    }
    if(packet.t==="THREAD_DELETE"){guild.channels.delete(String(data.id));return;}
    repo.transaction(()=>new CommunityStatsDiscordEvents(repo).dispatch(guild.communityId,packet.t!,data,this.sessionId??"",this.sequence??0,at,guild.channels,guild.afk,guild.threadIds,guild.forumThreadIds));
  }
  private confirm():void{
    const at=now(),repo=this.repository();
    repo.transaction(()=>{for(const guild of this.guilds.values()){
      if(guild.awaitingRoster&&guild.requestedAt&&Date.parse(at)-Date.parse(guild.requestedAt)>120_000){guild.awaitingRoster=false;guild.requestedAt=null;guild.ready=false;guild.readyAt=null;for(const source of ["discord","membership"] as const)repo.source(guild.communityId,source,"unavailable",at,"The complete guild roster is unavailable. Check the member intent and reconnect collection.");continue;}
      if(guild.readyAt){
        this.retry=0;
        const refresh=repo.db.prepare(`SELECT reason,checked_at_utc FROM community_stats_source_state WHERE community_id=? AND source='membership'`).get(guild.communityId) as {reason:string|null;checked_at_utc:string}|undefined;
        const erased=refresh?.reason==="Refreshing roster after account deletion.";
        if(erased||Date.parse(at)-Date.parse(guild.readyAt)>=24*60*60*1000){
          if(this.lastConfirmed){repo.coverage(guild.communityId,"membership",this.lastConfirmed,at,"observed");if(guild.ready)repo.coverage(guild.communityId,"discord",this.lastConfirmed,at,"observed");}
          if(guild.ready)repo.confirmVoice(guild.communityId,at);guild.gapSince=erased?refresh!.checked_at_utc:at;
          guild.initialVoice.clear();
          const voices=repo.db.prepare(`SELECT discord_user_id,channel_id FROM community_stats_voice_state WHERE community_id=?`).all(guild.communityId) as {discord_user_id:string;channel_id:string}[];
          for(const voice of voices){guild.initialVoice.set(voice.discord_user_id,voice.channel_id);repo.closeVoice(guild.communityId,voice.discord_user_id,at,true);}
          guild.ready=false;guild.readyAt=null;guild.seen.clear();guild.chunks.clear();guild.baselineChanged.clear();
          repo.source(guild.communityId,"membership","connecting",at,"Refreshing the daily roster snapshot.");repo.source(guild.communityId,"discord","connecting",at,"Refreshing the daily roster snapshot.");
          this.requestRoster(guild,at);continue;
        }
        repo.source(guild.communityId,"membership","collecting",at);
        if(guild.ready)repo.source(guild.communityId,"discord","collecting",at);
        if(this.lastConfirmed){
          const from=this.lastConfirmed>guild.readyAt?this.lastConfirmed:guild.readyAt;
          repo.coverage(guild.communityId,"membership",from,at,"observed");
          if(guild.ready)repo.coverage(guild.communityId,"discord",from,at,"observed");
        }
        if(guild.ready)repo.confirmVoice(guild.communityId,at);
      }
    }});this.lastConfirmed=at;
  }
}
