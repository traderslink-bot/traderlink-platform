import "server-only";
import {createHash,timingSafeEqual} from "node:crypto";
import {constants,openSync,closeSync,lstatSync,fstatSync,readFileSync,realpathSync} from "node:fs";
import {dirname,parse} from "node:path";
import type Database from "better-sqlite3";
import {withJournalAdminDatabase,PlatformAdminAuthorization} from "../../platform/server/administration/platform-admin-authorization";
import {PlatformAdminAuditRepository} from "../../platform/server/administration/platform-admin-audit-repository";
import {requireTraderLinkPlatformAuthenticatedRequestIdentity} from "../../platform/server/authentication/require-platform-request-scope";
import {PlatformSessionService} from "../../platform/server/authentication/platform-session-service";
import {PlatformSessionRepository} from "../../platform/server/authentication/platform-session-repository";
import {platformMigrationManifest} from "../../platform/server/database/platform-migration-manifest";
import {calculatePlatformMigrationChecksum} from "../../platform/server/database/platform-migration-contract";
import {COMMUNITY_REVIEW_DISCORD_GUILD_ID} from "./community-review-discord-guild";

import {assertCommunityStagingQaTarget,COMMUNITY_STAGING_QA_DATABASE as DATABASE} from "./community-staging-qa-target";
export {assertCommunityStagingQaTarget,type CommunityStagingQaTargetPins} from "./community-staging-qa-target";
const hash=(value:string|Buffer)=>createHash("sha256").update(value).digest("hex");
const equal=(a:string,b:string)=>a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
function refused():never{throw new Error("Community staging QA capability refused.");}
const digest=(v:unknown):v is string=>typeof v==="string"&&/^[0-9a-f]{64}$/.test(v);
const id=(v:unknown):boolean=>typeof v==="string"&&/^\d{1,32}$/.test(v);
const uuid=(v:unknown):v is string=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
const fresh=(v:string,now:number)=>Number.isFinite(Date.parse(v))&&Date.parse(v)<=now&&now-Date.parse(v)<=300_000;
export type CommunityStagingQaRun=Readonly<{
 kind:"community-staging-qa-run-v1";runId:string;nonce:string;principalManifestSha256:string;principalSchemaLineageSha256?:string;
 pins:Readonly<{origin:string;sourceCommit:string;sourceVectorSha256:string;sourceArchiveSha256:string;schemaSha256:string;buildId:string;artifactSha256:string}>;
 communityId:string;guildId:string;channelIds:readonly string[];settingsVersion:number;
 pipeline:"stats"|"common-delivery"|"shared-delivery"|"shared-fixture";fixtureManifestSha256?:string;cutoffUtc:string;
 jobs:readonly Readonly<{table:"traderlink_community_content_deliveries"|"traderlink_community_publication_actions"|"community_shared_alert_deliveries";id:string;createdAtUtc:string}>[];
 bounds:Readonly<{durationMs:number;requests:number;writes:number;gatewayFrames:number;historyTicks:number;collectorTicks:number}>;
}>;
type Principal={userId:string;workspaceId:string;subject:string;session:{token:string;session:{sessionId:string;authProvider:string}}};
type Principals={kind:string;nonce:string;pins:{origin:string;sourceCommit:string;sourceVectorSha256:string;schemaSha256:string};coach:Principal;student:Principal};
export type CommunityStagingQaCapability=Readonly<{
 run:CommunityStagingQaRun;signal:AbortSignal;request:typeof fetch;
 assertActive:()=>void;gatewayFrame:(database:Database.Database)=>void;historyTick:()=>void;collectorTick:()=>void;
 remainingMs:()=>number;onStop:(callback:()=>void)=>()=>void;finish:(outcome:"completed"|"cancelled"|"failed")=>void;
}>;
const admitted=new WeakMap<object,Database.Database>();
export function assertCommunityStagingQaCapability(value:CommunityStagingQaCapability|undefined,database?:Database.Database,purpose?:"shared-fixture"):asserts value is CommunityStagingQaCapability{
 if(!value||!admitted.has(value)||(database&&admitted.get(value)!==database)||(purpose==="shared-fixture"?value.run.pipeline!=="shared-fixture":value.run.pipeline==="shared-fixture"))refused();value.assertActive();
}

type SchemaLineagePin=Readonly<{migrationId:string;moduleNamespace:string;executionOrder:number;checksumSha256:string;postSchemaSha256:string}>;
type SchemaLineage=Readonly<{kind:"community-staging-qa-schema-lineage-v1";principalManifestSha256:string;fromSchemaSha256:string;toSchemaSha256:string;fromMigrationCount:203;toMigrationCount:204;prefix:readonly SchemaLineagePin[];append:SchemaLineagePin}>;
function assertPrincipalSchemaLineage(database:Database.Database,run:CommunityStagingQaRun,principals:Principals,lineage:SchemaLineage|undefined):void{
 if(principals.pins.schemaSha256===run.pins.schemaSha256){if(lineage||run.principalSchemaLineageSha256)refused();return;}
 if(!lineage||lineage.kind!=="community-staging-qa-schema-lineage-v1"||lineage.principalManifestSha256!==run.principalManifestSha256||lineage.fromSchemaSha256!==principals.pins.schemaSha256||lineage.toSchemaSha256!==run.pins.schemaSha256||lineage.fromMigrationCount!==203||lineage.toMigrationCount!==204||!Array.isArray(lineage.prefix)||lineage.prefix.length!==203||platformMigrationManifest.length!==204||!lineage.append||!/^0216_[a-z0-9_]+$/.test(lineage.append.migrationId)||lineage.append.executionOrder!==291)refused();
 const rows=database.prepare("SELECT migration_id,module_namespace,execution_order,checksum_sha256,post_schema_sha256 FROM platform_schema_migrations ORDER BY execution_order").all() as {migration_id:string;module_namespace:string;execution_order:number;checksum_sha256:string;post_schema_sha256:string}[];
 if(rows.length!==204)refused();
 const pins=[...lineage.prefix,lineage.append];
 for(let index=0;index<204;index++){
  const pin=pins[index],native=rows[index],canonical=platformMigrationManifest[index];
  if(!pin||!digest(pin.checksumSha256)||!digest(pin.postSchemaSha256)||pin.migrationId!==canonical.migrationId||pin.moduleNamespace!==canonical.moduleNamespace||pin.executionOrder!==canonical.executionOrder||pin.checksumSha256!==calculatePlatformMigrationChecksum(canonical)||native.migration_id!==pin.migrationId||native.module_namespace!==pin.moduleNamespace||native.execution_order!==pin.executionOrder||native.checksum_sha256!==pin.checksumSha256||native.post_schema_sha256!==pin.postSchemaSha256)refused();
 }
 if(lineage.prefix[202].postSchemaSha256!==principals.pins.schemaSha256||lineage.append.postSchemaSha256!==run.pins.schemaSha256)refused();
}

/** Private controller inputs, never HTTP fields. The issuer opens no worker and performs no provider request. */
function readPrivate(path:string,expectedHash:string):string{
 if(!digest(expectedHash)||!path.startsWith("/data/")||process.getuid?.()!==1001)refused();
 let directory=dirname(path);
 for(;;){const stat=lstatSync(directory);if(!stat.isDirectory()||stat.isSymbolicLink()||realpathSync(directory)!==directory||(stat.mode&0o022)!==0||![0,1001].includes(stat.uid))refused();if(directory===parse(directory).root)break;directory=dirname(directory);}
 const before=lstatSync(path);if(!before.isFile()||before.isSymbolicLink()||before.nlink!==1||before.size<1||before.size>65536||(before.mode&0o777)!==0o600||![0,1001].includes(before.uid)||realpathSync(path)!==path)refused();
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const opened=fstatSync(fd);if(opened.dev!==before.dev||opened.ino!==before.ino||opened.size!==before.size||opened.mode!==before.mode||opened.uid!==before.uid||opened.nlink!==1)refused();const bytes=readFileSync(fd);const after=fstatSync(fd);if(after.size!==opened.size||after.mtimeMs!==opened.mtimeMs||after.ctimeMs!==opened.ctimeMs||bytes.length!==opened.size||!equal(hash(bytes),expectedHash))refused();return bytes.toString("utf8");}finally{closeSync(fd);}
}
function validateRun(run:CommunityStagingQaRun):void{
 if(run.kind!=="community-staging-qa-run-v1"||!uuid(run.runId)||!/^[0-9a-f]{32}$/.test(run.nonce)||!digest(run.principalManifestSha256)||run.guildId!==COMMUNITY_REVIEW_DISCORD_GUILD_ID||!uuid(run.communityId)||!Array.isArray(run.channelIds)||!run.channelIds.length||run.channelIds.length>50||run.channelIds.some(x=>!id(x))||new Set(run.channelIds).size!==run.channelIds.length||!Number.isSafeInteger(run.settingsVersion)||run.settingsVersion<0||!["stats","common-delivery","shared-delivery","shared-fixture"].includes(run.pipeline))refused();
 if(!run.pins||new URL(run.pins.origin).origin!==run.pins.origin||!run.pins.origin.startsWith("https://")||!/^[0-9a-f]{40}$/.test(run.pins.sourceCommit)||![run.pins.sourceVectorSha256,run.pins.sourceArchiveSha256,run.pins.schemaSha256,run.pins.artifactSha256].every(digest)||!/^[A-Za-z0-9_-]{1,128}$/.test(run.pins.buildId))refused();
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(run.cutoffUtc)||!Number.isFinite(Date.parse(run.cutoffUtc))||!Array.isArray(run.jobs)||run.jobs.length>3||new Set(run.jobs.map(x=>x.id)).size!==run.jobs.length)refused();
 for(const job of run.jobs)if(!["traderlink_community_content_deliveries","traderlink_community_publication_actions","community_shared_alert_deliveries"].includes(job.table)||!uuid(job.id)||!Number.isFinite(Date.parse(job.createdAtUtc))||job.createdAtUtc<run.cutoffUtc)refused();
 if((run.pipeline==="stats"||run.pipeline==="shared-fixture")?run.jobs.length:!run.jobs.length)refused();
 if(run.pipeline==="shared-fixture"?!digest(run.fixtureManifestSha256):run.fixtureManifestSha256!==undefined)refused();
 if(run.pipeline==="shared-fixture"&&(run.bounds?.gatewayFrames!==0||run.bounds?.historyTicks!==0||run.bounds?.collectorTicks!==0))refused();
 for(const [key,max]of Object.entries({durationMs:120000,requests:32,writes:6,gatewayFrames:32,historyTicks:12,collectorTicks:4}))if(!Number.isSafeInteger(run.bounds?.[key as keyof typeof run.bounds])||run.bounds[key as keyof typeof run.bounds]<0||run.bounds[key as keyof typeof run.bounds]>max)refused();
 if(run.bounds.durationMs<1000||run.bounds.requests<1)refused();
}

export function issueCommunityStagingQaCapability(input:Readonly<{
 database:Database.Database;request:Request;runManifestPath:string;runManifestSha256:string;principalManifestPath:string;principalManifestSha256:string;sourceArchiveSha256:string;schemaLineagePath?:string;schemaLineageSha256?:string;
}>):CommunityStagingQaCapability{
 const environment=process.env,db=input.database;
 const bytes=readPrivate(input.runManifestPath,input.runManifestSha256),run=JSON.parse(bytes) as CommunityStagingQaRun;validateRun(run);
 if(run.principalManifestSha256!==input.principalManifestSha256||run.pins.sourceArchiveSha256!==input.sourceArchiveSha256)refused();
 const principals=JSON.parse(readPrivate(input.principalManifestPath,input.principalManifestSha256)) as Principals;
 if(principals.kind!=="coaching-staging-principals-v1"||!principals.coach||!principals.student||principals.pins.origin!==run.pins.origin||!/^[0-9a-f]{40}$/.test(principals.pins.sourceCommit)||!digest(principals.pins.sourceVectorSha256)||!digest(principals.pins.schemaSha256))refused();
 let lineage:SchemaLineage|undefined;
 if(principals.pins.schemaSha256!==run.pins.schemaSha256){
  if(!input.schemaLineagePath||!input.schemaLineageSha256||!digest(input.schemaLineageSha256)||run.principalSchemaLineageSha256!==input.schemaLineageSha256)refused();
  lineage=JSON.parse(readPrivate(input.schemaLineagePath,input.schemaLineageSha256)) as SchemaLineage;
 }else if(input.schemaLineagePath||input.schemaLineageSha256||run.principalSchemaLineageSha256)refused();
 const selectors=environment.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT?.split(",").map(x=>x.trim());
 if(!selectors||selectors.length!==2||selectors[0]===selectors[1]||principals.coach.subject!==selectors[1]||principals.student.subject!==selectors[0])refused();
 const request=input.request,requestBinding=JSON.stringify([...request.headers]);
 if(request.method!=="POST"||request.signal.aborted||new URL(request.url).href!==`${run.pins.origin}/__private/community-staging-qa/${run.nonce}`||request.headers.get("origin")!==run.pins.origin||request.headers.get("sec-fetch-site")==="cross-site")refused();
 const auditTarget=hash(`${run.runId}:${run.communityId}`),nonceRef=hash(run.nonce),start=Date.now(),abort=new AbortController(),stops=new Set<()=>void>();
 let finished=false,requests=0,writes=0,frames=0,histories=0,ticks=0,started=false,authorizing=false;
 const structural=()=>{
  assertCommunityStagingQaTarget(db,run.pins);
  assertPrincipalSchemaLineage(db,run,principals,lineage);
  if(db.readonly||JSON.stringify([...request.headers])!==requestBinding||environment.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT?.split(",").map(x=>x.trim()).join(",")!==selectors.join(","))refused();
 };
 const checkNative=()=>{
  const session=new PlatformSessionService(new PlatformSessionRepository(db)).resolve(principals.coach.session.token);
  if(!session||session.sessionId!==principals.coach.session.session.sessionId||session.userId!==principals.coach.userId||session.authProvider!=="discord")refused();
  if(!db.prepare("SELECT 1 FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND auth_subject=? AND status='active'").get(principals.coach.userId,principals.coach.subject)||!db.prepare("SELECT 1 FROM platform_workspace_memberships WHERE user_id=? AND workspace_id=? AND role='owner' AND status='active'").get(principals.coach.userId,principals.coach.workspaceId))refused();
  const community=db.prepare("SELECT c.discord_guild_id,c.owner_user_id,s.discord_configuration_version,s.channel_ids_json FROM traderlink_communities c JOIN community_stats_settings s ON s.community_id=c.community_id WHERE c.community_id=? AND c.status='active'").get(run.communityId) as {discord_guild_id:string;owner_user_id:string;discord_configuration_version:number;channel_ids_json:string}|undefined;
  if(!community||community.discord_guild_id!==run.guildId||community.owner_user_id!==principals.coach.userId||community.discord_configuration_version!==run.settingsVersion)refused();
  const selected=JSON.parse(community.channel_ids_json) as unknown;if(!Array.isArray(selected)||selected.some(x=>typeof x!=="string"||!run.channelIds.includes(x)))refused();
  if(run.pipeline!=="stats"){
   const pending=[
    ...db.prepare("SELECT d.delivery_id id,d.requested_at_utc createdAtUtc,d.community_id communityId,c.discord_guild_id guildId,x.discord_channel_id channelId,'traderlink_community_content_deliveries' kind FROM traderlink_community_content_deliveries d LEFT JOIN traderlink_communities c ON c.community_id=d.community_id LEFT JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id WHERE d.status IN('pending','failed','sending') AND d.delivery_outcome IN('pending','uncertain')").all(),
    ...db.prepare("SELECT a.action_id id,a.requested_at_utc createdAtUtc,a.community_id communityId,c.discord_guild_id guildId,x.discord_channel_id channelId,'traderlink_community_publication_actions' kind FROM traderlink_community_publication_actions a LEFT JOIN traderlink_communities c ON c.community_id=a.community_id LEFT JOIN traderlink_community_discord_destinations x ON x.destination_id=a.destination_id AND x.community_id=a.community_id WHERE a.status IN('pending','sending')").all(),
    ...db.prepare("SELECT d.delivery_id id,d.created_at_utc createdAtUtc,r.source_community_id communityId,c.discord_guild_id guildId,d.channel_id channelId,'community_shared_alert_deliveries' kind FROM community_shared_alert_deliveries d LEFT JOIN community_shared_alert_requests r ON r.request_id=d.request_id LEFT JOIN traderlink_communities c ON c.community_id=r.receiver_community_id WHERE d.status IN('awaiting_approval','pending','failed','sending')").all(),
   ] as {id:string;createdAtUtc:string;communityId:string;guildId:string;channelId:string;kind:string}[];
   for(const row of pending)if(row.communityId!==run.communityId||row.guildId!==run.guildId||!run.channelIds.includes(row.channelId)||!run.jobs.some(job=>job.table===row.kind&&job.id===row.id&&job.createdAtUtc===row.createdAtUtc)||row.createdAtUtc<run.cutoffUtc)refused();
   for(const job of run.jobs){const row=pending.find(row=>row.kind===job.table&&row.id===job.id);if(!row){
    const table=job.table,key=table==="traderlink_community_publication_actions"?"action_id":"delivery_id";
    const exists=db.prepare(`SELECT 1 FROM ${table} WHERE ${key}=?`).get(job.id);if(!exists)refused();
   }}
   const unsafe=db.prepare("SELECT delivery_id FROM community_shared_alert_delivery_parts WHERE status IN('pending','sending','uncertain')").all() as {delivery_id:string}[];
   if(unsafe.some(row=>!run.jobs.some(job=>job.table==="community_shared_alert_deliveries"&&job.id===row.delivery_id)))refused();
  }
  const member=db.prepare("SELECT guild_owner,last_verified_at_utc FROM platform_discord_memberships WHERE user_id=? AND guild_id=?").get(principals.coach.userId,run.guildId) as {guild_owner:number;last_verified_at_utc:string}|undefined;
  if(!member||member.guild_owner!==1||!fresh(member.last_verified_at_utc,Date.now()))refused();
 };
 const authorize=(operation?:()=>void)=>{
  if(authorizing||db.inTransaction)refused();authorizing=true;
  try{structural();const identity=requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers,{environment,databasePath:DATABASE});
   new PlatformAdminAuthorization(db,environment).withRequestAuditFrame(request,frame=>{
    const scope=frame.authorize(identity,request.headers);if(scope.userId!==principals.coach.userId||scope.role!=="journal_owner_admin"||scope.mode!=="production_discord_owner"||!scope.permissions.includes("manage_users")||identity.sessionId!==principals.coach.session.session.sessionId||!scope.discordOwnerVerifiedAtUtc||!fresh(scope.discordOwnerVerifiedAtUtc,Date.now()))refused();
    checkNative();operation?.();frame.revalidate(scope,identity,request.headers);
   });
  }finally{authorizing=false;}
 };
 const audit=(reason:string,outcome:"success"|"failed")=>new PlatformAdminAuditRepository(db).append({actorKind:"platform_user",actorUserId:principals.coach.userId,actorRole:"journal_owner_admin",action:"operational_receipt_recorded",targetKind:"authority",targetRefSha256:auditTarget,outcome,reasonCode:reason,correlationRefSha256:nonceRef,previewReceiptSha256:input.runManifestSha256,details:{purpose:"isolated_staging_review",pipeline:run.pipeline,requests,writes,frames},createdAtUtc:new Date().toISOString()});
 const stop=(reason="denied")=>{if(!abort.signal.aborted)abort.abort(reason);for(const callback of stops){try{callback();}catch{/* terminal cleanup must continue */}}stops.clear();};
 const check=()=>{if(finished||request.signal.aborted||abort.signal.aborted||Date.now()-start>=run.bounds.durationMs){stop();refused();}try{authorize();}catch(error){stop();throw error;}};
 const approvedThreads=new Set<string>();
 const transport:typeof fetch=async(resource,options)=>{
  function deny():never{stop();return refused();}
  check();if(++requests>run.bounds.requests){stop();deny();}
  const url=new URL(typeof resource==="string"?resource:resource instanceof URL?resource.href:resource.url),method=(options?.method??(resource instanceof Request?resource.method:"GET")).toUpperCase();
  const headers=new Headers(options?.headers??(resource instanceof Request?resource.headers:undefined));
  if(headers.get("authorization")!==`Bot ${environment.TRADERLINK_DISCORD_BOT_TOKEN?.trim()}`||!environment.TRADERLINK_DISCORD_BOT_TOKEN?.trim()||url.username||url.password||url.hash)deny();
  const queryKeys=[...url.searchParams.keys()];
  if(url.href.length>2048||new Set(queryKeys).size!==queryKeys.length||queryKeys.some(key=>!["limit","after","before"].includes(key)))deny();
  const limit=url.searchParams.get("limit"),after=url.searchParams.get("after"),before=url.searchParams.get("before");
  if(limit&&(!/^\d{1,4}$/.test(limit)||Number(limit)<1||Number(limit)>1000)||after&&!id(after)||before&&!id(before)&&(!/^\d{4}-\d{2}-\d{2}T/.test(before)||before.length>32||!Number.isFinite(Date.parse(before))))deny();
  if(url.origin!=="https://discord.com"||!url.pathname.startsWith("/api/v10/")||!["GET","POST","PATCH","DELETE"].includes(method))deny();
  const route=url.pathname.slice("/api/v10".length),channel=route.match(/^\/channels\/(\d+)\/(messages(?:\/\d+)?|threads\/archived\/public)$/),guildRoute=route.match(/^\/guilds\/(\d+)(?:\/(channels|roles|members(?:\/\d+)?|invites|vanity-url|threads\/active))?$/);
  if(channel){if(!run.channelIds.includes(channel[1])&&!approvedThreads.has(channel[1]))deny();if(method!=="GET"&&(run.pipeline==="stats"||!channel[2].startsWith("messages")||++writes>run.bounds.writes))deny();}
  else if(method!=="GET"||!(route==="/users/@me"||guildRoute?.[1]===run.guildId))deny();
  const response=await fetch(resource,{...options,redirect:"error",signal:AbortSignal.any([abort.signal,request.signal,...(options?.signal?[options.signal]:[]),AbortSignal.timeout(Math.max(1,Math.min(10000,run.bounds.durationMs-(Date.now()-start))))])});
  // A completed write receipt must survive cancellation. New work is still denied.
  if(method!=="GET")return response;
  check();
  if(response.ok&&(route.endsWith("/threads/active")||route.endsWith("/threads/archived/public"))){
   const clone=response.clone(),reader=clone.body?.getReader();if(!reader)deny();const chunks:Uint8Array[]=[];let size=0;
   try{for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>4_000_000)deny();chunks.push(chunk.value);}}finally{await reader.cancel();}
   check();const data=JSON.parse(Buffer.concat(chunks).toString("utf8")) as {threads?:{id:string;guild_id?:string;parent_id:string;type:number}[]};
   for(const thread of data.threads??[])if(id(thread.id)&&[10,11].includes(thread.type)&&run.channelIds.includes(thread.parent_id)&&(thread.guild_id===undefined||thread.guild_id===run.guildId)&&approvedThreads.size<1000)approvedThreads.add(thread.id);
  }
  return response;
 };
 structural();
 // The standard Core entry check is additional to each native private-frame check.
 withJournalAdminDatabase(request.headers,(_database,scope)=>{if(scope.userId!==principals.coach.userId||scope.mode!=="production_discord_owner")refused();},{environment,databasePath:DATABASE});
 authorize(()=>{if(db.prepare("SELECT 1 FROM platform_admin_audit_events WHERE action='operational_receipt_recorded' AND correlation_ref_sha256=? AND reason_code='community_stage_run_started'").get(nonceRef))refused();audit("community_stage_run_started","success");started=true;});
 const deadline=setTimeout(()=>stop("deadline"),run.bounds.durationMs);deadline.unref?.();
 const aborted=()=>stop("cancelled");request.signal.addEventListener("abort",aborted,{once:true});
 const capability:CommunityStagingQaCapability=Object.freeze({run:Object.freeze({...run,channelIds:Object.freeze([...run.channelIds]),jobs:Object.freeze(run.jobs.map(x=>Object.freeze({...x}))),bounds:Object.freeze({...run.bounds}),pins:Object.freeze({...run.pins})}),signal:abort.signal,request:transport,assertActive:check,
  gatewayFrame:database=>{if(database!==db)refused();check();if(++frames>run.bounds.gatewayFrames){stop();refused();}},historyTick:()=>{check();if(++histories>run.bounds.historyTicks){stop();refused();}},collectorTick:()=>{check();if(++ticks>run.bounds.collectorTicks){stop();refused();}},
  remainingMs:()=>Math.max(0,run.bounds.durationMs-(Date.now()-start)),onStop:callback=>{if(abort.signal.aborted){callback();return()=>undefined;}stops.add(callback);return()=>{stops.delete(callback);};},
  finish:outcome=>{if(finished)return;finished=true;clearTimeout(deadline);request.signal.removeEventListener("abort",aborted);stop();if(started){structural();db.transaction(()=>audit(outcome==="completed"?"community_stage_run_completed":"community_stage_run_aborted",outcome==="completed"?"success":"failed")).immediate();}},
 });
 admitted.set(capability,db);return capability;
}
