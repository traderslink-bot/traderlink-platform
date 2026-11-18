import {COACHING_REVIEW_FOCUS,type CoachingFocusFeedback,type CoachingReviewFocus} from "./coaching-review-workspace";
import {BUILTIN_WRITTEN_FIELDS,parseTradeEvaluation,validateTradeEvaluation,tradeEvaluationReady,tradeWrittenFields,tradeWrittenAnswer,usesTradeReviewDesign,type TradeEvaluation,type TradeEvaluationTemplate} from './coaching-trade-evaluation';
const FORMAT='coaching-trade-feedback/v1';
export type CoachingTradeFeedback={summary:string;focus:CoachingFocusFeedback;evaluation?:TradeEvaluation};
export function readCoachingTradeFeedback(text:string):CoachingTradeFeedback{
 try{const value=JSON.parse(text) as {format?:unknown;summary?:unknown;focus?:unknown;evaluation?:unknown};if(value?.format===FORMAT&&typeof value.summary==='string'&&value.focus&&typeof value.focus==='object'&&!Array.isArray(value.focus)){
  const focus:CoachingFocusFeedback={};for(const [key,text] of Object.entries(value.focus))if(Object.hasOwn(COACHING_REVIEW_FOCUS,key)&&typeof text==='string')focus[key as CoachingReviewFocus]=text;return {summary:value.summary,focus,...(value.evaluation===undefined?{}:{evaluation:parseTradeEvaluation(value.evaluation)})};
 }}catch{}return {summary:text,focus:{}};
}
export function writeCoachingTradeFeedback(value:CoachingTradeFeedback):string{return JSON.stringify({format:FORMAT,...value});}
/** Validate partial drafts against their exact accepted definition, never a current offer. */
export function validateCoachingTradeFeedback(text:string,template:TradeEvaluationTemplate):string{
 // Existing text columns hold the bounded evaluation; no schema or legacy row rewrite.
 if(text.length>768000)throw new Error('This trade feedback is too large. Shorten the written answers and try again.');
 const value=readCoachingTradeFeedback(text);
 if(!value.evaluation)throw new Error('Reload this review to use the agreed evaluation fields. Your existing feedback is unchanged.');
 return writeCoachingTradeFeedback({...value,evaluation:validateTradeEvaluation(value.evaluation,template)});
}
export function coachingTradeFeedbackText(text:string,template?:TradeEvaluationTemplate){
 const value=readCoachingTradeFeedback(text),evaluation=value.evaluation;
 const written=evaluation?(template?tradeWrittenFields(template).filter(field=>field.enabled).map(field=>[field.title,tradeWrittenAnswer(evaluation,field)]):BUILTIN_WRITTEN_FIELDS.map(field=>[field.title,evaluation[field.id]])):[];
 return [value.summary,...written.filter(([,answer])=>answer?.trim()).map(([title,answer])=>`${title}:\n${answer}`),...Object.entries(value.focus).filter(([,text])=>text?.trim()).map(([key,text])=>`${COACHING_REVIEW_FOCUS[key as CoachingReviewFocus]}:\n${text}`)].filter(Boolean).join('\n\n');
}
export function coachingTradeFeedbackComplete(text:string,focus:readonly CoachingReviewFocus[],template?:TradeEvaluationTemplate){const value=readCoachingTradeFeedback(text);const requiredFocus=template&&usesTradeReviewDesign(template)?[]:focus.filter(key=>!['goals','overall','next_steps'].includes(key));return (template?tradeEvaluationReady(value.evaluation,template):Boolean(value.summary.trim()))&&requiredFocus.every(key=>Boolean(value.focus[key]?.trim()));}
