import { PARTNER_ALERT_RETENTION_POLICY, partnerAlertInitialMessageTextRetainUntil } from "./partner-alert-retention-policy";
import type Database from "better-sqlite3";
import { partnerAlertInteger, partnerAlertRef, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { erasureHold, type PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { PARTNER_ALERT_ORDINARY_DELIVERY_RECEIPT_HAS_TEXT_SQL, redactPartnerAlertOrdinaryDeliveryReceipts } from "./partner-alert-delivery-receipt-retention";

// A queued successor can wait in uncertain state before it has a lease of its own.
const EXPIRED_UNSENT_WRITE_SQL = `d.action!='delete' AND d.rehydrate_source=0
  AND (d.status IN ('pending','failed') OR (d.status='uncertain' AND d.lease_token IS NULL))`;

type ExpiredSource = Readonly<{
  community_id: string;
  source_channel_id: string;
  message_id: string;
  first_received_at_utc: string;
}>;


export type PartnerAlertTextRetentionResult = Readonly<{
  redactedMessages: number;
  trackedExternalOperations: number;
  trackedPolicyHolds: number;
  moreAvailable: boolean;
}>;

/**
 * Redacts expired message bodies only after the installed erasure profile and
 * restore gate qualify expiry/recovery safety. Policy holds and unresolved
 * sends retain only identifiers/status; they do not exempt expired alert text. This worker
 * performs no network or provider operation.
 */
export class PartnerAlertTextRetention {
  private readonly profileRef: string;
  private readonly retentionPolicyRef: string;
  private readonly backupPolicyRef: string;

  constructor(
    private readonly database: Database.Database,
    private readonly core: PlatformErasureAdmission,
    input: Readonly<{
      profileRef: string;
      retentionPolicyRef: string;
      backupPolicyRef: string;
      assertRestoreTombstonesApplied: () => void;
      hasActiveRetentionHold: (input: Readonly<{ communityId: string; sourceChannelId: string; messageId: string }>) => boolean;
    }>,
  ) {
    this.profileRef = partnerAlertRef(input.profileRef, "profileRef");
    this.retentionPolicyRef = partnerAlertRef(input.retentionPolicyRef, "retentionPolicyRef");
    this.backupPolicyRef = partnerAlertRef(input.backupPolicyRef, "backupPolicyRef");
    if (typeof input.assertRestoreTombstonesApplied !== "function" || typeof input.hasActiveRetentionHold !== "function") {
      erasureHold();
    }
    this.assertRestoreTombstonesApplied = input.assertRestoreTombstonesApplied;
    this.hasActiveRetentionHold = input.hasActiveRetentionHold;
  }

  private readonly assertRestoreTombstonesApplied: () => void;
  private readonly hasActiveRetentionHold: (input: Readonly<{
    communityId: string; sourceChannelId: string; messageId: string;
  }>) => boolean;

  private assertQualified(): void {
    this.core.assertStorageCurrent();
    const profile = this.core.profile(this.profileRef);
    if (profile.retention_policy_ref !== this.retentionPolicyRef
      || profile.backup_policy_ref !== this.backupPolicyRef) return erasureHold();
    this.assertRestoreTombstonesApplied();
  }

  /** Drain one bounded Core page, carrying its returned cursor between calls.
   * The scheduler owns continuation; a null next cursor ends the sweep. */
  redactHistoricalClaimPage(cursor: Parameters<PlatformErasureAdmission["sweepExpiredClaimText"]>[1] = null) {
    this.assertQualified();
    return this.core.sweepExpiredClaimText(this.profileRef, cursor);
  }

  /** One page for each store that still has work in the current sweep. */
  redactPage(cursor: Parameters<PlatformErasureAdmission["sweepExpiredClaimText"]>[1] = null,
    pending: Readonly<{ messages: boolean; claims: boolean }> = { messages: true, claims: true }) {
    const messages = pending.messages ? this.redactExpired(this.core.now())
      : { redactedMessages: 0, trackedExternalOperations: 0, trackedPolicyHolds: 0, moreAvailable: false };
    const claims = pending.claims ? this.redactHistoricalClaimPage(cursor) : { changed: 0, next: null };
    return Object.freeze({ messages, claims });
  }

  redactExpired(atUtc: string, limit = 100): PartnerAlertTextRetentionResult {
    if (this.database.inTransaction) return erasureHold();
    const at = partnerAlertUtc(atUtc, "retentionAtUtc");
    const pageSize = partnerAlertInteger(limit, "retentionLimit", 1, 1000);
    this.assertQualified();
    return this.database.transaction(() => {
      this.assertQualified();
      // Recompute from first persisted receipt, including old sentinel/deadline
      // rows and already-expired rows with resurrected duplicate text on restore.
      const rows = this.database.prepare(`SELECT s.community_id,s.source_channel_id,s.message_id,
        min(r.observed_at_utc) first_received_at_utc FROM partner_alert_source_messages s
        JOIN partner_alert_source_revisions r ON r.community_id=s.community_id
          AND r.source_channel_id=s.source_channel_id AND r.message_id=s.message_id
        GROUP BY s.community_id,s.source_channel_id,s.message_id
        HAVING first_received_at_utc<=? AND (s.text_content IS NOT NULL
          OR s.state NOT IN ('expired','deleted')
          OR EXISTS(SELECT 1 FROM partner_alert_source_revisions x WHERE x.community_id=s.community_id
            AND x.source_channel_id=s.source_channel_id AND x.message_id=s.message_id AND x.text_content IS NOT NULL)
          OR EXISTS(SELECT 1 FROM partner_alert_deliveries d WHERE d.community_id=s.community_id
            AND d.source_channel_id=s.source_channel_id AND d.message_id=s.message_id
            AND (d.text_content IS NOT NULL OR (${PARTNER_ALERT_ORDINARY_DELIVERY_RECEIPT_HAS_TEXT_SQL})
              OR (${EXPIRED_UNSENT_WRITE_SQL}))))
        ORDER BY first_received_at_utc,s.community_id,s.source_channel_id,s.message_id LIMIT ?`)
        .all(new Date(Date.parse(at) - PARTNER_ALERT_RETENTION_POLICY.settledMessageTextDays * 86_400_000).toISOString(), pageSize + 1) as ExpiredSource[];
      let redactedMessages = 0;
      let trackedExternalOperations = 0;
      let trackedPolicyHolds = 0;
      for (const row of rows.slice(0, pageSize)) {
        if (this.hasActiveRetentionHold({ communityId: row.community_id,
          sourceChannelId: row.source_channel_id, messageId: row.message_id })) {
          trackedPolicyHolds += 1;
        }
        const unsettled = this.database.prepare(`SELECT 1 FROM partner_alert_deliveries
          WHERE community_id=? AND source_channel_id=? AND message_id=?
            AND (status='sending' OR (status='uncertain' AND lease_token IS NOT NULL)) LIMIT 1`)
          .get(row.community_id, row.source_channel_id, row.message_id);
        if (unsettled) {
          trackedExternalOperations += 1;
        }
        this.database.prepare(`UPDATE partner_alert_deliveries AS d
          SET status='cancelled',last_error_code='retention_expired'
          WHERE community_id=? AND source_channel_id=? AND message_id=?
            AND ${EXPIRED_UNSENT_WRITE_SQL}`)
          .run(row.community_id, row.source_channel_id, row.message_id);
        this.database.prepare(`UPDATE partner_alert_deliveries SET text_content=NULL
          WHERE community_id=? AND source_channel_id=? AND message_id=?`)
          .run(row.community_id, row.source_channel_id, row.message_id);
        redactPartnerAlertOrdinaryDeliveryReceipts(this.database, { communityId: row.community_id,
          sourceChannelId: row.source_channel_id, messageId: row.message_id });
        this.database.prepare(`UPDATE partner_alert_source_revisions SET text_content=NULL
          WHERE community_id=? AND source_channel_id=? AND message_id=?`)
          .run(row.community_id, row.source_channel_id, row.message_id);
        const deadline = partnerAlertInitialMessageTextRetainUntil("allowed", row.first_received_at_utc);
        const changed = this.database.prepare(`UPDATE partner_alert_source_messages
          SET state=CASE WHEN state='deleted' THEN 'deleted' ELSE 'expired' END,
            text_content=NULL,hold_issues_json='[]',retain_until_utc=min(retain_until_utc,?)
          WHERE community_id=? AND source_channel_id=? AND message_id=?`)
          .run(deadline, row.community_id, row.source_channel_id, row.message_id);
        if (changed.changes !== 1) return erasureHold();
        redactedMessages += 1;
      }
      return Object.freeze({ redactedMessages, trackedExternalOperations, trackedPolicyHolds,
        moreAvailable: rows.length > pageSize });
    }).immediate();
  }
}

/** Drain the restored backlog before startup returns. Later sweeps yield to
 * other work between bounded transactions and keep only one timer pending. */
export function startPartnerAlertTextRetention(
  retention: Pick<PartnerAlertTextRetention, "redactPage">,
  onFailure: () => void,
): () => void {
  let cursor: Parameters<PartnerAlertTextRetention["redactPage"]>[0] = null;
  let pending = { messages: true, claims: true };
  const sweepPage = () => {
    const { messages, claims } = retention.redactPage(cursor, pending);
    cursor = claims.next;
    pending = { messages: messages.moreAvailable, claims: cursor !== null };
    if (pending.messages || pending.claims) return true;
    pending = { messages: true, claims: true };
    return false;
  };
  while (sweepPage()) { /* Each page commits independently before continuing. */ }

  let stopped = false;
  const tick = () => {
    let delay = 60_000;
    try { if (sweepPage()) delay = 0; }
    catch { onFailure(); }
    if (stopped) return;
    timer = setTimeout(tick, delay);
    timer.unref();
  };
  let timer = setTimeout(tick, 60_000);
  timer.unref();
  return () => { stopped = true; clearTimeout(timer); };
}
