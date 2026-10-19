import type { PlatformMigration } from "../platform-migration-contract";
import { platformProfileNameSchemaStatements } from "../../identity/platform-profile-name-schema";

/** Coordinator reservation after Stats 0174/order187; source only, unapplied. */
export const platformProfileNameMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0175_platform_profile_name",
  executionOrder: 188,
  statements: platformProfileNameSchemaStatements,
});
