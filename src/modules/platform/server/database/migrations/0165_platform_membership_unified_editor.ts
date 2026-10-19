import type { PlatformMigration } from "../platform-migration-contract";
import { membershipPlanEditorStatements } from "../../membership/membership-plan-editor-schema";

/** Reserved by the release coordinator after Communities 0164 / order 177.
 * Integrate on the reconciled production + accepted migration lineage, never on
 * this shared checkout's stale migration inventory alone. */
export const platformMembershipUnifiedEditorMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0165_platform_membership_unified_editor",
  executionOrder: 178,
  statements: membershipPlanEditorStatements,
});
