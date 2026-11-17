import "server-only";
import {resolvePlatformBackgroundWorkerMode} from "../../../platform/server/runtime/platform-background-worker-mode";
import {openPlatformDatabase} from "../../../platform/server/database/open-platform-database";
import {communityStatsStorageReady} from "./community-stats-repository";
import {CommunityStatsCollector} from "./community-stats-collector";
const key="__traderlinkCommunityStatsRuntime";
type State={collector:CommunityStatsCollector;timer:ReturnType<typeof setInterval>;historyTimer:ReturnType<typeof setInterval>};
type Global=typeof globalThis&{[key]?:State};
/** Production timer registration retains its normal worker/feature gates. */
export function startHostedCommunityStats():void{
 if(resolvePlatformBackgroundWorkerMode()!=="enabled"||process.env.TRADERLINK_COMMUNITY_STATS_ENABLED!=="1"||(globalThis as Global)[key])return;
 const database=openPlatformDatabase({mode:"runtime"});
 if(!communityStatsStorageReady(database)){database.close();return;}
 const collector=new CommunityStatsCollector(database);
 const historyTimer=setInterval(()=>void collector.historyTick().catch(error=>console.error("Stats history persistence deferred.",{errorName:error instanceof Error?error.name:"UnknownError"})),5000);historyTimer.unref();
 const timer=setInterval(()=>collector.tick(),30000);timer.unref();
 (globalThis as Global)[key]={collector,timer,historyTimer};collector.tick();
}
