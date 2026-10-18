import {coachingReviewService} from "@/src/modules/communities/server/coaching-review-service-binding";
import {requireCommunityRequestAccess} from "@/src/modules/communities/server/community-request-access";
import {requireTraderLinkPlatformRequestIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {TraderLinkCommunityCoachJournalReadService} from "@/src/modules/communities/server/traderlink-community-coach-journal-read-service";
import {resolveTraderLinkCommunityViewer} from "@/src/modules/communities/server/traderlink-community-viewer";

export async function GET(request:Request,{params}:{params:Promise<{communitySlug:string;reviewId:string;roundTripId:string}>}){
 try {
 const {communitySlug,reviewId,roundTripId}=await params;
 const identity=requireTraderLinkPlatformRequestIdentity(request.headers);
 await requireCommunityRequestAccess({userId:identity.scope.userId,slug:communitySlug,reviewId,existingCoachingOnly:true});
 const result=withReadonlyPlatformDatabase({},database=>{
  const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
  const row=database.prepare(`SELECT review.relationship_id,review.period_start,review.period_end,review.workspace_kind,review.delivery_state
   FROM traderlink_community_coaching_trade_reviews review
   JOIN traderlink_community_coaching_relationships relationship ON relationship.relationship_id=review.relationship_id AND relationship.community_id=review.community_id
   WHERE review.review_id=? AND review.community_id=(SELECT community_id FROM traderlink_communities WHERE slug=?)
    AND relationship.coach_user_id=? AND review.acceptance_state='accepted'
    AND review.delivery_state!='cancelled' AND review.status!='cancelled' AND review.cancelled_at_utc IS NULL`)
   .get(reviewId,communitySlug,actor.userId) as {relationship_id:string;period_start:string|null;period_end:string|null;workspace_kind:string;delivery_state:string}|undefined;
  if(!row)return null;
  const bound=coachingReviewService(database,reviewId);if(row.delivery_state==='draft'&&bound?.item.itemType==='trade_review'&&bound.item.coveragePeriod!=='single_item'&&(!row.period_start||!row.period_end))throw new Error('Confirm the accepted Trade review period first.');
  if(row.workspace_kind==='trading_day'&&(!row.period_start||!row.period_end))throw new Error("Choose the review date range first.");
  const service=new TraderLinkCommunityCoachJournalReadService(database);const input={coachUserId:actor.userId,relationshipId:row.relationship_id,roundTripId};
  // Authorize and date-check the actual shared trade before either response.
  // This deliberately uses trade permission, not Analytics permission. Find
  // previews remain available for Trade reviews with no configured date range.
  const details=service.readTrade(input);
  const date=details.trade.tradingDate;
  if((row.period_start||row.period_end)&&(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||(row.period_start&&date<row.period_start)||(row.period_end&&date>row.period_end)))throw new Error("Trade outside review period.");
  return new URL(request.url).searchParams.get("view")==="card"?service.readTradeCard(input):details;
 });
 return result?Response.json(result,{headers:{"Cache-Control":"private, no-store"}}):new Response(null,{status:404,headers:{"Cache-Control":"private, no-store"}});
 } catch { return Response.json({error:"Trade details are unavailable."},{status:403,headers:{"Cache-Control":"private, no-store"}}); }
}
