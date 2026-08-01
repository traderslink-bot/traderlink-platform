import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  assertLowercaseToken,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type JournalAccountRecord = Readonly<{
  accountId: string;
  workspaceId: string;
  displayName: string;
  baseCurrency: string;
  tradingTimezone: string;
  status: "active" | "archived";
  createdByUserId: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type JournalAccountSourceIdentityRecord = Readonly<{
  sourceIdentityId: string;
  workspaceId: string;
  accountId: string;
  sourceSystem: string;
  fingerprintSchemeVersion: "hmac-sha256-v1";
  sourceAccountCanonicalizationVersion: string;
  hmacKeyVersion: string;
  sourceAccountFingerprint: string;
  privacySafeDisplay: string;
  status: "active_current" | "retained_previous" | "superseded";
  firstSeenAtUtc: string;
  lastSeenAtUtc: string;
}>;

type AccountRow = Readonly<{
  account_id: string;
  workspace_id: string;
  display_name: string;
  base_currency: string;
  trading_timezone: string;
  status: "active" | "archived";
  created_by_user_id: string;
  created_at_utc: string;
  updated_at_utc: string;
}>;

type IdentityRow = Readonly<{
  source_identity_id: string;
  workspace_id: string;
  account_id: string;
  source_system: string;
  fingerprint_scheme_version: "hmac-sha256-v1";
  source_account_canonicalization_version: string;
  hmac_key_version: string;
  source_account_fingerprint: string;
  privacy_safe_display: string;
  status: "active_current" | "retained_previous" | "superseded";
  first_seen_at_utc: string;
  last_seen_at_utc: string;
}>;

function mapAccount(row: AccountRow): JournalAccountRecord {
  return Object.freeze({
    accountId: row.account_id,
    workspaceId: row.workspace_id,
    displayName: row.display_name,
    baseCurrency: row.base_currency,
    tradingTimezone: row.trading_timezone,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

function mapIdentity(row: IdentityRow): JournalAccountSourceIdentityRecord {
  return Object.freeze({
    sourceIdentityId: row.source_identity_id,
    workspaceId: row.workspace_id,
    accountId: row.account_id,
    sourceSystem: row.source_system,
    fingerprintSchemeVersion: row.fingerprint_scheme_version,
    sourceAccountCanonicalizationVersion:
      row.source_account_canonicalization_version,
    hmacKeyVersion: row.hmac_key_version,
    sourceAccountFingerprint: row.source_account_fingerprint,
    privacySafeDisplay: row.privacy_safe_display,
    status: row.status,
    firstSeenAtUtc: row.first_seen_at_utc,
    lastSeenAtUtc: row.last_seen_at_utc,
  });
}

export type SourceIdentityFingerprintTuple = Readonly<{
  canonicalizationVersion: string;
  hmacKeyVersion: string;
  fingerprint: string;
}>;

export class JournalAccountRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.transaction(operation).immediate();
  }

  createAccount(input: JournalAccountRecord): JournalAccountRecord {
    assertCanonicalUuidV4(input.accountId, "accountId");
    assertCanonicalUuidV4(input.workspaceId, "workspaceId");
    assertCanonicalUuidV4(input.createdByUserId, "createdByUserId");
    assertCanonicalUtcTimestamp(input.createdAtUtc, "createdAtUtc");
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "updatedAtUtc");
    this.database
      .prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        input.accountId,
        input.workspaceId,
        input.displayName,
        input.baseCurrency,
        input.tradingTimezone,
        input.status,
        input.createdByUserId,
        input.createdAtUtc,
        input.updatedAtUtc,
      );
    return input;
  }

  findActiveAccount(
    workspaceId: string,
    accountId: string,
  ): JournalAccountRecord | null {
    assertCanonicalUuidV4(workspaceId, "workspaceId");
    assertCanonicalUuidV4(accountId, "accountId");
    const row = this.database
      .prepare<[string, string], AccountRow>(`SELECT * FROM journal_accounts
WHERE workspace_id = ? AND account_id = ? AND status = 'active'`)
      .get(workspaceId, accountId);
    return row ? mapAccount(row) : null;
  }

  listActiveAccounts(workspaceId: string): readonly JournalAccountRecord[] {
    assertCanonicalUuidV4(workspaceId, "workspaceId");
    return this.database
      .prepare<[string], AccountRow>(`SELECT * FROM journal_accounts
WHERE workspace_id = ? AND status = 'active'
ORDER BY account_id`)
      .all(workspaceId)
      .map(mapAccount);
  }

  createSourceIdentity(
    input: JournalAccountSourceIdentityRecord,
  ): JournalAccountSourceIdentityRecord {
    assertCanonicalUuidV4(input.sourceIdentityId, "sourceIdentityId");
    assertCanonicalUuidV4(input.workspaceId, "workspaceId");
    assertCanonicalUuidV4(input.accountId, "accountId");
    assertLowercaseToken(input.sourceSystem, "sourceSystem");
    assertLowercaseToken(
      input.sourceAccountCanonicalizationVersion,
      "sourceAccountCanonicalizationVersion",
    );
    assertLowercaseToken(input.hmacKeyVersion, "hmacKeyVersion");
    assertCanonicalUtcTimestamp(input.firstSeenAtUtc, "firstSeenAtUtc");
    assertCanonicalUtcTimestamp(input.lastSeenAtUtc, "lastSeenAtUtc");
    this.database
      .prepare(`INSERT INTO journal_account_source_identities (
  source_identity_id, workspace_id, account_id, source_system,
  fingerprint_scheme_version, source_account_canonicalization_version,
  hmac_key_version, source_account_fingerprint, privacy_safe_display,
  status, first_seen_at_utc, last_seen_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        input.sourceIdentityId,
        input.workspaceId,
        input.accountId,
        input.sourceSystem,
        input.fingerprintSchemeVersion,
        input.sourceAccountCanonicalizationVersion,
        input.hmacKeyVersion,
        input.sourceAccountFingerprint,
        input.privacySafeDisplay,
        input.status,
        input.firstSeenAtUtc,
        input.lastSeenAtUtc,
      );
    return input;
  }

  listNonSupersededSourceIdentities(
    workspaceId: string,
    sourceSystem: string,
  ): readonly JournalAccountSourceIdentityRecord[] {
    assertCanonicalUuidV4(workspaceId, "workspaceId");
    assertLowercaseToken(sourceSystem, "sourceSystem");
    return this.database
      .prepare<[string, string], IdentityRow>(`SELECT *
FROM journal_account_source_identities
WHERE workspace_id = ? AND source_system = ? AND status <> 'superseded'
ORDER BY source_identity_id`)
      .all(workspaceId, sourceSystem)
      .map(mapIdentity);
  }

  findSourceIdentityMatches(
    workspaceId: string,
    sourceSystem: string,
    tuples: readonly SourceIdentityFingerprintTuple[],
  ): readonly JournalAccountSourceIdentityRecord[] {
    const statement = this.database.prepare<
      [string, string, string, string, string],
      IdentityRow
    >(`SELECT * FROM journal_account_source_identities
WHERE workspace_id = ? AND source_system = ?
  AND fingerprint_scheme_version = 'hmac-sha256-v1'
  AND source_account_canonicalization_version = ?
  AND hmac_key_version = ? AND source_account_fingerprint = ?
  AND status <> 'superseded'`);
    const matches = new Map<string, JournalAccountSourceIdentityRecord>();
    for (const tuple of tuples) {
      const row = statement.get(
        workspaceId,
        sourceSystem,
        tuple.canonicalizationVersion,
        tuple.hmacKeyVersion,
        tuple.fingerprint,
      );
      if (row) matches.set(row.source_identity_id, mapIdentity(row));
    }
    return Object.freeze([...matches.values()]);
  }

  markOtherIdentityRowsRetained(input: Readonly<{
    workspaceId: string;
    accountId: string;
    sourceSystem: string;
    currentSourceIdentityId: string;
    updatedAtUtc: string;
  }>): void {
    this.database
      .prepare(`UPDATE journal_account_source_identities
SET status = 'retained_previous', last_seen_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND source_system = ?
  AND source_identity_id <> ? AND status <> 'superseded'`)
      .run(
        input.updatedAtUtc,
        input.workspaceId,
        input.accountId,
        input.sourceSystem,
        input.currentSourceIdentityId,
      );
  }

  promoteAndTouchIdentity(sourceIdentityId: string, updatedAtUtc: string): void {
    assertCanonicalUuidV4(sourceIdentityId, "sourceIdentityId");
    assertCanonicalUtcTimestamp(updatedAtUtc, "updatedAtUtc");
    const result = this.database
      .prepare(`UPDATE journal_account_source_identities
SET status = 'active_current', last_seen_at_utc = ?
WHERE source_identity_id = ? AND status <> 'superseded'`)
      .run(updatedAtUtc, sourceIdentityId);
    if (result.changes !== 1) platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
  }
}
