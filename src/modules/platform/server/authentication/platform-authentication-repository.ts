import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  assertLowercaseToken,
  platformFailure,
} from "../database/platform-migration-contract";

export type PlatformAuthenticationIdentity = Readonly<{
  userId: string;
  authProvider: string;
  status: "active" | "revoked";
  createdAtUtc: string;
  updatedAtUtc: string;
  lastAuthenticatedAtUtc: string | null;
}>;

type IdentityRow = Readonly<{
  user_id: string;
  auth_provider: string;
  status: "active" | "revoked";
  created_at_utc: string;
  updated_at_utc: string;
  last_authenticated_at_utc: string | null;
}>;

function mapIdentity(row: IdentityRow): PlatformAuthenticationIdentity {
  return Object.freeze({
    userId: row.user_id,
    authProvider: row.auth_provider,
    status: row.status,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
    lastAuthenticatedAtUtc: row.last_authenticated_at_utc,
  });
}

function assertAuthSubject(value: string): void {
  if (value.length < 1 || value.length > 255) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "authSubject",
    });
  }
}

export class PlatformAuthenticationRepository {
  constructor(private readonly database: Database.Database) {}

  findActiveIdentity(
    authProvider: string,
    authSubject: string,
  ): PlatformAuthenticationIdentity | null {
    assertLowercaseToken(authProvider, "authProvider");
    assertAuthSubject(authSubject);
    const row = this.database.prepare<[string, string], IdentityRow>(`SELECT
  user_id, auth_provider, status, created_at_utc, updated_at_utc,
  last_authenticated_at_utc
FROM platform_auth_identities
WHERE auth_provider = ? AND auth_subject = ? AND status = 'active'`)
      .get(authProvider, authSubject);
    return row ? mapIdentity(row) : null;
  }

  linkIdentity(input: Readonly<{
    userId: string;
    authProvider: string;
    authSubject: string;
    linkedByUserId: string;
    timestamp: string;
  }>): PlatformAuthenticationIdentity {
    assertCanonicalUuidV4(input.userId, "userId");
    assertCanonicalUuidV4(input.linkedByUserId, "linkedByUserId");
    assertLowercaseToken(input.authProvider, "authProvider");
    assertAuthSubject(input.authSubject);
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    try {
      this.database.prepare(`INSERT INTO platform_auth_identities (
  user_id, auth_provider, auth_subject, status, linked_by_user_id,
  created_at_utc, updated_at_utc, last_authenticated_at_utc
) VALUES (?, ?, ?, 'active', ?, ?, ?, NULL)`)
        .run(
          input.userId,
          input.authProvider,
          input.authSubject,
          input.linkedByUserId,
          input.timestamp,
          input.timestamp,
        );
    } catch (error) {
      platformFailure("TRADERLINK_AUTH_IDENTITY_CONFLICT", {}, error);
    }
    return this.findActiveIdentity(input.authProvider, input.authSubject) as PlatformAuthenticationIdentity;
  }

  markAuthenticated(input: Readonly<{
    authProvider: string;
    authSubject: string;
    timestamp: string;
  }>): PlatformAuthenticationIdentity {
    assertLowercaseToken(input.authProvider, "authProvider");
    assertAuthSubject(input.authSubject);
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const result = this.database.prepare(`UPDATE platform_auth_identities
SET last_authenticated_at_utc = ?, updated_at_utc = ?
WHERE auth_provider = ? AND auth_subject = ? AND status = 'active'`)
      .run(
        input.timestamp,
        input.timestamp,
        input.authProvider,
        input.authSubject,
      );
    if (result.changes !== 1) {
      platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    }
    return this.findActiveIdentity(input.authProvider, input.authSubject) as PlatformAuthenticationIdentity;
  }
}
