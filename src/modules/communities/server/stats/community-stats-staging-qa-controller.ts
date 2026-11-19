import "server-only";
import {createHash} from "node:crypto";
import {constants,lstatSync,openSync,fstatSync,readFileSync,closeSync,realpathSync} from "node:fs";
import {dirname,parse} from "node:path";
import type {NextRequest} from "next/server";
import {resolvePlatformPublicOrigin} from "../../../platform/server/authentication/platform-public-origin";
import {resolvePlatformBackgroundWorkerMode} from "../../../platform/server/runtime/platform-background-worker-mode";
import {openPlatformDatabase} from "../../../platform/server/database/open-platform-database";
import {COMMUNITY_STAGING_QA_DATABASE} from "../community-staging-qa-target";
import {issueCommunityStagingQaCapability,type CommunityStagingQaCapability,type CommunityStagingQaRun} from "../community-staging-qa-capability";
import {runFiniteCommunityStagingQa} from "../community-staging-qa-runner";
import {isCommunityStagingQaDiscordChannel,isCommunityStagingQaDiscordGuild} from "../community-review-discord-guild";

const DIRECTORY="/data/community-combined-review-20261117/stats-qa";
const FILES={binding:DIRECTORY+"/binding.json",run:DIRECTORY+"/run.json",principals:DIRECTORY+"/principals.json",lineage:DIRECTORY+"/lineage.json"} as const;
const sha=(value:Buffer)=>createHash("sha256").update(value).digest("hex");
const digest=(value:unknown):value is string=>typeof value==="string"&&/^[a-f0-9]{64}$/.test(value);
let busy=false;
function refused():never{throw new Error("Private Stats test unavailable.");}
function early():void{
 if(process.getuid?.()!==1001||resolvePlatformBackgroundWorkerMode(process.env)!=="disabled_isolated_staging"||process.env.TRADERLINK_PLATFORM_DB_PATH!==COMMUNITY_STAGING_QA_DATABASE||process.env.TRADERLINK_COMMUNITY_STATS_ENABLED!=="1")refused();
}
/** Server-owned constant paths only. No HTTP field supplies a filename or digest. */
function readPrivate(path:string):Buffer{
 if(realpathSync(path)!==path)refused();
 for(let parent=dirname(path);;parent=dirname(parent)){
  const stat=lstatSync(parent);
  if(!stat.isDirectory()||stat.isSymbolicLink()||realpathSync(parent)!==parent||(stat.mode&0o022)!==0||![0,1001].includes(stat.uid))refused();
  if(parent===parse(parent).root)break;
 }
 const before=lstatSync(path);
 if(!before.isFile()||before.isSymbolicLink()||before.uid!==1001||before.nlink!==1||(before.mode&0o777)!==0o600||before.size<1||before.size>65536)refused();
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const opened=fstatSync(fd);
  if(opened.dev!==before.dev||opened.ino!==before.ino||opened.mode!==before.mode||opened.uid!==before.uid||opened.nlink!==before.nlink||opened.size!==before.size)refused();
  const bytes=readFileSync(fd),after=fstatSync(fd);
  if(after.size!==opened.size||after.mtimeMs!==opened.mtimeMs||after.ctimeMs!==opened.ctimeMs||bytes.length!==opened.size)refused();
  return bytes;
 }finally{closeSync(fd);}
}
export function assertCommunityStatsQaBounds(run:CommunityStagingQaRun):void{
 if(run.pipeline!=="stats"||!isCommunityStagingQaDiscordGuild(run.guildId)||!Array.isArray(run.jobs)||run.jobs.length||run.fixtureManifestSha256!==undefined||!Array.isArray(run.channelIds)||!run.channelIds.length||run.channelIds.length>3||run.channelIds.some(channel=>!isCommunityStagingQaDiscordChannel(run.guildId,channel))||new Set(run.channelIds).size!==run.channelIds.length)refused();
 const limits={durationMs:115000,requests:32,writes:0,gatewayFrames:32,historyTicks:12,collectorTicks:4};
 for(const [key,max]of Object.entries(limits)){const value=run.bounds?.[key as keyof typeof limits];if(!Number.isSafeInteger(value)||value<0||value>max)refused();}
 if(run.bounds.durationMs<1000||run.bounds.requests<1)refused();
 const cutoff=Date.parse(run.cutoffUtc),now=Date.now();if(!Number.isFinite(cutoff)||cutoff>now||now-cutoff>300000)refused();
}
/** Staging-only finite native collector. Importing this module starts nothing. */
export async function startCommunityStatsQa(request:NextRequest,nonce:string):Promise<Response>{
 early();
 const path=`/__private/community-stats-qa/${nonce}`;
 if(busy||request.method!=="POST"||request.signal.aborted||!/^[a-f0-9]{32}$/.test(nonce)||request.nextUrl.pathname!==path||request.nextUrl.search||request.nextUrl.hash)refused();
 busy=true;
 let database:ReturnType<typeof openPlatformDatabase>|undefined,capability:CommunityStagingQaCapability|undefined,handedOff=false,closed=false;
 const close=()=>{if(closed)return;closed=true;try{capability?.finish("failed");}catch{/* The native issuer retains failure/audit semantics. */}finally{if(database?.open)database.close();busy=false;}};
 try{
  const binding=JSON.parse(readPrivate(FILES.binding).toString("utf8")) as {kind:string;runManifestSha256:string;principalManifestSha256:string;schemaLineageSha256?:string};
  if(binding.kind!=="community-stats-qa-binding-v1"||!digest(binding.runManifestSha256)||!digest(binding.principalManifestSha256)||(binding.schemaLineageSha256!==undefined&&!digest(binding.schemaLineageSha256))||Object.keys(binding).some(key=>!["kind","runManifestSha256","principalManifestSha256","schemaLineageSha256"].includes(key)))refused();
  const bytes=readPrivate(FILES.run),run=JSON.parse(bytes.toString("utf8")) as CommunityStagingQaRun;
  if(sha(bytes)!==binding.runManifestSha256||run.nonce!==nonce||run.principalManifestSha256!==binding.principalManifestSha256)refused();
  assertCommunityStatsQaBounds(run);
  const origin=resolvePlatformPublicOrigin(request);
  if(origin!==run.pins?.origin||request.headers.get("origin")!==origin||request.headers.get("sec-fetch-site")==="cross-site")refused();
  // Railway's bound host is normalized; the actual path, headers and abort signal are retained.
  const actual=new Request(origin+path,{method:"POST",headers:new Headers(request.headers),signal:request.signal});
  database=openPlatformDatabase({mode:"runtime"});
  const settings=database.prepare("SELECT discord_enabled,channel_ids_json,discord_configuration_version FROM community_stats_settings WHERE community_id=?").get(run.communityId) as {discord_enabled:number;channel_ids_json:string;discord_configuration_version:number}|undefined;
  if(!settings||settings.discord_enabled!==1||settings.discord_configuration_version!==run.settingsVersion||JSON.stringify(JSON.parse(settings.channel_ids_json))!==JSON.stringify(run.channelIds))refused();
  capability=issueCommunityStagingQaCapability({database,request:actual,runManifestPath:FILES.run,runManifestSha256:binding.runManifestSha256,principalManifestPath:FILES.principals,principalManifestSha256:binding.principalManifestSha256,sourceArchiveSha256:run.pins.sourceArchiveSha256,...(binding.schemaLineageSha256?{schemaLineagePath:FILES.lineage,schemaLineageSha256:binding.schemaLineageSha256}:{})});
  const ownedDatabase=database,ownedCapability=capability;
  let heartbeat:ReturnType<typeof setInterval>|undefined,cancelled=false;
  const body=new ReadableStream<Uint8Array>({
   start(controller){
    const encoder=new TextEncoder(),send=(value:unknown)=>controller.enqueue(encoder.encode(JSON.stringify(value)+"\n"));
    send({event:"admitted",pipeline:"stats",runId:run.runId,sourceCommit:run.pins.sourceCommit,buildId:run.pins.buildId});
    // Transport keepalive only: never claims roster readiness or reissues owner authority.
    heartbeat=setInterval(()=>{if(!cancelled&&!ownedCapability.signal.aborted)try{send({event:"keepalive"});}catch{cancelled=true;try{ownedCapability.finish("cancelled");}catch{/* runner closes below */}}},5000);heartbeat.unref?.();
    const finish=(result?:Awaited<ReturnType<typeof runFiniteCommunityStagingQa>>)=>{
     try{if(!cancelled){const sources=result?.sources.map(({source,status})=>({source,status}));send(result?{event:"completed",pipeline:"stats",completed:result.completed,sourceCount:sources?.length,sources}:{event:"failed",pipeline:"stats"});controller.close();}}
     finally{if(heartbeat)clearInterval(heartbeat);close();}
    };
    void runFiniteCommunityStagingQa(ownedDatabase,ownedCapability).then(result=>finish(result),()=>finish()).catch(()=>{if(heartbeat)clearInterval(heartbeat);close();});
   },
   cancel(){cancelled=true;if(heartbeat)clearInterval(heartbeat);try{ownedCapability.finish("cancelled");}catch{/* runner settles and closes the database */}},
  });
  const response=new Response(body,{headers:{"Content-Type":"application/x-ndjson","Cache-Control":"private, no-store, max-age=0","X-Accel-Buffering":"no"}});
  handedOff=true;return response;
 }finally{if(!handedOff)close();}
}
