import { platformFailure } from "../database/platform-migration-contract";
import type Database from 'better-sqlite3';
import { evaluateMembershipFeature,hasPlatformMembershipFeature } from './platform-membership-access';
import { isWhopAiReviewEntitlementSchemaAvailable,WhopAiReviewEntitlementRepository } from '../billing/whop-ai-review-entitlement-repository';

/** New plan/add-on access and already-confirmed legacy subscriptions coexist.
 * This authorizes new work only; saved issued reviews remain account-scoped. */
export function hasAiReviewGenerationAccess(database:Database.Database,userId:string):boolean {
  const decision=evaluateMembershipFeature(database,userId,'ai.reviews');
  if(decision.ownerBypass||hasPlatformMembershipFeature(database,userId,'ai.reviews'))return true;
  return isWhopAiReviewEntitlementSchemaAvailable(database)&&new WhopAiReviewEntitlementRepository(database).readAccess(userId).state==='active';
}

export function assertAiReviewGenerationAccess(database:Database.Database,userId:string):void {
  if(!hasAiReviewGenerationAccess(database,userId))platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{reason:"membership_feature_required",feature:"ai.reviews"});
}
