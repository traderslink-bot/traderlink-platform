import {requireCommunityRequestAccess} from '@/src/modules/communities/server/community-request-access';
import {requireTraderLinkPlatformRequestIdentity} from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';
import {TraderLinkCommunityCoachJournalReadService} from '@/src/modules/communities/server/traderlink-community-coach-journal-read-service';
import {resolveTraderLinkCommunityViewer} from '@/src/modules/communities/server/traderlink-community-viewer';

export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{communitySlug:string;reviewId:string;roundTripId:string}>}){
 const headers={'Cache-Control':'private, no-store'};
 try{
  const {communitySlug,reviewId,roundTripId}=await params;
  const identity=requireTraderLinkPlatformRequestIdentity(request.headers);
  await requireCommunityRequestAccess({userId:identity.scope.userId,slug:communitySlug,reviewId,existingCoachingOnly:true});
  const result=withReadonlyPlatformDatabase({},database=>{
   const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
   const review=database.prepare(`SELECT review.relationship_id FROM traderlink_community_coaching_trade_reviews review
    JOIN traderlink_community_coaching_relationships relationship ON relationship.relationship_id=review.relationship_id AND relationship.community_id=review.community_id
    WHERE review.review_id=? AND review.community_id=(SELECT community_id FROM traderlink_communities WHERE slug=?)
    AND relationship.coach_user_id=? AND review.acceptance_state='accepted'
    AND review.delivery_state!='cancelled' AND review.status!='cancelled' AND review.cancelled_at_utc IS NULL`)
    .get(reviewId,communitySlug,actor.userId) as {relationship_id:string}|undefined;
   if(!review)return null;
   // A review ID is not Journal authorization. The reader rechecks current
   // relationship, capability, participant, account and field-level sharing.
   const reader=new TraderLinkCommunityCoachJournalReadService(database);
   const input={coachUserId:actor.userId,relationshipId:review.relationship_id,roundTripId};
   return new URL(request.url).searchParams.get('view')==='card'?reader.readTradeCard(input):reader.readTrade(input);
  });
  return result?Response.json(result,{headers}):new Response(null,{status:404,headers});
 }catch{return Response.json({error:'Trade details are unavailable. Check current Journal sharing.'},{status:403,headers});}
}
