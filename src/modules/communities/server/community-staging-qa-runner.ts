import "server-only";
import type Database from "better-sqlite3";
import {assertCommunityStagingQaCapability,type CommunityStagingQaCapability} from "./community-staging-qa-capability";
import {CommunityStatsCollector} from "./stats/community-stats-collector";
import {runCommunityDiscordDeliveryPass} from "./community-discord-delivery-pass";

const running=new WeakSet<object>();
/** Explicit one-shot controller path. Never registered by app startup, cron or UI. */
export async function runFiniteCommunityStagingQa(database:Database.Database,capability:CommunityStagingQaCapability):Promise<Readonly<{pipeline:string;completed:boolean;delivered:number;failed:number;sources:readonly {source:string;status:string;reason:string|null}[]}>>{
 assertCommunityStagingQaCapability(capability,database);
 if(capability.run.pipeline==="shared-fixture")throw new Error("Synthetic fixture scope cannot run native delivery or Stats.");
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
  }else{
   const result=await runCommunityDiscordDeliveryPass(database,{botToken,publicOrigin:run.pins.origin,notBeforeUtc:run.cutoffUtc,limit:Math.max(1,run.jobs.length),sharedEnabled:run.pipeline==="shared-delivery",exactSelection:{capability,guildId:run.guildId,channelIds:run.channelIds,deliveryIds:run.jobs.filter(job=>job.table==="traderlink_community_content_deliveries").map(job=>job.id),actionIds:run.jobs.filter(job=>job.table==="traderlink_community_publication_actions").map(job=>job.id),sharedDeliveryIds:run.jobs.filter(job=>job.table==="community_shared_alert_deliveries").map(job=>job.id)}},capability.request);
   delivered=result.delivered;failed=result.failed;
  }
  const sources=database.prepare("SELECT source,status,reason FROM community_stats_source_state WHERE community_id=? ORDER BY source").all(capability.run.communityId) as {source:string;status:string;reason:string|null}[];
  capability.finish("completed");return Object.freeze({pipeline:capability.run.pipeline,completed:true,delivered,failed,sources});
 }catch(error){try{capability.finish(capability.signal.aborted?"cancelled":"failed");}catch{/* preserve original error */}throw error;}
 finally{collector?.stop();running.delete(database);}
}
