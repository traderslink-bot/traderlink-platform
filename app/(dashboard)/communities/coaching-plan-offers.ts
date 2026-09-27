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
}>;

export const PLAN_OFFERS: readonly Offer[] = [
  {type:"trade_review",label:"Trade reviews",description:"Feedback on individual trades, with optional Journal and rules review.",measure:"trades",count:"Trades per review",group:"Reviews",accent:"info",period:true},
  {type:"trading_day_review",label:"Trading-day reviews",description:"Review a trading day’s trades, with optional day notes and rules.",measure:"trading_days",count:"Trading days per review",group:"Reviews",accent:"info",period:true},
  {type:"performance_review",label:"Performance review",description:"Review results over time, with your choice of additional focus areas.",measure:"reviews",group:"Reviews",accent:"success",period:true},
  {type:"rules_review",label:"Rules review",description:"Examine followed and broken rules and their effect on trading.",measure:"reviews",group:"Reviews",accent:"warning",period:true,focus:"rules"},
  {type:"strategy_review",label:"Strategy review",description:"Review the student’s trading approach, setups and execution.",measure:"reviews",group:"Reviews",accent:"secondary",period:true},
  {type:"risk_review",label:"Risk review",description:"Review position sizing, exposure and risk management.",measure:"reviews",group:"Reviews",accent:"warning",period:true,focus:"risk"},
  {type:"goal_review",label:"Goals review",description:"Assess progress toward the student’s trading goals.",measure:"reviews",group:"Reviews",accent:"success",period:true,focus:"goals"},
  {type:"private_session",label:"One-to-one sessions",description:"Individual coaching with your own agenda and meeting format.",measure:"sessions",count:"Sessions",group:"Sessions and support",accent:"secondary"},
  {type:"group_lesson",label:"Lessons",description:"Live or recorded teaching for individual students or groups.",measure:"lessons",count:"Lessons",group:"Sessions and support",accent:"info"},
  {type:"questions",label:"Student questions",description:"Offer a set allowance for questions and answers.",measure:"questions",count:"Questions per period",group:"Sessions and support",accent:"warning"},
  {type:"student_check_in",label:"Check-ins",description:"Scheduled progress updates between coaching reviews.",measure:"check_ins",count:"Check-ins",group:"Sessions and support",accent:"success"},
  {type:"review_follow_up",label:"Review follow-up",description:"Follow-up questions and feedback after a delivered review.",measure:"reviews",group:"Sessions and support",accent:"warning"},
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
  minutes: string;
  selection: "coach" | "student" | "coach_or_student";
  depth: "standard" | "trades_only" | "complete_day";
  followUpDays: string;
  focus: CoachingReviewFocus[];
  resources: string[];
  details: string;
  timeline: boolean;
};
export function initialOfferSettings(offer:Offer):OfferSettings {
  return {frequency:"weekly",coverage:offer.count&&offer.group==="Reviews"?"single_item":"previous_7_days",quantity:offer.type==="trade_review"?"10":"1",dueDays:"2",minutes:"",selection:"coach_or_student",depth:offer.type==="trading_day_review"?"trades_only":"standard",followUpDays:"3",focus:offer.focus?[offer.focus]:[],resources:offer.type==="performance_review"?["Analytics reports"]:[],details:"",timeline:offer.type!=="custom_task"};
}
export function offerSummary(offer:Offer,value:OfferSettings):string[] {
  const result=[value.timeline?FREQUENCIES[value.frequency]:"Flexible schedule"];
  if(offer.count){
    const units = {trades:["trade","trades"],trading_days:["trading day","trading days"],reviews:["review","reviews"],check_ins:["check-in","check-ins"],sessions:["session","sessions"],lessons:["lesson","lessons"],questions:["question","questions"],custom:["item","items"]} as const;
    result.push(`${value.quantity||"—"} ${units[offer.measure][Number(value.quantity)===1?0:1]}`);
  }
  if(offer.period&&value.timeline)result.push(PERIODS[value.coverage]);
  if(value.timeline)result.push(`Due within ${value.dueDays||"0"} ${Number(value.dueDays)===1?"day":"days"}`);
  if(offer.type==="trade_review")result.push(`Trades chosen by ${value.selection==="coach_or_student"?"coach or student":value.selection}`);
  if(offer.type==="trading_day_review")result.push(value.depth==="complete_day"?"Trades and trading-day Journal":"Trades only");
  if(offer.type==="review_follow_up")result.push(`${value.followUpDays} ${Number(value.followUpDays)===1?"day":"days"} of follow-up`);
  if(value.minutes)result.push(`${value.minutes} ${Number(value.minutes)===1?"minute":"minutes"}`);
  const labels:Partial<Record<CoachingReviewFocus,string>>={journal:"Journal notes and tags",rules:"Rules",risk:"Risk management",execution:"Trade execution",goals:"Goals",overall:"Overall feedback",next_steps:"Next steps"};
  result.push(...value.focus.filter(key=>key!==offer.focus).map(key=>labels[key]??key),...value.resources);
  return result;
}
