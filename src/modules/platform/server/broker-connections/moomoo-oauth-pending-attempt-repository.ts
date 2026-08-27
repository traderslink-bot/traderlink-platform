import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUuidV4,
  isLowercaseSha256,
  platformFailure,
} from "../database/platform-migration-contract";

export const MOOMOO_OAUTH_PENDING_ATTEMPT_TTL_MILLISECONDS = 10 * 60 * 1000;
export const MOOMOO_OAUTH_PENDING_ATTEMPT_RETENTION_MILLISECONDS = 24 * 60 * 60 * 1000;
const CLEANUP_LIMIT = 100;

type PendingAttemptRow = Readonly<{
  attempt_state: "pending" | "consumed";
  expires_at_utc: string;
  platform_session_id: string | null;
  user_id: string;
  workspace_id: string;
}>;

function assertStateSha256(value: string): void {
  if (!isLowercaseSha256(value)) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID", { stage: "state_digest" });
  }
}

function assertSessionId(value: string | null): void {
  if (value !== null) assertCanonicalUuidV4(value, "platformSessionId");
}

export function hashMoomooOAuthState(state: string): string {
  if (!/^[A-Za-z0-9_-]{32,128}$/u.test(state)) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID", { stage: "state_format" });
  }
  return createHash("sha256").update(state, "utf8").digest("hex");
}

export class MoomooOAuthPendingAttemptRepository {
  constructor(private readonly database: Database.Database) {}

  cleanupExpiredBefore(retentionCutoffUtc: string): number {
    assertCanonicalUtcTimestamp(retentionCutoffUtc, "oauthAttemptRetentionCutoff");
    return this.database.prepare(`DELETE FROM platform_moomoo_oauth_pending_attempts
WHERE pending_attempt_id IN (
  SELECT pending_attempt_id
  FROM platform_moomoo_oauth_pending_attempts
  WHERE expires_at_utc < ?
  ORDER BY expires_at_utc, pending_attempt_id
  LIMIT ${CLEANUP_LIMIT}
)`).run(retentionCutoffUtc).changes;
  }

  create(input: Readonly<{
    createdAtUtc: string;
    expiresAtUtc: string;
    platformSessionId: string | null;
    scope: WorkspaceAccessScope;
    stateSha256: string;
  }>): void {
    assertCanonicalUtcTimestamp(input.createdAtUtc, "oauthAttemptCreatedAt");
    assertCanonicalUtcTimestamp(input.expiresAtUtc, "oauthAttemptExpiresAt");
    if (input.expiresAtUtc <= input.createdAtUtc) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID", { stage: "attempt_expiry" });
    }
    assertCanonicalUuidV4(input.scope.userId, "userId");
    assertCanonicalUuidV4(input.scope.workspaceId, "workspaceId");
    assertSessionId(input.platformSessionId);
    assertStateSha256(input.stateSha256);
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

  pendingForScope(input: Readonly<{
    nowUtc: string;
    platformSessionId: string | null;
    scope: WorkspaceAccessScope;
    stateSha256: string;
  }>): boolean {
    assertCanonicalUtcTimestamp(input.nowUtc, "oauthAttemptNow");
    assertCanonicalUuidV4(input.scope.userId, "userId");
    assertCanonicalUuidV4(input.scope.workspaceId, "workspaceId");
    assertSessionId(input.platformSessionId);
    assertStateSha256(input.stateSha256);
    const row = this.database.prepare<[string], PendingAttemptRow>(`SELECT
  attempt_state, expires_at_utc, platform_session_id, user_id, workspace_id
FROM platform_moomoo_oauth_pending_attempts
WHERE state_sha256 = ?`).get(input.stateSha256);
    return row?.attempt_state === "pending" &&
      row.expires_at_utc >= input.nowUtc &&
      row.user_id === input.scope.userId &&
      row.workspace_id === input.scope.workspaceId &&
      row.platform_session_id === input.platformSessionId;
  }

  consumeForScope(input: Readonly<{
    consumedAtUtc: string;
    platformSessionId: string | null;
    scope: WorkspaceAccessScope;
    stateSha256: string;
  }>): boolean {
    assertCanonicalUtcTimestamp(input.consumedAtUtc, "oauthAttemptConsumedAt");
    assertCanonicalUuidV4(input.scope.userId, "userId");
    assertCanonicalUuidV4(input.scope.workspaceId, "workspaceId");
    assertSessionId(input.platformSessionId);
    assertStateSha256(input.stateSha256);
    const result = this.database.prepare(`UPDATE platform_moomoo_oauth_pending_attempts
SET attempt_state = 'consumed', consumed_at_utc = ?
WHERE state_sha256 = ?
  AND attempt_state = 'pending'
  AND expires_at_utc >= ?
  AND user_id = ?
  AND workspace_id = ?
  AND platform_session_id IS ?`).run(
      input.consumedAtUtc,
      input.stateSha256,
      input.consumedAtUtc,
      input.scope.userId,
      input.scope.workspaceId,
      input.platformSessionId,
    );
    return result.changes === 1;
  }
}
