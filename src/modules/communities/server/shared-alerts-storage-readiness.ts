import "server-only";
import {createHash} from "node:crypto";
import type Database from "better-sqlite3";
import {platformMigrationManifest} from "../../platform/server/database/platform-migration-manifest";
import {sharedAlertsMigrationCarrier,sharedProductionPrerequisitesReady,sharedProductionRequiredTables} from "../../platform/server/database/platform-shared-alerts-production-carrier";
import {SharedAlertsRepository} from "./shared-alerts-repository";
import {captureSharedAlertPublication} from "./shared-alerts-read";
import {captureSharedAlertChange} from "./shared-alerts-publication-changes";
import {queueSharedSourceRevisions} from "./shared-alerts-source-revision-delivery";
import {sharedAlertsSourceTrackerBinding} from "./shared-alerts-source-tracker";
import {isSharedAlertPublisher} from "./shared-alerts-publisher-permissions";
export function sharedAlertsStorageReady(db:Database.Database):boolean{
 if(!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_schema_migrations'").get())return false;
 const carrier=sharedAlertsMigrationCarrier;
 return carrier.state==="selected"&&sharedProductionPrerequisitesReady(db,platformMigrationManifest,[...carrier.requiredMigrations,...carrier.prerequisiteMigrations],sharedProductionRequiredTables);
}
const has=(db:Database.Database,name:string)=>!!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(name);
/** Receipt ownership is per delivery, never inferred from today's permission. */
export function sharedOwnedDeliverySql(db:Database.Database,alias:"d"|"traderlink_community_content_deliveries"="d"):string{
 const d=alias,clauses:string[]=[];
 if(has(db,"traderlink_community_publication_receipts"))clauses.push(`EXISTS(SELECT 1 FROM traderlink_community_publication_receipts own WHERE own.community_id=${d}.community_id AND own.request_id='shared-source-original:'||${d}.delivery_id)`);
 if(has(db,"traderlink_community_publication_actions"))clauses.push(`EXISTS(SELECT 1 FROM traderlink_community_publication_actions own WHERE own.community_id=${d}.community_id AND own.object_type='alert' AND own.object_id=${d}.object_id AND own.destination_id=${d}.destination_id AND json_extract(own.payload_json,'$.kind')='shared-source-edit-v1')`);
 if(has(db,"community_alert_discord_authors"))clauses.push(`(EXISTS(SELECT 1 FROM community_alert_discord_authors own WHERE own.alert_id=${d}.object_id) AND NOT EXISTS(SELECT 1 FROM traderlink_community_delivery_attempt_history old WHERE old.delivery_id=${d}.delivery_id))`);
 return `(${d}.object_type='alert' AND (${clauses.join(" OR ")||"0"}))`;
}
export function sharedOwnedActionSql(db:Database.Database,alias:"a"|"traderlink_community_publication_actions"="a"):string{
 return `coalesce((${alias}.object_type='alert' AND (json_extract(${alias}.payload_json,'$.kind')='shared-source-edit-v1' OR json_extract(${alias}.payload_json,'$.sourcePolicy')='shared-source-legacy' OR EXISTS(SELECT 1 FROM traderlink_community_content_deliveries d WHERE d.community_id=${alias}.community_id AND d.object_type='alert' AND d.object_id=${alias}.object_id AND d.destination_id=${alias}.destination_id AND ${sharedOwnedDeliverySql(db)}))),0)`;
}
export function sharedCooldownSql(db:Database.Database,channelExpression:string,atUtc:string):string{
 if(!has(db,"community_shared_alert_rate_limits"))return "1";
 // The only expressions/canonical timestamp come from native worker code.
 if(!/^(x\.discord_channel_id|traderlink_community_discord_destinations\.discord_channel_id)$/.test(channelExpression)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(atUtc))throw new Error("Invalid cooldown boundary.");
 return `NOT EXISTS(SELECT 1 FROM community_shared_alert_rate_limits cooldown WHERE cooldown.retry_at_utc>'${atUtc}' AND ((cooldown.scope='global' AND cooldown.scope_id='*') OR (cooldown.scope='channel' AND cooldown.scope_id=${channelExpression})))`;
}
export type SharedCaptureBefore={published_at_utc:string|null;title:string;symbol:string|null;body:string;status:string};
/** Caller keeps this in the existing publication transaction. No historical scan. */
export function captureCommunityAlertPublication(db:Database.Database,input:{communityId:string;alertId:string;actorUserId:string;atUtc:string;before?:SharedCaptureBefore;outboundAction?:"save"|"edit"|"announce"}):void{
 if(process.env.TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED!=="1"||!sharedAlertsStorageReady(db))return;
 const alert=db.prepare("SELECT author_user_id,published_at_utc,title,symbol,body,status FROM traderlink_community_alerts WHERE community_id=? AND alert_id=?").get(input.communityId,input.alertId) as (SharedCaptureBefore&{author_user_id:string})|undefined;
 if(!alert?.published_at_utc||!["published","archived"].includes(alert.status)||!isSharedAlertPublisher(db,input.communityId,alert.author_user_id,input.atUtc,true))return;
 const eventKind=!input.before?.published_at_utc?"publication":alert.status==="archived"?"withdrawal":"correction";
 if(eventKind==="correction"&&(!input.outboundAction||input.outboundAction==="save"))return;
 if(eventKind==="correction"&&input.before?.title===alert.title&&input.before?.symbol===alert.symbol&&input.before?.body===alert.body)return;
 const revision=db.prepare("SELECT revision_id,content_hash FROM traderlink_community_publication_revisions WHERE community_id=? AND object_type='alert' AND object_id=? ORDER BY rowid DESC LIMIT 1").get(input.communityId,input.alertId) as {revision_id:string;content_hash:string}|undefined;
 if(!revision)return;
 const key=`shared-source-capture:${input.alertId}:${revision.revision_id}:${eventKind}`;
 const digest=createHash("sha256").update(JSON.stringify([input.alertId,revision.revision_id,revision.content_hash,eventKind])).digest("hex");
 const receipt=db.prepare("SELECT payload_hash FROM traderlink_community_publication_receipts WHERE community_id=? AND request_id=?").get(input.communityId,key) as {payload_hash:string}|undefined;
 if(receipt){if(receipt.payload_hash!==digest)throw new Error("Shared capture evidence changed.");return;}
 const repository=new SharedAlertsRepository(db,()=>input.atUtc);
 if(!input.before?.published_at_utc){if(alert.status==="published")captureSharedAlertPublication(repository,input.alertId,input.atUtc);}
 else if(alert.status==="archived"||input.before.title!==alert.title||input.before.symbol!==alert.symbol||input.before.body!==alert.body)captureSharedAlertChange(repository,{alertId:input.alertId,kind:alert.status==="archived"?"withdrawal":"correction",actorUserId:input.actorUserId,atUtc:input.atUtc});
 db.prepare("INSERT INTO traderlink_community_publication_receipts(community_id,user_id,request_id,payload_hash,result_json,created_at_utc) VALUES(?,?,?,?,?,?)").run(input.communityId,input.actorUserId,key,digest,JSON.stringify({kind:"shared-source-capture-v1",eventKind,outboundAction:input.outboundAction??"save"}),input.atUtc);
}

/** Publish-time planning gives finite QA the actual native action ID before admission. */
export function planCommunitySharedRevisions(db:Database.Database,alertId:string,atUtc:string):void{
 const origin=process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN?.trim();
 if(!origin||process.env.TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED!=="1"||!sharedAlertsStorageReady(db))return;
 const tracker=sharedAlertsSourceTrackerBinding(origin);
 queueSharedSourceRevisions({database:db,now:()=>atUtc,limit:50,notBeforeUtc:process.env.TRADERLINK_COMMUNITY_DELIVERY_NOT_BEFORE_UTC?.trim()||undefined,trackedPageUrl:tracker.url},alertId);
}
