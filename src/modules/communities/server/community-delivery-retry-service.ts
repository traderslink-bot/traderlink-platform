import {CommunityPublishingAccess} from "./community-publishing-access";
import type Database from "better-sqlite3";
import {assertCanonicalUtcTimestamp,assertCanonicalUuidV4,createCanonicalUuidV4,platformFailure} from "../../platform/server/database/platform-migration-contract";
import {TraderLinkCommunityRepository} from "./traderlink-community-repository";
import {recordCommunityDeliveryAttempt} from "./community-delivery-history";

export class CommunityDeliveryRetryService {
 constructor(private readonly database:Database.Database){}
 request(input:Readonly<{communityId:string;actorUserId:string;deliveryId:string;expectedAttemptKey:string;confirmUncertain:boolean;atUtc:string}>):void{
  assertCanonicalUuidV4(input.deliveryId,"deliveryId");assertCanonicalUtcTimestamp(input.atUtc,"atUtc");
  new TraderLinkCommunityRepository(this.database).requireCapability(input.communityId,input.actorUserId,"community.discord.manage");
  this.database.transaction(()=>{
   const row=this.database.prepare(`SELECT d.*,x.status destination_status,c.status community_status FROM traderlink_community_content_deliveries d JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id AND x.community_id=d.community_id JOIN traderlink_communities c ON c.community_id=d.community_id WHERE d.delivery_id=? AND d.community_id=?`).get(input.deliveryId,input.communityId) as {publisher_user_id:string|null;destination_id:string;object_type:string;status:string;destination_status:string;community_status:string;current_attempt_key:string|null;delivery_outcome:"pending"|"confirmed"|"rejected"|"uncertain";discord_message_id:string|null;last_error:string|null;updated_at_utc:string}|undefined;
   if(!row||row.community_status!=="active"||row.destination_status!=="active")platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED",{operation:"retry_delivery"});
   if(row.object_type==="alert"||row.object_type==="watchlist")new CommunityPublishingAccess(this.database).assertDelivery(input.communityId,row.publisher_user_id,row.destination_id,row.object_type==="alert"?"alerts":"watchlists",input.atUtc);
   if((row.current_attempt_key??input.deliveryId)!==input.expectedAttemptKey||!["failed","delivered"].includes(row.status))platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED",{field:"deliveryState"});
   if(row.delivery_outcome==="uncertain"&&!input.confirmUncertain)platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED",{field:"confirmUncertain"});
   // Preserve pre-migration receipt evidence before clearing the current attempt.
   if(!this.database.prepare("SELECT 1 FROM traderlink_community_delivery_attempt_history WHERE delivery_id=? AND attempt_key=? LIMIT 1").get(input.deliveryId,input.expectedAttemptKey))recordCommunityDeliveryAttempt(this.database,{deliveryId:input.deliveryId,communityId:input.communityId,attemptKey:input.expectedAttemptKey,outcome:row.delivery_outcome,messageId:row.discord_message_id,error:row.last_error,atUtc:row.updated_at_utc});
   const attemptKey=createCanonicalUuidV4();
   recordCommunityDeliveryAttempt(this.database,{deliveryId:input.deliveryId,communityId:input.communityId,attemptKey,actorUserId:input.actorUserId,outcome:"requested",atUtc:input.atUtc});
   this.database.prepare("UPDATE traderlink_community_content_deliveries SET current_attempt_key=?,status='pending',delivery_outcome='pending',attempt_count=0,last_error=NULL,discord_message_id=NULL,next_attempt_at_utc=NULL,delivered_at_utc=NULL,requested_at_utc=?,updated_at_utc=? WHERE delivery_id=?").run(attemptKey,input.atUtc,input.atUtc,input.deliveryId);
  }).immediate();
 }
}
