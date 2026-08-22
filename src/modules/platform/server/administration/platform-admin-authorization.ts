import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

import {
  JOURNAL_ADMIN_PERMISSIONS,
  type JournalAdminScope,
} from "../../contracts/journal-admin-scope";
import {
  requireTraderLinkPlatformRequestIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "../authentication/require-platform-request-scope";
import { PlatformDiscordMembershipRepository } from "../authentication/platform-discord-membership-repository";
import {
  readProtectedInitialOwnerDiscordSubject,
  resolveTraderLinkDiscordGuildId,
} from "../authentication/platform-discord-configuration";
import { validateDevelopmentDashboardRequest } from "../authentication/development-dashboard-network-boundary";
import { withPlatformDatabase } from "../database/open-platform-database";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "../database/platform-migration-contract";
import { PlatformAdminAuditRepository } from "./platform-admin-audit-repository";
import { consumeJournalAdminRateLimit } from "./platform-admin-request-security";
import { PlatformOperatorRepository } from "./platform-operator-repository";

export const JOURNAL_ADMIN_DISCORD_FRESHNESS_MS = 5 * 60 * 1000;

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function requestCorrelationDigest(requestHeaders: Headers): string {
  const supplied = requestHeaders.get("x-request-id");
  const value = supplied && supplied.length <= 200 &&
    !/[\u0000-\u001f\u007f]/u.test(supplied)
    ? supplied
    : randomUUID();
  return digest(`traderlink-admin-request-v1\u001f${value}`);
}

function hasConfiguredDiscordOwnerIdentity(input: Readonly<{
  database: Database.Database;
  userId: string;
  ownerDiscordSubject: string | undefined;
}>): boolean {
  if (!input.ownerDiscordSubject) return false;
  return input.database.prepare<
    [string, string],
    Readonly<{ matches: 0 | 1 }>
  >(`SELECT EXISTS(
SELECT 1
FROM platform_auth_identities
WHERE user_id = ?
  AND auth_provider = 'discord'
  AND auth_subject = ?
) AS matches`).get(
    input.userId,
    input.ownerDiscordSubject,
  )?.matches === 1;
}

function deny(input: Readonly<{
  audit: PlatformAdminAuditRepository;
  identity: TraderLinkPlatformRequestIdentity;
  correlationRefSha256: string;
  nowUtc: string;
  reasonCode: string;
}>): never {
  input.audit.append({
    actorKind: "platform_user",
    actorUserId: input.identity.scope.userId,
    actorRole: "authenticated_user",
    action: "admin_access_denied",
    targetKind: "authority",
    targetRefSha256: digest("journal_administration"),
    outcome: "denied",
    reasonCode: input.reasonCode,
    correlationRefSha256: input.correlationRefSha256,
    previewReceiptSha256: null,
    details: Object.freeze({ boundary: "journal_administration" }),
    createdAtUtc: input.nowUtc,
  });
  platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
}

export class PlatformAdminAuthorization {
  constructor(
    private readonly database: Database.Database,
    private readonly environment: NodeJS.ProcessEnv = process.env,
    private readonly now: () => Date = () => new Date(),
  ) {}

  authorize(
    identity: TraderLinkPlatformRequestIdentity,
    requestHeaders: Headers,
  ): JournalAdminScope {
    const now = this.now();
    const nowUtc = createCanonicalUtcTimestamp(now);
    const correlationRefSha256 = requestCorrelationDigest(requestHeaders);
    const audit = new PlatformAdminAuditRepository(this.database);
    consumeJournalAdminRateLimit({
      category: "access",
      environment: this.environment,
      headers: requestHeaders,
      now: this.now,
      userId: identity.scope.userId,
    });

    if (identity.mode === "local_development") {
      if (!validateDevelopmentDashboardRequest(
        requestHeaders,
        this.environment,
      ).ok) {
        deny({
          audit,
          identity,
          correlationRefSha256,
          nowUtc,
          reasonCode: "development_boundary_invalid",
        });
      }
      audit.append({
        actorKind: "platform_user",
        actorUserId: identity.scope.userId,
        actorRole: "development_journal_owner_admin",
        action: "admin_access_allowed",
        targetKind: "authority",
        targetRefSha256: digest("journal_administration"),
        outcome: "success",
        reasonCode: "development_loopback_authorized",
        correlationRefSha256,
        previewReceiptSha256: null,
        details: Object.freeze({ mode: "local_development_owner" }),
        createdAtUtc: nowUtc,
      });
      return Object.freeze({
        userId: identity.scope.userId,
        role: "development_journal_owner_admin",
        mode: "local_development_owner",
        authorizedAtUtc: nowUtc,
        discordOwnerVerifiedAtUtc: null,
        permissions: JOURNAL_ADMIN_PERMISSIONS,
      });
    }

    const membership = new PlatformDiscordMembershipRepository(this.database)
      .findCurrent(
        identity.scope.userId,
        resolveTraderLinkDiscordGuildId(this.environment),
      );
    const membershipAge = membership
      ? now.getTime() - Date.parse(membership.lastVerifiedAtUtc)
      : Number.POSITIVE_INFINITY;
    const activeGrant = new PlatformOperatorRepository(this.database).findActive();
    const configuredOwnerMatched = hasConfiguredDiscordOwnerIdentity({
      database: this.database,
      userId: identity.scope.userId,
      ownerDiscordSubject: readProtectedInitialOwnerDiscordSubject(
        this.environment,
      ),
    });
    const discordServerOwnerMatched =
      identity.discord?.guildOwner === true && membership?.guildOwner === true;
    if (
      !membership ||
      !Number.isFinite(membershipAge) ||
      membershipAge < 0 ||
      membershipAge > JOURNAL_ADMIN_DISCORD_FRESHNESS_MS ||
      !activeGrant ||
      activeGrant.userId !== identity.scope.userId ||
      (!configuredOwnerMatched && !discordServerOwnerMatched)
    ) {
      deny({
        audit,
        identity,
        correlationRefSha256,
        nowUtc,
        reasonCode: !activeGrant
          ? "active_operator_grant_missing"
          : membershipAge > JOURNAL_ADMIN_DISCORD_FRESHNESS_MS
            ? "discord_owner_evidence_stale"
            : "owner_admin_authorization_failed",
      });
    }

    audit.append({
      actorKind: "platform_user",
      actorUserId: identity.scope.userId,
      actorRole: "journal_owner_admin",
      action: "admin_access_allowed",
      targetKind: "authority",
      targetRefSha256: digest("journal_administration"),
      outcome: "success",
      reasonCode: "discord_owner_and_grant_confirmed",
      correlationRefSha256,
      previewReceiptSha256: null,
      details: Object.freeze({ mode: "production_discord_owner" }),
      createdAtUtc: nowUtc,
    });
    return Object.freeze({
      userId: identity.scope.userId,
      role: "journal_owner_admin",
      mode: "production_discord_owner",
      authorizedAtUtc: nowUtc,
      discordOwnerVerifiedAtUtc: membership.lastVerifiedAtUtc,
      permissions: JOURNAL_ADMIN_PERMISSIONS,
    });
  }
}

export function requireJournalAdminScope(
  requestHeaders: Headers,
  options: Readonly<{
    environment?: NodeJS.ProcessEnv;
    databasePath?: string;
    forbiddenRepositoryRoots?: readonly string[];
    now?: () => Date;
  }> = {},
): JournalAdminScope {
  return withJournalAdminDatabase(
    requestHeaders,
    (_database, scope) => scope,
    options,
  );
}

export function withJournalAdminDatabase<T>(
  requestHeaders: Headers,
  operation: (
    database: Database.Database,
    scope: JournalAdminScope,
  ) => T,
  options: Readonly<{
    environment?: NodeJS.ProcessEnv;
    databasePath?: string;
    forbiddenRepositoryRoots?: readonly string[];
    now?: () => Date;
  }> = {},
): T {
  const environment = options.environment ?? process.env;
  const identity = requireTraderLinkPlatformRequestIdentity(requestHeaders, {
    environment,
    databasePath: options.databasePath,
    forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
    now: options.now,
  });
  return withPlatformDatabase(
    {
      environment,
      databasePath: options.databasePath,
      forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
      mode: "runtime",
    },
    (database) => {
      const scope = new PlatformAdminAuthorization(
        database,
        environment,
        options.now,
      ).authorize(identity, requestHeaders);
      return operation(database, scope);
    },
  );
}
