import type Database from 'better-sqlite3';
import {CoachingDirectPaymentRepository} from './coaching-direct-payment-repository';
import {IndependentCoachingRepository} from './independent-coaching-repository';

/** Called after authoritative reconciliation, never from a browser's payment redirect. */
export function fulfillIndependentCoachingPurchase(database:Database.Database,purchaseId:string,atUtc:string):readonly string[]{
 return database.transaction(()=>{
  const financial=new CoachingDirectPaymentRepository(database),purchase=financial.readPurchase(purchaseId);
  if(!purchase)throw new Error('Identify the original coaching purchase.');
  const funding=database.prepare('SELECT payment_id,recorded_at_utc FROM traderlink_coaching_direct_purchase_funding WHERE purchase_id=?').get(purchaseId) as {payment_id:string;recorded_at_utc:string}|undefined;
  if(!funding||funding.recorded_at_utc>atUtc)throw new Error('Verify payment before creating purchased coaching work.');
  const coaching=new IndependentCoachingRepository(database),enrollment=coaching.enrollment(purchase.agreement.relationshipId,purchase.coachUserId);
  if(enrollment.coach_user_id!==purchase.coachUserId||enrollment.student_user_id!==purchase.studentUserId)throw new Error('Payment does not belong to this coaching relationship.');
  const agreement=coaching.agreements(enrollment.enrollment_id,purchase.coachUserId).find(a=>a.agreementId===purchase.agreement.agreementId);
  if(!agreement||!agreement.acceptedAtUtc||agreement.revision!==purchase.agreement.revision||JSON.stringify(agreement.terms)!==JSON.stringify(purchase.agreement.terms))throw new Error('Use the original accepted terms for purchased coaching work.');
  // Superseding a plan does not erase already purchased obligations. Refunds remain
  // separate financial history; this idempotent bridge does not invent refund policy.
  return coaching.createAgreedWork({enrollmentId:enrollment.enrollment_id,agreementId:agreement.agreementId,actorUserId:purchase.coachUserId,
   fulfillmentKey:`purchase:${purchase.purchaseId}`,occurrences:Object.fromEntries(purchase.allocations.map(a=>[a.planItemId,a.occurrences])),atUtc});
 }).immediate();
}
