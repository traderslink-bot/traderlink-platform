import {parsePerformanceEvaluation} from './coaching-performance-evaluation';
import {parseDaySessionFeedback} from './coaching-trading-day-evaluation';
import {parseTradeEvaluation,tradeEvaluationReady,usesTradeReviewDesign,type TradeEvaluationTemplate} from './coaching-trade-evaluation';
import {COACHING_REVIEW_FOCUS, type CoachingFocusFeedback,type CoachingReviewFocus} from './coaching-review-workspace';
import type {IndependentCoachingReviewDraft} from './independent-coaching';
import {coachingDate} from './coaching-agreements';

export const INDEPENDENT_REVIEW_STALE='This review changed in another tab or browser. Your changes weren’t saved and are still here. Copy them before reloading the latest saved version.';
export const INDEPENDENT_TRADE_STALE='This trade’s feedback changed in another tab or browser. Your changes weren’t saved and are still here. Copy them before reloading the latest saved version.';
export function isIndependentFeedbackFingerprint(value:unknown):value is string{return typeof value==='string'&&/^[0-9a-f]{64}$/.test(value);}
export function requireIndependentFeedbackFingerprint(value:unknown,trade=false):string{
 if(!isIndependentFeedbackFingerprint(value))throw new Error(trade?INDEPENDENT_TRADE_STALE:INDEPENDENT_REVIEW_STALE);return value;
}
export function independentTradeFeedbackCompleted(feedback:Record<string,unknown>,focus:readonly CoachingReviewFocus[],template?:TradeEvaluationTemplate):boolean{
 const areas=feedback.focusFeedback as Record<string,string>|undefined;
 return (template?tradeEvaluationReady(feedback.evaluation,template):feedback.evaluation===undefined&&typeof feedback.overall==='string'&&Boolean(feedback.overall.trim()))&&(usesTradeReviewDesign(template)?[]:focus.filter(key=>!['overall','next_steps','goals'].includes(key))).every(key=>Boolean(areas?.[key]?.trim()));
}
export function parseIndependentBulkFeedback(value:unknown):readonly {roundTripId:string;feedback:Record<string,unknown>;completed:boolean;expectedFingerprint:string}[]{
 if(!Array.isArray(value)||value.length>500)throw new Error('Check the trade feedback.');
 const ids=new Set<string>();
 return value.map(item=>{
  const raw=record(item);
  if(typeof raw.roundTripId!=='string'||!raw.roundTripId.trim()||raw.roundTripId.length>20000||ids.has(raw.roundTripId))throw new Error('Choose distinct selected trades.');
  ids.add(raw.roundTripId);
  if(typeof raw.completed!=='boolean')throw new Error('Choose a valid trade completion state.');
  return {roundTripId:raw.roundTripId,feedback:parseIndependentTradeFeedback(raw.feedback),completed:raw.completed,expectedFingerprint:requireIndependentFeedbackFingerprint(raw.expectedFingerprint,true)};
 });
}

function record(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Check the review feedback.');
 return value as Record<string,unknown>;
}
function note(value:unknown):string{
 if(typeof value!=='string'||value.length>20000)throw new Error('Check the review text.');
 return value;
}
function focus(value:unknown):CoachingFocusFeedback{
 const result:CoachingFocusFeedback={};
 for(const [key,text] of Object.entries(record(value))){
  if(!Object.hasOwn(COACHING_REVIEW_FOCUS,key))throw new Error('Choose a valid review focus.');
  result[key as keyof CoachingFocusFeedback]=note(text);
 }
 return result;
}
/** Whitelist saved and delivered fields; never serialize arbitrary posted objects. */
export function parseIndependentReviewDraft(value:unknown):IndependentCoachingReviewDraft{
 const raw=record(value),result:Record<string,unknown>={};
 const keys=new Set(['overall','nextSteps','privateNotes','goals','focusFeedback','dayAssessments','daySessionFeedback','performanceEvaluation']);
 for(const [key,text] of Object.entries(raw)){
  if(!keys.has(key))throw new Error('Unknown review feedback field.');
  if(key==='performanceEvaluation')result[key]=parsePerformanceEvaluation(text);
  else if(key==='daySessionFeedback')result[key]=parseDaySessionFeedback(text);
  else if(key==='focusFeedback')result[key]=focus(text);
  else if(key==='dayAssessments'){
   const days:Record<string,string>={};
   for(const [day,assessment] of Object.entries(record(text))){coachingDate(day);days[day]=note(assessment);}
   result[key]=days;
  }else result[key]=note(text);
 }
 if(JSON.stringify(result).length>65536)throw new Error('Review text is too large.');
 return result as IndependentCoachingReviewDraft;
}
export function parseIndependentTradeFeedback(value:unknown):Record<string,unknown>{
 const raw=record(value),{evaluation,...legacy}=raw;
 const parsed=parseIndependentReviewDraft(legacy);
 if(parsed.privateNotes!==undefined||parsed.dayAssessments!==undefined||parsed.daySessionFeedback!==undefined||parsed.performanceEvaluation!==undefined)throw new Error('Keep private notes and day assessments in the review.');
 const result={...parsed,...(evaluation===undefined?{}:{evaluation:parseTradeEvaluation(evaluation)})};
 if(JSON.stringify(result).length>65536)throw new Error('Trade feedback is too large.');
 return result;
}
