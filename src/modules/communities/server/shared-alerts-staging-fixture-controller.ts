import "server-only";
import {createHash} from "node:crypto";
import {constants,lstatSync,openSync,fstatSync,readFileSync,closeSync,realpathSync} from "node:fs";
import {dirname,parse} from "node:path";
import {NextRequest} from "next/server";
import {resolvePlatformPublicOrigin} from "../../platform/server/authentication/platform-public-origin";
import {resolvePlatformBackgroundWorkerMode} from "../../platform/server/runtime/platform-background-worker-mode";
import {openPlatformDatabase} from "../../platform/server/database/open-platform-database";
import {issueCommunityStagingQaCapability,type CommunityStagingQaCapability,type CommunityStagingQaRun} from "./community-staging-qa-capability";
import {COMMUNITY_STAGING_QA_DATABASE} from "./community-staging-qa-target";
import {issueSharedFixtureContext,assertSharedFixtureContext,requireSharedFixtureActor,type SharedFixtureContext,type FixtureKey} from "./shared-alerts-staging-fixture-authority";
import {SharedAlertsDiscord} from "./shared-alerts-discord";
import {readFixtureState} from "./shared-alerts-staging-fixture-model";
import {deliverSharedFixtureAlert} from "./shared-alerts-staging-fixture-transport";
import {COMMUNITY_REVIEW_DISCORD_GUILD_ID} from "./community-review-discord-guild";
const DIRECTORY="/data/community-combined-review-20261117/shared-fixture-qa";
const FILES={binding:DIRECTORY+"/binding.json",run:DIRECTORY+"/run.json",fixture:DIRECTORY+"/fixture.json",principals:DIRECTORY+"/principals.json",lineage:DIRECTORY+"/lineage.json"} as const;
type Entry={publications:Map<string,{key:FixtureKey;request:Request}>;context:SharedFixtureContext;parent:CommunityStagingQaCapability;channels:readonly {channelId:string;name:string}[];stop:()=>void;closed:boolean};
// Deliberate finite QA authority registry. Never globalThis, shared across instances, or persisted.
let current:Entry|undefined,starting=false;
const sha=(b:Buffer)=>createHash("sha256").update(b).digest("hex");
function refused():never{throw new Error("Private Shared Alerts test unavailable.");}
function early(){if(process.getuid?.()!==1001||resolvePlatformBackgroundWorkerMode(process.env)!=="disabled_isolated_staging"||process.env.TRADERLINK_PLATFORM_DB_PATH!==COMMUNITY_STAGING_QA_DATABASE)refused();}
function readPrivate(path:string){
 early();if(realpathSync(path)!==path)refused();
 for(let parent=dirname(path);;parent=dirname(parent)){const s=lstatSync(parent);if(!s.isDirectory()||s.isSymbolicLink()||s.mode&0o022)refused();if(parent===parse(parent).root)break;}
 const before=lstatSync(path);if(!before.isFile()||before.isSymbolicLink()||before.uid!==1001||before.nlink!==1||(before.mode&0o777)!==0o600||before.size<1||before.size>131072)refused();
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const s=fstatSync(fd);if(s.dev!==before.dev||s.ino!==before.ino||s.mode!==before.mode||s.size!==before.size||s.uid!==before.uid||s.nlink!==1)refused();const b=readFileSync(fd),after=fstatSync(fd);if(after.size!==s.size||after.mtimeMs!==s.mtimeMs||after.ctimeMs!==s.ctimeMs||b.length!==s.size)refused();return b;}finally{closeSync(fd);}
}
function canonical(request:NextRequest,path:string,method=request.method){const origin=resolvePlatformPublicOrigin(request);return new Request(origin+path,{method,headers:new Headers(request.headers),signal:request.signal});}
/** The ONLY issuer entry. Root controls fixed private files; no client scope/path/pin arguments. */
export async function startSharedFixture(request:NextRequest,nonce:string):Promise<Response>{
 early();if(starting||current||request.method!=="POST"||!/^[a-f0-9]{32}$/.test(nonce)||request.nextUrl.pathname!==`/__private/community-staging-qa/${nonce}`)refused();starting=true;
 let database:ReturnType<typeof openPlatformDatabase>|undefined,parent:CommunityStagingQaCapability|undefined;
 try{
  const binding=JSON.parse(readPrivate(FILES.binding).toString("utf8")) as {runManifestSha256:string;fixtureManifestSha256:string;principalManifestSha256:string;schemaLineageSha256?:string};
  const bytes=readPrivate(FILES.run),run=JSON.parse(bytes.toString("utf8")) as CommunityStagingQaRun;
  if(sha(bytes)!==binding.runManifestSha256||run.pipeline!=="shared-fixture"||run.nonce!==nonce||run.fixtureManifestSha256!==binding.fixtureManifestSha256||run.principalManifestSha256!==binding.principalManifestSha256)refused();
  const actual=canonical(request,`/__private/community-staging-qa/${nonce}`);
  if(new URL(actual.url).origin!==run.pins.origin||actual.headers.get("origin")!==run.pins.origin)refused();
  database=openPlatformDatabase({mode:"runtime"});
  parent=issueCommunityStagingQaCapability({database,request:actual,runManifestPath:FILES.run,runManifestSha256:binding.runManifestSha256,principalManifestPath:FILES.principals,principalManifestSha256:binding.principalManifestSha256,sourceArchiveSha256:run.pins.sourceArchiveSha256,...(binding.schemaLineageSha256?{schemaLineagePath:FILES.lineage,schemaLineageSha256:binding.schemaLineageSha256}:{})});
  const context=issueSharedFixtureContext({database,parent,manifestBytes:readPrivate(FILES.fixture),manifestSha256:binding.fixtureManifestSha256});
  const a=assertSharedFixtureContext(context),token=process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim();if(!token)refused();
  const observed=await new SharedAlertsDiscord(token,parent.request).channels(COMMUNITY_REVIEW_DISCORD_GUILD_ID);
  assertSharedFixtureContext(context);
  const allowed=new Set(a.manifest.principals.flatMap(p=>p.channelIds));
  const channels=Object.freeze(observed.filter(c=>allowed.has(c.channelId)).map(c=>Object.freeze({...c})));
  if([...allowed].some(id=>!channels.some(c=>c.channelId===id)))refused();
  const ownedDatabase=database,ownedParent=parent;
  const resources:{timer?:ReturnType<typeof setTimeout>;heartbeat?:ReturnType<typeof setInterval>;release?:()=>void;stream?:ReadableStreamDefaultController<Uint8Array>}={};
  const entry:Entry={publications:new Map(),context,parent,channels,closed:false,stop:()=>{if(entry.closed)return;entry.closed=true;if(resources.timer)clearTimeout(resources.timer);if(resources.heartbeat)clearInterval(resources.heartbeat);resources.release?.();if(current===entry)current=undefined;entry.publications.clear();try{ownedParent.finish("cancelled");}catch{/* Target invalidation still closes all resources. */}finally{if(ownedDatabase.open)ownedDatabase.close();try{resources.stream?.close();}catch{/* disconnected stream */}}}};
  current=entry;resources.release=parent.onStop(entry.stop);
  resources.timer=setTimeout(entry.stop,Math.max(1,Date.parse(a.manifest.expiresAtUtc)-Date.now()));resources.timer.unref?.();
  const body=new ReadableStream<Uint8Array>({start(controller){resources.stream=controller;const encoder=new TextEncoder();controller.enqueue(encoder.encode(JSON.stringify({label:"SyntheticAgreement",actualDiscordGuildId:COMMUNITY_REVIEW_DISCORD_GUILD_ID,runId:context.runId,pins:{sourceCommit:a.manifest.pins.sourceCommit,buildId:a.manifest.pins.buildId,artifactSha256:a.manifest.pins.artifactSha256,schemaSha256:a.manifest.pins.schemaSha256},links:a.manifest.principals.map(p=>({key:p.key,href:`/__private/shared-alerts-fixture/${context.runId}/${p.key}`}))})+"\n"));resources.heartbeat=setInterval(()=>{try{assertSharedFixtureContext(context);controller.enqueue(encoder.encode('{"alive":true}\n'));}catch{entry.stop();}},5000);resources.heartbeat.unref?.();},cancel(){entry.stop();}});
  return new Response(body,{headers:{"Content-Type":"application/x-ndjson","Cache-Control":"no-store","X-Accel-Buffering":"no"}});
 }catch(error){try{parent?.finish("failed");}finally{if(database?.open)database.close();}throw error;}finally{starting=false;}
}
export function fixtureRequest(runId:string,key:FixtureKey,headers:Headers,method:"GET"|"POST"){
 early();const entry=current;if(!entry||entry.closed||entry.context.runId!==runId||!["harbor","northstar"].includes(key))refused();
 const origin=resolvePlatformPublicOrigin(new NextRequest(process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN??"https://invalid.example",{headers}));
 const request=new Request(`${origin}/__private/shared-alerts-fixture/${runId}/${key}`,{method,headers:new Headers(headers)});
 requireSharedFixtureActor(entry.context,request,key);
 return {context:entry.context,request,channels:entry.channels};
}

export function rememberFixturePublication(context:SharedFixtureContext,request:Request,key:FixtureKey,deliveryId:string){
 const entry=current;if(!entry||entry.context!==context||entry.closed||entry.publications.size>=6)refused();
 requireSharedFixtureActor(context,request,key);const s=readFixtureState(context,request,key),d=s.deliveries.find(d=>d.id===deliveryId);if(!d||s.agreements.find(r=>r.id===d.agreementId)?.source!==key)refused();entry.publications.set(deliveryId,{key,request});
}
export async function deliverFixtureQueued(runId:string,key:FixtureKey,headers:Headers,deliveryId:string){
 const {context,request}=fixtureRequest(runId,key,headers,"POST"),entry=current;if(!entry||entry.context!==context)refused();
 const s=readFixtureState(context,request,key),d=s.deliveries.find(d=>d.id===deliveryId),source=entry.publications.get(deliveryId);
 if(!d||!source)refused();if(d.status!=="pending")return null;
 // The source's genuine initiating session is revalidated, never impersonated by the receiver.
 return deliverSharedFixtureAlert(context,source.request,source.key,deliveryId);
}
