import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUuidV4,
  isLowercaseSha256,
  platformFailure,
} from "../database/platform-migration-contract";

type PendingAttemptBinding = Readonly<{
  scope: WorkspaceAccessScope;
  platformSessionId: string | null;
}>;

function assertBinding(input: PendingAttemptBinding): void {
  assertCanonicalUuidV4(input.scope.userId, "userId");
  assertCanonicalUuidV4(input.scope.workspaceId, "workspaceId");
  if (input.platformSessionId !== null) {
    assertCanonicalUuidV4(input.platformSessionId, "platformSessionId");
  }
}

function assertStateDigest(stateSha256: string): void {
  if (!isLowercaseSha256(stateSha256)) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
  }
}

export class MoomooOAuthPendingAttemptRepository {
  constructor(private readonly database: Database.Database) {}

  deleteExpired(nowUtc: string, limit = 50): number {
    assertCanonicalUtcTimestamp(nowUtc, "nowUtc");
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
    }
    return this.database.prepare(`DELETE FROM platform_moomoo_oauth_pending_attempts
WHERE pending_attempt_id IN (
  SELECT pending_attempt_id
  FROM platform_moomoo_oauth_pending_attempts
  WHERE expires_at_utc <= ?
  ORDER BY expires_at_utc, pending_attempt_id
  LIMIT ?
)`).run(nowUtc, limit).changes;
  }

  isPendingBound(input: PendingAttemptBinding & Readonly<{
    stateSha256: string;
    nowUtc: string;
  }>): boolean {
    assertBinding(input);
    assertStateDigest(input.stateSha256);
    assertCanonicalUtcTimestamp(input.nowUtc, "nowUtc");
    const row = this.database.prepare(`SELECT 1 AS present
FROM platform_moomoo_oauth_pending_attempts
WHERE state_sha256 = ?
  AND user_id = ?
  AND workspace_id = ?
  AND (
    platform_session_id = ?
    OR (platform_session_id IS NULL AND ? IS NULL)
  )
  AND attempt_state = 'pending'
  AND expires_at_utc > ?
LIMIT 1`).get(
      input.stateSha256,
      input.scope.userId,
      input.scope.workspaceId,
      input.platformSessionId,
      input.platformSessionId,
      input.nowUtc,
    ) as Readonly<{ present: 1 }> | undefined;
    return row?.present === 1;
  }

  create(input: PendingAttemptBinding & Readonly<{
    stateSha256: string;
    createdAtUtc: string;
    expiresAtUtc: string;
  }>): void {
    assertBinding(input);
    assertStateDigest(input.stateSha256);
    assertCanonicalUtcTimestamp(input.createdAtUtc, "createdAtUtc");
    assertCanonicalUtcTimestamp(input.expiresAtUtc, "expiresAtUtc");
    if (input.expiresAtUtc <= input.createdAtUtc) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
    }
    this.database.prepare(`INSERT INTO platform_moomoo_oauth_pending_attempts (
  pending_attempt_id, state_sha256, user_id, workspace_id, platform_session_id,
  attempt_state, created_at_utc, expires_at_utc, consumed_at_utc
) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NULL)`).run(
      createCanonicalUuidV4(),
      input.stateSha256,
      input.scope.userId,
      input.scope.workspaceId,
      input.platformSessionId,
      input.createdAtUtc,
      input.expiresAtUtc,
    );
  }

  consume(input: PendingAttemptBinding & Readonly<{
    stateSha256: string;
    consumedAtUtc: string;
  }>): boolean {
    assertBinding(input);
    assertStateDigest(input.stateSha256);
    assertCanonicalUtcTimestamp(input.consumedAtUtc, "consumedAtUtc");
    const result = this.database.prepare(`UPDATE platform_moomoo_oauth_pending_attempts
SET attempt_state = 'consumed', consumed_at_utc = ?
WHERE state_sha256 = ?
  AND user_id = ?
  AND workspace_id = ?
  AND (
    platform_session_id = ?
    OR (platform_session_id IS NULL AND ? IS NULL)
  )
  AND attempt_state = 'pending'
  AND expires_at_utc > ?`).run(
      input.consumedAtUtc,
      input.stateSha256,
      input.scope.userId,
      input.scope.workspaceId,
      input.platformSessionId,
      input.platformSessionId,
      input.consumedAtUtc,
    );
    return result.changes === 1;
  }
}
