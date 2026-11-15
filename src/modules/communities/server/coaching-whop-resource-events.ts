import type Database from 'better-sqlite3';
import type {CoachingWhopEvent} from './coaching-whop-event';
import {CoachingPaymentIdentityRepository} from './coaching-payment-identity-repository';
import {CoachingWhopCycleRepository} from './coaching-whop-cycle-repository';
/** Account/membership signals refresh provider facts only. They never prove a
 * settled invoice, grant Journal access, cancel work or rewrite accepted terms. */
export async function observeCoachingWhopResource(input:{environment:'sandbox'|'live';identityKey:string;platformAccountId?:string;event:CoachingWhopEvent;
 withDatabase:<T>(operation:(db:Database.Database)=>T)=>T;retrieveMembership?:(id:string)=>Promise<Record<string,unknown>>;retrieveAccount?:(id:string)=>Promise<Record<string,unknown>>;
 now:()=>string;assertOwned:(db:Database.Database,atUtc:string)=>void;complete:(db:Database.Database)=>void}):Promise<void>{
 const {event}=input;if(event.resourceKind==='payment')throw new Error('binding_unavailable');
 const resource=event.resourceKind==='membership'?await input.retrieveMembership?.(event.resourceId):await input.retrieveAccount?.(event.resourceId);
 if(!resource||resource.id!==event.resourceId)throw new Error('binding_unavailable');
 const atUtc=input.now();
 input.withDatabase(db=>db.transaction(()=>{
  input.assertOwned(db,atUtc);let facts:Record<string,unknown>;
  if(event.resourceKind==='membership'){
   const account=resource.account as {id?:unknown}|undefined;
   const origin=new CoachingWhopCycleRepository(db).readOrigin(input.environment,event.merchantAccountId,event.resourceId);
   if(!origin||account?.id!==event.merchantAccountId||resource.plan_id!==origin.providerOffer.variantId||resource.product_id!==origin.providerOffer.productId||typeof resource.user_id!=='string'||!new CoachingPaymentIdentityRepository(db,input.environment,input.identityKey).matchesUser(origin.studentUserId,resource.user_id))throw new Error('binding_unavailable');
   const timestamp=(value:unknown)=>{if(value===null||value===undefined)return null;if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))throw new Error('reconciliation_required');return new Date(value).toISOString();};
   facts={status:typeof resource.status==='string'?resource.status:null,currentPeriodStart:timestamp(resource.current_period_start),currentPeriodEnd:timestamp(resource.current_period_end),cancelAtPeriodEnd:typeof resource.cancel_at_period_end==='boolean'?resource.cancel_at_period_end:null};
  }else{
   if(resource.id!==event.merchantAccountId||!input.platformAccountId)throw new Error('binding_unavailable');
   const connection=db.prepare('SELECT coach_user_id FROM traderlink_coaching_merchant_connections WHERE environment=? AND merchant_account_id=? AND platform_account_id=?').get(input.environment,event.merchantAccountId,input.platformAccountId) as {coach_user_id:string}|undefined;
   if(!connection)throw new Error('binding_unavailable');
   const owner=resource.owner as {id?:unknown}|undefined,parent=resource.parent_account as {id?:unknown}|undefined;
   const ownershipMatches=typeof owner?.id==='string'&&new CoachingPaymentIdentityRepository(db,input.environment,input.identityKey).matchesUser(connection.coach_user_id,owner.id),parentMatches=parent?.id===input.platformAccountId;
   facts={ownershipMatches,parentMatches};
   db.prepare("UPDATE traderlink_coaching_merchant_connections SET status=?,verified_at_utc=? WHERE environment=? AND coach_user_id=?").run(ownershipMatches&&parentMatches?'verified':'disconnected',atUtc,input.environment,connection.coach_user_id);
  }
  db.prepare('INSERT INTO traderlink_coaching_provider_resource_observations VALUES(?,?,?,?,?,?,?)').run(input.environment,event.merchantAccountId,event.resourceKind,event.resourceId,event.eventId,JSON.stringify(facts),atUtc);
  input.complete(db);
 }).immediate());
}
