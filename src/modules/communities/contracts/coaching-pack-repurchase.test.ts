// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {PACK_REPURCHASE_PROTOCOL,canonicalPackJson,requirePackEnvelope,packProposalExpectation,validatePackAcknowledgement,type PackAcknowledgement} from './coaching-pack-repurchase';

const requestId='dcb927a4-facf-46d6-8f55-e922ddceef0f',sha='a'.repeat(64);
const ack:PackAcknowledgement={protocol:PACK_REPURCHASE_PROTOCOL,requestId,kind:'accepted',enrollmentId:'enrollment',agreementId:'new-pack',revision:2,proposalFingerprint:sha,quoteFingerprint:sha,predecessorAgreementId:'old-pack',predecessorRevision:1,planId:'plan',planRevision:1,rootAgreementId:'old-pack',rootServiceId:'item',serviceId:'item',href:'/coaching/enrollments/enrollment'};
describe('exact pack confirmations',()=>{
 it('canonicalizes nested field order without changing arrays or numbers',()=>{
  expect(canonicalPackJson({b:{z:2,a:1},a:['second','first'],omit:undefined})).toBe(canonicalPackJson({a:['second','first'],b:{a:1,z:2}}));
  expect(canonicalPackJson({a:[1,2]})).not.toBe(canonicalPackJson({a:[2,1]}));
 });
 it('requires the explicit protocol and stable v4 request ID',()=>{
  expect(()=>requirePackEnvelope({protocol:PACK_REPURCHASE_PROTOCOL,requestId})).not.toThrow();
  expect(()=>requirePackEnvelope({requestId})).toThrow();
  expect(()=>requirePackEnvelope({protocol:PACK_REPURCHASE_PROTOCOL,requestId:'new request'})).toThrow();
 });
 it('rejects omitted or stringified concurrency revisions and missing quote binding',()=>{
  const raw={enrollmentId:'enrollment',expectedPredecessorAgreementId:'old',expectedPredecessorRevision:1,expectedPlanId:'plan',expectedPlanRevision:1,expectedQuoteFingerprint:sha,serviceId:'item'};
  expect(packProposalExpectation(raw)).toEqual(raw);
  expect(()=>packProposalExpectation({...raw,expectedPlanRevision:'1'})).toThrow();
  expect(()=>packProposalExpectation({...raw,expectedPredecessorRevision:0})).toThrow();
  expect(()=>packProposalExpectation({...raw,expectedQuoteFingerprint:undefined})).toThrow();
 });
 it('accepts only a fully matching acknowledgment for the displayed operation',()=>{
  expect(validatePackAcknowledgement(ack,ack)).toBe(true);
 });
 it.each(['requestId','enrollmentId','agreementId','predecessorAgreementId','quoteFingerprint','proposalFingerprint','rootAgreementId','rootServiceId','serviceId','planId','kind'] as const)('refuses a crossed %s acknowledgment',key=>{
  expect(validatePackAcknowledgement({...ack,[key]:'different'},ack)).toBe(false);
 });
 it('refuses a crossed revision or navigation target',()=>{
  expect(validatePackAcknowledgement({...ack,revision:3},ack)).toBe(false);
  expect(validatePackAcknowledgement({...ack,href:'https://elsewhere.invalid'},ack)).toBe(false);
 });
});
