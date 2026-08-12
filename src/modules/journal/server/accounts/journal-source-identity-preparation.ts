import type Database from "better-sqlite3";

import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import {
  isLowercaseSha256,
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { readAppliedPlatformMigrations } from "@/src/modules/platform/server/database/platform-migration-registry";
import { verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";
import {
  type JournalImportSourceEvidence,
  type JournalImportSourceReadOptions,
  withPrivateJournalImportSource,
} from "../imports/journal-import-source-preview";
import {
  IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
  IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "./ibkr-source-account-canonicalizer";
import { JournalAccountRepository } from "./journal-account-repository";
import {
  JournalAccountService,
  loadAccountIdentityConfiguration,
} from "./journal-account-service";
import { deriveSoleDevelopmentOwnerJournalScope } from "./journal-development-owner-scope";

export const JOURNAL_SOURCE_IDENTITY_PREPARATION_ENABLE_ENV =
  "TRADERLINK_PLATFORM_ALLOW_JOURNAL_SOURCE_IDENTITY_PREPARATION" as const;
export const JOURNAL_SOURCE_IDENTITY_PREPARATION_ACTION =
  "prepare_journal_source_identity" as const;

const REQUIRED_MIGRATION_IDS = Object.freeze(
  platformMigrationManifest.map((migration) => migration.migrationId),
);

const SOURCE_SYSTEM = "ibkr" as const;
const PRIVACY_SAFE_SOURCE_DISPLAY = "Broker source";

export type TraderLinkJournalSourceIdentityPreparationResult = Readonly<{
  status: "journal_source_identity_prepared" | "journal_source_identity_already_prepared";
  identifiersRedacted: true;
  evidence: JournalImportSourceEvidence;
  migrationCount: number;
  activeDevelopmentOwnerCount: 1;
  activeWorkspaceCount: 1;
  activeJournalAccountCount: 1;
  nonSupersededSourceIdentityCount: 1;
  identityMutation: "created" | "none";
}>;

export type TraderLinkJournalSourceIdentityPreparationOptions =
  JournalImportSourceReadOptions & Readonly<{
    expectedEvidence: JournalImportSourceEvidence;
    environment?: NodeJS.ProcessEnv;
    databasePath?: string;
    forbiddenRepositoryRoots?: readonly string[];
    now?: () => Date;
    testHooks?: Readonly<{
      afterIdentityMutation?: () => void;
    }>;
  }>;

function authorizePreparation(environment: NodeJS.ProcessEnv): void {
  if (
    environment[JOURNAL_SOURCE_IDENTITY_PREPARATION_ENABLE_ENV] !== "1" ||
    environment.NODE_ENV === "production" ||
    environment.VERCEL_ENV === "production"
  ) {
    platformFailure(
      "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PREPARATION_AUTHORIZATION_REQUIRED",
    );
  }
}

function requireExpectedEvidence(
  actual: JournalImportSourceEvidence,
  expected: JournalImportSourceEvidence,
): void {
  if (
    !isLowercaseSha256(expected.sourceFileSha256) ||
    !isLowercaseSha256(expected.aggregatePreviewSha256) ||
    !Number.isSafeInteger(expected.sourceFileSizeBytes) ||
    expected.sourceFileSizeBytes < 1 ||
    actual.sourceFileSha256 !== expected.sourceFileSha256 ||
    actual.sourceFileSizeBytes !== expected.sourceFileSizeBytes ||
    actual.aggregatePreviewSha256 !== expected.aggregatePreviewSha256
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
      check: "accepted_preview_evidence",
    });
  }
}

function requireExactSixMigrationSchema(database: Database.Database): void {
  verifyCompletedPlatformDatabase(database);
  const appliedIds = readAppliedPlatformMigrations(database).map(
    (row) => row.migration_id,
  );
  if (
    JSON.stringify(appliedIds) !== JSON.stringify(REQUIRED_MIGRATION_IDS)
  ) {
    platformFailure("TRADERLINK_PLATFORM_SCHEMA_MISMATCH", {
      check: "journal_source_identity_migration_boundary",
    });
  }
}

function prepareWithinImmediateTransaction(
  database: Database.Database,
  options: TraderLinkJournalSourceIdentityPreparationOptions,
  rawSourceAccountId: string,
): Omit<TraderLinkJournalSourceIdentityPreparationResult, "evidence"> {
  requireExactSixMigrationSchema(database);
  const repository = new JournalAccountRepository(database);
  const { scope } = deriveSoleDevelopmentOwnerJournalScope(
    database,
    repository,
  );
  const accountId = scope.allowedAccountIds[0];
  if (!accountId) {
    platformFailure("TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED", {
      check: "active_journal_account_cardinality",
    });
  }
  const identityConfiguration = loadAccountIdentityConfiguration(
    options.environment,
    IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
    IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
  );
  const service = new JournalAccountService(repository, identityConfiguration);
  const existing = repository.listNonSupersededSourceIdentities(
    scope.workspaceId,
    SOURCE_SYSTEM,
  );
  if (existing.length > 1) {
    platformFailure("TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED", {
      check: "source_identity_cardinality",
    });
  }
  if (existing.some((identity) => identity.accountId !== accountId)) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
  }

  let identityMutation: "created" | "none";
  if (existing.length === 0) {
    service.confirmSourceIdentityLinkRecord(scope, {
      accountId,
      sourceSystem: SOURCE_SYSTEM,
      rawSourceAccountId,
      privacySafeDisplay: PRIVACY_SAFE_SOURCE_DISPLAY,
      now: options.now?.(),
    });
    identityMutation = "created";
    options.testHooks?.afterIdentityMutation?.();
  } else {
    const target = service.inspectSourceAccountIdentity(scope, {
      sourceSystem: SOURCE_SYSTEM,
      rawSourceAccountId,
    });
    if (target.accountId !== accountId) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
    }
    identityMutation = "none";
  }

  const finalIdentities = repository.listNonSupersededSourceIdentities(
    scope.workspaceId,
    SOURCE_SYSTEM,
  );
  if (
    finalIdentities.length !== 1 ||
    finalIdentities[0]?.accountId !== accountId
  ) {
    platformFailure("TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED", {
      check: "source_identity_postcondition",
    });
  }
  const finalTarget = service.inspectSourceAccountIdentity(scope, {
    sourceSystem: SOURCE_SYSTEM,
    rawSourceAccountId,
  });
  if (finalTarget.accountId !== accountId) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
  }
  return Object.freeze({
    status:
      identityMutation === "created"
        ? "journal_source_identity_prepared" as const
        : "journal_source_identity_already_prepared" as const,
    identifiersRedacted: true as const,
    migrationCount: REQUIRED_MIGRATION_IDS.length,
    activeDevelopmentOwnerCount: 1 as const,
    activeWorkspaceCount: 1 as const,
    activeJournalAccountCount: 1 as const,
    nonSupersededSourceIdentityCount: 1 as const,
    identityMutation,
  });
}

export function prepareTraderLinkPlatformJournalSourceIdentity(
  options: TraderLinkJournalSourceIdentityPreparationOptions,
): TraderLinkJournalSourceIdentityPreparationResult {
  const environment = options.environment ?? process.env;
  authorizePreparation(environment);
  return withPrivateJournalImportSource(
    {
      sourcePath: options.sourcePath,
      sourceTimezone: options.sourceTimezone,
      expectedSourceFileSha256: options.expectedEvidence.sourceFileSha256,
      expectedSourceFileSizeBytes: options.expectedEvidence.sourceFileSizeBytes,
      additionalForbiddenRepositoryRoot:
        options.additionalForbiddenRepositoryRoot,
    },
    (source) => {
      requireExpectedEvidence(source.evidence, options.expectedEvidence);
      if (
        !source.privatePreview.rawSourceAccountId ||
        !source.aggregatePreview.canCommit
      ) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
          reason: "blocking_preview_issue",
        });
      }
      let database: Database.Database;
      try {
        database = openPlatformDatabase({
          mode: "runtime",
          databasePath: options.databasePath,
          environment,
          forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
        });
      } catch (error) {
        if (isTraderLinkPlatformError(error)) throw error;
        platformFailure(
          "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PREPARATION_FAILED",
          {},
          error,
        );
      }
      try {
        if (database.inTransaction) {
          platformFailure(
            "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PREPARATION_FAILED",
          );
        }
        const result = database
          .transaction(() => prepareWithinImmediateTransaction(
            database,
            options,
            source.privatePreview.rawSourceAccountId as string,
          ))
          .immediate();
        return Object.freeze({
          ...result,
          evidence: source.evidence,
        });
      } catch (error) {
        if (isTraderLinkPlatformError(error)) throw error;
        platformFailure(
          "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PREPARATION_FAILED",
          {},
          error,
        );
      } finally {
        database.close();
      }
    },
  );
}
