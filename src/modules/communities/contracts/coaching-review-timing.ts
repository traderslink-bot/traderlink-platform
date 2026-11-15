import {type DeliveryDayCount} from './coaching-delivery-calendar';
import type {TraderLinkCommunityTradeReview as Review} from './traderlink-community-platform-contracts';
export type ReviewTiming={availableAtUtc:string|null;awaitingSubmission:boolean;submittedAtUtc:string|null;turnaroundDays:number|null;deliveryDayCount?:DeliveryDayCount;earlySubmissionAllowed?:boolean;scheduled?:boolean;tradingTimezone?:string};
const boundaries=new Map<string,string>();
/** First instant after the inclusive final trading date, including DST changes. */
export function periodAvailableAt(end:string|null|undefined,timezone='America/New_York'){
 if(!end)return null;
 const next=new Date(Date.parse(`${end}T00:00:00.000Z`)+86400000).toISOString();if(timezone==='UTC')return next;
 const key=end+'|'+timezone,cached=boundaries.get(key);if(cached)return cached;
 const target=next.slice(0,10),formatter=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'});
 const localDate=(at:number)=>{const parts=formatter.formatToParts(new Date(at));return ['year','month','day'].map(type=>parts.find(p=>p.type===type)!.value).join('-');};
 let low=Date.parse(next)-36*3600000,high=Date.parse(next)+36*3600000;
 while(low<high){const middle=Math.floor((low+high)/2);if(localDate(middle)<target)low=middle+1;else high=middle;}
 const value=new Date(low).toISOString();if(boundaries.size>=128)boundaries.delete(boundaries.keys().next().value!);boundaries.set(key,value);return value;
}
/** Students may finalize today's closed trades explicitly; future trading dates remain unavailable. */
export function selectedTradingDayAvailableAt(day:string|null|undefined,timezone='America/New_York'){
 if(!day)return null;const previous=new Date(Date.parse(`${day}T00:00:00Z`)-86400000).toISOString().slice(0,10);return periodAvailableAt(previous,timezone);
}
export function reviewTimingProblem(review:Pick<Review,'deliveryState'|'status'|'periodEnd'|'dueAtUtc'|'timing'>,now:string){
 if(review.deliveryState!=='draft'||review.status==='cancelled')return null;
 if(review.timing?.awaitingSubmission)return 'Awaiting student submission';
 const available=review.timing?.earlySubmissionAllowed?review.timing.availableAtUtc:review.timing?.availableAtUtc??periodAvailableAt(review.periodEnd);
 if(available&&now<available)return `Available to start ${new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'UTC'}).format(new Date(available))} UTC`;
 if(!review.dueAtUtc)return 'Deadline missing';
 return null;
}
export const reviewDeadline=(review:Pick<Review,'deliveryState'|'dueAtUtc'|'followUpDueAtUtc'>)=>review.deliveryState==='follow_up'?review.followUpDueAtUtc:review.dueAtUtc;
export function submissionDeadline(atUtc:string,days:number,count:DeliveryDayCount='calendar'){if(!Number.isInteger(days)||days<1||days>366)throw new Error('Set a review turnaround between 1 and 366 days.');const at=new Date(atUtc);if(!Number.isFinite(at.getTime()))throw new Error('Choose a valid submission time.');const weekday=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short'});for(let remaining=days;remaining>0;){at.setTime(at.getTime()+86400000);if(count==='calendar'||!['Sat','Sun'].includes(weekday.format(at)))remaining--;}return at.toISOString();}
