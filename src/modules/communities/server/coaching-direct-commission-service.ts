import type Database from 'better-sqlite3';
import {CoachingDirectPaymentRepository} from './coaching-direct-payment-repository';
import {normalizeCoachingCommissionLedgerPage} from './coaching-whop-commission-ledger';
import {reconcileCoachingCommission,type CoachingCommissionEntry} from '../contracts/coaching-commission-reconciliation';
import {coachingCommissionMinor} from '../contracts/coaching-direct-purchase';

/** Parent ledger evidence is independent of student payment and coach delivery. */
export async function reconcileCoachingPurchaseCommission(input:{purchaseId:string;paymentId:string;platformAccountId:string;withDatabase:<T>(operation:(database:Database.Database)=>T)=>T;retrieveActivity:(accountId:string,paymentId:string,after?:string)=>Promise<Record<string,unknown>>;now:()=>string;assertCommit?:(database:Database.Database,atUtc:string)=>void}){
 const purchase=input.withDatabase(db=>new CoachingDirectPaymentRepository(db).readPurchase(input.purchaseId));
 if(!purchase)throw new Error('Identify the original coaching purchase.');
 const entries:CoachingCommissionEntry[]=[],cursors=new Set<string>();let after:string|undefined;
 for(let pageNumber=0;pageNumber<100;pageNumber++){
  const page=normalizeCoachingCommissionLedgerPage({platformAccountId:input.platformAccountId,paymentId:input.paymentId,page:await input.retrieveActivity(input.platformAccountId,input.paymentId,after)});
  entries.push(...page.entries);
  if(!page.nextCursor){after=undefined;break;}
  if(cursors.has(page.nextCursor))throw new Error('Commission ledger pagination repeated a cursor.');cursors.add(page.nextCursor);after=page.nextCursor;
 }
 if(after)throw new Error('Commission ledger scan is incomplete.');
 const atUtc=input.now();if(!Number.isFinite(Date.parse(atUtc))||new Date(atUtc).toISOString()!==atUtc)throw new Error('Use a canonical commission observation time.');
 return input.withDatabase(db=>db.transaction(()=>{
  input.assertCommit?.(db,atUtc);
  const payment=new CoachingDirectPaymentRepository(db).readLatestPayments(input.purchaseId).find(row=>row.paymentId===input.paymentId);
  if(!payment)throw new Error('Identify the observed service payment before reconciling commission.');
  const expectedReversedMinor=payment.state==='paid'||payment.state==='unpaid'?0:payment.state==='refunded'?coachingCommissionMinor(purchase.price.amountMinor,purchase.commission.basisPoints):null;
  // Partial refunds, tax allocations, disputes and FX are not guessed. Exact
  // same-currency parent credits/reversals can still be recorded for follow-up.
  const result=reconcileCoachingCommission({paymentId:input.paymentId,platformAccountId:input.platformAccountId,currency:purchase.price.currency,commissionBaseMinor:payment.state==='unpaid'?0:purchase.price.amountMinor,basisPoints:purchase.commission.basisPoints,expectedReversedMinor,entries});
  for(const entry of entries){
   const prior=db.prepare('SELECT payment_id,currency,amount_minor,kind FROM traderlink_coaching_commission_entries WHERE environment=? AND platform_account_id=? AND entry_id=?').get(purchase.environment,input.platformAccountId,entry.entryId) as {payment_id:string;currency:string;amount_minor:number;kind:string}|undefined;
   if(prior&&(prior.payment_id!==entry.paymentId||prior.currency!==entry.currency||prior.amount_minor!==entry.amountMinor||prior.kind!==entry.kind))throw new Error('Conflicting immutable commission ledger entry.');
   if(!prior)db.prepare('INSERT INTO traderlink_coaching_commission_entries VALUES(?,?,?,?,?,?,?,?)').run(purchase.environment,input.platformAccountId,entry.entryId,entry.paymentId,entry.currency,entry.amountMinor,entry.kind,atUtc);
  }
  db.prepare('INSERT INTO traderlink_coaching_commission_checks(purchase_id,payment_id,platform_account_id,result_json,checked_at_utc) VALUES(?,?,?,?,?)').run(input.purchaseId,input.paymentId,input.platformAccountId,JSON.stringify(result),atUtc);
  return result;
 }).immediate());
}
