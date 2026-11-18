// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PartnerAlertRetainedEvidenceRepository } from "./partner-alert-retained-evidence-repository";
import type { PartnerAlertRetainedOperationEvidence } from "./partner-alert-retained-evidence";
import type { PartnerAlertRetainedAgreementEvidence } from "./partner-alert-retained-evidence";
import type { PartnerAlertRetainedProviderEvidence } from "./partner-alert-retained-evidence";

const row: PartnerAlertRetainedOperationEvidence = Object.freeze({ evidenceRef: "e", lifecycleRef: "l",
  recordKind: "audit", communityBindingHmacSha256: "a".repeat(64), sourceRecordHmacSha256: "b".repeat(64),
  bindingKeyRef: "key", actionCode: "partner.save_draft", resourceBindingHmacSha256: "c".repeat(64),
  partnerRevision: 2, resourceVersion: 1, stateCode: "draft", fingerprintHmacSha256: null,
  resultHmacSha256: null, sourceCreatedAtUtc: "2026-11-02T12:00:00.000Z",
  archivedAtUtc: "2026-11-03T12:00:00.000Z", retainUntilUtc: "2028-11-02T12:00:00.000Z" });

function stored(overrides: Record<string, unknown> = {}) {
  return { evidence_ref: "existing", lifecycle_ref: row.lifecycleRef, record_kind: row.recordKind,
    community_binding_hmac_sha256: row.communityBindingHmacSha256,
    source_record_hmac_sha256: row.sourceRecordHmacSha256, binding_key_ref: row.bindingKeyRef,
    action_code: row.actionCode, resource_binding_hmac_sha256: row.resourceBindingHmacSha256,
    partner_revision: row.partnerRevision, resource_version: row.resourceVersion, state_code: row.stateCode,
    fingerprint_hmac_sha256: null, result_hmac_sha256: null, source_created_at_utc: row.sourceCreatedAtUtc,
    archived_at_utc: row.archivedAtUtc, retain_until_utc: row.retainUntilUtc, ...overrides };
}

describe("Partner Channel retained evidence repository", () => {
  it("accepts an exact idempotent archive retry", () => {
    const calls: string[] = [];
    const db = { prepare: (sql: string) => ({ run: () => { calls.push(sql); return { changes: 0 }; }, get: () => stored() }) };
    expect(() => new PartnerAlertRetainedEvidenceRepository(db as never).retainOperation(row)).not.toThrow();
    expect(calls[0]).toContain("INSERT OR IGNORE");
  });

  it("holds when an existing archive differs", () => {
    const db = { prepare: (sql: string) => ({ run: () => ({ changes: 0 }),
      get: () => sql.includes("SELECT") ? stored({ state_code: "changed" }) : undefined }) };
    expect(() => new PartnerAlertRetainedEvidenceRepository(db as never).retainOperation(row)).toThrow();
  });

  it("stores and verifies exact fixed-field agreement evidence", () => {
    const agreement: PartnerAlertRetainedAgreementEvidence = Object.freeze({ evidenceRef:"e2",lifecycleRef:"l",
      recordKind:"agreement",communityBindingHmacSha256:"a".repeat(64),sourceRecordHmacSha256:"d".repeat(64),
      bindingKeyRef:"key",successorRef:"successor",agreementVersion:1,termsVersion:1,
      acceptanceRulesVersion:2,acceptedAtUtc:"2026-11-02T13:00:00.000Z",
      proposerBindingHmacSha256:"f".repeat(64),acceptorBindingHmacSha256:"1".repeat(64),
      previousAgreementBindingHmacSha256:null,acceptanceEvidenceHmacSha256:"2".repeat(64),pricingSource:"standard",
      firstChannelAmountMinor:1000,additionalChannelAmountMinor:500,includedChannels:1,cadenceUnit:"calendar_month",
      cadenceCount:1,contractedChannels:2,totalAmountMinor:1500,currencyCode:"USD",
      evidenceHmacSha256:"e".repeat(64),sourceCreatedAtUtc:"2026-11-02T12:00:00.000Z",
      archivedAtUtc:"2026-11-03T12:00:00.000Z",retainUntilUtc:"2033-11-02T12:00:00.000Z" });
    const storedAgreement = { evidence_ref:"existing",lifecycle_ref:agreement.lifecycleRef,record_kind:"agreement",
      community_binding_hmac_sha256:agreement.communityBindingHmacSha256,
      source_record_hmac_sha256:agreement.sourceRecordHmacSha256,binding_key_ref:agreement.bindingKeyRef,
      successor_ref:agreement.successorRef,agreement_version:agreement.agreementVersion,
      terms_version:agreement.termsVersion,acceptance_rules_version:agreement.acceptanceRulesVersion,
      accepted_at_utc:agreement.acceptedAtUtc,proposer_binding_hmac_sha256:agreement.proposerBindingHmacSha256,
      acceptor_binding_hmac_sha256:agreement.acceptorBindingHmacSha256,
      previous_agreement_binding_hmac_sha256:null,acceptance_evidence_hmac_sha256:agreement.acceptanceEvidenceHmacSha256,
      pricing_source:agreement.pricingSource,
      first_channel_amount_minor:agreement.firstChannelAmountMinor,
      additional_channel_amount_minor:agreement.additionalChannelAmountMinor,included_channels:agreement.includedChannels,
      cadence_unit:agreement.cadenceUnit,cadence_count:agreement.cadenceCount,
      contracted_channels:agreement.contractedChannels,total_amount_minor:agreement.totalAmountMinor,
      provider_record_hmac_sha256:null,amount_minor:null,currency_code:agreement.currencyCode,
      evidence_hmac_sha256:agreement.evidenceHmacSha256,source_created_at_utc:agreement.sourceCreatedAtUtc,
      archived_at_utc:agreement.archivedAtUtc,retain_until_utc:agreement.retainUntilUtc };
    const db = { prepare: (sql:string) => ({ run:()=>({changes:1}),get:()=>sql.includes("SELECT")?storedAgreement:undefined }) };
    expect(()=>new PartnerAlertRetainedEvidenceRepository(db as never).retainAgreement(agreement)).not.toThrow();
  });

  it("stores and verifies an exact provider receipt projection",()=>{
    const provider:PartnerAlertRetainedProviderEvidence={evidenceRef:"p",lifecycleRef:"l",recordKind:"payment",
      communityBindingHmacSha256:"a".repeat(64),sourceRecordHmacSha256:"b".repeat(64),bindingKeyRef:"key",
      successorRef:"c".repeat(64),providerRecordHmacSha256:"d".repeat(64),
      providerAccountBindingHmacSha256:"e".repeat(64),membershipBindingHmacSha256:"f".repeat(64),
      payerBindingHmacSha256:"1".repeat(64),providerStateCode:"paid",refundStateCode:"none",
      disputeStateCode:"clear",amountMinor:2500,currencyCode:"USD",paidAtUtc:"2026-11-02T11:00:00.000Z",
      providerObservedAtUtc:"2026-11-02T12:00:00.000Z",evidenceHmacSha256:"2".repeat(64),
      sourceCreatedAtUtc:"2026-11-02T11:00:00.000Z",archivedAtUtc:"2026-11-03T12:00:00.000Z",
      retainUntilUtc:"2033-11-02T11:00:00.000Z"};
    const storedProvider={evidence_ref:"existing",lifecycle_ref:provider.lifecycleRef,record_kind:provider.recordKind,
      community_binding_hmac_sha256:provider.communityBindingHmacSha256,
      source_record_hmac_sha256:provider.sourceRecordHmacSha256,binding_key_ref:provider.bindingKeyRef,
      successor_ref:provider.successorRef,provider_record_hmac_sha256:provider.providerRecordHmacSha256,
      provider_account_binding_hmac_sha256:provider.providerAccountBindingHmacSha256,
      membership_binding_hmac_sha256:provider.membershipBindingHmacSha256,
      payer_binding_hmac_sha256:provider.payerBindingHmacSha256,provider_state_code:provider.providerStateCode,
      refund_state_code:provider.refundStateCode,dispute_state_code:provider.disputeStateCode,
      amount_minor:provider.amountMinor,currency_code:provider.currencyCode,paid_at_utc:provider.paidAtUtc,
      provider_observed_at_utc:provider.providerObservedAtUtc,evidence_hmac_sha256:provider.evidenceHmacSha256,
      source_created_at_utc:provider.sourceCreatedAtUtc,archived_at_utc:provider.archivedAtUtc,
      retain_until_utc:provider.retainUntilUtc};
    const db={prepare:(sql:string)=>({run:()=>({changes:1}),get:()=>sql.includes("SELECT")?storedProvider:undefined})};
    expect(()=>new PartnerAlertRetainedEvidenceRepository(db as never).retainProvider(provider)).not.toThrow();
  });
});
