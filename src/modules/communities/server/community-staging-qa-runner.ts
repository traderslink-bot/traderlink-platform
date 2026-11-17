import "server-only";
import type Database from "better-sqlite3";
import {assertCommunityStagingQaCapability,type CommunityStagingQaCapability} from "./community-staging-qa-capability";
import {CommunityStatsCollector} from "./stats/community-stats-collector";
import {TraderLinkCommunityDiscordDeliveryService} from "./traderlink-community-discord-delivery-service";
import {sharedAlertsSourceOriginalDelivery} from "./shared-alerts-source-original-delivery";
import {sharedAlertsSourceRevisionDelivery} from "./shared-alerts-source-revision-delivery";
import {sharedAlertsSourceTrackerBinding} from "./shared-alerts-source-tracker";
import {SharedAlertsSourcePolicy} from "./shared-alerts-source-policy";
import {SharedAlertsSourcePublication} from "./shared-alerts-source-publication";
import {sharedAlertPublishingAuthorization} from "./shared-alerts-publishing-authorization";
import {SharedAlertsDelivery} from "./shared-alerts-delivery";
import {sharedAlertAwareDiscordRequest} from "./shared-alerts-rate-limits";
import {verifyCommunityRequestMember} from "./community-request-verification";
import type {SharedSourceDispatchContext} from "./shared-alerts-source-dispatch";
import {assertCanonicalUuidV4} from "../../platform/server/database/platform-migration-contract";

const running=new WeakSet<object>();
/** Explicit one-shot controller path. Never registered by app startup, cron or UI. */
export async function runFiniteCommunityStagingQa(database:Database.Database,capability:CommunityStagingQaCapability):Promise<Readonly<{pipeline:string;completed:boolean;delivered:number;failed:number;sources:readonly {source:string;status:string;reason:string|null}[]}>>{
 assertCommunityStagingQaCapability(capability,database);
 if(running.has(database))throw new Error("Community staging QA is already running.");
 running.add(database);let delivered=0,failed=0;let collector:CommunityStatsCollector|undefined;
 try{
  const run=capability.run,botToken=process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim();
  if(!botToken)throw new Error("Community staging bot is unavailable.");
  if(run.pipeline==="stats"){
   if(process.env.TRADERLINK_COMMUNITY_STATS_ENABLED!=="1")throw new Error("Community Stats collection is disabled.");
   collector=new CommunityStatsCollector(database,capability);
   const release=capability.onStop(()=>collector?.stop());
   try{
    // Protocol heartbeat, complete roster and the unmodified native collector
    // establish coverage. Waiting alone never manufactures observation.
    let nextCollector=Date.now(),historyTicks=0,collectorTicks=0;
    while(capability.remainingMs()>0&&!capability.signal.aborted){
     if(Date.now()>=nextCollector&&collectorTicks<run.bounds.collectorTicks){collector.tick();collectorTicks++;nextCollector=Date.now()+30000;}
     if(historyTicks<run.bounds.historyTicks){await collector.historyTick();historyTicks++;}
     const delay=Math.min(5000,capability.remainingMs());if(delay<=0)break;
     await new Promise<void>(resolve=>{const done=()=>{clearTimeout(timer);capability.signal.removeEventListener("abort",done);resolve();};const timer=setTimeout(done,delay);capability.signal.addEventListener("abort",done,{once:true});});
    }
    if(capability.signal.aborted&&capability.signal.reason!=="deadline")throw new Error("Community staging collection cancelled.");
   }finally{release();collector.stop();}
  }else if(run.pipeline==="common-delivery"){
   const result=await new TraderLinkCommunityDiscordDeliveryService(database,{botToken,publicOrigin:run.pins.origin,notBeforeUtc:run.cutoffUtc},capability.request).runAvailable(1);delivered=result.delivered;failed=result.failed;
  }else{
   const now=()=>new Date().toISOString(),policy=new SharedAlertsSourcePolicy(database),request=sharedAlertAwareDiscordRequest(capability.request,operation=>operation(database),now),tracker=sharedAlertsSourceTrackerBinding(run.pins.origin);
   const context:SharedSourceDispatchContext={database,policy,request,now,botToken,limit:1,notBeforeUtc:run.cutoffUtc,trackedPageUrl:(slug,alertId)=>{
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>100)throw new Error("Invalid source route.");assertCanonicalUuidV4(alertId,"alertId");const url=new URL(tracker.url(slug,alertId));if(url.origin!==run.pins.origin||url.username||url.password||url.search||url.hash||!url.pathname.startsWith(`/communities/${slug}/alerts/`))throw new Error("Invalid source route.");return url.href;
   }};
   const authorization=sharedAlertPublishingAuthorization(database,policy,(slug,userId)=>verifyCommunityRequestMember(database,{slug,userId,botToken,atUtc:now()},request),(communityId,userId,alertId)=>{try{new SharedAlertsSourcePublication(database).readForPublisher(communityId,userId,alertId,now());return true;}catch{return false;}},now);
   const originals=await sharedAlertsSourceOriginalDelivery.run(context);delivered+=originals.delivered;failed+=originals.failed;capability.assertActive();
   const revisions=await sharedAlertsSourceRevisionDelivery.run(context);delivered+=revisions.delivered;failed+=revisions.failed;capability.assertActive();
   const partners=await new SharedAlertsDelivery(database,{botToken,enabled:true,now,notBeforeUtc:run.cutoffUtc,...authorization},request).runAvailable(1);delivered+=partners.delivered;failed+=partners.failed;
  }
  const sources=database.prepare("SELECT source,status,reason FROM community_stats_source_state WHERE community_id=? ORDER BY source").all(capability.run.communityId) as {source:string;status:string;reason:string|null}[];
  capability.finish("completed");return Object.freeze({pipeline:capability.run.pipeline,completed:true,delivered,failed,sources});
 }catch(error){try{capability.finish(capability.signal.aborted?"cancelled":"failed");}catch{/* preserve original error */}throw error;}
 finally{collector?.stop();running.delete(database);}
}
