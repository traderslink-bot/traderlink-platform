import type Database from "better-sqlite3";
import { partnerAlertUtc } from "../contracts/partner-alert-validation";

type Merchant = Readonly<{ environment: "sandbox" | "live"; accountId: string }>;
type Scope =
  | Readonly<{ kind: "subscriber"; userId: string }>
  | Readonly<{ kind: "publisher"; communityId: string; merchant?: Merchant }>
  | Readonly<{ kind: "restore" }>;

function evidenceSchemaPresent(db: Database.Database): boolean {
  const count = db.prepare(`SELECT count(*) FROM sqlite_schema
    WHERE type='table' AND name IN ('partner_alert_whop_discovery','partner_alert_whop_paid_intervals')`).pluck().get();
  if (count === 0) return false;
  if (count !== 2) throw new Error("partner_alert_whop_evidence_schema_incomplete");
  return true;
}

export function assertPartnerAlertWhopEvidenceAbsent(db: Database.Database): void {
  if (evidenceSchemaPresent(db) && (db.prepare("SELECT 1 FROM partner_alert_whop_discovery LIMIT 1").get()
    || db.prepare("SELECT 1 FROM partner_alert_whop_paid_intervals LIMIT 1").get())) {
    throw new Error("partner_alert_whop_restore_evidence_present");
  }
}

/** Run inside the same writer as the lifecycle transition. A predecessor
 * database legitimately has neither table. A partial successor must fail. */
export function purgePartnerAlertWhopEvidence(db: Database.Database, scope: Scope): number {
  if (!db.inTransaction || db.pragma("foreign_keys", { simple: true }) !== 1) {
    throw new Error("partner_alert_whop_evidence_writer_required");
  }
  if (!evidenceSchemaPresent(db)) return 0;
  switch (scope.kind) {
    case "subscriber":
      return db.prepare("DELETE FROM partner_alert_whop_discovery WHERE user_id=?").run(scope.userId).changes;
    case "publisher":
      return scope.merchant
        ? db.prepare(`DELETE FROM partner_alert_whop_discovery
            WHERE community_id=? AND environment=? AND whop_account_id=?`)
          .run(scope.communityId, scope.merchant.environment, scope.merchant.accountId).changes
        : db.prepare("DELETE FROM partner_alert_whop_discovery WHERE community_id=?").run(scope.communityId).changes;
    case "restore":
      return db.prepare("DELETE FROM partner_alert_whop_discovery").run().changes;
  }
}

export function purgeExpiredPartnerAlertWhopEvidence(db: Database.Database, atUtc: string): number {
  if (db.pragma("foreign_keys", { simple: true }) !== 1) throw new Error("partner_alert_whop_evidence_writer_required");
  return db.prepare(`DELETE FROM partner_alert_whop_discovery WHERE rowid IN (
    SELECT rowid FROM partner_alert_whop_discovery WHERE valid_until_utc<=?
    ORDER BY valid_until_utc,rowid LIMIT 100
  )`).run(partnerAlertUtc(atUtc, "discoveryExpiryUtc")).changes;
}
