import type Database from "better-sqlite3";
import type {CommunityStatsReport,CommunityStatsRequestScope,CommunityStatsTableRow} from "../../contracts/community-stats-contracts";
import {statsChannelIdSql} from "./community-stats-channel-selection";
import {statsHistoryReady} from "./community-stats-history-storage";
import {readStatsMemberReactions,statsReplySecondsSql} from "./community-stats-message-populations";
import {statsMedian} from "./community-stats-coverage";

/** Message-only projections share the same selected channels, dates and current-role scope. */
export function readStatsMessages(db:Database.Database,scope:CommunityStatsRequestScope,options:{from:string;until:string;channels:readonly string[];roleId?:string;page:number;pageSize:number;canReadMembers:boolean;observed:boolean}){
  const {from,until,channels,roleId,page,pageSize,observed}=options;
  const where=`e.community_id=@community AND e.surface='discord' AND e.kind IN('message','thread_reply','forum_post') AND ${statsChannelIdSql(channels,"e")} AND e.occurred_at_utc>=@from AND e.occurred_at_utc<@until ${roleId?"AND EXISTS(SELECT 1 FROM community_stats_members n,json_each(n.role_ids_json) r WHERE n.community_id=e.community_id AND n.discord_user_id=e.discord_user_id AND n.active=1 AND r.value=@role)":""}`;
  const params={community:scope.communityId,from,until,...(roleId?{role:roleId}:{})};
  const count=(n:number)=>n>0||observed?n:null;
  const totals=db.prepare(`SELECT count(*) AS messages,count(DISTINCT e.discord_user_id) AS contributors,sum(e.reply_to_event_id IS NOT NULL) AS replies FROM community_stats_events e WHERE ${where}`).get(params) as {messages:number;contributors:number;replies:number|null};
  const reactions=readStatsMemberReactions(db,scope.communityId,from,until,channels,roleId);
  const reactionTotal=reactions.reduce((sum,row)=>sum+(row.Reactions??0),0);
  const response=db.prepare(`SELECT min(${statsReplySecondsSql()}) AS delay FROM community_stats_events e JOIN community_stats_events p ON p.community_id=e.community_id AND p.event_id=e.reply_to_event_id AND p.kind IN('message','thread_reply','forum_post') WHERE ${where} AND ${statsChannelIdSql(channels,"p")} GROUP BY e.reply_to_event_id HAVING delay IS NOT NULL`).all(params) as {delay:number}[];
  const metrics:CommunityStatsReport["metrics"]=[
    {label:"Discord messages",value:count(totals.messages),unit:"messages",previous:null},
    {label:"Message contributors",value:count(totals.contributors),unit:"people",previous:null},
    {label:"Replies",value:count(totals.replies??0),unit:"messages",previous:null},
    {label:"Reactions",value:reactionTotal>0||reactions.length>0&&reactions.every(row=>row.Reactions!==null)||totals.messages===0&&observed?reactionTotal:null,unit:"reactions",previous:null},
  ];
  const charts:NonNullable<CommunityStatsReport["messageCharts"]>[number][]=[];
  for(const [title,format,label] of [["Messages by date","%Y-%m-%d","Date UTC"],["Messages by month","%Y-%m","Month UTC"]] as const){
    const rows=db.prepare(`SELECT strftime('${format}',e.occurred_at_utc) AS "${label}",count(*) AS Messages FROM community_stats_events e WHERE ${where} GROUP BY 1 ORDER BY 1`).all(params) as CommunityStatsTableRow[];
    // Keep calendar spacing and distinguish a known zero from an unobserved period.
    const counts=new Map(rows.map(row=>[String(row[label]),Number(row.Messages)]));
    const start=from.startsWith("2015-01-01")&&rows.length?String(rows[0][label]):from.slice(0,label==="Month UTC"?7:10);
    const filled:CommunityStatsTableRow[]=[];
    if(rows.length)for(let cursor=new Date(start+(label==="Month UTC"?"-01T00:00:00.000Z":"T00:00:00.000Z"));cursor.toISOString()<until;label==="Month UTC"?cursor.setUTCMonth(cursor.getUTCMonth()+1):cursor.setUTCDate(cursor.getUTCDate()+1)){
      const key=cursor.toISOString().slice(0,label==="Month UTC"?7:10);filled.push({[label]:key,Messages:counts.get(key)??(observed?0:null)});
    }
    charts.push({title,columns:[label,"Messages"],rows:filled});
  }
  const channelCounts=db.prepare(`SELECT coalesce(c.name,'Removed channel') AS Channel,count(*) AS Messages FROM community_stats_events e LEFT JOIN community_stats_channels c ON c.community_id=e.community_id AND c.channel_id=e.channel_id WHERE ${where} GROUP BY e.channel_id ORDER BY Messages DESC,e.channel_id`).all(params) as CommunityStatsTableRow[];
  const leadingChannels=channelCounts.length>5?[...channelCounts.slice(0,4),{Channel:"Other",Messages:channelCounts.slice(4).reduce((sum,row)=>sum+Number(row.Messages),0)}]:channelCounts;
  charts.push({title:"Messages by channel",columns:["Channel","Messages"],rows:leadingChannels});
  const channelMonths=db.prepare(`SELECT e.channel_id AS channelId,coalesce(c.name,'Removed channel') AS Channel,substr(e.occurred_at_utc,1,7) AS "Month UTC",count(*) AS Messages FROM community_stats_events e LEFT JOIN community_stats_channels c ON c.community_id=e.community_id AND c.channel_id=e.channel_id WHERE ${where} GROUP BY e.channel_id,substr(e.occurred_at_utc,1,7) ORDER BY 3,e.channel_id`).all(params) as CommunityStatsTableRow[];
  const monthRows=charts.find(chart=>chart.title==="Messages by month")?.rows??[];
  const channelIds=[...new Map(channelMonths.map(row=>[String(row.channelId),String(row.Channel)])).entries()];
  const byChannelMonth=new Map(channelMonths.map(row=>[`${row.channelId}:${row["Month UTC"]}`,row.Messages]));
  const completeChannelMonths=channelIds.flatMap(([id,name])=>monthRows.map(row=>({channelId:id,Channel:name,"Month UTC":row["Month UTC"],Messages:byChannelMonth.get(`${id}:${row["Month UTC"]}`)??(observed?0:null)})));
  charts.push({title:"Channel trends",columns:["Channel","Month UTC","Messages"],rows:completeChannelMonths});
  const hourly={columns:["Weekday UTC","Hour UTC","Discord messages"],rows:db.prepare(`SELECT strftime('%w',e.occurred_at_utc) AS "Weekday UTC",strftime('%H',e.occurred_at_utc) AS "Hour UTC",count(*) AS "Discord messages" FROM community_stats_events e WHERE ${where} GROUP BY 1,2 ORDER BY 1,2`).all(params) as CommunityStatsTableRow[]};
  const sections:CommunityStatsReport["sections"][number][]=[{title:"Replies",columns:["Measure","Value"],rows:[{Measure:"Messages receiving replies",Value:count(response.length)},{Measure:"Median first reply (seconds)",Value:statsMedian(response.map(row=>row.delay))}]}];
  if(options.canReadMembers){
    const users=`SELECT e.discord_user_id AS memberId,coalesce(n.username,max(e.username),'Former member') AS "Discord username",count(*) AS Messages,count(DISTINCT e.channel_id) AS Channels,max(e.occurred_at_utc) AS "Last message UTC" FROM community_stats_events e LEFT JOIN community_stats_members n ON n.community_id=e.community_id AND n.discord_user_id=e.discord_user_id WHERE ${where} GROUP BY e.discord_user_id ORDER BY Messages DESC,e.discord_user_id`;
    charts.push({title:"Leading message contributors",columns:["Discord username","Messages"],rows:db.prepare(`${users} LIMIT 5`).all(params) as CommunityStatsTableRow[]});
    sections.push({title:"Messages by member",columns:["Discord username","Messages","Channels","Last message UTC"],rows:db.prepare(`${users} LIMIT @limit OFFSET @offset`).all({...params,limit:pageSize,offset:(page-1)*pageSize}) as CommunityStatsTableRow[],totalRows:totals.contributors,page,pageSize});
  }
  if(statsHistoryReady(db)){
    const reacted=`SELECT coalesce(c.name,'Removed channel') AS Channel,e.occurred_at_utc AS "Message date UTC",r.reactions AS Reactions,'https://discord.com/channels/'||@guild||'/'||e.channel_id||'/'||substr(e.event_id,9) AS "Discord message" FROM community_stats_events e JOIN community_stats_reaction_snapshots r ON r.community_id=e.community_id AND r.message_id=substr(e.event_id,9) LEFT JOIN community_stats_channels c ON c.community_id=e.community_id AND c.channel_id=e.channel_id WHERE ${where} AND r.reactions>0`;
    const total=db.prepare(`SELECT count(*) AS n FROM (${reacted})`).get({...params,guild:scope.guildId}) as {n:number};
    sections.push({title:"Most reacted messages",columns:["Channel","Message date UTC","Reactions","Discord message"],rows:db.prepare(`${reacted} ORDER BY Reactions DESC,e.occurred_at_utc DESC,e.event_id LIMIT @limit OFFSET @offset`).all({...params,guild:scope.guildId,limit:pageSize,offset:(page-1)*pageSize}) as CommunityStatsTableRow[],totalRows:total.n,page,pageSize});
  }
  return {metrics,charts,hourly,sections};
}
