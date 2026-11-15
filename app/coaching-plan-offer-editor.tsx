"use client";
import {CoachingTradingDayReviewSetup} from '@/app/coaching-trading-day-review-setup';
import {CoachingTradeReviewSetup} from '@/app/coaching-trade-review-setup';

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import {CommunityTypography as Typography} from "@/app/(dashboard)/communities/community-typography";
import {PERFORMANCE_INCLUSIONS, FREQUENCIES, PERIODS, offerColor, type Offer, type OfferSettings} from "@/app/(dashboard)/communities/coaching-plan-offers";

export function CoachingPlanOfferEditor({offer, value, onChange, onRemove, hideReviewFocus=false,embedded=false}:{
  hideReviewFocus?:boolean; embedded?:boolean; offer:Offer; value:OfferSettings; onChange:(patch:Partial<OfferSettings>)=>void; onRemove:()=>void;
}) {
  const focusToggle = (key:OfferSettings["focus"][number]) => onChange({focus:value.focus.includes(key)?value.focus.filter(item=>item!==key):[...value.focus,key]});
  const isReview = offer.group==="Reviews";
  return <Box id={`coach-plan-service-${offer.type}`} role="region" aria-label={`${offer.label} options`} tabIndex={-1} sx={theme => ({scrollMarginTop:96, "&:focus-visible":{outline:`3px solid ${theme.palette.primary.main}`,outlineOffset:2}, border:1, borderColor:"divider", borderTop:4, borderTopColor:offerColor(offer,theme.palette.mode), borderRadius:2, p:{xs:2,sm:2.5}})}>
    <Stack direction="row" sx={{justifyContent:"space-between", alignItems:"center", mb:2}}>
      <Typography component="h3" variant="h3">{offer.label}</Typography>
      <Button data-coaching-edit type="button" size="small" color="error" onClick={onRemove} aria-label={"Remove "+offer.label}>Remove</Button>
    </Stack>
    <Stack spacing={2}>
      {isReview&&!hideReviewFocus ? <Box>
        <Typography sx={{ fontWeight: 700 }}>Review focus</Typography>
        {offer.type==="performance_review"?<Chip label="Performance results and comparisons" size="small" color="success" sx={{my:1}}/>:null}
        <Grid container>{PERFORMANCE_INCLUSIONS.map(item=><Grid key={item.key} size={{xs:12,sm:6}}><FormControlLabel label={item.label} control={<Checkbox checked={value.focus.includes(item.key)} onChange={()=>focusToggle(item.key)}/>}/></Grid>)}</Grid>
      </Box> : null}
      {offer.type==='trade_review'?<CoachingTradeReviewSetup value={value} onChange={onChange}/>:null}
      {offer.type==='trading_day_review'?<CoachingTradingDayReviewSetup value={value} onChange={onChange}/>:null}
      {isReview&&!["trade_review","trading_day_review"].includes(offer.type)?<Box sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}><TextField fullWidth select label="Review schedule" value={value.timeline?'scheduled':'on_request'} onChange={event=>onChange({timeline:event.target.value==='scheduled'})}><MenuItem value="scheduled">Scheduled reviews</MenuItem><MenuItem value="on_request">Review on request</MenuItem></TextField><Typography variant="body2" color="text.secondary" sx={{mt:1}}>{value.timeline?'Review the work after the period ends. “Deliver within” sets how many days you have after that period to finish.':'When the student sends you work, “Deliver within” sets how many days you have to finish reviewing it.'}</Typography></Box>:null}
      {offer.type==="custom_task" ? <FormControlLabel label="Add a schedule" control={<Checkbox checked={value.timeline} onChange={event=>onChange({timeline:event.target.checked})}/>}/> : null}
      {offer.count && !["trade_review","trading_day_review"].includes(offer.type) ? <TextField fullWidth required label={offer.count} type="number" value={value.quantity} onChange={event=>onChange({quantity:event.target.value})} slotProps={{htmlInput:{min:1,step:1}}}/> : null}
      {!["trade_review","trading_day_review"].includes(offer.type)&&(value.timeline||isReview) ? <Grid container spacing={2}>
        {value.timeline?<Grid size={{xs:12,sm:6}}><TextField fullWidth label={offer.type==="questions"||!value.timeline?"Allowance renews":"How often"} select value={value.frequency} onChange={event=>onChange({frequency:event.target.value as OfferSettings["frequency"]})}>{Object.entries(FREQUENCIES).filter(([key])=>value.timeline||key!=="custom").map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField></Grid>:null}
        {offer.period&&value.timeline ? <Grid size={{xs:12,sm:6}}><TextField fullWidth label="Period covered" select value={value.coverage} onChange={event=>onChange({coverage:event.target.value as OfferSettings["coverage"]})}>{Object.entries(PERIODS).filter(([key])=>key!=="single_item"||Boolean(offer.count)).map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField></Grid> : null}
        <Grid size={{xs:12,sm:6}}><TextField fullWidth required={isReview} helperText={isReview?(value.timeline?"Calendar days after the scheduled period ends. Submission does not change the deadline.":"Calendar days after submission. Each day is 24 hours."):undefined} label={offer.type==="questions"?"Reply within (days)":"Deliver within (days)"} type="number" value={value.dueDays} onChange={event=>onChange({dueDays:event.target.value})} slotProps={{htmlInput:{min:isReview?1:0,max:isReview?366:undefined,step:1}}}/></Grid>
        {!isReview && offer.type!=="questions" ? <Grid size={{xs:12,sm:6}}><TextField fullWidth label="Session length (minutes)" type="number" value={value.minutes} onChange={event=>onChange({minutes:event.target.value})} slotProps={{htmlInput:{min:1,step:1}}}/></Grid> : null}
      </Grid> : null}
      {offer.type==="review_follow_up"?<TextField fullWidth required label="Follow-up period (days)" type="number" value={value.followUpDays} onChange={event=>onChange({followUpDays:event.target.value})} slotProps={{htmlInput:{min:1,max:30,step:1}}}/>:null}
      {isReview&&!hideReviewFocus ? <Typography color="text.secondary" variant="body2">Required Journal access follows this review and its focus areas. The student sees the requirements before agreeing and grants access to their account.</Typography> : null}
      {["strategy_review","group_lesson","custom_task"].includes(offer.type)?<TextField fullWidth multiline minRows={2} required={offer.type==="custom_task"} label={offer.type==="strategy_review"?"Strategy / setup and feedback":offer.type==="group_lesson"?"Lesson topics and delivery":"What you offer"} value={value.details} onChange={event=>onChange({details:event.target.value})} slotProps={{htmlInput:{maxLength:1000}}}/>:null}
      {isReview&&!embedded?<CoachingReviewFollowUp value={value} onChange={onChange}/>:null}
    </Stack>
  </Box>;
}

export function CoachingReviewFollowUp({value,onChange}:{value:OfferSettings;onChange:(patch:Partial<OfferSettings>)=>void}){
 return <Box sx={{border:1,borderColor:"divider",borderRadius:2,p:2,bgcolor:"background.paper"}}>
        <FormControlLabel label="Include review follow-up" control={<Checkbox checked={value.followUpEnabled} onChange={event=>onChange({followUpEnabled:event.target.checked})}/>}/>
        <Typography color="text.secondary" variant="body2" sx={{mb:value.followUpEnabled?1.5:0}}>Let the student ask follow-up questions about this completed review for a limited time.</Typography>
        {value.followUpEnabled?<TextField fullWidth required label="Follow-up period (days)" type="number" value={value.followUpDays} onChange={event=>onChange({followUpDays:event.target.value})} slotProps={{htmlInput:{min:1,max:30,step:1}}}/>:null}
      </Box>;
}
