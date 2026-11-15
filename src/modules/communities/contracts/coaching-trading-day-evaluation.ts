import type {TradeEvaluationTemplate} from './coaching-trade-evaluation';
import type {IndependentCoachingReviewDraft} from './independent-coaching';
export const DAY_SESSION_FIELDS=[{id:'rules',title:'Day/session rules'},{id:'risk_limits',title:'Daily risk limits'},{id:'session_decisions',title:'Decisions across trades'}] as const;
export type DaySessionFieldId=typeof DAY_SESSION_FIELDS[number]['id'];
export type DaySessionReview=Readonly<{version:1;journalEvidence:boolean;fields:readonly Readonly<{id:DaySessionFieldId;enabled:boolean;required:boolean;guidance?:string}>[]}>;
export type DaySessionFeedback=Readonly<Record<string,Readonly<Partial<Record<DaySessionFieldId,string>>>>>;
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Check the day/session assessment.');return value as Record<string,unknown>;}
function text(value:unknown,max:number):string{if(typeof value!=='string'||value.length>max)throw new Error(`Day/session feedback must fit within ${max.toLocaleString('en-US')} characters per field.`);return value;}
function date(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw new Error('Choose a valid selected trading day.');return value;}
export function defaultDaySessionReview():DaySessionReview{return {version:1,journalEvidence:false,fields:DAY_SESSION_FIELDS.map(field=>({id:field.id,enabled:field.id!=='rules',required:false}))};}
export function parseDaySessionReview(value:unknown):DaySessionReview{
 const raw=object(value);if(raw.version!==1||typeof raw.journalEvidence!=='boolean'||!Array.isArray(raw.fields)||raw.fields.length!==3||Object.keys(raw).some(key=>!['version','journalEvidence','fields'].includes(key)))throw new Error('Use the supported day/session review.');
 const seen=new Set<string>();const fields=raw.fields.map(value=>{const field=object(value);if(!DAY_SESSION_FIELDS.some(item=>item.id===field.id)||seen.has(String(field.id))||typeof field.enabled!=='boolean'||typeof field.required!=='boolean'||Object.keys(field).some(key=>!['id','enabled','required','guidance'].includes(key)))throw new Error('Choose valid distinct day/session fields.');seen.add(String(field.id));return {id:field.id as DaySessionFieldId,enabled:field.enabled,required:field.required,...(field.guidance===undefined?{}:{guidance:text(field.guidance,400)})};});return {version:1,journalEvidence:raw.journalEvidence,fields};
}
export function parseDaySessionFeedback(value:unknown):DaySessionFeedback{
 const entries=Object.entries(object(value));if(entries.length>500)throw new Error('Too many trading-day assessments.');const result:Record<string,Partial<Record<DaySessionFieldId,string>>>=Object.create(null);
 for(const [day,value] of entries){const fields=object(value),answers:Partial<Record<DaySessionFieldId,string>>={};for(const [id,answer] of Object.entries(fields)){if(!DAY_SESSION_FIELDS.some(field=>field.id===id))throw new Error('Answer only the agreed day/session fields.');answers[id as DaySessionFieldId]=text(answer,4000);}result[date(day)]=answers;}return result;
}
export function validateDaySessionDraft(draft:IndependentCoachingReviewDraft,selectedDays:readonly string[],template:TradeEvaluationTemplate|undefined):void{
 const config=template?.daySessionReview;
 if(!config){if(draft.daySessionFeedback!==undefined)throw new Error('This accepted review uses its original day assessment.');return;}
 const allowed=new Set(selectedDays);for(const day of Object.keys(draft.dayAssessments??{}))if(!allowed.has(day))throw new Error('Assess only the selected trading days.');
 for(const [day,fields] of Object.entries(draft.daySessionFeedback??{})){if(!allowed.has(day))throw new Error('Assess only the selected trading days.');for(const id of Object.keys(fields))if(!config.fields.some(field=>field.id===id&&field.enabled))throw new Error('Answer only enabled accepted day/session fields.');}
}
export function daySessionReady(day:string,draft:IndependentCoachingReviewDraft,config:DaySessionReview):boolean{return Boolean(draft.dayAssessments?.[day]?.trim())&&config.fields.filter(field=>field.enabled&&field.required).every(field=>Boolean(draft.daySessionFeedback?.[day]?.[field.id]?.trim()));}
export function daySessionRulesEnabled(config:DaySessionReview|undefined):boolean{return Boolean(config?.fields.some(field=>field.id==='rules'&&field.enabled));}
