import type { PlatformMigration } from "../platform-migration-contract";
import { PARTNER_ALERT_RETAINED_EVIDENCE_SCHEMA_STATEMENTS } from "../../../../partner-alerts/server/database/partner-alert-retained-evidence-schema";

/** Source-reserved evidence-only append; registration/apply require separate gates. */
export const platformPaidPartnerRetainedEvidenceMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0196_platform_paid_partner_retained_evidence",
  executionOrder: 256,
  statements: PARTNER_ALERT_RETAINED_EVIDENCE_SCHEMA_STATEMENTS,
});
