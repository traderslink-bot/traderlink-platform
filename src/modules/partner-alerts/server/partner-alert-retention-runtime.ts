import "server-only";

import { openPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { PARTNER_ALERT_SCHEMA_STATEMENTS } from "./database/partner-alert-schema";
import { PARTNER_ALERT_WHOP_EVIDENCE_STATEMENTS } from "./database/partner-alert-whop-evidence-schema";
import { bindPartnerAlertErasureRuntime } from "./partner-alert-erasure-runtime";
import { PartnerAlertRetentionHoldRepository } from "./partner-alert-retention-holds";
import { readPartnerAlertStripeErasureWorkerInputs } from "./partner-alert-stripe-erasure-worker-input";
import { expireReviewedPartnerAlertStripeEvents, readConfiguredPartnerAlertStripeRetentionBinding, readPartnerAlertStripeRetentionReview } from "./partner-alert-stripe-retention";
import { PartnerAlertTextRetention, startPartnerAlertTextRetention } from "./partner-alert-text-retention";
import { purgeExpiredPartnerAlertWhopEvidence } from "./partner-alert-whop-evidence-retention";

const slot = Symbol.for("traderlink.partner-alert.retention");
const state = globalThis as typeof globalThis & { [slot]?: () => void };

function readRetentionHoldKeys(encoded: string | undefined) {
  if (!encoded) return [];
  const values: unknown = JSON.parse(encoded);
  if (!Array.isArray(values) || values.length > 32) throw new Error("Partner retention hold keys are invalid.");
  return values.map((item: { keyRef?: unknown; key?: unknown } | null) => {
    if (!item || typeof item.keyRef !== "string" || typeof item.key !== "string" || !/^[A-Za-z0-9_-]{43}$/u.test(item.key)) {
      throw new Error("Partner retention hold key is invalid.");
    }
    const key = Buffer.from(item.key, "base64url");
    if (key.length !== 32 || key.toString("base64url") !== item.key) throw new Error("Partner retention hold key is invalid.");
    return { keyRef: item.keyRef, key };
  });
}

/** Called by hosted bootstrap after restore verification and database readiness.
 * Reuse the signed erasure binding for historical text and require a current
 * review for Stripe's separate unmatched-event sweep. */
export function startConfiguredPartnerAlertRetention(verifiedDatabasePath: string | undefined): (() => void) | null {
  const environment = process.env;
  if (environment.PARTNER_ALERT_LIFECYCLE_ENABLED !== "true") return null;
  const binding = readConfiguredPartnerAlertStripeRetentionBinding(environment);
  if (!binding) return null;
  if (!verifiedDatabasePath || verifiedDatabasePath !== environment.TRADERLINK_PLATFORM_DB_PATH) {
    throw new Error("Partner retention database scope changed.");
  }
  if (state[slot]) return state[slot];
  const db = openPlatformDatabase({ mode: "runtime", databasePath: verifiedDatabasePath, environment });
  try {
    const reviewed = readPartnerAlertStripeErasureWorkerInputs(db, environment);
    if (!reviewed) throw new Error("Partner retention requires the reviewed erasure binding.");
    const core = PlatformErasureAdmission.bind(db, { nowUtc: reviewed.nowUtc, maximumAdmissionMs: 30_000,
      profileCatalogSha256: reviewed.profileCatalogSha256, participantStatements: [...PARTNER_ALERT_SCHEMA_STATEMENTS,
        ...PARTNER_ALERT_WHOP_EVIDENCE_STATEMENTS] });
    bindPartnerAlertErasureRuntime(db, reviewed.erasureRuntime);

    const profileRef = readPartnerAlertStripeRetentionReview(binding).profileRef;
    const profile = core.profile(profileRef);
    const holdKeys = readRetentionHoldKeys(environment.PARTNER_ALERT_RETENTION_HOLD_KEYS_JSON);
    const holds = holdKeys.length ? new PartnerAlertRetentionHoldRepository(db, holdKeys) : null;
    const retention = new PartnerAlertTextRetention(db, core, { profileRef, retentionPolicyRef: profile.retention_policy_ref,
      backupPolicyRef: profile.backup_policy_ref,
      assertRestoreTombstonesApplied: () => {
        if (environment.TRADERLINK_PLATFORM_DB_PATH !== verifiedDatabasePath) throw new Error("Partner retention database scope changed.");
      },
      hasActiveRetentionHold: message => holds?.hasActive(message) ?? false,
    });
    expireReviewedPartnerAlertStripeEvents(db, core, binding);
    let started = false;
    const stop = startPartnerAlertTextRetention({ redactPage: (cursor, pending) => {
      if (started) {
        try { expireReviewedPartnerAlertStripeEvents(db, core, binding); }
        catch { console.error("Partner Channel Stripe event retention did not complete."); }
      }
      const result = retention.redactPage(cursor, pending);
      purgeExpiredPartnerAlertWhopEvidence(db, core.now());
      return result;
    } }, () => console.error("Partner Channel retention did not complete."));
    started = true;
    const close = () => {
      if (state[slot] !== close) return;
      delete state[slot];
      stop();
      db.close();
    };
    state[slot] = close;
    return close;
  } catch (error) {
    db.close();
    throw error;
  }
}
