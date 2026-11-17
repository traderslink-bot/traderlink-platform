import type { PlatformMigration } from "../platform-migration-contract";
import {
  PARTNER_ALERT_POST_RETAINED_EVIDENCE_SCHEMA_STATEMENTS,
  PARTNER_ALERT_RETENTION_SCHEMA_BACKFILL_STATEMENTS,
} from "../../../../partner-alerts/server/database/partner-alert-retention-schema";

/** PROPOSED ONLY: no reservation, registration or execution authority.
 * Required source dependency: 0196_platform_paid_partner_retained_evidence@234.
 * The release composition and exact target-ledger predecessor remain unselected.
 * This payload never imports/replays the six 0196 statements or rejected 0195
 * principal insertion. Only original indexes 4..10,13..15 and two backfills.
 */
export const platformPaidPartnerRetentionSuccessorsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0197_platform_paid_partner_retention_successors",
  executionOrder: 257,
  statements: Object.freeze([
    ...PARTNER_ALERT_POST_RETAINED_EVIDENCE_SCHEMA_STATEMENTS,
    ...PARTNER_ALERT_RETENTION_SCHEMA_BACKFILL_STATEMENTS,
  ]),
});
