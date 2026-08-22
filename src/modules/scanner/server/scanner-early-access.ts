import "server-only";

import type Database from "better-sqlite3";

import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const TRADERLINK_SCANNER_EARLY_ACCESS_DISCORD_SUBJECT_ENV =
  "TRADERLINK_SCANNER_EARLY_ACCESS_DISCORD_SUBJECT" as const;

const DISCORD_SNOWFLAKE_PATTERN = /^[0-9]{1,32}$/u;

function configuredDiscordSubject(
  environment: NodeJS.ProcessEnv,
): string | null {
  const value = environment[TRADERLINK_SCANNER_EARLY_ACCESS_DISCORD_SUBJECT_ENV];
  if (value === undefined) return null;
  if (!DISCORD_SNOWFLAKE_PATTERN.test(value)) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  return value;
}

function hasActiveDiscordIdentity(
  database: Database.Database,
  userId: string,
  discordSubject: string,
): boolean {
  return database.prepare<
    [string, string],
    Readonly<{ matches: 0 | 1 }>
  >(`SELECT EXISTS(
SELECT 1
FROM platform_auth_identities
WHERE user_id = ?
  AND auth_provider = 'discord'
  AND auth_subject = ?
  AND status = 'active'
) AS matches`).get(userId, discordSubject)?.matches === 1;
}

export function hasScannerEarlyAccess(
  identity: TraderLinkPlatformRequestIdentity,
  options: Readonly<{
    databasePath?: string;
    environment?: NodeJS.ProcessEnv;
    forbiddenRepositoryRoots?: readonly string[];
  }> = {},
): boolean {
  if (identity.mode === "local_development") return true;
  const environment = options.environment ?? process.env;
  const discordSubject = configuredDiscordSubject(environment);
  if (!discordSubject) return false;
  return withReadonlyPlatformDatabase(
    {
      databasePath: options.databasePath,
      environment,
      forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
    },
    (database) => hasActiveDiscordIdentity(
      database,
      identity.scope.userId,
      discordSubject,
    ),
  );
}
