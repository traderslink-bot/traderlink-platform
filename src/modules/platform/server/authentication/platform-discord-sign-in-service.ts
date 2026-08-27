import type Database from "better-sqlite3";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalDemoAccountActivationService } from "@/src/modules/journal/server/demo/journal-demo-account-activation-service";
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
  emailAddress?: string | null;
  emailVerified?: boolean;
  guildId: string;
  roleIds: readonly string[];
  guildOwner: boolean;
  joinedAtUtc: string | null;
  sessionClientLabel?: string | null;
}>;

export type PlatformDiscordSignInResult = Readonly<{
  session: CreatedPlatformSession;
  userId: string;
  workspaceId: string;
  allowedAccountIds: readonly string[];
  displayName: string;
  demoAvailability: "materialized" | "not_applicable" | "unavailable";
  provisioned: boolean;
}>;

type PlatformDiscordIdentitySignInResult = Readonly<{
  displayName: string;
  provisioned: boolean;
  session: CreatedPlatformSession;
  userId: string;
  workspaceId: string;
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
      syncVerifiedDiscordEmail?: (input: Readonly<{
        emailAddress: string;
        timestamp: string;
        userId: string;
      }>) => void;
    }> = {},
  ) {}

  signIn(input: DiscordSignInFacts): PlatformDiscordSignInResult {
    try {
      const identity = this.database.transaction(() => this.signInIdentityLocked(input)).immediate();
      let demoAvailability: PlatformDiscordSignInResult["demoAvailability"] = "not_applicable";
      if (identity.provisioned) {
        const activation = new JournalDemoAccountActivationService(this.database, {
          createId: this.dependencies.createId,
          now: this.dependencies.now,
        }).activateForNewWorkspace({
          baseCurrency: this.dependencies.defaultBaseCurrency ?? "USD",
          tradingTimezone: this.dependencies.defaultTradingTimezone ?? "America/New_York",
          userId: identity.userId,
          workspaceId: identity.workspaceId,
        });
        demoAvailability = activation.state;
        if (activation.state === "unavailable") this.createFallbackJournalAccount(identity);
      }
      const activeAccounts = new JournalAccountRepository(this.database).listActiveAccounts(identity.workspaceId);
      if (activeAccounts.length < 1) platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
      return Object.freeze({
        session: identity.session,
        userId: identity.userId,
        workspaceId: identity.workspaceId,
        allowedAccountIds: Object.freeze(activeAccounts.map((account) => account.accountId)),
        displayName: identity.displayName,
        demoAvailability,
        provisioned: identity.provisioned,
      });
    } catch (error) {
      if (isTraderLinkPlatformError(error)) throw error;
      platformFailure("TRADERLINK_PUBLIC_IDENTITY_PROVISIONING_FAILED", {}, error);
    }
  }

  private signInIdentityLocked(input: DiscordSignInFacts): PlatformDiscordIdentitySignInResult {
    const now = this.dependencies.now?.() ?? new Date();
    const timestamp = createCanonicalUtcTimestamp(now);
    const createId = this.dependencies.createId ?? createCanonicalUuidV4;
    const displayName = resolveDisplayName(input);
    const identities = new PlatformAuthenticationRepository(this.database);
    const users = new PlatformUserRepository(this.database, {
      allowedAuthProviders: ["discord"],
    });
    const workspaces = new PlatformWorkspaceRepository(this.database);
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
    if (input.emailVerified === true && typeof input.emailAddress === "string") {
      this.dependencies.syncVerifiedDiscordEmail?.({
        emailAddress: input.emailAddress,
        timestamp,
        userId,
      });
    }
    identities.markAuthenticated({
      authProvider: "discord",
      authSubject: input.authSubject,
      timestamp,
    });
    const session = sessions.createForIdentity({
      userId,
      authProvider: "discord",
      authSubject: input.authSubject,
      clientLabel: input.sessionClientLabel,
    });
    return Object.freeze({
      session,
      userId,
      workspaceId,
      displayName,
      provisioned,
    });
  }

  private createFallbackJournalAccount(identity: PlatformDiscordIdentitySignInResult): void {
    const accounts = new JournalAccountRepository(this.database);
    accounts.immediate(() => {
      if (accounts.listActiveAccounts(identity.workspaceId).length > 0) return;
      const timestamp = createCanonicalUtcTimestamp(this.dependencies.now?.());
      accounts.createAccount({
        accountId: (this.dependencies.createId ?? createCanonicalUuidV4)(),
        workspaceId: identity.workspaceId,
        displayName: "Primary Journal",
        baseCurrency: this.dependencies.defaultBaseCurrency ?? "USD",
        tradingTimezone: this.dependencies.defaultTradingTimezone ?? "America/New_York",
        status: "active",
        createdByUserId: identity.userId,
        createdAtUtc: timestamp,
        updatedAtUtc: timestamp,
      });
    });
  }
}
