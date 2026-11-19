import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { currentPlatformErasureAdmission, erasureHold, type PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import type { PartnerAlertCommunityFence } from "./partner-alert-admission";
import { partnerAlertId, partnerAlertSnowflake } from "../contracts/partner-alert-validation";
import { purgePartnerAlertWhopEvidence } from "./partner-alert-whop-evidence-retention";
import { disconnectPartnerAlertWhopConnections } from "./partner-alert-retention-policy";
import { projectPartnerAlertRoleCleanup, projectPlatformPremiumRoleCleanup,
  retainPartnerAlertRoleCleanup, type PartnerAlertRoleErasureSource,
  type PlatformPremiumRoleErasureSource } from "./partner-alert-erasure-cleanup";
import { PartnerAlertErasureAnonymizer } from "./partner-alert-erasure-anonymizer";
import { PartnerAlertErasureEvidenceArchiver } from "./partner-alert-erasure-evidence-archiver";
import { PartnerAlertErasureClaimSuccessors } from "./partner-alert-erasure-claim-successors";
import { PartnerAlertErasureTombstoneCoordinator } from "./partner-alert-erasure-tombstone-coordinator";
import { currentPartnerAlertErasureRuntime, type PartnerAlertErasureRuntime } from "./partner-alert-erasure-runtime";

import { partnerDeliveryMetadata, readPartnerDeliveryTextBinding } from "./partner-alert-erasure-delivery-text-binding";

type Row = Record<string, unknown>;
const digest = (text: string): string => createHash("sha256").update(text).digest("hex");
export type PartnerErasurePreparation = Readonly<{ ready: boolean; holdCode: string | null }>;
type DeliveryOriginal = Readonly<{ delivery_id: string; community_id: string; mapping_id: string;
  source_revision: number; destination_channel_id: string; destination_message_id: string | null; action: string }>;

/** Durable exact originals; no timer, provider calls or broad erasure bypass.
 * Preparation never replaces a queued ticket or interprets lease expiry as a
 * receipt. Retention of captured private bodies remains separately HELD. */
export class PartnerAlertErasureRecovery {
  constructor(private readonly database: Database.Database, private readonly core: PlatformErasureAdmission,
    private readonly runtime:PartnerAlertErasureRuntime|null=null) {}
  private capture(operationRef: string, participant: string, key: readonly unknown[], row: Row, inFlight: boolean): void {
    // Delivery settlement requires IDs/lease/status, never a second alert-body
    // archive. Historical body-bearing claims need separately admitted cleanup.
    const captured = participant === "partner_delivery"
      ? partnerDeliveryMetadata(row) : row;
    const claimRef = digest(JSON.stringify(key)), original = JSON.stringify(captured), hash = digest(original);
    if (Buffer.byteLength(original) > 2 * 1024 * 1024) return erasureHold();
    const old = this.database.prepare(`SELECT original_sha256,original_json,state FROM platform_erasure_operation_claims
      WHERE operation_ref=? AND participant=? AND claim_ref=?`).get(operationRef, participant, claimRef) as
      { original_sha256: string; original_json: string; state:string } | undefined;
    if (old) {
      // Changed sources are never silently recaptured over an original claim.
      readPartnerDeliveryTextBinding(this.database, this.runtime?.binding ?? null, operationRef,
        { ...old, participant, claim_ref: claimRef });
      const matches = participant === "partner_delivery"
        ? JSON.stringify(partnerDeliveryMetadata(JSON.parse(old.original_json))) === original
        : old.original_sha256 === hash;
      if (old.state !== "settled" && !matches) {
        // Preparation itself pauses the publisher. A second preparation may
        // see only this exact transition, while the original claim stays intact.
        if (participant !== "partner_owner" || digest(old.original_json) !== old.original_sha256) return erasureHold();
        const prior = JSON.parse(old.original_json) as Row;
        const { status, revision, updated_at_utc: updatedAt, ...facts } = row;
        const { status: priorStatus, revision: priorRevision, updated_at_utc: priorUpdatedAt, ...priorFacts } = prior;
        if (status !== "publishing_paused" || ["publishing_paused", "suspended", "ended"].includes(String(priorStatus))
          || typeof priorRevision !== "number" || revision !== priorRevision + 1
          || typeof updatedAt !== "string" || typeof priorUpdatedAt !== "string" || updatedAt < priorUpdatedAt
          || JSON.stringify(facts) !== JSON.stringify(priorFacts)) return erasureHold();
      }
      return;
    }
    const budget = this.database.prepare(`SELECT COUNT(*) n,COALESCE(SUM(length(CAST(original_json AS BLOB))),0) bytes
      FROM platform_erasure_operation_claims WHERE operation_ref=?`).get(operationRef) as { n: number; bytes: number };
    if (budget.n >= 10_000 || budget.bytes + Buffer.byteLength(original) > 32 * 1024 * 1024) return erasureHold();
    this.database.prepare("INSERT INTO platform_erasure_operation_claims VALUES(?,?,?,?,?,?,NULL)")
      .run(operationRef, participant, claimRef, original, hash, inFlight ? "in_flight" : "captured");
  }
  private claimState(operationRef: string, participant: string, key: readonly unknown[]): "captured" | "in_flight" | "settled" {
    const row = this.database.prepare(`SELECT state FROM platform_erasure_operation_claims
      WHERE operation_ref=? AND participant=? AND claim_ref=?`).get(operationRef,participant,digest(JSON.stringify(key))) as
      { state: "captured" | "in_flight" | "settled" } | undefined;
    if (!row || !["captured","in_flight","settled"].includes(row.state)) return erasureHold();
    return row.state;
  }
  private partnerCleanupRows(operationRef: string, jobs: readonly Row[]) {
    const capturedAtUtc = this.core.operation(operationRef).prepared_at_utc;
    return jobs.map(row => {
      const claimRef=digest(JSON.stringify([row.mapping_id,row.user_id,row.discord_user_id]));
      const claim=this.database.prepare(`SELECT original_json,original_sha256,state,outcome_ref
        FROM platform_erasure_operation_claims WHERE operation_ref=? AND participant='partner_role' AND claim_ref=?`)
        .get(operationRef,claimRef) as {original_json:string;original_sha256:string;
          state:"captured"|"in_flight"|"settled";outcome_ref:string|null}|undefined;
      if(!claim||digest(claim.original_json)!==claim.original_sha256)return erasureHold();
      let source=JSON.parse(claim.original_json) as PartnerAlertRoleErasureSource;
      let quiescence:undefined|{token:string;outcomeRef:string;quiescenceRef:string};
      if(claim.state==="settled"){
        const leaseToken = source.lease_token;
        if(!claim.outcome_ref||!leaseToken)return erasureHold();
        const outcome=this.database.prepare(`SELECT original_json,original_sha256 FROM platform_erasure_operation_claims
          WHERE operation_ref=? AND participant='partner_role_outcome' AND claim_ref=?`).get(operationRef,claim.outcome_ref) as
          {original_json:string;original_sha256:string}|undefined;
        if(!outcome||digest(outcome.original_json)!==outcome.original_sha256)return erasureHold();
        if(row.status!=="held"||row.lease_token!==null||row.in_flight_intent_json!==null
          ||row.outcome_json!==outcome.original_json||row.mapping_id!==source.mapping_id||row.user_id!==source.user_id
          ||row.discord_user_id!==source.discord_user_id)return erasureHold();
        source={...source,outcome_json:outcome.original_json};
        quiescence={token:leaseToken,outcomeRef:claim.outcome_ref,
          quiescenceRef:`role_quiescence:${claim.outcome_ref}`};
      }
      return projectPartnerAlertRoleCleanup({receiptRef:operationRef,capturedAtUtc,source,
        originalClaimState:claim.state,quiescence});
    });
  }
  private nativeCleanupRows(operationRef: string, userId: string, jobs: readonly Row[]) {
    const capturedAtUtc = this.core.operation(operationRef).prepared_at_utc;
    return jobs.map(row=>{
      const claimRef=digest(JSON.stringify([row.guild_id,row.discord_user_id,row.role_id]));
      const claim=this.database.prepare(`SELECT original_json,original_sha256,state,outcome_ref
        FROM platform_erasure_operation_claims WHERE operation_ref=? AND participant='premium_role' AND claim_ref=?`)
        .get(operationRef,claimRef) as {original_json:string;original_sha256:string;
          state:"captured"|"in_flight"|"settled";outcome_ref:string|null}|undefined;
      if(!claim||digest(claim.original_json)!==claim.original_sha256)return erasureHold();
      let source=JSON.parse(claim.original_json) as PlatformPremiumRoleErasureSource;
      let quiescence:undefined|{token:string;outcomeRef:string;quiescenceRef:string};
      if(claim.state==="settled"){
        if(!claim.outcome_ref)return erasureHold();
        const outcome=this.database.prepare(`SELECT original_json,original_sha256 FROM platform_erasure_operation_claims
          WHERE operation_ref=? AND participant='premium_role_outcome' AND claim_ref=?`).get(operationRef,claim.outcome_ref) as
          {original_json:string;original_sha256:string}|undefined;
        if(!outcome||digest(outcome.original_json)!==outcome.original_sha256)return erasureHold();
        const receipt=JSON.parse(outcome.original_json) as {claim?:{token?:unknown;job?:{lease?:unknown}};
          result?:Record<string,unknown>;receivedAtUtc?:unknown};
        const job=JSON.parse(source.job_json) as Record<string,unknown>,lease=receipt.claim?.job?.lease as Record<string,unknown>|undefined;
        if(!lease||typeof receipt.claim?.token!=="string"||receipt.claim.token!==lease.token||!receipt.result
          ||receipt.result.kind==="uncertain"||typeof receipt.receivedAtUtc!=="string")return erasureHold();
        job.lastOutcome={token:receipt.claim.token,intent:lease.intent,kind:receipt.result.kind,
          actualPresent:receipt.result.kind==="confirmed"?receipt.result.present:job.actualPresent,
          receivedAtUtc:receipt.receivedAtUtc};
        source={...source,job_json:JSON.stringify(job)};
        quiescence={token:receipt.claim.token,outcomeRef:claim.outcome_ref,
          quiescenceRef:`role_quiescence:${claim.outcome_ref}`};
      }
      return projectPlatformPremiumRoleCleanup({receiptRef:operationRef,capturedAtUtc,source,
        originalClaimState:claim.state,erasedUserId:userId,quiescence});
    });
  }
  prepare(operationRef: string, userId: string): PartnerErasurePreparation {
    this.core.assertCurrent(); const op = this.core.operation(operationRef);
    const life = this.core.lifecycle(userId);
    if (life.operation_ref !== operationRef || op.lifecycle_ref !== life.lifecycle_ref) return erasureHold();
    const native = this.core.memberRepository();
    const references = native.inspectRootErasureReferences(userId);
    let holdCode: string | null = "kind" in references || references.blockingReasons.length ? "native_signer_disposition_unqualified" : null;
    if (!this.runtime && (this.database.prepare(`SELECT 1 FROM partner_alert_partners WHERE approved_by_user_id=? LIMIT 1`).get(userId)
      || this.database.prepare("SELECT 1 FROM partner_alert_publishing_agreements WHERE proposed_by_user_id=? LIMIT 1").get(userId)
      || this.database.prepare("SELECT 1 FROM partner_alert_agreement_acceptances WHERE accepted_by_user_id=? LIMIT 1").get(userId)
      || this.database.prepare("SELECT 1 FROM partner_alert_audit_events WHERE actor_user_id=? LIMIT 1").get(userId)
      || this.database.prepare("SELECT 1 FROM partner_alert_commands WHERE actor_user_id=? LIMIT 1").get(userId))) {
      holdCode = "commercial_or_original_authorization_disposition_unqualified";
    }
    if(this.database.prepare(`SELECT 1 FROM platform_erasure_gift_authorizations g
      JOIN platform_premium_authorities a USING(authority_key) WHERE a.user_id=? LIMIT 1`).get(userId)){
      holdCode="original_gift_authorization_disposition_unqualified";
    }
    if (this.database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_communities'").get()
      && this.database.prepare("SELECT 1 FROM traderlink_communities WHERE owner_user_id=? LIMIT 1").get(userId)) {
      holdCode = "shared_community_owner_disposition_unqualified";
    }
    if (this.database.prepare(`SELECT 1 FROM platform_premium_complimentary_redactions_v2 WHERE
      json_extract(receipt_json,'$.scope.recipientUserId')=? LIMIT 1`).get(userId)
      || this.database.prepare("SELECT 1 FROM platform_premium_signer_redaction_protocol WHERE recipient_user_id=? LIMIT 1").get(userId)) {
      holdCode = "retained_recipient_provenance_unqualified";
    }
    const owners = this.database.prepare("SELECT * FROM partner_alert_partners WHERE owner_user_id=? ORDER BY community_id LIMIT 10001")
      .all(userId) as Row[];
    if (owners.length > 10_000) return erasureHold();
    for(const row of owners)this.capture(operationRef,"partner_owner",[row.community_id],row,false);
    const audits = this.database.prepare(`SELECT * FROM partner_alert_audit_events WHERE actor_user_id=?
      ORDER BY audit_event_id LIMIT 10001`).all(userId) as Row[];
    const commands = this.database.prepare(`SELECT * FROM partner_alert_commands WHERE actor_user_id=?
      ORDER BY actor_user_id,request_id LIMIT 10001`).all(userId) as Row[];
    const agreements = this.database.prepare(`SELECT a.*,x.accepted_by_user_id,x.rules_version,x.accepted_at_utc
      FROM partner_alert_publishing_agreements a JOIN partner_alert_agreement_acceptances x
        ON x.agreement_id=a.agreement_id AND x.community_id=a.community_id
      WHERE a.proposed_by_user_id=? OR x.accepted_by_user_id=?
      ORDER BY a.community_id,a.version,a.agreement_id LIMIT 10001`).all(userId,userId) as Row[];
    if (audits.length>10_000||commands.length>10_000||agreements.length>10_000)return erasureHold();
    for(const row of audits)this.capture(operationRef,"partner_audit",[row.audit_event_id],row,false);
    for(const row of commands)this.capture(operationRef,"partner_command",[row.actor_user_id,row.request_id],row,false);
    for(const row of agreements)this.capture(operationRef,"partner_agreement",[row.agreement_id],row,false);
    if(this.runtime)new PartnerAlertErasureEvidenceArchiver(this.database,this.runtime).archive(operationRef);
    purgePartnerAlertWhopEvidence(this.database, { kind: "subscriber", userId });
    for (const owner of owners) {
      // These local fences commit even when shared ownership deletion is HELD.
      // Existing subscribers, purchases, agreements and provider billing remain.
      this.database.prepare(`UPDATE partner_alert_partners SET status='publishing_paused',revision=revision+1,
        updated_at_utc=? WHERE community_id=? AND status NOT IN ('publishing_paused','suspended','ended')`)
        .run(this.core.now(), owner.community_id);
      this.database.prepare("UPDATE partner_alert_mappings SET delivery_state='paused' WHERE community_id=? AND delivery_state!='paused'")
        .run(owner.community_id);
      disconnectPartnerAlertWhopConnections(this.database, partnerAlertId(owner.community_id, "communityId"));
      const inbox = this.database.prepare("SELECT * FROM partner_alert_whop_inbox WHERE community_id=? ORDER BY environment,whop_account_id,event_id LIMIT 10001")
        .all(owner.community_id) as Row[];
      const deliveries = this.database.prepare("SELECT * FROM partner_alert_deliveries WHERE community_id=? ORDER BY delivery_id LIMIT 10001")
        .all(owner.community_id) as Row[];
      if (inbox.length + deliveries.length > 10_000) return erasureHold();
      for (const row of inbox) this.capture(operationRef, "partner_inbox", [row.environment,row.whop_account_id,row.event_id], row, row.status === "processing");
      for (const row of deliveries) this.capture(operationRef, "partner_delivery", [row.delivery_id], row, ["sending","uncertain"].includes(String(row.status)));
      if(!this.runtime)holdCode = "shared_owner_and_commercial_retention_unqualified";
    }
    const jobs = this.database.prepare(`SELECT j.*,m.destination_guild_id,m.destination_role_id FROM partner_alert_role_jobs j
      JOIN partner_alert_mappings m ON m.mapping_id=j.mapping_id AND m.community_id=j.community_id
      WHERE j.user_id=? OR j.community_id IN (SELECT community_id FROM partner_alert_partners WHERE owner_user_id=?)
      ORDER BY j.mapping_id,j.discord_user_id LIMIT 10001`).all(userId,userId) as Row[];
    const nativeJobs = this.database.prepare(`SELECT j.* FROM platform_premium_role_jobs j
      WHERE json_extract(j.job_json,'$.intent.scope.userId')=?
        OR json_extract(j.job_json,'$.intent.ticket.scope.userId')=?
        OR json_extract(j.job_json,'$.lease.intent.scope.userId')=?
        OR json_extract(j.job_json,'$.lease.intent.ticket.scope.userId')=?
        OR json_extract(j.job_json,'$.lastOutcome.intent.scope.userId')=?
        OR json_extract(j.job_json,'$.lastOutcome.intent.ticket.scope.userId')=?
        OR json_extract(j.job_json,'$.managedAssignment.ticket.scope.userId')=?
      ORDER BY j.guild_id,j.discord_user_id,j.role_id LIMIT 10001`).all(...Array(7).fill(userId)) as Row[];
    const refresh = this.database.prepare("SELECT * FROM partner_alert_premium_refresh_events WHERE user_id=? ORDER BY authority_key,authority_revision,observed_at_utc,reason LIMIT 10001")
      .all(userId) as Row[];
    const nativeEvents = this.database.prepare(`SELECT * FROM platform_premium_paid_events
      WHERE json_extract(event_json,'$.scope.userId')=? OR json_extract(event_json,'$.ticket.scope.userId')=?
      ORDER BY guild_id,paid_role_id,authority_key,authority_revision,observed_at_utc LIMIT 10001`).all(userId,userId) as Row[];
    if (jobs.length + nativeJobs.length + refresh.length + nativeEvents.length > 10_000) return erasureHold();
    for (const row of jobs) this.capture(operationRef, "partner_role", [row.mapping_id,row.user_id,row.discord_user_id], row, ["applying","uncertain"].includes(String(row.status)));
    for (const row of nativeJobs) this.capture(operationRef, "premium_role", [row.guild_id,row.discord_user_id,row.role_id], row, ["applying","uncertain"].includes(String(row.state)));
    for (const row of refresh) this.capture(operationRef, "partner_refresh", [row.authority_key,row.authority_revision,row.observed_at_utc,row.reason], row, false);
    for (const row of nativeEvents) this.capture(operationRef, "premium_event", [row.guild_id,row.paid_role_id,row.authority_key,row.authority_revision,row.observed_at_utc], row, false);
    // A settled Partner job becomes a minimal idempotent remove-role obligation.
    // In-flight/uncertain claims still throw/hold until their exact outcome is retained.
    this.partnerCleanupRows(operationRef,jobs);
    this.nativeCleanupRows(operationRef,userId,nativeJobs);
    // Captured private bodies still require their exact retained-evidence and
    // tombstone successor before the claims themselves may be purged.
    if (!this.runtime && (jobs.length || nativeJobs.length || refresh.length || nativeEvents.length || audits.length || commands.length
      || agreements.length)) holdCode ??= "captured_payload_disposition_unqualified";
    if(this.runtime){
      const successors=new PartnerAlertErasureClaimSuccessors(this.database,this.runtime.binding);
      for(const owner of owners){
        const deliveries=this.database.prepare("SELECT delivery_id FROM partner_alert_deliveries WHERE community_id=? ORDER BY delivery_id")
          .all(owner.community_id) as {delivery_id:string}[];
        for(const delivery of deliveries)if(this.claimState(operationRef,"partner_delivery",[delivery.delivery_id])!=="in_flight"){
          successors.recordDeliverySettlement({operationRef,participant:"partner_delivery",
            claimRef:digest(JSON.stringify([delivery.delivery_id])),verifiedAtUtc:this.core.now()});
          const parent=this.database.prepare(`SELECT outcome_ref FROM platform_erasure_operation_claims
            WHERE operation_ref=? AND participant='partner_delivery' AND claim_ref=? AND state='settled'`).get(operationRef,
            digest(JSON.stringify([delivery.delivery_id]))) as {outcome_ref:string|null}|undefined;
          if(parent?.outcome_ref)successors.recordDeliveryTransportQuiescence({operationRef,
            participant:"partner_delivery_outcome",claimRef:parent.outcome_ref,verifiedAtUtc:this.core.now()});
        }
        const inboxClaims=this.database.prepare(`SELECT event_id,environment,whop_account_id FROM partner_alert_whop_inbox
          WHERE community_id=? AND status='completed' ORDER BY environment,whop_account_id,event_id`).all(owner.community_id) as
          {event_id:string;environment:string;whop_account_id:string}[];
        for(const inboxClaim of inboxClaims)successors.recordProviderInboxDisposition({operationRef,
          participant:"partner_inbox",claimRef:digest(JSON.stringify([inboxClaim.environment,inboxClaim.whop_account_id,
            inboxClaim.event_id])),verifiedAtUtc:this.core.now()});
      }
    }
    if (this.database.prepare("SELECT 1 FROM platform_erasure_operation_claims WHERE operation_ref=? AND state='in_flight' LIMIT 1").get(operationRef)) {
      holdCode = "original_external_operation_unsettled";
    }
    return Object.freeze({ ready: holdCode === null, holdCode });
  }
  beforeRootDelete(operationRef: string, userId: string): void {
    this.core.assertCurrent();
    const result = this.prepare(operationRef, userId);
    if (!result.ready) return erasureHold();
    if(!this.runtime)return erasureHold();
    new PartnerAlertErasureTombstoneCoordinator(this.database,this.runtime).prepare(operationRef,userId);
    const jobs = this.database.prepare(`SELECT j.*,m.destination_guild_id,m.destination_role_id FROM partner_alert_role_jobs j
      JOIN partner_alert_mappings m ON m.mapping_id=j.mapping_id AND m.community_id=j.community_id
      WHERE j.user_id=? OR j.community_id IN (SELECT community_id FROM partner_alert_partners WHERE owner_user_id=?)
      ORDER BY j.mapping_id,j.discord_user_id LIMIT 10001`).all(userId,userId) as Row[];
    if (jobs.length > 10_000) return erasureHold();
    const successors=this.runtime?new PartnerAlertErasureClaimSuccessors(this.database,this.runtime.binding):null;
    const partnerCleanups=this.partnerCleanupRows(operationRef,jobs);
    for (let index=0;index<partnerCleanups.length;index++){
      const cleanup=partnerCleanups[index]!,row=jobs[index]!;
      retainPartnerAlertRoleCleanup(this.database,cleanup);
      if(!successors)return erasureHold();
      successors.recordRoleCleanup({operationRef,participant:"partner_role",
        claimRef:digest(JSON.stringify([row.mapping_id,row.user_id,row.discord_user_id])),verifiedAtUtc:this.core.now()});
      const settled=this.database.prepare(`SELECT outcome_ref FROM platform_erasure_operation_claims
        WHERE operation_ref=? AND participant='partner_role' AND claim_ref=? AND state='settled'`).get(operationRef,
        digest(JSON.stringify([row.mapping_id,row.user_id,row.discord_user_id]))) as {outcome_ref:string|null}|undefined;
      if(settled?.outcome_ref)successors.recordRoleTransportQuiescence({operationRef,
        participant:"partner_role_outcome",claimRef:settled.outcome_ref,verifiedAtUtc:this.core.now()});
      if(this.database.prepare(`DELETE FROM partner_alert_role_jobs WHERE mapping_id=? AND user_id=?
        AND discord_user_id=? AND desired_ticket_json=? AND status NOT IN ('applying','uncertain')`).run(
        row.mapping_id,row.user_id,row.discord_user_id,row.desired_ticket_json).changes!==1)return erasureHold();
    }
    const nativeJobs = this.database.prepare(`SELECT j.* FROM platform_premium_role_jobs j
      WHERE json_extract(j.job_json,'$.intent.scope.userId')=?
        OR json_extract(j.job_json,'$.intent.ticket.scope.userId')=?
        OR json_extract(j.job_json,'$.lease.intent.scope.userId')=?
        OR json_extract(j.job_json,'$.lease.intent.ticket.scope.userId')=?
        OR json_extract(j.job_json,'$.lastOutcome.intent.scope.userId')=?
        OR json_extract(j.job_json,'$.lastOutcome.intent.ticket.scope.userId')=?
        OR json_extract(j.job_json,'$.managedAssignment.ticket.scope.userId')=?
      ORDER BY j.guild_id,j.discord_user_id,j.role_id LIMIT 10001`).all(...Array(7).fill(userId)) as Row[];
    const nativeEvents = this.database.prepare(`SELECT * FROM platform_premium_paid_events
      WHERE json_extract(event_json,'$.scope.userId')=? OR json_extract(event_json,'$.ticket.scope.userId')=?
      ORDER BY guild_id,paid_role_id,authority_key,authority_revision,observed_at_utc LIMIT 10001`).all(userId,userId) as Row[];
    const refresh = this.database.prepare(`SELECT * FROM partner_alert_premium_refresh_events WHERE user_id=?
      ORDER BY authority_key,authority_revision,observed_at_utc,reason LIMIT 10001`).all(userId) as Row[];
    if (nativeJobs.length + nativeEvents.length + refresh.length > 10_000) return erasureHold();
    const nativeCleanups=this.nativeCleanupRows(operationRef,userId,nativeJobs);
    for(let index=0;index<nativeCleanups.length;index++){
      const cleanup=nativeCleanups[index]!,row=nativeJobs[index]!;
      retainPartnerAlertRoleCleanup(this.database,cleanup);
      if(!successors)return erasureHold();
      successors.recordRoleCleanup({operationRef,participant:"premium_role",
        claimRef:digest(JSON.stringify([row.guild_id,row.discord_user_id,row.role_id])),verifiedAtUtc:this.core.now()});
      const settled=this.database.prepare(`SELECT outcome_ref FROM platform_erasure_operation_claims
        WHERE operation_ref=? AND participant='premium_role' AND claim_ref=? AND state='settled'`).get(operationRef,
        digest(JSON.stringify([row.guild_id,row.discord_user_id,row.role_id]))) as {outcome_ref:string|null}|undefined;
      if(settled?.outcome_ref)successors.recordRoleTransportQuiescence({operationRef,
        participant:"premium_role_outcome",claimRef:settled.outcome_ref,verifiedAtUtc:this.core.now()});
    }
    for (const row of nativeJobs) if (this.database.prepare(`DELETE FROM platform_premium_role_jobs
      WHERE guild_id=? AND discord_user_id=? AND role_id=? AND job_json=?`).run(
        row.guild_id,row.discord_user_id,row.role_id,row.job_json).changes !== 1) return erasureHold();
    for (const row of nativeEvents) if (this.database.prepare(`DELETE FROM platform_premium_paid_events
      WHERE guild_id=? AND paid_role_id=? AND authority_key=? AND authority_revision=? AND observed_at_utc=?
        AND event_json=?`).run(row.guild_id,row.paid_role_id,row.authority_key,row.authority_revision,
        row.observed_at_utc,row.event_json).changes !== 1) return erasureHold();
    for (const row of refresh) if (this.database.prepare(`DELETE FROM partner_alert_premium_refresh_events
      WHERE authority_key=? AND authority_revision=? AND user_id=? AND observed_at_utc=? AND reason=?`).run(
        row.authority_key,row.authority_revision,row.user_id,row.observed_at_utc,row.reason).changes !== 1) return erasureHold();
    const inboxRows=this.database.prepare(`SELECT * FROM partner_alert_whop_inbox WHERE community_id IN
      (SELECT community_id FROM partner_alert_partners WHERE owner_user_id=?)
      ORDER BY community_id,environment,whop_account_id,event_id LIMIT 10001`).all(userId) as Row[];
    if(inboxRows.length>10_000||inboxRows.some(row=>row.status==="processing"))return erasureHold();
    for(const row of inboxRows)if(this.database.prepare(`DELETE FROM partner_alert_whop_inbox WHERE community_id=?
      AND environment=? AND whop_account_id=? AND event_id=? AND status=? AND payload_sha256=?
      AND lease_token IS NULL AND lease_until_utc IS NULL AND admission_fence_json IS NULL`).run(row.community_id,
      row.environment,row.whop_account_id,row.event_id,row.status,row.payload_sha256).changes!==1)return erasureHold();
    this.core.markReady(operationRef);
    if(this.runtime)new PartnerAlertErasureAnonymizer(this.database,this.runtime).anonymize(operationRef,userId,this.core.now());
    // Native owns its erasure epoch and private six-table disposition. Its AFTER
    // retention barriers remain intact; no trigger is weakened or replaced.
    this.core.memberRepository().fenceForRootErasure(userId, operationRef);
  }
  afterLogicalDelete(operationRef:string):void {
    if(!this.database.inTransaction||!this.runtime)return erasureHold();
    const operation=this.core.operation(operationRef);
    if(operation.phase!=="logical_deleted")return erasureHold();
    const coordinator=new PartnerAlertErasureTombstoneCoordinator(this.database,this.runtime);
    coordinator.commit(operationRef);
    const successors=new PartnerAlertErasureClaimSuccessors(this.database,this.runtime.binding),at=this.core.now();
    successors.recordRestoreTombstone({operationRef,participant:"partner_tombstone",claimRef:"restore_tombstone",verifiedAtUtc:at});
    const privateClaims=this.database.prepare(`SELECT participant,claim_ref FROM platform_erasure_operation_claims
      WHERE operation_ref=? AND participant IN ('partner_refresh','premium_event') ORDER BY participant,claim_ref`)
      .all(operationRef) as {participant:"partner_refresh"|"premium_event";claim_ref:string}[];
    for(const claim of privateClaims)successors.recordPrivateDisposition({operationRef,participant:claim.participant,
      claimRef:claim.claim_ref,verifiedAtUtc:at});
    const inboxClaims=this.database.prepare(`SELECT claim_ref FROM platform_erasure_operation_claims
      WHERE operation_ref=? AND participant='partner_inbox' ORDER BY claim_ref`).all(operationRef) as {claim_ref:string}[];
    for(const claim of inboxClaims)successors.recordProviderInboxDisposition({operationRef,participant:"partner_inbox",
      claimRef:claim.claim_ref,verifiedAtUtc:at});
    successors.purgeCovered(operationRef);
  }
  /** Exact late role response only, while the principal remains fenced. This
   * settles the ORIGINAL external operation; it cannot enqueue/rehydrate work,
   * alter a ticket, grant a role, or claim private-payload purge completion. */
  recordLateRoleOutcome(userId: string, token: string, originalIntent: unknown, result: unknown): boolean {
    if (this.database.inTransaction) return erasureHold();
    return this.database.transaction(() => {
      const life = this.core.lifecycle(userId);
      if (!life.operation_ref || !["preparing","settling"].includes(life.phase)) return false;
      const intent = originalIntent as Row;
      if (!intent || typeof intent !== "object") return erasureHold();
      const original = this.database.prepare(`SELECT j.*,m.destination_guild_id,m.destination_role_id FROM partner_alert_role_jobs j
        JOIN partner_alert_mappings m ON m.mapping_id=j.mapping_id AND m.community_id=j.community_id
        JOIN partner_alert_partners p ON p.community_id=j.community_id
        WHERE j.lease_token=? AND j.in_flight_intent_json=? AND j.user_id=? AND (j.user_id=? OR p.owner_user_id=?)`)
        .get(token,JSON.stringify(originalIntent),intent.userId,userId,userId) as Row | undefined;
      if (!original) return erasureHold();
      this.capture(life.operation_ref, "partner_role", [original.mapping_id,original.user_id,original.discord_user_id], original, true);
      const claims = this.database.prepare(`SELECT participant,claim_ref,original_json,original_sha256,state
        FROM platform_erasure_operation_claims WHERE operation_ref=? AND participant='partner_role' LIMIT 10001`)
        .all(life.operation_ref) as { participant: string; claim_ref: string; original_json: string; original_sha256: string; state: string }[];
      if (claims.length > 10_000) return erasureHold();
      const claim = claims.find(row => {
        if (digest(row.original_json) !== row.original_sha256) return erasureHold();
        const source = JSON.parse(row.original_json) as Row;
        return source.lease_token === token && source.in_flight_intent_json === JSON.stringify(originalIntent);
      });
      if (!claim) return false;
      const value = result as Row;
      if (!value || typeof value !== "object" || !["confirmed","not_written","retry","rejected","uncertain"].includes(String(value.kind))) return erasureHold();
      if (value.kind === "retry" && (!Number.isSafeInteger(value.delayMs) || Number(value.delayMs) < 1000
        || Number(value.delayMs) > 86_400_000 || !["rate_limited","temporary"].includes(String(value.reason)))) return erasureHold();
      if (value.kind === "rejected" && !["permission_required","role_missing"].includes(String(value.reason))) return erasureHold();
      if (value.kind === "confirmed" && (value.guildId !== intent.guildId || value.roleId !== intent.roleId
        || value.discordUserId !== intent.discordUserId || value.present !== intent.present)) return erasureHold();
      // Preserve exact late receipt separately. A later uncertain receipt cannot
      // downgrade or overwrite a genuinely settled original operation.
      const receipt = JSON.stringify({ operationId: token, intent: originalIntent, result, receivedAtUtc: this.core.now() });
      if (Buffer.byteLength(receipt) > 2 * 1024 * 1024) return erasureHold();
      const outcomeRef = randomUUID();
      this.database.prepare(`INSERT INTO platform_erasure_operation_claims VALUES(?,?,?,?,?,'captured',?)`)
        .run(life.operation_ref, "partner_role_outcome", outcomeRef, receipt, digest(receipt), token);
      if (value.kind !== "uncertain") {
        const applied=value.kind==="confirmed"?(value.present?1:0):original.applied_present;
        const managed=value.kind==="confirmed"&&value.present?token:original.managed_assignment_ref;
        const changed=this.database.prepare(`UPDATE partner_alert_role_jobs SET status='held',applied_present=?,
          managed_assignment_ref=?,outcome_json=?,last_error_code='erasure_pending',lease_token=NULL,
          lease_until_utc=NULL,in_flight_present=NULL,in_flight_revision=NULL,in_flight_intent_json=NULL
          WHERE mapping_id=? AND user_id=? AND discord_user_id=? AND lease_token=?
            AND in_flight_intent_json=? AND status IN ('applying','uncertain')`).run(applied,managed,receipt,
          original.mapping_id,original.user_id,original.discord_user_id,token,JSON.stringify(originalIntent));
        if(changed.changes!==1)return erasureHold();
        const settled=this.database.prepare(`UPDATE platform_erasure_operation_claims SET state='settled',outcome_ref=?
          WHERE operation_ref=? AND participant=? AND claim_ref=? AND state='in_flight'`)
          .run(outcomeRef, life.operation_ref, claim.participant, claim.claim_ref);
        if(settled.changes!==1)return erasureHold();
      }
      return true;
    }).immediate();
  }
  recordLateDeliveryOutcome(userId: string, job: DeliveryOriginal, token: string, fence: PartnerAlertCommunityFence, result: unknown): boolean {
    if (this.database.inTransaction) return erasureHold();
    return this.database.transaction(() => {
      const life = this.core.lifecycle(userId);
      if (!life.operation_ref || !["preparing","settling"].includes(life.phase)) return false;
      const source = this.database.prepare(`SELECT d.* FROM partner_alert_deliveries d
        JOIN partner_alert_partners p USING(community_id) WHERE d.delivery_id=? AND d.lease_token=?
        AND d.admission_fence_json=? AND d.community_id=? AND d.mapping_id=? AND d.source_revision=? AND p.owner_user_id=?`)
        .get(job.delivery_id,token,JSON.stringify(fence),job.community_id,job.mapping_id,job.source_revision,userId) as Row | undefined;
      if (!source || fence.ownerUserId !== userId || source.action !== job.action) return erasureHold();
      this.capture(life.operation_ref,"partner_delivery",[job.delivery_id],source,true);
      const value = result as Row;
      if (!value || typeof value !== "object" || !["confirmed","retry","rejected","uncertain","not_written"].includes(String(value.kind))) return erasureHold();
      if (value.kind === "retry" && (!Number.isSafeInteger(value.delayMs) || Number(value.delayMs) < 1000
        || Number(value.delayMs) > 86_400_000 || !["rate_limited","temporary"].includes(String(value.reason)))) return erasureHold();
      if (value.kind === "rejected" && !["permission_required","destination_missing","content_rejected"].includes(String(value.reason))) return erasureHold();
      if (value.kind === "not_written" && !["superseded","publishing_paused"].includes(String(value.reason))) return erasureHold();
      if (value.kind === "confirmed" && (value.channelId !== job.destination_channel_id
        || typeof value.messageId !== "string" || !/^[1-9][0-9]{0,19}$/u.test(value.messageId)
        || (job.action !== "create" && value.messageId !== job.destination_message_id))) return erasureHold();
      if (value.kind === "confirmed") partnerAlertSnowflake(value.messageId,"destinationMessageId");
      const metadata = partnerDeliveryMetadata(job);
      delete metadata.outcome_json;
      const receipt = JSON.stringify({ operationId: token, job: metadata, fence, result, receivedAtUtc: this.core.now() });
      if (Buffer.byteLength(receipt) > 2 * 1024 * 1024) return erasureHold();
      const outcomeRef = randomUUID();
      this.database.prepare("INSERT INTO platform_erasure_operation_claims VALUES(?,?,?,?,?,'captured',?)")
        .run(life.operation_ref,"partner_delivery_outcome",outcomeRef,receipt,digest(receipt),token);
      if (value.kind !== "uncertain") {
        const status=value.kind==="confirmed"?"delivered":value.kind==="not_written"?"cancelled":"failed";
        const destination=value.kind==="confirmed"?value.messageId:source.destination_message_id;
        const error=value.kind==="confirmed"?null:value.kind==="not_written"?value.reason:
          value.kind==="retry"?value.reason:value.reason;
        const changed=this.database.prepare(`UPDATE partner_alert_deliveries SET status=?,destination_message_id=?,
          outcome_json=?,last_error_code=?,lease_token=NULL,lease_until_utc=NULL WHERE delivery_id=? AND lease_token=?
          AND admission_fence_json=? AND community_id=? AND mapping_id=? AND source_revision=? AND action=?
          AND status IN ('sending','uncertain')`).run(status,destination,receipt,error,job.delivery_id,token,
          JSON.stringify(fence),job.community_id,job.mapping_id,job.source_revision,job.action);
        if(changed.changes!==1)return erasureHold();
        const settled=this.database.prepare(`UPDATE platform_erasure_operation_claims SET state='settled',outcome_ref=?
          WHERE operation_ref=? AND participant='partner_delivery' AND claim_ref=? AND state='in_flight'`)
          .run(outcomeRef,life.operation_ref,digest(JSON.stringify([job.delivery_id])));
        if(settled.changes!==1)return erasureHold();
      }
      return true;
    }).immediate();
  }
}

/** Called by the actual worker after its awaited native response and before a
 * normal live writer. The durable fence may have committed during that await. */
export function retainLatePartnerRoleOutcome(database: Database.Database, intent: Readonly<{
  userId: string; communityId: string }>, token: string, result: unknown): boolean {
  const core = currentPlatformErasureAdmission(database);
  if (!core || database.inTransaction) return false;
  const affected = database.prepare(`SELECT l.user_id FROM platform_erasure_lifecycles l
    WHERE l.phase IN ('preparing','settling') AND (l.user_id=? OR l.user_id IN
      (SELECT owner_user_id FROM partner_alert_partners WHERE community_id=?))`)
    .all(intent.userId,intent.communityId) as { user_id: string }[];
  if (!affected.length) return false;
  const recovery = new PartnerAlertErasureRecovery(database,core);
  for (const subject of affected) recovery.recordLateRoleOutcome(subject.user_id,token,intent,result);
  return true;
}

export function retainLatePartnerDeliveryOutcome(database: Database.Database, ownerUserId: string,
  job: DeliveryOriginal, token: string, fence: PartnerAlertCommunityFence, result: unknown): boolean {
  const core = currentPlatformErasureAdmission(database);
  if (!core || database.inTransaction) return false;
  const row = database.prepare("SELECT phase FROM platform_erasure_lifecycles WHERE user_id=?").get(ownerUserId) as { phase: string } | undefined;
  if (!row || !["preparing","settling"].includes(row.phase)) return false;
  return new PartnerAlertErasureRecovery(database,core,currentPartnerAlertErasureRuntime(database)).recordLateDeliveryOutcome(ownerUserId,job,token,fence,result);
}
