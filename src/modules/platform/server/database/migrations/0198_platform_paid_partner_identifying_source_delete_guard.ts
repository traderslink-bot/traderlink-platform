import type { PlatformMigration } from "../platform-migration-contract";
import { PARTNER_ALERT_IDENTIFYING_SOURCE_DELETE_GUARD_REPLACEMENT_STATEMENTS } from "../../../../partner-alerts/server/database/partner-alert-identifying-source-delete-guard-schema";

/** SOURCE PROPOSAL ONLY: identity/order not reserved, registered or executed.
 * Requires reviewed 0196@234 and 0197@235 dependencies; target predecessor is
 * UNSELECTED. Preserve historical trigger DDL and apply this exact four-statement
 * vector atomically. No IF EXISTS, historical replay or permissive callback.
 */
export const platformPaidPartnerIdentifyingSourceDeleteGuardMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0198_platform_paid_partner_identifying_source_delete_guard",
  executionOrder: 281,
  statements: PARTNER_ALERT_IDENTIFYING_SOURCE_DELETE_GUARD_REPLACEMENT_STATEMENTS,
});
