import "server-only";
import {createHash,timingSafeEqual} from "node:crypto";
import {constants,openSync,closeSync,lstatSync,fstatSync,readFileSync,realpathSync} from "node:fs";
import {dirname,parse} from "node:path";
import type Database from "better-sqlite3";
import {withJournalAdminDatabase,PlatformAdminAuthorization} from "../../platform/server/administration/platform-admin-authorization";
import {PlatformAdminAuditRepository} from "../../platform/server/administration/platform-admin-audit-repository";
import {requireTraderLinkPlatformAuthenticatedRequestIdentity} from "../../platform/server/authentication/require-platform-request-scope";
import {PlatformSessionService,hashPlatformSessionToken} from "../../platform/server/authentication/platform-session-service";
import {deriveAuthenticatedUserJournalScope} from "../../platform/server/authentication/authenticated-user-journal-scope";
import {deriveJournalAccountSelectionRef} from "../../platform/contracts/journal-account-selection";
import {PlatformSessionRepository} from "../../platform/server/authentication/platform-session-repository";
import {platformMigrationManifest} from "../../platform/server/database/platform-migration-manifest";
import {calculatePlatformMigrationChecksum} from "../../platform/server/database/platform-migration-contract";
import {isSharedAlertPublisher} from "./shared-alerts-publisher-permissions";
import {SharedAlertsRepository} from "./shared-alerts-repository";
import {COMMUNITY_REVIEW_DISCORD_GUILD_ID,isCommunityStagingQaDiscordChannel,isCommunityStagingQaDiscordGuild} from "./community-review-discord-guild";

import {assertCommunityStagingQaTarget,COMMUNITY_STAGING_QA_DATABASE as DATABASE} from "./community-staging-qa-target";
export {assertCommunityStagingQaTarget,type CommunityStagingQaTargetPins} from "./community-staging-qa-target";
const hash=(value:string|Buffer)=>createHash("sha256").update(value).digest("hex");
const equal=(a:string,b:string)=>a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
function refused():never{throw new Error("Community staging QA capability refused.");}
const digest=(v:unknown):v is string=>typeof v==="string"&&/^[0-9a-f]{64}$/.test(v);
const id=(v:unknown):boolean=>typeof v==="string"&&/^\d{1,32}$/.test(v);
const uuid=(v:unknown):v is string=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
const fresh=(v:string,now:number)=>Number.isFinite(Date.parse(v))&&Date.parse(v)<=now&&now-Date.parse(v)<=300_000;
type CommunityStagingQaSharedJob=Readonly<{sourceCommunityId:string;sourceGuildId:string;sourceOwnerUserId:string;sourceOwnerDiscordId:string;receiverCommunityId:string;receiverGuildId:string;receiverOwnerUserId:string;receiverOwnerDiscordId:string;requestId:string;authorUserId:string;channelId:string;routeRevision:number;contentRevision:number;requireApproval:boolean}>;
export type CommunityStagingQaRun=Readonly<{
 kind:"community-staging-qa-run-v1";runId:string;nonce:string;principalManifestSha256:string;principalSchemaLineageSha256?:string;
 pins:Readonly<{origin:string;sourceCommit:string;sourceVectorSha256:string;sourceArchiveSha256:string;schemaSha256:string;buildId:string;artifactSha256:string}>;
 communityId:string;guildId:string;channelIds:readonly string[];settingsVersion:number;
 pipeline:"stats"|"common-delivery"|"shared-delivery"|"shared-fixture";fixtureManifestSha256?:string;cutoffUtc:string;
 jobs:readonly Readonly<{table:"traderlink_community_content_deliveries"|"traderlink_community_publication_actions"|"community_shared_alert_deliveries";id:string;createdAtUtc:string;stateSha256:string;shared?:CommunityStagingQaSharedJob}>[];
 bounds:Readonly<{durationMs:number;requests:number;writes:number;gatewayFrames:number;historyTicks:number;collectorTicks:number}>;
}>;
type Principal={userId:string;workspaceId:string;subject:string;session:{token:string;session:{sessionId:string;authProvider:string}}};
type Principals={kind:string;nonce:string;pins:{origin:string;sourceCommit:string;sourceVectorSha256:string;schemaSha256:string};coach:Principal;student:Principal};
export type CommunityStagingQaCapability=Readonly<{
 run:CommunityStagingQaRun;signal:AbortSignal;request:typeof fetch;
 assertActive:()=>void;gatewayFrame:(database:Database.Database)=>void;historyTick:()=>void;collectorTick:()=>void;
 withOperationFrame:(operation:()=>void)=>void;assertOperationFrame:()=>void;requestWithFixtureOperation:(resource:Parameters<typeof fetch>[0],options:Parameters<typeof fetch>[1],boundary:(operation:()=>void)=>void)=>ReturnType<typeof fetch>;
 remainingMs:()=>number;onStop:(callback:()=>void)=>()=>void;finish:(outcome:"completed"|"cancelled"|"failed")=>void;
}>;
export type CommunityStagingQaJob=CommunityStagingQaRun["jobs"][number];
export type CommunityStagingQaSubjectSelector=Readonly<{raw:string;subjects:readonly string[]}>;
/** Server-only ordered selector contract. The first two entries are the immutable student/coach pair. */
export function parseCommunityStagingQaSubjectSelector(environment:NodeJS.ProcessEnv=process.env):CommunityStagingQaSubjectSelector{
 const raw=environment.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT;
 if(typeof raw!=="string")refused();
 const subjects=raw.split(",").map(value=>value.trim());
 if(subjects.length<2||subjects.some(value=>!id(value))||new Set(subjects).size!==subjects.length)refused();
 return Object.freeze({raw,subjects:Object.freeze(subjects)});
}
/** Producer/issuer shared digest. It pins the selected queue row and its routing/content dependencies before admission. */
export function communityStagingQaJobStateSha256(database:Database.Database,job:Pick<CommunityStagingQaJob,"table"|"id">):string{
 const key=job.table==="traderlink_community_publication_actions"?"action_id":"delivery_id";
 const row=database.prepare(`SELECT * FROM ${job.table} WHERE ${key}=?`).get(job.id) as Record<string,unknown>|undefined;if(!row)refused();
 let dependencies:unknown;
 if(job.table==="traderlink_community_content_deliveries")dependencies={
  target:database.prepare("SELECT c.community_id,c.discord_guild_id,c.status community_status,x.destination_id,x.discord_channel_id,x.content_type,x.status destination_status FROM traderlink_community_discord_destinations x JOIN traderlink_communities c ON c.community_id=x.community_id WHERE x.community_id=? AND x.destination_id=?").get(row.community_id,row.destination_id),
  distribution:database.prepare("SELECT * FROM traderlink_community_publication_distribution WHERE community_id=? AND object_type=? AND object_id=?").get(row.community_id,row.object_type,row.object_id),
  revisions:database.prepare("SELECT revision_id,evidence_kind,content_hash,actor_user_id FROM traderlink_community_publication_revisions WHERE community_id=? AND object_type=? AND object_id=? ORDER BY rowid").all(row.community_id,row.object_type,row.object_id),
 };
 else if(job.table==="traderlink_community_publication_actions")dependencies={
  target:database.prepare("SELECT c.community_id,c.discord_guild_id,c.status community_status,x.destination_id,x.discord_channel_id,x.content_type,x.status destination_status FROM traderlink_community_discord_destinations x JOIN traderlink_communities c ON c.community_id=x.community_id WHERE x.community_id=? AND x.destination_id=?").get(row.community_id,row.destination_id),
  revision:database.prepare("SELECT revision_id,evidence_kind,content_hash,actor_user_id FROM traderlink_community_publication_revisions WHERE community_id=? AND revision_id=?").get(row.community_id,row.revision_id),
 };
 else dependencies={
  agreement:database.prepare("SELECT * FROM community_shared_alert_requests WHERE request_id=?").get(row.request_id),
  route:database.prepare("SELECT * FROM community_shared_alert_routes WHERE request_id=? AND author_user_id=?").get(row.request_id,row.author_user_id),
  communities:database.prepare("SELECT community_id,discord_guild_id,owner_user_id,status FROM traderlink_communities WHERE community_id IN (SELECT source_community_id FROM community_shared_alert_requests WHERE request_id=? UNION SELECT receiver_community_id FROM community_shared_alert_requests WHERE request_id=?) ORDER BY community_id").all(row.request_id,row.request_id),
  owners:database.prepare("SELECT c.community_id,c.discord_guild_id,c.owner_user_id,i.auth_subject,m.last_verified_at_utc,checks.result,checks.checked_at_utc FROM traderlink_communities c LEFT JOIN platform_auth_identities i ON i.user_id=c.owner_user_id AND i.auth_provider='discord' AND i.status='active' LEFT JOIN platform_discord_memberships m ON m.user_id=c.owner_user_id AND m.guild_id=c.discord_guild_id LEFT JOIN community_shared_alert_owner_checks checks ON checks.community_id=c.community_id WHERE c.community_id IN (SELECT source_community_id FROM community_shared_alert_requests WHERE request_id=? UNION SELECT receiver_community_id FROM community_shared_alert_requests WHERE request_id=?) ORDER BY c.community_id").all(row.request_id,row.request_id),
  publisher:database.prepare("SELECT p.*,m.status membership_status,m.discord_verified_at_utc,i.status identity_status,d.last_verified_at_utc FROM community_alert_publisher_permissions p LEFT JOIN traderlink_community_memberships m ON m.community_id=p.community_id AND m.user_id=p.user_id LEFT JOIN platform_auth_identities i ON i.user_id=p.user_id AND i.auth_provider='discord' LEFT JOIN traderlink_communities c ON c.community_id=p.community_id LEFT JOIN platform_discord_memberships d ON d.user_id=p.user_id AND d.guild_id=c.discord_guild_id WHERE p.community_id=(SELECT source_community_id FROM community_shared_alert_requests WHERE request_id=?) AND p.user_id=?").get(row.request_id,row.author_user_id),
  source:database.prepare("SELECT * FROM traderlink_community_alerts WHERE alert_id=? AND community_id=(SELECT source_community_id FROM community_shared_alert_requests WHERE request_id=?)").get(row.alert_id,row.request_id),
  distribution:database.prepare("SELECT * FROM traderlink_community_publication_distribution WHERE community_id=(SELECT source_community_id FROM community_shared_alert_requests WHERE request_id=?) AND object_type='alert' AND object_id=?").get(row.request_id,row.alert_id),
  destinationGrants:database.prepare("SELECT p.* FROM traderlink_community_destination_publishers p WHERE p.community_id=(SELECT source_community_id FROM community_shared_alert_requests WHERE request_id=?) AND p.destination_id IN (SELECT value FROM json_each(?)) ORDER BY p.destination_id,p.subject_kind,p.subject_id").all(row.request_id,row.source_destination_ids_json),
  parts:database.prepare("SELECT * FROM community_shared_alert_delivery_parts WHERE delivery_id=? ORDER BY content_revision,part_number").all(job.id),
  original:row.original_delivery_id?database.prepare("SELECT delivery_id,status,discord_message_id,channel_id,content_revision FROM community_shared_alert_deliveries WHERE delivery_id=?").get(row.original_delivery_id):null,
 };
 return hash(JSON.stringify({table:job.table,id:job.id,row,dependencies}));
}
function excludedQueueStateSha256(database:Database.Database,jobs:readonly Pick<CommunityStagingQaJob,"table"|"id">[]):string{
 const selected=new Set(jobs.map(job=>`${job.table}:${job.id}`));
 const rows=(table:CommunityStagingQaJob["table"],key:string,statuses:string[])=>
  (database.prepare(`SELECT * FROM ${table} WHERE status IN (${statuses.map(()=>"?").join(",")}) ORDER BY ${key}`).all(...statuses) as Record<string,unknown>[])
   .filter(row=>!selected.has(`${table}:${String(row[key])}`));
 return hash(JSON.stringify({
  common:rows("traderlink_community_content_deliveries","delivery_id",["pending","failed","sending"]).filter(row=>row.delivery_outcome==="pending"||row.delivery_outcome==="uncertain"),
  actions:rows("traderlink_community_publication_actions","action_id",["pending","sending"]),
  shared:rows("community_shared_alert_deliveries","delivery_id",["awaiting_approval","pending","failed","sending"]),
  parts:(database.prepare("SELECT * FROM community_shared_alert_delivery_parts ORDER BY delivery_id,content_revision,part_number").all() as Record<string,unknown>[])
   .filter(row=>!selected.has(`community_shared_alert_deliveries:${String(row.delivery_id)}`)),
 }));
}
/** Full-row preservation fence for every non-selected queue row and Shared part. */
export function createCommunityStagingQaExcludedQueueFence(database:Database.Database,jobs:readonly Pick<CommunityStagingQaJob,"table"|"id">[]){
 const original=excludedQueueStateSha256(database,jobs);
 return Object.freeze({assertUnchanged:()=>{if(excludedQueueStateSha256(database,jobs)!==original)refused();}});
}
export function assertCommunityStagingQaSharedJobAdmission(database:Database.Database,job:CommunityStagingQaJob,now:string):void{
 if(job.table!=="community_shared_alert_deliveries"||!job.shared)refused();
 const selected=database.prepare(`SELECT d.request_id,d.author_user_id,d.channel_id,d.status delivery_status,d.requires_approval,d.terms_version delivery_terms_version,d.content_revision,d.approved_content_revision,d.approved_by_user_id,
  r.source_community_id,r.receiver_community_id,r.source_owner_user_id,r.source_owner_discord_id,r.receiver_owner_user_id,r.receiver_owner_discord_id,
  r.status agreement_status,r.terms_version agreement_terms_version,r.source_approved_version,r.receiver_approved_version,r.source_paused,r.receiver_paused,
  route.source_offered,route.receiver_selected,
  route.receiver_paused route_receiver_paused,route.revision route_revision,route.channel_id route_channel_id,route.require_approval route_require_approval
  FROM community_shared_alert_deliveries d JOIN community_shared_alert_requests r ON r.request_id=d.request_id
  JOIN community_shared_alert_routes route ON route.request_id=d.request_id AND route.author_user_id=d.author_user_id
  WHERE d.delivery_id=?`).get(job.id) as Record<string,unknown>|undefined;
 const s=job.shared;if(!selected||selected.source_community_id!==s.sourceCommunityId||selected.source_owner_user_id!==s.sourceOwnerUserId||selected.source_owner_discord_id!==s.sourceOwnerDiscordId||selected.receiver_community_id!==s.receiverCommunityId||selected.receiver_owner_user_id!==s.receiverOwnerUserId||selected.receiver_owner_discord_id!==s.receiverOwnerDiscordId||selected.request_id!==s.requestId||selected.author_user_id!==s.authorUserId||selected.channel_id!==s.channelId||selected.route_channel_id!==s.channelId||selected.route_revision!==s.routeRevision||selected.content_revision!==s.contentRevision||Boolean(selected.route_require_approval)!==s.requireApproval||Boolean(selected.requires_approval)!==s.requireApproval||(s.requireApproval&&(selected.approved_content_revision!==s.contentRevision||selected.approved_by_user_id!==s.receiverOwnerUserId))||selected.source_offered!==1||selected.receiver_selected!==1||selected.route_receiver_paused!==0||selected.agreement_status!=="active"||!["pending","failed","sending"].includes(String(selected.delivery_status))||selected.delivery_terms_version!==selected.agreement_terms_version||selected.agreement_terms_version!==selected.source_approved_version||selected.agreement_terms_version!==selected.receiver_approved_version||selected.source_paused!==0||selected.receiver_paused!==0||!isSharedAlertPublisher(database,s.sourceCommunityId,s.authorUserId,now,true))refused();
 const repository=new SharedAlertsRepository(database,()=>now);
 for(const expected of [{communityId:s.sourceCommunityId,guildId:s.sourceGuildId,ownerUserId:s.sourceOwnerUserId,discordUserId:s.sourceOwnerDiscordId},{communityId:s.receiverCommunityId,guildId:s.receiverGuildId,ownerUserId:s.receiverOwnerUserId,discordUserId:s.receiverOwnerDiscordId}]){
  let actual;try{actual=repository.ownerContext(expected.communityId);}catch{return refused();}
  if(actual.guildId!==expected.guildId||actual.ownerUserId!==expected.ownerUserId||actual.discordUserId!==expected.discordUserId||!repository.ownerIsFresh(actual))refused();
 }
}
const admitted=new WeakMap<object,Database.Database>();
export function assertCommunityStagingQaCapability(value:CommunityStagingQaCapability|undefined,database?:Database.Database,purpose?:"shared-fixture"):asserts value is CommunityStagingQaCapability{
 if(!value||!admitted.has(value)||(database&&admitted.get(value)!==database)||(purpose==="shared-fixture"?value.run.pipeline!=="shared-fixture":value.run.pipeline==="shared-fixture"))refused();value.assertActive();
}
export function assertCommunityStagingQaSharedTarget(value:CommunityStagingQaCapability|undefined,database:Database.Database,guildId:string,channelId?:string):void{
 assertCommunityStagingQaCapability(value,database);if(value.run.pipeline!=="shared-delivery")refused();
 const source=guildId===value.run.guildId&&(channelId===undefined||value.run.channelIds.includes(channelId));
 const receiver=value.run.jobs.some(job=>job.shared?.receiverGuildId===guildId&&(channelId===undefined||job.shared.channelId===channelId));
 if(!source&&!receiver)refused();
 if(channelId!==undefined&&!isCommunityStagingQaDiscordChannel(guildId,channelId))refused();
}

type SchemaLineagePin=Readonly<{migrationId:string;moduleNamespace:string;executionOrder:number;checksumSha256:string;postSchemaSha256:string}>;
type SchemaLineageBase=Readonly<{principalManifestSha256:string;fromSchemaSha256:string;toSchemaSha256:string;fromMigrationCount:203;prefix:readonly SchemaLineagePin[]}>;
type SchemaLineage=SchemaLineageBase & (Readonly<{kind:"community-staging-qa-schema-lineage-v1";toMigrationCount:204;append:SchemaLineagePin}>
 | Readonly<{kind:"community-staging-qa-schema-lineage-v2";toMigrationCount:205;appends:readonly [SchemaLineagePin,SchemaLineagePin]}>
 | Readonly<{kind:"community-staging-qa-schema-lineage-v3";toMigrationCount:210;appends:readonly [SchemaLineagePin,SchemaLineagePin,SchemaLineagePin,SchemaLineagePin,SchemaLineagePin,SchemaLineagePin,SchemaLineagePin]}>);
const COMMUNITY_STAGING_QA_SCHEMA_SUFFIX=Object.freeze([
 ["0216_platform_premium_current_access_events","platform",291],
 ["0217_traderlink_community_stats_forward_checkpoints","community",292],
 ["0218_watchlist_row_visibility","platform",293],
 ["0219_watchlist_masked_added_date","platform",294],
 ["0220_watchlist_trader_notes_notifications","platform",295],
 ["0221_news_account_filters_and_saved_views","news",296],
 ["0222_watchlist_indicators_visibility","platform",297],
] as const);
function assertPrincipalSchemaLineage(database:Database.Database,run:CommunityStagingQaRun,principals:Principals,lineage:SchemaLineage|undefined):void{
 if(principals.pins.schemaSha256===run.pins.schemaSha256){if(lineage||run.principalSchemaLineageSha256)refused();return;}
 if(!lineage||lineage.principalManifestSha256!==run.principalManifestSha256||lineage.fromSchemaSha256!==principals.pins.schemaSha256||lineage.toSchemaSha256!==run.pins.schemaSha256||lineage.fromMigrationCount!==203||!Array.isArray(lineage.prefix)||lineage.prefix.length!==203)refused();
 let suffix:readonly SchemaLineagePin[];
 if(lineage.kind==="community-staging-qa-schema-lineage-v1"){
  if(lineage.toMigrationCount!==204||platformMigrationManifest.length!==204||!lineage.append)refused();
  suffix=[lineage.append];
 }else if(lineage.kind==="community-staging-qa-schema-lineage-v2"){
  if(lineage.toMigrationCount!==205||platformMigrationManifest.length!==205||!Array.isArray(lineage.appends)||lineage.appends.length!==2)refused();
  suffix=lineage.appends;
 }else if(lineage.kind==="community-staging-qa-schema-lineage-v3"){
  if(lineage.toMigrationCount!==210||platformMigrationManifest.length!==210||!Array.isArray(lineage.appends)||lineage.appends.length!==7)refused();
  suffix=lineage.appends;
 }else return refused();
 for(let index=0;index<suffix.length;index++){const pin=suffix[index],expected=COMMUNITY_STAGING_QA_SCHEMA_SUFFIX[index];if(!pin||!expected||pin.migrationId!==expected[0]||pin.moduleNamespace!==expected[1]||pin.executionOrder!==expected[2])refused();}
 const rows=database.prepare("SELECT migration_id,module_namespace,execution_order,checksum_sha256,post_schema_sha256 FROM platform_schema_migrations ORDER BY execution_order").all() as {migration_id:string;module_namespace:string;execution_order:number;checksum_sha256:string;post_schema_sha256:string}[];
 const pins=[...lineage.prefix,...suffix];
 if(rows.length!==pins.length||platformMigrationManifest.length!==pins.length)refused();
 for(let index=0;index<pins.length;index++){
  const pin=pins[index],native=rows[index],canonical=platformMigrationManifest[index];
  if(!pin||!digest(pin.checksumSha256)||!digest(pin.postSchemaSha256)||pin.migrationId!==canonical.migrationId||pin.moduleNamespace!==canonical.moduleNamespace||pin.executionOrder!==canonical.executionOrder||pin.checksumSha256!==calculatePlatformMigrationChecksum(canonical)||native.migration_id!==pin.migrationId||native.module_namespace!==pin.moduleNamespace||native.execution_order!==pin.executionOrder||native.checksum_sha256!==pin.checksumSha256||native.post_schema_sha256!==pin.postSchemaSha256)refused();
 }
 if(lineage.prefix[202].postSchemaSha256!==principals.pins.schemaSha256||suffix[suffix.length-1].postSchemaSha256!==run.pins.schemaSha256)refused();
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
 const pipeline=["stats","common-delivery","shared-delivery","shared-fixture"].includes(run.pipeline);
 const guildAllowed=run.pipeline==="shared-fixture"?run.guildId===COMMUNITY_REVIEW_DISCORD_GUILD_ID:isCommunityStagingQaDiscordGuild(run.guildId);
 if(run.kind!=="community-staging-qa-run-v1"||!uuid(run.runId)||!/^[0-9a-f]{32}$/.test(run.nonce)||!digest(run.principalManifestSha256)||!pipeline||!guildAllowed||!uuid(run.communityId)||!Array.isArray(run.channelIds)||!run.channelIds.length||run.channelIds.length>50||run.channelIds.some(x=>!isCommunityStagingQaDiscordChannel(run.guildId,x))||new Set(run.channelIds).size!==run.channelIds.length||!Number.isSafeInteger(run.settingsVersion)||run.settingsVersion<0)refused();
 if(!run.pins||new URL(run.pins.origin).origin!==run.pins.origin||!run.pins.origin.startsWith("https://")||!/^[0-9a-f]{40}$/.test(run.pins.sourceCommit)||![run.pins.sourceVectorSha256,run.pins.sourceArchiveSha256,run.pins.schemaSha256,run.pins.artifactSha256].every(digest)||!/^[A-Za-z0-9_-]{1,128}$/.test(run.pins.buildId))refused();
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(run.cutoffUtc)||!Number.isFinite(Date.parse(run.cutoffUtc))||!Array.isArray(run.jobs)||run.jobs.length>3||new Set(run.jobs.map(x=>x.id)).size!==run.jobs.length)refused();
 for(const job of run.jobs){
  const known=["traderlink_community_content_deliveries","traderlink_community_publication_actions","community_shared_alert_deliveries"].includes(job.table);
  const validId=job.table==="community_shared_alert_deliveries"?/^[a-f0-9]{32}$/.test(job.id):uuid(job.id);
  const shared=job.shared;
  if(!known||!validId||!digest(job.stateSha256)||!Number.isFinite(Date.parse(job.createdAtUtc))||job.createdAtUtc<run.cutoffUtc||(job.table==="community_shared_alert_deliveries")!==Boolean(shared))refused();
  if(shared&&(![shared.sourceCommunityId,shared.sourceOwnerUserId,shared.receiverCommunityId,shared.receiverOwnerUserId,shared.requestId,shared.authorUserId].every(uuid)||![shared.sourceGuildId,shared.sourceOwnerDiscordId,shared.receiverGuildId,shared.receiverOwnerDiscordId,shared.channelId].every(id)||!Number.isSafeInteger(shared.routeRevision)||shared.routeRevision<0||!Number.isSafeInteger(shared.contentRevision)||shared.contentRevision<1||typeof shared.requireApproval!=="boolean"||shared.sourceCommunityId!==run.communityId||shared.sourceGuildId!==run.guildId||!isCommunityStagingQaDiscordGuild(shared.receiverGuildId)||!isCommunityStagingQaDiscordChannel(shared.receiverGuildId,shared.channelId)||shared.sourceGuildId===shared.receiverGuildId))refused();
 }
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
 const selector=parseCommunityStagingQaSubjectSelector(environment);
 if(principals.coach.subject!==selector.subjects[1]||principals.student.subject!==selector.subjects[0])refused();
 const request=input.request,requestBinding=JSON.stringify([...request.headers]);
 const route=run.pipeline==="stats"?"community-stats-qa":run.pipeline==="shared-fixture"?"community-staging-qa":"community-delivery-qa";
 if(request.method!=="POST"||request.signal.aborted||new URL(request.url).href!==`${run.pins.origin}/__private/${route}/${run.nonce}`||request.headers.get("origin")!==run.pins.origin||request.headers.get("sec-fetch-site")==="cross-site")refused();
 const auditTarget=hash(`${run.runId}:${run.communityId}`),nonceRef=hash(run.nonce),start=Date.now(),abort=new AbortController(),stops=new Set<()=>void>();
 let operationCheck:(()=>void)|undefined,operationFailure:unknown,originalOwnerBinding:string|undefined;
 let finished=false,requests=0,writes=0,frames=0,histories=0,ticks=0,started=false,authorizing=false;
 const structural=()=>{
  assertCommunityStagingQaTarget(db,run.pins);
  assertPrincipalSchemaLineage(db,run,principals,lineage);
  if(db.readonly||JSON.stringify([...request.headers])!==requestBinding||environment.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT!==selector.raw)refused();
 };
 const deliveryPipeline=run.pipeline==="common-delivery"||run.pipeline==="shared-delivery";
 const pendingRows=()=>[
  ...db.prepare("SELECT d.delivery_id id,d.requested_at_utc createdAtUtc,d.community_id communityId,c.discord_guild_id guildId,x.discord_channel_id channelId,'traderlink_community_content_deliveries' kind FROM traderlink_community_content_deliveries d LEFT JOIN traderlink_communities c ON c.community_id=d.community_id LEFT JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id WHERE d.status IN('pending','failed','sending') AND d.delivery_outcome IN('pending','uncertain')").all(),
  ...db.prepare("SELECT a.action_id id,a.requested_at_utc createdAtUtc,a.community_id communityId,c.discord_guild_id guildId,x.discord_channel_id channelId,'traderlink_community_publication_actions' kind FROM traderlink_community_publication_actions a LEFT JOIN traderlink_communities c ON c.community_id=a.community_id LEFT JOIN traderlink_community_discord_destinations x ON x.destination_id=a.destination_id AND x.community_id=a.community_id WHERE a.status IN('pending','sending')").all(),
  ...db.prepare("SELECT d.delivery_id id,d.created_at_utc createdAtUtc,r.receiver_community_id communityId,c.discord_guild_id guildId,d.channel_id channelId,'community_shared_alert_deliveries' kind FROM community_shared_alert_deliveries d LEFT JOIN community_shared_alert_requests r ON r.request_id=d.request_id LEFT JOIN traderlink_communities c ON c.community_id=r.receiver_community_id WHERE d.status IN('awaiting_approval','pending','failed','sending')").all(),
 ] as {id:string;createdAtUtc:string;communityId:string;guildId:string;channelId:string;kind:CommunityStagingQaJob["table"]}[];
 const excludedQueueFence=deliveryPipeline?createCommunityStagingQaExcludedQueueFence(db,run.jobs):null;
 let selectedJobsAdmitted=false;
 const checkNative=()=>{
  const session=new PlatformSessionService(new PlatformSessionRepository(db)).resolve(principals.coach.session.token);
  if(!session||session.sessionId!==principals.coach.session.session.sessionId||session.userId!==principals.coach.userId||session.authProvider!=="discord")refused();
  if(!db.prepare("SELECT 1 FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND auth_subject=? AND status='active'").get(principals.coach.userId,principals.coach.subject)||!db.prepare("SELECT 1 FROM platform_workspace_memberships WHERE user_id=? AND workspace_id=? AND role='owner' AND status='active'").get(principals.coach.userId,principals.coach.workspaceId))refused();
  const community:({discord_guild_id:string;owner_user_id:string;discord_configuration_version?:number;channel_ids_json?:string}|undefined)=deliveryPipeline
   ?db.prepare("SELECT discord_guild_id,owner_user_id FROM traderlink_communities WHERE community_id=? AND status='active'").get(run.communityId) as {discord_guild_id:string;owner_user_id:string}|undefined
   :db.prepare("SELECT c.discord_guild_id,c.owner_user_id,s.discord_configuration_version,s.channel_ids_json FROM traderlink_communities c JOIN community_stats_settings s ON s.community_id=c.community_id WHERE c.community_id=? AND c.status='active'").get(run.communityId) as {discord_guild_id:string;owner_user_id:string;discord_configuration_version:number;channel_ids_json:string}|undefined;
  if(!community||community.discord_guild_id!==run.guildId||(run.pipeline!=="shared-delivery"&&community.owner_user_id!==principals.coach.userId))refused();
  if(!deliveryPipeline){if(community.discord_configuration_version!==run.settingsVersion||typeof community.channel_ids_json!=="string")refused();const selected=JSON.parse(community.channel_ids_json) as unknown;if(!Array.isArray(selected)||selected.some(x=>typeof x!=="string"||!run.channelIds.includes(x)))refused();}
  if(deliveryPipeline){
   excludedQueueFence?.assertUnchanged();
   if(!selectedJobsAdmitted){
    const pending=pendingRows();
    for(const job of run.jobs){const row=pending.find(item=>item.kind===job.table&&item.id===job.id),shared=job.shared;const expectedCommunity=shared?.receiverCommunityId??run.communityId,expectedGuild=shared?.receiverGuildId??run.guildId,expectedChannel=shared?.channelId;if(!row||row.communityId!==expectedCommunity||row.guildId!==expectedGuild||(expectedChannel?row.channelId!==expectedChannel:!run.channelIds.includes(row.channelId))||row.createdAtUtc!==job.createdAtUtc||row.createdAtUtc<run.cutoffUtc||communityStagingQaJobStateSha256(db,job)!==job.stateSha256)refused();}
    selectedJobsAdmitted=true;
   }
   for(const job of run.jobs)if(job.table==="community_shared_alert_deliveries")assertCommunityStagingQaSharedJobAdmission(db,job,new Date().toISOString());
  }
  if(run.pipeline!=="shared-delivery"){const member=db.prepare("SELECT guild_owner,last_verified_at_utc FROM platform_discord_memberships WHERE user_id=? AND guild_id=?").get(principals.coach.userId,run.guildId) as {guild_owner:number;last_verified_at_utc:string}|undefined;if(!member||member.guild_owner!==1||!fresh(member.last_verified_at_utc,Date.now()))refused();}
 };
 const authorize=(operation?:()=>void,fixtureOperation=false)=>{
  if(authorizing||db.inTransaction)refused();authorizing=true;
  try{structural();const identity=requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers,{environment,databasePath:DATABASE});
   const ownerNativeStamp=()=>({subjects:db.prepare("SELECT auth_subject,created_at_utc,updated_at_utc FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").all(principals.coach.userId),lifecycle:db.prepare("SELECT lifecycle_ref,generation,admission_ref,erasure_generation,phase,profile_ref,profile_generation,valid_until_utc FROM platform_erasure_lifecycles WHERE user_id=?").get(principals.coach.userId)});
   const originalNative=run.pipeline==="shared-fixture"?JSON.stringify(ownerNativeStamp()):null;
   if(run.pipeline==="shared-fixture"){
    const binding=hash(JSON.stringify({sessionId:identity.sessionId,mode:identity.mode,scope:identity.scope,subject:principals.coach.subject,native:originalNative}));
    if(originalOwnerBinding&&originalOwnerBinding!==binding)refused();originalOwnerBinding=binding;
   }
   new PlatformAdminAuthorization(db,environment).withRequestAuditFrame(request,frame=>{
    const scope=frame.authorize(identity,request.headers);if(scope.userId!==principals.coach.userId||scope.role!=="journal_owner_admin"||scope.mode!=="production_discord_owner"||!scope.permissions.includes("manage_users")||identity.sessionId!==principals.coach.session.session.sessionId||!scope.discordOwnerVerifiedAtUtc||!fresh(scope.discordOwnerVerifiedAtUtc,Date.now()))refused();
    if(!fixtureOperation){checkNative();operation?.();frame.revalidate(scope,identity,request.headers);return;}
    const selection=identity.scope.activeAccountId===null?null:deriveJournalAccountSelectionRef(identity.scope.workspaceId,identity.scope.activeAccountId);
    const revalidate=()=>{
     if(operationFailure)throw operationFailure;
     if(finished||request.signal.aborted||abort.signal.aborted||Date.now()-start>=run.bounds.durationMs)refused();
     structural();checkNative();
     if(fixtureOperation){
      const nativeSession=new PlatformSessionRepository(db).findActiveByTokenDigest(hashPlatformSessionToken(principals.coach.session.token),new Date().toISOString());
      const currentScope=deriveAuthenticatedUserJournalScope(db,principals.coach.userId,selection);
      if(JSON.stringify(ownerNativeStamp())!==originalNative)refused();
      if(!nativeSession||nativeSession.sessionId!==identity.sessionId||nativeSession.userId!==identity.scope.userId||JSON.stringify(currentScope)!==JSON.stringify(identity.scope))refused();
     }
     frame.revalidate(scope,identity,request.headers);
    };
    try{if(fixtureOperation){operationFailure=undefined;operationCheck=revalidate;}revalidate();if(operation?.()!==undefined)refused();revalidate();}finally{if(fixtureOperation){operationCheck=undefined;operationFailure=undefined;}}
   });
  }finally{authorizing=false;}
 };
 const audit=(reason:string,outcome:"success"|"failed")=>new PlatformAdminAuditRepository(db).append({actorKind:"platform_user",actorUserId:principals.coach.userId,actorRole:"journal_owner_admin",action:"operational_receipt_recorded",targetKind:"authority",targetRefSha256:auditTarget,outcome,reasonCode:reason,correlationRefSha256:nonceRef,previewReceiptSha256:input.runManifestSha256,details:{purpose:"isolated_staging_review",pipeline:run.pipeline,requests,writes,frames},createdAtUtc:new Date().toISOString()});
 const stop=(reason="denied")=>{if(!abort.signal.aborted)abort.abort(reason);for(const callback of stops){try{callback();}catch{/* terminal cleanup must continue */}}stops.clear();};
 const check=()=>{try{if(finished||request.signal.aborted||abort.signal.aborted||Date.now()-start>=run.bounds.durationMs)refused();if(operationCheck)operationCheck();else authorize();}catch(error){if(operationCheck)operationFailure=error;else stop();throw error;}};
 const withOperationFrame=(operation:()=>void)=>{
  if(run.pipeline!=="shared-fixture"||operationCheck||finished||request.signal.aborted||abort.signal.aborted||Date.now()-start>=run.bounds.durationMs)refused();
  try{authorize(operation,true);}catch(error){stop();throw error;}
 };
 const assertOperationFrame=()=>{if(run.pipeline!=="shared-fixture"||!operationCheck||!db.inTransaction)refused();check();};
 const approvedThreads=new Set<string>();
 const approvedGuilds=new Set<string>([run.guildId,...run.jobs.flatMap(job=>job.shared?[job.shared.receiverGuildId]:[])]),approvedChannels=new Map<string,string>(run.channelIds.map(channel=>[channel,run.guildId]));
 for(const job of run.jobs)if(job.shared)approvedChannels.set(job.shared.channelId,job.shared.receiverGuildId);
 const transport=async(resource:Parameters<typeof fetch>[0],options?:Parameters<typeof fetch>[1],boundary?:(operation:()=>void)=>void):ReturnType<typeof fetch>=>{
  function deny():never{const error=new Error("Community staging QA capability refused.");if(operationCheck)operationFailure=error;else stop();throw error;}
  const checkedBoundary=(work:()=>void)=>{
   if(!boundary){work();return;}
   if(run.pipeline!=="shared-fixture")deny();
   let calls=0,armed=true,invalid=false;
   try{const result=boundary(()=>{if(!armed||calls++!==0||!operationCheck||!db.inTransaction){invalid=true;return deny();}assertOperationFrame();work();});if(result!==undefined||calls!==1||invalid)deny();}finally{armed=false;}
  };
  let url!:URL,method!:string,route!:string;
  checkedBoundary(()=>{check();if(++requests>run.bounds.requests)deny();
  url=new URL(typeof resource==="string"?resource:resource instanceof URL?resource.href:resource.url);method=(options?.method??(resource instanceof Request?resource.method:"GET")).toUpperCase();
  const headers=new Headers(options?.headers??(resource instanceof Request?resource.headers:undefined));
  if(headers.get("authorization")!==`Bot ${environment.TRADERLINK_DISCORD_BOT_TOKEN?.trim()}`||!environment.TRADERLINK_DISCORD_BOT_TOKEN?.trim()||url.username||url.password||url.hash)deny();
  const queryKeys=[...url.searchParams.keys()];
  if(url.href.length>2048||new Set(queryKeys).size!==queryKeys.length||queryKeys.some(key=>!["limit","after","before"].includes(key)))deny();
  const limit=url.searchParams.get("limit"),after=url.searchParams.get("after"),before=url.searchParams.get("before");
  if(limit&&(!/^\d{1,4}$/.test(limit)||Number(limit)<1||Number(limit)>1000)||after&&!id(after)||before&&!id(before)&&(!/^\d{4}-\d{2}-\d{2}T/.test(before)||before.length>32||!Number.isFinite(Date.parse(before))))deny();
  if(url.origin!=="https://discord.com"||!url.pathname.startsWith("/api/v10/")||!["GET","POST","PATCH","DELETE"].includes(method))deny();
  route=url.pathname.slice("/api/v10".length);const channel=route.match(/^\/channels\/(\d+)\/(messages(?:\/\d+)?|threads\/archived\/public)$/),guildRoute=route.match(/^\/guilds\/(\d+)(?:\/(channels|roles|members(?:\/\d+)?|invites|vanity-url|threads\/active))?$/);
  if(channel){const channelGuild=approvedChannels.get(channel[1]);if((!channelGuild&&!approvedThreads.has(channel[1]))||(!approvedThreads.has(channel[1])&&(!isCommunityStagingQaDiscordChannel(channelGuild,channel[1])||!approvedGuilds.has(channelGuild!))))deny();if(method!=="GET"&&(run.pipeline==="stats"||!channel[2].startsWith("messages")||++writes>run.bounds.writes))deny();}
  else if(method!=="GET"||!(route==="/users/@me"||Boolean(guildRoute&&approvedGuilds.has(guildRoute[1]))))deny();
  });
  const response=await fetch(resource,{...options,redirect:"error",signal:AbortSignal.any([abort.signal,request.signal,...(options?.signal?[options.signal]:[]),AbortSignal.timeout(Math.max(1,Math.min(10000,run.bounds.durationMs-(Date.now()-start))))])});
  // A completed write receipt must survive cancellation. New work is still denied.
  if(method!=="GET")return response;
  checkedBoundary(check);
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
 const capability:CommunityStagingQaCapability=Object.freeze({run:Object.freeze({...run,channelIds:Object.freeze([...run.channelIds]),jobs:Object.freeze(run.jobs.map(x=>Object.freeze({...x}))),bounds:Object.freeze({...run.bounds}),pins:Object.freeze({...run.pins})}),signal:abort.signal,request:transport,assertActive:check,withOperationFrame,assertOperationFrame,requestWithFixtureOperation:(resource,options,boundary)=>transport(resource,options,boundary),
  gatewayFrame:database=>{if(database!==db)refused();check();if(++frames>run.bounds.gatewayFrames){stop();refused();}},historyTick:()=>{check();if(++histories>run.bounds.historyTicks){stop();refused();}},collectorTick:()=>{check();if(++ticks>run.bounds.collectorTicks){stop();refused();}},
  remainingMs:()=>Math.max(0,run.bounds.durationMs-(Date.now()-start)),onStop:callback=>{if(abort.signal.aborted){callback();return()=>undefined;}stops.add(callback);return()=>{stops.delete(callback);};},
  finish:outcome=>{if(finished)return;excludedQueueFence?.assertUnchanged();finished=true;clearTimeout(deadline);request.signal.removeEventListener("abort",aborted);stop();if(started){structural();db.transaction(()=>audit(outcome==="completed"?"community_stage_run_completed":"community_stage_run_aborted",outcome==="completed"?"success":"failed")).immediate();}},
 });
 admitted.set(capability,db);return capability;
}
