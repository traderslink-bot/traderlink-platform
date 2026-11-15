"use client";
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import {useIndependentResourceLocation} from './resource-location';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {BUILTIN_WRITTEN_FIELDS,tradeWrittenAnswer,tradeWrittenFields,type TradeEvaluation,type TradeEvaluationTemplate} from '@/src/modules/communities/contracts/coaching-trade-evaluation';
/** Both delivered history and review editing use the actual accepted field definitions. */
export function WrittenFeedbackFields({template,value,onChange,readOnly=false,emptyLabel='Not recorded',subject='trade'}:{subject?:'trade'|'performance';template:TradeEvaluationTemplate;value:TradeEvaluation;onChange?:(value:TradeEvaluation)=>void;readOnly?:boolean;emptyLabel?:string}){
 const location=useIndependentResourceLocation();
 const fields=tradeWrittenFields(template).filter(field=>field.enabled),configured=Boolean(template.writtenFeedback);
 const total=tradeWrittenFields(template).reduce((sum,field)=>sum+tradeWrittenAnswer(value,field).length,0);
 return <>{fields.map(field=>{
  const answer=tradeWrittenAnswer(value,field),builtin=BUILTIN_WRITTEN_FIELDS.find(item=>item.id===field.id),limit=builtin?12000:4000;
  const controls=!readOnly&&field.id===template.reviewDesign?.rulesFieldId?<Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><Button variant="outlined" onClick={()=>location.change({report:'student-rules',reportParams:template.daySessionReview?JSON.stringify({ruleScope:'trade'}):'{}',dayJournal:null,dayJournalDate:null,trade:null,tradeAnalysis:null})}>Student rules</Button><Button variant="outlined" onClick={()=>location.change({report:'rules',reportParams:'{}',dayJournal:null,dayJournalDate:null,trade:null,tradeAnalysis:null})}>Rules analytics</Button></Stack>:null;
  return readOnly?<Box key={field.id}><Typography sx={{fontWeight:600}}>{field.title}</Typography>{field.guidance?<Typography variant="body2" color="text.secondary">{field.guidance}</Typography>:null}<Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{answer||emptyLabel}</Typography></Box>:<Box key={field.id}>{controls}<TextField fullWidth sx={controls?{mt:1}:undefined} label={configured?`${field.title} (${field.required?'Required':'Optional'})`:field.title} multiline minRows={3} value={answer} error={answer.length>limit} helperText={answer.length>limit?`Use ${limit.toLocaleString('en-US')} characters or fewer. Your text is kept until you edit it.`:field.guidance} onChange={event=>onChange?.(builtin?{...value,[builtin.id]:event.target.value}:{...value,writtenAnswers:{...value.writtenAnswers,[field.id]:event.target.value}})} slotProps={configured?undefined:{htmlInput:{maxLength:12000}}}/></Box>;
 })}{configured&&!readOnly&&total>36000?<Typography role="alert" color="error">Written feedback exceeds 36,000 characters for this {subject==='performance'?'period':'trade'}. Your text is kept; shorten it before saving.</Typography>:null}</>;
}
