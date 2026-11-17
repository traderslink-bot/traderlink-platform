import type Database from "better-sqlite3";
import { erasureHold } from "../../platform/server/privacy/platform-erasure-admission";
import type { PartnerAlertRetainedAgreementEvidence,
  PartnerAlertRetainedOperationEvidence, PartnerAlertRetainedProviderEvidence } from "./partner-alert-retained-evidence";

type Stored = Readonly<{
  evidence_ref: string;
  lifecycle_ref: string;
  record_kind: string;
  community_binding_hmac_sha256: string;
  source_record_hmac_sha256: string;
  binding_key_ref: string;
  action_code: string;
  resource_binding_hmac_sha256: string;
  partner_revision: number | null;
  resource_version: number | null;
  state_code: string | null;
  fingerprint_hmac_sha256: string | null;
  result_hmac_sha256: string | null;
  source_created_at_utc: string;
  archived_at_utc: string;
  retain_until_utc: string;
}>;

type StoredAgreement = Readonly<{
  evidence_ref: string; lifecycle_ref: string; record_kind: string;
  community_binding_hmac_sha256: string; source_record_hmac_sha256: string; binding_key_ref: string;
  successor_ref: string; terms_version: number; pricing_source: string;
  agreement_version: number; acceptance_rules_version: number; accepted_at_utc: string;
  proposer_binding_hmac_sha256: string; acceptor_binding_hmac_sha256: string;
  previous_agreement_binding_hmac_sha256: string | null; acceptance_evidence_hmac_sha256: string;
  first_channel_amount_minor: number; additional_channel_amount_minor: number; included_channels: number;
  cadence_unit: string; cadence_count: number; contracted_channels: number; total_amount_minor: number;
  provider_record_hmac_sha256: null; amount_minor: null; currency_code: string;
  evidence_hmac_sha256: string; source_created_at_utc: string; archived_at_utc: string; retain_until_utc: string;
}>;

type StoredProvider = Readonly<{
  evidence_ref:string;lifecycle_ref:string;record_kind:string;community_binding_hmac_sha256:string;
  source_record_hmac_sha256:string;binding_key_ref:string;successor_ref:string;
  provider_record_hmac_sha256:string;provider_account_binding_hmac_sha256:string;
  membership_binding_hmac_sha256:string;payer_binding_hmac_sha256:string;provider_state_code:string;
  refund_state_code:string;dispute_state_code:string;amount_minor:number;currency_code:string;
  paid_at_utc:string|null;provider_observed_at_utc:string;evidence_hmac_sha256:string;
  source_created_at_utc:string;archived_at_utc:string;retain_until_utc:string;
}>;

function comparable(row: Stored | PartnerAlertRetainedOperationEvidence): readonly unknown[] {
  if ("evidence_ref" in row) return [row.lifecycle_ref,row.record_kind,row.community_binding_hmac_sha256,
    row.source_record_hmac_sha256,row.binding_key_ref,row.action_code,row.resource_binding_hmac_sha256,
    row.partner_revision,row.resource_version,row.state_code,row.fingerprint_hmac_sha256,row.result_hmac_sha256,
    row.source_created_at_utc,row.archived_at_utc,row.retain_until_utc];
  return [row.lifecycleRef,row.recordKind,row.communityBindingHmacSha256,row.sourceRecordHmacSha256,
    row.bindingKeyRef,row.actionCode,row.resourceBindingHmacSha256,row.partnerRevision,row.resourceVersion,
    row.stateCode,row.fingerprintHmacSha256,row.resultHmacSha256,row.sourceCreatedAtUtc,row.archivedAtUtc,row.retainUntilUtc];
}

function comparableAgreement(row: StoredAgreement | PartnerAlertRetainedAgreementEvidence): readonly unknown[] {
  if ("evidence_ref" in row) return [row.lifecycle_ref,row.record_kind,row.community_binding_hmac_sha256,
    row.source_record_hmac_sha256,row.binding_key_ref,row.successor_ref,row.agreement_version,row.terms_version,
    row.acceptance_rules_version,row.accepted_at_utc,row.proposer_binding_hmac_sha256,
    row.acceptor_binding_hmac_sha256,row.previous_agreement_binding_hmac_sha256,
    row.acceptance_evidence_hmac_sha256,row.pricing_source,
    row.first_channel_amount_minor,row.additional_channel_amount_minor,row.included_channels,row.cadence_unit,
    row.cadence_count,row.contracted_channels,row.total_amount_minor,row.currency_code,row.evidence_hmac_sha256,
    row.source_created_at_utc,row.archived_at_utc,row.retain_until_utc];
  return [row.lifecycleRef,row.recordKind,row.communityBindingHmacSha256,row.sourceRecordHmacSha256,
    row.bindingKeyRef,row.successorRef,row.agreementVersion,row.termsVersion,row.acceptanceRulesVersion,
    row.acceptedAtUtc,row.proposerBindingHmacSha256,row.acceptorBindingHmacSha256,
    row.previousAgreementBindingHmacSha256,row.acceptanceEvidenceHmacSha256,row.pricingSource,row.firstChannelAmountMinor,
    row.additionalChannelAmountMinor,row.includedChannels,row.cadenceUnit,row.cadenceCount,row.contractedChannels,
    row.totalAmountMinor,row.currencyCode,row.evidenceHmacSha256,row.sourceCreatedAtUtc,row.archivedAtUtc,
    row.retainUntilUtc];
}

function comparableProvider(row: StoredProvider | PartnerAlertRetainedProviderEvidence): readonly unknown[] {
  if ("evidence_ref" in row) return [row.lifecycle_ref,row.record_kind,row.community_binding_hmac_sha256,
    row.source_record_hmac_sha256,row.binding_key_ref,row.successor_ref,row.provider_record_hmac_sha256,
    row.provider_account_binding_hmac_sha256,row.membership_binding_hmac_sha256,row.payer_binding_hmac_sha256,
    row.provider_state_code,row.refund_state_code,row.dispute_state_code,row.amount_minor,row.currency_code,
    row.paid_at_utc,row.provider_observed_at_utc,row.evidence_hmac_sha256,row.source_created_at_utc,row.archived_at_utc,
    row.retain_until_utc];
  return [row.lifecycleRef,row.recordKind,row.communityBindingHmacSha256,row.sourceRecordHmacSha256,
    row.bindingKeyRef,row.successorRef,row.providerRecordHmacSha256,row.providerAccountBindingHmacSha256,
    row.membershipBindingHmacSha256,row.payerBindingHmacSha256,row.providerStateCode,row.refundStateCode,
    row.disputeStateCode,row.amountMinor,row.currencyCode,row.paidAtUtc,row.providerObservedAtUtc,
    row.evidenceHmacSha256,row.sourceCreatedAtUtc,row.archivedAtUtc,row.retainUntilUtc];
}

/** Append-only idempotent storage. A retry may use a new evidence UUID, but it
 * must resolve to byte-equivalent reviewed fields under the unique source HMAC. */
export class PartnerAlertRetainedEvidenceRepository {
  constructor(private readonly database: Database.Database) {}

  retainOperation(row: PartnerAlertRetainedOperationEvidence): void {
    this.database.prepare(`INSERT OR IGNORE INTO partner_alert_retained_operation_evidence
      (evidence_ref,lifecycle_ref,record_kind,community_binding_hmac_sha256,source_record_hmac_sha256,
       binding_key_ref,action_code,resource_binding_hmac_sha256,partner_revision,resource_version,state_code,
       fingerprint_hmac_sha256,result_hmac_sha256,source_created_at_utc,archived_at_utc,retain_until_utc)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(row.evidenceRef,row.lifecycleRef,row.recordKind,
      row.communityBindingHmacSha256,row.sourceRecordHmacSha256,row.bindingKeyRef,row.actionCode,
      row.resourceBindingHmacSha256,row.partnerRevision,row.resourceVersion,row.stateCode,
      row.fingerprintHmacSha256,row.resultHmacSha256,row.sourceCreatedAtUtc,row.archivedAtUtc,row.retainUntilUtc);
    const stored = this.database.prepare(`SELECT * FROM partner_alert_retained_operation_evidence
      WHERE lifecycle_ref=? AND record_kind=? AND source_record_hmac_sha256=?`)
      .get(row.lifecycleRef,row.recordKind,row.sourceRecordHmacSha256) as Stored | undefined;
    if (!stored || JSON.stringify(comparable(stored)) !== JSON.stringify(comparable(row))) return erasureHold();
  }

  retainAgreement(row: PartnerAlertRetainedAgreementEvidence): void {
    this.database.prepare(`INSERT OR IGNORE INTO partner_alert_retained_commercial_evidence
      (evidence_ref,lifecycle_ref,record_kind,community_binding_hmac_sha256,source_record_hmac_sha256,
       binding_key_ref,successor_ref,agreement_version,terms_version,acceptance_rules_version,accepted_at_utc,
       proposer_binding_hmac_sha256,acceptor_binding_hmac_sha256,previous_agreement_binding_hmac_sha256,
       acceptance_evidence_hmac_sha256,pricing_source,first_channel_amount_minor,
       additional_channel_amount_minor,included_channels,cadence_unit,cadence_count,contracted_channels,
       total_amount_minor,provider_record_hmac_sha256,amount_minor,currency_code,evidence_hmac_sha256,
       source_created_at_utc,archived_at_utc,retain_until_utc)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,NULL,?,?,?,?,?)`).run(row.evidenceRef,row.lifecycleRef,
      row.recordKind,row.communityBindingHmacSha256,row.sourceRecordHmacSha256,row.bindingKeyRef,row.successorRef,
      row.agreementVersion,row.termsVersion,row.acceptanceRulesVersion,row.acceptedAtUtc,
      row.proposerBindingHmacSha256,row.acceptorBindingHmacSha256,row.previousAgreementBindingHmacSha256,
      row.acceptanceEvidenceHmacSha256,row.pricingSource,row.firstChannelAmountMinor,row.additionalChannelAmountMinor,
      row.includedChannels,row.cadenceUnit,row.cadenceCount,row.contractedChannels,row.totalAmountMinor,
      row.currencyCode,row.evidenceHmacSha256,row.sourceCreatedAtUtc,row.archivedAtUtc,row.retainUntilUtc);
    const stored = this.database.prepare(`SELECT * FROM partner_alert_retained_commercial_evidence
      WHERE lifecycle_ref=? AND record_kind='agreement' AND source_record_hmac_sha256=?`)
      .get(row.lifecycleRef,row.sourceRecordHmacSha256) as StoredAgreement | undefined;
    if (!stored || stored.provider_record_hmac_sha256 !== null || stored.amount_minor !== null
      || JSON.stringify(comparableAgreement(stored)) !== JSON.stringify(comparableAgreement(row))) return erasureHold();
  }

  retainProvider(row: PartnerAlertRetainedProviderEvidence): void {
    this.database.prepare(`INSERT OR IGNORE INTO partner_alert_retained_commercial_evidence
      (evidence_ref,lifecycle_ref,record_kind,community_binding_hmac_sha256,source_record_hmac_sha256,
       binding_key_ref,successor_ref,agreement_version,terms_version,acceptance_rules_version,accepted_at_utc,
       proposer_binding_hmac_sha256,acceptor_binding_hmac_sha256,previous_agreement_binding_hmac_sha256,
       acceptance_evidence_hmac_sha256,pricing_source,first_channel_amount_minor,additional_channel_amount_minor,
       included_channels,cadence_unit,cadence_count,contracted_channels,total_amount_minor,
       provider_record_hmac_sha256,provider_account_binding_hmac_sha256,membership_binding_hmac_sha256,
       payer_binding_hmac_sha256,provider_state_code,refund_state_code,dispute_state_code,amount_minor,currency_code,
       paid_at_utc,provider_observed_at_utc,evidence_hmac_sha256,source_created_at_utc,archived_at_utc,retain_until_utc)
      VALUES(?,?,?,?,?,?,?,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,
       ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(row.evidenceRef,row.lifecycleRef,row.recordKind,
      row.communityBindingHmacSha256,row.sourceRecordHmacSha256,row.bindingKeyRef,row.successorRef,
      row.providerRecordHmacSha256,row.providerAccountBindingHmacSha256,row.membershipBindingHmacSha256,
      row.payerBindingHmacSha256,row.providerStateCode,row.refundStateCode,row.disputeStateCode,row.amountMinor,
      row.currencyCode,row.paidAtUtc,row.providerObservedAtUtc,row.evidenceHmacSha256,row.sourceCreatedAtUtc,
      row.archivedAtUtc,row.retainUntilUtc);
    const stored=this.database.prepare(`SELECT * FROM partner_alert_retained_commercial_evidence
      WHERE lifecycle_ref=? AND record_kind=? AND source_record_hmac_sha256=?`)
      .get(row.lifecycleRef,row.recordKind,row.sourceRecordHmacSha256) as StoredProvider|undefined;
    if (!stored || JSON.stringify(comparableProvider(stored))!==JSON.stringify(comparableProvider(row))) return erasureHold();
  }
}
