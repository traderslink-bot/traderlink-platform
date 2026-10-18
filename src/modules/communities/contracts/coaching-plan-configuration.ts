import type {TraderLinkCommunityCoachingItemType} from "./traderlink-community-platform-contracts";

export type CoachingPlanConfiguration=Readonly<{
  about:string;
  offers:Partial<Record<TraderLinkCommunityCoachingItemType,Readonly<{details:string;resources:readonly string[];includeDayJournal?:boolean;tradeCap?:Readonly<{basis:"per_day"|"per_review";quantity:number}>}>>>;
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
    if(fields.includeDayJournal!==undefined&&typeof fields.includeDayJournal!=="boolean")throw new Error("Invalid Journal sharing requirement");
    let tradeCap: {basis:"per_day"|"per_review";quantity:number}|undefined;
    if(fields.tradeCap!==undefined){const cap=fields.tradeCap as {basis:string;quantity:number};if(!cap||!["per_day","per_review"].includes(cap.basis)||!Number.isInteger(cap.quantity)||cap.quantity<1||cap.quantity>500)throw new Error("Choose a trade limit between 1 and 500.");tradeCap={basis:cap.basis as "per_day"|"per_review",quantity:cap.quantity};}
    offers[key as TraderLinkCommunityCoachingItemType]={details:fields.details,resources:[...new Set(fields.resources as string[])],...(fields.includeDayJournal!==undefined?{includeDayJournal:fields.includeDayJournal as boolean}:{}),...(tradeCap?{tradeCap}:{})};
  }
  return {about,offers};
}
