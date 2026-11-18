// @vitest-environment node
import { describe, expect, it } from "vitest";
import { projectPartnerAlertAgreementEvidence, projectPartnerAlertAuditEvidence,
  projectPartnerAlertIdempotencyEvidence, projectPartnerAlertProviderEvidence,
  projectPartnerAlertProviderInboxEvidence } from "./partner-alert-retained-evidence";
import { quotePartnerAlertPublishing } from "../contracts/partner-alert-publishing-pricing";

const lifecycleRef = "11111111-1111-4111-8111-111111111111";
const communityId = "22222222-2222-4222-8222-222222222222";
const evidenceRef = "33333333-3333-4333-8333-333333333333";
const recordRef = "44444444-4444-4444-8444-444444444444";
const resourceId = "55555555-5555-4555-8555-555555555555";
const key = new Uint8Array(32).fill(7);
const common = { lifecycleRef, communityId, archivedAtUtc: "2026-11-03T12:00:00.000Z",
  binding: { keyRef: "retention-key-v1", key }, createId: () => evidenceRef };

describe("Partner Channel retained operational evidence", () => {
  it("projects audit evidence through an exact nonidentifying allowlist", () => {
    const projected = projectPartnerAlertAuditEvidence({ ...common, row: { auditEventId: recordRef,
      action: "partner.save_draft", resourceId,
      detailJson: JSON.stringify({ partnerRevision: 2, resourceVersion: 1, state: "draft" }),
      createdAtUtc: "2026-11-02T12:00:00.000Z" } });
    expect(projected).toMatchObject({ recordKind: "audit", lifecycleRef, actionCode: "partner.save_draft",
      partnerRevision: 2, resourceVersion: 1, stateCode: "draft", fingerprintHmacSha256: null,
      resultHmacSha256: null, retainUntilUtc: "2028-11-02T12:00:00.000Z" });
    expect(JSON.stringify(projected)).not.toContain(communityId);
    expect(JSON.stringify(projected)).not.toContain(recordRef);
    expect(JSON.stringify(projected)).not.toContain(resourceId);
  });

  it("retains only HMACs plus the safe result projection for idempotency", () => {
    const fingerprintJson = JSON.stringify({ action: "partner.save_draft", communityId,
      payload: { displayName: "Private provider name", providerUserId: "provider-secret" } });
    const resultJson = JSON.stringify({ communityId, resourceId, partnerRevision: 2, resourceVersion: 1, state: "draft" });
    const projected = projectPartnerAlertIdempotencyEvidence({ ...common, row: { requestId: recordRef,
      fingerprintJson, resultJson, createdAtUtc: "2026-11-02T12:00:00.000Z" } });
    const serialized = JSON.stringify(projected);
    expect(projected).toMatchObject({ recordKind: "idempotency", partnerRevision: 2, resourceVersion: 1,
      stateCode: "draft" });
    expect(projected.fingerprintHmacSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(projected.resultHmacSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(serialized).not.toContain("Private provider name");
    expect(serialized).not.toContain("provider-secret");
    expect(serialized).not.toContain(communityId);
    expect(serialized).not.toContain(recordRef);
    expect(serialized).not.toContain(resourceId);
  });

  it("holds an audit row with fields outside the reviewed allowlist", () => {
    expect(() => projectPartnerAlertAuditEvidence({ ...common, row: { auditEventId: recordRef,
      action: "partner.save_draft", resourceId,
      detailJson: JSON.stringify({ partnerRevision: 2, resourceVersion: 1, state: "draft", actorName: "name" }),
      createdAtUtc: "2026-11-02T12:00:00.000Z" } })).toThrow("partner_alert_audit_projection");
  });

  it("projects an agreement into fixed legal/commercial fields without signer or raw identifiers", () => {
    const terms = { termsId:recordRef,communityId,version:1,pricingSource:"private" as const,
      currency:{code:"USD",minorUnitDigits:2 as const},firstChannelAmountMinor:2500,
      additionalChannelAmountMinor:1000,includedChannels:1,cadence:{unit:"day" as const,count:30} };
    const quote = quotePartnerAlertPublishing({ terms,contractedChannels:3,
      capabilities:{currencies:[terms.currency],calendarMonthCadence:true} });
    const proposer="44444444-4444-4444-8444-444444444444",acceptor="55555555-5555-4555-8555-555555555555";
    const successor="77777777-7777-4777-8777-777777777777";
    const projected = projectPartnerAlertAgreementEvidence({ ...common,successorRef:successor,
      previousAgreementId:"66666666-6666-4666-8666-666666666666",row:{
      agreementId:recordRef,version:1,termsJson:JSON.stringify(terms),quoteJson:JSON.stringify(quote),contractedChannels:3,
      proposedByUserId:proposer,proposedAtUtc:"2026-11-02T12:00:00.000Z"},acceptance:{agreementId:recordRef,
      acceptedByUserId:acceptor,rulesVersion:2,acceptedAtUtc:"2026-11-02T13:00:00.000Z"} });
    expect(projected).toMatchObject({recordKind:"agreement",agreementVersion:1,termsVersion:1,
      acceptanceRulesVersion:2,acceptedAtUtc:"2026-11-02T13:00:00.000Z",pricingSource:"private",
      firstChannelAmountMinor:2500,additionalChannelAmountMinor:1000,contractedChannels:3,totalAmountMinor:4500,
      currencyCode:"USD",retainUntilUtc:"2033-11-02T12:00:00.000Z"});
    const serialized=JSON.stringify(projected);
    expect(serialized).not.toContain(communityId);
    expect(serialized).not.toContain(recordRef);
    expect(serialized).not.toContain(proposer);
    expect(serialized).not.toContain(acceptor);
  });

  it("projects payment, refund and dispute evidence without raw provider identities",()=>{
    const fact={environment:"live" as const,paymentId:"pay_abc",accountId:"biz_abc",membershipId:"mem_abc",
      productId:"prod_abc",planId:"plan_abc",whopUserRef:"a".repeat(64),state:"paid" as const,
      paidAtUtc:"2026-11-02T11:00:00.000Z",amountMinor:2500,refundState:"partial" as const,
      disputeState:"observed" as const,observedAtUtc:"2026-11-02T12:00:00.000Z",
      validUntilUtc:"2026-11-02T13:00:00.000Z"};
    for (const recordKind of ["payment","refund","dispute"] as const) {
      const projected=projectPartnerAlertProviderEvidence({...common,recordKind,currencyCode:"usd",fact});
      expect(projected).toMatchObject({recordKind,amountMinor:2500,currencyCode:"USD",
        providerStateCode:"paid",refundStateCode:"partial",disputeStateCode:"observed",
        retainUntilUtc:recordKind==="payment"?"2033-11-02T11:00:00.000Z":"2033-11-02T12:00:00.000Z"});
      const serialized=JSON.stringify(projected);
      for (const raw of [fact.paymentId,fact.accountId,fact.membershipId,fact.whopUserRef]) expect(serialized).not.toContain(raw);
    }
  });

  it("projects an applied provider event into a two-year pseudonymized disposition",()=>{
    const projected=projectPartnerAlertProviderInboxEvidence({...common,appliedFactsSha256:"b".repeat(64),row:{
      environment:"live",whopAccountId:"biz_private",eventId:"evt_private",eventType:"payment.updated",
      resourceKind:"payment",resourceId:"pay_private",payloadSha256:"a".repeat(64),
      occurredAtUtc:"2026-11-02T11:00:00.000Z",receivedAtUtc:"2026-11-02T12:00:00.000Z"}});
    expect(projected).toMatchObject({recordKind:"idempotency",actionCode:"partner.provider_event_applied",
      stateCode:"completed",retainUntilUtc:"2028-11-02T12:00:00.000Z"});
    const serialized=JSON.stringify(projected);
    for(const raw of ["biz_private","evt_private","pay_private",communityId])expect(serialized).not.toContain(raw);
  });
});
