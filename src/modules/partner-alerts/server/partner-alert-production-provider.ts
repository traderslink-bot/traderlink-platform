import "server-only";

import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { openReadonlyPlatformDatabase } from "../../platform/server/database/open-readonly-platform-database";
import { parsePartnerAlertOffer, partnerAlertRef, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { createPartnerAlertWhopOfferVerifier } from "./partner-alert-whop-provider-verification";
import { readPartnerAlertWhopCredentialConfiguration } from "./partner-alert-catalog-runtime-configuration";
import { fingerprintPartnerAlertWhopSigningKey } from "./partner-alert-whop-webhook";
import { PARTNER_ALERT_WHOP_API_VERSION, type PartnerAlertWhopTransport } from "./partner-alert-whop-client";
import { startReviewedPartnerAlertNativeProvider, type PartnerAlertNativeProvider } from "./partner-alert-native-runtime";

type Review = Readonly<{
  // The trusted reader verifies detached review evidence before returning this.
  scope: PartnerAlertNativeProvider["maintenance"]["scope"];
  profileCatalogSha256: string;
  credentialEnvelopeSha256: string;
  reviewedOffersSha256: string;
  webhookSigningKeySha256: string;
  coverageQualificationRef: string;
  ledger: Readonly<{ generation: number; sha256: string }>;
  validUntilUtc: string;
}>;

export type PartnerAlertProductionProviderInputs = Readonly<{
  readVerifiedReview: () => Review | null;
  /** Created by the qualified native coverage producer. No generic decoder
   * or env-based adapter loading can satisfy this server-owned capability. */
  provider: PartnerAlertNativeProvider;
  coverageQualificationRef: string;
  transport: PartnerAlertWhopTransport;
  environment?: NodeJS.ProcessEnv;
}>;

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const hex = /^[0-9a-f]{64}$/u;
const unavailable = () => new Error("Partner Channel native provider qualification is unavailable.");

/** Admission preflight. Provider calls are the existing bounded GET-only
 * offer verifier, outside transactions. Publish only after checked startup. */
export async function installPartnerAlertProductionProvider(input: PartnerAlertProductionProviderInputs): Promise<(() => Promise<void>) | null> {
  const env = input.environment ?? process.env;
  if (env.NODE_ENV !== "production" || env.PARTNER_ALERT_LIFECYCLE_ENABLED !== "true") return null;
  const { provider } = input;
  const maintenance = { ...provider.maintenance, scope: Object.freeze({ ...provider.maintenance.scope }) };
  const { scope, erasureRuntime, databasePath } = maintenance;
  const reviewed = input.readVerifiedReview();
  if (!reviewed) return null;
  const review = structuredClone(reviewed);
  const now = () => partnerAlertUtc(erasureRuntime.nowUtc(), "nowUtc");
  const expiry = partnerAlertUtc(review.validUntilUtc, "providerReviewExpiry");
  const qualification = partnerAlertRef(input.coverageQualificationRef, "coverageQualificationRef");
  const keyEncoding = env.PARTNER_ALERT_WHOP_WEBHOOK_KEY_ENCODING;
  const signingSecret = env.PARTNER_ALERT_WHOP_WEBHOOK_SECRET;
  if (scope.environment !== "live" || scope.apiVersionDate !== PARTNER_ALERT_WHOP_API_VERSION
    || review.scope.apiVersionDate !== scope.apiVersionDate || scope.communityId !== review.scope.communityId
    || scope.environment !== review.scope.environment || scope.accountId !== review.scope.accountId
    || expiry <= now() || qualification !== review.coverageQualificationRef
    || maintenance.profileCatalogSha256 !== review.profileCatalogSha256
    || env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256 !== review.profileCatalogSha256
    || env.TRADERLINK_PLATFORM_DB_PATH !== databasePath || env.PARTNER_ALERT_REQUEST_RUNTIME_ENABLED !== "true"
    || env.PARTNER_ALERT_WHOP_WEBHOOK_ENABLED !== "true" || env.PARTNER_ALERT_WHOP_WEBHOOK_COMMUNITY_ID !== scope.communityId
    || env.PARTNER_ALERT_WHOP_WEBHOOK_ENVIRONMENT !== scope.environment || env.PARTNER_ALERT_WHOP_WEBHOOK_ACCOUNT_ID !== scope.accountId
    || ![review.profileCatalogSha256, review.credentialEnvelopeSha256, review.reviewedOffersSha256,
      review.webhookSigningKeySha256, review.ledger.sha256].every(pin => hex.test(pin))
    || !Number.isSafeInteger(review.ledger.generation) || review.ledger.generation < 0
    || !signingSecret || (keyEncoding !== "raw_utf8" && keyEncoding !== "base64_after_prefix")
    || fingerprintPartnerAlertWhopSigningKey({ secret: signingSecret, encoding: keyEncoding }) !== review.webhookSigningKeySha256) {
    throw unavailable();
  }
  const configuration = readPartnerAlertWhopCredentialConfiguration(env);
  if (!configuration) throw unavailable();
  const assertLedger = () => {
    const ledger = erasureRuntime.tombstoneLedger.read();
    if (expiry <= now() || ledger.generation !== review.ledger.generation
      || ledger.sha256 !== review.ledger.sha256 || ledger.unresolvedPrepared.length) throw unavailable();
  };
  maintenance.assertRestoreStartupVerified();
  assertLedger();

  const readReviewedOfferRows = (db: Database.Database) => {
    const at = now();
    const credential = db.prepare(`SELECT encrypted_authorisation_json FROM partner_alert_whop_connections
      WHERE community_id=? AND environment=? AND whop_account_id=? AND status='verified'
        AND verified_at_utc<=? AND valid_until_utc>?`)
      .pluck().get(scope.communityId, scope.environment, scope.accountId, at, at);
    const offers = db.prepare(`SELECT offer_json FROM partner_alert_offers WHERE community_id=?
      AND whop_environment=? AND whop_account_id=? AND review_state='approved'
      ORDER BY offer_id,version LIMIT 101`)
      .pluck().all(scope.communityId, scope.environment, scope.accountId);
    if (typeof credential !== "string" || sha(credential) !== review.credentialEnvelopeSha256
      || !offers.length || offers.length > 100 || sha(JSON.stringify(offers)) !== review.reviewedOffersSha256) throw unavailable();
    return offers;
  };
  const current = (db: Database.Database) => {
    try {
      return expiry > now() && env.PARTNER_ALERT_WHOP_WEBHOOK_ENABLED === "true"
        && env.PARTNER_ALERT_WHOP_WEBHOOK_SECRET === signingSecret && env.PARTNER_ALERT_WHOP_WEBHOOK_KEY_ENCODING === keyEncoding
        && env.PARTNER_ALERT_WHOP_WEBHOOK_COMMUNITY_ID === scope.communityId
        && env.PARTNER_ALERT_WHOP_WEBHOOK_ACCOUNT_ID === scope.accountId
        && env.PARTNER_ALERT_WHOP_WEBHOOK_ENVIRONMENT === scope.environment
        && readReviewedOfferRows(db).length > 0;
    } catch { return false; }
  };
  const database = openReadonlyPlatformDatabase({ databasePath, environment: env });
  try {
    const offers = readReviewedOfferRows(database).map(json => parsePartnerAlertOffer(JSON.parse(String(json))));
    const verifyOffer = createPartnerAlertWhopOfferVerifier({ database, credentialKeys: configuration.credentialKeys,
      transport: input.transport, nowUtc: now, maximumEvidenceAgeMs: configuration.maximumEvidenceAgeMs });
    const deadline = AbortSignal.timeout(12_000);
    for (const offer of offers) {
      if (deadline.aborted || expiry <= now()) throw unavailable();
      await verifyOffer({ communityId: scope.communityId, offer }, deadline);
    }
    if (deadline.aborted) throw unavailable();
    if (!current(database)) throw unavailable();
    assertLedger();

    const reviewedOffer = (offerId: string, version: number) =>
      offers.some(offer => offer.offerId === offerId && offer.version === version);
    const qualifiedProvider: PartnerAlertNativeProvider = {
      bindSubscriber: (db, core, target) => {
        if (target.communityId !== scope.communityId || !reviewedOffer(target.offerId, target.offerVersion) || !current(db)) return null;
        const binding = provider.bindSubscriber(db, core, target);
        if (binding?.receipt.qualification.qualificationRef !== qualification) return null;
        return { ...binding, receipt: { ...binding.receipt,
          readCurrentGenerations: (ticket, offer) => current(db)
            ? binding.receipt.readCurrentGenerations(ticket, offer) : null,
        } };
      },
      maintenance: { ...maintenance, bindProvider: (db, core) => {
        if (!current(db)) throw unavailable();
        const bound = maintenance.bindProvider(db, core);
        return { ...bound, prepare: async claim => {
          if (!current(db)) throw unavailable();
          return bound.prepare(claim);
        }, roles: { runOnce: () => current(db) ? bound.roles.runOnce() : Promise.resolve(false) }, authority: {
          recheckCurrent: (connection, request) => current(connection) && request.preparation.context
            && reviewedOffer(request.preparation.context.offerId, request.preparation.context.offerVersion)
            ? bound.authority.recheckCurrent(connection, request) : { kind: "unbound" },
          qualifyCoverage: preparation => {
            if (!current(db)) return null;
            const result = bound.authority.qualifyCoverage(preparation);
            if (result?.qualificationRef !== qualification) return null;
            return { ...result, validUntilUtc: [result.validUntilUtc, expiry].sort()[0]! };
          },
        } };
      } },
    };
    return startReviewedPartnerAlertNativeProvider(qualifiedProvider);
  } finally { database.close(); }
}
