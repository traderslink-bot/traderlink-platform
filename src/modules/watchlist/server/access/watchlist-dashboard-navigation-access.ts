import "server-only";

import type Database from "better-sqlite3";

import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV =
  "TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT" as const;

const DISCORD_SNOWFLAKE_PATTERN = /^[0-9]{1,32}$/u;

function configuredDiscordSubjects(
  environment: NodeJS.ProcessEnv,
): readonly string[] | null {
  const value = environment[TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV];
  if (value === undefined) return null;
  const subjects = value.split(",").map((subject) => subject.trim());
  if (subjects.length === 0 || subjects.some((subject) => !DISCORD_SNOWFLAKE_PATTERN.test(subject))) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  return Object.freeze(subjects);
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

export function hasWatchlistDashboardNavigationAccess(
  identity: TraderLinkPlatformRequestIdentity,
  options: Readonly<{
    databasePath?: string;
    environment?: NodeJS.ProcessEnv;
    forbiddenRepositoryRoots?: readonly string[];
  }> = {},
): boolean {
  if (identity.mode === "local_development") return true;
  const environment = options.environment ?? process.env;
  const discordSubjects = configuredDiscordSubjects(environment);
  if (!discordSubjects) return false;
  return withReadonlyPlatformDatabase(
    {
      databasePath: options.databasePath,
      environment,
      forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
    },
    (database) => discordSubjects.some((discordSubject) =>
      hasActiveDiscordIdentity(database, identity.scope.userId, discordSubject)),
  );
}
