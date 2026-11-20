import type {CoachingAgreementTerms} from './coaching-agreements';

export const PACK_REPURCHASE_PROTOCOL='traderlink.coaching.pack-repurchase.v1' as const;
export type AtomicPackIntent='propose_pack_repurchase'|'accept_pack_repurchase'|'withdraw_pack_repurchase_proposal';
export function isAtomicPackIntent(value:unknown):value is AtomicPackIntent{
 return value==='propose_pack_repurchase'||value==='accept_pack_repurchase'||value==='withdraw_pack_repurchase_proposal';
}
/** Server action proof only: issued after the nonfinancial transaction unwinds.
 * The route must still complete normal database closeout before publishing it. */
export class PackActionRollbackRejection extends Error{
 constructor(readonly binding:Readonly<{actorUserId:string;requestId:string;intent:AtomicPackIntent;enrollmentId:string;payloadSha256:string}>){
  super('This confirmation was not saved. Review the current pack terms before trying again.');
 }
}
export type PackRejection=Readonly<{
 protocol:typeof PACK_REPURCHASE_PROTOCOL;kind:'rejected_pack';requestId:string;
 intent:AtomicPackIntent;enrollmentId:string;bodySha256:string;error:string;
}>;
export function validatePackRejection(value:unknown,body:Readonly<Record<string,unknown>>,bodySha256:string):value is PackRejection{
 if(!value||typeof value!=='object'||body.protocol!==PACK_REPURCHASE_PROTOCOL||!isAtomicPackIntent(body.intent)||typeof body.requestId!=='string'||typeof body.enrollmentId!=='string'||!isPackFingerprint(bodySha256))return false;
 const v=value as Partial<PackRejection>;
 return v.protocol===PACK_REPURCHASE_PROTOCOL&&v.kind==='rejected_pack'&&v.requestId===body.requestId
  &&v.intent===body.intent&&v.enrollmentId===body.enrollmentId&&v.bodySha256===bodySha256&&typeof v.error==='string';
}
export type PackDailyPolicy=Readonly<{timezone:'America/New_York';perDay?:number}>;
/** Written by the server only, on a new successor agreement. Legacy terms stay intact. */
export type PackRepurchaseLineage=Readonly<{
 version:1;rootAgreementId:string;rootServiceId:string;parentAgreementId:string;parentRevision:number;
 currentServiceId:string;dailyPolicy:PackDailyPolicy;quoteFingerprint:string;
}>;
export type PackProposalExpectation=Readonly<{
 enrollmentId:string;expectedPredecessorAgreementId:string;expectedPredecessorRevision:number;
 expectedPlanId:string;expectedPlanRevision:number;expectedQuoteFingerprint:string;serviceId:string;
 quotedPrice?:string;
}>;
export type PackAcceptanceExpectation=PackProposalExpectation&Readonly<{
 agreementId:string;expectedProposalRevision:number;expectedProposalFingerprint:string;
}>;
export type PackWithdrawalExpectation=Readonly<{
 enrollmentId:string;agreementId:string;expectedProposalRevision:number;expectedProposalFingerprint:string;
}>;
export type PackAcknowledgement=Readonly<{
 protocol:typeof PACK_REPURCHASE_PROTOCOL;requestId:string;kind:'proposed'|'accepted'|'withdrawn';
 enrollmentId:string;agreementId:string;revision:number;proposalFingerprint:string;
 predecessorAgreementId:string;predecessorRevision:number;planId:string;planRevision:number;
 quoteFingerprint:string;rootAgreementId:string;rootServiceId:string;serviceId:string;href:string;
}>;
export type PackQuote=Readonly<{
 expectation:PackProposalExpectation;terms:CoachingAgreementTerms;rootAgreementId:string;
 rootServiceId:string;dailyPolicy:PackDailyPolicy;
}>;
export type PackStatus=Readonly<{
 protocol:typeof PACK_REPURCHASE_PROTOCOL;enrollmentId:string;isCoach:boolean;isStudent:boolean;
 quote:PackQuote|null;quoteError:string|null;quoteRequired:boolean;
 pending:Readonly<{agreementId:string;revision:number;fingerprint:string;terms:CoachingAgreementTerms;expectation:PackAcceptanceExpectation}>|null;
}>;

/** Stable JSON for optimistic snapshots; it confers no actor or financial authority. */
export function canonicalPackJson(value:unknown):string{
 const normalize=(v:unknown):unknown=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'
  ?Object.fromEntries(Object.entries(v).filter(([,x])=>x!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,x])=>[k,normalize(x)])):v;
 return JSON.stringify(normalize(value));
}
export function isPackFingerprint(value:unknown):value is string{return typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);}
export function requirePackEnvelope(raw:Record<string,unknown>):void{
 if(raw.protocol!==PACK_REPURCHASE_PROTOCOL||typeof raw.requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw.requestId))throw new Error('Reload the pack confirmation before submitting.');
}
function requiredString(raw:Record<string,unknown>,key:string):string{
 const value=raw[key];if(typeof value!=='string'||!value||value.length>200)throw new Error('Reload the exact pack confirmation.');return value;
}
function revision(raw:Record<string,unknown>,key:string):number{
 const value=raw[key];if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1)throw new Error('Reload the exact pack revision.');return value;
}
function requiredFingerprint(raw:Record<string,unknown>,key:string):string{const value=raw[key];if(!isPackFingerprint(value))throw new Error('Reload the pack terms before confirming.');return value;}
export function packProposalExpectation(raw:Record<string,unknown>):PackProposalExpectation{
 return {enrollmentId:requiredString(raw,'enrollmentId'),expectedPredecessorAgreementId:requiredString(raw,'expectedPredecessorAgreementId'),expectedPredecessorRevision:revision(raw,'expectedPredecessorRevision'),expectedPlanId:requiredString(raw,'expectedPlanId'),expectedPlanRevision:revision(raw,'expectedPlanRevision'),expectedQuoteFingerprint:requiredFingerprint(raw,'expectedQuoteFingerprint'),serviceId:requiredString(raw,'serviceId'),...(raw.quotedPrice===undefined?{}:{quotedPrice:requiredString(raw,'quotedPrice')})};
}
export function packWithdrawalExpectation(raw:Record<string,unknown>):PackWithdrawalExpectation{
 return {enrollmentId:requiredString(raw,'enrollmentId'),agreementId:requiredString(raw,'agreementId'),expectedProposalRevision:revision(raw,'expectedProposalRevision'),expectedProposalFingerprint:requiredFingerprint(raw,'expectedProposalFingerprint')};
}
export function packAcceptanceExpectation(raw:Record<string,unknown>):PackAcceptanceExpectation{return {...packProposalExpectation(raw),...packWithdrawalExpectation(raw)};}
export function validatePackAcknowledgement(value:unknown,expected:Pick<PackAcknowledgement,'requestId'|'kind'|'enrollmentId'>&Partial<PackAcknowledgement>):value is PackAcknowledgement{
 if(!value||typeof value!=='object')return false;
 const v=value as Partial<PackAcknowledgement>;
 for(const key of ['agreementId','revision','proposalFingerprint','predecessorAgreementId','predecessorRevision','planId','planRevision','quoteFingerprint','rootAgreementId','rootServiceId','serviceId'] as const)if(expected[key]!==undefined&&expected[key]!==v[key])return false;
 return v.protocol===PACK_REPURCHASE_PROTOCOL&&v.requestId===expected.requestId&&v.kind===expected.kind&&v.enrollmentId===expected.enrollmentId
  &&typeof v.agreementId==='string'&&(!expected.agreementId||v.agreementId===expected.agreementId)
  &&Number.isSafeInteger(v.revision)&&Number(v.revision)>0&&isPackFingerprint(v.proposalFingerprint)&&isPackFingerprint(v.quoteFingerprint)
  &&typeof v.predecessorAgreementId==='string'&&Number.isSafeInteger(v.predecessorRevision)&&Number(v.predecessorRevision)>0
  &&typeof v.planId==='string'&&Number.isSafeInteger(v.planRevision)&&Number(v.planRevision)>0
  &&typeof v.rootAgreementId==='string'&&typeof v.rootServiceId==='string'&&typeof v.serviceId==='string'
  &&v.href===`/coaching/enrollments/${encodeURIComponent(expected.enrollmentId)}`;
}
