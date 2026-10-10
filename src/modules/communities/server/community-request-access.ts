import "server-only";
import {openPlatformDatabase} from "../../platform/server/database/open-platform-database";
import {verifyCommunityRequestMember} from "./community-request-verification";

/** Authenticated identity is supplied by the server entry point, never a form field. */
export async function requireCommunityRequestAccess(input:{userId:string;slug?:string;relationshipId?:string;taskId?:string;reviewId?:string;verifyParticipants?:boolean}){
 const db=openPlatformDatabase({mode:"runtime"});
 try{
  let relationshipId=input.relationshipId;
  if(!relationshipId&&(input.taskId||input.reviewId)){
   const table=input.taskId?"traderlink_community_coaching_tasks":"traderlink_community_coaching_trade_reviews";
   const key=input.taskId?"task_id":"review_id";
   relationshipId=(db.prepare(`SELECT relationship_id FROM ${table} WHERE ${key}=? AND community_id=(SELECT community_id FROM traderlink_communities WHERE slug=?)`).get(input.taskId??input.reviewId,input.slug??"") as {relationship_id:string}|undefined)?.relationship_id;
  }
  const relationship=relationshipId?db.prepare(`SELECT r.student_user_id,r.coach_user_id,c.slug FROM traderlink_community_coaching_relationships r JOIN traderlink_communities c ON c.community_id=r.community_id WHERE r.relationship_id=? AND (r.student_user_id=? OR r.coach_user_id=?)`).get(relationshipId,input.userId,input.userId) as {student_user_id:string;coach_user_id:string;slug:string}|undefined:undefined;
  if(relationshipId&&(!relationship||(input.slug&&relationship.slug!==input.slug)))throw new Error("Coaching workspace unavailable.");
  const slug=input.slug??relationship?.slug;
  if(!slug)throw new Error("Community unavailable.");
  const atUtc=new Date().toISOString(),botToken=process.env.TRADERLINK_DISCORD_BOT_TOKEN??"";
  const users=new Set([input.userId,...(relationship&&input.verifyParticipants!==false?[relationship.student_user_id,relationship.coach_user_id]:[])]);
  // At most the authenticated actor and two original participants, never an entire server.
  for(const userId of users)if(!await verifyCommunityRequestMember(db,{slug,userId,atUtc,botToken}))throw new Error("Discord access could not be verified. Try again shortly.");
 }finally{db.close();}
}
