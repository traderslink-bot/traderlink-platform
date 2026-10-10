import {Box,Button,Stack,TextField} from "@mui/material";
import {DashboardPanel} from "@/app/dashboard-ui";
import type {TraderLinkCommunityDashboardSnapshot,TraderLinkCommunityTradeReview} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {replyCommunityReviewAction,setCommunityReviewLifecycleAction} from "./community-actions";
import {CommunityTypography as Typography} from "./community-typography";

export function CoachReviewFollowUp({snapshot,review,isReview}:{snapshot:TraderLinkCommunityDashboardSnapshot;review:TraderLinkCommunityTradeReview;isReview:boolean}){
 if(!review.deliveredAtUtc)return null;
 const hidden=<><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="relationshipId" type="hidden" value={review.relationshipId}/><input name="reviewId" type="hidden" value={review.reviewId}/></>;
 const active=["delivered","viewed","follow_up"].includes(review.deliveryState);
 return <DashboardPanel title="Follow-up"><Stack spacing={2}>
  {review.viewedAtUtc?<Typography>Read {new Date(review.viewedAtUtc).toLocaleString("en-US",{timeZone:"UTC"})} UTC</Typography>:null}
  {snapshot.reviewReplies.filter(reply=>reply.reviewId===review.reviewId).map(reply=><Box key={reply.replyId}><Typography fontWeight={800}>{reply.authorName}</Typography><Typography sx={{whiteSpace:"pre-wrap"}}>{reply.body}</Typography></Box>)}
  {active?<Box action={isReview?undefined:replyCommunityReviewAction} component="form">{hidden}<Stack spacing={1}><TextField label="Follow-up message" multiline minRows={3} name="body" required/><Button disabled={isReview} type="submit" variant="outlined">Send message</Button></Stack></Box>:null}
  {["viewed","follow_up"].includes(review.deliveryState)?<Box action={isReview?undefined:setCommunityReviewLifecycleAction} component="form">{hidden}<input name="state" type="hidden" value="follow_up"/><Stack direction={{xs:"column",sm:"row"}} spacing={1}><TextField defaultValue={review.followUpDueAtUtc?.slice(0,16)??""} label="Follow-up due (UTC)" name="followUpDueAt" required slotProps={{inputLabel:{shrink:true}}} type="datetime-local"/><Button disabled={isReview} type="submit" variant="contained">{review.deliveryState==="follow_up"?"Update due date":"Follow-up required"}</Button></Stack></Box>:null}
 </Stack></DashboardPanel>;
}
