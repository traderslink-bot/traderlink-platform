import type Database from 'better-sqlite3';
import {readCoachSubscriptionQualification} from '../../platform/server/membership/coach-subscription-qualification';
import {readCoachingCommercialPolicy,readCommunityCoachingCommercialContext} from './coaching-commercial-policy';
import type {CoachingCommercialPolicy} from '../contracts/coaching-commercial-policy';
export type CoachingCommercialAccess={allowed:boolean;scope:'platform'|'community';communityId?:string;policy:CoachingCommercialPolicy;freeCommunity:boolean;commissionRequired:boolean;subscriptionRequired:boolean;consentReady:boolean;merchantReady:boolean;feeReady:boolean;subscriptionReady:boolean;reason:'ready'|'owner_configuration'|'complete_signup'|'unsupported_community_commission'};
function has(db:Database.Database,name:string){return Boolean(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(name));}
export function readCoachCommercialAccess(db:Database.Database,input:{coachUserId:string;scope:'platform'|'community';communityId?:string;atUtc:string;environment?:'sandbox'|'live'}):CoachingCommercialAccess{
 const community=input.scope==='community'&&input.communityId?readCommunityCoachingCommercialContext(db,input.communityId):null;
 if(input.scope==='community'&&!community)throw new Error('Choose the coaching community.');
 const policy=community?readCoachingCommercialPolicy(db,{scope:'community',communityId:input.communityId,coachUserId:input.coachUserId}):readCoachingCommercialPolicy(db,{scope:'platform',coachUserId:input.coachUserId});
 const freeCommunity=community?.exemption.available===true&&community.exemption.state==='eligible';
 const commissionRequired=!freeCommunity&&policy.commissionEnabled,subscriptionRequired=!freeCommunity&&policy.coachSubscriptionRequired;
 const mode=input.environment??process.env.TRADERLINK_COACHING_WHOP_ENVIRONMENT;
 const environment=mode==='sandbox'||mode==='live'?mode:null;
 const consentReady=!commissionRequired||Boolean(environment&&has(db,'traderlink_coaching_commercial_enrollments')&&db.prepare('SELECT 1 FROM traderlink_coaching_commercial_enrollments WHERE coach_user_id=? AND environment=? AND scope=? AND scope_key=? AND policy_version=?').get(input.coachUserId,environment,input.scope,input.communityId??'platform',policy.policyVersion));
 const merchantReady=!commissionRequired||Boolean(environment&&process.env.TRADERLINK_COACHING_WHOP_PLATFORM_ACCOUNT_ID&&has(db,'traderlink_coaching_merchant_connections')&&has(db,'traderlink_coaching_whop_identities')&&db.prepare("SELECT 1 FROM traderlink_coaching_merchant_connections m JOIN traderlink_coaching_whop_identities i ON i.environment=m.environment AND i.user_id=m.coach_user_id WHERE m.coach_user_id=? AND m.environment=? AND m.status='verified' AND (? IS NULL OR m.platform_account_id=?)").get(input.coachUserId,environment,process.env.TRADERLINK_COACHING_WHOP_PLATFORM_ACCOUNT_ID??null,process.env.TRADERLINK_COACHING_WHOP_PLATFORM_ACCOUNT_ID??null));
 const feeReady=!commissionRequired||Boolean(environment&&has(db,'traderlink_coaching_commission_setup_checks')&&has(db,'traderlink_coaching_merchant_connections')&&db.prepare("SELECT 1 FROM traderlink_coaching_commission_setup_checks s JOIN traderlink_coaching_merchant_connections m ON m.coach_user_id=s.coach_user_id AND m.environment=s.environment AND m.merchant_account_id=s.merchant_account_id AND m.status='verified' WHERE s.coach_user_id=? AND s.environment=? AND s.scope=? AND s.scope_key=? AND s.policy_version=? AND s.commission_basis_points=?").get(input.coachUserId,environment,input.scope,input.communityId??'platform',policy.policyVersion,policy.commissionBasisPoints));
 const membershipReady=['platform_membership_entitlements','platform_membership_plan_features','platform_membership_provider_subscriptions','platform_membership_offers'].every(name=>has(db,name));
 const subscriptionReady=!subscriptionRequired||membershipReady&&readCoachSubscriptionQualification(db,{coachUserId:input.coachUserId,atUtc:input.atUtc}).qualified;
 const unsupportedCommunityCommission=input.scope==='community'&&commissionRequired;
 const configured=freeCommunity||commissionRequired||subscriptionRequired;
 const openStandaloneBeta=input.scope==='platform'&&!commissionRequired&&!subscriptionRequired;
 const allowed=!unsupportedCommunityCommission&&(configured||openStandaloneBeta)&&consentReady&&merchantReady&&feeReady&&subscriptionReady;
 return {allowed,scope:input.scope,...(input.communityId?{communityId:input.communityId}:{}),policy,freeCommunity,commissionRequired,subscriptionRequired,consentReady,merchantReady,feeReady,subscriptionReady,reason:unsupportedCommunityCommission?'unsupported_community_commission':allowed?'ready':configured?'complete_signup':'owner_configuration'};
}
export function requireCoachCommercialAccess(db:Database.Database,input:Parameters<typeof readCoachCommercialAccess>[1]):CoachingCommercialAccess{
 const access=readCoachCommercialAccess(db,input);
 if(!access.allowed)throw new Error('Complete the required coach signup before using coaching tools.');
 return access;
}
export function acceptCoachCommercialTerms(db:Database.Database,input:{coachUserId:string;scope:'platform'|'community';communityId?:string;policyVersion:string;atUtc:string;environment?:'sandbox'|'live'}):void{
 if(!Number.isFinite(Date.parse(input.atUtc))||new Date(input.atUtc).toISOString()!==input.atUtc)throw new Error('Use a valid consent time.');
 const mode=input.environment??process.env.TRADERLINK_COACHING_WHOP_ENVIRONMENT;if(mode!=='sandbox'&&mode!=='live')throw new Error('Coach payment setup is not configured.');
 db.transaction(()=>{const access=readCoachCommercialAccess(db,{...input,environment:mode});if(!access.commissionRequired||access.policy.policyVersion!==input.policyVersion)throw new Error('The coach signup terms changed. Reload before accepting.');
 db.prepare('INSERT INTO traderlink_coaching_commercial_enrollments VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING').run(input.coachUserId,mode,input.scope,input.communityId??'platform',input.policyVersion,input.atUtc);
 }).immediate();
}
