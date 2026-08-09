import type Database from "better-sqlite3";

import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type WhopAiReviewAccessState =
  | "active"
  | "not_linked"
  | "not_subscribed"
  | "conflict";

export type WhopAiReviewAccessRecord = Readonly<{
  state: WhopAiReviewAccessState;
  cancelAtPeriodEnd: boolean;
  renewalPeriodStartUtc: string | null;
  renewalPeriodEndUtc: string | null;
}>;

export type WhopMembershipProjectionEvent = Readonly<{
  webhookIdSha256: string;
  payloadSha256: string;
  eventType: "membership.activated" | "membership.deactivated" |
    "membership.cancel_at_period_end_changed";
  eventAtUtc: string;
  membershipRefHmac: string;
  whopUserRefHmac: string;
  companyRefHmac: string;
  productRefHmac: string;
  membershipState: "active" | "deactivated";
  cancelAtPeriodEnd: boolean;
  renewalPeriodStartUtc: string | null;
  renewalPeriodEndUtc: string | null;
}>;

export type WhopOperationalEvent = Readonly<{
  webhookIdSha256: string;
  payloadSha256: string;
  eventType: "payment.failed";
  eventAtUtc: string;
  membershipRefHmac: string | null;
}>;

export type WhopWebhookProcessingResult =
  "applied" | "duplicate" | "stale" | "conflict" | "operational_only";

type LinkRow = Readonly<{
  link_id: string;
  user_id: string;
  whop_user_ref_hmac: string;
  link_state: "active" | "revoked" | "conflict";
}>;

type ProjectionRow = Readonly<{
  membership_ref_hmac: string;
  whop_user_ref_hmac: string;
  company_ref_hmac: string;
  product_ref_hmac: string;
  membership_state: "active" | "deactivated" | "conflict";
  cancel_at_period_end: number;
  renewal_period_start_utc: string | null;
  renewal_period_end_utc: string | null;
  last_event_at_utc: string;
  last_event_payload_sha256: string;
}>;

const TABLES = Object.freeze([
  "platform_whop_user_links",
  "platform_whop_membership_projections",
  "platform_whop_webhook_receipts",
] as const);

export function isWhopAiReviewEntitlementSchemaAvailable(
  database: Database.Database,
): boolean {
  const rows = database.prepare<[], Readonly<{ name: string }>>(
    `SELECT name FROM sqlite_schema WHERE type = 'table' AND name IN (${TABLES
      .map((name) => `'${name}'`).join(", ")})`,
  ).all();
  return rows.length === TABLES.length;
}

export class WhopAiReviewEntitlementRepository {
  constructor(private readonly database: Database.Database) {}

  linkUser(userId: string, whopUserRefHmac: string, now = new Date()):
  "linked" | "already_linked" | "conflict" {
    return this.database.transaction(() => {
      const activeForUser = this.database.prepare<[string], LinkRow>(`SELECT
  link_id, user_id, whop_user_ref_hmac, link_state
FROM platform_whop_user_links WHERE user_id = ? AND link_state = 'active'`).get(userId);
      const activeForWhop = this.database.prepare<[string], LinkRow>(`SELECT
  link_id, user_id, whop_user_ref_hmac, link_state
FROM platform_whop_user_links
WHERE whop_user_ref_hmac = ? AND link_state = 'active'`).get(whopUserRefHmac);
      const at = createCanonicalUtcTimestamp(now);
      if (activeForUser?.whop_user_ref_hmac === whopUserRefHmac &&
          activeForWhop?.user_id === userId) {
        this.database.prepare(`UPDATE platform_whop_user_links
SET verified_at_utc = ?, updated_at_utc = ? WHERE link_id = ?`).run(
          at, at, activeForUser.link_id,
        );
        return "already_linked" as const;
      }
      if (activeForUser || activeForWhop) {
        const ids = [...new Set([activeForUser?.link_id, activeForWhop?.link_id]
          .filter((id): id is string => Boolean(id)))];
        for (const id of ids) {
          this.database.prepare(`UPDATE platform_whop_user_links
SET link_state = 'conflict', updated_at_utc = ? WHERE link_id = ?`).run(at, id);
        }
        this.database.prepare(`INSERT INTO platform_whop_user_links (
  link_id, user_id, whop_user_ref_hmac, link_state, linked_at_utc,
  verified_at_utc, updated_at_utc, revoked_at_utc
) VALUES (?, ?, ?, 'conflict', ?, ?, ?, NULL)`).run(
          createCanonicalUuidV4(), userId, whopUserRefHmac, at, at, at,
        );
        return "conflict" as const;
      }
      this.database.prepare(`INSERT INTO platform_whop_user_links (
  link_id, user_id, whop_user_ref_hmac, link_state, linked_at_utc,
  verified_at_utc, updated_at_utc, revoked_at_utc
) VALUES (?, ?, ?, 'active', ?, ?, ?, NULL)`).run(
        createCanonicalUuidV4(), userId, whopUserRefHmac, at, at, at,
      );
      return "linked" as const;
    }).immediate();
  }

  readAccess(userId: string): WhopAiReviewAccessRecord {
    const linkStates = this.database.prepare<[string], Readonly<{ link_state: string }>>(
      "SELECT link_state FROM platform_whop_user_links WHERE user_id = ?",
    ).all(userId);
    if (linkStates.some((row) => row.link_state === "conflict")) {
      return Object.freeze({ state: "conflict", cancelAtPeriodEnd: false,
        renewalPeriodStartUtc: null,
        renewalPeriodEndUtc: null });
    }
    const activeLink = this.database.prepare<[string], LinkRow>(`SELECT
  link_id, user_id, whop_user_ref_hmac, link_state
FROM platform_whop_user_links WHERE user_id = ? AND link_state = 'active'`).get(userId);
    if (!activeLink) {
      return Object.freeze({ state: "not_linked", cancelAtPeriodEnd: false,
        renewalPeriodStartUtc: null,
        renewalPeriodEndUtc: null });
    }
    const projections = this.database.prepare<[string], ProjectionRow>(`SELECT
  membership_ref_hmac, whop_user_ref_hmac, company_ref_hmac, product_ref_hmac,
  membership_state, cancel_at_period_end, renewal_period_start_utc,
  renewal_period_end_utc,
  last_event_at_utc, last_event_payload_sha256
FROM platform_whop_membership_projections
WHERE whop_user_ref_hmac = ? AND feature_key = 'ai_reviews'
ORDER BY renewal_period_end_utc DESC, last_event_at_utc DESC`).all(
      activeLink.whop_user_ref_hmac,
    );
    if (projections.some((row) => row.membership_state === "conflict")) {
      return Object.freeze({ state: "conflict", cancelAtPeriodEnd: false,
        renewalPeriodStartUtc: null,
        renewalPeriodEndUtc: null });
    }
    const active = projections.filter((row) => row.membership_state === "active");
    if (active.length === 0) {
      return Object.freeze({ state: "not_subscribed", cancelAtPeriodEnd: false,
        renewalPeriodStartUtc: null,
        renewalPeriodEndUtc: null });
    }
    return Object.freeze({
      state: "active",
      cancelAtPeriodEnd: active.every((row) => row.cancel_at_period_end === 1),
      renewalPeriodStartUtc: active.map((row) => row.renewal_period_start_utc)
        .filter((value): value is string => value !== null).sort().at(-1) ?? null,
      renewalPeriodEndUtc: active.map((row) => row.renewal_period_end_utc)
        .filter((value): value is string => value !== null).sort().at(-1) ?? null,
    });
  }

  applyMembershipEvent(
    event: WhopMembershipProjectionEvent,
    now = new Date(),
  ): WhopWebhookProcessingResult {
    return this.database.transaction(() => {
      if (this.receiptExists(event.webhookIdSha256)) return "duplicate" as const;
      const existing = this.database.prepare<[string], ProjectionRow>(`SELECT
  membership_ref_hmac, whop_user_ref_hmac, company_ref_hmac, product_ref_hmac,
  membership_state, cancel_at_period_end, renewal_period_start_utc,
  renewal_period_end_utc,
  last_event_at_utc, last_event_payload_sha256
FROM platform_whop_membership_projections WHERE membership_ref_hmac = ?`).get(
        event.membershipRefHmac,
      );
      let result: WhopWebhookProcessingResult = "applied";
      if (existing?.membership_state === "conflict") result = "conflict";
      else if (existing && event.eventAtUtc < existing.last_event_at_utc) result = "stale";
      else if (existing && event.eventAtUtc === existing.last_event_at_utc &&
          event.payloadSha256 === existing.last_event_payload_sha256) result = "duplicate";
      else if (existing && (event.eventAtUtc === existing.last_event_at_utc ||
          existing.whop_user_ref_hmac !== event.whopUserRefHmac ||
          existing.company_ref_hmac !== event.companyRefHmac ||
          existing.product_ref_hmac !== event.productRefHmac)) {
        result = "conflict";
        this.database.prepare(`UPDATE platform_whop_membership_projections
SET membership_state = 'conflict', updated_at_utc = ?
WHERE membership_ref_hmac = ?`).run(
          createCanonicalUtcTimestamp(now), event.membershipRefHmac,
        );
      } else if (existing) {
        this.database.prepare(`UPDATE platform_whop_membership_projections SET
  membership_state = ?, cancel_at_period_end = ?, renewal_period_start_utc = ?,
  renewal_period_end_utc = ?, last_event_at_utc = ?,
  last_event_payload_sha256 = ?, last_webhook_id_sha256 = ?, updated_at_utc = ?
WHERE membership_ref_hmac = ?`).run(
          event.membershipState, event.cancelAtPeriodEnd ? 1 : 0,
          event.renewalPeriodStartUtc, event.renewalPeriodEndUtc, event.eventAtUtc,
          event.payloadSha256, event.webhookIdSha256,
          createCanonicalUtcTimestamp(now), event.membershipRefHmac,
        );
      } else {
        const at = createCanonicalUtcTimestamp(now);
        this.database.prepare(`INSERT INTO platform_whop_membership_projections (
  membership_ref_hmac, whop_user_ref_hmac, company_ref_hmac, product_ref_hmac,
  feature_key, membership_state, cancel_at_period_end, renewal_period_start_utc,
  renewal_period_end_utc, last_event_at_utc, last_event_payload_sha256,
  last_webhook_id_sha256, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'ai_reviews', ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          event.membershipRefHmac, event.whopUserRefHmac, event.companyRefHmac,
          event.productRefHmac, event.membershipState,
          event.cancelAtPeriodEnd ? 1 : 0, event.renewalPeriodStartUtc,
          event.renewalPeriodEndUtc, event.eventAtUtc, event.payloadSha256,
          event.webhookIdSha256, at, at,
        );
      }
      this.insertReceipt(event, result, now);
      return result;
    }).immediate();
  }

  recordOperationalEvent(
    event: WhopOperationalEvent,
    now = new Date(),
  ): WhopWebhookProcessingResult {
    if (this.receiptExists(event.webhookIdSha256)) return "duplicate";
    this.insertReceipt(event, "operational_only", now);
    return "operational_only";
  }

  readAdminSummary(): Readonly<{
    activeMembershipCount: number;
    deactivatedMembershipCount: number;
    conflictCount: number;
    unmatchedActiveMembershipCount: number;
    paymentFailureCount: number;
    receiptCount: number;
    lastWebhookAtUtc: string | null;
  }> {
    const count = (sql: string) => this.database.prepare<[], Readonly<{ count: number }>>(
      sql,
    ).get()?.count ?? 0;
    const last = this.database.prepare<[], Readonly<{ event_at_utc: string }>>(
      "SELECT event_at_utc FROM platform_whop_webhook_receipts ORDER BY event_at_utc DESC LIMIT 1",
    ).get();
    return Object.freeze({
      activeMembershipCount: count("SELECT COUNT(*) AS count FROM platform_whop_membership_projections WHERE membership_state = 'active'"),
      deactivatedMembershipCount: count("SELECT COUNT(*) AS count FROM platform_whop_membership_projections WHERE membership_state = 'deactivated'"),
      conflictCount: count("SELECT COUNT(*) AS count FROM platform_whop_membership_projections WHERE membership_state = 'conflict'") + count("SELECT COUNT(*) AS count FROM platform_whop_user_links WHERE link_state = 'conflict'"),
      unmatchedActiveMembershipCount: count(`SELECT COUNT(*) AS count
FROM platform_whop_membership_projections projection
LEFT JOIN platform_whop_user_links link
  ON link.whop_user_ref_hmac = projection.whop_user_ref_hmac
 AND link.link_state = 'active'
WHERE projection.membership_state = 'active' AND link.link_id IS NULL`),
      paymentFailureCount: count("SELECT COUNT(*) AS count FROM platform_whop_webhook_receipts WHERE event_type = 'payment.failed'"),
      receiptCount: count("SELECT COUNT(*) AS count FROM platform_whop_webhook_receipts"),
      lastWebhookAtUtc: last?.event_at_utc ?? null,
    });
  }

  private receiptExists(webhookIdSha256: string): boolean {
    return Boolean(this.database.prepare<[string], Readonly<{ found: number }>>(
      "SELECT 1 AS found FROM platform_whop_webhook_receipts WHERE webhook_id_sha256 = ?",
    ).get(webhookIdSha256));
  }

  private insertReceipt(
    event: WhopMembershipProjectionEvent | WhopOperationalEvent,
    result: WhopWebhookProcessingResult,
    now: Date,
  ): void {
    this.database.prepare(`INSERT INTO platform_whop_webhook_receipts (
  webhook_id_sha256, event_type, event_at_utc, payload_sha256,
  membership_ref_hmac, processing_result, processed_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      event.webhookIdSha256, event.eventType, event.eventAtUtc,
      event.payloadSha256, event.membershipRefHmac, result,
      createCanonicalUtcTimestamp(now),
    );
  }
}
