import type Database from 'better-sqlite3';
import {evaluateMembershipFeature} from '../../platform/server/membership/platform-membership-access';

/** Community platform access subscription only; never evidence that coach service was paid. */
export function requireStudentPlatformCoachingAccess(database:Database.Database,studentUserId:string,atUtc:string):void{
 const decision=evaluateMembershipFeature(database,studentUserId,'coaching.access',undefined,atUtc);
 if(!decision.allowed)throw new Error('Your TraderLink plan needs coaching access. View Plans to add it.');
}

/** Outside coaching is open during beta. This deliberately does not alter the
 * existing Community Coaching membership policy above. */
export function requireStandaloneStudentCoachingAccess(database:Database.Database,studentUserId:string,atUtc:string):void{
 void database;void studentUserId;void atUtc;
}
