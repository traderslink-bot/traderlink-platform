import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalAccountService } from "@/src/modules/journal/server/accounts/journal-account-service";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import { verifyPlatformDatabaseConnectionPragmas } from "../database/open-platform-database";
import {
  platformEmptyFoundationDomainTableNames,
  platformMigrationManifest,
} from "../database/platform-migration-manifest";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  isTraderLinkPlatformError,
  platformFailure,
} from "../database/platform-migration-contract";
import {
  readAppliedPlatformMigrations,
  requirePlatformForeignKeyCheck,
  requirePlatformQuickCheck,
} from "../database/platform-migration-registry";
import { calculatePlatformSchemaDigest } from "../database/platform-schema-digest";
import { verifyCompletedPlatformDatabase } from "../database/run-platform-migrations";
import { PlatformUserRepository } from "../identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "../identity/platform-workspace-repository";
import {
  DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
  DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
  requireDevelopmentOwnerSeedAuthorization,
  type DevelopmentOwnerSeedAuthorization,
} from "./development-owner-seed-authorization";
import type { DevelopmentOwnerSeedConfirmationAuthority } from "./development-owner-seed-confirmation";

export const DEVELOPMENT_OWNER_SEED_CONFIRMATION_ACTION =
  "confirm_development_owner_seed" as const;

export type DevelopmentOwnerSeedFacts = Readonly<{
  userDisplayName: string;
  workspaceDisplayName: string;
  defaultTradingTimezone: string;
  baseCurrency: string;
  journalAccountDisplayName: string;
}>;

type DevelopmentOwnerSeedFoundationState = Readonly<{
  rowCounts: Readonly<Record<string, number>>;
  expectedPostSchemaSha256: string;
  actualSchemaSha256: string;
  migrationHistorySha256: string;
}>;

export type DevelopmentOwnerSeedPreview = Readonly<{
  status: "confirmation_required";
  previewedAtUtc: string;
  internalIdentity: Readonly<{
    authProvider: typeof DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER;
    authSubjectRedacted: true;
    temporaryUntilPublicAuthentication: true;
  }>;
  proposedValues: DevelopmentOwnerSeedFacts;
  emptyFoundation: DevelopmentOwnerSeedFoundationState;
  confirmation: Readonly<{
    action: typeof DEVELOPMENT_OWNER_SEED_CONFIRMATION_ACTION;
    token: string;
    expiresAtUtc: string;
  }>;
}>;

export type DevelopmentOwnerSeedEvidence = Readonly<{
  status: "development_owner_seeded";
  completedAtUtc: string;
  identifiersRedacted: true;
  temporaryInternalIdentity: true;
  rowCounts: Readonly<Record<string, number>>;
  expectedPostSchemaSha256: string;
  actualSchemaSha256: string;
  migrationHistorySha256: string;
}>;

function validateDisplayName(value: string, field: string): void {
  if (value.trim() !== value || value.length < 1 || value.length > 120) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

function validateFacts(input: DevelopmentOwnerSeedFacts): DevelopmentOwnerSeedFacts {
  validateDisplayName(input.userDisplayName, "userDisplayName");
  validateDisplayName(input.workspaceDisplayName, "workspaceDisplayName");
  validateDisplayName(input.journalAccountDisplayName, "journalAccountDisplayName");
  if (
    input.defaultTradingTimezone.trim() !== input.defaultTradingTimezone ||
    input.defaultTradingTimezone.length < 1 ||
    input.defaultTradingTimezone.length > 64
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "defaultTradingTimezone",
    });
  }
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: input.defaultTradingTimezone,
    }).format(0);
  } catch {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "defaultTradingTimezone",
    });
  }
  if (
    input.baseCurrency.length !== 3 ||
    input.baseCurrency !== input.baseCurrency.toUpperCase() ||
    !Intl.supportedValuesOf("currency").includes(input.baseCurrency)
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "baseCurrency",
    });
  }
  return Object.freeze({ ...input });
}

function readDomainRowCounts(
  database: Database.Database,
): Readonly<Record<string, number>> {
  return Object.freeze(
    Object.fromEntries(
      platformEmptyFoundationDomainTableNames.map((tableName) => {
        const row = database
          .prepare<[], { count: number }>(`SELECT COUNT(*) AS count FROM ${tableName}`)
          .get();
        return [tableName, row?.count ?? -1];
      }),
    ),
  );
}

function requireEmptyFoundation(
  database: Database.Database,
): DevelopmentOwnerSeedFoundationState {
  verifyCompletedPlatformDatabase(database);
  verifyPlatformDatabaseConnectionPragmas(database);
  const migrations = readAppliedPlatformMigrations(database);
  if (migrations.length !== platformMigrationManifest.length) {
    platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_FAILED");
  }
  const rowCounts = readDomainRowCounts(database);
  if (Object.values(rowCounts).some((count) => count !== 0)) {
    platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_ALREADY_COMPLETED");
  }
  const expectedPostSchemaSha256 = migrations.at(-1)?.post_schema_sha256;
  const actualSchemaSha256 = calculatePlatformSchemaDigest(database);
  if (!expectedPostSchemaSha256 || expectedPostSchemaSha256 !== actualSchemaSha256) {
    platformFailure("TRADERLINK_PLATFORM_SCHEMA_MISMATCH");
  }
  const migrationHistorySha256 = createHash("sha256")
    .update(
      `${JSON.stringify(
        migrations.map((migration) => [
          migration.execution_order,
          migration.checksum_sha256,
          migration.post_schema_sha256,
        ]),
      )}\n`,
      "utf8",
    )
    .digest("hex");
  return Object.freeze({
    rowCounts,
    expectedPostSchemaSha256,
    actualSchemaSha256,
    migrationHistorySha256,
  });
}

function confirmationPayload(
  facts: DevelopmentOwnerSeedFacts,
  foundation: DevelopmentOwnerSeedFoundationState,
): string {
  return `${JSON.stringify([
    "traderlink-development-owner-seed-v1",
    DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
    DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
    facts.userDisplayName,
    facts.workspaceDisplayName,
    facts.defaultTradingTimezone,
    facts.baseCurrency,
    facts.journalAccountDisplayName,
    foundation.expectedPostSchemaSha256,
    foundation.actualSchemaSha256,
    foundation.migrationHistorySha256,
  ])}\n`;
}

function requireFinalCounts(
  database: Database.Database,
): Readonly<Record<string, number>> {
  const counts = readDomainRowCounts(database);
  const expected: Readonly<Record<string, number>> = Object.freeze({
    platform_users: 1,
    platform_workspaces: 1,
    platform_workspace_memberships: 1,
    journal_accounts: 1,
    journal_account_source_identities: 0,
  });
  if (
    Object.keys(expected).some((tableName) => counts[tableName] !== expected[tableName])
  ) {
    platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_FAILED");
  }
  return counts;
}

export function previewDevelopmentOwnerSeed(
  options: Readonly<{
    database: Database.Database;
    authorization: DevelopmentOwnerSeedAuthorization;
    confirmationAuthority: DevelopmentOwnerSeedConfirmationAuthority;
    facts: DevelopmentOwnerSeedFacts;
    now?: () => Date;
  }>,
): DevelopmentOwnerSeedPreview {
  requireDevelopmentOwnerSeedAuthorization(options.authorization);
  const facts = validateFacts(options.facts);
  const foundation = requireEmptyFoundation(options.database);
  const confirmation = options.confirmationAuthority.issue(
    confirmationPayload(facts, foundation),
  );
  return Object.freeze({
    status: "confirmation_required",
    previewedAtUtc: createCanonicalUtcTimestamp(options.now?.() ?? new Date()),
    internalIdentity: Object.freeze({
      authProvider: DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
      authSubjectRedacted: true,
      temporaryUntilPublicAuthentication: true,
    }),
    proposedValues: facts,
    emptyFoundation: foundation,
    confirmation: Object.freeze({
      action: DEVELOPMENT_OWNER_SEED_CONFIRMATION_ACTION,
      ...confirmation,
    }),
  });
}

export function confirmDevelopmentOwnerSeed(
  options: Readonly<{
    database: Database.Database;
    authorization: DevelopmentOwnerSeedAuthorization;
    confirmationAuthority: DevelopmentOwnerSeedConfirmationAuthority;
    facts: DevelopmentOwnerSeedFacts;
    confirmationAction: string;
    confirmationToken: string;
    now?: () => Date;
    createId?: () => string;
  }>,
): DevelopmentOwnerSeedEvidence {
  requireDevelopmentOwnerSeedAuthorization(options.authorization);
  if (options.confirmationAction !== DEVELOPMENT_OWNER_SEED_CONFIRMATION_ACTION) {
    platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIRMATION_INVALID");
  }
  if (options.database.inTransaction) {
    platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_FAILED");
  }
  const facts = validateFacts(options.facts);
  const now = options.now ?? (() => new Date());
  const createId = options.createId ?? createCanonicalUuidV4;

  try {
    return options.database
      .transaction(() => {
        const foundation = requireEmptyFoundation(options.database);
        if (
          !options.confirmationAuthority.verify(
            options.confirmationToken,
            confirmationPayload(facts, foundation),
          )
        ) {
          platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIRMATION_INVALID");
        }
        const timestamp = createCanonicalUtcTimestamp(now());
        const userId = createId();
        const workspaceId = createId();
        const accountId = createId();
        new PlatformUserRepository(options.database, {
          allowedAuthProviders: [DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER],
        }).createUser({
          userId,
          authProvider: DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
          authSubject: DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
          displayName: facts.userDisplayName,
          createdAtUtc: timestamp,
          updatedAtUtc: timestamp,
        });
        new PlatformWorkspaceRepository(
          options.database,
        ).insertWorkspaceWithOwnerInCurrentTransaction({
          workspaceId,
          ownerUserId: userId,
          displayName: facts.workspaceDisplayName,
          defaultTradingTimezone: facts.defaultTradingTimezone,
          createdAtUtc: timestamp,
        });
        const scope: WorkspaceAccessScope = Object.freeze({
          userId,
          workspaceId,
          workspaceRole: "owner",
          allowedAccountIds: Object.freeze([]),
          activeAccountId: null,
        });
        new JournalAccountService(
          new JournalAccountRepository(options.database),
        ).createAccount(scope, {
          accountId,
          workspaceId,
          displayName: facts.journalAccountDisplayName,
          baseCurrency: facts.baseCurrency,
          tradingTimezone: facts.defaultTradingTimezone,
          now: new Date(timestamp),
        });
        verifyCompletedPlatformDatabase(options.database);
        requirePlatformForeignKeyCheck(options.database);
        requirePlatformQuickCheck(options.database);
        const rowCounts = requireFinalCounts(options.database);
        return Object.freeze({
          status: "development_owner_seeded" as const,
          completedAtUtc: timestamp,
          identifiersRedacted: true as const,
          temporaryInternalIdentity: true as const,
          rowCounts,
          expectedPostSchemaSha256: foundation.expectedPostSchemaSha256,
          actualSchemaSha256: foundation.actualSchemaSha256,
          migrationHistorySha256: foundation.migrationHistorySha256,
        });
      })
      .immediate();
  } catch (error) {
    if (isTraderLinkPlatformError(error)) throw error;
    platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_FAILED", {}, error);
  }
}
