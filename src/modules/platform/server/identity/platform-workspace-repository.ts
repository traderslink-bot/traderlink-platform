import type Database from "better-sqlite3";

import type { WorkspaceRole } from "../../contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";

export type PlatformWorkspaceMembershipRecord = Readonly<{
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: "active" | "suspended";
  createdByUserId: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

type MembershipRow = Readonly<{
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  status: "active" | "suspended";
  created_by_user_id: string;
  created_at_utc: string;
  updated_at_utc: string;
}>;

function mapMembership(row: MembershipRow): PlatformWorkspaceMembershipRecord {
  return Object.freeze({
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

export class PlatformWorkspaceRepository {
  constructor(private readonly database: Database.Database) {}

  private validateWorkspaceWithOwnerInput(input: Readonly<{
    workspaceId: string;
    ownerUserId: string;
    displayName: string;
    defaultTradingTimezone: string;
    createdAtUtc: string;
  }>): void {
    assertCanonicalUuidV4(input.workspaceId, "workspaceId");
    assertCanonicalUuidV4(input.ownerUserId, "ownerUserId");
    assertCanonicalUtcTimestamp(input.createdAtUtc, "createdAtUtc");
    if (
      input.displayName.trim().length < 1 ||
      input.displayName.trim().length > 120 ||
      input.defaultTradingTimezone.trim().length < 1 ||
      input.defaultTradingTimezone.trim().length > 64
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    }
  }

  createWorkspaceWithOwner(input: Readonly<{
    workspaceId: string;
    ownerUserId: string;
    displayName: string;
    defaultTradingTimezone: string;
    createdAtUtc: string;
  }>): void {
    this.validateWorkspaceWithOwnerInput(input);
    const operation = this.database.transaction(() => {
      this.insertWorkspaceWithOwnerInCurrentTransaction(input);
    });
    operation.immediate();
  }

  insertWorkspaceWithOwnerInCurrentTransaction(input: Readonly<{
    workspaceId: string;
    ownerUserId: string;
    displayName: string;
    defaultTradingTimezone: string;
    createdAtUtc: string;
  }>): void {
    this.validateWorkspaceWithOwnerInput(input);
    if (!this.database.inTransaction) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "active_transaction_required",
      });
    }
    this.database
      .prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'active', ?, ?)`)
      .run(
        input.workspaceId,
        input.displayName,
        input.defaultTradingTimezone,
        input.createdAtUtc,
        input.createdAtUtc,
      );
    this.insertMembership({
      workspaceId: input.workspaceId,
      userId: input.ownerUserId,
      role: "owner",
      createdByUserId: input.ownerUserId,
      createdAtUtc: input.createdAtUtc,
    });
  }

  insertMembership(input: Readonly<{
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
    createdByUserId: string;
    createdAtUtc: string;
  }>): void {
    assertCanonicalUuidV4(input.workspaceId, "workspaceId");
    assertCanonicalUuidV4(input.userId, "userId");
    assertCanonicalUuidV4(input.createdByUserId, "createdByUserId");
    assertCanonicalUtcTimestamp(input.createdAtUtc, "createdAtUtc");
    this.database
      .prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'active', ?, ?, ?)`)
      .run(
        input.workspaceId,
        input.userId,
        input.role,
        input.createdByUserId,
        input.createdAtUtc,
        input.createdAtUtc,
      );
  }

  listActiveMembershipsForUser(
    userId: string,
  ): readonly PlatformWorkspaceMembershipRecord[] {
    assertCanonicalUuidV4(userId, "userId");
    return this.database
      .prepare<[string], MembershipRow>(`SELECT *
FROM platform_workspace_memberships
WHERE user_id = ? AND status = 'active'
ORDER BY workspace_id`)
      .all(userId)
      .map(mapMembership);
  }

  findActiveMembership(
    workspaceId: string,
    userId: string,
  ): PlatformWorkspaceMembershipRecord | null {
    assertCanonicalUuidV4(workspaceId, "workspaceId");
    assertCanonicalUuidV4(userId, "userId");
    const row = this.database
      .prepare<[string, string], MembershipRow>(`SELECT *
FROM platform_workspace_memberships
WHERE workspace_id = ? AND user_id = ? AND status = 'active'`)
      .get(workspaceId, userId);
    return row ? mapMembership(row) : null;
  }

  transferActiveOwner(input: Readonly<{
    workspaceId: string;
    currentOwnerUserId: string;
    nextOwnerUserId: string;
    updatedAtUtc: string;
  }>): void {
    for (const [field, value] of Object.entries(input)) {
      if (field !== "updatedAtUtc") assertCanonicalUuidV4(value, field);
    }
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "updatedAtUtc");
    const operation = this.database.transaction(() => {
      const current = this.findActiveMembership(
        input.workspaceId,
        input.currentOwnerUserId,
      );
      const next = this.findActiveMembership(input.workspaceId, input.nextOwnerUserId);
      if (current?.role !== "owner" || !next) {
        platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      }
      this.database
        .prepare(`UPDATE platform_workspace_memberships
SET role = 'admin', updated_at_utc = ?
WHERE workspace_id = ? AND user_id = ? AND role = 'owner' AND status = 'active'`)
        .run(input.updatedAtUtc, input.workspaceId, input.currentOwnerUserId);
      this.database
        .prepare(`UPDATE platform_workspace_memberships
SET role = 'owner', updated_at_utc = ?
WHERE workspace_id = ? AND user_id = ? AND status = 'active'`)
        .run(input.updatedAtUtc, input.workspaceId, input.nextOwnerUserId);
    });
    operation.immediate();
  }
}
