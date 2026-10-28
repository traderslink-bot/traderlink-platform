import type Database from "better-sqlite3";
import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { partnerAlertId, partnerAlertInteger, partnerAlertSnowflake, partnerAlertUtc } from "../contracts/partner-alert-validation";

/** Adapter must distinguish definitely-not-applied retries from uncertain writes. */
export type PartnerAlertDiscordWriteOutcome =
  | Readonly<{ kind: "confirmed"; channelId: string; messageId: string }>
  | Readonly<{ kind: "retry"; delayMs: number; reason: "rate_limited" | "temporary" }>
  | Readonly<{ kind: "rejected"; reason: "permission_required" | "destination_missing" | "content_rejected" }>
  | Readonly<{ kind: "uncertain" }>;
export interface PartnerAlertDiscordDeliveryTransport {
  verifyDestination(mappingId: string, channelId: string): Promise<boolean>;
  create(input: Readonly<{ channelId: string; content: string; nonce: string; suppressMentions: true }>): Promise<PartnerAlertDiscordWriteOutcome>;
  edit(input: Readonly<{ channelId: string; messageId: string; content: string; suppressMentions: true }>): Promise<PartnerAlertDiscordWriteOutcome>;
  delete(input: Readonly<{ channelId: string; messageId: string }>): Promise<PartnerAlertDiscordWriteOutcome>;
}
type Job = {
  delivery_id: string; community_id: string; mapping_id: string; source_channel_id: string;
  message_id: string; source_revision: number; part_index: number; action: "create" | "edit" | "delete";
  destination_message_id: string | null; text_content: string | null; attempts: number;
  destination_channel_id: string; source_state: string; current_revision: number;
  status: string; lease_token: string | null; lease_until_utc: string | null;
};
type Completion = PartnerAlertDiscordWriteOutcome | Readonly<{ kind: "not_written"; reason: "superseded" | "publishing_paused" }>;

/** Explicit runOnce only. No DB open, HTTP client, scheduling or startup. */
export class PartnerAlertDeliveryWorker {
  constructor(private readonly db: Database.Database, private readonly transport: PartnerAlertDiscordDeliveryTransport,
    private readonly configuration: Readonly<{ enabled: boolean; nowUtc: () => string; createId: () => string;
      maximumFeeEvidenceAgeMs: number; attention: (deliveryId: string, reason: string) => void }>) {
    partnerAlertInteger(configuration.maximumFeeEvidenceAgeMs, "maximumFeeEvidenceAgeMs", 1, 86_400_000);
  }
  private now(): string { return partnerAlertUtc(this.configuration.nowUtc(), "nowUtc"); }
  private current(id: string): Job | undefined {
    return this.db.prepare(`SELECT d.*,m.destination_channel_id,s.state source_state,s.revision current_revision
      FROM partner_alert_deliveries d JOIN partner_alert_mappings m ON m.mapping_id=d.mapping_id AND m.community_id=d.community_id
      JOIN partner_alert_source_messages s ON s.community_id=d.community_id AND s.source_channel_id=d.source_channel_id
        AND s.message_id=d.message_id WHERE d.delivery_id=?`).get(id) as Job | undefined;
  }
  private publishable(job: Job, at: string): boolean {
    if (job.action === "delete") return true;
    if (job.source_state !== "allowed" || job.current_revision !== job.source_revision) return false;
    return Boolean(this.db.prepare(`SELECT 1 FROM partner_alert_mappings m
      JOIN partner_alert_partners p ON p.community_id=m.community_id
      JOIN partner_alert_publishing_memberships fee ON fee.community_id=p.community_id AND fee.agreement_id=p.current_agreement_id
      WHERE m.mapping_id=? AND m.community_id=? AND m.review_state='approved' AND m.approved_revision=m.revision
        AND m.delivery_state='ready' AND p.status='active' AND p.approved_at_utc IS NOT NULL
        AND fee.state='active' AND fee.observed_at_utc<=? AND fee.valid_until_utc>?
        AND fee.observed_at_utc>?`).get(job.mapping_id, job.community_id, at, at,
        new Date(Date.parse(at) - this.configuration.maximumFeeEvidenceAgeMs).toISOString()));
  }
  private claim(): { job: Job; token: string } | null {
    return this.db.transaction(() => {
      const at = this.now();
      // No blind re-send after a crashed process or uncertain edit/delete either.
      this.db.prepare(`UPDATE partner_alert_mirrored_parts SET state='uncertain' WHERE EXISTS
        (SELECT 1 FROM partner_alert_deliveries d WHERE d.mapping_id=partner_alert_mirrored_parts.mapping_id
          AND d.message_id=partner_alert_mirrored_parts.message_id AND d.part_index=partner_alert_mirrored_parts.part_index
          AND d.status='sending' AND d.lease_until_utc<=?)`).run(at);
      this.db.prepare(`UPDATE partner_alert_deliveries SET status='uncertain',last_error_code='outcome_unknown'
        WHERE status='sending' AND lease_until_utc<=?`).run(at);
      const rateLimit = this.db.prepare(`SELECT 1 FROM partner_alert_deliveries WHERE last_error_code='rate_limited'
        AND status='failed' AND next_attempt_at_utc>? LIMIT 1`).get(at);
      if (rateLimit) return null;
      const row = this.db.prepare(`SELECT d.delivery_id FROM partner_alert_deliveries d
        JOIN partner_alert_source_messages s ON s.community_id=d.community_id AND s.source_channel_id=d.source_channel_id
          AND s.message_id=d.message_id AND s.revision=d.source_revision
        WHERE d.status IN ('pending','failed') AND d.attempts<5 AND d.next_attempt_at_utc<=?
          AND (d.last_error_code IS NULL OR d.last_error_code IN ('rate_limited','temporary'))
          AND NOT EXISTS(SELECT 1 FROM partner_alert_deliveries other WHERE other.mapping_id=d.mapping_id
            AND other.message_id=d.message_id AND other.part_index=d.part_index AND other.status IN ('sending','uncertain')
            AND other.delivery_id!=d.delivery_id)
          AND (d.action='delete' OR NOT EXISTS(SELECT 1 FROM partner_alert_deliveries earlier
            WHERE earlier.mapping_id=d.mapping_id AND earlier.message_id=d.message_id
              AND earlier.source_revision=d.source_revision AND earlier.part_index<d.part_index
              AND earlier.action!='delete' AND earlier.status NOT IN ('delivered','cancelled')))
        ORDER BY CASE d.action WHEN 'delete' THEN 0 ELSE 1 END,d.next_attempt_at_utc,d.message_id,d.part_index LIMIT 1`)
        .get(at) as { delivery_id: string } | undefined;
      if (!row) return null;
      const job = this.current(row.delivery_id);
      if (!job) return null;
      if (!this.publishable(job, at)) {
        this.db.prepare("UPDATE partner_alert_deliveries SET status='cancelled',last_error_code='publishing_paused' WHERE delivery_id=?")
          .run(job.delivery_id); return null;
      }
      const token = partnerAlertId(this.configuration.createId(), "leaseToken");
      this.db.prepare(`UPDATE partner_alert_deliveries SET status='sending',attempts=attempts+1,lease_token=?,
        lease_until_utc=? WHERE delivery_id=?`).run(token, new Date(Date.parse(at) + 60_000).toISOString(), job.delivery_id);
      this.db.prepare(`INSERT INTO partner_alert_mirrored_parts
        (community_id,mapping_id,source_channel_id,message_id,part_index,destination_message_id,state,source_revision)
        VALUES(?,?,?,?,?,?,'uncertain',?) ON CONFLICT(mapping_id,message_id,part_index) DO UPDATE SET state='uncertain'`)
        .run(job.community_id, job.mapping_id, job.source_channel_id, job.message_id, job.part_index,
          job.destination_message_id, job.source_revision);
      return { job, token };
    }).immediate();
  }

  async runOnce(): Promise<boolean> {
    if (this.configuration.enabled !== true) return false;
    const claim = this.claim(); if (!claim) return false;
    const { job } = claim;
    let outcome: Completion;
    let writeStarted = false;
    try {
      partnerAlertSnowflake(job.destination_channel_id, "destinationChannelId");
      const verified = await this.transport.verifyDestination(job.mapping_id, job.destination_channel_id);
      const current = this.current(job.delivery_id);
      if (!verified) {
        outcome = { kind: "rejected", reason: "permission_required" };
      } else if (!current || current.current_revision !== job.source_revision) {
        outcome = { kind: "not_written", reason: "superseded" };
      } else if (current.lease_token !== claim.token || current.status !== "sending"
        || !current.lease_until_utc || current.lease_until_utc <= this.now()) {
        outcome = { kind: "retry", delayMs: 5000, reason: "temporary" };
      } else if (!this.publishable(current, this.now())) {
        outcome = { kind: "not_written", reason: "publishing_paused" };
      } else if (job.action === "delete") {
        if (!job.destination_message_id) outcome = { kind: "uncertain" };
        else { writeStarted = true; outcome = await this.transport.delete({ channelId: job.destination_channel_id,
          messageId: partnerAlertSnowflake(job.destination_message_id, "destinationMessageId") }); }
      } else if (job.action === "edit" && !job.destination_message_id) {
        outcome = { kind: "uncertain" };
      } else {
        if (!job.text_content || job.text_content.length > 2000) throw new PartnerAlertValidationError("deliveryContent");
        if (job.destination_message_id) partnerAlertSnowflake(job.destination_message_id, "destinationMessageId");
        writeStarted = true;
        outcome = job.action === "edit"
          ? await this.transport.edit({ channelId: job.destination_channel_id,
            messageId: job.destination_message_id!,
            content: job.text_content, suppressMentions: true })
          : await this.transport.create({ channelId: job.destination_channel_id, content: job.text_content,
            nonce: job.delivery_id.replace(/-/gu, "").slice(0, 25), suppressMentions: true });
      }
    } catch { outcome = writeStarted ? { kind: "uncertain" } : { kind: "retry", delayMs: 5000, reason: "temporary" }; }
    this.finish(claim, outcome);
    return true;
  }

  private promoteResolvedPart(job: Job, id: string | null): void {
    // No uncertain operation with a lease may be overwritten by reconciliation.
    this.db.prepare(`UPDATE partner_alert_deliveries SET action=CASE WHEN text_content IS NULL THEN 'delete'
      WHEN ? IS NULL THEN 'create' ELSE 'edit' END,destination_message_id=?,
      status=CASE WHEN text_content IS NULL AND ? IS NULL THEN 'cancelled' ELSE 'pending' END,last_error_code=NULL
      WHERE mapping_id=? AND message_id=? AND part_index=? AND source_revision>?
        AND source_revision=(SELECT revision FROM partner_alert_source_messages s WHERE s.community_id=partner_alert_deliveries.community_id
          AND s.source_channel_id=partner_alert_deliveries.source_channel_id AND s.message_id=partner_alert_deliveries.message_id)
        AND status IN ('pending','uncertain') AND lease_token IS NULL`)
      .run(id, id, id, job.mapping_id, job.message_id, job.part_index, job.source_revision);
  }
  private finish(claim: { job: Job; token: string }, result: Completion): void {
    const { job, token } = claim;
    let attention: string | null = null;
    this.db.transaction(() => {
      if (!this.db.prepare(`SELECT 1 FROM partner_alert_deliveries WHERE delivery_id=? AND lease_token=?
        AND status IN ('sending','uncertain')`).get(job.delivery_id, token)) return;
      let outcome = result;
      if (outcome.kind === "confirmed") {
        try {
          partnerAlertSnowflake(outcome.messageId, "destinationMessageId");
          if (outcome.channelId !== job.destination_channel_id
            || (job.action !== "create" && outcome.messageId !== job.destination_message_id)) outcome = { kind: "uncertain" };
        } catch { outcome = { kind: "uncertain" }; }
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
        if (outcome.kind === "not_written" || this.current(job.delivery_id)?.current_revision !== job.source_revision) {
          this.db.prepare(`UPDATE partner_alert_deliveries SET status='cancelled',last_error_code=?,
            lease_token=NULL,lease_until_utc=NULL WHERE delivery_id=?`)
            .run(outcome.kind === "not_written" ? outcome.reason : "superseded", job.delivery_id);
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
    }).immediate();
    if (attention) {
      try { this.configuration.attention(job.delivery_id, attention); } catch { /* The durable job remains the receipt. */ }
    }
  }
}
