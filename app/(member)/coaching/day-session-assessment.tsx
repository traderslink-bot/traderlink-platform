"use client";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {DAY_SESSION_FIELDS,type DaySessionReview} from '@/src/modules/communities/contracts/coaching-trading-day-evaluation';
import type {IndependentCoachingReviewDraft} from '@/src/modules/communities/contracts/independent-coaching';
import {useIndependentResourceLocation} from './resource-location';
export function DaySessionSetup(props:{value:DaySessionReview;onChange:(value:DaySessionReview)=>void}|Record<string,never>){
 void props;
 return <Box sx={{border:1,borderColor:'divider',borderRadius:2,p:{xs:2,sm:2.5},bgcolor:'background.paper'}}><Stack spacing={1}>
  <Typography component="h3" variant="h3">Day/session feedback</Typography>
  <Typography variant="body2" sx={{fontWeight:600}}>Overall day/session assessment · Required</Typography>
  <Typography variant="body2">Help the student understand the decisions that shaped their trading day.</Typography>
  <Typography variant="body2" color="text.secondary">Use any notes, tags, rules and trade analysis the student recorded.</Typography>
 </Stack></Box>;
}
export function DaySessionAssessment({date,config,draft,onChange,readOnly=false,reviewId}:{date:string;config:DaySessionReview;draft:IndependentCoachingReviewDraft;onChange?:(patch:Partial<IndependentCoachingReviewDraft>)=>void;readOnly?:boolean;reviewId?:string}){
 const location=useIndependentResourceLocation();
 return <Stack spacing={2}><Typography component="h3" variant="h3">Day/session assessment · {date}</Typography>{config.fields.filter(field=>field.enabled).map(field=>{const title=DAY_SESSION_FIELDS.find(item=>item.id===field.id)!.title,value=draft.daySessionFeedback?.[date]?.[field.id]??'';return <Box key={field.id}>{field.id==='rules'&&!readOnly&&reviewId?<Stack direction="row" sx={{gap:1,flexWrap:'wrap',mb:1}}><Button variant="outlined" onClick={()=>location.change({report:'student-rules',reportParams:JSON.stringify({ruleScope:'day'}),dayJournal:null,dayJournalDate:null,trade:null})}>Student day rules</Button><Button variant="outlined" onClick={()=>location.change({report:'rules',reportParams:JSON.stringify({day:date}),dayJournal:null,dayJournalDate:null,trade:null})}>Rules analytics · {date}</Button></Stack>:null}{readOnly?<><Typography sx={{fontWeight:600}}>{title}</Typography><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{value||'Not recorded'}</Typography></>:<TextField fullWidth label={`${title} (${field.required?'Required':'Optional'})`} helperText={value.length>4000?'Use 4,000 characters or fewer. Your text is kept until corrected.':field.guidance} error={value.length>4000} multiline minRows={3} value={value} onChange={event=>onChange?.({daySessionFeedback:{...draft.daySessionFeedback,[date]:{...draft.daySessionFeedback?.[date],[field.id]:event.target.value}}})}/>}</Box>;})}{readOnly?<Box><Typography sx={{fontWeight:600}}>Overall day/session assessment</Typography><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{draft.dayAssessments?.[date]||'Not recorded'}</Typography></Box>:<TextField label="Overall day/session assessment (Required)" multiline minRows={4} value={draft.dayAssessments?.[date]??''} error={(draft.dayAssessments?.[date]?.length??0)>20000} helperText={(draft.dayAssessments?.[date]?.length??0)>20000?'Use 20,000 characters or fewer.':undefined} onChange={event=>onChange?.({dayAssessments:{...draft.dayAssessments,[date]:event.target.value}})}/>}</Stack>;
}
