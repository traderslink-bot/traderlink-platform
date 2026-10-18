import {COACHING_REVIEW_FOCUS,type CoachingFocusFeedback,type CoachingReviewFocus} from "./coaching-review-workspace";
const FORMAT='coaching-trade-feedback/v1';
export function readCoachingTradeFeedback(text:string):{summary:string;focus:CoachingFocusFeedback}{
 try{const value=JSON.parse(text) as {format?:unknown;summary?:unknown;focus?:unknown};if(value?.format===FORMAT&&typeof value.summary==='string'&&value.focus&&typeof value.focus==='object'&&!Array.isArray(value.focus)){
  const focus:CoachingFocusFeedback={};for(const [key,text] of Object.entries(value.focus))if(key in COACHING_REVIEW_FOCUS&&typeof text==='string')focus[key as CoachingReviewFocus]=text;return {summary:value.summary,focus};
 }}catch{}return {summary:text,focus:{}};
}
export function writeCoachingTradeFeedback(value:{summary:string;focus:CoachingFocusFeedback}):string{return JSON.stringify({format:FORMAT,...value});}
export function coachingTradeFeedbackText(text:string){const value=readCoachingTradeFeedback(text);return [value.summary,...Object.entries(value.focus).filter(([,text])=>text?.trim()).map(([key,text])=>`${COACHING_REVIEW_FOCUS[key as CoachingReviewFocus]}:\n${text}`)].filter(Boolean).join('\n\n');}
export function coachingTradeFeedbackComplete(text:string,focus:readonly CoachingReviewFocus[]){const value=readCoachingTradeFeedback(text);return Boolean(value.summary.trim())&&focus.filter(key=>!['goals','overall','next_steps'].includes(key)).every(key=>Boolean(value.focus[key]?.trim()));}
