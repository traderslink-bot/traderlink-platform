import "server-only";
import {createHash} from "node:crypto";
import type {CommunityStatsNativeMember,CommunityStatsStoredEvent} from "../../contracts/community-stats-contracts";
import {CommunityStatsRepository} from "./community-stats-repository";

type Data=Record<string,unknown>;
function object(value:unknown):Data{return value&&typeof value==="object"&&!Array.isArray(value)?value as Data:{};}
function id(value:unknown):string|null{return typeof value==="string"&&/^\d{1,32}$/u.test(value)?value:null;}
function label(value:unknown):string|null{return typeof value==="string"?value.slice(0,100):null;}
function instant(value:unknown):string|null{const time=typeof value==="string"?Date.parse(value):NaN;return Number.isFinite(time)?new Date(time).toISOString():null;}
export function statsDiscordMember(value:unknown,completeProfile=false):CommunityStatsNativeMember|null{
  const member=object(value),user=object(member.user),userId=id(user.id),username=label(user.username);
  if(!userId||!username)return null;
  return {discordUserId:userId,username,displayName:label(user.global_name),nickname:label(member.nick),
    roleIds:Array.isArray(member.roles)?member.roles.map(id).filter((role):role is string=>role!==null):[],
    isBot:user.bot===true,joinedAtUtc:instant(member.joined_at),nicknameObserved:completeProfile||Object.hasOwn(member,"nick"),rolesObserved:Array.isArray(member.roles)};
}

/** Only public, explicitly selected channels are eligible. Role-only channels fail closed. */
export function statsPublicChannels(guildId:string,roles:unknown,channels:unknown):Map<string,{name:string;type:number}>{
  const result=new Map<string,{name:string;type:number}>();
  if(!Array.isArray(roles)||!Array.isArray(channels))return result;
  const everyone=roles.map(object).find(role=>role.id===guildId);
  if(!everyone||typeof everyone.permissions!=="string"||!/^\d{1,32}$/u.test(everyone.permissions))return result;
  let base:bigint;try{base=BigInt(everyone.permissions);}catch{return result;}
  for(const raw of channels){
    const channel=object(raw),channelId=id(channel.id),type=Number(channel.type);
    if(!channelId||typeof channel.type!=="number"||![0,2,5,13,15,16].includes(type)||!Array.isArray(channel.permission_overwrites))continue;
    let permissions=base;
    let restricted=false;
    for(const rawOverwrite of Array.isArray(channel.permission_overwrites)?channel.permission_overwrites:[]){
      const overwrite=object(rawOverwrite);
      if(!id(overwrite.id)||typeof overwrite.type!=="number"||![0,1].includes(overwrite.type)||typeof overwrite.allow!=="string"||typeof overwrite.deny!=="string"||!/^\d{1,32}$/u.test(overwrite.allow)||!/^\d{1,32}$/u.test(overwrite.deny)){restricted=true;break;}
      try{if(overwrite.id!==guildId&&(BigInt(String(overwrite.deny??"0"))&BigInt(1024))!==BigInt(0))restricted=true;}catch{restricted=true;}
      if(overwrite.id!==guildId||Number(overwrite.type)!==0)continue;
      try{permissions=(permissions&~BigInt(String(overwrite.deny??"0")))|BigInt(String(overwrite.allow??"0"));}catch{permissions=BigInt(0);}
    }
    if(!restricted&&(permissions&BigInt(1024))!==BigInt(0))result.set(channelId,{name:label(channel.name)??channelId,type});
  }
  return result;
}

export class CommunityStatsDiscordEvents{
  constructor(readonly repository:CommunityStatsRepository){}
  dispatch(communityId:string,eventType:string,raw:unknown,sessionId:string,sequence:number,atUtc:string,channels:ReadonlySet<string>,afkChannelId:string|null,threadIds:ReadonlySet<string>=new Set(),forumThreadIds:ReadonlySet<string>=new Set()):void{
    const data=object(raw),repo=this.repository;
    if(eventType==="GUILD_MEMBER_ADD"||eventType==="GUILD_MEMBER_UPDATE"){
      const member=statsDiscordMember(data,eventType==="GUILD_MEMBER_ADD");
      if(member){const delay=member.joinedAtUtc?Date.parse(atUtc)-Date.parse(member.joinedAtUtc):NaN;repo.nativeMember(communityId,member,atUtc,eventType==="GUILD_MEMBER_ADD"&&delay>=0&&delay<=120_000?"observed_join":"snapshot");}return;
    }
    if(eventType==="GUILD_MEMBER_REMOVE"){
      const userId=id(object(data.user).id);if(userId){
        const known=repo.db.prepare(`SELECT 1 FROM community_stats_members WHERE community_id=? AND discord_user_id=?`).get(communityId,userId);
        if(!known){const member=statsDiscordMember({user:data.user});if(member)repo.nativeMember(communityId,member,atUtc);}
        repo.closeVoice(communityId,userId,atUtc);repo.leave(communityId,userId,atUtc);
      }return;
    }
    const channelId=id(data.channel_id);
    if(eventType==="VOICE_STATE_UPDATE"){
      const userId=id(data.user_id);if(!userId)return;
      const member=statsDiscordMember(data.member);
      repo.closeVoice(communityId,userId,atUtc);
      if(member)repo.nativeMember(communityId,member,atUtc);
      const known=repo.db.prepare(`SELECT is_bot FROM community_stats_members WHERE community_id=? AND discord_user_id=?`).get(communityId,userId) as {is_bot:number}|undefined;
      if(channelId&&channels.has(channelId)&&channelId!==afkChannelId&&known?.is_bot===0)repo.beginVoice(communityId,userId,channelId,atUtc);
      return;
    }
    if(!channelId||!channels.has(channelId))return;
    if(eventType!=="MESSAGE_CREATE"&&eventType!=="MESSAGE_REACTION_ADD")return;
    if(eventType==="MESSAGE_CREATE"&&![0,19].includes(Number(data.type??0)))return;
    const user=object(data.author),userId=id(eventType==="MESSAGE_CREATE"?user.id:data.user_id);
    if(!userId||user.bot===true||data.webhook_id)return;
    const member=statsDiscordMember({...object(data.member),user:eventType==="MESSAGE_CREATE"?user:object(object(data.member).user)});
    if(member?.isBot)return;
    if(member)repo.nativeMember(communityId,member,atUtc);
    const known=repo.db.prepare(`SELECT is_bot FROM community_stats_members WHERE community_id=? AND discord_user_id=?`).get(communityId,userId) as {is_bot:number}|undefined;
    if(known?.is_bot!==0)return;
    const messageId=id(data.id),occurredAtUtc=eventType==="MESSAGE_CREATE"?instant(data.timestamp):atUtc;
    if(!occurredAtUtc||(eventType==="MESSAGE_CREATE"&&!messageId))return;
    if(Date.parse(atUtc)-Date.parse(occurredAtUtc)>120_000){
      repo.coverage(communityId,"discord",occurredAtUtc,atUtc,"gap","lag");
      repo.source(communityId,"discord","gap",atUtc,"Delayed gateway events; affected dates are not complete coverage.");
    }
    const referenceData=object(data.message_reference),reference=Number(referenceData.type??0)===0?id(referenceData.message_id):null;
    const prior=reference?repo.db.prepare(`SELECT occurred_at_utc,discord_user_id FROM community_stats_events WHERE community_id=? AND event_id=? AND surface='discord'`).get(communityId,`message:${reference}`) as {occurred_at_utc:string;discord_user_id:string}|undefined:undefined;
    const delay=prior&&prior.discord_user_id!==userId?Math.max(0,Math.floor((Date.parse(occurredAtUtc)-Date.parse(prior.occurred_at_utc))/1000)):null;
    const event:CommunityStatsStoredEvent={eventId:eventType==="MESSAGE_CREATE"?`message:${messageId}`:`reaction:${createHash("sha256").update(`${sessionId}:${sequence}`).digest("hex")}`,
      discordUserId:userId,platformUserId:null,surface:"discord",kind:eventType==="MESSAGE_REACTION_ADD"?"reaction_add":forumThreadIds.has(channelId)&&messageId===channelId?"forum_post":reference||threadIds.has(channelId)?"thread_reply":"message",
      occurredAtUtc,receivedAtUtc:atUtc,channelId,username:label(user.username)??member?.username??null,
      displayName:label(user.global_name)??member?.displayName??null,nickname:member?.nickname??null,identityObservedAtUtc:atUtc,
      contentId:null,contentType:null,title:null,path:null,authorUserId:null,durationSeconds:0,
      replyToEventId:prior?`message:${reference}`:null,replyDelaySeconds:delay,sourceLinkId:null};
    repo.recordEvent(communityId,event);
  }
}
