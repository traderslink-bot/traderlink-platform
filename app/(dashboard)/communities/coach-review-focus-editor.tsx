import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import {CommunityTypography as Typography} from "./community-typography";
import {DashboardPanel} from "@/app/dashboard-ui";
import {COACHING_REVIEW_FOCUS,type CoachingReviewFocus} from "@/src/modules/communities/contracts/coaching-review-workspace";
import type {TraderLinkCommunityTradeReview} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import type {TraderLinkCommunityCoachJournalReadService} from "@/src/modules/communities/server/traderlink-community-coach-journal-read-service";
import {saveCommunityReviewFocusAction} from "./community-actions";

type Context=ReturnType<TraderLinkCommunityCoachJournalReadService["readReviewContext"]>;
export function CoachReviewFocusEditor({communitySlug,relationshipId,review,context,disabled}:{communitySlug:string;relationshipId:string;review:TraderLinkCommunityTradeReview;context:Context|null;disabled:boolean}){
 const focus=([...new Set([...(review.focusAreas??[]),...Object.keys(review.focusFeedback??{})])] as CoachingReviewFocus[]).filter(key=>!["overall","next_steps"].includes(key));
 return <Stack spacing={2}>
  {review.workspaceKind==="performance"?<DashboardPanel title="Performance"><Stack spacing={1}>{context?.metrics.length?context.metrics.map(row=><Box key={row.currency}><Typography fontWeight={700}>{row.currency} · {row.closedTrades} closed trades</Typography><Typography>{row.basis}: {row.pnl===null?"Unavailable":Number(row.pnl).toLocaleString("en-US",{maximumFractionDigits:2})} · {row.winners} winners · {row.losers} losers</Typography>{context.previous?.find(prior=>prior.currency===row.currency)?<Typography variant="body2">Previous period: {context.previous.filter(prior=>prior.currency===row.currency).map(prior=>`${prior.closedTrades} closed trades · ${prior.basis}: ${prior.pnl===null?"Unavailable":Number(prior.pnl).toLocaleString("en-US",{maximumFractionDigits:2})}`).join("")}</Typography>:null}</Box>):<Typography>Performance data unavailable</Typography>}{context?<Typography variant="caption">Coverage: {context.coverage}</Typography>:null}</Stack></DashboardPanel>:null}
  {focus.length?<Box component="form" action={disabled?undefined:saveCommunityReviewFocusAction}><input type="hidden" name="communitySlug" value={communitySlug}/><input type="hidden" name="relationshipId" value={relationshipId}/><input type="hidden" name="reviewId" value={review.reviewId}/><Stack spacing={2}>
   {focus.map(key=><DashboardPanel key={key} title={COACHING_REVIEW_FOCUS[key]}><Stack spacing={1.5}>
    {key==="rules"?(context?.rulesAllowed?<Stack spacing={1}>{context.rules.length?context.rules.map((rule,index)=><Box key={`${rule.title}-${index}`}><Typography fontWeight={700}>{rule.title}</Typography><Typography variant="body2">Broken: {rule.broken} · Followed: {rule.followed} · Not reviewed: {rule.notReviewed}</Typography></Box>):<Typography>No recorded rule results</Typography>}</Stack>:<Typography>Trade rule data not shared</Typography>):null}
    {key==="journal"?(context&&(context.notesAllowed||context.tagsAllowed||context.dayNotesAllowed)?<Stack spacing={1}>{context.journal.map(item=><Box key={item.roundTripId}><Typography fontWeight={700}>{item.symbol} · {item.date}</Typography>{item.tradeNote?<Typography sx={{whiteSpace:"pre-wrap"}}>{item.tradeNote}</Typography>:null}{item.technicalNote?<Typography sx={{whiteSpace:"pre-wrap"}}>{item.technicalNote}</Typography>:null}{item.tags.length?<Typography variant="body2">{item.tags.join(" · ")}</Typography>:null}</Box>)}{context.dayNotes.map(item=><Box key={item.date}><Typography fontWeight={700}>{item.date}</Typography>{[item.whatWorked,item.whatNeedsWork,item.technicalRecap,item.tomorrowsFocus,item.anythingElse].filter(Boolean).map((text,index)=><Typography key={index} sx={{whiteSpace:"pre-wrap"}}>{text}</Typography>)}</Box>)}</Stack>:<Typography>Journal data not shared</Typography>):null}
    {key==="rules"&&context?.dayRulesAllowed?<Stack spacing={1}>{context.dayRules.map((rule,index)=><Box key={`${rule.date}-${index}`}><Typography fontWeight={700}>{rule.date} · {rule.title}</Typography><Typography variant="body2">{rule.status==="not_reviewed"?"Not reviewed":rule.status==="followed"?"Followed":"Broken"}</Typography>{rule.note?<Typography sx={{whiteSpace:"pre-wrap"}}>{rule.note}</Typography>:null}</Box>)}</Stack>:null}
    <TextField disabled={disabled} fullWidth multiline minRows={3} label={`${COACHING_REVIEW_FOCUS[key]} feedback`} name={`focusFeedback:${key}`} defaultValue={review.focusFeedback?.[key]??""}/>
   </Stack></DashboardPanel>)}
   <Button disabled={disabled} type="submit" variant="contained" sx={{alignSelf:"flex-end"}}>Save feedback</Button>
  </Stack></Box>:null}
 </Stack>;
}
