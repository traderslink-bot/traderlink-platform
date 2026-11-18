import {nextReviewMonday} from './coaching-delivery-calendar';
import {coachingPeriod,type CoachingAgreementTerms} from './coaching-agreements';
import {submissionDate,submissionPeriod} from './coaching-request-submission-limits';

/** The same start-date rule applies before proposing and when accepting. */
export function requireFutureCoachingReviewWeek(terms:CoachingAgreementTerms,atUtc:string):void{
 if(terms.items.some(item=>item.timelineEnabled&&terms.builderConfig?.offers[item.itemType]?.weeklySchedule==='monday'&&['weekly','every_two_weeks'].includes(item.frequency)&&(coachingPeriod(terms,item,0)?.start??'9999')<submissionDate(atUtc)))throw new Error('The first review week has already started. Ask your coach for an updated agreement with a future start date.');
}

/** Resolve only choices explicitly offered by the coach. Saved accepted history is never reinterpreted. */
export function chooseStudentReviewSchedules(terms:CoachingAgreementTerms,choices:Readonly<Record<string,unknown>>={},atUtc?:string):CoachingAgreementTerms{
 const offers={...terms.builderConfig?.offers};let changed=false;
 const items=terms.items.map(item=>{
  const offer=offers[item.itemType];if(offer?.reviewSchedule!=='student_choice')return item;
  const choice=choices[item.planItemId];if(choice!=='scheduled'&&choice!=='on_request')throw new Error('Choose scheduled reviews or reviews on request before accepting.');
  if(choice==='scheduled'&&!terms.startDate)throw new Error('Your coach needs to set a service start date before you can choose scheduled reviews.');
  changed=true;offers[item.itemType]={...offer,reviewSchedule:choice};
  return {...item,timelineEnabled:choice==='scheduled',...(choice==='on_request'?{selectionMode:'student' as const}:{})};
 });
 const result=changed?{...terms,items,...(atUtc&&items.every(item=>!item.timelineEnabled)?{startDate:submissionDate(atUtc)}:{}),builderConfig:{...terms.builderConfig!,offers}}:terms;
 if(atUtc)requireFutureCoachingReviewWeek(result,atUtc);
 return result;
}

/** Give new scheduled offers an explicit start date before showing their agreement. */
export function withTradeReviewStartDate(terms:CoachingAgreementTerms,atUtc:string):CoachingAgreementTerms{
 if(terms.startDate&&(!terms.items.some(item=>terms.builderConfig?.offers[item.itemType]?.weeklySchedule==='monday')||terms.startDate>=submissionDate(atUtc)))return terms;
 const item=terms.items.find(item=>item.timelineEnabled&&(terms.builderConfig?.offers[item.itemType]?.weeklySchedule==='monday'||item.itemType==='trade_review'&&terms.builderConfig?.offers.trade_review?.reviewSchedule));
 if(!item)return terms;
 const today=submissionDate(atUtc),frequency=item.frequency==='every_two_weeks'?'weekly':item.frequency;
 const startDate=terms.builderConfig?.offers[item.itemType]?.weeklySchedule==='monday'?(frequency==='weekly'?nextReviewMonday(today):today):submissionPeriod(atUtc,frequency,today,terms.customIntervalDays).start;
 return {...terms,startDate};
}

export function validateTradeReviewOffer(terms:{items:readonly Pick<CoachingAgreementTerms['items'][number],'itemType'|'frequency'|'timelineEnabled'|'selectionMode'|'quantity'>[];builderConfig?:CoachingAgreementTerms['builderConfig']}){
 for(const item of terms.items){
  const offer=terms.builderConfig?.offers[item.itemType];if(item.itemType!=='trade_review'||!offer?.tradeReviewFormat)continue;
  const pack=offer.tradeReviewFormat==='pack',request=offer.reviewSchedule==='on_request';
  if(pack&&(item.frequency!=='once'||item.timelineEnabled||!request))throw new Error('A Trade Review Pack has a fixed quantity and uses reviews on request.');
  if(!pack&&!['weekly','every_two_weeks','monthly'].includes(item.frequency))throw new Error('Choose Weekly, Every two weeks or Monthly for recurring trade reviews.');
  if(!offer.reviewSchedule||item.timelineEnabled===request)throw new Error('The review schedule does not match this offer.');
  if(request&&item.selectionMode!=='student')throw new Error('For reviews on request, the student chooses the trades.');
  if((request||offer.reviewSchedule==='student_choice')&&offer.submissionLimits?.perPeriod!==item.quantity)throw new Error('Set the trade limit to match the number of reviews offered.');
 }
}
