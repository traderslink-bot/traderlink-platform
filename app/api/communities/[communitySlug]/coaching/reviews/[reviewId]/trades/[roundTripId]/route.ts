import {requireTraderLinkPlatformRequestIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {TraderLinkCommunityCoachJournalReadService} from "@/src/modules/communities/server/traderlink-community-coach-journal-read-service";
import {resolveTraderLinkCommunityViewer} from "@/src/modules/communities/server/traderlink-community-viewer";

export async function GET(request:Request,{params}:{params:Promise<{communitySlug:string;reviewId:string;roundTripId:string}>}){
 try {
 const {communitySlug,reviewId,roundTripId}=await params;
 const identity=requireTraderLinkPlatformRequestIdentity(request.headers);
 const result=withReadonlyPlatformDatabase({},database=>{
  const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
  const row=database.prepare(`SELECT review.relationship_id FROM traderlink_community_coaching_trade_reviews review WHERE review.review_id=? AND review.community_id=(SELECT community_id FROM traderlink_communities WHERE slug=?)`).get(reviewId,communitySlug) as {relationship_id:string}|undefined;
  if(!row)return null;
  return new TraderLinkCommunityCoachJournalReadService(database).readTrade({coachUserId:actor.userId,relationshipId:row.relationship_id,roundTripId});
 });
 return result?Response.json(result,{headers:{"Cache-Control":"private, no-store"}}):new Response(null,{status:404});
 } catch { return Response.json({error:"Trade details are unavailable."},{status:403,headers:{"Cache-Control":"private, no-store"}}); }
}
