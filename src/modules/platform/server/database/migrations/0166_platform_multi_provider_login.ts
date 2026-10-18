import type { PlatformMigration } from "../platform-migration-contract";
import { platformLoginSchemaStatements } from "../../authentication/platform-login-schema";
/** Candidate reservation after unified membership 0165/order 178; reconcile before release. */
export const platformMultiProviderLoginMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform", migrationId: "0166_platform_multi_provider_login",
  executionOrder: 179, statements: platformLoginSchemaStatements,
});
