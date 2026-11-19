import { createHmac } from "node:crypto";
import { partnerAlertId, partnerAlertInteger, partnerAlertRef, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { PARTNER_ALERT_BACKUP_DISPOSITION_HOLD, parsePartnerAlertBackupExposure,
  type PartnerAlertHeldBackupExposure } from "./partner-alert-backup-exposure";

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

type TombstoneIdentity = Readonly<{
  tombstoneRef: string;
  lifecycleRef: string;
  subjectBindingHmacSha256: string;
  bindingKeyRef: string;
  erasedAtUtc: string;
  sourceOperationRef: string;
}>;
export type PartnerAlertFiniteErasureTombstone = TombstoneIdentity & Readonly<{
  version?: 1; lastAffectedBackupExpiresAtUtc: string; retainUntilUtc: string;
}>;
export type PartnerAlertHeldErasureTombstone = TombstoneIdentity & Readonly<{
  version: 2; backupExposure: PartnerAlertHeldBackupExposure;
  retention: Readonly<{ kind: "until_confirmed_disposition" }>;
}>;
export type PartnerAlertErasureTombstone = PartnerAlertFiniteErasureTombstone | PartnerAlertHeldErasureTombstone;

export function matchesPartnerAlertTombstoneSubject(
  tombstone: PartnerAlertErasureTombstone,
  userId: string,
  binding: BindingKey,
): boolean {
  const checked = checkedKey(binding);
  if (checked.keyRef !== tombstone.bindingKeyRef) return false;
  return hmac(`subject\u0000${partnerAlertId(userId,"userId")}`,checked.key) === tombstone.subjectBindingHmacSha256;
}

type CreateIdentity = Readonly<{
  tombstoneRef: string;
  lifecycleRef: string;
  userId: string;
  sourceOperationRef: string;
  erasedAtUtc: string;
  binding: BindingKey;
}>;
type CreateFinite = CreateIdentity & Readonly<{lastAffectedBackupCreatedAtUtc:string;lastAffectedBackupExpiresAtUtc:string}>;
type CreateHeld = CreateIdentity & Readonly<{backupExposure:PartnerAlertHeldBackupExposure}>;
export function createPartnerAlertErasureTombstone(input: CreateFinite): PartnerAlertFiniteErasureTombstone;
export function createPartnerAlertErasureTombstone(input: CreateHeld): PartnerAlertHeldErasureTombstone;
export function createPartnerAlertErasureTombstone(input: CreateFinite | CreateHeld): PartnerAlertErasureTombstone {
  const erasedAtUtc = partnerAlertUtc(input.erasedAtUtc, "erasedAtUtc");
  const binding = checkedKey(input.binding);
  const identity = { tombstoneRef: partnerAlertId(input.tombstoneRef, "tombstoneRef"),
    lifecycleRef: partnerAlertId(input.lifecycleRef, "lifecycleRef"),
    subjectBindingHmacSha256: hmac(`subject\u0000${partnerAlertId(input.userId, "userId")}`, binding.key),
    bindingKeyRef: binding.keyRef, erasedAtUtc, sourceOperationRef: partnerAlertId(input.sourceOperationRef, "sourceOperationRef") };
  if ("backupExposure" in input) {
    const exposure = parsePartnerAlertBackupExposure(input.backupExposure);
    if (exposure.kind !== "until_confirmed_disposition" || exposure.createdAtUtc > erasedAtUtc || exposure.observedAtUtc > erasedAtUtc) {
      throw new Error("partner_alert_tombstone_exposure_horizon");
    }
    return Object.freeze({ ...identity, version: 2, backupExposure: exposure,
      retention: Object.freeze({ kind: "until_confirmed_disposition" }) });
  }
  const backupCreatedAt = partnerAlertUtc(input.lastAffectedBackupCreatedAtUtc, "lastAffectedBackupCreatedAtUtc");
  if (backupCreatedAt > erasedAtUtc) throw new Error("partner_alert_tombstone_backup_after_erasure");
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

/** V2 has no finite-date fields. The SQL codec is an explicit reserved tag;
 * restoring or releasing a pin always consults its authenticated ledger body. */
export function validatePartnerAlertErasureTombstone(value: PartnerAlertErasureTombstone): void {
  if (!value || typeof value !== "object") throw Error("partner_alert_tombstone_invalid");
  partnerAlertId(value.tombstoneRef, "tombstoneRef"); partnerAlertId(value.lifecycleRef, "lifecycleRef");
  partnerAlertId(value.sourceOperationRef, "sourceOperationRef"); partnerAlertRef(value.bindingKeyRef, "bindingKeyRef");
  partnerAlertUtc(value.erasedAtUtc, "erasedAtUtc");
  if (!/^[a-f0-9]{64}$/u.test(value.subjectBindingHmacSha256)) throw Error("partner_alert_tombstone_invalid");
  if (value.version === 2) {
    const expected = ["version","tombstoneRef","lifecycleRef","subjectBindingHmacSha256","bindingKeyRef","erasedAtUtc","sourceOperationRef","backupExposure","retention"].sort();
    if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify(expected)
      || !value.retention || value.retention.kind !== "until_confirmed_disposition" || Object.keys(value.retention).length !== 1) {
      throw Error("partner_alert_tombstone_invalid");
    }
    const exposure = parsePartnerAlertBackupExposure(value.backupExposure);
    if (exposure.kind !== "until_confirmed_disposition" || exposure.createdAtUtc > value.erasedAtUtc
      || exposure.observedAtUtc > value.erasedAtUtc) throw Error("partner_alert_tombstone_invalid");
  } else {
    if (value.version !== undefined && value.version !== 1) throw Error("partner_alert_tombstone_version");
    if ("backupExposure" in value || "retention" in value) throw Error("partner_alert_tombstone_version");
    const end = partnerAlertUtc(value.lastAffectedBackupExpiresAtUtc, "backupExpiresAtUtc");
    const retain = partnerAlertUtc(value.retainUntilUtc, "retainUntilUtc");
    if (retain < end || retain < value.erasedAtUtc) throw Error("partner_alert_tombstone_invalid");
  }
}
export function isPartnerAlertTombstoneActive(value: PartnerAlertErasureTombstone, atUtc: string): boolean {
  validatePartnerAlertErasureTombstone(value);
  const at = partnerAlertUtc(atUtc, "restoreAtUtc");
  if (value.erasedAtUtc > at) throw Error("partner_alert_tombstone_future");
  return value.version === 2 || value.retainUntilUtc > at;
}
export function partnerAlertTombstoneStorage(value: PartnerAlertErasureTombstone): Readonly<{backupHorizon:string;retainUntil:string}> {
  validatePartnerAlertErasureTombstone(value);
  return value.version === 2
    ? {backupHorizon:PARTNER_ALERT_BACKUP_DISPOSITION_HOLD,retainUntil:PARTNER_ALERT_BACKUP_DISPOSITION_HOLD}
    : {backupHorizon:value.lastAffectedBackupExpiresAtUtc,retainUntil:value.retainUntilUtc};
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
  const active = input.tombstones.filter(row => isPartnerAlertTombstoneActive(row, at));
  const required = [...new Set(active.map(row => partnerAlertRef(row.bindingKeyRef, "bindingKeyRef")))].sort();
  const available = [...new Set(input.availableKeyRefs.map(ref => partnerAlertRef(ref, "availableKeyRef")))].sort();
  if (required.some(ref => !available.includes(ref))) throw new Error("partner_alert_restore_key_coverage");
  return Object.freeze({ ledgerGeneration, ledgerSha256: input.ledgerSha256,
    bindingKeyringSha256: input.bindingKeyringSha256, requiredKeyRefs: Object.freeze(required),
    activeTombstones: Object.freeze(active) });
}
