import type Database from 'better-sqlite3';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import {readCoachingCommercialPolicy} from './coaching-commercial-policy';
import {requireCoachStudentAdmission} from './coaching-coach-student-admission';
/** Runs inside acceptance's immediate transaction; never gates existing work. */
export function checkIndependentCoachStudentAdmission(database:Database.Database,input:{enrollmentId:string;actorUserId:string;atUtc:string;agreementId?:string}):void{
 const repository=new IndependentCoachingRepository(database),enrollment=repository.enrollment(input.enrollmentId,input.actorUserId);
 const proposed=input.agreementId?repository.agreements(input.enrollmentId,input.actorUserId).find(a=>a.agreementId===input.agreementId):null;
 const policy=proposed?.terms.commercialPolicy??readCoachingCommercialPolicy(database,{scope:'platform',coachUserId:enrollment.coach_user_id});
 requireCoachStudentAdmission(database,{coachUserId:enrollment.coach_user_id,studentUserId:enrollment.student_user_id,policy,atUtc:input.atUtc});
}
