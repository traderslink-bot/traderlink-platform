import {
  assertCanonicalUuidV4,
  platformFailure,
} from "../server/database/platform-migration-contract";

export type WorkspaceRole = "owner" | "admin" | "member";

export type WorkspaceAccessScope = Readonly<{
  userId: string;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
  allowedAccountIds: readonly string[];
  activeAccountId: string | null;
}>;

export type AccountScope = Readonly<{
  userId: string;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
  accountId: string;
}>;

export function narrowWorkspaceAccessToAccount(
  scope: WorkspaceAccessScope,
  accountId: string,
): AccountScope {
  assertCanonicalUuidV4(accountId, "accountId");
  if (!scope.allowedAccountIds.includes(accountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return Object.freeze({
    userId: scope.userId,
    workspaceId: scope.workspaceId,
    workspaceRole: scope.workspaceRole,
    accountId,
  });
}
