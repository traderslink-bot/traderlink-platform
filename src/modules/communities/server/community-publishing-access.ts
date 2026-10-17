import type Database from "better-sqlite3";
import {TraderLinkCommunityRepository} from "./traderlink-community-repository";
import {isFreshCommunityEvidence} from "./community-launch-policy";
import {assertCanonicalUuidV4,createCanonicalUuidV4} from "../../platform/server/database/platform-migration-contract";

export type PublishingKind="alerts"|"watchlists";
export type Distribution={distribution:"website"|"discord";destinationIds:readonly string[]};
export type PublisherAssignment={kind:"user"|"role";id:string};
export class PublishingAccessError extends Error {}
export function readDistribution(form:FormData):Distribution|undefined{
 if(!form.has("distribution"))return undefined;
 const distribution=String(form.get("distribution"));
 if(distribution!=="website"&&distribution!=="discord")throw new PublishingAccessError("Choose Website only or Send to Discord.");
 const destinationIds=[...new Set(form.getAll("destinationId").map(String))];
 if(destinationIds.length>50)throw new PublishingAccessError("Choose up to 50 destinations.");
 destinationIds.forEach(id=>assertCanonicalUuidV4(id,"destinationId"));
 return {distribution,destinationIds};
}
export class CommunityPublishingAccess {
 constructor(private readonly db:Database.Database){}
 allowed(communityId:string,userId:string,kind:PublishingKind,atUtc=new Date().toISOString()){
  const permission=kind==="alerts"?"community.alerts.create":"community.watchlists.publish_staff";
  const access=new TraderLinkCommunityRepository(this.db).resolveAccess(communityId,userId);
  if(!access.capabilities.includes(permission))return [];
  const evidence=this.db.prepare(`SELECT d.role_ids_json,d.last_verified_at_utc,c.discord_guild_id FROM traderlink_communities c JOIN platform_discord_memberships d ON d.guild_id=c.discord_guild_id AND d.user_id=? WHERE c.community_id=?`).get(userId,communityId) as {role_ids_json:string;last_verified_at_utc:string;discord_guild_id:string}|undefined;
  if(!evidence||!isFreshCommunityEvidence(evidence.last_verified_at_utc,atUtc))return [];
  const roles=new Set<string>(JSON.parse(evidence.role_ids_json));roles.add(evidence.discord_guild_id);
  const destinations=this.db.prepare(`SELECT destination_id,name,discord_channel_id,content_type,status FROM traderlink_community_discord_destinations WHERE community_id=? AND content_type=? AND status='active' ORDER BY name,destination_id`).all(communityId,kind) as {destination_id:string;name:string;discord_channel_id:string;content_type:PublishingKind;status:"active"}[];
  return destinations.filter(destination=>access.isOwner||this.assignments(communityId,destination.destination_id).some(subject=>subject.kind==="user"?subject.id===userId:roles.has(subject.id)));
 }
 assignments(communityId:string,destinationId:string):PublisherAssignment[]{return this.db.prepare(`SELECT subject_kind kind,subject_id id FROM traderlink_community_destination_publishers WHERE community_id=? AND destination_id=? ORDER BY subject_kind,subject_id`).all(communityId,destinationId) as PublisherAssignment[];}
 saveAssignments(input:{communityId:string;actorUserId:string;destinationId:string;subjects:readonly PublisherAssignment[];atUtc:string}){
  assertCanonicalUuidV4(input.destinationId,"destinationId");
  new TraderLinkCommunityRepository(this.db).requireCapability(input.communityId,input.actorUserId,"community.discord.manage");
  if(input.subjects.length>200)throw new PublishingAccessError("Choose up to 200 publishers.");
  if(!this.db.prepare(`SELECT 1 FROM traderlink_community_discord_destinations WHERE community_id=? AND destination_id=? AND content_type IN ('alerts','watchlists')`).get(input.communityId,input.destinationId))throw new PublishingAccessError("Choose an alerts or watchlists destination in this community.");
  for(const subject of input.subjects){
   if(subject.kind==="user"){
    assertCanonicalUuidV4(subject.id,"publisher");
    const access=new TraderLinkCommunityRepository(this.db).resolveAccess(input.communityId,subject.id);
    if(!access.capabilities.includes("community.alerts.create")&&!access.capabilities.includes("community.watchlists.publish_staff"))throw new PublishingAccessError("Choose a connected team publisher.");
   }else if(subject.kind!=="role"||!/^\d{1,32}$/.test(subject.id))throw new PublishingAccessError("Choose a current Discord role.");
  }
  this.db.transaction(()=>{
   const before=JSON.stringify(this.assignments(input.communityId,input.destinationId));
   this.db.prepare(`DELETE FROM traderlink_community_destination_publishers WHERE community_id=? AND destination_id=?`).run(input.communityId,input.destinationId);
   const insert=this.db.prepare(`INSERT OR IGNORE INTO traderlink_community_destination_publishers VALUES(?,?,?,?,?,?)`);
   for(const subject of input.subjects)insert.run(input.communityId,input.destinationId,subject.kind,subject.id,input.actorUserId,input.atUtc);
   const after=JSON.stringify(this.assignments(input.communityId,input.destinationId));
   if(before!==after)this.db.prepare(`INSERT INTO traderlink_community_destination_audit VALUES(?,?,?,?,?,?,?)`).run(createCanonicalUuidV4(),input.communityId,input.destinationId,input.actorUserId,before,after,input.atUtc);
  }).immediate();
 }
 intent(communityId:string,objectType:string,objectId:string):Distribution|undefined{
  const row=this.db.prepare(`SELECT distribution,destination_ids_json FROM traderlink_community_publication_distribution WHERE community_id=? AND object_type=? AND object_id=?`).get(communityId,objectType,objectId) as {distribution:"website"|"discord";destination_ids_json:string}|undefined;
  return row?{distribution:row.distribution,destinationIds:JSON.parse(row.destination_ids_json)}:undefined;
 }
 saveIntent(input:{communityId:string;publisherUserId:string;kind:PublishingKind;objectType:"alert"|"watchlist";objectId:string;selection?:Distribution;publishingMode?:string;publish:boolean;atUtc:string}){
  const selection=input.selection??this.intent(input.communityId,input.objectType,input.objectId);
  if(!selection)throw new PublishingAccessError("Choose Website only or Send to Discord before saving this publication.");
  if(!["website","discord"].includes(selection.distribution)||!Array.isArray(selection.destinationIds)||selection.destinationIds.length>50)throw new PublishingAccessError("Choose a valid distribution and destination selection.");
  selection.destinationIds.forEach(id=>assertCanonicalUuidV4(id,"destinationId"));
  if(new Set(selection.destinationIds).size!==selection.destinationIds.length)throw new PublishingAccessError("Choose each destination only once.");
  if(selection.distribution==="website"&&input.publishingMode==="discord_post")throw new PublishingAccessError("A full Discord post requires Send to Discord and a destination.");
  {
   if(input.publish&&!selection.destinationIds.length)throw new PublishingAccessError("Choose a channel association so TraderLink can follow its viewing permissions, even when no Discord message is sent.");
   const allowed=new Set(this.allowed(input.communityId,input.publisherUserId,input.kind,input.atUtc).map(row=>row.destination_id));
   if(selection.destinationIds.some(id=>!allowed.has(id)))throw new PublishingAccessError("A selected destination is no longer permitted. Check your channel selection.");
  }
  this.db.prepare(`INSERT INTO traderlink_community_publication_distribution VALUES(?,?,?,?,?,?,?) ON CONFLICT(community_id,object_type,object_id) DO UPDATE SET publisher_user_id=excluded.publisher_user_id,distribution=excluded.distribution,destination_ids_json=excluded.destination_ids_json,updated_at_utc=excluded.updated_at_utc`).run(input.communityId,input.objectType,input.objectId,input.publisherUserId,selection.distribution,JSON.stringify(selection.destinationIds),input.atUtc);
  return selection;
 }
 assertDelivery(communityId:string,publisherUserId:string|null,destinationId:string,kind:PublishingKind,atUtc:string){
  if(!publisherUserId)throw new PublishingAccessError("Legacy delivery requires owner review; no publisher was recorded.");
  if(!this.allowed(communityId,publisherUserId,kind,atUtc).some(row=>row.destination_id===destinationId))throw new PublishingAccessError("Publisher access or destination assignment is no longer available.");
 }
}
