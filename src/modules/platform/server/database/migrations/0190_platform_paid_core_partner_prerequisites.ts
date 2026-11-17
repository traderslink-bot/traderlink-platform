import type { PlatformMigration } from "../platform-migration-contract";
import { platformErasureAdmissionSchemaStatements } from "../../privacy/platform-erasure-admission-schema";
import { platformPremiumAuthoritySchemaStatementsV2 } from "../../membership/platform-premium-authority-repository";
import { platformPremiumSignerRedactionSchemaStatements } from "../../privacy/platform-premium-signer-redaction";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL } from "../../membership/platform-premium-role-schema";
import { PARTNER_ALERT_SCHEMA_STATEMENTS } from "../../../../partner-alerts/server/database/partner-alert-schema";
import { PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS } from "../../../../partner-alerts/server/database/partner-alert-context-schema";

/** Exact coupled source composition. V2 already includes the V1 authority DDL.
 * Profile/catalog, erasure retention and native paid evidence are separate gates;
 * a reserved migration identity grants none of them. No SQL executes at import. */
export const platformPaidCorePartnerPrerequisitesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0190_platform_paid_core_partner_prerequisites",
  executionOrder: 278,
  statements: Object.freeze([
    ...platformErasureAdmissionSchemaStatements,
    ...platformPremiumAuthoritySchemaStatementsV2,
    ...platformPremiumSignerRedactionSchemaStatements,
    ...PLATFORM_PREMIUM_ROLE_SCHEMA_SQL,
    ...PARTNER_ALERT_SCHEMA_STATEMENTS,
    ...PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS,
  ]),
});
