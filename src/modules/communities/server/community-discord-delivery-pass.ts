import "server-only";
import type Database from "better-sqlite3";
import {TraderLinkCommunityDiscordDeliveryService} from "./traderlink-community-discord-delivery-service";
import {sharedAlertsStorageReady} from "./shared-alerts-storage-readiness";
import {runSharedAlertsSourcePass,type SharedSourceDispatchContext} from "./shared-alerts-source-dispatch";
import {sharedAlertsSourceOriginalDelivery,verifySourceWrite,assertSourceWriteCurrent} from "./shared-alerts-source-original-delivery";
import {sharedAlertsSourceRevisionDelivery} from "./shared-alerts-source-revision-delivery";
import {sharedAlertsSourceTrackerBinding} from "./shared-alerts-source-tracker";
import {SharedAlertsSourcePolicy} from "./shared-alerts-source-policy";
import {SharedAlertsSourcePublication} from "./shared-alerts-source-publication";
import {SharedAlertRateLimits,sharedAlertAwareDiscordRequest} from "./shared-alerts-rate-limits";
import {verifyCommunityRequestMember} from "./community-request-verification";
import type {SharedActionAdmission} from "./community-publication-action-delivery";
import type {CommunityExactDeliverySelection} from "./traderlink-community-discord-delivery-service";

/** One native pass. Hosted gates stay in the runtime; staging needs its genuine finite permit. */
export async function runCommunityDiscordDeliveryPass(database:Database.Database,config:Readonly<{botToken:string;publicOrigin:string;notBeforeUtc?:string;now?:()=>string;limit?:number;sharedEnabled?:boolean;exactSelection?:CommunityExactDeliverySelection}>,transport:typeof fetch=fetch):Promise<Readonly<{delivered:number;failed:number}>>{
 const now=config.now??(()=>new Date().toISOString()),limit=config.limit??5;
 if(!Number.isSafeInteger(limit)||limit<1||limit>10)throw new Error("Invalid delivery batch.");
 const sharedEnabled=config.sharedEnabled??process.env.TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED==="1";
 const ready=sharedAlertsStorageReady(database),enabled=sharedEnabled&&ready;
 const hasRates=!!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='community_shared_alert_rate_limits'").get();
 const request=hasRates?sharedAlertAwareDiscordRequest(transport,operation=>operation(database),now):transport;
 if(hasRates&&new SharedAlertRateLimits(database,now).current())return {delivered:0,failed:0};
 let delivered=0,failed=0,sharedActions:SharedActionAdmission|undefined;
 if(enabled){
  const policy=new SharedAlertsSourcePolicy(database),context:SharedSourceDispatchContext={database,policy,request,now,botToken:config.botToken,limit,notBeforeUtc:config.notBeforeUtc,exactSelection:config.exactSelection?{sourceDeliveryIds:config.exactSelection.deliveryIds,actionIds:config.exactSelection.actionIds,sharedDeliveryIds:config.exactSelection.sharedDeliveryIds}:undefined,trackedPageUrl:sharedAlertsSourceTrackerBinding(config.publicOrigin).url};
  const source=(row:Parameters<SharedActionAdmission["assert"]>[0])=>{
   const author=database.prepare("SELECT author_user_id FROM traderlink_community_alerts WHERE community_id=? AND alert_id=?").get(row.community_id,row.object_id) as {author_user_id:string}|undefined;
   if(!author||!row.publisher_user_id||!row.initiating_publisher_user_id)throw new Error("Source publisher evidence unavailable.");
   return {...row,publisher_user_id:row.publisher_user_id,initiating_publisher_user_id:row.initiating_publisher_user_id,author_user_id:author.author_user_id};
  };
  const assert=(row:Parameters<SharedActionAdmission["assert"]>[0])=>{
   const current=source(row);assertSourceWriteCurrent(context,current);
   for(const userId of [row.publisher_user_id,row.initiating_publisher_user_id]){if(!userId)throw new Error("Publisher evidence unavailable.");new SharedAlertsSourcePublication(database).readForPublisher(row.community_id,userId,row.object_id,now());policy.assertDelivery(row.community_id,userId,row.destination_id,"alerts",now());}
  };
  sharedActions={assert,verify:async row=>{await verifySourceWrite(context,source(row));if(!row.initiating_publisher_user_id||!await verifyCommunityRequestMember(database,{slug:row.slug,userId:row.initiating_publisher_user_id,botToken:config.botToken,atUtc:now()},request))throw new Error("Original publisher verification unavailable.");assert(row);}};
  const shared=await runSharedAlertsSourcePass(database,{...config,limit,enabled:true,sharedEnabled:true,exactSelection:context.exactSelection},{originals:sharedAlertsSourceOriginalDelivery,edits:sharedAlertsSourceRevisionDelivery,tracker:sharedAlertsSourceTrackerBinding(config.publicOrigin)},request);
  delivered+=shared.delivered;failed+=shared.failed;
 }
 // Shared-owned rows remain excluded even when disabled, unqualified or held.
 const common=await new TraderLinkCommunityDiscordDeliveryService(database,{...config,sharedActions},request).runAvailable(limit);
 return Object.freeze({delivered:delivered+common.delivered,failed:failed+common.failed});
}
