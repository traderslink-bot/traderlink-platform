"use client";
import {CoachingReviewGoals} from "./coaching-review-goals";
import {CoachingReviewCapResolution} from "./coaching-review-cap-resolution";
import {StudentReviewExistingDays} from "./student-review-existing-days";
import {StudentReviewExistingTrades} from "./student-review-existing-trades";
import {coachingTradeFeedbackText} from "@/src/modules/communities/contracts/coaching-trade-feedback";


import {COACHING_REVIEW_FOCUS,type CoachingReviewFocus} from "@/src/modules/communities/contracts/coaching-review-workspace";

import {Box,Button,Chip,Stack,TextField} from "@mui/material";
import type {TraderLinkCommunityDashboardSnapshot,TraderLinkCommunityTradeReview} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {markCommunityReviewViewedAction,replyCommunityReviewAction,updateCommunityReviewActionItemAction} from "./community-actions";
import {CommunityTypography as Typography} from "./community-typography";

export function StudentCoachingReview({snapshot,review,isReview,paused,messagingEnabled}:{snapshot:TraderLinkCommunityDashboardSnapshot;review:TraderLinkCommunityTradeReview;isReview:boolean;paused:boolean;messagingEnabled:boolean}){
 const delivered=Boolean(review.deliveredAtUtc);
 const disabled=isReview||paused;
 const status=review.deliveryState==="draft"?(review.acceptanceState==="pending"?"Pending acceptance":review.status==="requested"?"Not started":"In progress"):review.deliveryState==="follow_up"?"Follow-up required":review.deliveryState.charAt(0).toUpperCase()+review.deliveryState.slice(1);
 const sections=[...Object.entries(review.focusFeedback??{}).map(([key,value])=>[COACHING_REVIEW_FOCUS[key as CoachingReviewFocus],value]),["Review",review.coachFeedback],["What went well",review.wentWell],["What needs work",review.needsWork],["Progress on previous focus",review.previousFocusAssessment],["Next focus",review.nextFocus]].filter(([,body])=>Boolean(body));
 const trades=snapshot.reviewTrades.filter(item=>item.reviewId===review.reviewId&&item.workflowState==="saved");
 const actions=snapshot.reviewActions.filter(item=>item.reviewId===review.reviewId);
 const hidden=<><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="relationshipId" type="hidden" value={review.relationshipId}/><input name="reviewId" type="hidden" value={review.reviewId}/></>;
 return <Box sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}>
  <Stack direction="row" spacing={1} sx={{justifyContent:"space-between",alignItems:"center"}}><Typography sx={{ fontWeight: 800 }}>{review.title}</Typography><Chip color={review.deliveryState==="completed"?"success":review.deliveryState==="follow_up"?"warning":"info"} label={status}/></Stack>
  <CoachingReviewCapResolution communitySlug={snapshot.community.slug} review={review} coach={false} disabled={disabled}/>
  <CoachingReviewGoals communitySlug={snapshot.community.slug} review={review} student disabled={disabled}/>
  <StudentReviewExistingDays communitySlug={snapshot.community.slug} review={review} disabled={disabled}/>
  <StudentReviewExistingTrades communitySlug={snapshot.community.slug} review={review} disabled={disabled}/>
  {delivered?<Stack spacing={2} sx={{mt:2}}>{review.deliveryCoverage&&review.deliveryCoverage.shortfall>0?<Typography>{review.deliveryCoverage.reviewedCount} of {review.deliveryCoverage.agreedCount} agreed trade reviews completed. Only {review.deliveryCoverage.availableCount} eligible shared trades were available when this review was sent.</Typography>:null}
   {review.deliveryCoverage?.dayCoverage?<Typography>{review.deliveryCoverage.dayCoverage.reviewedDays} of {review.deliveryCoverage.dayCoverage.agreedDays} trading days reviewed · {review.deliveryCoverage.dayCoverage.reviewedTrades} individual trades reviewed.{review.deliveryCoverage.dayCoverage.shortfallDays>0?` Only ${review.deliveryCoverage.dayCoverage.availableDays} shared trading days were available.`:""}{review.deliveryCoverage.dayCoverage.shortfallTrades>0?` ${review.deliveryCoverage.dayCoverage.shortfallTrades} fewer eligible trades were available within the agreed cap.`:""}</Typography>:null}
   {review.dayAssessments?.map(day=><Box key={day.date}><Typography sx={{fontWeight:800}}>Trading day {day.date}</Typography><Typography sx={{whiteSpace:"pre-wrap"}}>{day.assessment}</Typography>{Object.entries(day.focusFeedback).map(([focus,feedback])=><Box key={focus}><Typography sx={{fontWeight:700}}>{COACHING_REVIEW_FOCUS[focus as keyof typeof COACHING_REVIEW_FOCUS]}</Typography><Typography sx={{whiteSpace:"pre-wrap"}}>{feedback}</Typography></Box>)}</Box>)}
   {trades.map((trade,index)=><Box key={trade.roundTripId}><Typography sx={{ fontWeight: 800 }}>{trade.tradeLabel||`Trade review ${index+1}`}</Typography><Typography sx={{whiteSpace:"pre-wrap"}} variant="body2">{coachingTradeFeedbackText(trade.coachFeedback)}</Typography></Box>)}
   {sections.map(([title,body])=><Box key={title}><Typography sx={{ fontWeight: 800 }}>{title}</Typography><Typography sx={{whiteSpace:"pre-wrap"}} variant="body2">{body}</Typography></Box>)}
   {snapshot.coachingAttachments.filter(image=>image.targetId===review.reviewId&&(!image.roundTripId||trades.some(trade=>trade.roundTripId===image.roundTripId))).map(image=><Box key={image.attachmentId}><Box alt={image.filename} component="img" src={image.href} sx={{display:"block",maxWidth:"100%",maxHeight:480,borderRadius:1}}/></Box>)}
   {actions.length?<Box><Typography sx={{ fontWeight: 800 }}>Your actions</Typography><Stack spacing={1}>{actions.map(item=><Box key={item.actionId}><Typography>{item.title}</Typography>{item.details?<Typography variant="body2">{item.details}</Typography>:null}{item.dueAtUtc?<Typography variant="caption">Due {new Date(item.dueAtUtc).toLocaleDateString("en-US",{timeZone:"UTC"})} UTC</Typography>:null}<Box action={disabled?undefined:updateCommunityReviewActionItemAction} component="form" data-coaching-action-only="true">{hidden}<input name="actionId" type="hidden" value={item.actionId}/><input name="state" type="hidden" value={item.status==="completed"?"open":"completed"}/><Button disabled={disabled} type="submit">{item.status==="completed"?"Completed · Reopen":"Mark complete"}</Button></Box></Box>)}</Stack></Box>:null}
   {review.deliveryState==="delivered"?<Box action={disabled?undefined:markCommunityReviewViewedAction} component="form" data-coaching-action-only="true">{hidden}<Button disabled={disabled} type="submit" variant="contained">I have read this review</Button></Box>:null}
   {review.viewedAtUtc?<Typography color="text.secondary" variant="caption">Read {new Date(review.viewedAtUtc).toLocaleDateString("en-US",{timeZone:"UTC"})} UTC</Typography>:null}
   {review.followUpDueAtUtc&&review.deliveryState==="follow_up"?<Typography>Follow-up due {new Date(review.followUpDueAtUtc).toLocaleDateString("en-US",{timeZone:"UTC"})} UTC</Typography>:null}
   {snapshot.reviewReplies.filter(reply=>reply.reviewId===review.reviewId).map(reply=><Box key={reply.replyId}><Typography variant="body2" sx={{ fontWeight: 700 }}>{reply.authorName}</Typography><Typography sx={{whiteSpace:"pre-wrap"}} variant="body2">{reply.body}</Typography></Box>)}
   {messagingEnabled&&!paused&&review.followUpProblem&&!["completed","cancelled"].includes(review.deliveryState)?<Typography color="text.secondary">{review.followUpProblem}</Typography>:null}
   {messagingEnabled&&!paused&&!review.followUpProblem&&!["completed","cancelled"].includes(review.deliveryState)?<Box action={disabled?undefined:replyCommunityReviewAction} component="form">{hidden}<Stack direction="row" spacing={1}><TextField fullWidth label="Question or reply" multiline name="body" required/><Button disabled={disabled} type="submit">Send</Button></Stack></Box>:null}
  </Stack>:review.studentContext?<Typography sx={{mt:1}} variant="body2">{review.studentContext}</Typography>:null}
 </Box>;
}
