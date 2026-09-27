import type {TraderLinkCommunityCoachingPlanItem} from "./traderlink-community-platform-contracts";
import type {CoachingPlanConfiguration} from "./coaching-plan-configuration";

export type CoachingAgreementTerms=Readonly<{
  planId:string;planRevision:number;planName:string;description:string;
  priceAmountMinor:number;currency:string;billingCadence:string;paymentInstructions:string;
  requiredDiscordRoleId:string|null;autoArchiveAfterDays:number|null;
  items:readonly TraderLinkCommunityCoachingPlanItem[];builderConfig?:CoachingPlanConfiguration;
  startDate:string|null;customIntervalDays:number|null;dueTimeUtc:string;
  coverageDays?:Readonly<Record<string,number>>;
}>;
export type CoachingAgreement=Readonly<{
  agreementId:string;relationshipId:string;revision:number;
  status:"proposed"|"accepted"|"superseded"|"withdrawn";
  terms:CoachingAgreementTerms;proposedAtUtc:string;acceptedAtUtc:string|null;
}>;

const DAY=86400000;
export function coachingDate(value:string):string{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw new Error("Choose a valid coaching date.");
  return value;
}

/** Review coverage is independent of the work's repeating schedule and deadline. */
export function coachingReviewCoverage(terms:CoachingAgreementTerms,item:TraderLinkCommunityCoachingPlanItem,period:{start:string;end:string},previousEnd?:string|null):{start:string;end:string}{
  let start=period.start,end=period.end;
  if(item.coveragePeriod==="previous_7_days")start=addCoachingDays(end,-6);
  if(item.coveragePeriod==="calendar_week"){
    end=addCoachingDays(end,-new Date(end+"T00:00:00.000Z").getUTCDay());
    start=addCoachingDays(end,-6);
  }
  if(item.coveragePeriod==="previous_month"){
    const next=new Date(addCoachingDays(end,1)+"T00:00:00.000Z");
    end=new Date(Date.UTC(next.getUTCFullYear(),next.getUTCMonth(),0)).toISOString().slice(0,10);
    start=end.slice(0,8)+"01";
  }
  if(item.coveragePeriod==="since_last_review"&&previousEnd&&previousEnd<end)start=addCoachingDays(previousEnd,1);
  if(item.coveragePeriod==="custom"){
    const days=terms.coverageDays?.[item.planItemId];
    if(!days||!Number.isInteger(days)||days<1||days>366)throw new Error("Set the number of days covered by this review.");
    start=addCoachingDays(end,1-days);
  }
  return {start,end};
}
export function addCoachingDays(value:string,days:number):string{return new Date(Date.parse(coachingDate(value))+days*DAY).toISOString().slice(0,10);}
export function coachingPeriod(terms:CoachingAgreementTerms,item:TraderLinkCommunityCoachingPlanItem,index:number):{start:string;end:string;dueAtUtc:string}|null{
  if(!terms.startDate||!item.timelineEnabled||index<0||!Number.isInteger(index)||(item.frequency==="once"&&index>0))return null;
  const anchor=new Date(coachingDate(terms.startDate)+"T00:00:00.000Z");
  const boundary=(offset:number)=>{
    if(item.frequency==="monthly"){
      const month=new Date(Date.UTC(anchor.getUTCFullYear(),anchor.getUTCMonth()+offset,1));
      const last=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();
      return new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),Math.min(anchor.getUTCDate(),last))).toISOString().slice(0,10);
    }
    const span=item.frequency==="weekly"?7:item.frequency==="every_two_weeks"?14:item.frequency==="custom"?terms.customIntervalDays:1;
    if(!span||!Number.isInteger(span)||span<1||span>366)throw new Error("Set a custom interval between 1 and 366 days.");
    return addCoachingDays(terms.startDate!,offset*span);
  };
  const start=boundary(index),end=addCoachingDays(boundary(index+1),-1);
  return {start,end,dueAtUtc:addCoachingDays(end,item.dueOffsetDays)+"T"+terms.dueTimeUtc+":00.000Z"};
}
