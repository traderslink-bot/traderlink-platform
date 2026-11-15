import {readCommunityCoachingExemptionFact} from './community-admission-service';
import type Database from 'better-sqlite3';
import {defaultCoachingCommercialPolicy,parseCoachingCommercialPolicy,type CoachingCommercialPolicy} from '../contracts/coaching-commercial-policy';
function readScopedPolicy(database:Database.Database,input:{scope:'community'|'platform';communityId?:string;coachUserId?:string}):CoachingCommercialPolicy{
 if(input.scope==='community'&&!input.communityId)throw new Error('Identify the community commercial policy.');
 const scopeKey=input.scope==='platform'?'platform':input.communityId!;
 if(database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_coaching_commercial_policies'").get()){
  const row=database.prepare("SELECT policy_json FROM traderlink_coaching_commercial_policies WHERE scope=? AND scope_key=? ORDER BY revision DESC LIMIT 1").get(input.scope,scopeKey) as {policy_json:string}|undefined;
  if(row){const policy=parseCoachingCommercialPolicy(JSON.parse(row.policy_json));if(policy.scope!==input.scope)throw new Error('Commercial policy scope mismatch.');return policy;}
 }
 // Preserve existing specifically configured community commission rules. A global
 // coach rule never leaks a platform policy into their community work.
 if(input.scope==='community'&&database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_community_coach_fee_rules'").get()){
  const row=database.prepare("SELECT fee_rule_id,fee_basis_points FROM traderlink_community_coach_fee_rules WHERE community_id=? AND (coach_user_id IS NULL OR coach_user_id=?) AND status='active' ORDER BY coach_user_id IS NULL,updated_at_utc DESC LIMIT 1").get(input.communityId,input.coachUserId??null) as {fee_rule_id:string;fee_basis_points:number}|undefined;
  if(row)return {...defaultCoachingCommercialPolicy('community'),policyVersion:`community-rule:${row.fee_rule_id}`,commissionEnabled:true,commissionBasisPoints:row.fee_basis_points};
 }
 return defaultCoachingCommercialPolicy(input.scope);
}

export function readCoachCommissionRate(database:Database.Database,coachUserId:string):{revision:number;basisPoints:number|null}{
 if(!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_coaching_coach_commission_rates'").get())return {revision:0,basisPoints:null};
 return database.prepare('SELECT revision,commission_basis_points basisPoints FROM traderlink_coaching_coach_commission_rates WHERE coach_user_id=? ORDER BY revision DESC LIMIT 1').get(coachUserId) as {revision:number;basisPoints:number|null}|undefined??{revision:0,basisPoints:null};
}
/** One owner-negotiated rate per coach, applied whenever commission applies.
 * A free community exemption is separate and never copied into outside terms. */
export function readCoachingCommercialPolicy(database:Database.Database,input:Parameters<typeof readScopedPolicy>[1]):CoachingCommercialPolicy{
 const policy=readScopedPolicy(database,input);if(!policy.commissionEnabled||!input.coachUserId)return policy;
 const rate=readCoachCommissionRate(database,input.coachUserId);return rate.basisPoints===null?policy:{...policy,commissionBasisPoints:rate.basisPoints,policyVersion:`${policy.policyVersion}:coach:${input.coachUserId}:${rate.revision}`};
}
export function saveCoachCommissionRate(database:Database.Database,input:{coachUserId:string;expectedRevision:number;basisPoints:number|null;ownerUserId:string;atUtc:string}):void{
 if(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||input.basisPoints!==null&&(!Number.isSafeInteger(input.basisPoints)||input.basisPoints<0||input.basisPoints>10000)||!Number.isFinite(Date.parse(input.atUtc))||new Date(input.atUtc).toISOString()!==input.atUtc)throw new Error('Check the coach rate and revision.');
 database.transaction(()=>{if(!database.prepare('SELECT 1 FROM platform_users WHERE user_id=?').get(input.coachUserId))throw new Error('Choose an existing coach account.');const current=readCoachCommissionRate(database,input.coachUserId);if(current.revision!==input.expectedRevision)throw new Error('This coach rate changed. Reload before saving.');
 database.prepare('INSERT INTO traderlink_coaching_coach_commission_rates VALUES(?,?,?,?,?)').run(input.coachUserId,current.revision+1,input.basisPoints,input.ownerUserId,input.atUtc);
 }).immediate();
}

/** Request boundary must supply the authenticated Platform owner, never a coach role. */
export function saveCoachingCommercialPolicy(database:Database.Database,input:{scope:'community'|'platform';communityId?:string;expectedRevision:number;commissionEnabled:boolean;commissionBasisPoints:number;coachSubscriptionRequired:boolean;ownerUserId:string;atUtc:string}):CoachingCommercialPolicy{
 if(!['community','platform'].includes(input.scope)||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||!Number.isFinite(Date.parse(input.atUtc))||new Date(input.atUtc).toISOString()!==input.atUtc)throw new Error('Check the commercial policy revision and scope.');
 const key=input.scope==='platform'?'platform':input.communityId;
 if(!key)throw new Error('Choose a community.');
 return database.transaction(()=>{
  if(input.scope==='community'&&!database.prepare('SELECT 1 FROM traderlink_communities WHERE community_id=?').get(key))throw new Error('Choose an existing community.');
  const row=database.prepare('SELECT coalesce(max(revision),0) revision FROM traderlink_coaching_commercial_policies WHERE scope=? AND scope_key=?').get(input.scope,key) as {revision:number};
  if(row.revision!==input.expectedRevision)throw new Error('This policy changed. Reload before saving.');
  const revision=row.revision+1,policy=parseCoachingCommercialPolicy({version:1,policyVersion:`${input.scope}:${key}:${revision}`,scope:input.scope,commissionEnabled:input.commissionEnabled,commissionBasisPoints:input.commissionBasisPoints,coachSubscriptionRequired:input.coachSubscriptionRequired});
  database.prepare('INSERT INTO traderlink_coaching_commercial_policies VALUES(?,?,?,?,?,?)').run(input.scope,key,revision,JSON.stringify(policy),input.ownerUserId,input.atUtc);
  return policy;
 }).immediate();
}

/** Keep owner admission/exemption facts distinct from scoped fee configuration.
 * This read does not activate a waiver, rewrite terms or gate accepted work. */
export function readCommunityCoachingCommercialContext(database:Database.Database,communityId:string){
 const row=database.prepare('SELECT discord_guild_id FROM traderlink_communities WHERE community_id=?').get(communityId) as {discord_guild_id:string}|undefined;
 if(!row)throw new Error('Choose an existing community.');
 return {policy:readCoachingCommercialPolicy(database,{scope:'community',communityId}),exemption:readCommunityCoachingExemptionFact(database,row.discord_guild_id)};
}
