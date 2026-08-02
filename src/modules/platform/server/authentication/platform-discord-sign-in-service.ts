import type Database from "better-sqlite3";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  isTraderLinkPlatformError,
  platformFailure,
} from "../database/platform-migration-contract";
import { PlatformUserRepository } from "../identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "../identity/platform-workspace-repository";
import { PlatformAuthenticationRepository } from "./platform-authentication-repository";
import { PlatformDiscordMembershipRepository } from "./platform-discord-membership-repository";
import { PlatformSessionRepository } from "./platform-session-repository";
import {
  PlatformSessionService,
  type CreatedPlatformSession,
} from "./platform-session-service";

export type DiscordSignInFacts = Readonly<{
  authSubject: string;
  username: string;
  globalDisplayName: string | null;
  avatarHash: string | null;
  guildId: string;
  roleIds: readonly string[];
  guildOwner: boolean;
  joinedAtUtc: string | null;
}>;

export type PlatformDiscordSignInResult = Readonly<{
  session: CreatedPlatformSession;
  userId: string;
  workspaceId: string;
  allowedAccountIds: readonly string[];
  displayName: string;
  provisioned: boolean;
}>;

function canonicalOptionalTimestamp(value: string | null): string | null {
  if (value === null) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    platformFailure("TRADERLINK_DISCORD_MEMBERSHIP_INVALID", {
      field: "joinedAtUtc",
    });
  }
  return createCanonicalUtcTimestamp(parsed);
}

function resolveDisplayName(input: DiscordSignInFacts): string {
  const value = (input.globalDisplayName ?? input.username).normalize("NFKC").trim();
  if (
    value.length < 1 ||
    value.length > 120 ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    platformFailure("TRADERLINK_DISCORD_MEMBERSHIP_INVALID", {
      field: "displayName",
    });
  }
  return value;
}

export class PlatformDiscordSignInService {
  constructor(
    private readonly database: Database.Database,
    private readonly dependencies: Readonly<{
      now?: () => Date;
      createId?: () => string;
      createToken?: () => string;
      defaultTradingTimezone?: string;
      defaultBaseCurrency?: string;
      protectedInitialOwnerAuthSubject?: string;
    }> = {},
  ) {}

  signIn(input: DiscordSignInFacts): PlatformDiscordSignInResult {
    const operation = this.database.transaction(() => this.signInLocked(input));
    try {
      return operation.immediate();
    } catch (error) {
      if (isTraderLinkPlatformError(error)) throw error;
      platformFailure("TRADERLINK_PUBLIC_IDENTITY_PROVISIONING_FAILED", {}, error);
    }
  }

  private signInLocked(input: DiscordSignInFacts): PlatformDiscordSignInResult {
    const now = this.dependencies.now?.() ?? new Date();
    const timestamp = createCanonicalUtcTimestamp(now);
    const createId = this.dependencies.createId ?? createCanonicalUuidV4;
    const displayName = resolveDisplayName(input);
    const identities = new PlatformAuthenticationRepository(this.database);
    const users = new PlatformUserRepository(this.database, {
      allowedAuthProviders: ["discord"],
    });
    const workspaces = new PlatformWorkspaceRepository(this.database);
    const accounts = new JournalAccountRepository(this.database);
    const memberships = new PlatformDiscordMembershipRepository(this.database);
    const sessions = new PlatformSessionService(
      new PlatformSessionRepository(this.database),
      {
        now: () => now,
        createId,
        createToken: this.dependencies.createToken,
      },
    );

    let identity = identities.findActiveIdentity("discord", input.authSubject);
    let userId: string;
    let workspaceId: string;
    let provisioned = false;

    if (identity) {
      userId = identity.userId;
      const user = users.findById(userId);
      if (!user || user.status !== "active") {
        platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      }
      users.updateActiveDisplayName({ userId, displayName, updatedAtUtc: timestamp });
      const activeMemberships = workspaces.listActiveMembershipsForUser(userId);
      if (activeMemberships.length !== 1 || !activeMemberships[0]) {
        platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      }
      workspaceId = activeMemberships[0].workspaceId;
    } else {
      if (
        this.dependencies.protectedInitialOwnerAuthSubject === input.authSubject
      ) {
        platformFailure("TRADERLINK_INITIAL_OWNER_LINK_REQUIRED");
      }
      provisioned = true;
      userId = createId();
      workspaceId = createId();
      const accountId = createId();
      users.createUser({
        userId,
        authProvider: "discord",
        authSubject: input.authSubject,
        displayName,
        createdAtUtc: timestamp,
        updatedAtUtc: timestamp,
      });
      identity = identities.linkIdentity({
        userId,
        authProvider: "discord",
        authSubject: input.authSubject,
        linkedByUserId: userId,
        timestamp,
      });
      workspaces.insertWorkspaceWithOwnerInCurrentTransaction({
        workspaceId,
        ownerUserId: userId,
        displayName: "My Workspace",
        defaultTradingTimezone:
          this.dependencies.defaultTradingTimezone ?? "America/New_York",
        createdAtUtc: timestamp,
      });
      accounts.createAccount({
        accountId,
        workspaceId,
        displayName: "Primary Journal",
        baseCurrency: this.dependencies.defaultBaseCurrency ?? "USD",
        tradingTimezone:
          this.dependencies.defaultTradingTimezone ?? "America/New_York",
        status: "active",
        createdByUserId: userId,
        createdAtUtc: timestamp,
        updatedAtUtc: timestamp,
      });
    }

    memberships.upsertCurrent({
      userId,
      guildId: input.guildId,
      username: input.username,
      globalDisplayName: input.globalDisplayName,
      avatarHash: input.avatarHash,
      roleIds: input.roleIds,
      guildOwner: input.guildOwner,
      joinedAtUtc: canonicalOptionalTimestamp(input.joinedAtUtc),
      verifiedAtUtc: timestamp,
    });
    identities.markAuthenticated({
      authProvider: "discord",
      authSubject: input.authSubject,
      timestamp,
    });
    const activeAccounts = accounts.listActiveAccounts(workspaceId);
    if (activeAccounts.length < 1) {
      platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
    }
    const session = sessions.createForIdentity({
      userId,
      authProvider: "discord",
      authSubject: input.authSubject,
    });
    return Object.freeze({
      session,
      userId,
      workspaceId,
      allowedAccountIds: Object.freeze(
        activeAccounts.map((account) => account.accountId),
      ),
      displayName,
      provisioned,
    });
  }
}
