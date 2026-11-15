import 'server-only';
import {COMMUNITY_LAUNCH_FEATURES} from '../contracts/community-launch-features';
import {withPlatformDatabase} from '../../platform/server/database/open-platform-database';
import {loadCoachingWhopRuntime} from './coaching-whop-runtime';
import {processCoachingPaymentEvent} from './coaching-direct-payment-worker';
import {createCoachingPaymentDrain} from './coaching-direct-payment-drain';

const drain=createCoachingPaymentDrain(async()=>{
 // Check the source gate before reading configuration or constructing a client.
 if(!COMMUNITY_LAUNCH_FEATURES.coachingCommissionCollection)return 'idle';
 const configuration=loadCoachingWhopRuntime();
 const ready=withPlatformDatabase({mode:'runtime'},db=>[
  'traderlink_coaching_contexts','traderlink_coaching_direct_payment_inbox','traderlink_coaching_provider_resource_observations','traderlink_coaching_payment_quote_observations',
  'traderlink_coaching_commission_entries','traderlink_coaching_commission_checks',
  'traderlink_coaching_recurring_memberships','traderlink_coaching_paid_billing_cycles',
 ].every(name=>Boolean(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(name))));
 if(!ready)return 'idle';
 return processCoachingPaymentEvent({environment:configuration.environment,identityKey:configuration.identityKey,
  platformAccountId:configuration.platformAccountId,withDatabase:operation=>withPlatformDatabase({mode:'runtime'},operation),
  retrieveAccount:id=>configuration.client.retrieveAccount(id),retrievePayment:id=>configuration.client.retrievePayment(id),retrieveMembership:id=>configuration.client.retrieveMembership(id),
  retrieveCommissionActivity:(accountId,paymentId,after)=>configuration.client.retrieveCommissionActivity(accountId,paymentId,after),now:()=>new Date().toISOString()});
});
let started=false;
/** Called only by the existing hosted maintenance startup after readiness. */
export function startHostedCoachingPayments():void{
 if(started||!COMMUNITY_LAUNCH_FEATURES.coachingCommissionCollection)return;
 started=true;
 const tick=()=>void drain().catch(()=>console.error('TraderLink coaching payment reconciliation needs attention.'));
 // No immediate network work in the application's startup window.
 setInterval(tick,15_000).unref();
}
