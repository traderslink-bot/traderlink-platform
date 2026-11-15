import type Database from 'better-sqlite3';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import {requireCoachCommercialAccess} from './coaching-commercial-access';
import {isMailboxUuid} from '../contracts/independent-coaching-messages';
import type {SidecardWork} from '@/app/(member)/coaching/student-sidecard-model';

export type AssignedLessonContext=Readonly<{studentId:string;studentName:string;enrollmentId:string;planId:string;planName:string;enrollmentStatus:string;agreementId:string|null;agreementStatus:string|null;acceptedService:boolean;canManage:boolean;work:SidecardWork}>;
export function readIndependentAssignedLesson(database:Database.Database,input:{actorUserId:string;planId:string;enrollmentId:string;workId:string;atUtc:string}):AssignedLessonContext{
 if(![input.planId,input.enrollmentId,input.workId].every(isMailboxUuid))throw new Error('This lesson assignment is unavailable.');
 const row=database.prepare(`SELECT w.work_id,w.agreement_id,w.kind,w.status,w.data_json,w.due_at_utc,e.enrollment_id,e.plan_id,e.student_user_id,e.status enrollment_status,u.display_name student_name,
 a.status agreement_status,a.accepted_at_utc,a.terms_json FROM traderlink_coaching_work w
 JOIN traderlink_coaching_enrollments e ON e.enrollment_id=w.enrollment_id JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id
 JOIN platform_users u ON u.user_id=e.student_user_id LEFT JOIN traderlink_coaching_accepted_terms a ON a.agreement_id=w.agreement_id AND a.enrollment_id=e.enrollment_id
 WHERE w.work_id=? AND e.enrollment_id=? AND e.plan_id=? AND c.coach_user_id=? AND w.kind='lesson'`).get(input.workId,input.enrollmentId,input.planId,input.actorUserId) as {work_id:string;agreement_id:string|null;kind:string;status:string;data_json:string;due_at_utc:string|null;enrollment_id:string;plan_id:string;student_user_id:string;enrollment_status:string;student_name:string;agreement_status:string|null;accepted_at_utc:string|null;terms_json:string|null}|undefined;
 if(!row)throw new Error('This lesson assignment is unavailable.');
 requireCoachCommercialAccess(database,{coachUserId:input.actorUserId,scope:'platform',atUtc:input.atUtc});
 const data=JSON.parse(row.data_json) as Record<string,unknown>,terms=row.terms_json?JSON.parse(row.terms_json) as {planName?:string;items?:readonly {planItemId:string;itemType:string}[]}:null;
 const acceptedService=Boolean(row.accepted_at_utc&&['accepted','superseded'].includes(row.agreement_status??'')&&terms?.items?.some(item=>item.planItemId===data.planItemId&&item.itemType==='group_lesson'));
 return {studentId:row.student_user_id,studentName:row.student_name,enrollmentId:row.enrollment_id,planId:row.plan_id,planName:terms?.planName??'Coaching plan',enrollmentStatus:row.enrollment_status,agreementId:row.agreement_id,agreementStatus:row.agreement_status,acceptedService,canManage:row.enrollment_status==='active'&&acceptedService,work:{workId:row.work_id,agreementId:row.agreement_id,kind:row.kind,status:row.status,data,dueAtUtc:row.due_at_utc}};
}
export function updateIndependentAssignedLesson(database:Database.Database,input:{actorUserId:string;planId:string;enrollmentId:string;workId:string;atUtc:string;data:unknown;status:string;dueAtUtc:string|null}){
 const original=readIndependentAssignedLesson(database,input);
 if(!original.canManage)throw new Error('Only an active, accepted coaching assignment can be changed. Existing history is preserved.');
 if(!input.data||typeof input.data!=='object'||Array.isArray(input.data)||Object.entries(input.data).some(([key,value])=>!['title','description','url'].includes(key)||typeof value!=='string'||value.length>20000))throw new Error('Check the lesson details.');
 if(!['open','scheduled','assigned','completed','cancelled'].includes(input.status))throw new Error('Choose a valid lesson status.');
 new IndependentCoachingRepository(database).updateWork({workId:original.work.workId,actorUserId:input.actorUserId,data:input.data as Record<string,unknown>,status:input.status as Parameters<IndependentCoachingRepository['updateWork']>[0]['status'],dueAtUtc:input.dueAtUtc,atUtc:input.atUtc});
 return {};
}
