import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import type { WhopAiReviewReconciliationConfiguration } from
  "./whop-ai-review-configuration";
import { createWhopPrivacyReference } from "./whop-ai-review-identity";
import {
  WhopAiReviewEntitlementRepository,
  type WhopMembershipProjectionEvent,
} from "./whop-ai-review-entitlement-repository";
import {
  WhopAiReviewReconciliationRepository,
  type WhopReconciliationCounts,
  type WhopReconciliationRunSummary,
} from "./whop-ai-review-reconciliation-repository";

const ENDPOINT = "https://api.whop.com/api/v1/memberships";
const MAX_PAGES = 100;
const PAGE_SIZE = 100;
const ACTIVE_STATUSES = new Set(["active", "trialing", "canceling"]);
const DEACTIVATED_STATUSES = new Set(["canceled", "completed", "expired"]);

type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

type Membership = Readonly<{
  id: string;
  status: string;
  updatedAtUtc: string;
  cancelAtPeriodEnd: boolean;
  renewalPeriodStartUtc: string | null;
  renewalPeriodEndUtc: string | null;
  companyId: string;
  productId: string;
  userId: string | null;
}>;

type Page = Readonly<{
  memberships: readonly Membership[];
  endCursor: string | null;
  hasNextPage: boolean;
}>;

const EMPTY_COUNTS = Object.freeze({
  pageCount: 0,
  fetchedCount: 0,
  appliedCount: 0,
  duplicateCount: 0,
  staleCount: 0,
  conflictCount: 0,
  ignoredCount: 0,
}) satisfies WhopReconciliationCounts;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("TRADERLINK_WHOP_RECONCILIATION_RESPONSE_INVALID");
  }
  return value as Record<string, unknown>;
}

function string(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 512) {
    throw new Error("TRADERLINK_WHOP_RECONCILIATION_RESPONSE_INVALID");
  }
  return value.trim();
}

function timestamp(value: unknown, nullable = false): string | null {
  if (nullable && (value === null || value === undefined)) return null;
  const parsed = new Date(string(value));
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error("TRADERLINK_WHOP_RECONCILIATION_RESPONSE_INVALID");
  }
  return parsed.toISOString();
}

function parseMembership(value: unknown): Membership {
  const row = object(value);
  return Object.freeze({
    id: string(row.id),
    status: string(row.status),
    updatedAtUtc: timestamp(row.updated_at) as string,
    cancelAtPeriodEnd: row.cancel_at_period_end === true,
    renewalPeriodStartUtc: timestamp(row.renewal_period_start, true),
    renewalPeriodEndUtc: timestamp(row.renewal_period_end, true),
    companyId: string(object(row.company).id),
    productId: string(object(row.product).id),
    userId: row.user === null || row.user === undefined
      ? null : string(object(row.user).id),
  });
}

function parsePage(value: unknown): Page {
  const body = object(value);
  if (!Array.isArray(body.data)) {
    throw new Error("TRADERLINK_WHOP_RECONCILIATION_RESPONSE_INVALID");
  }
  const pageInfo = object(body.page_info);
  const hasNextPage = pageInfo.has_next_page === true;
  const endCursor = pageInfo.end_cursor === null || pageInfo.end_cursor === undefined
    ? null : string(pageInfo.end_cursor);
  if (hasNextPage && !endCursor) {
    throw new Error("TRADERLINK_WHOP_RECONCILIATION_RESPONSE_INVALID");
  }
  return Object.freeze({
    memberships: Object.freeze(body.data.map(parseMembership)),
    endCursor,
    hasNextPage,
  });
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function projectionEvent(
  membership: Membership,
  configuration: WhopAiReviewReconciliationConfiguration,
): WhopMembershipProjectionEvent {
  const key = configuration.identityHmacKey;
  if (!membership.userId) {
    throw new Error("TRADERLINK_WHOP_RECONCILIATION_USER_MISSING");
  }
  const membershipRefHmac = createWhopPrivacyReference(
    membership.id, "membership", key,
  );
  const whopUserRefHmac = createWhopPrivacyReference(membership.userId, "user", key);
  const companyRefHmac = createWhopPrivacyReference(
    membership.companyId, "company", key,
  );
  const productRefHmac = createWhopPrivacyReference(
    membership.productId, "product", key,
  );
  const membershipState = ACTIVE_STATUSES.has(membership.status)
    ? "active" as const : "deactivated" as const;
  const canonical = JSON.stringify({
    cancelAtPeriodEnd: membership.cancelAtPeriodEnd,
    companyRefHmac,
    eventAtUtc: membership.updatedAtUtc,
    membershipRefHmac,
    membershipState,
    productRefHmac,
    renewalPeriodEndUtc: membership.renewalPeriodEndUtc,
    renewalPeriodStartUtc: membership.renewalPeriodStartUtc,
    whopUserRefHmac,
  });
  const payloadSha256 = digest(canonical);
  return Object.freeze({
    webhookIdSha256: digest(`whop-reconciliation-v1\0${membershipRefHmac}\0${payloadSha256}`),
    payloadSha256,
    eventType: membershipState === "active"
      ? "membership.activated" : "membership.deactivated",
    eventAtUtc: membership.updatedAtUtc,
    membershipRefHmac,
    whopUserRefHmac,
    companyRefHmac,
    productRefHmac,
    membershipState,
    cancelAtPeriodEnd: membership.cancelAtPeriodEnd,
    renewalPeriodStartUtc: membership.renewalPeriodStartUtc,
    renewalPeriodEndUtc: membership.renewalPeriodEndUtc,
  });
}

function failureCode(error: unknown): string {
  if (error instanceof Error && /^TRADERLINK_[A-Z0-9_]{1,84}$/u.test(error.message)) {
    return error.message.slice(0, 96);
  }
  return "TRADERLINK_WHOP_RECONCILIATION_FAILED";
}

export class WhopAiReviewReconciliationService {
  private readonly runs: WhopAiReviewReconciliationRepository;
  private readonly entitlements: WhopAiReviewEntitlementRepository;

  constructor(private readonly input: Readonly<{
    database: Database.Database;
    configuration: WhopAiReviewReconciliationConfiguration;
    fetcher?: Fetcher;
    now?: () => Date;
  }>) {
    this.runs = new WhopAiReviewReconciliationRepository(input.database);
    this.entitlements = new WhopAiReviewEntitlementRepository(input.database);
  }

  async run(): Promise<WhopReconciliationRunSummary> {
    const now = this.input.now ?? (() => new Date());
    const run = this.runs.begin(now());
    let counts: WhopReconciliationCounts = EMPTY_COUNTS;
    try {
      const seenCursors = new Set<string>();
      let after: string | null = null;
      for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex += 1) {
        const url = new URL(ENDPOINT);
        url.searchParams.set("company_id", this.input.configuration.companyId);
        url.searchParams.set("first", String(PAGE_SIZE));
        for (const productId of this.input.configuration.productIds) {
          url.searchParams.append("product_ids", productId);
        }
        if (after) url.searchParams.set("after", after);
        const response = await (this.input.fetcher ?? fetch)(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.input.configuration.apiKey}`,
            "Whop-Version": this.input.configuration.apiVersionDate,
          },
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`TRADERLINK_WHOP_RECONCILIATION_HTTP_${response.status}`);
        }
        const page = parsePage(await response.json());
        const nextCounts = { ...counts, pageCount: counts.pageCount + 1 };
        for (const membership of page.memberships) {
          nextCounts.fetchedCount += 1;
          if (membership.companyId !== this.input.configuration.companyId ||
              !this.input.configuration.productIds.has(membership.productId) ||
              !membership.userId ||
              (!ACTIVE_STATUSES.has(membership.status) &&
                !DEACTIVATED_STATUSES.has(membership.status))) {
            nextCounts.ignoredCount += 1;
            continue;
          }
          const result = this.entitlements.applyMembershipEvent(
            projectionEvent(membership, this.input.configuration), now(),
          );
          if (result === "applied") nextCounts.appliedCount += 1;
          else if (result === "duplicate") nextCounts.duplicateCount += 1;
          else if (result === "stale") nextCounts.staleCount += 1;
          else if (result === "conflict") nextCounts.conflictCount += 1;
        }
        counts = Object.freeze(nextCounts);
        if (!page.hasNextPage) return this.runs.complete(run.runId, counts, now());
        if (!page.endCursor || seenCursors.has(page.endCursor)) {
          throw new Error("TRADERLINK_WHOP_RECONCILIATION_CURSOR_INVALID");
        }
        seenCursors.add(page.endCursor);
        after = page.endCursor;
      }
      throw new Error("TRADERLINK_WHOP_RECONCILIATION_PAGE_LIMIT");
    } catch (error) {
      this.runs.fail(run.runId, failureCode(error), counts, now());
      throw error;
    }
  }
}
