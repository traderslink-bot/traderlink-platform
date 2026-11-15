import type Database from 'better-sqlite3';
import type {CoachingCommercialPolicy} from '../contracts/coaching-commercial-policy';
import {readCoachStudentCapacitySnapshot} from '../../platform/server/membership/coach-student-capacity-reader';
import {coachStudentAdmissionFacts,evaluateCoachNewStudentAdmission,type CoachStudentRelationshipFact} from '../../platform/contracts/coach-student-capacity';
import {readCoachSubscriptionQualification} from '../../platform/server/membership/coach-subscription-qualification';
/** Shared new-admission gate. Call before activating a relationship, inside the
 * same immediate transaction; never wrap an existing work/read/history path. */
export function requireCoachStudentAdmission(database:Database.Database,input:{coachUserId:string;studentUserId:string;policy:CoachingCommercialPolicy;subscriptionRequired?:boolean;atUtc:string}):void{
 if(!database.inTransaction)throw new Error('Student admission requires an atomic transaction.');
 if(!input.policy.coachSubscriptionRequired)return;
 // Only the current scoped commercial gate may waive subscription qualification.
 // Retain the original policy below so exemption never skips capacity checks.
 if(input.subscriptionRequired!==false&&!readCoachSubscriptionQualification(database,{coachUserId:input.coachUserId,atUtc:input.atUtc}).qualified)throw new Error('The coach needs a TraderLink coach account subscription for this arrangement.');
 const snapshot=readCoachStudentCapacitySnapshot(database,{coachUserId:input.coachUserId,atUtc:input.atUtc});if(!snapshot.enabled)return;
 const facts:CoachStudentRelationshipFact[]=[];
 if(database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_coaching_enrollments'").get())facts.push(...database.prepare(`SELECT e.student_user_id studentUserId,c.coach_user_id coachUserId,e.status FROM traderlink_coaching_enrollments e JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id WHERE c.coach_user_id=?`).all(input.coachUserId) as CoachStudentRelationshipFact[]);
 if(database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_community_coaching_relationships'").get())facts.push(...database.prepare('SELECT student_user_id studentUserId,coach_user_id coachUserId,status FROM traderlink_community_coaching_relationships WHERE coach_user_id=?').all(input.coachUserId) as CoachStudentRelationshipFact[]);
 const decision=evaluateCoachNewStudentAdmission(snapshot,coachStudentAdmissionFacts(input.coachUserId,input.studentUserId,facts));
 if(decision.allowed===false)throw new Error('This coach has reached their student capacity. Ask the coach to add capacity before accepting.');
 if(decision.allowed===null)throw new Error('Student capacity has not been configured for this coach.');
}
