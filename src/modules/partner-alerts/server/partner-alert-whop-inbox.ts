import type Database from "better-sqlite3";
import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { partnerAlertId, partnerAlertInteger, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { PARTNER_ALERT_WHOP_API_VERSION } from "./partner-alert-whop-client";
import { parsePartnerAlertWhopWebhook, type PartnerAlertWhopEvent, type PartnerAlertWhopWebhookScope } from "./partner-alert-whop-webhook";
import { requirePartnerAlertAdmission, type PartnerAlertCommunityFence } from "./partner-alert-admission";
import type { PartnerAlertWhopPreparation } from "./partner-alert-whop-reconciliation";
import type { PartnerAlertWhopCommercialApply } from "./partner-alert-whop-commercial-apply";

export type PartnerAlertWhopInboxClaim = Readonly<{
  event: PartnerAlertWhopEvent;
  leaseToken: string;
  attempts: number;
  admissionFence: PartnerAlertCommunityFence;
}>;
type InboxRow = {
  community_id: string; environment: "sandbox" | "live"; whop_account_id: string;
  event_id: string; event_type: string; api_version_date: typeof PARTNER_ALERT_WHOP_API_VERSION;
  resource_kind: "membership" | "payment" | "account"; resource_id: string;
  payload_sha256: string; occurred_at_utc: string; attempts: number;
};
type RetryReason = "provider_unavailable" | "authorisation_unavailable" | "binding_unavailable" | "review_required";

/** Dormant injected DB queue. No opener, event receiver, network or automatic drain. */
export class PartnerAlertWhopInbox {
  constructor(private readonly db: Database.Database,
    private readonly configuration: Readonly<{
      scope: PartnerAlertWhopWebhookScope;
      nowUtc: () => string;
      createLeaseToken: () => string;
      manualRoleReview?: boolean;
    }>) {
    partnerAlertId(configuration.scope.communityId, "communityId");
    if (!["sandbox", "live"].includes(configuration.scope.environment)
      || !/^biz_[A-Za-z0-9_]{1,124}$/u.test(configuration.scope.accountId)
      || configuration.scope.apiVersionDate !== PARTNER_ALERT_WHOP_API_VERSION
      || typeof configuration.nowUtc !== "function" || typeof configuration.createLeaseToken !== "function") {
      throw new PartnerAlertValidationError("whopInboxConfiguration");
    }
  }
  private now(): string { return partnerAlertUtc(this.configuration.nowUtc(), "nowUtc"); }
  private write<T>(operation: () => T,userIds:readonly string[]=[]): T {
    return requirePartnerAlertAdmission(this.db).runCommunity(this.configuration.scope.communityId, userIds,
      () => this.db.transaction(operation)());
  }
  private scopeParams(): readonly [string, string, string] {
    const scope = this.configuration.scope;
    return [scope.communityId, scope.environment, scope.accountId];
  }
  private eventScope(event: PartnerAlertWhopEvent): void {
    const scope = this.configuration.scope;
    if (event.communityId !== scope.communityId || event.environment !== scope.environment
      || event.accountId !== scope.accountId || event.apiVersionDate !== scope.apiVersionDate
      || !/^[A-Za-z0-9_-]{1,128}$/u.test(event.eventId) || !/^[0-9a-f]{64}$/u.test(event.payloadSha256)
      || !["membership", "payment", "account"].includes(event.resourceKind)
      || !/^[A-Za-z0-9_.]{1,100}$/u.test(event.eventType)) throw new PartnerAlertValidationError("whopEvent");
    const prefix = { membership: "mem_", payment: "pay_", account: "biz_" }[event.resourceKind];
    if (typeof event.resourceId !== "string" || !event.resourceId.startsWith(prefix)
      || event.resourceId.length > 128 || event.resourceId.length <= prefix.length
      || !/^[A-Za-z0-9_]+$/u.test(event.resourceId)) throw new PartnerAlertValidationError("whopResource");
    partnerAlertUtc(event.occurredAtUtc, "occurredAtUtc");
  }

  /** The receiver inherits its merchant from the admitted server configuration. */
  receiveSignedEvent(input: Omit<Parameters<typeof parsePartnerAlertWhopWebhook>[0], "scope" | "nowUtc">):
    "recorded" | "duplicate" | "ignored" {
    const event = parsePartnerAlertWhopWebhook({ ...input, scope: this.configuration.scope, nowUtc: this.now() });
    return event ? this.enqueue(event) : "ignored";
  }

  /** Accept only the verified parser's minimal output, never a client-cast event. */
  enqueue(event: PartnerAlertWhopEvent): "recorded" | "duplicate" {
    this.eventScope(event);
    return this.write(() => {
      const existing = this.db.prepare(`SELECT payload_sha256,event_type,resource_kind,resource_id
        FROM partner_alert_whop_inbox WHERE community_id=? AND environment=? AND whop_account_id=? AND event_id=?`)
        .get(...this.scopeParams(), event.eventId) as
        { payload_sha256: string; event_type: string; resource_kind: string; resource_id: string } | undefined;
      if (existing) {
        if (existing.payload_sha256 !== event.payloadSha256 || existing.event_type !== event.eventType
          || existing.resource_kind !== event.resourceKind || existing.resource_id !== event.resourceId) {
          throw new PartnerAlertValidationError("whopEvent", "This event requires reconciliation.");
        }
        return "duplicate" as const;
      }
      const at = this.now();
      this.db.prepare(`INSERT INTO partner_alert_whop_inbox
        (community_id,environment,whop_account_id,event_id,event_type,api_version_date,resource_kind,resource_id,
         payload_sha256,status,available_at_utc,occurred_at_utc,received_at_utc,last_error_code)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(...this.scopeParams(), event.eventId, event.eventType,
        event.apiVersionDate, event.resourceKind, event.resourceId, event.payloadSha256,
        this.configuration.manualRoleReview ? "failed" : "pending", at, event.occurredAtUtc, at,
        this.configuration.manualRoleReview ? "manual_role_review" : null);
      return "recorded" as const;
    });
  }

  claim(leaseDurationMs: number): PartnerAlertWhopInboxClaim | null {
    partnerAlertInteger(leaseDurationMs, "leaseDurationMs", 1000, 120_000);
    return this.write(() => {
      const at = this.now();
      const scope = this.configuration.scope;
      this.db.prepare(`UPDATE partner_alert_whop_inbox SET status='failed',lease_token=NULL,
        lease_until_utc=NULL,last_error_code='review_required'
        WHERE community_id=? AND environment=? AND whop_account_id=? AND status='processing'
          AND attempts>=8 AND lease_until_utc<=?`).run(...this.scopeParams(), at);
      // Serialise hydration on a merchant, including another community sharing
      // that merchant. Provider reads happen after this short transaction ends.
      if (this.db.prepare(`SELECT 1 FROM partner_alert_whop_inbox WHERE environment=? AND whop_account_id=?
        AND status='processing' AND lease_until_utc>? LIMIT 1`).get(scope.environment, scope.accountId, at)) return null;
      const row = this.db.prepare(`SELECT * FROM partner_alert_whop_inbox
        WHERE community_id=? AND environment=? AND whop_account_id=? AND attempts<8
          AND last_error_code IS NOT 'manual_role_review'
          AND ((status IN ('pending','failed') AND available_at_utc<=?)
            OR (status='processing' AND lease_until_utc<=?))
        ORDER BY available_at_utc,received_at_utc,event_id LIMIT 1`)
        .get(...this.scopeParams(), at, at) as InboxRow | undefined;
      if (!row) return null;
      const token = partnerAlertId(this.configuration.createLeaseToken(), "leaseToken");
      const admissionFence = requirePartnerAlertAdmission(this.db).captureCommunityFence(scope.communityId);
      const until = new Date(Date.parse(at) + leaseDurationMs).toISOString();
      this.db.prepare(`UPDATE partner_alert_whop_inbox SET status='processing',attempts=attempts+1,
        lease_token=?,lease_until_utc=?,admission_fence_json=?,last_error_code=NULL WHERE community_id=? AND environment=? AND whop_account_id=? AND event_id=?`)
        .run(token, until, JSON.stringify(admissionFence), ...this.scopeParams(), row.event_id);
      const event: PartnerAlertWhopEvent = Object.freeze({ communityId: row.community_id, environment: row.environment,
        accountId: row.whop_account_id, apiVersionDate: row.api_version_date, eventId: row.event_id,
        eventType: row.event_type, resourceKind: row.resource_kind, resourceId: row.resource_id,
        payloadSha256: row.payload_sha256, occurredAtUtc: row.occurred_at_utc });
      this.eventScope(event);
      return Object.freeze({ event, leaseToken: token, attempts: row.attempts + 1, admissionFence });
    });
  }

  private assertLease(claim: PartnerAlertWhopInboxClaim, at: string): void {
    this.eventScope(claim.event); partnerAlertId(claim.leaseToken, "leaseToken");
    if (!this.db.prepare(`SELECT 1 FROM partner_alert_whop_inbox WHERE community_id=? AND environment=?
      AND whop_account_id=? AND event_id=? AND status='processing' AND lease_token=? AND lease_until_utc>?
      AND payload_sha256=? AND resource_kind=? AND resource_id=? AND admission_fence_json=?`)
      .get(...this.scopeParams(), claim.event.eventId, claim.leaseToken, at, claim.event.payloadSha256,
        claim.event.resourceKind, claim.event.resourceId, JSON.stringify(claim.admissionFence))) {
      throw new PartnerAlertValidationError("whopLease", "Event processing needs to be retried.");
    }
  }

  /** Apply already-hydrated verified facts and finish atomically. Callback MUST do no I/O. */
  isClaimCurrent(claim: PartnerAlertWhopInboxClaim): boolean {
    try {
      return this.write(() => {
        requirePartnerAlertAdmission(this.db).assertCommunityFence(claim.admissionFence);
        this.assertLease(claim, this.now()); return true;
      });
    } catch { return false; }
  }

  private completeWith<T>(claim: PartnerAlertWhopInboxClaim, userIds:readonly string[],applyFacts: () => T): T {
    return this.write(() => {
      requirePartnerAlertAdmission(this.db).assertCommunityFence(claim.admissionFence);
      this.assertLease(claim, this.now());
      const result = applyFacts();
      if (result !== null && typeof result === "object" && "then" in result) {
        throw new PartnerAlertValidationError("whopApply", "Apply verified facts synchronously.");
      }
      this.assertLease(claim, this.now());
      this.db.prepare(`UPDATE partner_alert_whop_inbox SET status='completed',lease_token=NULL,
        lease_until_utc=NULL,admission_fence_json=NULL,last_error_code=NULL WHERE community_id=? AND environment=? AND whop_account_id=? AND event_id=?`)
        .run(...this.scopeParams(), claim.event.eventId);
      return result;
    },userIds);
  }

  /** The commercial projection is mandatory and shares the exact inbox lease
   * transaction with membership application and completion. */
  completePreparedWith<T>(claim:PartnerAlertWhopInboxClaim,preparation:PartnerAlertWhopPreparation,
    commercial:PartnerAlertWhopCommercialApply,
    applyFacts:()=>T):T{
    if(!commercial||typeof commercial.retain!=="function")throw new PartnerAlertValidationError("whopApply");
    const context = preparation.context;
    if (!context) throw new PartnerAlertValidationError("whopApply");
    return this.completeWith(claim, [context.userId], () => {
      commercial.retain(claim, preparation);
      const result = applyFacts();
      // Wake only existing role jobs covered by the affected exact offer. The
      // role worker will refresh current authority across all offers for each
      // mapping before deciding whether to remove its managed Discord role.
      this.db.prepare(`UPDATE partner_alert_role_jobs
        SET refresh_required=1, next_attempt_at_utc=min(next_attempt_at_utc, ?),
            status=CASE WHEN status='applied' THEN 'held' ELSE status END
        WHERE community_id=? AND user_id=? AND EXISTS (
          SELECT 1 FROM partner_alert_offer_channels c
          WHERE c.community_id=partner_alert_role_jobs.community_id
            AND c.mapping_id=partner_alert_role_jobs.mapping_id
            AND c.offer_id=? AND c.offer_version=?
        )`).run(this.now(), context.communityId, context.userId, context.offerId, context.offerVersion);
      return result;
    });
  }

  retry(claim: PartnerAlertWhopInboxClaim, input: Readonly<{ delayMs: number; reason: RetryReason }>): void {
    partnerAlertInteger(input.delayMs, "retryDelayMs", 1000, 86_400_000);
    if (!["provider_unavailable", "authorisation_unavailable", "binding_unavailable", "review_required"].includes(input.reason)) {
      throw new PartnerAlertValidationError("retryReason");
    }
    this.write(() => {
      const at = this.now(); this.assertLease(claim, at);
      this.db.prepare(`UPDATE partner_alert_whop_inbox SET status='failed',available_at_utc=?,
        lease_token=NULL,lease_until_utc=NULL,admission_fence_json=NULL,last_error_code=? WHERE community_id=? AND environment=? AND whop_account_id=? AND event_id=?`)
        .run(new Date(Date.parse(at) + input.delayMs).toISOString(), input.reason, ...this.scopeParams(), claim.event.eventId);
    });
  }
}
