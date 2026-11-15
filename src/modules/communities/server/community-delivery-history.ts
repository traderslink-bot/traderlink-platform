import type Database from "better-sqlite3";
import {createCanonicalUuidV4} from "../../platform/server/database/platform-migration-contract";

// Append events; never update an earlier receipt when a delivery is requested again.
export function recordCommunityDeliveryAttempt(database:Database.Database,input:Readonly<{
 deliveryId:string;communityId:string;attemptKey:string;actorUserId?:string;
 outcome:"requested"|"confirmed"|"rejected"|"uncertain"|"pending"|"cancelled";
 messageId?:string|null;error?:string|null;atUtc:string;
}>):void{
 database.prepare(`INSERT INTO traderlink_community_delivery_attempt_history(event_id,attempt_key,delivery_id,community_id,actor_user_id,outcome,discord_message_id,error_message,occurred_at_utc) VALUES(?,?,?,?,?,?,?,?,?)`).run(createCanonicalUuidV4(),input.attemptKey,input.deliveryId,input.communityId,input.actorUserId??null,input.outcome,input.messageId??null,input.error??null,input.atUtc);
}
