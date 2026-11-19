import { partnerAlertId, partnerAlertRef, partnerAlertUtc } from "../contracts/partner-alert-validation";

/** An opaque V2 storage tag, never an ISO timestamp or a fabricated expiry. */
export const PARTNER_ALERT_BACKUP_DISPOSITION_HOLD = "until_confirmed_disposition:v2" as const;

export type PartnerAlertFiniteBackupExposure = Readonly<{
  kind: "finite"; createdAtUtc: string; expiresAtUtc: string;
}>;
export type PartnerAlertHeldBackupExposure = Readonly<{
  kind: "until_confirmed_disposition"; createdAtUtc: string; observedAtUtc: string;
  inventoryRef: string; inventorySha256: string; recoveryPointRefs: readonly string[];
}>;
export type PartnerAlertBackupExposure = PartnerAlertFiniteBackupExposure | PartnerAlertHeldBackupExposure;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("partner_backup_exposure_invalid");
  return value as Record<string, unknown>;
}
function exactKeys(value: Record<string, unknown>, names: readonly string[]): void {
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...names].sort())) throw Error("partner_backup_exposure_invalid");
}
export function partnerAlertRecoveryPointRefs(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 1000) throw Error("partner_backup_points_invalid");
  const refs = value.map(item => partnerAlertId(item, "recoveryPointRef"));
  if (new Set(refs).size !== refs.length || refs.some((ref, index) => index > 0 && ref <= refs[index - 1]!)) {
    throw Error("partner_backup_points_invalid");
  }
  return Object.freeze(refs);
}

/** Only the signed inventory reader supplies new runtime exposure. Persisted
 * held evidence remains meaningful after the inventory's authorization expires. */
export function parsePartnerAlertBackupExposure(value: unknown): PartnerAlertBackupExposure {
  const input = record(value), createdAtUtc = partnerAlertUtc(input.createdAtUtc, "backupCreatedAtUtc");
  if (input.kind === "finite") {
    exactKeys(input, ["kind", "createdAtUtc", "expiresAtUtc"]);
    const expiresAtUtc = partnerAlertUtc(input.expiresAtUtc, "backupExpiresAtUtc");
    if (expiresAtUtc < createdAtUtc) throw Error("partner_backup_exposure_invalid");
    return Object.freeze({ kind: "finite", createdAtUtc, expiresAtUtc });
  }
  if (input.kind !== "until_confirmed_disposition") throw Error("partner_backup_exposure_version");
  exactKeys(input, ["kind", "createdAtUtc", "observedAtUtc", "inventoryRef", "inventorySha256", "recoveryPointRefs"]);
  const observedAtUtc = partnerAlertUtc(input.observedAtUtc, "backupObservedAtUtc");
  if (createdAtUtc > observedAtUtc || typeof input.inventorySha256 !== "string" || !/^[a-f0-9]{64}$/u.test(input.inventorySha256)) {
    throw Error("partner_backup_exposure_invalid");
  }
  return Object.freeze({ kind: "until_confirmed_disposition", createdAtUtc, observedAtUtc,
    inventoryRef: partnerAlertRef(input.inventoryRef, "backupInventoryRef"), inventorySha256: input.inventorySha256,
    recoveryPointRefs: partnerAlertRecoveryPointRefs(input.recoveryPointRefs) });
}

export function readPartnerAlertBackupExposure(runtime: Readonly<{
  readBackupExposure?: () => PartnerAlertBackupExposure;
  lastAffectedBackupCreatedAtUtc: () => string; lastAffectedBackupExpiresAtUtc: () => string;
}>): PartnerAlertBackupExposure {
  return parsePartnerAlertBackupExposure(runtime.readBackupExposure ? runtime.readBackupExposure() : {
    kind: "finite", createdAtUtc: runtime.lastAffectedBackupCreatedAtUtc(), expiresAtUtc: runtime.lastAffectedBackupExpiresAtUtc(),
  });
}

/** A captured pin is never released because a later inventory omits it. */
export function partnerAlertBackupExposureCovers(captured: PartnerAlertBackupExposure, current: PartnerAlertBackupExposure): boolean {
  if (captured.kind === "until_confirmed_disposition") {
    return current.kind === "finite" || current.inventoryRef === captured.inventoryRef
      && current.recoveryPointRefs.every(ref => captured.recoveryPointRefs.includes(ref));
  }
  return current.kind === "finite" && captured.expiresAtUtc >= current.expiresAtUtc;
}
