import {coachingDate} from './coaching-agreements';
import {WORK_KINDS} from './coaching-work-model';
export function coachingEasternDay(atUtc:string):string{return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(atUtc));}
export function coachingCalendarDays(anchor:string,view:'week'|'month'):readonly string[]{
 coachingDate(anchor);
 const shift=(day:string,count:number)=>new Date(Date.parse(`${day}T12:00:00.000Z`)+count*86400000).toISOString().slice(0,10);
 const monday=(day:string)=>shift(day,-((new Date(`${day}T12:00:00.000Z`).getUTCDay()+6)%7));
 if(view==='week'){const first=monday(anchor);return Array.from({length:7},(_,index)=>shift(first,index));}
 const first=monday(anchor.slice(0,8)+'01'),date=new Date(`${anchor}T12:00:00.000Z`),last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).toISOString().slice(0,10),end=shift(monday(last),6);
 return Array.from({length:Math.round((Date.parse(end)-Date.parse(first))/86400000)+1},(_,index)=>shift(first,index));
}
export function shiftCoachingCalendar(anchor:string,view:'week'|'month',direction:-1|1):string{
 coachingDate(anchor);const date=new Date(`${anchor}T12:00:00.000Z`);
 if(view==='week')date.setUTCDate(date.getUTCDate()+direction*7);
 else{date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+direction);}
 return date.toISOString().slice(0,10);
}

/** Preserve every due item, including review kinds from existing agreements. */
export function coachingCalendarWorkGroups(work:readonly {kind:string;reviewId:string|null}[]):readonly {label:string;count:number}[]{
 const labels:Record<string,string>={...WORK_KINDS,check_in:'Check-ins',follow_up:'Follow-ups'};
 const counts=new Map<string,number>();
 for(const row of work){
  const kind=Object.hasOwn(labels,row.kind)?row.kind:row.reviewId!==null?'review':'task';
  counts.set(kind,(counts.get(kind)??0)+1);
 }
 return Object.entries(labels).map(([kind,label])=>({label,count:counts.get(kind)??0})).filter(group=>group.count>0);
}
