import { platformPremiumCurrentAccessEventsMigration } from "../database/migrations/0216_platform_premium_current_access_events";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL, PLATFORM_PREMIUM_ROLE_TABLES } from "./platform-premium-role-schema";

const rebuilt = platformPremiumCurrentAccessEventsMigration.statements.find(statement => statement.startsWith("CREATE TABLE platform_premium_paid_events_next_v3 ("));
if (!rebuilt) throw new Error("Premium current access schema descriptor is missing.");
/** SQLite ALTER TABLE's actual canonical stored spelling after the guarded
 * rebuild. Native migration tests compare this exact SQL, including the fence.
 * Historical schema exports remain immutable and are never relabeled 204. */
export const PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS: readonly string[] = Object.freeze(
  PLATFORM_PREMIUM_ROLE_SCHEMA_SQL.map(statement => statement.startsWith("CREATE TABLE platform_premium_paid_events (")
    ? rebuilt.replace("CREATE TABLE platform_premium_paid_events_next_v3 (", 'CREATE TABLE "platform_premium_paid_events" (') : statement));
export const PLATFORM_PREMIUM_ROLE_SCHEMA_CURRENT_ACCESS = Object.freeze({
  kind: "id_free_current_access_descriptor" as const, tables: PLATFORM_PREMIUM_ROLE_TABLES,
  statements: PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS, canRegister: false as const,
  requires: Object.freeze(["0216_platform_premium_current_access_events", "current_schema_source_qualification",
    "original_v2_ticket", "actual_admitted_writer", "tri_state_current_event_projection", "erasure_and_restore_qualification"]),
});
