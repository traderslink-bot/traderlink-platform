import { PARTNER_ALERT_WHOP_EVIDENCE_STATEMENTS } from "../../../../partner-alerts/server/database/partner-alert-whop-evidence-schema";
import type { PlatformMigration } from "../platform-migration-contract";

/** Reserved append identity. The integrated manifest is reviewed separately. */
export const platformPaidWhopCoverageEvidenceMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0208_platform_paid_whop_coverage_evidence",
  executionOrder: 262,
  statements: PARTNER_ALERT_WHOP_EVIDENCE_STATEMENTS,
});
