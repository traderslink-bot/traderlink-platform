import type Database from "better-sqlite3";
import { erasureHold } from "../../platform/server/privacy/platform-erasure-admission";
import { partnerAlertId, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { PartnerAlertErasureClaimSuccessors } from "./partner-alert-erasure-claim-successors";
import { PartnerAlertRetainedEvidenceRepository } from "./partner-alert-retained-evidence-repository";
import { projectPartnerAlertAgreementEvidence, projectPartnerAlertAuditEvidence,
  projectPartnerAlertIdempotencyEvidence } from "./partner-alert-retained-evidence";

type Binding = Readonly<{ keyRef: string; key: Uint8Array }>;
type Claim = Readonly<{ participant: string; claim_ref: string; original_json: string; state: string }>;
type Row = Record<string, unknown>;

/** Converts identifying operational/commercial originals into the exact
 * owner-approved retained projections. It runs only inside the admitted writer;
 * source deletion and final claim purge remain separate verified steps. */
export class PartnerAlertErasureEvidenceArchiver {
  private readonly successors: PartnerAlertErasureClaimSuccessors;
  private readonly retained: PartnerAlertRetainedEvidenceRepository;
  constructor(private readonly database: Database.Database, private readonly configuration: Readonly<{
    binding: Binding; nowUtc: () => string; createId: () => string;
  }>) {
    this.successors = new PartnerAlertErasureClaimSuccessors(database,configuration.binding);
    this.retained = new PartnerAlertRetainedEvidenceRepository(database);
  }
  archive(operationRef: string): number {
    if (!this.database.inTransaction) return erasureHold();
    const operation = partnerAlertId(operationRef,"operationRef");
    const at = partnerAlertUtc(this.configuration.nowUtc(),"archivedAtUtc");
    const moduleOperation = this.database.prepare(`SELECT lifecycle_ref FROM platform_erasure_module_operations
      WHERE operation_ref=? AND phase IN ('prepared','settling','ready')`).get(operation) as { lifecycle_ref:string }|undefined;
    if (!moduleOperation) return erasureHold();
    const claims = this.database.prepare(`SELECT participant,claim_ref,original_json,state
      FROM platform_erasure_operation_claims WHERE operation_ref=?
        AND participant IN ('partner_audit','partner_command','partner_agreement')
      ORDER BY participant,claim_ref LIMIT 10001`).all(operation) as Claim[];
    if (claims.length>10_000 || claims.some(claim=>claim.state==="in_flight"||claim.state==="purged")) return erasureHold();
    for (const claim of claims) {
      let source: Row;
      try { source=JSON.parse(claim.original_json) as Row; } catch { return erasureHold(); }
      const common={lifecycleRef:moduleOperation.lifecycle_ref,communityId:String(source.community_id),archivedAtUtc:at,
        binding:this.configuration.binding,createId:this.configuration.createId};
      if (claim.participant==="partner_audit") {
        this.retained.retainOperation(projectPartnerAlertAuditEvidence({...common,row:{
          auditEventId:String(source.audit_event_id),action:String(source.action),resourceId:String(source.resource_id),
          detailJson:String(source.detail_json),createdAtUtc:String(source.created_at_utc)}}));
        this.successors.recordRetainedOperationEvidence({operationRef:operation,participant:"partner_audit",
          claimRef:claim.claim_ref,verifiedAtUtc:at});
      } else if (claim.participant==="partner_command") {
        this.retained.retainOperation(projectPartnerAlertIdempotencyEvidence({...common,row:{
          requestId:String(source.request_id),fingerprintJson:String(source.fingerprint_json),
          resultJson:String(source.result_json),createdAtUtc:String(source.created_at_utc)}}));
        this.successors.recordRetainedOperationEvidence({operationRef:operation,participant:"partner_command",
          claimRef:claim.claim_ref,verifiedAtUtc:at});
      } else if (claim.participant==="partner_agreement") {
        const previous=this.database.prepare(`SELECT agreement_id FROM partner_alert_publishing_agreements
          WHERE community_id=? AND version<? ORDER BY version DESC LIMIT 1`).get(source.community_id,source.version) as
          {agreement_id:string}|undefined;
        this.retained.retainAgreement(projectPartnerAlertAgreementEvidence({...common,
          successorRef:this.configuration.createId(),previousAgreementId:previous?.agreement_id??null,row:{
            agreementId:String(source.agreement_id),version:Number(source.version),termsJson:String(source.terms_json),
            quoteJson:String(source.quote_json),contractedChannels:Number(source.contracted_channels),
            proposedByUserId:String(source.proposed_by_user_id),proposedAtUtc:String(source.proposed_at_utc)},acceptance:{
            agreementId:String(source.agreement_id),acceptedByUserId:String(source.accepted_by_user_id),
            rulesVersion:Number(source.rules_version),acceptedAtUtc:String(source.accepted_at_utc)}}));
        this.successors.recordRetainedAgreementEvidence({operationRef:operation,participant:"partner_agreement",
          claimRef:claim.claim_ref,verifiedAtUtc:at});
      } else return erasureHold();
    }
    return claims.length;
  }
}
