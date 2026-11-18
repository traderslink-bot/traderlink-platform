import { hostedQaDeliverySql, ownHostedQaClaim, ownsHostedQaClaim, type HostedPaidQaAuthority } from "./partner-alert-hosted-qa-authority";
import { PARTNER_ALERT_PUBLISHING_CONSENT_SQL } from "./partner-alert-publishing-consent";
import type Database from "better-sqlite3";
import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { partnerAlertId, partnerAlertInteger, partnerAlertSnowflake, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { requirePartnerAlertAdmission, type PartnerAlertCommunityFence } from "./partner-alert-admission";
import { retainLatePartnerDeliveryOutcome } from "./partner-alert-erasure-recovery";
import { partnerDeliveryMetadata } from "./partner-alert-erasure-delivery-text-binding";
import { partnerAlertFirstReceipt, partnerAlertInitialMessageTextRetainUntil, startPartnerAlertSettledTextRetention } from "./partner-alert-retention-policy";

/** Adapter must distinguish definitely-not-applied retries from uncertain writes. */
export type PartnerAlertDiscordWriteOutcome =
  | Readonly<{ kind: "confirmed"; channelId: string; messageId: string }>
  | Readonly<{ kind: "retry"; delayMs: number; reason: "rate_limited" | "temporary" }>
  | Readonly<{ kind: "rejected"; reason: "permission_required" | "destination_missing" | "content_rejected" }>
  | Readonly<{ kind: "not_written"; reason: "superseded" | "publishing_paused" }>
  | Readonly<{ kind: "uncertain" }>;
type DeliveryWriteScope = Readonly<{ mappingId: string; channelId: string; stillCurrent: () => boolean }>;
export interface PartnerAlertDiscordDeliveryTransport {
  verifyDestination(mappingId: string, channelId: string, action: "create" | "edit" | "delete"): Promise<boolean>;
  /** Each native implementation MUST invoke stillCurrent synchronously after
   * all waits, immediately before its actual POST/PATCH/DELETE. */
  create(input: DeliveryWriteScope & Readonly<{ content: string; nonce: string; suppressMentions: true }>): Promise<PartnerAlertDiscordWriteOutcome>;
  edit(input: DeliveryWriteScope & Readonly<{ messageId: string; content: string; suppressMentions: true }>): Promise<PartnerAlertDiscordWriteOutcome>;
  delete(input: DeliveryWriteScope & Readonly<{ messageId: string }>): Promise<PartnerAlertDiscordWriteOutcome>;
}
type Job = {
  delivery_id: string; community_id: string; mapping_id: string; source_channel_id: string;
  message_id: string; source_revision: number; part_index: number; action: "create" | "edit" | "delete";
  destination_message_id: string | null; text_content: string | null; attempts: number;
  rehydrate_source: 0 | 1; source_guild_id: string; source_observed_at_utc: string; source_revision_state: string;
  destination_channel_id: string; source_state: string; current_revision: number;
  status: string; lease_token: string | null; lease_until_utc: string | null;
  admission_fence_json: string | null;
};
type Claim = Readonly<{ job: Job; token: string; fence: PartnerAlertCommunityFence }>;

/** Explicit runOnce only. No DB open, HTTP client, scheduling or startup. */
export class PartnerAlertDeliveryWorker {
  constructor(private readonly db: Database.Database, private readonly transport: PartnerAlertDiscordDeliveryTransport,
    private readonly configuration: Readonly<{ execution?: HostedPaidQaAuthority; enabled: boolean; nowUtc: () => string; createId: () => string;
      attention: (deliveryId: string, reason: string) => void;
      rehydratePart?: (target: Readonly<{ mappingId: string; communityId: string; sourceGuildId: string; sourceChannelId: string;
        messageId: string; sourceRevision: number; partIndex: number }>, stillCurrent: () => boolean) => Promise<string | null> }>) {
  }
  private now(): string { return partnerAlertUtc(this.configuration.nowUtc(), "nowUtc"); }
  private selection(alias: "d" | "partner_alert_deliveries", phase: "work" | "settle" | "associated" = "work") {
    return this.configuration.execution ? hostedQaDeliverySql(this.configuration.execution, alias, phase) : { sql: "1", parameters: [] as string[] };
  }
  private current(id: string, phase: "work" | "settle" = "work"): Job | undefined {
    const selected = this.selection("d", phase);
    return this.db.prepare(`SELECT d.*,m.destination_channel_id,s.state source_state,s.revision current_revision,s.source_guild_id,
      r.observed_at_utc source_observed_at_utc,r.state source_revision_state
      FROM partner_alert_deliveries d JOIN partner_alert_mappings m ON m.mapping_id=d.mapping_id AND m.community_id=d.community_id
      JOIN partner_alert_source_messages s ON s.community_id=d.community_id AND s.source_channel_id=d.source_channel_id
        AND s.message_id=d.message_id JOIN partner_alert_source_revisions r ON r.community_id=d.community_id
        AND r.source_channel_id=d.source_channel_id AND r.message_id=d.message_id AND r.revision=d.source_revision
      WHERE d.delivery_id=? AND (${selected.sql})`).get(id, ...selected.parameters) as Job | undefined;
  }
  private publishable(job: Job, at: string): boolean {
    if (job.action === "delete") return true;
    const age = Date.parse(at) - Date.parse(job.source_observed_at_utc);
    if (job.current_revision !== job.source_revision || !(0 <= age && age <= 120_000)) return false;
    if (job.rehydrate_source === 1) {
      if (!this.configuration.rehydratePart || job.source_state !== "expired" || job.source_revision_state !== "allowed"
        || job.text_content !== null) return false;
    } else {
      const first = partnerAlertFirstReceipt(this.db, { communityId: job.community_id,
        sourceChannelId: job.source_channel_id, messageId: job.message_id });
      if (job.source_state !== "allowed" || job.text_content === null || partnerAlertInitialMessageTextRetainUntil("allowed", first) <= at) return false;
    }
    return Boolean(this.db.prepare(`SELECT 1 FROM partner_alert_mappings m
      JOIN partner_alert_partners p ON p.community_id=m.community_id
      WHERE m.mapping_id=? AND m.community_id=? AND m.review_state='approved' AND m.approved_revision=m.revision
        AND m.delivery_state='ready' AND p.status='active' AND p.approved_at_utc IS NOT NULL
        AND m.activated_at_utc<=? AND ${PARTNER_ALERT_PUBLISHING_CONSENT_SQL}`).get(job.mapping_id, job.community_id, at));
  }
  /** One shared selector for global community selection and locked revalidation.
   * A blocked/exhausted row cannot pin the worker to its community. */
  private nextEligible(at: string, communityId: string | null = null): { delivery_id: string; community_id: string } | undefined {
    const selected = this.selection("d");
    return this.db.prepare(`SELECT d.delivery_id,d.community_id FROM partner_alert_deliveries d
      JOIN partner_alert_partners p USING(community_id)
      JOIN platform_erasure_lifecycles l ON l.user_id=p.owner_user_id
      JOIN platform_erasure_profiles profile ON profile.profile_ref=l.profile_ref
      JOIN platform_users owner ON owner.user_id=p.owner_user_id
      JOIN partner_alert_context_epochs epochs ON epochs.community_id=d.community_id
      JOIN partner_alert_source_messages s ON s.community_id=d.community_id AND s.source_channel_id=d.source_channel_id
        AND s.message_id=d.message_id AND s.revision=d.source_revision
      WHERE l.phase='live' AND owner.status='active' AND l.profile_generation=profile.generation
        AND l.valid_until_utc>? AND profile.valid_until_utc>?
        AND (${selected.sql})
        AND d.status IN ('pending','failed') AND d.attempts<5 AND d.next_attempt_at_utc<=?
        AND (? IS NULL OR d.community_id=?)
        AND (d.last_error_code IS NULL OR d.last_error_code IN ('rate_limited','temporary'))
        AND NOT EXISTS(SELECT 1 FROM partner_alert_deliveries other WHERE other.mapping_id=d.mapping_id
          AND other.message_id=d.message_id AND other.part_index=d.part_index
          AND (other.status='sending' OR (other.status='uncertain' AND other.lease_token IS NOT NULL))
          AND other.delivery_id!=d.delivery_id)
        AND (d.action='delete' OR NOT EXISTS(SELECT 1 FROM partner_alert_deliveries earlier
          WHERE earlier.mapping_id=d.mapping_id AND earlier.message_id=d.message_id
            AND earlier.source_revision=d.source_revision AND earlier.part_index<d.part_index
            AND earlier.action!='delete' AND earlier.status NOT IN ('delivered','cancelled')))
      ORDER BY CASE d.action WHEN 'delete' THEN 0 ELSE 1 END,d.next_attempt_at_utc,d.message_id,d.part_index LIMIT 1`)
      .get(at,at,...selected.parameters,at,communityId,communityId) as { delivery_id: string; community_id: string } | undefined;
  }
  /** Maintain at most ONE expired send per call, independently of ready work.
   * Expiry means uncertain; it never permits a resend or proves quiescence. */
  private maintainExpiredSend(): void {
    const at = this.now();
    const selected = this.selection("d", "settle");
    const expired = this.db.prepare(`SELECT d.delivery_id,d.community_id FROM partner_alert_deliveries d
      JOIN partner_alert_partners p USING(community_id)
      JOIN platform_erasure_lifecycles l ON l.user_id=p.owner_user_id
      JOIN platform_erasure_profiles profile ON profile.profile_ref=l.profile_ref
      JOIN platform_users owner ON owner.user_id=p.owner_user_id
      JOIN partner_alert_context_epochs epochs ON epochs.community_id=d.community_id
      WHERE l.phase='live' AND owner.status='active' AND l.profile_generation=profile.generation
        AND l.valid_until_utc>? AND profile.valid_until_utc>?
        AND (${selected.sql}) AND d.status='sending' AND d.lease_until_utc<=?
      ORDER BY d.lease_until_utc,d.delivery_id LIMIT 1`).get(at,at,...selected.parameters,at) as { delivery_id: string; community_id: string } | undefined;
    if (!expired) return;
    requirePartnerAlertAdmission(this.db).runCommunity(expired.community_id, [], () => this.db.transaction(() => {
      const currentAt = this.now();
      const scoped = this.current(expired.delivery_id, "settle");
      if (!scoped || scoped.community_id !== expired.community_id) return;
      this.db.prepare(`UPDATE partner_alert_mirrored_parts SET state='uncertain' WHERE EXISTS
        (SELECT 1 FROM partner_alert_deliveries d WHERE d.delivery_id=? AND d.community_id=?
          AND d.mapping_id=partner_alert_mirrored_parts.mapping_id AND d.message_id=partner_alert_mirrored_parts.message_id
          AND d.part_index=partner_alert_mirrored_parts.part_index AND d.status='sending' AND d.lease_until_utc<=?)`)
        .run(expired.delivery_id,expired.community_id,currentAt);
      this.db.prepare(`UPDATE partner_alert_deliveries SET status='uncertain',last_error_code='outcome_unknown'
        WHERE delivery_id=? AND community_id=? AND status='sending' AND lease_until_utc<=?`)
        .run(expired.delivery_id,expired.community_id,currentAt);
    })());
  }
  private claim(): Claim | null {
    this.maintainExpiredSend();
    const candidate = this.nextEligible(this.now());
    if (!candidate) return null;
    const admission = requirePartnerAlertAdmission(this.db);
    return admission.runCommunity(candidate.community_id, [], () => this.db.transaction(() => {
      const at = this.now();
      const rateLimit = this.db.prepare(`SELECT 1 FROM partner_alert_deliveries WHERE last_error_code='rate_limited'
        AND status='failed' AND next_attempt_at_utc>? LIMIT 1`).get(at);
      if (rateLimit) return null;
      const row = this.nextEligible(at,candidate.community_id);
      if (!row) return null;
      const job = this.current(row.delivery_id);
      if (!job) return null;
      if (!this.publishable(job, at)) {
        this.db.prepare("UPDATE partner_alert_deliveries SET status='cancelled',last_error_code='publishing_paused' WHERE delivery_id=?")
          .run(job.delivery_id);
        startPartnerAlertSettledTextRetention(this.db, { communityId: job.community_id,
          sourceChannelId: job.source_channel_id, messageId: job.message_id, sourceRevision: job.source_revision }, at);
        return null;
      }
      const token = partnerAlertId(this.configuration.createId(), "leaseToken");
      const fence = admission.captureCommunityFence(job.community_id);
      if (this.configuration.execution) ownHostedQaClaim(this.configuration.execution, job.delivery_id, token);
      this.db.prepare(`UPDATE partner_alert_deliveries SET status='sending',attempts=attempts+1,lease_token=?,
        lease_until_utc=?,admission_fence_json=? WHERE delivery_id=?`).run(token, new Date(Date.parse(at) + 60_000).toISOString(), JSON.stringify(fence), job.delivery_id);
      this.db.prepare(`INSERT INTO partner_alert_mirrored_parts
        (community_id,mapping_id,source_channel_id,message_id,part_index,destination_message_id,state,source_revision)
        VALUES(?,?,?,?,?,?,'uncertain',?) ON CONFLICT(mapping_id,message_id,part_index) DO UPDATE SET state='uncertain'`)
        .run(job.community_id, job.mapping_id, job.source_channel_id, job.message_id, job.part_index,
          job.destination_message_id, job.source_revision);
      return { job, token, fence };
    })());
  }
  private canApply(claim: Claim): boolean {
    try {
      const admission = requirePartnerAlertAdmission(this.db);
      return admission.runCommunity(claim.job.community_id, [], () => {
        admission.assertCommunityFence(claim.fence);
        const current = this.current(claim.job.delivery_id), at = this.now();
        return Boolean(current && current.lease_token === claim.token && current.status === "sending"
          && current.admission_fence_json === JSON.stringify(claim.fence) && current.lease_until_utc && current.lease_until_utc > at
          && current.current_revision === claim.job.source_revision && current.source_revision === claim.job.source_revision
          && current.action === claim.job.action && current.destination_channel_id === claim.job.destination_channel_id
          && this.publishable(current,at));
      });
    } catch { return false; }
  }

  async runOnce(): Promise<boolean> {
    if (this.configuration.enabled !== true) return false;
    const claim = this.claim(); if (!claim) return false;
    const { job } = claim;
    let outcome: PartnerAlertDiscordWriteOutcome;
    let writeStarted = false;
    try {
      partnerAlertSnowflake(job.destination_channel_id, "destinationChannelId");
      const admittedBeforeVerify = this.canApply(claim);
      const verified = admittedBeforeVerify && await this.transport.verifyDestination(job.mapping_id, job.destination_channel_id, job.action);
      const current = this.current(job.delivery_id);
      const writeScope = { mappingId: job.mapping_id, channelId: job.destination_channel_id,
        stillCurrent: () => this.canApply(claim) };
      if (!admittedBeforeVerify) {
        outcome = { kind: "not_written", reason: "publishing_paused" };
      } else if (!verified) {
        outcome = { kind: "rejected", reason: "permission_required" };
      } else if (!current || current.current_revision !== job.source_revision) {
        outcome = { kind: "not_written", reason: "superseded" };
      } else if (current.lease_token !== claim.token || current.status !== "sending"
        || !current.lease_until_utc || current.lease_until_utc <= this.now()) {
        outcome = { kind: "retry", delayMs: 5000, reason: "temporary" };
      } else if (!this.canApply(claim)) {
        outcome = { kind: "not_written", reason: "publishing_paused" };
      } else if (job.action === "delete") {
        if (!job.destination_message_id) outcome = { kind: "uncertain" };
        else { writeStarted = true; outcome = await this.transport.delete({ ...writeScope,
          messageId: partnerAlertSnowflake(job.destination_message_id, "destinationMessageId") }); }
      } else if (job.action === "edit" && !job.destination_message_id) {
        outcome = { kind: "uncertain" };
      } else {
        const content = job.rehydrate_source === 1 ? await this.configuration.rehydratePart?.({ mappingId: job.mapping_id,
          communityId: job.community_id, sourceGuildId: job.source_guild_id, sourceChannelId: job.source_channel_id,
          messageId: job.message_id, sourceRevision: job.source_revision, partIndex: job.part_index }, writeScope.stillCurrent) : job.text_content;
        if (!writeScope.stillCurrent()) {
          outcome = { kind: "not_written", reason: "superseded" };
        } else if (!content) {
          outcome = { kind: "retry", delayMs: 5_000, reason: "temporary" };
        } else {
          if (content.length > 2000) throw new PartnerAlertValidationError("deliveryContent");
          if (job.destination_message_id) partnerAlertSnowflake(job.destination_message_id, "destinationMessageId");
          writeStarted = true;
          outcome = job.action === "edit"
            ? await this.transport.edit({ ...writeScope, messageId: job.destination_message_id!, content, suppressMentions: true })
            : await this.transport.create({ ...writeScope, content,
              nonce: job.delivery_id.replace(/-/gu, "").slice(0, 25), suppressMentions: true });
        }
      }
    } catch { outcome = writeStarted ? { kind: "uncertain" } : { kind: "retry", delayMs: 5000, reason: "temporary" }; }
    this.finish(claim, outcome);
    return true;
  }

  /** An authenticated Discord MESSAGE_CREATE for this bot carries the nonce
   * we sent. This settles a lost create response without reposting text. */
  reconcileCreatedMessage(input: Readonly<{ guildId: string; channelId: string; messageId: string; nonce: string }>): void {
    if (this.configuration.enabled !== true || !/^[a-f0-9]{25}$/u.test(input.nonce)) return;
    const guildId = partnerAlertSnowflake(input.guildId, "destinationGuildId");
    const channelId = partnerAlertSnowflake(input.channelId, "destinationChannelId");
    const messageId = partnerAlertSnowflake(input.messageId, "destinationMessageId");
    const selected = this.selection("d", "settle");
    const candidates = this.db.prepare(`SELECT d.delivery_id FROM partner_alert_deliveries d
      JOIN partner_alert_mappings m ON m.mapping_id=d.mapping_id AND m.community_id=d.community_id
      WHERE m.destination_guild_id=? AND m.destination_channel_id=? AND m.ever_approved=1
        AND (${selected.sql}) AND d.action='create' AND d.status IN ('sending','uncertain') AND d.lease_token IS NOT NULL
        AND substr(replace(d.delivery_id,'-',''),1,25)=? LIMIT 2`).pluck().all(guildId, channelId, ...selected.parameters, input.nonce);
    if (candidates.length !== 1 || typeof candidates[0] !== "string") return;
    const job = this.current(candidates[0], "settle");
    if (!job?.lease_token || !job.admission_fence_json || job.destination_channel_id !== channelId) return;
    const fence = JSON.parse(job.admission_fence_json) as PartnerAlertCommunityFence;
    if (fence.communityId !== job.community_id) return;
    this.finish({ job, token: job.lease_token, fence }, { kind: "confirmed", channelId, messageId });
  }

  private promoteResolvedPart(job: Job, id: string | null): void {
    // Retention can clear a queued write's body. Only its stored action authorizes deletion.
    const expiredWrite = "action!='delete' AND text_content IS NULL AND rehydrate_source=0";
    const selected = this.selection("partner_alert_deliveries", "associated");
    this.db.prepare(`UPDATE partner_alert_deliveries SET
      action=CASE WHEN action='delete' OR (${expiredWrite}) THEN action WHEN ? IS NULL THEN 'create' ELSE 'edit' END,
      destination_message_id=?,
      status=CASE WHEN (${expiredWrite}) OR (action='delete' AND ? IS NULL) THEN 'cancelled' ELSE 'pending' END,
      last_error_code=CASE WHEN (${expiredWrite}) THEN 'retention_expired' END
      WHERE mapping_id=? AND message_id=? AND part_index=? AND source_revision>? AND (${selected.sql})
        AND source_revision=(SELECT revision FROM partner_alert_source_messages s WHERE s.community_id=partner_alert_deliveries.community_id
          AND s.source_channel_id=partner_alert_deliveries.source_channel_id AND s.message_id=partner_alert_deliveries.message_id)
        AND status IN ('pending','uncertain') AND lease_token IS NULL`)
      .run(id, id, id, job.mapping_id, job.message_id, job.part_index, job.source_revision, ...selected.parameters);
  }
  private finish(claim: Claim, result: PartnerAlertDiscordWriteOutcome): void {
    if (this.configuration.execution && !ownsHostedQaClaim(this.configuration.execution, claim.job.delivery_id, claim.token)) return;
    if (retainLatePartnerDeliveryOutcome(this.db, claim.fence.ownerUserId, claim.job, claim.token, claim.fence, result)) return;
    const { job, token } = claim;
    let attention: string | null = null;
    const admission = requirePartnerAlertAdmission(this.db);
    admission.runCommunity(job.community_id, [], () => this.db.transaction(() => {
      const selected = this.selection("partner_alert_deliveries", "settle");
      if (!this.db.prepare(`SELECT 1 FROM partner_alert_deliveries WHERE delivery_id=? AND lease_token=?
        AND status IN ('sending','uncertain') AND (${selected.sql})`).get(job.delivery_id, token, ...selected.parameters)) return;
      let outcome = result;
      if (outcome.kind === "confirmed") {
        try {
          partnerAlertSnowflake(outcome.messageId, "destinationMessageId");
          if (outcome.channelId !== job.destination_channel_id
            || (job.action !== "create" && outcome.messageId !== job.destination_message_id)) outcome = { kind: "uncertain" };
        } catch { outcome = { kind: "uncertain" }; }
      }
      const metadata = partnerDeliveryMetadata(job);
      delete metadata.outcome_json;
      this.db.prepare("UPDATE partner_alert_deliveries SET outcome_json=? WHERE delivery_id=? AND lease_token=?")
        .run(JSON.stringify({ operationId: token, job: metadata, fence: claim.fence,
          result: outcome, receivedAtUtc: this.now() }), job.delivery_id, token);
      let mayPromote = true;
      try { admission.assertCommunityFence(claim.fence); } catch { mayPromote = false; }
      if (!mayPromote) {
        this.db.prepare(`UPDATE partner_alert_deliveries SET status=?,last_error_code='authority_changed',
          destination_message_id=CASE WHEN ?='confirmed' THEN ? ELSE destination_message_id END,
          lease_token=CASE WHEN ?='uncertain' THEN lease_token ELSE NULL END,
          lease_until_utc=CASE WHEN ?='uncertain' THEN lease_until_utc ELSE NULL END WHERE delivery_id=?`)
          .run(outcome.kind === "uncertain" ? "uncertain" : outcome.kind === "confirmed" ? "delivered" : "cancelled",
            outcome.kind,outcome.kind === "confirmed" ? outcome.messageId : null,outcome.kind,outcome.kind,job.delivery_id);
        startPartnerAlertSettledTextRetention(this.db, { communityId: job.community_id,
          sourceChannelId: job.source_channel_id, messageId: job.message_id, sourceRevision: job.source_revision }, this.now());
        return;
      }
      if (outcome.kind === "confirmed") {
        const deleted = job.action === "delete";
        const id = deleted ? null : outcome.messageId;
        this.db.prepare(`UPDATE partner_alert_deliveries SET status='delivered',destination_message_id=?,
          lease_token=NULL,lease_until_utc=NULL,last_error_code=NULL WHERE delivery_id=?`).run(outcome.messageId, job.delivery_id);
        this.db.prepare(`UPDATE partner_alert_mirrored_parts SET destination_message_id=?,state=?,source_revision=?
          WHERE mapping_id=? AND message_id=? AND part_index=? AND source_revision<=?`)
          .run(id, deleted ? "deleted" : "active", job.source_revision, job.mapping_id, job.message_id, job.part_index, job.source_revision);
        // An older confirmed write resolves an unknown ID for a newer edit/delete.
        // Only current queued parts are promoted; never replay an obsolete body.
        this.promoteResolvedPart(job, id);
      } else if (outcome.kind === "retry" || outcome.kind === "not_written") {
        // Both paths prove this write did not happen, so a newer intent can use
        // the previously known destination ID instead of staying ambiguous.
        this.db.prepare(`UPDATE partner_alert_mirrored_parts SET state=? WHERE mapping_id=? AND message_id=? AND part_index=?`)
          .run(job.destination_message_id ? "active" : "deleted", job.mapping_id, job.message_id, job.part_index);
        this.promoteResolvedPart(job, job.destination_message_id);
        if (outcome.kind === "not_written" || this.current(job.delivery_id, "settle")?.current_revision !== job.source_revision) {
          this.db.prepare(`UPDATE partner_alert_deliveries SET status='cancelled',last_error_code=?,
            lease_token=NULL,lease_until_utc=NULL WHERE delivery_id=?`)
            .run(outcome.kind === "not_written" ? outcome.reason : "superseded", job.delivery_id);
          startPartnerAlertSettledTextRetention(this.db, { communityId: job.community_id,
            sourceChannelId: job.source_channel_id, messageId: job.message_id, sourceRevision: job.source_revision }, this.now());
          return;
        }
        const delay = partnerAlertInteger(outcome.delayMs, "retryDelayMs", 1000, 86_400_000);
        this.db.prepare(`UPDATE partner_alert_deliveries SET status='failed',next_attempt_at_utc=?,last_error_code=?,
          lease_token=NULL,lease_until_utc=NULL WHERE delivery_id=?`)
          .run(new Date(Date.parse(this.now()) + delay).toISOString(), outcome.reason, job.delivery_id);
        if (job.attempts + 1 >= 5) attention = "delivery_attempts_exhausted";
      } else {
        this.db.prepare(`UPDATE partner_alert_deliveries SET status=?,last_error_code=?,lease_until_utc=NULL WHERE delivery_id=?`)
          .run(outcome.kind === "uncertain" ? "uncertain" : "failed",
            outcome.kind === "uncertain" ? "outcome_unknown" : outcome.reason, job.delivery_id);
        if (outcome.kind === "rejected") this.db.prepare("UPDATE partner_alert_mappings SET delivery_state='paused' WHERE mapping_id=?")
          .run(job.mapping_id);
        attention = outcome.kind === "uncertain" ? "outcome_unknown" : outcome.reason;
      }
      startPartnerAlertSettledTextRetention(this.db, { communityId: job.community_id,
        sourceChannelId: job.source_channel_id, messageId: job.message_id, sourceRevision: job.source_revision }, this.now());
    })());
    if (attention) {
      try { this.configuration.attention(job.delivery_id, attention); } catch { /* The durable job remains the receipt. */ }
    }
  }
}
