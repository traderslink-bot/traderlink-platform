import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";

export type PlatformOperatorGrant = Readonly<{
  operatorGrantId: string;
  userId: string;
  state: "active" | "revoked";
  grantedByKind: "bootstrap_console" | "operator";
  grantedByUserId: string | null;
  grantReceiptSha256: string;
  recoveryOfGrantId: string | null;
  grantedAtUtc: string;
  revokedAtUtc: string | null;
  updatedAtUtc: string;
}>;

type GrantRow = Readonly<{
  operator_grant_id: string;
  user_id: string;
  grant_state: "active" | "revoked";
  granted_by_kind: "bootstrap_console" | "operator";
  granted_by_user_id: string | null;
  grant_receipt_sha256: string;
  recovery_of_grant_id: string | null;
  granted_at_utc: string;
  revoked_at_utc: string | null;
  updated_at_utc: string;
}>;

function mapGrant(row: GrantRow): PlatformOperatorGrant {
  return Object.freeze({
    operatorGrantId: row.operator_grant_id,
    userId: row.user_id,
    state: row.grant_state,
    grantedByKind: row.granted_by_kind,
    grantedByUserId: row.granted_by_user_id,
    grantReceiptSha256: row.grant_receipt_sha256,
    recoveryOfGrantId: row.recovery_of_grant_id,
    grantedAtUtc: row.granted_at_utc,
    revokedAtUtc: row.revoked_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

const selectGrant = `SELECT operator_grant_id, user_id, grant_state,
 granted_by_kind, granted_by_user_id, grant_receipt_sha256,
 recovery_of_grant_id, granted_at_utc, revoked_at_utc, updated_at_utc
FROM platform_operator_grants`;

export class PlatformOperatorRepository {
  constructor(private readonly database: Database.Database) {}

  findActive(): PlatformOperatorGrant | null {
    const rows = this.database.prepare<[], GrantRow>(`${selectGrant}
WHERE authority_key = 'journal_administration' AND grant_state = 'active'
ORDER BY granted_at_utc, operator_grant_id`).all();
    if (rows.length > 1) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
    }
    return rows[0] ? mapGrant(rows[0]) : null;
  }

  findById(operatorGrantId: string): PlatformOperatorGrant | null {
    assertCanonicalUuidV4(operatorGrantId, "operatorGrantId");
    const row = this.database.prepare<[string], GrantRow>(`${selectGrant}
WHERE operator_grant_id = ?`).get(operatorGrantId);
    return row ? mapGrant(row) : null;
  }

  insert(input: Readonly<{
    operatorGrantId: string;
    userId: string;
    grantedByKind: "bootstrap_console" | "operator";
    grantedByUserId: string | null;
    grantReceiptSha256: string;
    recoveryOfGrantId: string | null;
    grantedAtUtc: string;
  }>): PlatformOperatorGrant {
    assertCanonicalUuidV4(input.operatorGrantId, "operatorGrantId");
    assertCanonicalUuidV4(input.userId, "userId");
    if (input.grantedByUserId !== null) {
      assertCanonicalUuidV4(input.grantedByUserId, "grantedByUserId");
    }
    if (input.recoveryOfGrantId !== null) {
      assertCanonicalUuidV4(input.recoveryOfGrantId, "recoveryOfGrantId");
    }
    assertCanonicalUtcTimestamp(input.grantedAtUtc, "grantedAtUtc");
    try {
      this.database.prepare(`INSERT INTO platform_operator_grants (
  operator_grant_id, user_id, authority_key, operator_role, grant_state,
  granted_by_kind, granted_by_user_id, grant_receipt_sha256,
  recovery_of_grant_id, granted_at_utc, revoked_by_kind, revoked_by_user_id,
  revoked_reason_code, revoked_at_utc, updated_at_utc
) VALUES (?, ?, 'journal_administration', 'journal_owner_admin', 'active',
  ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?)`)
        .run(
          input.operatorGrantId,
          input.userId,
          input.grantedByKind,
          input.grantedByUserId,
          input.grantReceiptSha256,
          input.recoveryOfGrantId,
          input.grantedAtUtc,
          input.grantedAtUtc,
        );
    } catch (error) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT", {}, error);
    }
    const inserted = this.findById(input.operatorGrantId);
    if (!inserted) platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
    return inserted;
  }

  revoke(input: Readonly<{
    operatorGrantId: string;
    revokedByKind: "bootstrap_console" | "operator";
    revokedByUserId: string | null;
    reasonCode: string;
    revokedAtUtc: string;
  }>): PlatformOperatorGrant {
    assertCanonicalUuidV4(input.operatorGrantId, "operatorGrantId");
    if (input.revokedByUserId !== null) {
      assertCanonicalUuidV4(input.revokedByUserId, "revokedByUserId");
    }
    assertCanonicalUtcTimestamp(input.revokedAtUtc, "revokedAtUtc");
    const result = this.database.prepare(`UPDATE platform_operator_grants SET
  grant_state = 'revoked', revoked_by_kind = ?, revoked_by_user_id = ?,
  revoked_reason_code = ?, revoked_at_utc = ?, updated_at_utc = ?
WHERE operator_grant_id = ? AND grant_state = 'active'`)
      .run(
        input.revokedByKind,
        input.revokedByUserId,
        input.reasonCode,
        input.revokedAtUtc,
        input.revokedAtUtc,
        input.operatorGrantId,
      );
    if (result.changes !== 1) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
    }
    const revoked = this.findById(input.operatorGrantId);
    if (!revoked) platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
    return revoked;
  }
}
