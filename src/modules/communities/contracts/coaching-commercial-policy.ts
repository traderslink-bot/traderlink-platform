export type CoachingCommercialPolicy=Readonly<{
 version:1;policyVersion:string;scope:'community'|'platform';
 commissionEnabled:boolean;commissionBasisPoints:number;coachSubscriptionRequired:boolean;
}>;
export function parseCoachingCommercialPolicy(value:unknown):CoachingCommercialPolicy{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Check the coaching commercial policy.');
 const raw=value as Record<string,unknown>;
 if(raw.version!==1||typeof raw.policyVersion!=='string'||!raw.policyVersion||raw.policyVersion.length>200||!['community','platform'].includes(String(raw.scope))||typeof raw.commissionEnabled!=='boolean'||typeof raw.coachSubscriptionRequired!=='boolean'||!Number.isSafeInteger(raw.commissionBasisPoints)||Number(raw.commissionBasisPoints)<0||Number(raw.commissionBasisPoints)>10000)throw new Error('Check the coaching commercial policy.');
 return Object.freeze({version:1,policyVersion:raw.policyVersion,scope:raw.scope as 'community'|'platform',commissionEnabled:raw.commissionEnabled,commissionBasisPoints:Number(raw.commissionBasisPoints),coachSubscriptionRequired:raw.coachSubscriptionRequired});
}
/** Initial owner direction only; versioned owner configuration supersedes defaults. */
export function defaultCoachingCommercialPolicy(scope:'community'|'platform'):CoachingCommercialPolicy{
 return scope==='platform'
  ?Object.freeze({version:1,policyVersion:'initial-platform-v2',scope,commissionEnabled:false,commissionBasisPoints:0,coachSubscriptionRequired:false})
  :Object.freeze({version:1,policyVersion:'initial-community-v1',scope,commissionEnabled:false,commissionBasisPoints:2000,coachSubscriptionRequired:false});
}
