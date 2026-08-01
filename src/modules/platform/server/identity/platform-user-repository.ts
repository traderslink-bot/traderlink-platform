import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  assertLowercaseToken,
  platformFailure,
} from "../database/platform-migration-contract";

export type PlatformUserStatus = "active" | "disabled";

export type PlatformUserRecord = Readonly<{
  userId: string;
  authProvider: string;
  authSubject: string;
  displayName: string;
  status: PlatformUserStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

type PlatformUserRow = Readonly<{
  user_id: string;
  auth_provider: string;
  auth_subject: string;
  display_name: string;
  status: PlatformUserStatus;
  created_at_utc: string;
  updated_at_utc: string;
}>;

function mapUser(row: PlatformUserRow): PlatformUserRecord {
  return Object.freeze({
    userId: row.user_id,
    authProvider: row.auth_provider,
    authSubject: row.auth_subject,
    displayName: row.display_name,
    status: row.status,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

export class PlatformUserRepository {
  private readonly allowedAuthProviders: ReadonlySet<string>;

  constructor(
    private readonly database: Database.Database,
    options: Readonly<{ allowedAuthProviders: readonly string[] }>,
  ) {
    if (options.allowedAuthProviders.length === 0) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "allowedAuthProviders",
      });
    }
    for (const provider of options.allowedAuthProviders) {
      assertLowercaseToken(provider, "authProvider");
    }
    this.allowedAuthProviders = new Set(options.allowedAuthProviders);
  }

  private assertProvider(authProvider: string): void {
    assertLowercaseToken(authProvider, "authProvider");
    if (!this.allowedAuthProviders.has(authProvider)) {
      platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    }
  }

  createUser(input: Readonly<{
    userId: string;
    authProvider: string;
    authSubject: string;
    displayName: string;
    status?: PlatformUserStatus;
    createdAtUtc: string;
    updatedAtUtc: string;
  }>): PlatformUserRecord {
    assertCanonicalUuidV4(input.userId, "userId");
    this.assertProvider(input.authProvider);
    if (input.authSubject.length < 1 || input.authSubject.length > 255) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "authSubject",
      });
    }
    if (input.displayName.trim().length < 1 || input.displayName.trim().length > 120) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "displayName",
      });
    }
    assertCanonicalUtcTimestamp(input.createdAtUtc, "createdAtUtc");
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "updatedAtUtc");
    this.database
      .prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(
        input.userId,
        input.authProvider,
        input.authSubject,
        input.displayName,
        input.status ?? "active",
        input.createdAtUtc,
        input.updatedAtUtc,
      );
    return this.findById(input.userId) as PlatformUserRecord;
  }

  findById(userId: string): PlatformUserRecord | null {
    assertCanonicalUuidV4(userId, "userId");
    const row = this.database
      .prepare<[string], PlatformUserRow>(`SELECT * FROM platform_users WHERE user_id = ?`)
      .get(userId);
    return row ? mapUser(row) : null;
  }

  findActiveByAuthIdentity(
    authProvider: string,
    authSubject: string,
  ): PlatformUserRecord | null {
    this.assertProvider(authProvider);
    const row = this.database
      .prepare<[string, string], PlatformUserRow>(`SELECT *
FROM platform_users
WHERE auth_provider = ? AND auth_subject = ? AND status = 'active'`)
      .get(authProvider, authSubject);
    return row ? mapUser(row) : null;
  }
}
