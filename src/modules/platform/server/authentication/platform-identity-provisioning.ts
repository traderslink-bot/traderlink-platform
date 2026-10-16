import type Database from "better-sqlite3";
import { createCanonicalUuidV4, platformFailure } from "../database/platform-migration-contract";
import { PlatformUserRepository } from "../identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "../identity/platform-workspace-repository";
import { PlatformAuthenticationRepository } from "./platform-authentication-repository";

/** Called only after provider verification, inside the caller's immediate transaction. */
export function provisionVerifiedPlatformIdentity(database: Database.Database, input: Readonly<{
  authProvider: "discord" | "google" | "email";
  authSubject: string;
  displayName: string;
  timestamp: string;
  protectedInitialOwnerAuthSubject?: string;
  defaultTradingTimezone?: string;
  createId?: () => string;
}>) {
  if (!database.inTransaction) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "identityTransaction" });
  if (!["discord", "google", "email"].includes(input.authProvider)) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  const users = new PlatformUserRepository(database, { allowedAuthProviders: [input.authProvider] });
  const workspaces = new PlatformWorkspaceRepository(database);
  const identities = new PlatformAuthenticationRepository(database);
  const identity = identities.findActiveIdentity(input.authProvider, input.authSubject);
  if (identity) {
    const user = users.findById(identity.userId);
    if (!user || user.status !== "active") platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    const active = workspaces.listActiveMembershipsForUser(identity.userId);
    if (active.length !== 1 || !active[0]) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    users.updateActiveDisplayName({ userId: identity.userId, displayName: input.displayName, updatedAtUtc: input.timestamp });
    return Object.freeze({ userId: identity.userId, workspaceId: active[0].workspaceId, provisioned: false });
  }
  if (input.authProvider === "discord" && input.protectedInitialOwnerAuthSubject === input.authSubject) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_REQUIRED");
  }
  const createId = input.createId ?? createCanonicalUuidV4;
  const userId = createId();
  const workspaceId = createId();
  users.createUser({ userId, authProvider: input.authProvider, authSubject: input.authSubject,
    displayName: input.displayName, createdAtUtc: input.timestamp, updatedAtUtc: input.timestamp });
  identities.linkIdentity({ userId, authProvider: input.authProvider, authSubject: input.authSubject,
    linkedByUserId: userId, timestamp: input.timestamp });
  workspaces.insertWorkspaceWithOwnerInCurrentTransaction({ workspaceId, ownerUserId: userId,
    displayName: "My Workspace", defaultTradingTimezone: input.defaultTradingTimezone ?? "America/New_York", createdAtUtc: input.timestamp });
  return Object.freeze({ userId, workspaceId, provisioned: true });
}
