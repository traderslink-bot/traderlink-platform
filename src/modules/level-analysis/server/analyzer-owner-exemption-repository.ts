import type Database from "better-sqlite3";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import { assertCanonicalUuidV4, createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";

export class AnalyzerOwnerExemptionRepository {
  constructor(private readonly database: Database.Database) {}

  activeEventId(userId: string): string | null {
    const row = this.database.prepare(`SELECT exemption_event_id,enabled FROM level_analysis_owner_exemption_events
WHERE user_id=? ORDER BY created_at_utc DESC,rowid DESC LIMIT 1`).get(userId) as
      { exemption_event_id: string; enabled: number } | undefined;
    return row?.enabled === 1 ? row.exemption_event_id : null;
  }

  /** Link the accepted request to the exact grant, inside its acquisition transaction. */
  recordAcquisition(acquisitionId: string, exemptionEventId: string): void {
    if (!this.database.inTransaction) throw new Error("analyzer_exemption_transaction_required");
    assertCanonicalUuidV4(acquisitionId, "acquisitionId");
    assertCanonicalUuidV4(exemptionEventId, "exemptionEventId");
    this.database.prepare(`INSERT INTO level_analysis_owner_exempt_acquisitions
(acquisition_id,exemption_event_id) VALUES(?,?)`).run(acquisitionId, exemptionEventId);
  }

  /** Only called with the server-verified owner administration scope. */
  set(scope: JournalAdminScope, userId: string, enabled: boolean, now: Date): void {
    assertCanonicalUuidV4(userId, "userId");
    assertCanonicalUuidV4(scope.userId, "actorUserId");
    if (!scope.permissions.includes("manage_users") ||
        !(scope.role === "journal_owner_admin" || scope.role === "development_journal_owner_admin")) {
      throw new Error("analyzer_exemption_not_authorized");
    }
    const operation = () => {
      if (!this.database.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(userId)) {
        throw new Error("analyzer_exemption_user_unavailable");
      }
      if (Boolean(this.activeEventId(userId)) === enabled) return;
      this.database.prepare(`INSERT INTO level_analysis_owner_exemption_events
(exemption_event_id,user_id,actor_user_id,enabled,created_at_utc) VALUES(?,?,?,?,?)`)
        .run(createCanonicalUuidV4(),userId,scope.userId,enabled ? 1 : 0,createCanonicalUtcTimestamp(now));
    };
    if (this.database.inTransaction) operation();
    else this.database.transaction(operation).immediate();
  }
}
