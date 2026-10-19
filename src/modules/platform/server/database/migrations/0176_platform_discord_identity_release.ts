import type { PlatformMigration } from "../platform-migration-contract";
import { platformDiscordReleaseSchemaStatements } from "../../authentication/platform-discord-release-schema";

/** Coordinator reservation: after Profile 0175/order188; same identity as staging. */
export const platformDiscordIdentityReleaseMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0176_platform_discord_identity_release",
  executionOrder: 189,
  statements: platformDiscordReleaseSchemaStatements,
});
