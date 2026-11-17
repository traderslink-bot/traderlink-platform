import { createHash, createPublicKey, verify, type KeyObject } from "node:crypto";
import { dirname, isAbsolute } from "node:path";
import type Database from "better-sqlite3";
import { platformPaidStripeConnectBillingMigration } from "../../platform/server/database/migrations/0209_platform_paid_stripe_connect_billing";
import { readAppliedPlatformMigrations } from "../../platform/server/database/platform-migration-registry";
import type { PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { partnerAlertUtc } from "../contracts/partner-alert-validation";
import { readPartnerAlertTombstoneLedgerBytes } from "./partner-alert-tombstone-ledger-bounded-reader";
import {
  expirePartnerAlertStripeUnboundEvents,
  PARTNER_ALERT_STRIPE_UNBOUND_RETENTION_MS,
  PARTNER_ALERT_STRIPE_UNBOUND_SWEEP_LIMIT,
} from "./database/partner-alert-stripe-connect-lifecycle";

export type StripeRetentionBinding = Readonly<{
  reviewerKey: KeyObject;
  readSignedReview: () => Readonly<{ payload: string; signature: Buffer }> | null;
}>;

export function encodePartnerAlertStripeRetentionReview(input: Readonly<{
  schemaSha256: string;
  migrationLedgerSha256: string;
  profileCatalogSha256: string;
  profileRef: string;
  validUntilUtc: string;
}>): string {
  return JSON.stringify(["partner_alert_stripe_retention_v2", "unmatched_checkout_events_only",
    PARTNER_ALERT_STRIPE_UNBOUND_RETENTION_MS, PARTNER_ALERT_STRIPE_UNBOUND_SWEEP_LIMIT,
    input.schemaSha256, input.migrationLedgerSha256, input.profileCatalogSha256, input.profileRef, input.validUntilUtc]);
}

export function readConfiguredPartnerAlertStripeRetentionBinding(environment: NodeJS.ProcessEnv): StripeRetentionBinding | null {
  const path = environment.PARTNER_ALERT_STRIPE_RETENTION_REVIEW_PATH;
  if (environment.NODE_ENV !== "production" || !path) return null;
  if (!isAbsolute(path)) throw new Error("Partner retention review path is invalid.");
  const reviewerKey = createPublicKey(environment.PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PUBLIC_KEY ?? "");
  return { reviewerKey, readSignedReview: () => {
    const data: unknown = JSON.parse(readPartnerAlertTombstoneLedgerBytes(path, dirname(path), 4096).toString("utf8"));
    if (!data || typeof data !== "object" || !("payload" in data) || !("signature" in data)
      || typeof data.payload !== "string" || typeof data.signature !== "string" || !/^[A-Za-z0-9_-]{86}$/u.test(data.signature)) return null;
    return { payload: data.payload, signature: Buffer.from(data.signature, "base64url") };
  } };
}

export function readPartnerAlertStripeRetentionReview(binding: StripeRetentionBinding) {
  if (binding.reviewerKey.type !== "public" || binding.reviewerKey.asymmetricKeyType !== "ed25519") {
    throw new Error("Stripe retention authority unavailable.");
  }
  const review = binding.readSignedReview();
  if (!review || review.payload.length > 2048 || review.signature.length !== 64
    || !verify(null, Buffer.from(review.payload), binding.reviewerKey, review.signature)) {
    throw new Error("Stripe retention review unavailable.");
  }
  const fields: unknown = JSON.parse(review.payload);
  if (!Array.isArray(fields) || fields.length !== 9) throw new Error("Stripe retention review format changed.");
  const profileRef = fields[7];
  if (typeof profileRef !== "string" || !/^[A-Za-z0-9_:-]{1,160}$/u.test(profileRef)) {
    throw new Error("Stripe retention review profile is invalid.");
  }
  const validUntilUtc = partnerAlertUtc(fields[8], "stripeRetentionReviewExpiry");
  return { profileRef, validUntilUtc, payload: review.payload };
}

/** Dedicated writer for expired, unmatched event references. It does not
 * borrow a user admission or allow a caller to replace the cleanup operation. */
export function expireReviewedPartnerAlertStripeEvents(db: Database.Database, core: PlatformErasureAdmission,
  binding: StripeRetentionBinding): number {
  if (db.inTransaction || db.pragma("foreign_keys", { simple: true }) !== 1) {
    throw new Error("Stripe retention authority unavailable.");
  }
  const { profileRef, validUntilUtc, payload } = readPartnerAlertStripeRetentionReview(binding);
  core.qualifyAdditionalStatements(platformPaidStripeConnectBillingMigration.statements);
  const receipt = core.qualificationReceipt();
  const migrateLedger = () => createHash("sha256").update(JSON.stringify(readAppliedPlatformMigrations(db))).digest("hex");
  const migrationLedgerSha256 = migrateLedger();
  if (payload !== encodePartnerAlertStripeRetentionReview({ schemaSha256: receipt.schemaSha256,
    profileCatalogSha256: receipt.profileCatalogSha256, migrationLedgerSha256, profileRef, validUntilUtc })) {
    throw new Error("Stripe retention review scope changed.");
  }

  return db.transaction(() => {
    core.assertQualificationReceipt(db, receipt);
    const nowUtc = core.now();
    const profile = core.profile(profileRef);
    if (validUntilUtc <= nowUtc || validUntilUtc > profile.valid_until_utc || migrateLedger() !== migrationLedgerSha256) {
      throw new Error("Stripe retention review expired or exceeds its approved profile.");
    }
    return expirePartnerAlertStripeUnboundEvents(db, Date.parse(nowUtc));
  }).immediate();
}
