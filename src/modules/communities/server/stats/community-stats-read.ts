import "server-only";
import {statsTrafficProjection,readStatsInviteReports} from "./community-stats-attribution-report";
import {statsSelectedChannels,statsChannelSql,statsChannelIdSql} from "./community-stats-channel-selection";
import type Database from "better-sqlite3";
import type {CommunityStatsActivityPoint,CommunityStatsCoverage,CommunityStatsEligibility,CommunityStatsMemberEvidence,CommunityStatsReport,CommunityStatsRequestScope,CommunityStatsTab,CommunityStatsTableRow,CommunityStatsWindow} from "../../contracts/community-stats-contracts";
import {readCommunityStatsCatalog,communityStatsContentMatchesSearch,communityStatsIsAnalystPost,communityStatsPageCategory} from "./community-stats-catalog";
import {communityStatsStorageReady} from "./community-stats-repository";
import {calculateCommunityStatsParticipation} from "./community-stats-participation";
import {resolveStatsWindow,statsSourceObserved,statsMedian} from "./community-stats-coverage";
import {platformFailure} from "../../../platform/server/database/platform-migration-contract";
import {statsHistoryReady} from "./community-stats-history-storage";
import {readStatsHistory} from "./community-stats-history-report";
import {readStatsMemberReactions,readStatsBotActivity,statsReplySecondsSql} from "./community-stats-message-populations";
import {readStatsMessages} from "./community-stats-messages";
import {readStatsStoppedPosting} from "./community-stats-stopped-posting";
import {readStatsAnalysts} from "./community-stats-analysts";
import {readCommunityStatsTeam} from "./community-stats-team";
import {TraderLinkCommunityRepository} from "../traderlink-community-repository";

export const COMMUNITY_STATS_TABS:readonly CommunityStatsTab[]=["overview","participation","server","messages","team","pages","members","visits","authors","publishing","timing"];
export type CommunityStatsReadOptions={tab:CommunityStatsTab;window:CommunityStatsWindow;page:number;/** Trusted export callers only; never read from URL filters. */exportBatchSize?:1000;contentId?:string;authorId?:string;memberId?:string;segment?:string;memberPage?:number;sectionPage?:number;roleId?:string;catalogSearch?:string;contentKind?:"posts"|"alert"|"watchlist";stoppedPriorDays?:number;stoppedQuietDays?:number;stoppedActiveDays?:number;hourlyContentId?:string;hourlyAuthorId?:string;hourlySearch?:string};
type Counts={visits:number;viewers:number;contributors:number;messages:number;reactions:number};


function memberEvidence(db:Database.Database,communityId:string,userId:string,window:CommunityStatsWindow,coverage:readonly CommunityStatsCoverage[],contentIds:string,channelScope:string):CommunityStatsMemberEvidence{
  const from="2015-01-01T00:00:00.000Z";
  const native=db.prepare(`SELECT from_utc,until_utc FROM community_stats_memberships WHERE community_id=? AND discord_user_id=? AND coalesce(until_utc,?)>?`).all(communityId,userId,window.asOfUtc,from) as {from_utc:string;until_utc:string|null}[];
  const links=db.prepare(`SELECT platform_user_id,from_utc,until_utc FROM community_stats_identity_links WHERE community_id=? AND discord_user_id=? AND coalesce(until_utc,?)>?`).all(communityId,userId,window.asOfUtc,from) as {platform_user_id:string;from_utc:string;until_utc:string|null}[];
  const eligibility:CommunityStatsEligibility[]=[...native.map(row=>({communityId,discordUserId:userId,surface:"discord" as const,platformUserId:null,fromUtc:row.from_utc,untilUtc:row.until_utc})),...links.map(row=>({communityId,discordUserId:userId,surface:"web" as const,platformUserId:row.platform_user_id,fromUtc:row.from_utc,untilUtc:row.until_utc}))];
  // One positive observation per day/kind/link is sufficient for gaps and exact-day cohorts.
  // Volumes and unique people are always calculated independently from the raw event table.
  const evidenceColumn=statsHistoryReady(db)?"evidence":"'live'";
  const daily=db.prepare(`SELECT ${evidenceColumn} AS evidence,platform_user_id AS platformUserId,surface,kind,min(occurred_at_utc) AS first,max(occurred_at_utc) AS last FROM community_stats_events WHERE ${channelScope} AND community_id=? AND discord_user_id=? AND occurred_at_utc>=? AND occurred_at_utc<=? AND (surface='discord' OR content_id IN(SELECT value FROM json_each(?))) GROUP BY substr(occurred_at_utc,1,10),platform_user_id,surface,kind,${evidenceColumn}`)
    .all(communityId,userId,from,window.asOfUtc,contentIds) as {evidence:"live"|"imported_message";platformUserId:string|null;surface:"web"|"discord";kind:CommunityStatsActivityPoint["kind"];first:string;last:string}[];
  const points=daily.flatMap(row=>[...new Set([row.first,row.last])].map(at=>({evidence:row.evidence,platformUserId:row.platformUserId,surface:row.surface,kind:row.kind,occurredAtUtc:at,eventId:`daily:${row.evidence}:${row.platformUserId}:${row.surface}:${row.kind}:${at}`})));
  return {communityId,discordUserId:userId,webLinkState:links.some(link=>link.from_utc<=window.asOfUtc&&(!link.until_utc||link.until_utc>window.asOfUtc))?"verified":"unlinked",eligibility,coverage,activity:points.map(point=>({...point,communityId,discordUserId:userId}))};
}

/** Every query is tenant scoped. Names are selected only after the separate named-data grant. */
export function readCommunityStats(db:Database.Database,scope:CommunityStatsRequestScope,options:CommunityStatsReadOptions):CommunityStatsReport{
  const {window,tab}=options,bounds=resolveStatsWindow(window),page=Math.max(1,Math.floor(options.page||1)),pageSize=options.exportBatchSize??25;
  if(options.exportBatchSize!==undefined&&options.exportBatchSize!==1000)throw new RangeError("Invalid internal Stats export batch.");
  const sectionPage=options.exportBatchSize?page:options.sectionPage??1;
  if(!Number.isSafeInteger(sectionPage)||sectionPage<1||!Number.isSafeInteger(sectionPage*pageSize))throw new RangeError("Invalid section page.");
  const webOnly=scope.ownContentOnly||["pages","visits","authors"].includes(tab)||(tab==="timing"&&!!(options.contentId||options.authorId||options.catalogSearch));
  const discordOnly=tab==="server"||tab==="messages",publishingOnly=tab==="publishing";
  const canReadMembers=scope.canReadNamed&&(scope.isOwner||scope.capabilities.includes("community.members.view"));
  const canReadTeam=scope.canReadNamed&&!scope.ownContentOnly&&(scope.isOwner||scope.capabilities.includes("community.team.manage"));
  if(tab==="team"&&!canReadTeam)platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  if(tab==="team"&&(options.roleId||options.contentId||options.authorId||options.segment||options.memberId||options.catalogSearch))throw new Error("Team reports use the complete current Team population.");
  if(!COMMUNITY_STATS_TABS.includes(tab)||!Number.isSafeInteger(page)||!Number.isSafeInteger(page*pageSize))throw new Error("Invalid Stats report.");
  if((tab==="members"||options.memberId)&&!canReadMembers||tab==="visits"&&!scope.canReadNamed)platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  if(scope.ownContentOnly&&!["overview","pages","authors","publishing","timing"].includes(tab))platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  const catalog=readCommunityStatsCatalog(db,scope),ready=communityStatsStorageReady(db);
  const matchingCatalog=catalog.filter(content=>communityStatsContentMatchesSearch(content,options.catalogSearch)&&(!options.contentKind||(options.contentKind==="posts"?communityStatsIsAnalystPost(content):content.type===options.contentKind))&&(tab!=="authors"||communityStatsIsAnalystPost(content))).sort((a,b)=>a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
  const selectedCatalog=[catalog.find(content=>content.id===options.contentId),catalog.find(content=>content.authorUserId===options.authorId)].filter((content):content is NonNullable<typeof content>=>!!content),choiceMap=new Map([...selectedCatalog,...matchingCatalog.slice(0,100-selectedCatalog.length)].map(content=>[content.id,content]));
  const selectedChannels=communityStatsStorageReady(db)?statsSelectedChannels(db,scope):[];
  const channelScope=statsChannelSql(selectedChannels),eventChannelScope=statsChannelSql(selectedChannels,"e");
  const empty:CommunityStatsReport={tab,window,communityName:scope.communityName,ready,scope:scope.ownContentOnly?"own_content":"community",canReadNamed:scope.canReadNamed,canReadMembers,canReadTeam,canExport:scope.canExport,isOwner:scope.isOwner,sources:[],metrics:[],columns:[],rows:[],totalRows:0,page,pageSize,trend:[],segments:{},cohorts:[],activation:null,member:null,catalog:[...choiceMap.values()],catalogTotal:catalog.length,catalogMatchTotal:matchingCatalog.length,notes:[],sections:[],roles:[]};
  if(!ready)return {...empty,notes:["Stats are not available yet."]};
  const sourceRows=db.prepare(`SELECT s.source,s.status,s.since_utc AS "Configured UTC",(SELECT min(c.from_utc) FROM community_stats_coverage c WHERE c.community_id=s.community_id AND c.source=s.source AND c.state='observed') AS "Retained data since UTC",s.checked_at_utc AS "Checked UTC",coalesce(s.last_event_at_utc,(SELECT max(e.occurred_at_utc) FROM community_stats_events e WHERE ${eventChannelScope} AND e.community_id=s.community_id AND e.surface=s.source)) AS "Last event UTC",s.reason FROM community_stats_source_state s WHERE s.community_id=? ORDER BY s.source`).all(scope.communityId) as CommunityStatsTableRow[];
  const sources=sourceRows.map(source=>source.status==="collecting"&&Date.parse(window.asOfUtc)-Date.parse(String(source["Checked UTC"]))>90_000?{...source,status:"lagging",reason:"No recent collector confirmation."}:source);
  const coverage=db.prepare(`SELECT community_id AS communityId,source,from_utc AS fromUtc,until_utc AS untilUtc,state FROM community_stats_coverage WHERE community_id=? AND until_utc>?`).all(scope.communityId,new Date(bounds.retainedFrom).toISOString()) as CommunityStatsCoverage[];
  // Negative person-level web claims also need observed guild eligibility. Global webpage
  // traffic counts retain their independent collection coverage and every positive visit.
  const webIntervals=coverage.filter(row=>row.source==="web"&&row.state==="observed"),membershipIntervals=coverage.filter(row=>row.source==="membership"&&row.state==="observed");
  const memberCoverage:CommunityStatsCoverage[]=[...coverage.filter(row=>row.source!=="web"||row.state==="gap"),...coverage.filter(row=>row.source==="membership"&&row.state==="gap").map(row=>({...row,source:"web" as const})),...webIntervals.flatMap(web=>membershipIntervals.flatMap(membership=>{const fromUtc=web.fromUtc>membership.fromUtc?web.fromUtc:membership.fromUtc,untilUtc=web.untilUtc<membership.untilUtc?web.untilUtc:membership.untilUtc;return fromUtc<untilUtc?[{communityId:scope.communityId,source:"web" as const,fromUtc,untilUtc,state:"observed" as const}]:[];}))];
  const observed=(source:"web"|"discord"|"membership",left:number,right:number)=>statsSourceObserved(coverage,scope.communityId,source,left,right);
  const sections:CommunityStatsReport["sections"][number][]=[];
  const roles=db.prepare(`SELECT role_id AS id,name FROM community_stats_roles WHERE community_id=? AND role_id!=? ORDER BY name,role_id`).all(scope.communityId,scope.guildId) as {id:string;name:string}[];
  const allowed=matchingCatalog.filter(content=>(tab!=="authors"||content.authorUserId!==null)&&(!options.contentId||content.id===options.contentId)&&(!options.authorId||content.authorUserId===options.authorId));
  const contentJson=JSON.stringify(allowed.map(content=>content.id));
  const from=new Date(bounds.start).toISOString(),until=new Date(bounds.end).toISOString();
  const memberFilter=tab==="visits"&&options.memberId?" AND discord_user_id=@memberId":"";
  const roleFilter=options.roleId?` AND discord_user_id IN(SELECT n.discord_user_id FROM community_stats_members n,json_each(n.role_ids_json) r WHERE n.community_id=@communityId AND n.active=1 AND r.value=@roleId)`:"";
  const where=`community_id=@communityId AND occurred_at_utc>=@from AND occurred_at_utc<@until AND (surface='discord' OR content_id IN (SELECT value FROM json_each(@contentIds))) ${webOnly?"AND surface='web'":discordOnly?"AND surface='discord'":""}${memberFilter}${roleFilter}`;
  const params={communityId:scope.communityId,from,until,contentIds:contentJson,...(memberFilter?{memberId:options.memberId}:{}),...(options.roleId?{roleId:options.roleId}:{})};
  const counts=(left:string,right:string):Counts=>db.prepare(`SELECT coalesce(sum(surface='web'),0) AS visits,count(DISTINCT CASE WHEN surface='web' THEN discord_user_id END) AS viewers,count(DISTINCT CASE WHEN surface='discord' THEN discord_user_id END) AS contributors,coalesce(sum(kind IN ('message','thread_reply','forum_post')),0) AS messages,coalesce(sum(kind='reaction_add'),0) AS reactions FROM community_stats_events WHERE ${channelScope} AND ${where}`).get({...params,from:left,until:right}) as Counts;
  const current=counts(from,until),previousFrom=new Date(bounds.start-(bounds.end-bounds.start)).toISOString();
  const previous=Date.parse(previousFrom)>=bounds.retainedFrom?counts(previousFrom,from):null;
  const webPrevious=previous&&observed("web",Date.parse(previousFrom),bounds.start)?previous:null;
  const discordPrevious=previous&&observed("discord",Date.parse(previousFrom),bounds.start)?previous:null;
  const confirmedUntil=Math.min(bounds.end,...(webOnly?["web"]:discordOnly?["discord","membership"]:["web","discord"]).map(source=>{const row=sources.find(item=>item.source===source);return row?Date.parse(String(row["Checked UTC"])):bounds.end;}));
  const discordAvailable=observed("discord",bounds.start,bounds.end),webAvailable=observed("web",bounds.start,bounds.end),membershipAvailable=observed("membership",bounds.start,bounds.end);
  const measuredCount=(value:number,source:"web"|"discord"|"membership",left=bounds.start,right=bounds.end):number|null=>value!==0||observed(source,left,right)?value:null;
  const rosterKnown=sources.some(source=>source.source==="membership"&&source.status==="collecting");
  const metrics=[{label:"Webpage visits",value:current.visits||webAvailable?current.visits:null,unit:"visits",previous:webPrevious?.visits??null},{label:"Webpage viewers",value:current.viewers||webAvailable?current.viewers:null,unit:"people",previous:webPrevious?.viewers??null},
    {label:"Discord contributors",value:scope.ownContentOnly||(!discordAvailable&&!current.contributors)?null:current.contributors,unit:"people",previous:discordPrevious?.contributors??null},
    {label:"Discord messages",value:scope.ownContentOnly||(!discordAvailable&&!current.messages)?null:current.messages,unit:"messages",previous:discordPrevious?.messages??null}];
  const trendRows=db.prepare(`SELECT substr(occurred_at_utc,1,10) AS date,sum(surface='web') AS web,sum(surface='discord') AS discord FROM community_stats_events WHERE ${channelScope} AND ${where} GROUP BY date ORDER BY date`).all(params) as {date:string;web:number;discord:number}[];
  const trend=trendRows.map(row=>({...row,discord:webOnly?null:row.discord}));
  let rows:CommunityStatsTableRow[]=[],columns:string[]=[],totalRows=0;
  let messageCharts:CommunityStatsReport["messageCharts"];
  let hourlyActivity:CommunityStatsReport["hourlyActivity"];
  let unlinkedMembers=0;
  const segments:Record<string,number>={both:0,discord_only:0,web_only:0,discord_active:0,web_active:0,neither_observed:0,unlinked:0,insufficient_coverage:0};
  let cohorts:CommunityStatsReport["cohorts"]=[],activation:CommunityStatsReport["activation"]=null,member:CommunityStatsReport["member"]=null;
  if(tab==="overview"&&!scope.ownContentOnly){
    const channels=db.prepare(`SELECT coalesce(c.name,'Removed channel') AS Channel,count(*) AS Messages FROM community_stats_events e LEFT JOIN community_stats_channels c ON c.community_id=e.community_id AND c.channel_id=e.channel_id WHERE ${eventChannelScope} AND e.community_id=@communityId AND e.surface='discord' AND e.kind IN('message','thread_reply','forum_post') AND e.occurred_at_utc>=@from AND e.occurred_at_utc<@until ${roleFilter.replace(" AND discord_user_id"," AND e.discord_user_id")} GROUP BY e.channel_id ORDER BY Messages DESC,e.channel_id`).all({communityId:scope.communityId,from,until,...(options.roleId?{roleId:options.roleId}:{})}) as CommunityStatsTableRow[];
    sections.push({title:"Discord messages by channel",columns:["Channel","Messages"],rows:channels});
    sections.push(...readStatsHistory(db,scope.communityId,from,until,1,2000,options.roleId).map(({title,columns,rows})=>({title,columns,rows})));
  }
  if(tab==="team")return {...empty,sources,roles:[],...readCommunityStatsTeam(db,scope,{window,page,pageSize,catalog,coverage,sources,evidence:id=>memberEvidence(db,scope.communityId,id,window,memberCoverage,JSON.stringify(catalog.map(content=>content.id)),channelScope)})};
  if(tab==="overview"){
    const analysts=readStatsAnalysts(db,scope.communityId,allowed,from,until,webAvailable,options.roleId);
    sections.push({title:"Analyst engagement",columns:["Analyst","Viewers","Views"],rows:analysts.slice(0,5)});
  }
  if(tab==="pages"){
    // Join only the authorized catalog identities; placement presence alone does
    // not distinguish branded alert posts from member watchlist publications.
    const categoryCatalog=JSON.stringify([...new Map(allowed.map(content=>[content.id,{id:content.id,category:communityStatsPageCategory(content)}])).values()]);
    const categories=db.prepare(`SELECT json_extract(category_item.value,'$.category') AS category,count(*) AS visits,count(DISTINCT discord_user_id) AS viewers,max(occurred_at_utc) AS last FROM community_stats_events JOIN json_each(@categoryCatalog) category_item ON json_extract(category_item.value,'$.id')=content_id WHERE ${channelScope} AND ${where} AND surface='web' GROUP BY category`).all({...params,categoryCatalog}) as {category:string;visits:number;viewers:number;last:string}[];
    const labels:Record<string,string>={community:"Community home",alerts:"Alerts list",alert:"Alert pages",watchlists:"Watchlists list",watchlist:"Server watchlist pages",member_watchlist:"Member watchlist pages",coaches:"Coaches list",coach:"Coach profiles"};
    const keys=[...new Set(allowed.map(communityStatsPageCategory))];
    sections.push({title:"Webpage categories",columns:["Category","Visits","Viewers","Last visit UTC"],rows:keys.map(key=>{const data=categories.find(category=>category.category===key);return {Category:labels[key]??key,Visits:data?.visits??(webAvailable?0:null),Viewers:data?.viewers??(webAvailable?0:null),"Last visit UTC":data?.last??null};})});
  }
  if(tab==="pages"||tab==="authors"||scope.ownContentOnly&&tab==="overview"){
    const author=tab==="authors";
    columns=author?["Analyst","Alerts","Watchlists","Viewers","Returning viewers","Views","Avg viewers per post","Last view UTC"]:["Page","Type","Author","Visits","Viewers","Returning viewers","Last visit UTC"];
    if(author)rows=readStatsAnalysts(db,scope.communityId,allowed,from,until,webAvailable,options.roleId);
    else{
      const stats=db.prepare(`SELECT content_id AS id,sum(visits) AS visits,count(*) AS viewers,sum(dates>1) AS "returning",max(last) AS last FROM (SELECT content_id,discord_user_id,count(*) AS visits,count(DISTINCT substr(occurred_at_utc,1,10)) AS dates,max(occurred_at_utc) AS last FROM community_stats_events WHERE ${channelScope} AND ${where} AND surface='web' GROUP BY content_id,discord_user_id) GROUP BY content_id`).all(params) as {id:string;visits:number;viewers:number;returning:number;last:string}[];
      const byId=new Map(stats.map(row=>[row.id,row]));
      rows=allowed.map(content=>({Page:content.title,Type:content.type,Author:content.authorName??"Community",Visits:byId.get(content.id)?.visits??(content.mode!=="tracked_page"||!webAvailable?null:0),Viewers:byId.get(content.id)?.viewers??(content.mode!=="tracked_page"||!webAvailable?null:0),"Returning viewers":byId.get(content.id)?.returning??(content.mode!=="tracked_page"||!webAvailable?null:0),"Last visit UTC":byId.get(content.id)?.last??null,contentId:content.id}));
    }
    totalRows=rows.length;rows=(author?rows:rows.sort((a,b)=>Number(b.Visits)-Number(a.Visits)||String(a.contentId??a.authorId??"").localeCompare(String(b.contentId??b.authorId??"")))).slice((page-1)*pageSize,page*pageSize);
  }
  if(tab==="visits"){
    columns=["Discord username","Display name at visit","Page","Type","Visited UTC","Source"];
    totalRows=current.visits;
    rows=db.prepare(`SELECT discord_user_id AS memberId,content_id AS contentId,username AS "Discord username",display_name AS "Display name at visit",title AS Page,content_type AS Type,occurred_at_utc AS "Visited UTC",${statsTrafficProjection(db,"source")} AS Source FROM community_stats_events WHERE ${channelScope} AND ${where} AND surface='web' ORDER BY occurred_at_utc DESC,event_id DESC LIMIT @limit OFFSET @offset`).all({...params,limit:pageSize,offset:(page-1)*pageSize}) as CommunityStatsTableRow[];
  }
  if(tab==="visits"||tab==="pages"){
    const sources=db.prepare(`SELECT ${statsTrafficProjection(db,"source")} AS Source,${statsTrafficProjection(db,"category")} AS Type,count(*) AS Visits,count(DISTINCT discord_user_id) AS Viewers FROM community_stats_events WHERE ${channelScope} AND ${where} AND surface='web' GROUP BY Source,Type ORDER BY Visits DESC,Source`).all(params) as CommunityStatsTableRow[];
    sections.push({title:"Traffic sources",columns:["Source","Type","Visits","Viewers"],rows:sources.slice((sectionPage-1)*pageSize,sectionPage*pageSize),totalRows:sources.length,page:sectionPage,pageSize});
    const campaigns=db.prepare(`SELECT ${statsTrafficProjection(db,"campaign_name")} AS Campaign,${statsTrafficProjection(db,"source")} AS Source,${statsTrafficProjection(db,"campaign_medium")} AS Medium,count(*) AS Visits,count(DISTINCT discord_user_id) AS Viewers FROM community_stats_events WHERE ${channelScope} AND ${where} AND surface='web' AND ${statsTrafficProjection(db,"category")}='Campaign' GROUP BY Campaign,Source,Medium ORDER BY Visits DESC,Campaign,Source`).all(params) as CommunityStatsTableRow[];
    if(campaigns.length)sections.push({title:"Campaigns",columns:["Campaign","Source","Medium","Visits","Viewers"],rows:campaigns.slice((sectionPage-1)*pageSize,sectionPage*pageSize),totalRows:campaigns.length,page:sectionPage,pageSize});
  }
  if(tab==="timing"||tab==="overview"){
    let hourlyColumns=["Weekday UTC","Hour UTC","Webpage visits","Discord contributions"];
    const hourlyIds=tab==="overview"&&(options.hourlyContentId||options.hourlyAuthorId||options.hourlySearch)?JSON.stringify(catalog.filter(item=>communityStatsContentMatchesSearch(item,options.hourlySearch)&&(!options.hourlyContentId||item.id===options.hourlyContentId)&&(!options.hourlyAuthorId||item.authorUserId===options.hourlyAuthorId)).map(item=>item.id)):contentJson;
    let hourlyRows=db.prepare(`SELECT strftime('%w',occurred_at_utc) AS "Weekday UTC",strftime('%H',occurred_at_utc) AS "Hour UTC",sum(surface='web') AS "Webpage visits",sum(surface='discord') AS "Discord contributions" FROM community_stats_events WHERE ${channelScope} AND ${where} GROUP BY 1,2 ORDER BY 1,2`).all({...params,contentIds:hourlyIds}) as CommunityStatsTableRow[];
    hourlyRows=hourlyRows.map(row=>({...row,"Webpage visits":measuredCount(Number(row["Webpage visits"]),"web"),"Discord contributions":measuredCount(Number(row["Discord contributions"]),"discord")}));
    if(webOnly){hourlyColumns=hourlyColumns.filter(column=>column!=="Discord contributions");hourlyRows=hourlyRows.map(({["Discord contributions"]:ignored,...row})=>{void ignored;return row;});}
    if(tab==="overview")hourlyActivity={columns:hourlyColumns,rows:hourlyRows};
    else {columns=hourlyColumns;rows=hourlyRows;totalRows=rows.length;}
  }
  if(tab==="server"){
    const roster=db.prepare(`SELECT count(*) AS n FROM community_stats_members WHERE community_id=@communityId AND active=1 AND is_bot=0 ${roleFilter}`).get({communityId:scope.communityId,...(options.roleId?{roleId:options.roleId}:{})}) as {n:number};
    metrics.unshift({label:"Server members",value:rosterKnown?roster.n:null,unit:"people",previous:null});
    const growth=db.prepare(`SELECT sum(join_kind='observed_join' AND coalesce(joined_at_utc,from_utc)>=@from AND coalesce(joined_at_utc,from_utc)<@until) AS joins,sum(join_kind='rejoin' AND coalesce(joined_at_utc,from_utc)>=@from AND coalesce(joined_at_utc,from_utc)<@until) AS rejoins,sum(end_kind='observed_leave' AND until_utc>=@from AND until_utc<@until) AS leaves FROM community_stats_memberships WHERE community_id=@communityId ${roleFilter}`).get({communityId:scope.communityId,from,until,...(options.roleId?{roleId:options.roleId}:{})}) as {joins:number|null;rejoins:number|null;leaves:number|null};
    sections.push({title:"Membership changes",columns:["Population","Members"],rows:[{Population:"New members",Members:measuredCount(growth.joins??0,"membership")},{Population:"Rejoins",Members:measuredCount(growth.rejoins??0,"membership")},{Population:"Members who left",Members:measuredCount(growth.leaves??0,"membership")},{Population:"Net membership change",Members:measuredCount((growth.joins??0)+(growth.rejoins??0)-(growth.leaves??0),"membership")}]});
    sections.push(...readStatsInviteReports(db,scope.communityId,selectedChannels,from,until,scope.canReadNamed,sectionPage,pageSize,options.roleId));
  }
  if(tab==="messages"){
    columns=["Channel","Messages","Reactions","Contributors","Median reply seconds"];
    rows=db.prepare(`SELECT e.channel_id AS channelId,coalesce(c.name,'Removed channel') AS Channel,sum(e.kind IN ('message','thread_reply','forum_post')) AS Messages,count(DISTINCT e.discord_user_id) AS Contributors,NULL AS "Median reply seconds" FROM community_stats_events e LEFT JOIN community_stats_channels c ON c.community_id=e.community_id AND c.channel_id=e.channel_id WHERE ${eventChannelScope} AND e.community_id=@communityId AND e.surface='discord' AND e.kind IN('message','thread_reply','forum_post') AND e.occurred_at_utc>=@from AND e.occurred_at_utc<@until ${roleFilter.replace(" AND discord_user_id"," AND e.discord_user_id")} GROUP BY e.channel_id ORDER BY Messages DESC,e.channel_id`).all({communityId:scope.communityId,from,until,...(options.roleId?{roleId:options.roleId}:{})}) as CommunityStatsTableRow[];
    rows=rows.map(row=>{const delays=db.prepare(`SELECT min(${statsReplySecondsSql()}) AS delay FROM community_stats_events e JOIN community_stats_events p ON p.community_id=e.community_id AND p.event_id=e.reply_to_event_id WHERE ${eventChannelScope} AND ${statsChannelIdSql(selectedChannels,"p")} AND e.community_id=@communityId AND e.channel_id=@channelId AND e.occurred_at_utc>=@from AND e.occurred_at_utc<@until ${roleFilter.replace(" AND discord_user_id"," AND e.discord_user_id")} GROUP BY e.reply_to_event_id HAVING delay IS NOT NULL ORDER BY delay`).all({communityId:scope.communityId,from,until,channelId:row.channelId,...(options.roleId?{roleId:options.roleId}:{})}) as {delay:number}[];if(!delays.length)return row;const middle=Math.floor(delays.length/2);return {...row,"Median reply seconds":delays.length%2?delays[middle].delay:(delays[middle-1].delay+delays[middle].delay)/2};});
    const memberReactions=new Map(readStatsMemberReactions(db,scope.communityId,from,until,selectedChannels,options.roleId).map(row=>[row.channelId,row["Reactions"]]));
    rows=rows.map(row=>{const values={...row};values["Reactions"]=memberReactions.get(String(row.channelId))??null;for(const column of ["Contributors"])values[column]=measuredCount(Number(row[column]),"discord");return values;});
    totalRows=rows.length;
    const breadth=db.prepare(`SELECT discord_user_id,count(DISTINCT channel_id) AS channels,count(*) AS contributions FROM community_stats_events WHERE ${channelScope} AND community_id=@communityId AND surface='discord' AND kind IN('message','thread_reply','forum_post') AND occurred_at_utc>=@from AND occurred_at_utc<@until ${roleFilter} GROUP BY discord_user_id ORDER BY contributions DESC`).all({communityId:scope.communityId,from,until,...(options.roleId?{roleId:options.roleId}:{})}) as {discord_user_id:string;channels:number;contributions:number}[];
    const people=db.prepare(`SELECT i.user_id,i.auth_subject FROM platform_auth_identities i JOIN platform_users u ON u.user_id=i.user_id AND u.status='active' JOIN traderlink_communities c ON c.community_id=? LEFT JOIN traderlink_community_memberships m ON m.user_id=i.user_id AND m.community_id=c.community_id AND m.status='active' JOIN community_stats_members n ON n.community_id=c.community_id AND n.discord_user_id=i.auth_subject AND n.active=1 AND n.is_bot=0 WHERE i.auth_provider='discord' AND i.status='active' AND (m.user_id IS NOT NULL OR i.user_id=c.owner_user_id)`).all(scope.communityId) as {user_id:string;auth_subject:string}[];
    const permissions=new TraderLinkCommunityRepository(db),teamIds=people.filter(person=>{const access=permissions.resolveAccess(scope.communityId,person.user_id);return access.isOwner||access.capabilities.some(key=>["community.manage","community.team.manage","community.roles.manage","community.members.view","community.member_activity.view","community.analytics.view","community.discord.manage","community.alerts.create","community.alerts.manage_all","community.watchlists.publish_staff","community.watchlists.manage_all","community.coaching.offer","community.coaching.students","community.coaching.manage_all","community.referrals.view"].includes(key));}).map(person=>person.auth_subject);
    const staffReplies=db.prepare(`SELECT min(${statsReplySecondsSql()}) AS delay FROM community_stats_events e JOIN community_stats_events p ON p.community_id=e.community_id AND p.event_id=e.reply_to_event_id WHERE ${eventChannelScope} AND ${statsChannelIdSql(selectedChannels,"p")} AND e.community_id=@communityId AND e.occurred_at_utc>=@from AND e.occurred_at_utc<@until AND e.discord_user_id IN(SELECT value FROM json_each(@team)) ${roleFilter.replace(" AND discord_user_id"," AND e.discord_user_id")} GROUP BY e.reply_to_event_id HAVING delay IS NOT NULL`).all({communityId:scope.communityId,from,until,team:JSON.stringify(teamIds),...(options.roleId?{roleId:options.roleId}:{})}) as {delay:number}[];
    const teamContributors=breadth.filter(person=>teamIds.includes(person.discord_user_id)).length;
    sections.push({title:"Team and member messages",columns:["Measure","Value"],rows:[{Measure:"Team messages",Value:breadth.filter(person=>teamIds.includes(person.discord_user_id)).reduce((sum,person)=>sum+person.contributions,0)|| (discordAvailable?0:null)},{Measure:"Member messages",Value:breadth.filter(person=>!teamIds.includes(person.discord_user_id)).reduce((sum,person)=>sum+person.contributions,0)|| (discordAvailable?0:null)},{Measure:"Team contributors",Value:measuredCount(teamContributors,"discord")},{Measure:"Other contributors",Value:measuredCount(breadth.length-teamContributors,"discord")},{Measure:"Messages answered by the team",Value:measuredCount(staffReplies.length,"discord")},{Measure:"Median team response time (seconds)",Value:statsMedian(staffReplies.map(row=>row.delay))}]});
    rows=rows.slice((page-1)*pageSize,page*pageSize);
    const messageReport=readStatsMessages(db,scope,{from,until,channels:selectedChannels,roleId:options.roleId,page:sectionPage,pageSize,canReadMembers,observed:discordAvailable});
    messageCharts=messageReport.charts;hourlyActivity=messageReport.hourly;sections.push(...messageReport.sections);
    metrics.splice(0,metrics.length,...messageReport.metrics);
  }
  if(tab==="members"&&options.segment==="stopped_posting"){
    const stopped=readStatsStoppedPosting(db,scope,{window,channels:selectedChannels,roleId:options.roleId,page,pageSize,coverage,priorDays:options.stoppedPriorDays??30,quietDays:options.stoppedQuietDays??14,activeDays:options.stoppedActiveDays??3});
    return {...empty,sources:sources.filter(source=>source.source!=="web"),roles,...stopped};
  }
  if(["overview","participation","members"].includes(tab)&&!scope.ownContentOnly){
    // Rank the complete roster before the loop applies filters and pagination.
    // Keep the lightweight roster order for aggregate-only reports.
    const rankMembers=tab==="members"&&canReadMembers;
    const activityRanking=rankMembers?`WITH member_activity AS (
      SELECT e.discord_user_id,max(e.occurred_at_utc>=@from) AS in_period,max(e.occurred_at_utc) AS last_activity
      FROM community_stats_events e
      WHERE ${eventChannelScope} AND e.community_id=@community
        AND e.occurred_at_utc>=@retainedFrom AND e.occurred_at_utc<@until
        AND (e.surface='discord' OR e.content_id IN(SELECT value FROM json_each(@contents)))
      GROUP BY e.discord_user_id
    ) `:"";
    const population=db.prepare(`${activityRanking}SELECT m.discord_user_id AS id,m.active${canReadMembers?",m.username,m.display_name AS name,m.joined_at_utc":""}
      FROM community_stats_members m ${rankMembers?"LEFT JOIN member_activity a ON a.discord_user_id=m.discord_user_id":""}
      WHERE m.community_id=@community AND m.is_bot=0 AND(m.active=1 OR m.discord_user_id=@member)
      ORDER BY ${rankMembers?"coalesce(a.in_period,0) DESC,a.last_activity DESC,":""}m.discord_user_id`)
      .iterate({community:scope.communityId,member:options.memberId??"",...(rankMembers?{from,until,retainedFrom:new Date(bounds.retainedFrom).toISOString(),contents:JSON.stringify(catalog.map(item=>item.id))}:{})}) as Iterable<{id:string;active:number;username?:string;name?:string;joined_at_utc?:string|null}>;
    let matching=0;
    columns=canReadMembers?["Discord username","Display name","Joined server UTC","Discord messages","Webpage visits","Last Discord contribution UTC","Last webpage visit UTC"]:["Participation","Members"];
    for(const person of population){
      if(options.roleId&&!db.prepare(`SELECT 1 FROM community_stats_members n,json_each(n.role_ids_json) r WHERE n.community_id=? AND n.discord_user_id=? AND n.active=1 AND r.value=?`).get(scope.communityId,person.id,options.roleId))continue;
      const plainMember=tab==="members"&&!options.segment&&person.active===1;
      if(plainMember){matching++;if(options.memberId!==person.id&&(matching<=(page-1)*pageSize||matching>page*pageSize))continue;}
      const evidence=memberEvidence(db,scope.communityId,person.id,window,memberCoverage,JSON.stringify(catalog.map(item=>item.id)),channelScope);
      if(person.active===1&&evidence.webLinkState!=="verified")unlinkedMembers++;
      const rawParticipation=calculateCommunityStatsParticipation(evidence,window);
      const confirmedGap=(surface:"discord"|"web")=>{
        const state=sources.find(source=>source.source===surface),membership=sources.find(source=>source.source==="membership"),cutoff=state?Math.min(bounds.end,Date.parse(String(state["Checked UTC"])),surface==="web"&&membership?Date.parse(String(membership["Checked UTC"])):bounds.end):NaN;
        if(state?.status!=="collecting"||!Number.isFinite(cutoff)||cutoff<bounds.start||Date.parse(window.asOfUtc)-cutoff>90_000)return rawParticipation[surface];
        const throughDate=new Date(cutoff).toISOString().slice(0,10);
        const confirmed=calculateCommunityStatsParticipation(evidence,{...window,asOfUtc:new Date(cutoff).toISOString(),throughDate:throughDate<window.throughDate?throughDate:window.throughDate})[surface];
        return {...rawParticipation[surface],currentGapDays:confirmed.currentGapDays,currentGapState:confirmed.currentGapState,measuredThroughUtc:confirmed.measuredThroughUtc};
      };
      const participation=rawParticipation;
      if(person.active===1)segments[participation.segment]++;
      const priorThrough=new Date(bounds.start-86_400_000).toISOString().slice(0,10),spanDays=Math.round((Date.parse(window.throughDate)-Date.parse(window.fromDate))/86_400_000)+1;
      const priorStart=Date.parse(window.fromDate)-spanDays*86_400_000;
      const previousParticipation=options.segment?.endsWith("_decline")&&priorStart>=bounds.retainedFrom?calculateCommunityStatsParticipation(evidence,{...window,fromDate:new Date(priorStart).toISOString().slice(0,10),throughDate:priorThrough}):null;
      if(options.memberId===person.id&&canReadMembers){
        const eventPage=options.memberPage??1;
        const contentScope=JSON.stringify(catalog.map(item=>item.id));
        const total=db.prepare(`SELECT count(*) AS n FROM community_stats_events WHERE ${channelScope} AND community_id=? AND discord_user_id=? AND occurred_at_utc>=? AND occurred_at_utc<? AND (surface='discord' OR content_id IN(SELECT value FROM json_each(?)))`).get(scope.communityId,person.id,from,until,contentScope) as {n:number};
        const events=db.prepare(`SELECT surface AS Surface,kind AS Activity,occurred_at_utc AS "Time UTC",title AS Page,username AS "Name at event" FROM community_stats_events WHERE ${channelScope} AND community_id=? AND discord_user_id=? AND occurred_at_utc>=? AND occurred_at_utc<? AND (surface='discord' OR content_id IN(SELECT value FROM json_each(?))) ORDER BY occurred_at_utc DESC,event_id DESC LIMIT 25 OFFSET ?`).all(scope.communityId,person.id,from,until,contentScope,(eventPage-1)*25) as CommunityStatsTableRow[];
        const dailyVolumes=db.prepare(`SELECT surface,substr(occurred_at_utc,1,10) AS date,count(*) AS n FROM community_stats_events WHERE ${channelScope} AND community_id=? AND discord_user_id=? AND occurred_at_utc>=? AND occurred_at_utc<? AND(surface='discord' OR content_id IN(SELECT value FROM json_each(?))) GROUP BY surface,date`).all(scope.communityId,person.id,new Date(bounds.retainedFrom).toISOString(),until,contentScope) as {surface:"web"|"discord";date:string;n:number}[];
        const exactSurface=(surface:"discord"|"web")=>{
          const metrics=confirmedGap(surface),volumes=new Map(dailyVolumes.filter(row=>row.surface===surface).map(row=>[row.date,row.n]));
          return {...metrics,eventsInReport:dailyVolumes.filter(row=>row.surface===surface&&row.date>=window.fromDate).reduce((sum,row)=>sum+row.n,0),days:metrics.days.map(date=>({...date,eventCount:volumes.get(date.date)??0}))};
        };
        const volumes=(left:string,right:string)=>db.prepare(`SELECT coalesce(sum(kind IN('message','thread_reply','forum_post')),0) AS messages,coalesce(sum(kind='reaction_add'),0) AS reactions,coalesce(sum(surface='web'),0) AS visits,count(DISTINCT CASE WHEN surface='web' THEN content_id END) AS pages FROM community_stats_events WHERE ${channelScope} AND community_id=? AND discord_user_id=? AND occurred_at_utc>=? AND occurred_at_utc<? AND(surface='discord' OR content_id IN(SELECT value FROM json_each(?)))`).get(scope.communityId,person.id,left,right,contentScope) as {messages:number;reactions:number;visits:number;pages:number};
        const currentVolumes=volumes(from,until);
        const measures:CommunityStatsTableRow[]=[];
        for(const [label,surface,key,divisor] of [["Discord messages","discord","messages",1],["Discord reaction additions","discord","reactions",1],["Webpage visits","web","visits",1],["Distinct webpages visited","web","pages",1]] as const){
          const currentObserved=observed(surface,bounds.start,bounds.end),value=currentVolumes[key]/divisor;
          measures.push({Measure:label,Current:value||currentObserved?Math.round(value*10)/10:null});
        }
        member={name:person.username??person.id,participation:{...participation,discord:exactSurface("discord"),web:exactSurface("web")},events,totalEvents:total.n,eventPage,measures};
      }
      if(person.active!==1)continue;
      if(options.segment?.endsWith("_decline")){
        const surface=options.segment==="discord_decline"?"discord":"web",currentSurface=participation[surface],priorSurface=previousParticipation?.[surface];
        if(!priorSurface||!currentSurface.observedCompleteDates||currentSurface.observedCompleteDates!==priorSurface.observedCompleteDates||currentSurface.unknownCompleteDates||priorSurface.unknownCompleteDates||currentSurface.activeCompleteDates>=priorSurface.activeCompleteDates)continue;
      }else if(options.segment==="discord_any"&&!["both","discord_only","discord_active"].includes(participation.segment))continue;
      else if(options.segment==="web_any"&&!["both","web_only","web_active"].includes(participation.segment))continue;
      else if(options.segment&&!["discord_any","web_any"].includes(options.segment)&&options.segment!==participation.segment)continue;
      if(!plainMember)matching++;
      if(canReadMembers&&matching>(page-1)*pageSize&&matching<=page*pageSize){
        const volumes=db.prepare(`SELECT coalesce(sum(surface='discord' AND kind IN('message','thread_reply','forum_post')),0) AS messages,coalesce(sum(surface='web'),0) AS visits FROM community_stats_events WHERE ${channelScope} AND community_id=@community AND discord_user_id=@user AND occurred_at_utc>=@from AND occurred_at_utc<@until AND (surface='discord' OR content_id IN(SELECT value FROM json_each(@contents)))`).get({community:scope.communityId,user:person.id,from,until,contents:JSON.stringify(catalog.map(item=>item.id))}) as {messages:number;visits:number};
        rows.push({"Discord username":person.username??"n/a","Display name":person.name??null,"Joined server UTC":person.joined_at_utc??null,"Discord messages":measuredCount(volumes.messages,"discord"),"Webpage visits":measuredCount(volumes.visits,"web"),"Last Discord contribution UTC":participation.discord.lastObservedAtUtc,"Last webpage visit UTC":participation.web.lastObservedAtUtc,memberId:person.id});
      }
    }
    totalRows=matching;
    const participationPopulationKnown=rosterKnown||Object.values(segments).some(count=>count>0);
    if(!canReadMembers){rows=(options.segment?.endsWith("_decline")||["discord_any","web_any"].includes(options.segment??""))?[{Participation:options.segment??"",Members:participationPopulationKnown?matching:null}]:Object.entries(segments).filter(([key])=>!options.segment||options.segment===key).map(([Participation,Members])=>({Participation,Members:participationPopulationKnown?Members:null}));totalRows=rows.length;}


  }
  if(tab==="publishing"){
    columns=["Page","Type","Destination","Status","Requested UTC","Delivered UTC","Discord message"];
    const publicCoachIds=JSON.stringify(allowed.filter(content=>content.type==="coach").map(content=>content.id));
    const planMetadata=db.prepare(`SELECT p.plan_id,p.name,p.coach_profile_id FROM traderlink_community_coaching_plans p JOIN traderlink_community_coach_profiles c ON c.community_id=p.community_id AND c.coach_profile_id=p.coach_profile_id JOIN traderlink_community_audiences a ON a.community_id=p.community_id AND a.audience_id=p.audience_id WHERE p.community_id=@community AND p.coach_profile_id IN(SELECT value FROM json_each(@coaches)) AND (@owner=1 OR @manager=1 OR(c.user_id=@actor AND @offer=1) OR(p.status='active' AND a.status='active' AND(a.mode='everyone' OR EXISTS(SELECT 1 FROM traderlink_community_audience_discord_roles r WHERE r.community_id=a.community_id AND r.audience_id=a.audience_id AND r.discord_role_id IN(SELECT value FROM json_each(@roles))))))`).all({community:scope.communityId,coaches:publicCoachIds,owner:scope.isOwner?1:0,manager:scope.capabilities.includes("community.coaching.manage_all")?1:0,offer:scope.capabilities.includes("community.coaching.offer")?1:0,actor:scope.actorUserId,roles:JSON.stringify(scope.discordRoleIds)}) as {plan_id:string;name:string;coach_profile_id:string}[];
    const publicationMetadata=new Map<string,{title:string;publicationMode:string}>(allowed.map(content=>[content.canonicalId??content.id,{title:content.title,publicationMode:content.publicationMode??"unknown"}]));
    for(const plan of planMetadata)publicationMetadata.set(plan.plan_id,{title:plan.name,publicationMode:"unknown"});
    const objectIds=JSON.stringify([...publicationMetadata.keys()]);
    const publicationParams={communityId:scope.communityId,guildId:scope.guildId,from,until,ids:objectIds,owner:scope.isOwner?1:0,channels:JSON.stringify(scope.readableChannelIds)};
    const deliverySql=`SELECT d.object_id AS id,d.object_type AS Type,x.name AS Destination,CASE WHEN d.discord_message_id IS NOT NULL THEN 'https://discord.com/channels/'||@guildId||'/'||x.discord_channel_id||'/'||d.discord_message_id END AS "Discord message",d.requested_at_utc AS "Requested UTC",d.status AS Status,d.delivered_at_utc AS "Delivered UTC" FROM traderlink_community_content_deliveries d JOIN traderlink_community_discord_destinations x ON x.community_id=d.community_id AND x.destination_id=d.destination_id WHERE d.community_id=@communityId AND d.requested_at_utc>=@from AND d.requested_at_utc<@until AND d.object_id IN (SELECT value FROM json_each(@ids)) AND (@owner=1 OR x.discord_channel_id IN(SELECT value FROM json_each(@channels))) ORDER BY d.requested_at_utc DESC,d.delivery_id DESC`;
    const deliveryCount=db.prepare(`SELECT count(*) AS n FROM (${deliverySql})`).get(publicationParams) as {n:number};
    const values=db.prepare(`${deliverySql} LIMIT @limit OFFSET @offset`).all({...publicationParams,limit:pageSize,offset:(page-1)*pageSize}) as (CommunityStatsTableRow&{id:string})[];
    const contentFor=(id:string)=>publicationMetadata.get(id);
    totalRows=deliveryCount.n;rows=values.map(({id,...row})=>({Page:contentFor(id)?.title??"Removed content",Mode:contentFor(id)?.publicationMode??"unknown",...row}));
    const sharedReady=db.prepare(`SELECT count(*) AS n FROM sqlite_schema WHERE type='table' AND name IN('community_shared_alert_requests','community_shared_alert_deliveries')`).get() as {n:number};
    if(sharedReady.n===2){
      const sharedSql=`SELECT CASE WHEN r.source_community_id=@communityId THEN 'Outgoing' ELSE 'Incoming' END AS Direction,d.kind AS Kind,d.delivery_id AS Delivery,d.original_delivery_id AS "Original delivery",d.status AS Status,d.created_at_utc AS "Requested UTC",d.updated_at_utc AS "Updated UTC" FROM community_shared_alert_deliveries d JOIN community_shared_alert_requests r ON r.request_id=d.request_id WHERE d.created_at_utc>=@from AND d.created_at_utc<@until AND ((r.source_community_id=@communityId AND d.alert_id IN(SELECT value FROM json_each(@ids))) OR (@own=0 AND r.receiver_community_id=@communityId AND (@owner=1 OR d.channel_id IN(SELECT value FROM json_each(@channels))))) ORDER BY d.created_at_utc DESC,d.delivery_id DESC`;
      const sharedBindings={...publicationParams,ids:JSON.stringify(allowed.filter(content=>content.type==="alert").map(content=>content.id)),own:scope.ownContentOnly?1:0},sharedCount=db.prepare(`SELECT count(*) AS n FROM (${sharedSql})`).get(sharedBindings) as {n:number};
      const sharedRows=db.prepare(`${sharedSql} LIMIT @limit OFFSET @offset`).all({...sharedBindings,limit:pageSize,offset:(sectionPage-1)*pageSize}) as CommunityStatsTableRow[];
      sections.push({title:"Shared alert deliveries",columns:["Direction","Kind","Status","Requested UTC","Updated UTC"],rows:sharedRows,totalRows:sharedCount.n,page:sectionPage,pageSize});
    }
  }
  if(tab==="server"){
    sections.push(...readStatsHistory(db,scope.communityId,from,until,page,pageSize,options.roleId));
  }
  if(tab==="messages"){
    // Member-role filters do not describe bots; never attribute automated work to those roles.
    if(!options.roleId){const bots=readStatsBotActivity(db,scope.communityId,from,until,selectedChannels);sections.push({title:"Server Bots",columns:["Channel","Bot messages","Webhook messages","Reactions"],rows:bots.slice((sectionPage-1)*pageSize,sectionPage*pageSize),totalRows:bots.length,page:sectionPage,pageSize});}
  }
  return {...empty,...(messageCharts?{messageCharts}:{}),...(hourlyActivity?{hourlyActivity}:{}),sources:publishingOnly?[]:sources.filter(source=>webOnly?source.source==="web":discordOnly?source.source!=="web":true),metrics:publishingOnly||tab==="members"?[]:metrics.filter(metric=>tab==="server"?metric.label==="Server members":tab==="messages"?true:webOnly?metric.label.startsWith("Webpage"):discordOnly?(metric.label.startsWith("Discord")||metric.label==="Server members"):true).map(metric=>tab==="authors"?{...metric,label:metric.label==="Webpage visits"?"Views":metric.label==="Webpage viewers"?"Unique viewers":metric.label}:metric),trend,rows,columns,totalRows,segments,unlinkedMembers,cohorts,activation,member,notes:["All dates and times are UTC.",...(tab==="server"?["Join months describe members currently in the server."]:[]),...(tab==="messages"?["Messages and replies use the selected dates and included channels. Contributors are distinct people who posted. Reactions are current counts on those messages. Reply times measure the first recorded reply from someone else during the selected dates."]:[]),...(["members","participation"].includes(tab)?["Discord activity records contributions, not time spent reading the server."]:[]),...(options.roleId?["Role filters use current member roles."]:[])],sections,roles,...(discordOnly?{catalog:[],catalogTotal:0,catalogMatchTotal:0}:{})};
}

/** Streaming named export shares the same authorized content scope and exact UTC interval. */
export function openCommunityStatsEventExport(db:Database.Database,scope:CommunityStatsRequestScope,options:CommunityStatsReadOptions,timeline=false):Readonly<{columns:readonly string[];rows:Iterable<CommunityStatsTableRow>}>{
  if(!scope.canExport||!scope.canReadNamed||scope.ownContentOnly||timeline&&(!options.memberId||!scope.isOwner&&!scope.capabilities.includes("community.members.view")))platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  const channelScope=statsChannelSql(statsSelectedChannels(db,scope));
  if(!scope.canExport||!scope.canReadNamed||scope.ownContentOnly)platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  const bounds=resolveStatsWindow(options.window),catalog=readCommunityStatsCatalog(db,scope).filter(content=>communityStatsContentMatchesSearch(content,options.catalogSearch)&&(!options.contentKind||(options.contentKind==="posts"?communityStatsIsAnalystPost(content):content.type===options.contentKind))&&(!options.contentId||content.id===options.contentId)&&(!options.authorId||content.authorUserId===options.authorId));
  const columns=timeline?["Surface","Activity","Time UTC","Page","Name at event"]:["Discord username","Display name at visit","Page","Type","Visited UTC","Source"];
  const projection=timeline?`surface AS Surface,kind AS Activity,occurred_at_utc AS "Time UTC",title AS Page,username AS "Name at event"`:`username AS "Discord username",display_name AS "Display name at visit",title AS Page,content_type AS Type,occurred_at_utc AS "Visited UTC",${statsTrafficProjection(db,"source")} AS Source`;
  const rows=db.prepare(`SELECT ${projection} FROM community_stats_events WHERE ${channelScope} AND community_id=@communityId AND occurred_at_utc>=@from AND occurred_at_utc<@until AND (surface='discord' OR content_id IN(SELECT value FROM json_each(@contentIds))) ${timeline?"":"AND surface='web'"} ${options.memberId?"AND discord_user_id=@memberId":""} ${options.roleId?"AND discord_user_id IN(SELECT n.discord_user_id FROM community_stats_members n,json_each(n.role_ids_json) r WHERE n.community_id=@communityId AND n.active=1 AND r.value=@roleId)":""} ORDER BY occurred_at_utc DESC,event_id DESC`).iterate({communityId:scope.communityId,from:new Date(bounds.start).toISOString(),until:new Date(bounds.end).toISOString(),contentIds:JSON.stringify(catalog.map(content=>content.id)),...(options.memberId?{memberId:options.memberId}:{}),...(options.roleId?{roleId:options.roleId}:{})}) as Iterable<CommunityStatsTableRow>;
  return {columns,rows};
}
