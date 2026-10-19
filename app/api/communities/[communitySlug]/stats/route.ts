import {randomUUID} from "node:crypto";
import {requireTraderLinkPlatformRequestIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {openReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {openPlatformDatabase} from "@/src/modules/platform/server/database/open-platform-database";
import {authorizeCommunityStats,assertStatsSameOrigin,readCommunityStatsJson,isCommunityStatsAccessDenied} from "@/src/modules/communities/server/stats/community-stats-access";
import {COMMUNITY_STATS_TABS,readCommunityStats,openCommunityStatsEventExport} from "@/src/modules/communities/server/stats/community-stats-read";
import type {CommunityStatsTab,CommunityStatsWindow} from "@/src/modules/communities/contracts/community-stats-contracts";
import {CommunityStatsRepository,communityStatsStorageReady} from "@/src/modules/communities/server/stats/community-stats-repository";
import {TraderLinkCommunityRepository} from "@/src/modules/communities/server/traderlink-community-repository";
import {platformFailure} from "@/src/modules/platform/server/database/platform-migration-contract";
import {resolveStatsWindow} from "@/src/modules/communities/server/stats/community-stats-coverage";
import {communityStatsWorkbookSheets,streamStatsWorkbook} from "@/src/modules/communities/server/stats/community-stats-workbook";
import {exportCommunityStatsIdentity} from "@/src/modules/communities/server/stats/community-stats-retention";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store","Vary":"Cookie"};
type Context={params:Promise<{communitySlug:string}>};
class StatsSettingsConflict extends Error{}
function failure(error:unknown):Response{
  if(isCommunityStatsAccessDenied(error))return Response.json({error:"Stats are unavailable for this account."},{status:404,headers});
  if(error instanceof SyntaxError||error instanceof RangeError||error instanceof TypeError)return Response.json({error:"Invalid Stats request."},{status:400,headers});
  throw error;
}
function csvCell(value:unknown):string{
  let text=value===null||value===undefined?"":String(value);
  if(/^[\s]*[=+@-]/u.test(text))text=`'${text}`;
  return `"${text.replaceAll('"','""')}"`;
}
export async function GET(request:Request,context:Context):Promise<Response>{
  let database:ReturnType<typeof openReadonlyPlatformDatabase>|null=null;
  try{
    const identity=requireTraderLinkPlatformRequestIdentity(request.headers),{communitySlug}=await context.params;
    database=openReadonlyPlatformDatabase();
    const query=new URL(request.url).searchParams;
    const scope=await authorizeCommunityStats(database,communitySlug,identity.scope.userId,query.get("personal")==="1"?"visit":"read");
    if(query.get("personal")==="1")return Response.json({events:exportCommunityStatsIdentity(database,identity.scope.userId,new Date().toISOString(),scope.communityId)},{headers});
    const asOfUtc=new Date().toISOString(),throughDate=query.get("through")??asOfUtc.slice(0,10);
    const fromDate=query.get("from")??new Date(Date.parse(`${throughDate}T00:00:00.000Z`)-29*86_400_000).toISOString().slice(0,10);
    const tab=query.get("tab")??"overview",quiet=Number(query.get("quiet")??7),calendar=query.get("calendar")??"calendar_days";
    if(!COMMUNITY_STATS_TABS.includes(tab as CommunityStatsTab)||![7,14,30].includes(quiet)||!["calendar_days","weekdays"].includes(calendar))return Response.json({error:"Invalid report filters."},{status:400,headers});
    const window:CommunityStatsWindow={fromDate,throughDate,asOfUtc,timezone:"UTC",quietDays:quiet as 7|14|30,calendar:calendar as CommunityStatsWindow["calendar"]};
    try{resolveStatsWindow(window);}catch{return Response.json({error:"Select a valid date range within the retained 90 days."},{status:400,headers});}
    const options={tab:tab as CommunityStatsTab,window,page:Number(query.get("page")??1),memberPage:Number(query.get("memberPage")??1),contentId:query.get("content")||undefined,authorId:query.get("author")||undefined,memberId:query.get("member")||undefined,segment:query.get("segment")||undefined};
    if(!Number.isSafeInteger(options.page)||options.page<1||!Number.isSafeInteger(options.page*25))return new Response(null,{status:400,headers});
    if(!Number.isSafeInteger(options.memberPage)||options.memberPage<1||!Number.isSafeInteger(options.memberPage*25))return new Response(null,{status:400,headers});
    const roleId=query.get("role")||undefined;
    if(roleId&&!/^\d{1,32}$/u.test(roleId))return new Response(null,{status:400,headers});
    const catalogSearch=query.get("search")||undefined;if(catalogSearch&&catalogSearch.length>80)return new Response(null,{status:400,headers});
    const webReports=["pages","visits","authors","publishing","timing"];
    if((catalogSearch||options.contentId||options.authorId)&&!webReports.includes(tab))return new Response(null,{status:400,headers});
    if(roleId&&(tab==="publishing"||tab==="team"))return new Response(null,{status:400,headers});
    if(options.segment&&(!["participation","members"].includes(tab)||!["both","discord_only","web_only","neither_observed","unlinked","insufficient_coverage","discord_decline","web_decline"].includes(options.segment)))return new Response(null,{status:400,headers});
    if(options.memberId&&!["members","visits"].includes(tab))return new Response(null,{status:400,headers});
    const scopedOptions={...options,roleId,catalogSearch};
    if(query.get("settings")==="1"){
      if(!scope.isOwner)return Response.json({error:"Owner access required."},{status:404,headers});
      if(!communityStatsStorageReady(database))return Response.json({error:"Stats storage unavailable."},{status:503,headers});
      const settings=database.prepare(`SELECT discord_enabled,channel_ids_json,own_content_user_ids_json,export_user_ids_json,revision FROM community_stats_settings WHERE community_id=?`).get(scope.communityId)??null;
      const channels=database.prepare(`SELECT channel_id,name,channel_type FROM community_stats_channels WHERE community_id=? AND public_readable=1 ORDER BY name`).all(scope.communityId);
      const people=database.prepare(`SELECT u.user_id AS id,u.display_name AS name FROM traderlink_community_memberships m JOIN platform_users u ON u.user_id=m.user_id AND u.status='active' WHERE m.community_id=? AND m.status='active' ORDER BY u.display_name,u.user_id`).all(scope.communityId) as {id:string;name:string}[];
      const permissions=new TraderLinkCommunityRepository(database);
      const members=people.map(person=>({...person,publisher:permissions.resolveAccess(scope.communityId,person.id).capabilities.some(capability=>["community.alerts.create","community.watchlists.publish_staff","community.coaching.offer"].includes(capability))}));
      const settingsPage=Number(query.get("settingsPage")??1);if(!Number.isSafeInteger(settingsPage)||settingsPage<1||settingsPage>Math.floor(Number.MAX_SAFE_INTEGER/25))return new Response(null,{status:400,headers});
      const cutoff=new Date(Date.parse(asOfUtc)-90*86_400_000).toISOString();
      const auditCount=database.prepare(`SELECT count(*) AS n FROM community_stats_settings_audit WHERE community_id=? AND occurred_at_utc>=?`).get(scope.communityId,cutoff) as {n:number};
      const audits=database.prepare(`SELECT a.occurred_at_utc AS "Changed UTC",coalesce(u.display_name,'Previous owner') AS Actor,json_extract(a.settings_json,'$.revision') AS Revision,CASE WHEN json_extract(a.settings_json,'$.discordEnabled') THEN 'Enabled' ELSE 'Disabled' END AS Collection,json_array_length(a.settings_json,'$.channelIds') AS Channels,json_array_length(a.settings_json,'$.ownContentUserIds') AS "Own-content grants",json_array_length(a.settings_json,'$.exportUserIds') AS "Export grants" FROM community_stats_settings_audit a LEFT JOIN platform_users u ON u.user_id=a.actor_user_id WHERE a.community_id=? AND a.occurred_at_utc>=? ORDER BY a.occurred_at_utc DESC,a.audit_id DESC LIMIT 25 OFFSET ?`).all(scope.communityId,cutoff,(settingsPage-1)*25);
      return Response.json({settings,channels,members,audits,auditCount:auditCount.n,settingsPage,runtimeEnabled:process.env.TRADERLINK_COMMUNITY_STATS_ENABLED==="1"},{headers});
    }
    const excel=query.get("format")==="xlsx";
    if(excel&&!scope.canExport)return Response.json({error:"An explicit export grant is required."},{status:403,headers});
    if(excel)database.exec("BEGIN");
    const report=readCommunityStats(database,scope,scopedOptions);
    if(excel){
      if(!report.ready)return Response.json({error:"Stats are unavailable."},{status:503,headers});
      const streamDatabase=database;
      const sheets=communityStatsWorkbookSheets(report,page=>readCommunityStats(streamDatabase,scope,{...scopedOptions,page}),timeline=>openCommunityStatsEventExport(streamDatabase,scope,scopedOptions,timeline),Object.fromEntries([["Role filter",roleId],["Page filter",options.contentId],["Author filter",options.authorId],["Member filter",options.memberId],["Participation filter",options.segment],["Page search",catalogSearch]].filter((entry):entry is [string,string]=>!!entry[1])));
      const iterator=streamStatsWorkbook(sheets);let closed=false;
      const close=()=>{if(!closed){closed=true;try{iterator.return(undefined);}finally{streamDatabase.close();}}};
      const stream=new ReadableStream<Uint8Array>({pull(controller){try{const next=iterator.next();if(next.done){close();controller.close();}else controller.enqueue(next.value);}catch(error){close();controller.error(error);}},cancel(){close();}});
      database=null;
      return new Response(stream,{headers:{...headers,"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="community-stats-${tab}-${fromDate}-${throughDate}.xlsx"`}});
    }
    if(query.get("format")!=="csv")return Response.json(report,{headers});
    if(!scope.canExport)return Response.json({error:"An explicit export grant is required."},{status:403,headers});
    const sectionTitle=query.get("section"),selectedSection=sectionTitle?report.sections.find(section=>section.title===sectionTitle):null;
    if(sectionTitle&&(!selectedSection||query.get("timeline")==="1"))return new Response(null,{status:400,headers});
    if(!sectionTitle&&(tab==="visits"||query.get("timeline")==="1")){
      const exported=openCommunityStatsEventExport(database,scope,scopedOptions,query.get("timeline")==="1"),iterator=exported.rows[Symbol.iterator](),encoder=new TextEncoder();
      const streamDatabase=database;database=null;let started=false,closed=false;
      const close=()=>{if(!closed){closed=true;iterator.return?.();streamDatabase.close();}};
      const stream=new ReadableStream<Uint8Array>({pull(controller){
        try{
          const lines:string[]=[];if(!started){lines.push("\uFEFF"+exported.columns.map(csvCell).join(","));started=true;}
          for(let count=0;count<100;count++){const next=iterator.next();if(next.done){if(lines.length)controller.enqueue(encoder.encode(lines.join("\r\n")+"\r\n"));close();controller.close();return;}lines.push(exported.columns.map(column=>csvCell(next.value[column])).join(","));}
          controller.enqueue(encoder.encode(lines.join("\r\n")+"\r\n"));
        }catch(error){close();controller.error(error);}
      },cancel(){close();}});
      return new Response(stream,{headers:{...headers,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="community-stats-${query.get("timeline")==="1"?"member-timeline":tab}-${fromDate}-${throughDate}.csv"`}});
    }
    const exportColumns=selectedSection?.columns??report.columns;
    const output=[exportColumns.map(csvCell).join(",")];
    const exportPages=selectedSection?selectedSection.totalRows===undefined?1:Math.ceil(selectedSection.totalRows/report.pageSize):tab==="timing"?1:Math.ceil(report.totalRows/report.pageSize);
    for(let page=1;page<=exportPages;page++){
      const slice=page===report.page?report:readCommunityStats(database,scope,{...scopedOptions,page});
      const exportRows=sectionTitle?slice.sections.find(section=>section.title===sectionTitle)?.rows??[]:slice.rows;
      for(const row of exportRows)output.push(exportColumns.map(column=>csvCell(row[column])).join(","));
    }
    const csvName=sectionTitle?`${tab}-${sectionTitle.toLowerCase().replace(/[^a-z0-9]+/gu,"-").replace(/^-|-$/gu,"")}`:tab;
    return new Response("\uFEFF"+output.join("\r\n"),{headers:{...headers,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="community-stats-${csvName}-${fromDate}-${throughDate}.csv"`}});
  }catch(error){return failure(error);}finally{database?.close();}
}
export async function POST(request:Request,context:Context):Promise<Response>{
  let database:ReturnType<typeof openPlatformDatabase>|null=null;
  try{
    assertStatsSameOrigin(request);
    const identity=requireTraderLinkPlatformRequestIdentity(request.headers),{communitySlug}=await context.params;
    const body=await readCommunityStatsJson(request,131_072) as Record<string,unknown>;
    if(!body||Array.isArray(body)||typeof body!=="object"||Object.keys(body).some(key=>!["discordEnabled","channelIds","ownContentUserIds","exportUserIds","retryConnection","expectedRevision"].includes(key))||typeof body.discordEnabled!=="boolean"||(body.retryConnection!==undefined&&typeof body.retryConnection!=="boolean")||(body.expectedRevision!==null&&(!Number.isSafeInteger(body.expectedRevision)||Number(body.expectedRevision)<0)))return new Response(null,{status:400,headers});
    const arrays=[body.channelIds,body.ownContentUserIds,body.exportUserIds];
    if(arrays.some(value=>!Array.isArray(value)||value.length>1000||value.some(item=>typeof item!=="string"||item.length>100)))return new Response(null,{status:400,headers});
    database=openPlatformDatabase({mode:"runtime"});const scope=await authorizeCommunityStats(database,communitySlug,identity.scope.userId,"settings");
    if(!communityStatsStorageReady(database))return new Response(null,{status:503,headers});
    const channels=[...new Set(body.channelIds as string[])].sort(),own=[...new Set(body.ownContentUserIds as string[])],exports=[...new Set(body.exportUserIds as string[])];
    if(channels.some(channel=>!/^\d{1,32}$/u.test(channel)))return new Response(null,{status:400,headers});
    // Gateway selection is intersected with freshly resolved public permissions before any collection.
    const repository=new TraderLinkCommunityRepository(database);
    for(const userId of new Set([...own,...exports])){
      const access=repository.requireCapability(scope.communityId,userId,"community.view");
      if(own.includes(userId)&&!access.capabilities.some(capability=>["community.alerts.create","community.watchlists.publish_staff","community.coaching.offer"].includes(capability)))return new Response(null,{status:400,headers});
    }
    const at=new Date().toISOString(),stats=new CommunityStatsRepository(database);
    const revision=stats.transaction(()=>{
      if(!repository.requireCapability(scope.communityId,scope.actorUserId,"community.view").isOwner)platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      const prior=database!.prepare(`SELECT revision FROM community_stats_settings WHERE community_id=?`).get(scope.communityId) as {revision:number}|undefined;
      if((prior&&body.expectedRevision!==prior.revision)||(!prior&&body.expectedRevision!==null))throw new StatsSettingsConflict();
      stats.ensureCommunity(scope.communityId,at);
      const old=database!.prepare(`SELECT discord_enabled,channel_ids_json FROM community_stats_settings WHERE community_id=?`).get(scope.communityId) as {discord_enabled:number;channel_ids_json:string};
      const reconnect=body.retryConnection===true||old.discord_enabled!==(body.discordEnabled?1:0)||old.channel_ids_json!==JSON.stringify(channels);
      if(reconnect)database!.prepare(`UPDATE community_stats_settings SET discord_configuration_version=discord_configuration_version+1 WHERE community_id=?`).run(scope.communityId);
      database!.prepare(`UPDATE community_stats_settings SET revision=revision+1,discord_enabled=?,channel_ids_json=?,own_content_user_ids_json=?,export_user_ids_json=?,updated_at_utc=? WHERE community_id=?`).run(body.discordEnabled?1:0,JSON.stringify(channels),JSON.stringify(own),JSON.stringify(exports),at,scope.communityId);
      const revision=(prior?.revision??0)+1;
      database!.prepare(`INSERT INTO community_stats_settings_audit(audit_id,community_id,actor_user_id,occurred_at_utc,settings_json) VALUES(?,?,?,?,?)`).run(randomUUID(),scope.communityId,scope.actorUserId,at,JSON.stringify({revision,discordEnabled:body.discordEnabled,channelIds:channels,ownContentUserIds:own,exportUserIds:exports,retryConnection:body.retryConnection===true}));
      return revision;
    });
    return Response.json({saved:true,revision},{headers});
  }catch(error){if(error instanceof StatsSettingsConflict)return Response.json({error:"Settings changed in another window. Reload this page before saving."},{status:409,headers});return failure(error);}finally{database?.close();}
}
