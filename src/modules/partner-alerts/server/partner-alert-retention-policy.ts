import type Database from "better-sqlite3";
import { purgePartnerAlertWhopEvidence } from "./partner-alert-whop-evidence-retention";

const DAY_MS = 86_400_000;

export const PARTNER_ALERT_RETENTION_POLICY = Object.freeze({
  settledMessageTextDays: 7,
  rejectedModerationTextDays: 7,
  pseudonymizedAuditAndIdempotencyYears: 2,
  agreementPaymentRefundDisputeYears: 7,
  credentialsAfterDisconnect: "remove_immediately" as const,
  restoreRequiresErasureTombstoneReplay: true as const,
});

export type PartnerAlertMessageRetentionClass = "settled" | "rejected_moderation";
export type PartnerAlertRecordRetentionClass =
  | "pseudonymized_audit_or_idempotency"
  | "agreement_payment_refund_or_dispute";

export function partnerAlertMessageRetentionClassForState(
  state: "allowed" | "held" | "deleted",
): PartnerAlertMessageRetentionClass {
  return state === "held" ? "rejected_moderation" : "settled";
}

export function partnerAlertInitialMessageTextRetainUntil(
  state: "allowed" | "held" | "deleted",
  observedAtUtc: string,
): string {
  return partnerAlertMessageTextRetainUntil(partnerAlertMessageRetentionClassForState(state), observedAtUtc);
}

function exactUtc(value: string, field: string): Date {
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    throw new Error(`partner_alert_retention_invalid_${field}`);
  }
  return new Date(epoch);
}

function addDays(value: string, days: number): string {
  return new Date(exactUtc(value, "utc").getTime() + days * DAY_MS).toISOString();
}

/** Calendar-year retention preserves the UTC month/day/time anniversary and
 * clamps February 29 to February 28 when the target year is not a leap year. */
function addUtcYears(value: string, years: number): string {
  const source = exactUtc(value, "utc");
  const targetYear = source.getUTCFullYear() + years;
  const month = source.getUTCMonth();
  const day = source.getUTCDate();
  const target = new Date(Date.UTC(targetYear, month, 1, source.getUTCHours(), source.getUTCMinutes(),
    source.getUTCSeconds(), source.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString();
}

export function partnerAlertMessageTextRetainUntil(
  classification: PartnerAlertMessageRetentionClass,
  firstReceivedAtUtc: string,
): string {
  return addDays(firstReceivedAtUtc, classification === "settled"
    ? PARTNER_ALERT_RETENTION_POLICY.settledMessageTextDays
    : PARTNER_ALERT_RETENTION_POLICY.rejectedModerationTextDays);
}

export function partnerAlertRecordRetainUntil(
  classification: PartnerAlertRecordRetentionClass,
  createdAtUtc: string,
): string {
  return addUtcYears(createdAtUtc, classification === "pseudonymized_audit_or_idempotency"
    ? PARTNER_ALERT_RETENTION_POLICY.pseudonymizedAuditAndIdempotencyYears
    : PARTNER_ALERT_RETENTION_POLICY.agreementPaymentRefundDisputeYears);
}

/** A disconnected credential must have no recoverable ciphertext. This marker
 * is deliberately not an encrypted placeholder and must never be decrypted. */
export const PARTNER_ALERT_REMOVED_CREDENTIAL_JSON = JSON.stringify(Object.freeze({
  state: "removed",
  version: 1,
}));

export function isPartnerAlertCredentialRemoved(value: string): boolean {
  return value === PARTNER_ALERT_REMOVED_CREDENTIAL_JSON;
}

/** A retained connection row loses its credential and access evidence
 * atomically. Publisher erasure disconnects every merchant in the community. */
export function disconnectPartnerAlertWhopConnections(
  database: Database.Database,
  communityId: string,
  merchant?: Readonly<{ environment: "sandbox" | "live"; accountId: string }>,
): number {
  return database.transaction(() => {
    purgePartnerAlertWhopEvidence(database, { kind: "publisher", communityId, merchant });
    const merchantWhere = merchant ? " AND environment=? AND whop_account_id=?" : "";
    const merchantParams = merchant ? [merchant.environment, merchant.accountId] : [];
    return database.prepare(`UPDATE partner_alert_whop_connections
      SET status='disconnected', encrypted_authorisation_json=?
      WHERE community_id=? AND (status!='disconnected' OR encrypted_authorisation_json!=?)${merchantWhere}`)
      .run(PARTNER_ALERT_REMOVED_CREDENTIAL_JSON, communityId, PARTNER_ALERT_REMOVED_CREDENTIAL_JSON, ...merchantParams).changes;
  }).immediate();
}

/** First receipt is the earliest immutable revision observation, not Discord's
 * posting time or the time a delivery later settles. Missing provenance fails
 * closed rather than starting a fresh retention window. */
export function partnerAlertFirstReceipt(database: Pick<Database.Database, "prepare">,
  input: Readonly<{ communityId: string; sourceChannelId: string; messageId: string }>): string {
  const row = database.prepare(`SELECT min(observed_at_utc) first_received_at_utc
    FROM partner_alert_source_revisions WHERE community_id=? AND source_channel_id=? AND message_id=?`)
    .get(input.communityId, input.sourceChannelId, input.messageId) as { first_received_at_utc: string | null } | undefined;
  if (!row?.first_received_at_utc) throw new Error("partner_alert_first_receipt_missing");
  return exactUtc(row.first_received_at_utc, "first_receipt").toISOString();
}

/** Kept as the delivery completion hook, but settlement can only shorten an old
 * deadline to first receipt + seven days. It never starts or resets the clock. */
export function startPartnerAlertSettledTextRetention(
  database: Pick<Database.Database, "prepare">,
  input: Readonly<{ communityId: string; sourceChannelId: string; messageId: string; sourceRevision: number }>,
  settledAtUtc: string,
): boolean {
  exactUtc(settledAtUtc, "settled_at");
  const deadline = partnerAlertMessageTextRetainUntil("settled", partnerAlertFirstReceipt(database, input));
  const changed = database.prepare(`UPDATE partner_alert_source_messages SET retain_until_utc=?
    WHERE community_id=? AND source_channel_id=? AND message_id=? AND revision=? AND retain_until_utc>?`)
    .run(deadline, input.communityId, input.sourceChannelId, input.messageId, input.sourceRevision, deadline);
  return changed.changes === 1;
}
