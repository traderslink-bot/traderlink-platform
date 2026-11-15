import {Box,Stack} from "@mui/material";
import {CommunityTypography as Typography} from "./community-typography";
import {coachingPlanPriceLabel} from "@/src/modules/communities/contracts/coaching-plan-presentation";
import type {TraderLinkCommunityCoachingPlan} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import type {CoachingAgreement} from "@/src/modules/communities/contracts/coaching-agreements";
import {coachingReviewDeadlineSentence} from "@/src/modules/communities/contracts/coaching-review-deadline-copy";
import {PLAN_OFFERS} from "./coaching-plan-offers";

function serviceQuantity(item:TraderLinkCommunityCoachingPlan["items"][number]){
 const singular:Record<string,string>={trades:"trade",trading_days:"trading day",reviews:"review",check_ins:"check-in",sessions:"session",lessons:"lesson",questions:"question",custom:"service item"};
 const unit=item.quantity===1?(singular[item.measurementKind]??item.measurementKind):item.measurementKind.replaceAll("_"," ");
 if(item.itemType==="trade_review")return `The coach reviews ${item.quantity} ${unit} in each review.`;
 if(item.itemType==="trading_day_review")return `The coach reviews ${item.quantity} ${unit} in each review.`;
 if(item.itemType==="performance_review")return "The coach reviews the student’s performance for the agreed review period.";
 return `This plan includes ${item.quantity} ${unit}.`;
}

export function CoachingEnrollmentTerms({plan,agreement}:{plan:TraderLinkCommunityCoachingPlan|null;agreement?:CoachingAgreement|null}){
 if(!plan&&!agreement)return <Typography color="warning.main" variant="body2">This plan is no longer available. Check its terms before accepting this request.</Typography>;
 const terms=agreement?.terms??plan!;
 return <Stack spacing={0.5}>
  <Typography sx={{fontWeight:700}} variant="body2">Plan price</Typography>
  <Typography variant="body2">{agreement?`${agreement.terms.currency} ${(agreement.terms.priceAmountMinor/100).toFixed(2)}`:coachingPlanPriceLabel(plan!)} · {terms.billingCadence.replaceAll("_"," ")}</Typography>
  {terms.description?<Typography variant="body2">{terms.description}</Typography>:null}
  <Typography sx={{fontWeight:700,pt:1}} variant="body2">Included services</Typography>
  {terms.items.length?terms.items.map(item=>{const label=PLAN_OFFERS.find(offer=>offer.type===item.itemType)?.label??item.itemType.replaceAll("_"," ");return <Box key={item.planItemId} sx={{borderLeft:3,borderColor:"divider",pl:1.5,py:.5}}><Typography sx={{fontWeight:700}} variant="body2">{label}</Typography><Typography variant="body2">{serviceQuantity(item)}</Typography>{item.itemType.endsWith("_review")?<Typography variant="body2"><strong>Review deadline:</strong> {coachingReviewDeadlineSentence(item,terms.builderConfig?.offers[item.itemType]?.deliveryDayCount,terms.builderConfig?.offers[item.itemType]?.submissionSchedule)}</Typography>:null}</Box>}):<Typography variant="body2">No services listed.</Typography>}
  <Typography color="text.secondary" sx={{pt:1}} variant="caption">The student requested this plan. Accept the enrollment to prepare the start and payment details. The student reviews and accepts the agreement before coaching begins.</Typography>
 </Stack>;
}
