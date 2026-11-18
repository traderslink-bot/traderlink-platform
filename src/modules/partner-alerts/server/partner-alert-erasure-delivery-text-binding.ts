import { createHash, timingSafeEqual } from "node:crypto";
import type Database from "better-sqlite3";
import { erasureHold } from "../../platform/server/privacy/platform-erasure-admission";
import { readPlatformErasureTextBinding } from "../../platform/server/privacy/platform-erasure-text-sweep";

type Claim = Readonly<{ participant: string; claim_ref: string; original_json: string;
  original_sha256: string; state: string; outcome_ref?: string | null }>;
type Key = Readonly<{ keyRef: string; key: Uint8Array }>;

/** Pre-0204 raw records remain readable. A projected record always requires
 * Core's signed successor; a missing table is never proof of projection. */
export function readPartnerDeliveryTextBinding(
  db: Database.Database, key: Key | null, operation: string, claim: Claim,
) {
  if ((claim.participant === "partner_delivery" || claim.participant === "partner_delivery_outcome")
    && db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_erasure_text_successors'").get()) {
    if (!key) return erasureHold();
    try {
      return readPlatformErasureTextBinding(db, { ref: key.keyRef, bytes: key.key }, {
        operation_ref: operation, participant: claim.participant, claim_ref: claim.claim_ref,
        original_json: claim.original_json, original_sha256: claim.original_sha256,
        state: claim.state, outcome_ref: claim.outcome_ref ?? null,
      });
    } catch { return erasureHold(); }
  }
  const actual = createHash("sha256").update(claim.original_json).digest();
  if (!/^[a-f0-9]{64}$/.test(claim.original_sha256)
    || !timingSafeEqual(actual, Buffer.from(claim.original_sha256, "hex"))) return erasureHold();
  return null;
}

/** Metadata only, including an older outcome embedded in a delivery snapshot. */
export function partnerDeliveryMetadata(row: Readonly<Record<string, unknown>>) {
  const copy = { ...row };
  delete copy.text_content;
  if (typeof copy.outcome_json === "string") {
    const receipt = JSON.parse(copy.outcome_json) as Record<string, unknown>;
    if (receipt.job && typeof receipt.job === "object" && !Array.isArray(receipt.job)) {
      const job = { ...(receipt.job as Record<string, unknown>) };
      delete job.text_content;
      copy.outcome_json = JSON.stringify({ ...receipt, job });
    }
  }
  return copy;
}
