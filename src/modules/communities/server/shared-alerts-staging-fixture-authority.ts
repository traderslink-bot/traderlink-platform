import "server-only";
import {createHash} from "node:crypto";
import type Database from "better-sqlite3";
import {assertCommunityStagingQaCapability,type CommunityStagingQaCapability} from "./community-staging-qa-capability";
import {COMMUNITY_REVIEW_DISCORD_GUILD_ID} from "./community-review-discord-guild";
import {requireTraderLinkPlatformAuthenticatedRequestIdentity} from "../../platform/server/authentication/require-platform-request-scope";
import {platformMigrationManifest} from "../../platform/server/database/platform-migration-manifest";
import {calculatePlatformMigrationChecksum} from "../../platform/server/database/platform-migration-contract";
import {PlatformSessionRepository} from "../../platform/server/authentication/platform-session-repository";
import {PlatformSessionService,TRADERLINK_PLATFORM_SESSION_COOKIE} from "../../platform/server/authentication/platform-session-service";
export type FixtureKey="harbor"|"northstar";
type Principal=Readonly<{key:FixtureKey;userId:string;subject:string;sessionId:string;channelIds:readonly string[]}>;
export type SharedFixtureManifest=Readonly<{kind:"shared-alerts-synthetic-fixture-v1";fixtureId:string;runId:string;nonce:string;nativeLedgerSha256:string;pins:CommunityStagingQaCapability["run"]["pins"];expiresAtUtc:string;principals:readonly Principal[]}>;
export type SharedFixtureContext=Readonly<{fixtureId:string;runId:string}>;
type Authority=Readonly<{database:Database.Database;parent:CommunityStagingQaCapability;manifest:SharedFixtureManifest}>;
const admitted=new WeakMap<object,Authority>();
const issued=new WeakSet<object>();
const uuid=(s:unknown):s is string=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s);
const snowflake=(s:unknown):s is string=>typeof s==="string"&&/^\d{1,32}$/.test(s);
function refused():never{throw new Error("Synthetic Shared Alerts fixture refused.");}
function ledgerCurrent(database:Database.Database,expected:string){
 if(!/^[a-f0-9]{64}$/.test(expected))refused();
 const rows=database.prepare("SELECT migration_id,module_namespace,execution_order,checksum_sha256,post_schema_sha256 FROM platform_schema_migrations ORDER BY execution_order").all() as {migration_id:string;module_namespace:string;execution_order:number;checksum_sha256:string;post_schema_sha256:string}[];
 if(!platformMigrationManifest.length||rows.length!==platformMigrationManifest.length||createHash("sha256").update(JSON.stringify(rows)).digest("hex")!==expected)refused();
 for(const [index,m] of platformMigrationManifest.entries()){const row=rows[index];if(row.migration_id!==m.migrationId||row.module_namespace!==m.moduleNamespace||row.execution_order!==m.executionOrder||row.checksum_sha256!==calculatePlatformMigrationChecksum(m)||!/^[a-f0-9]{64}$/.test(row.post_schema_sha256))refused();}
}
function principalActive(database:Database.Database,p:Principal){
 return !!database.prepare(`SELECT 1 FROM platform_auth_sessions s JOIN platform_users u ON u.user_id=s.user_id AND u.status='active'
 JOIN platform_auth_identities i ON i.user_id=s.user_id AND i.auth_provider=s.auth_provider AND i.auth_subject=s.auth_subject AND i.status='active'
 WHERE s.session_id=? AND s.user_id=? AND s.auth_provider='discord' AND s.auth_subject=? AND s.revoked_at_utc IS NULL AND s.expires_at_utc>?`).get(p.sessionId,p.userId,p.subject,new Date().toISOString());
}
/** Core controller input only. Never issue from client fields, a cookie, or a production entrypoint. */
export function issueSharedFixtureContext(input:Readonly<{database:Database.Database;parent:CommunityStagingQaCapability;manifestBytes:Buffer;manifestSha256:string}>):SharedFixtureContext{
 assertCommunityStagingQaCapability(input.parent,input.database,"shared-fixture");
 if(issued.has(input.parent))refused();
 const run=input.parent.run;
 if(run.pipeline!=="shared-fixture"||run.fixtureManifestSha256!==input.manifestSha256||run.jobs.length!==0||run.guildId!==COMMUNITY_REVIEW_DISCORD_GUILD_ID||input.manifestBytes.length>32768||!/^[a-f0-9]{64}$/.test(input.manifestSha256)||createHash("sha256").update(input.manifestBytes).digest("hex")!==input.manifestSha256)refused();
 const m=JSON.parse(input.manifestBytes.toString("utf8")) as SharedFixtureManifest;
 if(m.kind!=="shared-alerts-synthetic-fixture-v1"||!uuid(m.fixtureId)||m.runId!==run.runId||m.nonce!==run.nonce||!m.pins||Object.keys(run.pins).some(k=>m.pins[k as keyof typeof m.pins]!==run.pins[k as keyof typeof run.pins])||Object.keys(m.pins).length!==Object.keys(run.pins).length)refused();
 const remaining=Date.parse(m.expiresAtUtc)-Date.now();
 if(!Number.isFinite(remaining)||remaining<=0||remaining>120000||remaining>input.parent.remainingMs()||!Array.isArray(m.principals)||m.principals.length!==2)refused();
 const selectors=process.env.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT?.split(",").map(x=>x.trim());
 if(!selectors||selectors.length!==2||selectors[0]===selectors[1])refused();
 for(const p of m.principals)if(!["harbor","northstar"].includes(p.key)||!uuid(p.userId)||!uuid(p.sessionId)||!snowflake(p.subject)||!selectors.includes(p.subject)||!Array.isArray(p.channelIds)||!p.channelIds.length||p.channelIds.length>2||new Set(p.channelIds).size!==p.channelIds.length||p.channelIds.some((id:unknown)=>!snowflake(id)||!run.channelIds.includes(id))||!principalActive(input.database,p))refused();
 if(new Set(m.principals.map(p=>p.key)).size!==2||new Set(m.principals.map(p=>p.userId)).size!==2||new Set(m.principals.map(p=>p.sessionId)).size!==2||new Set(m.principals.map(p=>p.subject)).size!==2)refused();
 ledgerCurrent(input.database,m.nativeLedgerSha256);
 const principals=Object.freeze(m.principals.map(p=>Object.freeze({...p,channelIds:Object.freeze([...p.channelIds])})));
 const manifest=Object.freeze({...m,pins:Object.freeze({...m.pins}),principals});
 const context=Object.freeze({fixtureId:m.fixtureId,runId:m.runId});admitted.set(context,Object.freeze({database:input.database,parent:input.parent,manifest}));
 assertSharedFixtureContext(context,input.database);issued.add(input.parent);return context;
}
/** This exposes immutable scope to server adapters, never serializable authority. */
export function assertSharedFixtureContext(context:SharedFixtureContext,database?:Database.Database):Authority{
 const a=admitted.get(context);if(!a||database&&database!==a.database)refused();
 assertCommunityStagingQaCapability(a.parent,a.database,"shared-fixture");
 if(Date.now()>=Date.parse(a.manifest.expiresAtUtc))refused();
 ledgerCurrent(a.database,a.manifest.nativeLedgerSha256);
 if(a.manifest.principals.some(p=>!principalActive(a.database,p)))refused();
 return a;
}
export function requireSharedFixtureActor(context:SharedFixtureContext,request:Request,key:FixtureKey):Principal & Readonly<{fixtureKeys:readonly FixtureKey[]}>{
 const a=admitted.get(context);if(!a||!a.database.open||a.parent.signal.aborted||Date.now()>=Date.parse(a.manifest.expiresAtUtc))refused();
 const p=a.manifest.principals.find(x=>x.key===key);if(!p)refused();
 const url=new URL(request.url);
 if(url.origin!==a.manifest.pins.origin||url.pathname!==`/__private/shared-alerts-fixture/${context.runId}/${key}`||url.search||url.hash||url.username||url.password||request.signal.aborted||!["GET","POST"].includes(request.method)||request.headers.get("sec-fetch-site")==="cross-site"||request.method==="POST"&&request.headers.get("origin")!==url.origin)refused();
 const identity=requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers,{databasePath:a.database.name});
 const cookies=(request.headers.get("cookie")??"").split(";").map(x=>x.trim()).filter(x=>x.startsWith(TRADERLINK_PLATFORM_SESSION_COOKIE+"="));
 if(cookies.length!==1)refused();
 const session=new PlatformSessionService(new PlatformSessionRepository(a.database)).resolve(cookies[0].slice(TRADERLINK_PLATFORM_SESSION_COOKIE.length+1));
 if(identity.mode!=="platform_session"||identity.scope.userId!==p.userId||identity.sessionId!==p.sessionId||!session||session.sessionId!==p.sessionId||session.userId!==p.userId||session.authProvider!=="discord")refused();
 assertSharedFixtureContext(context);return Object.freeze({...p,fixtureKeys:Object.freeze(a.manifest.principals.map(x=>x.key))});
}
