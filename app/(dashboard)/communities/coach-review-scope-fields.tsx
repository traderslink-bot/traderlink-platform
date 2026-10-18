"use client";
import {useState} from "react";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import {CommunityTypography as Typography} from "./community-typography";
import {coachingServiceFocus,COACHING_REVIEW_TYPES,COACHING_REVIEW_FOCUS,reviewKindForPlanItem,type CoachingReviewKind,type CoachingReviewFocus} from "@/src/modules/communities/contracts/coaching-review-workspace";
import type {TraderLinkCommunityCoachingPlanItem} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";

export function CoachReviewScopeFields({initialKind=null,initialFocus=[],periodStart=null,periodEnd=null,items=[]}:{initialKind?:CoachingReviewKind|null;initialFocus?:readonly CoachingReviewFocus[];periodStart?:string|null;periodEnd?:string|null;items?:readonly TraderLinkCommunityCoachingPlanItem[]}){
 const [kind,setKind]=useState<CoachingReviewKind|"">(initialKind??"");
 const [focus,setFocus]=useState<readonly CoachingReviewFocus[]>(initialFocus);
 const [itemId,setItemId]=useState("");
 const reviewItems=items.filter(item=>reviewKindForPlanItem(item.itemType)&&reviewKindForPlanItem(item.itemType)!=="custom");
 return <Stack spacing={2}>
  {reviewItems.length?<TextField label="Accepted plan service" name="planItemId" required select value={itemId} onChange={event=>{const item=reviewItems.find(value=>value.planItemId===event.target.value);setItemId(event.target.value);if(item){setKind(reviewKindForPlanItem(item.itemType)!);setFocus(coachingServiceFocus(item));}}}><MenuItem value="">Choose the agreed service</MenuItem>{reviewItems.map(item=><MenuItem key={item.planItemId} value={item.planItemId}>{COACHING_REVIEW_TYPES[reviewKindForPlanItem(item.itemType)!]} · {item.quantity} {item.measurementKind.replaceAll('_',' ')}</MenuItem>)}</TextField>:<Typography>Accept a coaching agreement before creating a review.</Typography>}
  <input name="workspaceKind" type="hidden" value={kind}/><input name="reviewType" type="hidden" value={kind==='trade'?'multiple_trades':kind==='trading_day'?'session':'custom'}/>
  {kind?<Typography>{COACHING_REVIEW_TYPES[kind]}{focus.length?` · ${focus.map(key=>COACHING_REVIEW_FOCUS[key]).join(' · ')}`:''}</Typography>:null}
  <Grid container spacing={1}><Grid size={{xs:12,sm:6}}><TextField defaultValue={periodStart??''} fullWidth label="Review from" name="periodStart" required={kind==='trading_day'||kind==='performance'||kind==='strategy'||(kind==='trade'&&reviewItems.find(item=>item.planItemId===itemId)?.coveragePeriod!=='single_item')} slotProps={{inputLabel:{shrink:true}}} type="date"/></Grid><Grid size={{xs:12,sm:6}}><TextField defaultValue={periodEnd??''} fullWidth label="Review through" name="periodEnd" required={kind==='trading_day'||kind==='performance'||kind==='strategy'||(kind==='trade'&&reviewItems.find(item=>item.planItemId===itemId)?.coveragePeriod!=='single_item')} slotProps={{inputLabel:{shrink:true}}} type="date"/></Grid></Grid>
 </Stack>;
}
