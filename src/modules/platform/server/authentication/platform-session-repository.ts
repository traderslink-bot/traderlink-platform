import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  assertLowercaseToken,
  isLowercaseSha256,
  platformFailure,
} from "../database/platform-migration-contract";

export type PlatformSessionRecord = Readonly<{
  sessionId: string;
  userId: string;
  authProvider: string;
  createdAtUtc: string;
  expiresAtUtc: string;
  lastSeenAtUtc: string;
  revokedAtUtc: string | null;
}>;

export type ResolvedPlatformSession = PlatformSessionRecord & Readonly<{
  displayName: string;
}>;

type SessionRow = Readonly<{
  session_id: string;
  user_id: string;
  auth_provider: string;
  created_at_utc: string;
  expires_at_utc: string;
  last_seen_at_utc: string;
  revoked_at_utc: string | null;
}>;

type ResolvedSessionRow = SessionRow & Readonly<{ display_name: string }>;

function assertTokenDigest(value: string): void {
  if (!isLowercaseSha256(value)) {
    platformFailure("TRADERLINK_AUTH_SESSION_INVALID");
  }
}

function mapSession(row: SessionRow): PlatformSessionRecord {
  return Object.freeze({
    sessionId: row.session_id,
    userId: row.user_id,
    authProvider: row.auth_provider,
    createdAtUtc: row.created_at_utc,
    expiresAtUtc: row.expires_at_utc,
    lastSeenAtUtc: row.last_seen_at_utc,
    revokedAtUtc: row.revoked_at_utc,
  });
}

function mapResolvedSession(row: ResolvedSessionRow): ResolvedPlatformSession {
  return Object.freeze({
    ...mapSession(row),
    displayName: row.display_name,
  });
}

export class PlatformSessionRepository {
  constructor(private readonly database: Database.Database) {}

  createSession(input: Readonly<{
    sessionId: string;
    userId: string;
    authProvider: string;
    authSubject: string;
    tokenSha256: string;
    createdAtUtc: string;
    expiresAtUtc: string;
  }>): PlatformSessionRecord {
    assertCanonicalUuidV4(input.sessionId, "sessionId");
    assertCanonicalUuidV4(input.userId, "userId");
    assertLowercaseToken(input.authProvider, "authProvider");
    if (input.authSubject.length < 1 || input.authSubject.length > 255) {
      platformFailure("TRADERLINK_AUTH_SESSION_INVALID");
    }
    assertTokenDigest(input.tokenSha256);
    assertCanonicalUtcTimestamp(input.createdAtUtc, "createdAtUtc");
    assertCanonicalUtcTimestamp(input.expiresAtUtc, "expiresAtUtc");
    if (input.expiresAtUtc <= input.createdAtUtc) {
      platformFailure("TRADERLINK_AUTH_SESSION_INVALID");
    }
    try {
      this.database.prepare(`INSERT INTO platform_auth_sessions (
  session_id, user_id, auth_provider, auth_subject, token_sha256,
  created_at_utc, expires_at_utc, last_seen_at_utc, revoked_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`)
        .run(
          input.sessionId,
          input.userId,
          input.authProvider,
          input.authSubject,
          input.tokenSha256,
          input.createdAtUtc,
          input.expiresAtUtc,
          input.createdAtUtc,
        );
    } catch (error) {
      platformFailure("TRADERLINK_AUTH_SESSION_INVALID", {}, error);
    }
    const row = this.database.prepare<[string], SessionRow>(`SELECT
  session_id, user_id, auth_provider, created_at_utc, expires_at_utc,
  last_seen_at_utc, revoked_at_utc
FROM platform_auth_sessions
WHERE session_id = ?`)
      .get(input.sessionId);
    if (!row) platformFailure("TRADERLINK_AUTH_SESSION_INVALID");
    return mapSession(row);
  }

  findActiveByTokenDigest(
    tokenSha256: string,
    nowUtc: string,
  ): ResolvedPlatformSession | null {
    assertTokenDigest(tokenSha256);
    assertCanonicalUtcTimestamp(nowUtc, "nowUtc");
    const row = this.database.prepare<[string, string], ResolvedSessionRow>(`SELECT
  session.session_id, session.user_id, session.auth_provider,
  session.created_at_utc, session.expires_at_utc,
  session.last_seen_at_utc, session.revoked_at_utc,
  user.display_name
FROM platform_auth_sessions session
JOIN platform_auth_identities identity
  ON identity.auth_provider = session.auth_provider
  AND identity.auth_subject = session.auth_subject
  AND identity.user_id = session.user_id
JOIN platform_users user ON user.user_id = session.user_id
WHERE session.token_sha256 = ?
  AND session.revoked_at_utc IS NULL
  AND session.expires_at_utc > ?
  AND identity.status = 'active'
  AND user.status = 'active'`)
      .get(tokenSha256, nowUtc);
    return row ? mapResolvedSession(row) : null;
  }

  touchActiveSession(input: Readonly<{
    sessionId: string;
    timestamp: string;
  }>): void {
    assertCanonicalUuidV4(input.sessionId, "sessionId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const result = this.database.prepare(`UPDATE platform_auth_sessions
SET last_seen_at_utc = ?
WHERE session_id = ?
  AND revoked_at_utc IS NULL
  AND expires_at_utc > ?
  AND last_seen_at_utc <= ?`)
      .run(
        input.timestamp,
        input.sessionId,
        input.timestamp,
        input.timestamp,
      );
    if (result.changes !== 1) {
      platformFailure("TRADERLINK_AUTH_SESSION_INVALID");
    }
  }

  revokeByTokenDigest(input: Readonly<{
    tokenSha256: string;
    timestamp: string;
  }>): boolean {
    assertTokenDigest(input.tokenSha256);
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const result = this.database.prepare(`UPDATE platform_auth_sessions
SET revoked_at_utc = ?
WHERE token_sha256 = ? AND revoked_at_utc IS NULL`)
      .run(input.timestamp, input.tokenSha256);
    return result.changes === 1;
  }

  countActiveForUser(userId: string, nowUtc: string): number {
    assertCanonicalUuidV4(userId, "userId");
    assertCanonicalUtcTimestamp(nowUtc, "nowUtc");
    const row = this.database.prepare<[string, string], { count: number }>(`SELECT COUNT(*) AS count
FROM platform_auth_sessions
WHERE user_id = ?
  AND revoked_at_utc IS NULL
  AND expires_at_utc > ?`)
      .get(userId, nowUtc);
    return row?.count ?? 0;
  }

  listActiveForUser(userId: string, nowUtc: string): readonly PlatformSessionRecord[] {
    assertCanonicalUuidV4(userId, "userId");
    assertCanonicalUtcTimestamp(nowUtc, "nowUtc");
    const rows = this.database.prepare<[string, string], SessionRow>(`SELECT
  session_id, user_id, auth_provider, created_at_utc, expires_at_utc,
  last_seen_at_utc, revoked_at_utc
FROM platform_auth_sessions
WHERE user_id = ?
  AND revoked_at_utc IS NULL
  AND expires_at_utc > ?
ORDER BY last_seen_at_utc DESC, session_id`).all(userId, nowUtc);
    return Object.freeze(rows.map(mapSession));
  }

  revokeActiveSessionForUser(input: Readonly<{
    sessionId: string;
    userId: string;
    timestamp: string;
  }>): boolean {
    assertCanonicalUuidV4(input.sessionId, "sessionId");
    assertCanonicalUuidV4(input.userId, "userId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const result = this.database.prepare(`UPDATE platform_auth_sessions
SET revoked_at_utc = ?
WHERE session_id = ?
  AND user_id = ?
  AND revoked_at_utc IS NULL
  AND expires_at_utc > ?`).run(
      input.timestamp,
      input.sessionId,
      input.userId,
      input.timestamp,
    );
    return result.changes === 1;
  }

  revokeActiveForUser(input: Readonly<{
    userId: string;
    timestamp: string;
  }>): number {
    assertCanonicalUuidV4(input.userId, "userId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const result = this.database.prepare(`UPDATE platform_auth_sessions
SET revoked_at_utc = ?
WHERE user_id = ?
  AND revoked_at_utc IS NULL
  AND expires_at_utc > ?`)
      .run(input.timestamp, input.userId, input.timestamp);
    return result.changes;
  }
}
