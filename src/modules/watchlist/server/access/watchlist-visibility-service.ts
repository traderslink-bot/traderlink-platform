import "server-only";

import type Database from "better-sqlite3";

import {
  createCanonicalUtcTimestamp,
  isCanonicalUtcTimestamp,
  isCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export type WatchlistVisibilityState =
  | Readonly<{
      status: "available";
      memberVisible: boolean;
      updatedAtUtc: string | null;
    }>
  | Readonly<{ status: "unavailable" }>;

type WatchlistVisibilityRow = Readonly<{
  member_visible: 0 | 1;
  updated_at_utc: string | null;
  updated_by_user_id: string | null;
}>;

function readFromDatabase(database: Database.Database): WatchlistVisibilityState {
  const row = database.prepare<[], WatchlistVisibilityRow>(`SELECT
  member_visible, updated_at_utc, updated_by_user_id
FROM platform_watchlist_visibility
WHERE settings_key = 'member_visibility'`).get();
  if (!row || (row.member_visible !== 0 && row.member_visible !== 1)) {
    return Object.freeze({ status: "unavailable" as const });
  }
  if (
    (row.updated_at_utc === null) !== (row.updated_by_user_id === null) ||
    (row.updated_at_utc !== null && !isCanonicalUtcTimestamp(row.updated_at_utc)) ||
    (row.updated_by_user_id !== null && !isCanonicalUuidV4(row.updated_by_user_id))
  ) {
    return Object.freeze({ status: "unavailable" as const });
  }
  return Object.freeze({
    status: "available" as const,
    memberVisible: row.member_visible === 1,
    updatedAtUtc: row.updated_at_utc,
  });
}

export function readWatchlistVisibility(
  options: Readonly<{
    databasePath?: string;
    environment?: NodeJS.ProcessEnv;
    forbiddenRepositoryRoots?: readonly string[];
  }> = {},
): WatchlistVisibilityState {
  try {
    return withReadonlyPlatformDatabase(options, readFromDatabase);
  } catch {
    return Object.freeze({ status: "unavailable" as const });
  }
}

export function saveWatchlistVisibility(input: Readonly<{
  database: Database.Database;
  memberVisible: boolean;
  actorUserId: string;
  now?: () => Date;
}>): WatchlistVisibilityState {
  const updatedAtUtc = createCanonicalUtcTimestamp((input.now ?? (() => new Date()))());
  const result = input.database.prepare(`UPDATE platform_watchlist_visibility
SET member_visible = ?, updated_at_utc = ?, updated_by_user_id = ?
WHERE settings_key = 'member_visibility'`).run(
    input.memberVisible ? 1 : 0,
    updatedAtUtc,
    input.actorUserId,
  );
  if (result.changes !== 1) return Object.freeze({ status: "unavailable" as const });
  return readFromDatabase(input.database);
}

export function saveWatchlistVisibilityForOwner(input: Readonly<{
  actorUserId: string;
  memberVisible: boolean;
  environment?: NodeJS.ProcessEnv;
  databasePath?: string;
  forbiddenRepositoryRoots?: readonly string[];
}>): WatchlistVisibilityState {
  return withPlatformDatabase(
    {
      databasePath: input.databasePath,
      environment: input.environment,
      forbiddenRepositoryRoots: input.forbiddenRepositoryRoots,
      mode: "runtime",
    },
    (database) => saveWatchlistVisibility({
      actorUserId: input.actorUserId,
      database,
      memberVisible: input.memberVisible,
    }),
  );
}
