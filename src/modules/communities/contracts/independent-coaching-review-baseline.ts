import type {TradeEvaluationTemplate} from './coaching-trade-evaluation';
import type {IndependentCoachingFeedbackAcknowledgement,IndependentCoachingInsertedTrade} from './independent-coaching';
import type {CoachingReviewFocus} from './coaching-review-workspace';
import {INDEPENDENT_REVIEW_STALE,INDEPENDENT_TRADE_STALE,independentTradeFeedbackCompleted,isIndependentFeedbackFingerprint,parseIndependentBulkFeedback,parseIndependentReviewDraft,parseIndependentTradeFeedback} from './independent-coaching-review-input';

export const INDEPENDENT_FEEDBACK_PROTOCOL='traderlink.coaching.feedback.v1' as const;
export const INDEPENDENT_FEEDBACK_ACK_ERROR='The save confirmation could not be verified. Your text is still here.';
export function isIndependentFeedbackIntent(intent:unknown):boolean{return typeof intent==='string'&&['save_review','save_review_trade','add_review_trades','change_review_selection'].includes(intent);}
export function isIndependentFeedbackRequestId(value:unknown):value is string{return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);}

/** JSON content only. Sorting keys in the serialized text also handles numeric and __proto__ keys safely. */
export function canonicalIndependentFeedback(value:unknown):string{
 if(value===null)return 'null';
 if(typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
 if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
 if(Array.isArray(value)){for(let index=0;index<value.length;index++)if(!Object.hasOwn(value,index))throw new Error('Check the review feedback.');return '['+value.map(canonicalIndependentFeedback).join(',')+']';}
 if(value&&typeof value==='object'&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null)){
  const object=value as Record<string,unknown>;
  return '{'+Object.keys(object).sort().map(key=>JSON.stringify(key)+':'+canonicalIndependentFeedback(object[key])).join(',')+'}';
 }
 throw new Error('Check the review feedback.');
}
export function independentReviewEnvelope(reviewId:string,draft:unknown){return {domain:INDEPENDENT_FEEDBACK_PROTOCOL,kind:'review-draft',reviewId,draft};}
export function independentTradeEnvelope(reviewId:string,roundTripId:string,feedback:unknown,completed:boolean){return {domain:INDEPENDENT_FEEDBACK_PROTOCOL,kind:'trade-feedback',reviewId,roundTripId,feedback,completed};}
export function independentSelectionEnvelope(reviewId:string,rows:readonly {roundTripId:string;logicalTradeId?:string;selectionSource?:string}[]){return {domain:INDEPENDENT_FEEDBACK_PROTOCOL,kind:'review-selection',reviewId,rows:rows.map(row=>({roundTripId:row.roundTripId,logicalTradeId:row.logicalTradeId??'',selectionSource:row.selectionSource??'unknown'})).sort((a,b)=>a.roundTripId<b.roundTripId?-1:a.roundTripId>b.roundTripId?1:0)};}
export function independentFeedbackValue(value:unknown):unknown{return typeof value==='string'?JSON.parse(value):value;}
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(INDEPENDENT_FEEDBACK_ACK_ERROR);return value as Record<string,unknown>;}
function check(condition:unknown):asserts condition{if(!condition)throw new Error(INDEPENDENT_FEEDBACK_ACK_ERROR);}

/** Hash is injected: Node crypto on the server/probes, Web Crypto in the browser. No environment globals here. */
export async function validateIndependentFeedbackAcknowledgement(raw:unknown,submitted:Readonly<Record<string,unknown>>,hash:(content:string)=>Promise<string>,focus:readonly CoachingReviewFocus[]=[],template?:TradeEvaluationTemplate):Promise<IndependentCoachingFeedbackAcknowledgement>{
 const ack=object(raw),reviewId=submitted.reviewId;
 const keys=['protocol','requestId','reviewId','kind',...(submitted.intent==='save_review'?['fingerprint','trades']:submitted.intent==='save_review_trade'?['roundTripId','fingerprint','completed']:submitted.intent==='change_review_selection'?['removedRoundTripId','selectionFingerprint','rows']:['requestedRoundTripIds','rows'])];
 check(Object.keys(ack).every(key=>keys.includes(key)));
 check(typeof reviewId==='string'&&isIndependentFeedbackRequestId(submitted.requestId));
 check(ack.protocol===INDEPENDENT_FEEDBACK_PROTOCOL&&ack.requestId===submitted.requestId&&ack.reviewId===reviewId);
 if(submitted.intent==='save_review'){
  check(ack.kind==='review'&&isIndependentFeedbackFingerprint(submitted.expectedFingerprint)&&isIndependentFeedbackFingerprint(ack.fingerprint)&&Array.isArray(ack.trades));
  const draft=parseIndependentReviewDraft(independentFeedbackValue(submitted.draft));
  check(ack.fingerprint===await hash(canonicalIndependentFeedback(independentReviewEnvelope(reviewId,draft))));
  const targets=parseIndependentBulkFeedback(independentFeedbackValue(submitted.tradeFeedback)??[]),rows=ack.trades.map(object),seen=new Set<string>();
  check(rows.length===targets.length);
  for(const row of rows){
   check(Object.keys(row).every(key=>['roundTripId','fingerprint','completed'].includes(key))&&typeof row.roundTripId==='string'&&!seen.has(row.roundTripId));seen.add(row.roundTripId);
   const target=targets.find(item=>item.roundTripId===row.roundTripId);check(target&&row.completed===target.completed&&isIndependentFeedbackFingerprint(row.fingerprint));
   check(row.fingerprint===await hash(canonicalIndependentFeedback(independentTradeEnvelope(reviewId,target.roundTripId,target.feedback,target.completed))));
  }
 }else if(submitted.intent==='save_review_trade'){
  check(ack.kind==='trade'&&isIndependentFeedbackFingerprint(submitted.expectedFingerprint)&&typeof submitted.roundTripId==='string'&&ack.roundTripId===submitted.roundTripId&&isIndependentFeedbackFingerprint(ack.fingerprint));
  const feedback=parseIndependentTradeFeedback(independentFeedbackValue(submitted.feedback)),completed=independentTradeFeedbackCompleted(feedback,focus,template);
  check(ack.completed===completed&&ack.fingerprint===await hash(canonicalIndependentFeedback(independentTradeEnvelope(reviewId,submitted.roundTripId,feedback,completed))));
 }else if(submitted.intent==='change_review_selection'){
  check(ack.kind==='selection'&&ack.removedRoundTripId===submitted.removeRoundTripId&&isIndependentFeedbackFingerprint(ack.selectionFingerprint)&&Array.isArray(ack.rows));
  const previous=independentFeedbackValue(submitted.activeRoundTripIds),replacement=independentFeedbackValue(submitted.replacementIds);
  check(Array.isArray(previous)&&previous.every(id=>typeof id==='string')&&Array.isArray(replacement)&&replacement.every(id=>typeof id==='string'));
  const expected=new Set([...previous.filter(id=>id!==submitted.removeRoundTripId),...replacement]),seen=new Set<string>(),rows=ack.rows.map(object);
  check(rows.length===expected.size);
  for(const row of rows){
   check(Object.keys(row).every(key=>['roundTripId','logicalTradeId','selectionSource','feedback','completed','fingerprint'].includes(key))&&typeof row.roundTripId==='string'&&expected.has(row.roundTripId)&&!seen.has(row.roundTripId));seen.add(row.roundTripId);
   check(typeof row.logicalTradeId==='string'&&Boolean(row.logicalTradeId)&&['coach','student','unknown'].includes(String(row.selectionSource))&&typeof row.completed==='boolean'&&isIndependentFeedbackFingerprint(row.fingerprint));object(row.feedback);
   check(row.fingerprint===await hash(canonicalIndependentFeedback(independentTradeEnvelope(reviewId,row.roundTripId,row.feedback,row.completed))));
  }
  check(ack.selectionFingerprint===await hash(canonicalIndependentFeedback(independentSelectionEnvelope(reviewId,rows as unknown as Parameters<typeof independentSelectionEnvelope>[1]))));
 }else if(submitted.intent==='add_review_trades'){
  const requested=independentFeedbackValue(submitted.roundTripIds);
  check(ack.kind==='append'&&Array.isArray(requested)&&requested.length<=500&&requested.every(id=>typeof id==='string')&&Array.isArray(ack.requestedRoundTripIds)&&canonicalIndependentFeedback(ack.requestedRoundTripIds)===canonicalIndependentFeedback(requested)&&Array.isArray(ack.rows));
  const seen=new Set<string>();
  for(const value of ack.rows){
   const row=object(value);
   check(Object.keys(row).every(key=>['roundTripId','logicalTradeId','selectionSource','feedback','completed','fingerprint'].includes(key)));
   check(typeof row.roundTripId==='string'&&requested.includes(row.roundTripId)&&!seen.has(row.roundTripId));seen.add(row.roundTripId);
   check(typeof row.logicalTradeId==='string'&&Boolean(row.logicalTradeId)&&row.selectionSource==='coach'&&typeof row.completed==='boolean'&&isIndependentFeedbackFingerprint(row.fingerprint));object(row.feedback);
   check(row.fingerprint===await hash(canonicalIndependentFeedback(independentTradeEnvelope(reviewId,row.roundTripId,row.feedback,row.completed))));
  }
 }else throw new Error(INDEPENDENT_FEEDBACK_ACK_ERROR);
 return ack as IndependentCoachingFeedbackAcknowledgement;
}

/** Never overwrite an existing local row, even on an exact append retry or after a concurrent local edit. */
export function mergeIndependentInsertedTrades<T extends {roundTripId:string}>(existing:readonly T[],inserted:readonly IndependentCoachingInsertedTrade[]):readonly (T|IndependentCoachingInsertedTrade)[]{
 const ids=new Set(existing.map(row=>row.roundTripId));return [...existing,...inserted.filter(row=>{if(ids.has(row.roundTripId))return false;ids.add(row.roundTripId);return true;})];
}

/** Only pure feedback validation before any write may produce this rejection. */
export class IndependentFeedbackValidationRejection extends Error {
 constructor(message:string){super(message);this.name='IndependentFeedbackValidationRejection';}
}
export function validateIndependentFeedbackBeforeWrite<T>(validate:()=>T):T{
 try{return validate();}catch(cause){if(cause instanceof Error&&[INDEPENDENT_REVIEW_STALE,INDEPENDENT_TRADE_STALE].includes(cause.message))throw cause;throw new IndependentFeedbackValidationRejection(cause instanceof Error?cause.message:'Check the review feedback.');}
}
/** Untyped errors, stale conflicts and uncertain acknowledgements never release a frozen attempt. */
export async function isIndependentFeedbackRejection(raw:unknown,submitted:Readonly<Record<string,unknown>>,body:string,hash:(value:string)=>Promise<string>):Promise<boolean>{
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!['save_review','save_review_trade'].includes(String(submitted.intent)))return false;
 const value=raw as Record<string,unknown>;
 return value.kind==='rejected_feedback'&&value.protocol===INDEPENDENT_FEEDBACK_PROTOCOL&&isIndependentFeedbackRequestId(submitted.requestId)&&value.requestId===submitted.requestId&&value.intent===submitted.intent&&value.reviewId===submitted.reviewId&&value.roundTripId===(submitted.roundTripId??null)&&value.expectedFingerprint===submitted.expectedFingerprint&&value.bodySha256===await hash(body);
}
