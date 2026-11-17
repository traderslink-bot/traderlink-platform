import { createHmac } from "node:crypto";
import { partnerAlertId, partnerAlertInteger, partnerAlertRecord, partnerAlertRef,
  partnerAlertText, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { partnerAlertRecordRetainUntil } from "./partner-alert-retention-policy";
import { parsePartnerAlertPublishingTerms } from "../contracts/partner-alert-validation";
import { quotePartnerAlertPublishing } from "../contracts/partner-alert-publishing-pricing";
import type { PartnerAlertWhopPaymentFact } from "./partner-alert-whop-normalization";

type Binding = Readonly<{ keyRef: string; key: Uint8Array }>;
type CommonInput = Readonly<{
  lifecycleRef: string;
  communityId: string;
  archivedAtUtc: string;
  binding: Binding;
  createId: () => string;
}>;

export type PartnerAlertRetainedOperationEvidence = Readonly<{
  evidenceRef: string;
  lifecycleRef: string;
  recordKind: "audit" | "idempotency";
  communityBindingHmacSha256: string;
  sourceRecordHmacSha256: string;
  bindingKeyRef: string;
  actionCode: string;
  resourceBindingHmacSha256: string;
  partnerRevision: number | null;
  resourceVersion: number | null;
  stateCode: string | null;
  fingerprintHmacSha256: string | null;
  resultHmacSha256: string | null;
  sourceCreatedAtUtc: string;
  archivedAtUtc: string;
  retainUntilUtc: string;
}>;

export type PartnerAlertRetainedAgreementEvidence = Readonly<{
  evidenceRef: string;
  lifecycleRef: string;
  recordKind: "agreement";
  communityBindingHmacSha256: string;
  sourceRecordHmacSha256: string;
  bindingKeyRef: string;
  successorRef: string;
  agreementVersion: number;
  termsVersion: number;
  acceptanceRulesVersion: number;
  acceptedAtUtc: string;
  proposerBindingHmacSha256: string;
  acceptorBindingHmacSha256: string;
  previousAgreementBindingHmacSha256: string | null;
  acceptanceEvidenceHmacSha256: string;
  pricingSource: "standard" | "private";
  firstChannelAmountMinor: number;
  additionalChannelAmountMinor: number;
  includedChannels: number;
  cadenceUnit: "day" | "calendar_month";
  cadenceCount: number;
  contractedChannels: number;
  totalAmountMinor: number;
  currencyCode: string;
  evidenceHmacSha256: string;
  sourceCreatedAtUtc: string;
  archivedAtUtc: string;
  retainUntilUtc: string;
}>;

export type PartnerAlertRetainedProviderEvidence = Readonly<{
  evidenceRef: string;
  lifecycleRef: string;
  recordKind: "payment" | "refund" | "dispute";
  communityBindingHmacSha256: string;
  sourceRecordHmacSha256: string;
  bindingKeyRef: string;
  successorRef: string;
  providerRecordHmacSha256: string;
  providerAccountBindingHmacSha256: string;
  membershipBindingHmacSha256: string;
  payerBindingHmacSha256: string;
  providerStateCode: "paid" | "not_paid" | "uncertain";
  refundStateCode: "none" | "partial" | "full" | "unknown";
  disputeStateCode: "clear" | "observed" | "unverified";
  amountMinor: number;
  currencyCode: string;
  paidAtUtc: string | null;
  providerObservedAtUtc: string;
  evidenceHmacSha256: string;
  sourceCreatedAtUtc: string;
  archivedAtUtc: string;
  retainUntilUtc: string;
}>;

function binding(input: Binding): Readonly<{ keyRef: string; key: Uint8Array }> {
  const keyRef = partnerAlertRef(input.keyRef, "retentionBindingKeyRef");
  if (!(input.key instanceof Uint8Array) || input.key.byteLength < 32 || input.key.byteLength > 128) {
    throw new Error("partner_alert_retention_binding_key");
  }
  return Object.freeze({ keyRef, key: input.key });
}

function hmac(value: string, key: Uint8Array): string {
  return createHmac("sha256", key).update(value, "utf8").digest("hex");
}

function action(value: unknown): string {
  const result = partnerAlertText(value, "retainedAction");
  if (!/^[a-z]+(?:\.[a-z_]+)+$/u.test(result) || result.length > 100) throw new Error("partner_alert_retained_action");
  return result;
}

function state(value: unknown): string {
  const result = partnerAlertText(value, "retainedState");
  if (!/^[a-z][a-z_]{0,39}$/u.test(result)) throw new Error("partner_alert_retained_state");
  return result;
}

function common(input: CommonInput, sourceCreatedAtUtc: string, sourceRecordRef: string, resourceId: string) {
  const qualified = binding(input.binding);
  const sourceCreated = partnerAlertUtc(sourceCreatedAtUtc, "sourceCreatedAtUtc");
  const archivedAt = partnerAlertUtc(input.archivedAtUtc, "archivedAtUtc");
  if (archivedAt < sourceCreated) throw new Error("partner_alert_retained_time");
  return Object.freeze({
    evidenceRef: partnerAlertId(input.createId(), "evidenceRef"),
    lifecycleRef: partnerAlertId(input.lifecycleRef, "lifecycleRef"),
    communityBindingHmacSha256: hmac(`community\u0000${partnerAlertId(input.communityId, "communityId")}`, qualified.key),
    sourceRecordHmacSha256: hmac(`source\u0000${sourceRecordRef}`, qualified.key),
    bindingKeyRef: qualified.keyRef,
    resourceBindingHmacSha256: hmac(`resource\u0000${resourceId}`, qualified.key),
    sourceCreatedAtUtc: sourceCreated,
    archivedAtUtc: archivedAt,
    retainUntilUtc: partnerAlertRecordRetainUntil("pseudonymized_audit_or_idempotency", sourceCreated),
    key: qualified.key,
  });
}

export function projectPartnerAlertAuditEvidence(input: CommonInput & Readonly<{
  row: Readonly<{ auditEventId: string; action: string; resourceId: string; detailJson: string; createdAtUtc: string }>;
}>): PartnerAlertRetainedOperationEvidence {
  const detail = partnerAlertRecord(JSON.parse(input.row.detailJson), "auditDetail");
  const keys = Object.keys(detail).sort();
  if (JSON.stringify(keys) !== JSON.stringify(["partnerRevision", "resourceVersion", "state"])) {
    throw new Error("partner_alert_audit_projection");
  }
  const base = common(input, input.row.createdAtUtc, partnerAlertId(input.row.auditEventId, "auditEventId"),
    partnerAlertText(input.row.resourceId, "resourceId"));
  const { key: _key, ...safe } = base;
  void _key;
  return Object.freeze({ ...safe, recordKind: "audit", actionCode: action(input.row.action),
    partnerRevision: partnerAlertInteger(detail.partnerRevision, "partnerRevision", 1),
    resourceVersion: partnerAlertInteger(detail.resourceVersion, "resourceVersion", 1),
    stateCode: state(detail.state), fingerprintHmacSha256: null, resultHmacSha256: null });
}

export function projectPartnerAlertIdempotencyEvidence(input: CommonInput & Readonly<{
  row: Readonly<{ requestId: string; fingerprintJson: string; resultJson: string; createdAtUtc: string }>;
}>): PartnerAlertRetainedOperationEvidence {
  const fingerprint = partnerAlertRecord(JSON.parse(input.row.fingerprintJson), "commandFingerprint");
  const result = partnerAlertRecord(JSON.parse(input.row.resultJson), "commandResult");
  if (JSON.stringify(Object.keys(fingerprint).sort()) !== JSON.stringify(["action", "communityId", "payload"])
    || fingerprint.communityId !== input.communityId
    || JSON.stringify(Object.keys(result).sort()) !== JSON.stringify(["communityId", "partnerRevision", "resourceId", "resourceVersion", "state"])
    || result.communityId !== input.communityId) {
    throw new Error("partner_alert_idempotency_projection");
  }
  const base = common(input, input.row.createdAtUtc, partnerAlertId(input.row.requestId, "requestId"),
    partnerAlertText(result.resourceId, "resourceId"));
  const { key, ...safe } = base;
  return Object.freeze({ ...safe, recordKind: "idempotency", actionCode: action(fingerprint.action),
    partnerRevision: partnerAlertInteger(result.partnerRevision, "partnerRevision", 1),
    resourceVersion: partnerAlertInteger(result.resourceVersion, "resourceVersion", 1),
    stateCode: state(result.state), fingerprintHmacSha256: hmac(input.row.fingerprintJson, key),
    resultHmacSha256: hmac(input.row.resultJson, key) });
}

export type PartnerAlertProviderInboxEvidenceSource=Readonly<{ environment: "sandbox" | "live"; whopAccountId: string; eventId: string;
    eventType: string; resourceKind: "membership" | "payment" | "account"; resourceId: string;
    payloadSha256: string; occurredAtUtc: string; receivedAtUtc: string }>;

export function partnerAlertProviderInboxSourceRecord(input:PartnerAlertProviderInboxEvidenceSource):string{
  const row=partnerAlertRecord(structuredClone(input),"providerInboxRow");
  const keys=["environment","eventId","eventType","occurredAtUtc","payloadSha256","receivedAtUtc",
    "resourceId","resourceKind","whopAccountId"].sort();
  if(JSON.stringify(Object.keys(row).sort())!==JSON.stringify(keys)
    || !["sandbox","live"].includes(String(row.environment))
    || !["membership","payment","account"].includes(String(row.resourceKind))
    || !/^[0-9a-f]{64}$/u.test(String(row.payloadSha256)))throw new Error("partner_alert_provider_inbox_projection");
  const occurred=partnerAlertUtc(row.occurredAtUtc,"occurredAtUtc"),received=partnerAlertUtc(row.receivedAtUtc,"receivedAtUtc");
  if(received<occurred)throw new Error("partner_alert_provider_inbox_projection");
  return JSON.stringify(Object.fromEntries(Object.keys(row).sort().map(name=>[name,row[name]])));
}

export function projectPartnerAlertProviderInboxEvidence(input: CommonInput & Readonly<{
  row: PartnerAlertProviderInboxEvidenceSource;
  appliedFactsSha256: string;
}>): PartnerAlertRetainedOperationEvidence {
  if(!/^[0-9a-f]{64}$/u.test(input.appliedFactsSha256))throw new Error("partner_alert_provider_inbox_projection");
  const canonical=partnerAlertProviderInboxSourceRecord(input.row);
  const base=common(input,partnerAlertUtc(input.row.receivedAtUtc,"receivedAtUtc"),canonical,input.row.resourceId);
  const {key,...safe}=base;
  return Object.freeze({...safe,recordKind:"idempotency",actionCode:"partner.provider_event_applied",
    partnerRevision:null,resourceVersion:null,stateCode:"completed",
    fingerprintHmacSha256:hmac(canonical,key),resultHmacSha256:hmac(input.appliedFactsSha256,key)});
}

export function projectPartnerAlertAgreementEvidence(input: CommonInput & Readonly<{
  successorRef: string;
  previousAgreementId: string | null;
  row: Readonly<{ agreementId: string; version: number; termsJson: string; quoteJson: string;
    contractedChannels: number; proposedByUserId: string; proposedAtUtc: string }>;
  acceptance: Readonly<{ agreementId: string; acceptedByUserId: string; rulesVersion: number; acceptedAtUtc: string }>;
}>): PartnerAlertRetainedAgreementEvidence {
  const terms = parsePartnerAlertPublishingTerms(JSON.parse(input.row.termsJson));
  if (terms.communityId !== input.communityId || terms.termsId !== input.row.agreementId
    || terms.version !== input.row.version || input.acceptance.agreementId !== input.row.agreementId) {
    throw new Error("partner_alert_agreement_projection");
  }
  const quote = quotePartnerAlertPublishing({ terms, contractedChannels: input.row.contractedChannels,
    capabilities: { currencies: [terms.currency], calendarMonthCadence: true } });
  if (JSON.stringify(quote) !== input.row.quoteJson) throw new Error("partner_alert_agreement_projection");
  const base = common(input,input.row.proposedAtUtc,partnerAlertId(input.row.agreementId,"agreementId"),
    partnerAlertId(input.row.agreementId,"agreementId"));
  const { key, ...safe } = base;
  const proposer=partnerAlertId(input.row.proposedByUserId,"proposedByUserId");
  const acceptor=partnerAlertId(input.acceptance.acceptedByUserId,"acceptedByUserId");
  const acceptedAt=partnerAlertUtc(input.acceptance.acceptedAtUtc,"acceptedAtUtc");
  if (acceptedAt < base.sourceCreatedAtUtc) throw new Error("partner_alert_agreement_projection");
  const previous=input.previousAgreementId===null?null:partnerAlertId(input.previousAgreementId,"previousAgreementId");
  const rules=partnerAlertInteger(input.acceptance.rulesVersion,"acceptanceRulesVersion",1);
  return Object.freeze({ ...safe, recordKind:"agreement",successorRef:partnerAlertId(input.successorRef,"successorRef"),
    agreementVersion:partnerAlertInteger(input.row.version,"agreementVersion",1),termsVersion:terms.version,
    acceptanceRulesVersion:rules,acceptedAtUtc:acceptedAt,
    proposerBindingHmacSha256:hmac(`proposer\u0000${proposer}`,key),
    acceptorBindingHmacSha256:hmac(`acceptor\u0000${acceptor}`,key),
    previousAgreementBindingHmacSha256:previous===null?null:hmac(`agreement\u0000${previous}`,key),
    acceptanceEvidenceHmacSha256:hmac(`${input.row.agreementId}\u0000${input.acceptance.agreementId}\u0000${rules}\u0000${acceptedAt}`,key),
    pricingSource:terms.pricingSource,firstChannelAmountMinor:terms.firstChannelAmountMinor,
    additionalChannelAmountMinor:terms.additionalChannelAmountMinor,includedChannels:terms.includedChannels,
    cadenceUnit:terms.cadence.unit,cadenceCount:terms.cadence.count,contractedChannels:quote.contractedChannels,
    totalAmountMinor:quote.totalMinor,currencyCode:terms.currency.code,
    evidenceHmacSha256:hmac(`${input.row.termsJson}\u0000${input.row.quoteJson}`,key),
    retainUntilUtc:partnerAlertRecordRetainUntil("agreement_payment_refund_or_dispute",base.sourceCreatedAtUtc) });
}

export function projectPartnerAlertProviderEvidence(input: CommonInput & Readonly<{
  recordKind: "payment" | "refund" | "dispute";
  currencyCode: string;
  fact: PartnerAlertWhopPaymentFact;
}>): PartnerAlertRetainedProviderEvidence {
  const fact=partnerAlertRecord(structuredClone(input.fact),"paymentFact");
  const keys=["accountId","amountMinor","disputeState","environment","membershipId","observedAtUtc","paidAtUtc",
    "paymentId","planId","productId","refundState","state","validUntilUtc","whopUserRef"].sort();
  if (JSON.stringify(Object.keys(fact).sort()) !== JSON.stringify(keys)
    || !["paid","not_paid","uncertain"].includes(String(fact.state))
    || !["none","partial","full","unknown"].includes(String(fact.refundState))
    || !["clear","observed","unverified"].includes(String(fact.disputeState))
    || input.recordKind === "refund" && !["partial","full"].includes(String(fact.refundState))
    || input.recordKind === "dispute" && fact.disputeState !== "observed"
    || input.recordKind === "payment" && fact.state !== "paid") throw new Error("partner_alert_provider_evidence_projection");
  const currency=partnerAlertText(input.currencyCode,"currencyCode").toUpperCase();
  if (!/^[A-Z]{3}$/u.test(currency)) throw new Error("partner_alert_provider_evidence_projection");
  const observed=partnerAlertUtc(fact.observedAtUtc,"providerObservedAtUtc");
  const paid=fact.paidAtUtc===null?null:partnerAlertUtc(fact.paidAtUtc,"paidAtUtc");
  if (paid !== null && paid > observed) throw new Error("partner_alert_provider_evidence_projection");
  const amount=partnerAlertInteger(fact.amountMinor,"amountMinor",0,Number.MAX_SAFE_INTEGER);
  const canonical=JSON.stringify(Object.fromEntries(Object.keys(fact).sort().map(name=>[name,fact[name]])));
  const base=common(input,input.recordKind==="payment"&&paid!==null?paid:observed,
    `${input.recordKind}\u0000${canonical}`,partnerAlertText(fact.membershipId,"membershipId"));
  const {key,resourceBindingHmacSha256:_resource,...safe}=base;
  void _resource;
  const membership=hmac(`membership\u0000${fact.environment}\u0000${fact.accountId}\u0000${fact.membershipId}`,key);
  return Object.freeze({...safe,recordKind:input.recordKind,successorRef:membership,
    providerRecordHmacSha256:hmac(`provider_record\u0000${canonical}`,key),
    providerAccountBindingHmacSha256:hmac(`provider_account\u0000${fact.environment}\u0000${fact.accountId}`,key),
    membershipBindingHmacSha256:membership,payerBindingHmacSha256:hmac(`payer\u0000${fact.whopUserRef}`,key),
    providerStateCode:fact.state as PartnerAlertRetainedProviderEvidence["providerStateCode"],
    refundStateCode:fact.refundState as PartnerAlertRetainedProviderEvidence["refundStateCode"],
    disputeStateCode:fact.disputeState as PartnerAlertRetainedProviderEvidence["disputeStateCode"],
    amountMinor:amount,currencyCode:currency,paidAtUtc:paid,providerObservedAtUtc:observed,
    evidenceHmacSha256:hmac(`${input.recordKind}\u0000${canonical}`,key),
    retainUntilUtc:partnerAlertRecordRetainUntil("agreement_payment_refund_or_dispute",base.sourceCreatedAtUtc)});
}
