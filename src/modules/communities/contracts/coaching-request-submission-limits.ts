export type RequestSubmissionLimits=Readonly<{perPeriod:number;perDay?:number}>;
export function requestSubmissionLimits(value:unknown):RequestSubmissionLimits{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Choose the trade submission limits.');
 const raw=value as Record<string,unknown>,valid=(n:unknown)=>typeof n==='number'&&Number.isInteger(n)&&n>=1&&n<=500;
 if(!valid(raw.perPeriod)||raw.perDay!==undefined&&(!valid(raw.perDay)||(raw.perDay as number)>(raw.perPeriod as number)))throw new Error('Set the number of trade reviews from 1 to 500 and an optional daily maximum no higher than that number.');
 return {perPeriod:raw.perPeriod as number,...(raw.perDay===undefined?{}:{perDay:raw.perDay as number})};
}
export function submissionDate(at:string){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));}
export function submissionPeriod(at:string,frequency:string,anchor:string,customDays?:number|null){
 const day=submissionDate(at),stamp=Date.parse(day),days=86400000;
 if(frequency==='once')return {start:'0001-01-01',end:'9999-12-31'};
 if(frequency==='monthly'){const date=new Date(stamp);return {start:day.slice(0,8)+'01',end:new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).toISOString().slice(0,10)};}
 const span=frequency==='weekly'?7:frequency==='every_two_weeks'?14:customDays;
 if(!span||!Number.isInteger(span)||span<1||span>366)throw new Error('Choose the allowance renewal period.');
 let start:number;
 if(frequency==='weekly')start=stamp-((new Date(stamp).getUTCDay()+6)%7)*days;
 else {const base=Date.parse(anchor);if(!Number.isFinite(base))throw new Error('The allowance start date is missing.');start=base+Math.floor((stamp-base)/(span*days))*span*days;}
 return {start:new Date(start).toISOString().slice(0,10),end:new Date(start+(span-1)*days).toISOString().slice(0,10)};
}
/** A student-safe rejection for an otherwise valid coaching request. */
export class CoachingSubmissionLimitError extends Error {
 constructor(readonly limit:'daily'|'period'|'pack',message:string){super(message);this.name='CoachingSubmissionLimitError';}
}
export function requireSubmissionAllowance(limits:RequestSubmissionLimits,quantity:number,at:string,period:{start:string;end:string},history:readonly {at:string;quantity:number;submittedQuantity?:number}[],format?:'recurring'|'pack'){
 if(!Number.isInteger(quantity)||quantity<1)throw new Error('Choose at least one trade.');
 const today=submissionDate(at);let used=0,daily=0;
 for(const item of history){const date=submissionDate(item.at);if(date>=period.start&&date<=period.end)used+=item.quantity;if(date===today)daily+=item.submittedQuantity??item.quantity;}
 if(used+quantity>limits.perPeriod){const remaining=Math.max(0,limits.perPeriod-used);if(format==='pack')throw new CoachingSubmissionLimitError('pack',remaining?`This pack has ${remaining} ${remaining===1?'trade review':'trade reviews'} remaining.`:'All trade reviews in this pack have been used.');throw new CoachingSubmissionLimitError('period',`This submission exceeds ${format==='recurring'?'the trade reviews available for this period':'the period allowance'}. ${remaining} ${remaining===1?'trade remains':'trades remain'}.`);}
 if(limits.perDay!==undefined&&daily+quantity>limits.perDay){const remaining=Math.max(0,limits.perDay-daily);throw new CoachingSubmissionLimitError('daily',remaining?`This submission exceeds the daily limit. You can submit ${remaining} more ${remaining===1?'trade':'trades'} today.`:'You’ve reached the daily limit. You can submit more trades tomorrow if you still have reviews available.');}
}

export function submissionAllowanceLabel(quantity:number,frequency:string){
 const period:Record<string,string>={weekly:'per week',every_two_weeks:'every two weeks',monthly:'per month',once:'in total',custom:'per agreed period'};
 return `${quantity} ${quantity===1?'trade':'trades'} ${period[frequency]??'per period'}`;
}

/** New recurring offers renew from the agreed service start, while legacy offers keep their recorded rules. */
export function submissionPeriodForOffer(at:string,frequency:string,anchor:string,customDays:number|null|undefined,format?:'recurring'|'pack'){
 if(format==='pack')return submissionPeriod(at,'once',anchor);
 if(format!=='recurring')return submissionPeriod(at,frequency,anchor,customDays);
 const today=submissionDate(at),day=86400000,base=Date.parse(anchor),stamp=Date.parse(today);
 if(!Number.isFinite(base))throw new Error('Set the service start date.');
 if(today<anchor)throw new Error(`Your trade reviews start on ${anchor}.`);
 if(frequency==='weekly'||frequency==='every_two_weeks'){
  const span=frequency==='weekly'?7:14,start=base+Math.floor((stamp-base)/(span*day))*span*day;
  return {start:new Date(start).toISOString().slice(0,10),end:new Date(start+(span-1)*day).toISOString().slice(0,10)};
 }
 if(frequency==='monthly'){
  const first=new Date(base),now=new Date(stamp),anchorDay=first.getUTCDate();
  const boundary=(offset:number)=>{const month=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+offset,1)),last=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();return Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),Math.min(anchorDay,last));};
  let index=(now.getUTCFullYear()-first.getUTCFullYear())*12+now.getUTCMonth()-first.getUTCMonth();if(boundary(index)>stamp)index--;
  return {start:new Date(boundary(index)).toISOString().slice(0,10),end:new Date(boundary(index+1)-day).toISOString().slice(0,10)};
 }
 return submissionPeriod(at,frequency,anchor,customDays);
}
