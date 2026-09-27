"use client";

import {COACHING_REVIEW_FOCUS,type CoachingReviewFocus} from "@/src/modules/communities/contracts/coaching-review-workspace";

import {Box,Button,Chip,Stack,TextField} from "@mui/material";
import type {TraderLinkCommunityDashboardSnapshot,TraderLinkCommunityTradeReview} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {markCommunityReviewViewedAction,replyCommunityReviewAction,updateCommunityReviewActionItemAction} from "./community-actions";
import {CommunityTypography as Typography} from "./community-typography";

export function StudentCoachingReview({snapshot,review,isReview,paused,messagingEnabled}:{snapshot:TraderLinkCommunityDashboardSnapshot;review:TraderLinkCommunityTradeReview;isReview:boolean;paused:boolean;messagingEnabled:boolean}){
 const delivered=Boolean(review.deliveredAtUtc);
 const disabled=isReview||paused;
 const status=review.deliveryState==="draft"?(review.status==="requested"?"Not started":"In progress"):review.deliveryState==="follow_up"?"Follow-up required":review.deliveryState.charAt(0).toUpperCase()+review.deliveryState.slice(1);
 const sections=[...Object.entries(review.focusFeedback??{}).map(([key,value])=>[COACHING_REVIEW_FOCUS[key as CoachingReviewFocus],value]),["Review",review.coachFeedback],["What went well",review.wentWell],["What needs work",review.needsWork],["Progress on previous focus",review.previousFocusAssessment],["Next focus",review.nextFocus]].filter(([,body])=>Boolean(body));
 const trades=snapshot.reviewTrades.filter(item=>item.reviewId===review.reviewId&&item.workflowState==="saved");
 const actions=snapshot.reviewActions.filter(item=>item.reviewId===review.reviewId);
 const hidden=<><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="relationshipId" type="hidden" value={review.relationshipId}/><input name="reviewId" type="hidden" value={review.reviewId}/></>;
 return <Box sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}>
  <Stack direction="row" spacing={1} sx={{justifyContent:"space-between",alignItems:"center"}}><Typography fontWeight={800}>{review.title}</Typography><Chip color={review.deliveryState==="completed"?"success":review.deliveryState==="follow_up"?"warning":"info"} label={status}/></Stack>
  {delivered?<Stack spacing={2} sx={{mt:2}}>
   {trades.map((trade,index)=><Box key={trade.roundTripId}><Typography fontWeight={800}>{trade.tradeLabel||`Trade review ${index+1}`}</Typography><Typography sx={{whiteSpace:"pre-wrap"}} variant="body2">{trade.coachFeedback}</Typography></Box>)}
   {sections.map(([title,body])=><Box key={title}><Typography fontWeight={800}>{title}</Typography><Typography sx={{whiteSpace:"pre-wrap"}} variant="body2">{body}</Typography></Box>)}
   {snapshot.coachingAttachments.filter(image=>image.targetId===review.reviewId&&(!image.roundTripId||trades.some(trade=>trade.roundTripId===image.roundTripId))).map(image=><Box key={image.attachmentId}><Box alt={image.filename} component="img" src={image.href} sx={{display:"block",maxWidth:"100%",maxHeight:480,borderRadius:1}}/></Box>)}
   {actions.length?<Box><Typography fontWeight={800}>Your actions</Typography><Stack spacing={1}>{actions.map(item=><Box key={item.actionId}><Typography>{item.title}</Typography>{item.details?<Typography variant="body2">{item.details}</Typography>:null}{item.dueAtUtc?<Typography variant="caption">Due {new Date(item.dueAtUtc).toLocaleDateString()}</Typography>:null}<Box action={disabled?undefined:updateCommunityReviewActionItemAction} component="form">{hidden}<input name="actionId" type="hidden" value={item.actionId}/><input name="state" type="hidden" value={item.status==="completed"?"open":"completed"}/><Button disabled={disabled} type="submit">{item.status==="completed"?"Completed · Reopen":"Mark complete"}</Button></Box></Box>)}</Stack></Box>:null}
   {review.deliveryState==="delivered"?<Box action={disabled?undefined:markCommunityReviewViewedAction} component="form">{hidden}<Button disabled={disabled} type="submit" variant="contained">I have read this review</Button></Box>:null}
   {review.viewedAtUtc?<Typography color="text.secondary" variant="caption">Read {new Date(review.viewedAtUtc).toLocaleDateString()}</Typography>:null}
   {review.followUpDueAtUtc&&review.deliveryState==="follow_up"?<Typography>Follow-up due {new Date(review.followUpDueAtUtc).toLocaleDateString()}</Typography>:null}
   {snapshot.reviewReplies.filter(reply=>reply.reviewId===review.reviewId).map(reply=><Box key={reply.replyId}><Typography fontWeight={700} variant="body2">{reply.authorName}</Typography><Typography sx={{whiteSpace:"pre-wrap"}} variant="body2">{reply.body}</Typography></Box>)}
   {messagingEnabled&&!["completed","cancelled"].includes(review.deliveryState)?<Box action={disabled?undefined:replyCommunityReviewAction} component="form">{hidden}<Stack direction="row" spacing={1}><TextField fullWidth label="Question or reply" multiline name="body" required/><Button disabled={disabled} type="submit">Send</Button></Stack></Box>:null}
  </Stack>:review.studentContext?<Typography sx={{mt:1}} variant="body2">{review.studentContext}</Typography>:null}
 </Box>;
}
