import {Stack} from "@mui/material";
import {CommunityTypography as Typography} from "./community-typography";
import {coachingPlanPriceLabel} from "@/src/modules/communities/contracts/coaching-plan-presentation";
import {coachingRequiredAccess,COACHING_ACCESS_LABELS} from "@/src/modules/communities/contracts/coaching-required-access";
import type {TraderLinkCommunityCoachingPlan} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import type {CoachingAgreement} from "@/src/modules/communities/contracts/coaching-agreements";
import {PLAN_OFFERS} from "./coaching-plan-offers";

export function CoachingEnrollmentTerms({plan,agreement}:{plan:TraderLinkCommunityCoachingPlan|null;agreement?:CoachingAgreement|null}){
 if(!plan&&!agreement)return <Typography color="warning.main" variant="body2">This plan is no longer available. Check its terms before accepting this request.</Typography>;
 const terms=agreement?.terms??plan!;
 const access=coachingRequiredAccess(terms.items,terms.builderConfig);
 return <Stack spacing={0.5}>
  <Typography variant="body2">{agreement?`${agreement.terms.currency} ${(agreement.terms.priceAmountMinor/100).toFixed(2)}`:coachingPlanPriceLabel(plan!)} · {terms.billingCadence.replaceAll("_"," ")}</Typography>
  {terms.description?<Typography variant="body2">{terms.description}</Typography>:null}
  <Typography variant="body2">Included: {terms.items.map(item=>{const label=PLAN_OFFERS.find(offer=>offer.type===item.itemType)?.label??item.itemType.replaceAll("_"," ");const unit=item.quantity===1&&item.measurementKind==="trades"?"trade":item.measurementKind.replaceAll("_"," ");return `${label} · ${item.quantity} ${unit}`}).join("; ")||"No services listed"}</Typography>
  <Typography variant="body2">Required Journal access: {access.map(scope=>COACHING_ACCESS_LABELS[scope]??scope).join(" · ")||"None"}</Typography>
  <Typography color="text.secondary" variant="caption">{agreement?"Proposed agreement terms.":"Current plan terms; the agreement can set final terms."} The student confirms the agreement and required sharing after enrollment.</Typography>
 </Stack>;
}
