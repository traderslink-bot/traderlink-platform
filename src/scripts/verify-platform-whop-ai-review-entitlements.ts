import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import type { WhopAiReviewEntitlementConfiguration } from
  "@/src/modules/platform/server/billing/whop-ai-review-configuration";
import { WhopAiReviewEntitlementRepository } from
  "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import { createWhopPrivacyReference } from
  "@/src/modules/platform/server/billing/whop-ai-review-identity";
import {
  parseWhopAiReviewWebhook,
  verifyWhopWebhookSignature,
} from "@/src/modules/platform/server/billing/whop-ai-review-webhook";
import { platformWhopAiReviewEntitlementsMigration } from
  "@/src/modules/platform/server/database/migrations/0045_platform_whop_ai_review_entitlements";

const raw = Object.freeze({
  company: "biz_fixture_whop_company",
  product: "prod_fixture_ai_reviews",
  user: "user_fixture_whop_identity",
  membership: "mem_fixture_ai_reviews",
});
const secret = "fixture-webhook-secret-not-for-production";
const identityKey = "fixture-identity-hmac-key-with-32-chars-minimum";
const configuration: WhopAiReviewEntitlementConfiguration = Object.freeze({
  webhookSecret: secret,
  companyId: raw.company,
  productIds: new Set([raw.product]),
  identityHmacKey: identityKey,
  apiVersionDate: "2026-07-20",
});

function count(database: Database.Database, table: string): number {
  return database.prepare<[], Readonly<{ count: number }>>(
    `SELECT COUNT(*) AS count FROM ${table}`,
  ).get()!.count;
}

function signedEvent(input: Readonly<{
  id: string;
  type: "membership.activated" | "membership.deactivated" |
    "membership.cancel_at_period_end_changed" | "payment.failed";
  eventAt: Date;
  cancelAtPeriodEnd?: boolean;
}>): Readonly<{ body: string; timestamp: string; signature: string }> {
  const data = input.type === "payment.failed" ? {
    id: "pay_fixture_failed",
    product: { id: raw.product },
    membership: { id: raw.membership },
  } : {
    id: raw.membership,
    status: input.type === "membership.deactivated" ? "expired" : "active",
    cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
    renewal_period_start: "2026-08-01T00:00:00.000Z",
    renewal_period_end: "2026-09-01T00:00:00.000Z",
    product: { id: raw.product },
    user: { id: raw.user },
  };
  const body = JSON.stringify({
    api_version: "v1",
    api_version_date: configuration.apiVersionDate,
    company_id: raw.company,
    data,
    id: input.id,
    timestamp: input.eventAt.toISOString(),
    type: input.type,
  });
  const timestamp = String(Math.floor(Date.now() / 1_000));
  const signature = `v1,${createHmac("sha256", secret)
    .update(`${input.id}.${timestamp}.${body}`, "utf8").digest("base64")}`;
  return Object.freeze({ body, timestamp, signature });
}

function accept(
  repository: WhopAiReviewEntitlementRepository,
  event: ReturnType<typeof signedEvent>,
  id: string,
  now: Date,
) {
  verifyWhopWebhookSignature({
    rawBody: event.body,
    webhookId: id,
    webhookTimestamp: event.timestamp,
    webhookSignature: event.signature,
    secret,
  });
  const parsed = parseWhopAiReviewWebhook({
    rawBody: event.body,
    webhookId: id,
    configuration,
  });
  return parsed.eventType === "payment.failed"
    ? repository.recordOperationalEvent(parsed, now)
    : repository.applyMembershipEvent(parsed, now);
}

async function main(): Promise<void> {
  const local = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-whop-entitlement-"));
  const copyPath = join(temporaryRoot, "migration-check.sqlite");
  const source = new Database(local.databasePath, { fileMustExist: true, readonly: true });
  try {
    await source.backup(copyPath);
  } finally {
    source.close();
  }
  try {
    const database = new Database(copyPath, { fileMustExist: true });
    try {
      database.pragma("foreign_keys = ON");
      const preservedTables = [
        "journal_executions",
        "coach_ai_review_period_requests_v2",
        "coach_ai_issued_reviews_v2",
      ] as const;
      const before = Object.fromEntries(preservedTables.map((table) =>
        [table, count(database, table)]));
      const schemaAlreadyCurrent = Boolean(database.prepare<[], Readonly<{
        present: number;
      }>>(`SELECT 1 AS present FROM sqlite_master
WHERE type = 'table' AND name = 'platform_whop_user_links'`).get());
      if (!schemaAlreadyCurrent) {
        for (const statement of platformWhopAiReviewEntitlementsMigration.statements) {
          database.exec(statement);
        }
      }
      const user = database.prepare<[], Readonly<{ user_id: string }>>(
        "SELECT user_id FROM platform_users ORDER BY created_at_utc LIMIT 1",
      ).get();
      if (!user) throw new Error("TRADERLINK_WHOP_VERIFY_USER_MISSING");
      const repository = new WhopAiReviewEntitlementRepository(database);
      const base = new Date();
      const activatedAt = new Date(base.getTime() - 4_000);
      const cancelAt = new Date(base.getTime() - 3_000);
      const staleAt = new Date(base.getTime() - 5_000);
      const deactivatedAt = new Date(base.getTime() - 2_000);
      const activated = signedEvent({ id: "msg_fixture_activate", type:
        "membership.activated", eventAt: activatedAt });
      const cancel = signedEvent({ id: "msg_fixture_cancel", type:
        "membership.cancel_at_period_end_changed", eventAt: cancelAt,
        cancelAtPeriodEnd: true });
      const stale = signedEvent({ id: "msg_fixture_stale", type:
        "membership.activated", eventAt: staleAt });
      const deactivated = signedEvent({ id: "msg_fixture_deactivate", type:
        "membership.deactivated", eventAt: deactivatedAt,
        cancelAtPeriodEnd: true });
      const payment = signedEvent({ id: "msg_fixture_payment_failed", type:
        "payment.failed", eventAt: new Date(base.getTime() - 1_000) });
      const activatedResult = accept(repository, activated, "msg_fixture_activate", base);
      const duplicateResult = accept(repository, activated, "msg_fixture_activate", base);
      const unmatchedBeforeLink = repository.readAdminSummary().unmatchedActiveMembershipCount;
      const linkResult = repository.linkUser(user.user_id,
        createWhopPrivacyReference(raw.user, "user", identityKey), base);
      const cancelResult = accept(repository, cancel, "msg_fixture_cancel", base);
      const accessBeforeDeactivation = repository.readAccess(user.user_id);
      const staleResult = accept(repository, stale, "msg_fixture_stale", base);
      const deactivatedResult = accept(repository, deactivated,
        "msg_fixture_deactivate", base);
      const paymentResult = accept(repository, payment,
        "msg_fixture_payment_failed", base);
      const accessAfterDeactivation = repository.readAccess(user.user_id);
      const after = Object.fromEntries(preservedTables.map((table) =>
        [table, count(database, table)]));
      const stored = JSON.stringify({
        links: database.prepare("SELECT * FROM platform_whop_user_links").all(),
        memberships: database.prepare(
          "SELECT * FROM platform_whop_membership_projections",
        ).all(),
        receipts: database.prepare("SELECT * FROM platform_whop_webhook_receipts").all(),
      });
      const rawIdentifierLeak = Object.values(raw).some((value) => stored.includes(value));
      const foreignKeyFailures = database.pragma("foreign_key_check") as unknown[];
      const valid = activatedResult === "applied" && duplicateResult === "duplicate" &&
        unmatchedBeforeLink === 1 && linkResult === "linked" &&
        cancelResult === "applied" && accessBeforeDeactivation.state === "active" &&
        accessBeforeDeactivation.cancelAtPeriodEnd && staleResult === "stale" &&
        deactivatedResult === "applied" && paymentResult === "operational_only" &&
        accessAfterDeactivation.state === "not_subscribed" && !rawIdentifierLeak &&
        JSON.stringify(before) === JSON.stringify(after) && foreignKeyFailures.length === 0;
      process.stdout.write(`${JSON.stringify({
        migrationId: platformWhopAiReviewEntitlementsMigration.migrationId,
        schemaAlreadyCurrent,
        signedMembershipLifecycle: activatedResult === "applied" &&
          cancelResult === "applied" && deactivatedResult === "applied",
        replaySafe: duplicateResult === "duplicate" && staleResult === "stale",
        paidAccessLifecycle: accessBeforeDeactivation.state === "active" &&
          accessAfterDeactivation.state === "not_subscribed",
        paymentFailureOperationalOnly: paymentResult === "operational_only",
        rawIdentifierLeak,
        unrelatedCountsPreserved: JSON.stringify(before) === JSON.stringify(after),
        foreignKeyFailures: foreignKeyFailures.length,
        valid,
      })}\n`);
      if (!valid) process.exitCode = 1;
    } finally {
      database.close();
    }
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

void main();
