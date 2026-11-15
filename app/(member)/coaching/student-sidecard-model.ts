import type {CoachingAgreement} from '@/src/modules/communities/contracts/coaching-agreements';
import type {IndependentStudentContextModel} from './student-context';

export type SidecardWork=Readonly<{workId:string;agreementId?:string|null;kind:string;status:string;dueAtUtc:string|null;data:Record<string,unknown>;questions?:readonly {questionId:string;body:string;answer:string|null}[]}>;
export type SidecardEnrollment=Readonly<{enrollmentId:string;planId?:string;planName:string;status:string;agreements:readonly CoachingAgreement[];studentContext?:IndependentStudentContextModel;work:readonly SidecardWork[]}>;
export type SidecardItem=Readonly<{enrollment:SidecardEnrollment;work:SidecardWork}>;
export type StudentSidecardSection='tasks'|'sessions'|'lessons'|'notes';
const STATUS:Readonly<Record<string,string>>={open:'Open',scheduled:'Scheduled',assigned:'Assigned',completed:'Completed',cancelled:'Cancelled'};
export function sidecardStatus(value:string){return STATUS[value]??'Status unavailable';}
export function sidecardWorkCategory(work:SidecardWork){
 if(work.data.serviceType==='questions')return 'Questions';
 if(work.kind==='check_in')return 'Check-in';
 if(work.kind==='follow_up'||work.data.serviceType==='review_follow_up')return 'Review follow-up';
 if(work.data.serviceType==='custom_coaching')return 'Custom coaching';
 return 'Task';
}
export function sidecardWorkTitle(work:SidecardWork,planName?:string){
 for(const value of [work.data.title,work.data.description])if(typeof value==='string'&&value.trim()&&value.trim()!==planName?.trim())return value.trim().split('\n')[0].slice(0,140);
 if(work.data.serviceType==='questions')return 'Questions';
 if(work.kind==='lesson')return Number.isSafeInteger(work.data.serviceUnitIndex)&&Number(work.data.serviceUnitIndex)>=0?`Lesson ${Number(work.data.serviceUnitIndex)+1}`:'Lesson';
 if(work.kind==='session')return Number.isSafeInteger(work.data.serviceUnitIndex)&&Number(work.data.serviceUnitIndex)>=0?`Session ${Number(work.data.serviceUnitIndex)+1}`:'Coaching session';
 return work.kind==='check_in'?'Check-in':work.kind==='follow_up'||work.data.serviceType==='review_follow_up'?'Review follow-up':'Coaching task';
}
export function sidecardItems(enrollments:readonly SidecardEnrollment[],section:Exclude<StudentSidecardSection,'notes'>):SidecardItem[]{
 return enrollments.flatMap(enrollment=>enrollment.work.filter(work=>section==='lessons'?work.kind==='lesson':section==='sessions'?work.kind==='session':!['lesson','session'].includes(work.kind)).map(work=>({enrollment,work}))).sort((a,b)=>(a.work.dueAtUtc??'9999').localeCompare(b.work.dueAtUtc??'9999')||a.work.workId.localeCompare(b.work.workId));
}
export function sessionBucket(work:SidecardWork,nowUtc:string):'upcoming'|'past'|'unscheduled'{return ['completed','cancelled'].includes(work.status)?'past':!work.dueAtUtc?'unscheduled':work.dueAtUtc<nowUtc?'past':'upcoming';}
export function lessonAccepted(enrollment:SidecardEnrollment,work:SidecardWork){return enrollment.agreements.some(agreement=>agreement.agreementId===work.agreementId&&Boolean(agreement.acceptedAtUtc)&&['accepted','superseded'].includes(agreement.status)&&agreement.terms.items.some(item=>item.planItemId===work.data.planItemId&&item.itemType==='group_lesson'));}
export function savedHttpsUrl(value:unknown):string|null{if(typeof value!=='string'||!value.trim())return null;try{const url=new URL(value);return url.protocol==='https:'&&Boolean(url.hostname)?url.href:null;}catch{return null;}}
export function lessonAccessOverview(enrollments:readonly SidecardEnrollment[]){
 const items=sidecardItems(enrollments,'lessons'),available:SidecardItem[]=[],history:SidecardItem[]=[],pending: {enrollment:SidecardEnrollment;items:SidecardItem[]}[]=[];
 for(const item of items){
  if(lessonAccepted(item.enrollment,item.work)&&['assigned','completed'].includes(item.work.status))available.push(item);
  else if(lessonAccepted(item.enrollment,item.work)&&['open','scheduled'].includes(item.work.status)){
   let group=pending.find(row=>row.enrollment.enrollmentId===item.enrollment.enrollmentId);if(!group){group={enrollment:item.enrollment,items:[]};pending.push(group);}group.items.push(item);
  }else history.push(item);
 }
 return {available,pending,history};
}
export function sidecardTime(value:string|null){return value?`${new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'}).format(new Date(value))} ET`:'';}
export function easternLocalValue(utc:string|null):string{
 if(!utc||!Number.isFinite(Date.parse(utc)))return '';
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(utc));
 const part=(type:string)=>parts.find(p=>p.type===type)?.value??'';return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}
/** Both candidate offsets are checked against IANA Eastern rules, never assumed. */
export function easternTimeCandidates(local:string):readonly {atUtc:string;label:string}[]{
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(local))return [];
 const wall=Date.parse(`${local}:00.000Z`);if(!Number.isFinite(wall)||new Date(wall).toISOString().slice(0,16)!==local)return [];
 return [240,300].map(minutes=>({atUtc:new Date(wall+minutes*60000).toISOString(),label:minutes===240?'EDT (UTC−04:00)':'EST (UTC−05:00)'})).filter(candidate=>easternLocalValue(candidate.atUtc)===local);
}
export function selectedEasternTime(local:string,chosenUtc=''):string|null{
 if(!local)return null;const candidates=easternTimeCandidates(local);
 if(candidates.length===0)throw new Error('Choose a valid Eastern date and time. This time may fall inside the daylight-saving change.');
 if(candidates.length>1&&!candidates.some(candidate=>candidate.atUtc===chosenUtc))throw new Error('This Eastern time occurs twice. Choose EDT or EST.');
 return candidates.length===1?candidates[0].atUtc:chosenUtc;
}
/** Restoring the displayed baseline restores its actual instant, including fold/precision. */
export function restoredEasternTime(local:string,chosenUtc:string,originalUtc:string|null):string|null{
 if(!local)return null;
 if(originalUtc&&local===easternLocalValue(originalUtc)){
  const instant=Date.parse(originalUtc),minute=Math.floor(instant/60000)*60000,candidates=easternTimeCandidates(local),original=candidates.find(row=>Date.parse(row.atUtc)===minute);
  if(original&&(chosenUtc===''||chosenUtc===originalUtc||chosenUtc===original.atUtc))return originalUtc;
  if(original&&candidates.some(row=>row.atUtc===chosenUtc))return new Date(Date.parse(chosenUtc)+instant-minute).toISOString();
 }
 return selectedEasternTime(local,chosenUtc);
}
export function committedNotesRevision(expectedRevision:number,savedBody:string,submittedBody:string){return expectedRevision+(expectedRevision>0&&savedBody===submittedBody.trim()?0:1);}
