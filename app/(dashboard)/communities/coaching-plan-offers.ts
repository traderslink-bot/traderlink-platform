import {submissionAllowanceLabel} from '@/src/modules/communities/contracts/coaching-request-submission-limits';
import type {TraderLinkCommunityCoachingItemType} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import type {CoachingReviewFocus} from "@/src/modules/communities/contracts/coaching-review-workspace";
import {blue, teal, green, orange, purple, red, pink} from "@mui/material/colors";
import {darken} from "@mui/material/styles";

export type Offer = Readonly<{
  type: Exclude<TraderLinkCommunityCoachingItemType,"journal_review">;
  label: string;
  description: string;
  measure: "trades" | "trading_days" | "reviews" | "check_ins" | "sessions" | "lessons" | "questions" | "custom";
  count?: string;
  group: "Reviews" | "Sessions and support";
  accent: "info" | "success" | "warning" | "secondary";
  period?: boolean;
  focus?: CoachingReviewFocus;
  legacyOnly?: boolean;
}>;

export const PLAN_OFFERS: readonly Offer[] = [
  {type:"trade_review",label:"Trade reviews",description:"Review individual trades from any day and tailor the feedback to your coaching style.",measure:"trades",count:"Trades per review",group:"Reviews",accent:"info",period:true},
  {type:"trading_day_review",label:"Trading-day reviews",description:"Review key trades and assess the student’s overall trading day, decisions and performance.",measure:"trading_days",count:"Trading days per review",group:"Reviews",accent:"info",period:true},
  {type:"performance_review",label:"Performance review",description:"Review performance over time to identify patterns, track progress and highlight areas for improvement.",measure:"reviews",group:"Reviews",accent:"success",period:true},
  {type:"private_session",label:"One-to-one sessions",description:"Individual coaching with your own agenda and meeting format.",measure:"sessions",count:"Sessions",group:"Sessions and support",accent:"secondary"},
  {type:"group_lesson",label:"Lessons",description:"Live or recorded teaching for individual students or groups.",measure:"lessons",count:"Lessons",group:"Sessions and support",accent:"info"},
  {type:"questions",label:"Student questions",description:"Offer a set allowance for questions and answers.",measure:"questions",count:"Questions per period",group:"Sessions and support",accent:"warning"},
  {type:"student_check_in",label:"Check-ins",description:"Scheduled progress updates between coaching reviews.",measure:"check_ins",count:"Check-ins",group:"Sessions and support",accent:"success"},
  {type:"review_follow_up",label:"Review follow-up",description:"Follow-up questions and feedback after a delivered review.",measure:"reviews",group:"Sessions and support",accent:"warning",legacyOnly:true},
  {type:"custom_task",label:"Custom coaching",description:"Describe your own coaching arrangement, with optional scheduling.",measure:"custom",group:"Sessions and support",accent:"secondary"},
];

// One Material palette per review type, shared by its tile, editor and preview.
const OFFER_PALETTES = {trade_review:blue, trading_day_review:teal, performance_review:green,
  rules_review:orange, strategy_review:purple, risk_review:red, goal_review:pink,
  private_session:purple, group_lesson:blue, questions:orange, student_check_in:teal,
  review_follow_up:pink, custom_task:green} as const;
export function offerColor(offer:Offer, mode:"light"|"dark"):string {
  const palette = OFFER_PALETTES[offer.type];
  return mode === "dark" ? palette[100] : darken(palette[900], .25);
}

export const PERFORMANCE_INCLUSIONS: readonly Readonly<{key:CoachingReviewFocus;label:string}>[] = [
  {key:"rules",label:"Rules followed and broken"},
  {key:"risk",label:"Risk management"},
  {key:"execution",label:"Trade execution"},
  {key:"journal",label:"Journal notes and trading habits"},
  {key:"goals",label:"Progress toward goals"},
];
export const REVIEW_RESOURCES = ["Analytics reports", "Trade Explorer findings", "Trade Analyzer findings"] as const;
export const FREQUENCIES = {weekly:"Weekly",every_two_weeks:"Every two weeks",monthly:"Monthly",once:"One-time",custom:"Custom"} as const;
export const PERIODS = {single_item:"Selected trades / days",previous_7_days:"Previous 7 days",since_last_review:"Since last review",calendar_week:"Calendar week",previous_month:"Previous month",custom:"Agreed with student"} as const;

export type OfferSettings = {
  frequency: keyof typeof FREQUENCIES;
  coverage: keyof typeof PERIODS;
  quantity: string;
  dueDays: string;
  deliveryDayCount?:'calendar'|'weekdays';
  weeklySchedule?:'monday';
  submissionSchedule?:'weekend_choice';
  maxTradesSubmittedPerDay?:string;
  minutes: string;
  selection: "coach" | "student" | "coach_or_student";
  depth: "standard" | "trades_only" | "complete_day";
  followUpEnabled: boolean;
  followUpDays: string;
  focus: CoachingReviewFocus[];
  resources: string[];
  tradeCapBasis:"per_day"|"per_review";
  tradeCapQuantity:string;
  details: string;
  timeline: boolean;
  tradeReviewFormat?:'recurring'|'pack';
  reviewSchedule?:'scheduled'|'on_request'|'student_choice';
};
export function initialOfferSettings(offer:Offer):OfferSettings {
  return {submissionSchedule:'weekend_choice',weeklySchedule:'monday',tradeCapBasis:"per_day",tradeCapQuantity:"5",frequency:"weekly",coverage:offer.count&&offer.group==="Reviews"?"single_item":"previous_7_days",quantity:offer.type==="trade_review"?"10":"1",maxTradesSubmittedPerDay:"",dueDays:offer.group==="Reviews"?"5":"2",minutes:"",selection:"coach_or_student",depth:offer.type==="trading_day_review"?"complete_day":"standard",followUpEnabled:false,followUpDays:"3",focus:offer.focus?[offer.focus]:[],resources:offer.type==="performance_review"?["Analytics reports"]:[],details:"",timeline:offer.type!=="custom_task"};
}
export function offerSummary(offer:Offer,value:OfferSettings):string[] {
  value=effectiveOfferSettings(offer.type,value);
  const result=offer.type==='trade_review'?[`Offer: ${value.tradeReviewFormat==='pack'?'Trade Review Pack':'Recurring Trade Reviews'}`,`Schedule: ${value.reviewSchedule==='student_choice'?'Student chooses when accepting':value.timeline?'Scheduled reviews':'Review on request'}`,...(value.tradeReviewFormat==='pack'?[]:[`Frequency: ${FREQUENCIES[value.frequency]}`])]:[value.timeline?`${"Frequency"}: ${FREQUENCIES[value.frequency]}`:offer.group==="Reviews"?"Schedule: Review on request":"Schedule: Flexible"];
  if(offer.count){
    const units = {trades:["trade","trades"],trading_days:["trading day","trading days"],reviews:["review","reviews"],check_ins:["check-in","check-ins"],sessions:["session","sessions"],lessons:["lesson","lessons"],questions:["question","questions"],custom:["item","items"]} as const;
    const quantity=`${value.quantity||"—"} ${units[offer.measure][Number(value.quantity)===1?0:1]}`;
    result.push(offer.type==="trade_review"?`Trades reviewed: ${value.quantity||"—"}`:offer.type==="trading_day_review"?`Trading days reviewed: ${value.quantity||"—"}`:`${offer.count}: ${quantity}`);
  }
  if(offer.period&&value.timeline){const coverage=value.coverage==="single_item"&&offer.type==="trade_review"?"Selected trades":value.coverage==="single_item"&&offer.type==="trading_day_review"?"Selected trading days":PERIODS[value.coverage];result.push(`Work reviewed: ${coverage}`);}
  if(value.timeline||offer.group==="Reviews"){
    const days=`${value.dueDays||"0"} ${Number(value.dueDays)===1?"day":"days"}`;
    result.push(offer.group==="Reviews"?`Review due: ${value.reviewSchedule==='student_choice'?`${days} after the period ends or after submission, depending on the student’s choice`:`${days} after ${value.timeline?(value.submissionSchedule&&["trade_review","trading_day_review"].includes(offer.type)?"the submission cutoff":"the scheduled period ends"):"submission"}`}`:`${offer.type==="questions"?"Response deadline":"Delivery deadline"}: Within ${days}`);
  }
  if(offer.type==="trade_review"&&(!value.timeline||value.reviewSchedule==='student_choice')){result.push(value.tradeReviewFormat==='pack'?`Reviews in pack: ${value.quantity}`:`Trade reviews: ${submissionAllowanceLabel(Number(value.quantity),value.frequency)}`);if(value.maxTradesSubmittedPerDay)result.push(`Maximum trades submitted per day: ${value.maxTradesSubmittedPerDay}`);}
  if(offer.type==="trade_review")result.push(`Trades chosen by: ${value.reviewSchedule==='student_choice'?'Student for reviews on request; for scheduled reviews: ':''}${value.selection==="coach_or_student"?"Coach or student":value.selection==="coach"?"Coach":"Student"}`);
  if(offer.type==="trade_review")result.push("Review includes: Individual trade evaluations and written coach feedback");
  if(offer.type==="trading_day_review")result.push(`Trade limit: ${value.tradeCapQuantity} trades ${value.tradeCapBasis==="per_day"?"per day":"across this review"}`);
  if(offer.type==="trading_day_review")result.push("Review includes: Trade evaluations and an overall trading-day assessment");
  if(offer.type==="performance_review")result.push(...value.resources.map(resource=>`Resources: ${resource}`));
  if(offer.type==="performance_review")result.push("Review includes: Performance analytics, a period-wide evaluation and written coach feedback");
  if(['trade_review','trading_day_review'].includes(offer.type)){result.push(`Delivery days: ${value.deliveryDayCount==='weekdays'?'Weekdays (Monday–Friday)':'Calendar days (including weekends)'}`);if(value.weeklySchedule==='monday'&&value.timeline&&['weekly','every_two_weeks'].includes(value.frequency))result.push(value.submissionSchedule?(value.frequency==='every_two_weeks'?'Trading dates: Two Monday–Friday weeks':'Trading dates: Monday–Friday'):'Review weeks: Monday–Sunday');if(value.submissionSchedule&&value.timeline&&['weekly','every_two_weeks'].includes(value.frequency))result.push(`Submission cutoff: ${value.deliveryDayCount==='weekdays'?'Sunday':'Friday'} evening`);}
  if(offer.group==="Reviews"&&value.followUpEnabled)result.push(`Follow-up: ${value.followUpDays} ${Number(value.followUpDays)===1?"day":"days"} after the review`);
  if(offer.type==="review_follow_up")result.push(`Follow-up period: ${value.followUpDays} ${Number(value.followUpDays)===1?"day":"days"}`);
  if(value.minutes)result.push(`Session length: ${value.minutes} ${Number(value.minutes)===1?"minute":"minutes"}`);
  const labels:Partial<Record<CoachingReviewFocus,string>>={journal:"Journal notes and tags",rules:"Rules",risk:"Risk management",execution:"Trade execution",goals:"Goals",overall:"Overall feedback",next_steps:"Next steps"};
  result.push(...value.focus.filter(key=>key!==offer.focus&&key!=='strategy_guidance').map(key=>`Focus: ${labels[key]??key}`),...(offer.type==="performance_review"?[]:value.resources.map(resource=>`Resources: ${resource}`)));
  return result;
}


/** Controls and summaries share effective values; serialized packs never retain a recurring period. */
export function effectiveOfferSettings(type:string,value:OfferSettings):OfferSettings{
 if(type!=='trade_review')return value;
 const pack=value.tradeReviewFormat==='pack'||!value.tradeReviewFormat&&!value.timeline&&value.frequency==='once';
 const reviewSchedule=pack?'on_request':value.reviewSchedule??(value.timeline?'scheduled':'on_request');
 return {...value,tradeReviewFormat:pack?'pack':'recurring',reviewSchedule,timeline:reviewSchedule!=='on_request',...(pack?{frequency:'once' as const}:{}),...(reviewSchedule==='on_request'?{selection:'student' as const}:{}),coverage:value.tradeReviewFormat?'single_item':value.coverage};
}

/** Keep schedule controls and accepted offer metadata in sync in the standalone editor. */
export function standaloneReviewOfferSettings(config:import('@/src/modules/communities/contracts/coaching-plan-configuration').CoachingPlanConfiguration['offers']['trade_review']):Partial<OfferSettings>{
 if(!config)return {};
 return {weeklySchedule:config.weeklySchedule,submissionSchedule:config.submissionSchedule,deliveryDayCount:config.deliveryDayCount??'calendar',tradeReviewFormat:config.tradeReviewFormat,reviewSchedule:config.reviewSchedule,maxTradesSubmittedPerDay:config.submissionLimits?.perDay===undefined?'':String(config.submissionLimits.perDay),resources:[...config.resources]};
}
export function standaloneReviewOfferConfiguration(type:string,value:OfferSettings){
 if(type!=='trade_review'&&type!=='trading_day_review')return {};
 const selected=effectiveOfferSettings(type,value);
 return {weeklySchedule:'monday' as const,submissionSchedule:'weekend_choice' as const,deliveryDayCount:selected.deliveryDayCount??'calendar',
  ...(type==='trade_review'?{tradeReviewFormat:selected.tradeReviewFormat,reviewSchedule:selected.reviewSchedule,...(!selected.timeline||selected.reviewSchedule==='student_choice'?{submissionLimits:{perPeriod:Number(selected.quantity),...(selected.maxTradesSubmittedPerDay?{perDay:Number(selected.maxTradesSubmittedPerDay)}:{})}}:{})}:{})};
}
