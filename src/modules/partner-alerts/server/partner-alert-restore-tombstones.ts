import { createHmac } from "node:crypto";
import { partnerAlertId, partnerAlertInteger, partnerAlertRef, partnerAlertUtc } from "../contracts/partner-alert-validation";

type BindingKey = Readonly<{ keyRef: string; key: Uint8Array }>;

function checkedKey(input: BindingKey): BindingKey {
  const keyRef = partnerAlertRef(input.keyRef, "tombstoneBindingKeyRef");
  if (!(input.key instanceof Uint8Array) || input.key.byteLength < 32 || input.key.byteLength > 128) {
    throw new Error("partner_alert_tombstone_binding_key");
  }
  return Object.freeze({ keyRef, key: input.key });
}

function hmac(value: string, key: Uint8Array): string {
  return createHmac("sha256", key).update(value, "utf8").digest("hex");
}

export type PartnerAlertErasureTombstone = Readonly<{
  tombstoneRef: string;
  lifecycleRef: string;
  subjectBindingHmacSha256: string;
  bindingKeyRef: string;
  erasedAtUtc: string;
  lastAffectedBackupExpiresAtUtc: string;
  retainUntilUtc: string;
  sourceOperationRef: string;
}>;

export function matchesPartnerAlertTombstoneSubject(
  tombstone: PartnerAlertErasureTombstone,
  userId: string,
  binding: BindingKey,
): boolean {
  const checked = checkedKey(binding);
  if (checked.keyRef !== tombstone.bindingKeyRef) return false;
  return hmac(`subject\u0000${partnerAlertId(userId,"userId")}`,checked.key) === tombstone.subjectBindingHmacSha256;
}

export function createPartnerAlertErasureTombstone(input: Readonly<{
  tombstoneRef: string;
  lifecycleRef: string;
  userId: string;
  sourceOperationRef: string;
  erasedAtUtc: string;
  lastAffectedBackupCreatedAtUtc: string;
  lastAffectedBackupExpiresAtUtc: string;
  binding: BindingKey;
}>): PartnerAlertErasureTombstone {
  const erasedAtUtc = partnerAlertUtc(input.erasedAtUtc, "erasedAtUtc");
  const backupCreatedAt = partnerAlertUtc(input.lastAffectedBackupCreatedAtUtc, "lastAffectedBackupCreatedAtUtc");
  if (backupCreatedAt > erasedAtUtc) throw new Error("partner_alert_tombstone_backup_after_erasure");
  const binding = checkedKey(input.binding);
  const lastAffectedBackupExpiresAtUtc = partnerAlertUtc(input.lastAffectedBackupExpiresAtUtc, "lastAffectedBackupExpiresAtUtc");
  if (lastAffectedBackupExpiresAtUtc < erasedAtUtc || lastAffectedBackupExpiresAtUtc < backupCreatedAt) {
    throw new Error("partner_alert_tombstone_exposure_horizon");
  }
  // Actual externally tracked exposure, not a feature-defined backup rotation.
  const retainUntilUtc = lastAffectedBackupExpiresAtUtc;
  return Object.freeze({
    tombstoneRef: partnerAlertId(input.tombstoneRef, "tombstoneRef"),
    lifecycleRef: partnerAlertId(input.lifecycleRef, "lifecycleRef"),
    subjectBindingHmacSha256: hmac(`subject\u0000${partnerAlertId(input.userId, "userId")}`, binding.key),
    bindingKeyRef: binding.keyRef,
    erasedAtUtc,
    lastAffectedBackupExpiresAtUtc,
    retainUntilUtc,
    sourceOperationRef: partnerAlertId(input.sourceOperationRef, "sourceOperationRef"),
  });
}

export type PartnerAlertRestoreQualification = Readonly<{
  ledgerGeneration: number;
  ledgerSha256: string;
  bindingKeyringSha256: string;
  requiredKeyRefs: readonly string[];
  activeTombstones: readonly PartnerAlertErasureTombstone[];
}>;

/** Validates the exact external ledger generation and every active historical
 * binding key before a restore attempt may delete resurrected principals. */
export function qualifyPartnerAlertRestore(input: Readonly<{
  atUtc: string;
  ledgerGeneration: number;
  ledgerSha256: string;
  bindingKeyringSha256: string;
  availableKeyRefs: readonly string[];
  tombstones: readonly PartnerAlertErasureTombstone[];
}>): PartnerAlertRestoreQualification {
  const at = partnerAlertUtc(input.atUtc, "restoreAtUtc");
  const ledgerGeneration = partnerAlertInteger(input.ledgerGeneration, "ledgerGeneration", 1);
  if (!/^[0-9a-f]{64}$/u.test(input.ledgerSha256) || !/^[0-9a-f]{64}$/u.test(input.bindingKeyringSha256)) {
    throw new Error("partner_alert_restore_digest");
  }
  if (input.tombstones.length > 100_000) throw new Error("partner_alert_restore_tombstone_limit");
  const active = input.tombstones.filter(row => row.retainUntilUtc > at);
  const required = [...new Set(active.map(row => partnerAlertRef(row.bindingKeyRef, "bindingKeyRef")))].sort();
  const available = [...new Set(input.availableKeyRefs.map(ref => partnerAlertRef(ref, "availableKeyRef")))].sort();
  if (required.some(ref => !available.includes(ref))) throw new Error("partner_alert_restore_key_coverage");
  return Object.freeze({ ledgerGeneration, ledgerSha256: input.ledgerSha256,
    bindingKeyringSha256: input.bindingKeyringSha256, requiredKeyRefs: Object.freeze(required),
    activeTombstones: Object.freeze(active) });
}
