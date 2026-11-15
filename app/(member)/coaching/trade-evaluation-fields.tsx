"use client";
import {type ReactNode} from 'react';
import CheckRounded from '@mui/icons-material/CheckRounded';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {WrittenFeedbackFields} from './written-feedback-fields';
import {tradeWrittenFields,tradeCriterionLevels,type TradeEvaluation,type TradeEvaluationTemplate} from '@/src/modules/communities/contracts/coaching-trade-evaluation';
export function formatTradeEvaluationResponse(value:string|number|null|undefined,kind:'rating'|'yes_no'|'written'):string{
 if(value===null||value===undefined||value==='')return 'Not recorded';
 if(kind==='written')return String(value);
 if(kind==='rating'&&typeof value==='number')return `${value} / 5`;
 return ({yes:'Yes',no:'No',not_assessed:'Not assessed',insufficient_information:'Insufficient information'} as Record<string,string>)[String(value)]??String(value);
}
/** Accepted criteria and whole-trade feedback share one value and save operation. */
export function TradeEvaluationFields({template,value,onChange,readOnly=false,focused=false,feedbackExtras,subject='trade'}:{subject?:'trade'|'performance';feedbackExtras?:ReactNode;template:TradeEvaluationTemplate;value:TradeEvaluation;onChange?:(value:TradeEvaluation)=>void;readOnly?:boolean;focused?:boolean}){
 const answer=(criterionId:string,next:string|number)=>{const answers={...value.answers};if(next==='')delete answers[criterionId];else answers[criterionId]=next;onChange?.({...value,answers});};
 const ratings=template.criteria.filter(c=>c.kind==='rating'),extra=template.criteria.filter(c=>c.kind!=='rating');
 return <Box>
  <Grid container spacing={3}>
   <Grid size={{xs:12,lg:focused?12:6}}>
    <Stack spacing={1}>
     <Typography component="h3" variant="h3">Evaluation</Typography>

     {ratings.map(criterion=>{
      const selected=value.answers[criterion.id],levels=tradeCriterionLevels(template,criterion);
      return <Box key={criterion.id} sx={{py:2,borderBottom:1,borderColor:'divider',containerType:'inline-size'}}>
       <Typography sx={{fontWeight:600}}>{criterion.name}</Typography>
       {readOnly?<Typography variant="body2" sx={{mt:1}}>{typeof selected==='number'?`${selected} / 5`:formatTradeEvaluationResponse(selected,'rating')}</Typography>:<>
        <Stack direction="column" sx={{gap:2,alignItems:'flex-start','@container (min-width: 440px)':{flexDirection:'row',alignItems:'center'}}}><ToggleButtonGroup exclusive value={typeof selected==='number'?selected:null} aria-label={`${criterion.name} rating`} onChange={(_,next:number|null)=>{if(next!==null)answer(criterion.id,next);}} sx={{flexWrap:'wrap',gap:.5,'& .MuiToggleButton-root':{minWidth:44,minHeight:44}}}>
         {levels.map((_,index)=><ToggleButton key={index} data-coaching-edit={selected===index+1?undefined:true} value={index+1} aria-label={`${criterion.name}: ${index+1} of 5`} sx={theme=>{const [fill,textColor]=[["#f1e7e3","#573f38"],["#dfcfc9","#513d35"],["#87c4a0","#153f2a"],["#2e8058","#ffffff"],["#145738","#ffffff"]][index],chosen=selected===index+1;return {bgcolor:fill,color:textColor,border:'2px solid',borderColor:chosen?theme.palette.text.primary:'transparent','&.Mui-selected,&.Mui-selected:hover,&:hover':{bgcolor:fill,color:textColor},'&.Mui-selected':{borderColor:theme.palette.text.primary,boxShadow:`inset 0 0 0 1px ${theme.palette.text.primary}`},'&.Mui-focusVisible':{outline:`3px solid ${theme.palette.primary.main}`,outlineOffset:2},'&.Mui-disabled':{bgcolor:fill,color:textColor,opacity:.55}};}}>{index+1}{selected===index+1?<CheckRounded aria-hidden sx={{fontSize:16,ml:.5}}/>:null}</ToggleButton>)}
        </ToggleButtonGroup>
        <TextField select size="small" label={`${criterion.name}: other response`} sx={{width:'100%',maxWidth:300,'@container (min-width: 440px)':{width:180,flex:'0 0 180px'}}} value={typeof selected==='string'?selected:''} slotProps={{select:{displayEmpty:true,renderValue:response=>response?formatTradeEvaluationResponse(String(response),'rating'):typeof selected==='number'?'Other response':'No rating selected'},inputLabel:{shrink:true}}} onChange={event=>answer(criterion.id,event.target.value)}>
         <MenuItem value="">No rating selected</MenuItem><MenuItem data-coaching-edit={selected==='not_assessed'?undefined:true} value="not_assessed">Not assessed</MenuItem><MenuItem data-coaching-edit={selected==='insufficient_information'?undefined:true} value="insufficient_information">Insufficient information</MenuItem>
        </TextField></Stack>
       </>}
      </Box>;
     })}
     {!ratings.length?<Typography variant="body2" color="text.secondary">This accepted template uses written or Yes/No questions in Feedback.</Typography>:null}
    </Stack>
   </Grid>
   <Grid size={{xs:12,lg:focused?12:6}}>
    <Stack spacing={2}>
     <Typography component="h3" variant="h3">{subject==='performance'?'Performance feedback':'Trade Feedback'}</Typography>

     <WrittenFeedbackFields template={template} value={value} onChange={onChange} readOnly={readOnly} subject={subject}/>
     {tradeWrittenFields(template).some(field=>field.id==='nextAction'&&field.enabled)?(!readOnly?<TextField select size="small" label="Related criterion for next action (optional)" value={value.actionCriterionId??''} onChange={event=>onChange?.({...value,actionCriterionId:event.target.value})}><MenuItem value="">{subject==='performance'?'Whole period — no specific criterion':'Whole trade — no specific criterion'}</MenuItem>{ratings.map(c=><MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</TextField>:value.actionCriterionId?<Typography variant="body2" color="text.secondary">Related criterion: {ratings.find(c=>c.id===value.actionCriterionId)?.name??'Recorded criterion'}</Typography>:null):null}
     {extra.map(criterion=>readOnly?<Box key={criterion.id}><Typography sx={{fontWeight:600}}>{criterion.name}</Typography><Typography variant="body2" color="text.secondary">{criterion.meaning}</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{formatTradeEvaluationResponse(value.answers[criterion.id],criterion.kind)}</Typography></Box>:criterion.kind==='written'?<TextField key={criterion.id} label={criterion.name} helperText={criterion.meaning} multiline minRows={2} value={value.answers[criterion.id]??''} onChange={event=>answer(criterion.id,event.target.value)} slotProps={{htmlInput:{maxLength:4000}}}/>:<TextField key={criterion.id} select label={criterion.name} helperText={criterion.meaning} value={value.answers[criterion.id]??''} onChange={event=>answer(criterion.id,event.target.value)}><MenuItem value="">Not recorded</MenuItem><MenuItem value="yes">Yes</MenuItem><MenuItem value="no">No</MenuItem><MenuItem value="not_assessed">Not assessed</MenuItem><MenuItem value="insufficient_information">Insufficient information</MenuItem></TextField>)}
     {feedbackExtras}
    </Stack>
   </Grid>
  </Grid>
 </Box>;
}
