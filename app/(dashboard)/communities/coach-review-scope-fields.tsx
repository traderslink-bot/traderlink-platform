"use client";
import {useState} from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import {CommunityTypography as Typography} from "./community-typography";
import {COACHING_REVIEW_TYPES,COACHING_REVIEW_FOCUS,reviewKindForPlanItem,type CoachingReviewKind,type CoachingReviewFocus} from "@/src/modules/communities/contracts/coaching-review-workspace";
import type {TraderLinkCommunityCoachingPlanItem} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";

export function CoachReviewScopeFields({initialKind=null,initialFocus=[],periodStart=null,periodEnd=null,items=[]}:{initialKind?:CoachingReviewKind|null;initialFocus?:readonly CoachingReviewFocus[];periodStart?:string|null;periodEnd?:string|null;items?:readonly TraderLinkCommunityCoachingPlanItem[]}){
 const [kind,setKind]=useState<CoachingReviewKind|"">(initialKind??"");
 const [focus,setFocus]=useState<readonly CoachingReviewFocus[]>(initialFocus);
 const [itemId,setItemId]=useState("");
 const reviewItems=items.filter(item=>reviewKindForPlanItem(item.itemType));
 return <Stack spacing={2}>
  {reviewItems.length?<TextField label="Plan service" select value={itemId} onChange={event=>{const item=reviewItems.find(value=>value.planItemId===event.target.value);setItemId(event.target.value);if(item){setKind(reviewKindForPlanItem(item.itemType)!);setFocus(item.focusAreas??[]);}}}><MenuItem value="">Choose review scope</MenuItem>{reviewItems.map(item=><MenuItem key={item.planItemId} value={item.planItemId}>{COACHING_REVIEW_TYPES[reviewKindForPlanItem(item.itemType)!]}</MenuItem>)}</TextField>:null}
  <TextField fullWidth label="Review type" name="workspaceKind" required select value={kind} onChange={event=>setKind(event.target.value as CoachingReviewKind)}>{Object.entries(COACHING_REVIEW_TYPES).map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
  <input name="reviewType" type="hidden" value={kind==="trade"?"multiple_trades":kind==="trading_day"?"session":"custom"}/>
  <Grid container spacing={1}><Grid size={{xs:12,sm:6}}><TextField defaultValue={periodStart??""} fullWidth label="Review from" name="periodStart" required={kind==="trading_day"||kind==="performance"} slotProps={{inputLabel:{shrink:true}}} type="date"/></Grid><Grid size={{xs:12,sm:6}}><TextField defaultValue={periodEnd??""} fullWidth label="Review through" name="periodEnd" required={kind==="trading_day"||kind==="performance"} slotProps={{inputLabel:{shrink:true}}} type="date"/></Grid></Grid>
  <Box><Typography fontWeight={700}>Review focus</Typography><Stack direction="row" sx={{flexWrap:"wrap"}}>{Object.entries(COACHING_REVIEW_FOCUS).map(([value,label])=><FormControlLabel key={value} label={label} control={<Checkbox checked={focus.includes(value as CoachingReviewFocus)} name="focusArea" value={value} onChange={event=>setFocus(current=>event.target.checked?[...current,value as CoachingReviewFocus]:current.filter(item=>item!==value))}/>}/>)}</Stack></Box>
 </Stack>;
}
