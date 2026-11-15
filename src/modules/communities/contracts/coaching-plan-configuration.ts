import {requestSubmissionLimits,type RequestSubmissionLimits} from './coaching-request-submission-limits';
import {parseCoachingPlanPaymentOptions,type CoachingPlanPaymentOptions} from "./coaching-payment-options";
import type {TraderLinkCommunityCoachingItemType} from "./traderlink-community-platform-contracts";
import {parseTradeEvaluationTemplate} from './coaching-trade-evaluation';
import {parsePerformanceTemplate} from './coaching-performance-evaluation';

export type CoachingPlanConfiguration=Readonly<{
  about:string;
  payment?:CoachingPlanPaymentOptions;
  tradeEvaluationTemplates?:Partial<Record<TraderLinkCommunityCoachingItemType,import('./coaching-trade-evaluation').TradeEvaluationTemplate>>;
  performanceEvaluationTemplates?:Partial<Record<TraderLinkCommunityCoachingItemType,import('./coaching-performance-evaluation').PerformanceTemplate>>;
  offers:Partial<Record<TraderLinkCommunityCoachingItemType,Readonly<{details:string;resources:readonly string[];includeDayJournal?:boolean;weeklySchedule?:'monday';submissionSchedule?:'weekend_choice';deliveryDayCount?:'calendar'|'weekdays';tradeReviewFormat?:'recurring'|'pack';reviewSchedule?:'scheduled'|'on_request'|'student_choice';submissionLimits?:RequestSubmissionLimits;tradeCap?:Readonly<{basis:"per_day"|"per_review";quantity:number}>}>>>;
}>;

const types=new Set(["trade_review","trading_day_review","performance_review","journal_review","rules_review","strategy_review","risk_review","goal_review","student_check_in","review_follow_up","private_session","group_lesson","questions","custom_task"]);
const resources=new Set(["Analytics reports","Trade Explorer findings","Trade Analyzer findings"]);
export function parseCoachingPlanConfiguration(value:unknown):CoachingPlanConfiguration {
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Invalid plan configuration");
  const raw=value as Record<string,unknown>;
  const about=raw.about===undefined?"":raw.about;
  if(typeof about!=="string"||about.length>4000)throw new Error("Invalid plan description");
  const entries=raw.offers??{};
  if(!entries||typeof entries!=="object"||Array.isArray(entries))throw new Error("Invalid plan services");
  const offers:CoachingPlanConfiguration["offers"]={};
  for(const [key,item] of Object.entries(entries)){
    if(!types.has(key)||!item||typeof item!=="object"||Array.isArray(item))throw new Error("Invalid plan service");
    const fields=item as Record<string,unknown>;
    if(typeof fields.details!=="string"||fields.details.length>1000||!Array.isArray(fields.resources)||fields.resources.some(resource=>typeof resource!=="string"||!resources.has(resource)))throw new Error("Invalid plan service details");
    if(fields.submissionSchedule!==undefined&&fields.submissionSchedule!=='weekend_choice')throw new Error('Choose the supported review submission schedule.');
    if(fields.weeklySchedule!==undefined&&fields.weeklySchedule!=='monday')throw new Error('Choose Monday-to-Sunday review weeks.');
    if(fields.deliveryDayCount!==undefined&&!['calendar','weekdays'].includes(String(fields.deliveryDayCount)))throw new Error('Choose calendar days or weekdays for delivery.');
    if(fields.includeDayJournal!==undefined&&typeof fields.includeDayJournal!=="boolean")throw new Error("Invalid Journal sharing requirement");
    if(fields.tradeReviewFormat!==undefined&&(key!=='trade_review'||!['recurring','pack'].includes(String(fields.tradeReviewFormat))))throw new Error('Choose Recurring Trade Reviews or Trade Review Pack.');
    if(fields.reviewSchedule!==undefined&&(key!=='trade_review'||!['scheduled','on_request','student_choice'].includes(String(fields.reviewSchedule))))throw new Error('Choose a review schedule.');
    if(fields.tradeReviewFormat==='pack'&&fields.reviewSchedule!=='on_request')throw new Error('Trade Review Packs use reviews on request.');
    let tradeCap: {basis:"per_day"|"per_review";quantity:number}|undefined;
    if(fields.tradeCap!==undefined){const cap=fields.tradeCap as {basis:string;quantity:number};if(!cap||!["per_day","per_review"].includes(cap.basis)||!Number.isInteger(cap.quantity)||cap.quantity<1||cap.quantity>500)throw new Error("Choose a trade limit between 1 and 500.");tradeCap={basis:cap.basis as "per_day"|"per_review",quantity:cap.quantity};}
    offers[key as TraderLinkCommunityCoachingItemType]={details:fields.details,resources:[...new Set(fields.resources as string[])],...(fields.submissionSchedule===undefined?{}:{submissionSchedule:'weekend_choice' as const}),...(fields.weeklySchedule===undefined?{}:{weeklySchedule:'monday' as const}),...(fields.deliveryDayCount===undefined?{}:{deliveryDayCount:fields.deliveryDayCount as 'calendar'|'weekdays'}),...(fields.tradeReviewFormat===undefined?{}:{tradeReviewFormat:fields.tradeReviewFormat as 'recurring'|'pack'}),...(fields.reviewSchedule===undefined?{}:{reviewSchedule:fields.reviewSchedule as 'scheduled'|'on_request'|'student_choice'}),...(fields.includeDayJournal!==undefined?{includeDayJournal:fields.includeDayJournal as boolean}:{}),...(fields.submissionLimits===undefined?{}:{submissionLimits:requestSubmissionLimits(fields.submissionLimits)}),...(tradeCap?{tradeCap}:{})};
  }
  const tradeEvaluationTemplates:NonNullable<CoachingPlanConfiguration['tradeEvaluationTemplates']>={};
  if(raw.tradeEvaluationTemplates!==undefined){if(!raw.tradeEvaluationTemplates||typeof raw.tradeEvaluationTemplates!=='object'||Array.isArray(raw.tradeEvaluationTemplates))throw new Error('Invalid trade evaluation templates');for(const [key,value] of Object.entries(raw.tradeEvaluationTemplates)){if(!['trade_review','trading_day_review'].includes(key))throw new Error('Invalid trade evaluation service');tradeEvaluationTemplates[key as TraderLinkCommunityCoachingItemType]=parseTradeEvaluationTemplate(value);}}
  const performanceEvaluationTemplates:NonNullable<CoachingPlanConfiguration['performanceEvaluationTemplates']>={};
  if(raw.performanceEvaluationTemplates!==undefined){if(!raw.performanceEvaluationTemplates||typeof raw.performanceEvaluationTemplates!=='object'||Array.isArray(raw.performanceEvaluationTemplates))throw new Error('Invalid performance evaluation templates');for(const [key,value] of Object.entries(raw.performanceEvaluationTemplates)){if(key!=='performance_review')throw new Error('Invalid performance evaluation service');performanceEvaluationTemplates[key as TraderLinkCommunityCoachingItemType]=parsePerformanceTemplate(value);}}
  return {about,offers,...(raw.payment===undefined?{}:{payment:parseCoachingPlanPaymentOptions(raw.payment)}),...(Object.keys(tradeEvaluationTemplates).length?{tradeEvaluationTemplates}:{}),...(Object.keys(performanceEvaluationTemplates).length?{performanceEvaluationTemplates}:{})};
}
