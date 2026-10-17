import {createHash} from "node:crypto";
import type Database from "better-sqlite3";
import {createCanonicalUuidV4} from "../../platform/server/database/platform-migration-contract";
import {CommunityPublishingAccess,PublishingAccessError} from "./community-publishing-access";
export type PublicationContent={title:string;symbol?:string|null;body?:string;slug?:string;description?:string;symbols?:readonly string[];symbolNotes?:Readonly<Record<string,string>>;research?:unknown;publishingMode:string;publishedAtUtc:string|null;authorName?:string};
export function publicationContent(db:Database.Database,communityId:string,kind:"alert"|"watchlist",objectId:string):PublicationContent|undefined{
 if(kind==="alert")return db.prepare(`SELECT a.title,a.symbol,a.body,a.slug,a.publishing_mode publishingMode,a.published_at_utc publishedAtUtc,u.display_name authorName FROM traderlink_community_alerts a JOIN platform_users u ON u.user_id=a.author_user_id WHERE a.community_id=? AND a.alert_id=?`).get(communityId,objectId) as PublicationContent|undefined;
 const row=db.prepare(`SELECT w.title,w.description,w.publishing_mode publishingMode,w.published_at_utc publishedAtUtc,w.ticker_research_json research,u.display_name authorName FROM traderlink_community_server_watchlists w JOIN platform_users u ON u.user_id=w.author_user_id WHERE w.community_id=? AND w.watchlist_id=?`).get(communityId,objectId) as (Omit<PublicationContent,"research">&{research:string})|undefined;
 if(!row)return undefined;
 const symbolRows=(db.prepare(`SELECT symbol,note FROM traderlink_community_server_watchlist_symbols WHERE community_id=? AND watchlist_id=? ORDER BY ordinal`).all(communityId,objectId) as {symbol:string;note:string}[]);
 return {...row,research:JSON.parse(row.research||"{}"),symbols:symbolRows.map(item=>item.symbol),symbolNotes:Object.fromEntries(symbolRows.map(item=>[item.symbol,item.note]))};
}
export function recordPublicationRevision(db:Database.Database,input:{communityId:string;kind:"alert"|"watchlist";objectId:string;actorUserId:string;atUtc:string;summary?:string;original?:boolean}):string|undefined{
 const content=publicationContent(db,input.communityId,input.kind,input.objectId);if(!content?.publishedAtUtc)return undefined;
 const encoded=JSON.stringify({...content,authorName:undefined}),hash=createHash("sha256").update(encoded).digest("hex");
 const last=db.prepare(`SELECT revision_id,content_hash FROM traderlink_community_publication_revisions WHERE community_id=? AND object_type=? AND object_id=? ORDER BY rowid DESC LIMIT 1`).get(input.communityId,input.kind,input.objectId) as {revision_id:string;content_hash:string}|undefined;
 if(last?.content_hash===hash)return last.revision_id;
 const revisionId=createCanonicalUuidV4();
 db.prepare(`INSERT INTO traderlink_community_publication_revisions(revision_id,community_id,object_type,object_id,evidence_kind,actor_user_id,content_json,content_hash,original_published_at_utc,recorded_at_utc,change_summary) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(revisionId,input.communityId,input.kind,input.objectId,last?"revision":input.original?"original":"legacy_baseline",input.actorUserId,encoded,hash,content.publishedAtUtc,input.atUtc,(input.summary??"").slice(0,1000));
 return revisionId;
}
export function revisionDiscordPayload(content:PublicationContent,kind:"alert"|"watchlist",url:string,authorName=content.authorName??"An analyst"):string{
 // Link delivery never discloses tickers or research outside the tracked page.
 if(content.publishingMode==="tracked_page")return `${authorName} published ${kind==="alert"?"an alert":"a watchlist"}.\nOpen ${kind}: ${url}`;
 if(kind==="alert")return `**${content.symbol?content.symbol+" - ":""}${content.title}**\n${content.body??""}`;
 return `**${content.title}**\n${content.description??""}\n${(content.symbols??[]).map(symbol=>symbol+(content.symbolNotes?.[symbol]?` - ${content.symbolNotes[symbol]}`:"")).join("\n")}\nOpen watchlist: ${url}`;
}
export function queuePublicationActions(db:Database.Database,input:{communityId:string;slug:string;kind:"alert"|"watchlist";objectId:string;actorUserId:string;revisionId:string;action:"edit"|"announce";destinationIds:readonly string[];summary:string;confirmUncertain?:boolean;atUtc:string}){
 if(!input.destinationIds.length)throw new PublishingAccessError("Choose the Discord posts to update.");
 if(input.action==="announce"&&(!input.summary.trim()||input.summary.length>1000))throw new PublishingAccessError("Explain what changed in up to 1,000 characters before posting an update.");
 const current=publicationContent(db,input.communityId,input.kind,input.objectId);if(!current?.publishedAtUtc)throw new PublishingAccessError("Publish this item before requesting a Discord update.");
 const access=new CommunityPublishingAccess(db);
 for(const destinationId of input.destinationIds){
  access.assertDelivery(input.communityId,input.actorUserId,destinationId,input.kind==="alert"?"alerts":"watchlists",input.atUtc);
  const previous=db.prepare(`SELECT status FROM traderlink_community_publication_actions WHERE community_id=? AND object_type=? AND object_id=? AND destination_id=? AND action_kind=? AND revision_id=? ORDER BY rowid DESC LIMIT 1`).get(input.communityId,input.kind,input.objectId,destinationId,input.action,input.revisionId) as {status:string}|undefined;
  if(previous&&(previous.status==='pending'||previous.status==='sending'||(previous.status==='confirmed'&&input.action==='announce')))throw new PublishingAccessError("This revision already has a queued or confirmed Discord action for a selected channel. Check publication history first.");
  if(previous?.status==='uncertain'&&!input.confirmUncertain)throw new PublishingAccessError("An earlier action was not confirmed. Inspect the Discord channel, then confirm that inspection before requesting another action.");
  const delivery=db.prepare(`SELECT d.delivery_id,d.publisher_user_id,coalesce((SELECT h.discord_message_id FROM traderlink_community_delivery_attempt_history h WHERE h.delivery_id=d.delivery_id AND h.community_id=d.community_id AND h.outcome='confirmed' AND h.discord_message_id IS NOT NULL ORDER BY h.occurred_at_utc,h.rowid LIMIT 1),CASE WHEN d.delivery_outcome='confirmed' THEN d.discord_message_id END) message_id FROM traderlink_community_content_deliveries d WHERE d.community_id=? AND d.object_type=? AND d.object_id=? AND d.destination_id=?`).get(input.communityId,input.kind,input.objectId,destinationId) as {delivery_id:string;publisher_user_id:string|null;message_id:string|null}|undefined;
  if(!delivery?.message_id||!/^\d{1,32}$/.test(delivery.message_id)||!delivery.publisher_user_id)throw new PublishingAccessError("An original confirmed post is unavailable for a selected channel. No replacement will be sent.");
  access.assertDelivery(input.communityId,delivery.publisher_user_id,destinationId,input.kind==="alert"?"alerts":"watchlists",input.atUtc);
  db.prepare(`INSERT INTO traderlink_community_publication_actions(action_id,community_id,revision_id,object_type,object_id,destination_id,publisher_user_id,initiating_publisher_user_id,action_kind,target_message_id,payload_json,requested_at_utc,updated_at_utc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(createCanonicalUuidV4(),input.communityId,input.revisionId,input.kind,input.objectId,destinationId,input.actorUserId,delivery.publisher_user_id,input.action,delivery.message_id,JSON.stringify({summary:input.summary}),input.atUtc,input.atUtc);
 }
}
