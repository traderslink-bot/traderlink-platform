import {parsePerformanceTemplate,type PerformanceTemplate} from './coaching-performance-evaluation';
import {daySessionRulesEnabled} from './coaching-trading-day-evaluation';
import {parseTradeReviewOlderPolicy} from './coaching-trade-review-older-policy';
import {parseTradeEvaluationTemplate,tradeReviewRulesEnabled,type TradeEvaluationTemplate} from './coaching-trade-evaluation';
import type {CoachingAgreementTerms} from './coaching-agreements';
import {coachingDate} from './coaching-agreements';
import {parseCoachingPlanConfiguration} from './coaching-plan-configuration';
import {parseCoachingFocus} from './coaching-review-workspace';

function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Check the coaching plan.');return value as Record<string,unknown>;}
function text(value:unknown,max:number):string{if(typeof value!=='string'||value.length>max)throw new Error('Check the plan text.');return value;}
function number(value:unknown,min:number,max:number):number{if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min||value>max)throw new Error('Check the plan quantities and deadlines.');return value;}
function choice(value:unknown,options:readonly string[]):string{if(typeof value!=='string'||!options.includes(value))throw new Error('Choose a valid plan option.');return value;}
const types=['trade_review','trading_day_review','performance_review','strategy_review','rules_review','risk_review','goal_review','journal_review','private_session','group_lesson','questions','student_check_in','review_follow_up','custom_task'];

/** Public plan form input only; server replaces plan identity and revision when saving. */
export function parseIndependentCoachingPlanTerms(value:unknown):CoachingAgreementTerms{
 const raw=object(value);
 if(!Array.isArray(raw.items)||!raw.items.length||raw.items.length>30)throw new Error('Choose the services in this plan.');
 const items=raw.items.map((value,index)=>{
  const item=object(value);
  if(typeof item.timelineEnabled!=='boolean')throw new Error('Choose the service schedule.');
  return {planItemId:text(item.planItemId,200),itemType:choice(item.itemType,types),
   frequency:choice(item.frequency,['weekly','every_two_weeks','monthly','once','custom']),
   coveragePeriod:choice(item.coveragePeriod,['single_item','previous_7_days','since_last_review','calendar_week','previous_month','custom']),
   quantity:number(item.quantity,1,500),dueOffsetDays:number(item.dueOffsetDays,1,366),
   selectionMode:choice(item.selectionMode,['not_applicable','coach','student','coach_or_student']),followUpDays:number(item.followUpDays,0,366),
   measurementKind:choice(item.measurementKind,['trades','trading_days','reviews','check_ins','sessions','lessons','questions','custom']),
   plannedMinutes:item.plannedMinutes===null?null:number(item.plannedMinutes,1,1440),timelineEnabled:item.timelineEnabled,
   reviewDepth:choice(item.reviewDepth,['standard','trades_only','complete_day']),ordinal:index,focusAreas:parseCoachingFocus(item.focusAreas??[])};
 });
 if(items.some(item=>!item.planItemId.trim())||new Set(items.map(item=>item.planItemId)).size!==items.length)throw new Error('Each plan service must have a distinct identity.');
 if(raw.quoteRequired!==undefined&&typeof raw.quoteRequired!=='boolean')throw new Error('Choose a valid quote option.');
 const startDate=raw.startDate===null?null:coachingDate(text(raw.startDate,10));
 const dueTimeUtc=text(raw.dueTimeUtc,5);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(dueTimeUtc))throw new Error('Choose a valid time.');
 const coverageDays:Record<string,number>={};
 if(raw.coverageDays!==undefined)for(const [id,days] of Object.entries(object(raw.coverageDays))){if(!items.some(item=>item.planItemId===id))throw new Error('Unknown service coverage.');coverageDays[id]=number(days,1,366);}
 if(items.some(item=>item.timelineEnabled&&item.coveragePeriod==='custom'&&!coverageDays[item.planItemId]))throw new Error('Set the days covered by each custom review.');
 if(items.some(item=>item.timelineEnabled&&item.frequency==='custom')&&raw.customIntervalDays===null)throw new Error('Set the custom schedule interval.');
 const tradeEvaluationTemplates:Record<string,TradeEvaluationTemplate>={};
 if(raw.tradeEvaluationTemplates!==undefined)for(const [id,template] of Object.entries(object(raw.tradeEvaluationTemplates))){const parsed=parseTradeEvaluationTemplate(template);if(!items.some(item=>item.planItemId===id&&(item.itemType==='trade_review'&&!parsed.daySessionReview||item.itemType==='trading_day_review'&&Boolean(parsed.daySessionReview&&parsed.reviewDesign))))throw new Error('Attach evaluations only to the agreed Trade or versioned Trading-day review service.');tradeEvaluationTemplates[id]=parsed;}
 for(const item of items){const template=tradeEvaluationTemplates[item.planItemId];if(!template?.reviewDesign)continue;const focus=item.focusAreas??[];if(focus.some(key=>!['rules','goals'].includes(key))||focus.includes('rules')!==(tradeReviewRulesEnabled(template)||daySessionRulesEnabled(template.daySessionReview)))throw new Error('Use the accepted Rules field and overall goals options for this Trade Review design.');}
 const performanceEvaluationTemplates:Record<string,PerformanceTemplate>=Object.create(null);
 if(raw.performanceEvaluationTemplates!==undefined)for(const [id,value] of Object.entries(object(raw.performanceEvaluationTemplates))){if(['__proto__','constructor','prototype'].includes(id))throw new Error('Choose a valid Performance service identity.');const item=items.find(item=>item.planItemId===id&&item.itemType==='performance_review');if(!item)throw new Error('Attach period evaluations only to Performance reviews.');const template=parsePerformanceTemplate(value);if(item.focusAreas.some(key=>!['rules','goals'].includes(key))||item.focusAreas.includes('rules')!==Boolean(template.periodDesign.rulesCriterionId)||item.focusAreas.includes('goals')!==template.periodDesign.overallGoals)throw new Error('Use the agreed Performance Rules and overall Goals options.');performanceEvaluationTemplates[id]=template;}
 return {planId:'server-assigned',planRevision:1,planName:text(raw.planName,200),description:text(raw.description,4000),
  priceAmountMinor:number(raw.priceAmountMinor,0,Number.MAX_SAFE_INTEGER),currency:choice(raw.currency,['USD','CAD']),
  billingCadence:choice(raw.billingCadence,['one_time','weekly','monthly','custom']),quoteRequired:raw.quoteRequired===true,
  paymentInstructions:text(raw.paymentInstructions??'',4000),requiredDiscordRoleId:null,autoArchiveAfterDays:null,startDate,
  customIntervalDays:raw.customIntervalDays===null?null:number(raw.customIntervalDays,1,366),dueTimeUtc,
  items:items as CoachingAgreementTerms['items'],coverageDays,
  ...(raw.olderTradeSelectionPolicy===undefined?{}:{olderTradeSelectionPolicy:parseTradeReviewOlderPolicy(raw.olderTradeSelectionPolicy)}),
  ...(Object.keys(tradeEvaluationTemplates).length?{tradeEvaluationTemplates}:{}),
  ...(Object.keys(performanceEvaluationTemplates).length?{performanceEvaluationTemplates}:{}),
  ...(raw.builderConfig===undefined?{}:{builderConfig:parseCoachingPlanConfiguration(raw.builderConfig)})};
}
