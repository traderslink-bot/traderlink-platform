import {statsSelectedChannels} from "./community-stats-channel-selection";
import type Database from "better-sqlite3";
import {statsHistoryReady} from "./community-stats-history-storage";
export type StatsTrackingStatus=Readonly<{discord:string;webpage:string;lastDiscordUtc:string|null;lastWebpageUtc:string|null;channels:readonly {id:string;name:string;included:boolean;available:boolean;history:string;messages:number;updatedUtc:string|null}[]}>;
/** Owner-only Settings summary. Internal job reasons, cursors and versions never leave this module. */
export function readStatsTrackingStatus(db:Database.Database,communityId:string,enabled:boolean,runtimeEnabled:boolean,at:string):StatsTrackingStatus{
 const row=db.prepare(`SELECT channel_ids_json FROM community_stats_settings WHERE community_id=?`).get(communityId) as {channel_ids_json:string}|undefined;
 const selected=new Set<string>(JSON.parse(row?.channel_ids_json??"[]"));
 const channels=db.prepare(`SELECT channel_id AS id,name FROM community_stats_channels WHERE community_id=? AND public_readable=1 ORDER BY name`).all(communityId) as {id:string;name:string}[];
 const sources=db.prepare(`SELECT source,status,checked_at_utc,last_event_at_utc FROM community_stats_source_state WHERE community_id=?`).all(communityId) as {source:string;status:string;checked_at_utc:string;last_event_at_utc:string|null}[];
 const connection=(source:string)=>{const state=sources.find(s=>s.source===source);if(!runtimeEnabled||source==="discord"&&!enabled)return "Off";if(!state||["connecting","not_configured"].includes(state.status))return "Connecting";return state.status==="collecting"&&Date.parse(at)-Date.parse(state.checked_at_utc)<90000?"Connected":"Connection interrupted";};
 const jobs=statsHistoryReady(db)?db.prepare(`SELECT channel_id,parent_id,kind,status,recovered,checked_at_utc FROM (SELECT *,row_number() OVER(PARTITION BY channel_id,kind ORDER BY configuration_version DESC) AS latest FROM community_stats_history_jobs WHERE community_id=?) WHERE latest=1 AND kind!='active'`).all(communityId) as {channel_id:string;parent_id:string|null;kind:string;status:string;recovered:number;checked_at_utc:string}[]:[];
 const latestDiscord=db.prepare(`SELECT max(occurred_at_utc) AS at FROM community_stats_events WHERE community_id=? AND surface='discord' AND channel_id IN(SELECT value FROM json_each(?))`).get(communityId,JSON.stringify(statsSelectedChannels(db,{communityId,isOwner:true,readableChannelIds:[]}))) as {at:string|null};
 const choices=[...channels,...[...selected].filter(id=>!channels.some(c=>c.id===id)).map(id=>({id,name:"Unavailable channel - "+id.slice(-4)}))];
 return {discord:enabled&&runtimeEnabled&&!selected.size?"Choose channels":connection("discord"),webpage:connection("web"),lastDiscordUtc:latestDiscord.at,lastWebpageUtc:sources.find(s=>s.source==="web")?.last_event_at_utc??null,channels:choices.map(channel=>{
  const included=selected.has(channel.id),available=channels.some(c=>c.id===channel.id),related=jobs.filter(j=>j.channel_id===channel.id||j.parent_id===channel.id),messages=related.filter(j=>j.kind==="messages"),done=related.length>0&&related.every(j=>j.status==="complete");
  return {...channel,included,available,history:done?"Complete":!included?"Not included":!available||related.some(j=>j.status==="blocked")?"Needs channel access":related.some(j=>j.status==="running")?"Adding history":related.length?"Waiting":"Not started",messages:messages.reduce((sum,j)=>sum+j.recovered,0),updatedUtc:related.reduce<string|null>((latest,j)=>!latest||j.checked_at_utc>latest?j.checked_at_utc:latest,null)};
 })};
}
