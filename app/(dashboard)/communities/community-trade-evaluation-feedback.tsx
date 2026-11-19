'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {TradeEvaluationFields} from '@/app/(member)/coaching/trade-evaluation-fields';
import type {TradeEvaluationTemplate} from '@/src/modules/communities/contracts/coaching-trade-evaluation';
import {coachingTradeFeedbackText,readCoachingTradeFeedback,writeCoachingTradeFeedback} from '@/src/modules/communities/contracts/coaching-trade-feedback';

export function CommunityTradeEvaluationFeedback({value,template,readOnly=false,onChange,subject='trade'}:{subject?:'trade'|'performance';value:string;template:TradeEvaluationTemplate;readOnly?:boolean;onChange?:(value:string)=>void}){
 const feedback=readCoachingTradeFeedback(value);
 if(readOnly&&!feedback.evaluation)return <Typography sx={{whiteSpace:'pre-wrap'}}>{coachingTradeFeedbackText(value)}</Typography>;
 return <Box>
  {!readOnly&&feedback.summary?<Box component="details" sx={{mb:2}}><Box component="summary">Earlier written feedback</Box><Typography sx={{whiteSpace:'pre-wrap'}}>{feedback.summary}</Typography></Box>:null}
  <TradeEvaluationFields subject={subject} template={template} readOnly={readOnly} value={feedback.evaluation??{templateVersion:template.version,answers:{},whatWorked:'',whatToImprove:'',nextAction:''}} onChange={evaluation=>onChange?.(writeCoachingTradeFeedback({...feedback,evaluation}))}/>
 </Box>;
}
