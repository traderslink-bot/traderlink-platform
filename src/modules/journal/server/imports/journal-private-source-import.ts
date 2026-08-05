import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { IbkrActivityStatementPreview } from "../../contracts/journal-import-contracts";
import { JournalAccountRepository } from "../accounts/journal-account-repository";
import {
  JournalAccountService,
  loadAccountIdentityConfiguration,
} from "../accounts/journal-account-service";
import {
  IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
  IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "../accounts/ibkr-source-account-canonicalizer";
import { deriveSoleDevelopmentOwnerJournalScope } from "../accounts/journal-development-owner-scope";
import { JournalDataDecisionRepository } from "../decisions/journal-data-decision-repository";
import { JournalDataDecisionService } from "../decisions/journal-data-decision-service";
import { JournalExecutionRepository } from "../executions/journal-execution-repository";
import { JournalExecutionService } from "../executions/journal-execution-service";
import { JournalIntegrityCommandService } from "../journal-integrity-command-service";
import { JournalRoundTripRepository } from "../round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "../round-trips/journal-round-trip-service";
import { JournalExecutionReconciliationRepository } from "../reconciliation/journal-execution-reconciliation-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import {
  isLowercaseSha256,
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { readAppliedPlatformMigrations } from "@/src/modules/platform/server/database/platform-migration-registry";
import { verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";
import {
  promoteJournalEvidenceObject,
  resolveJournalEvidenceVaultBoundary,
  type JournalEvidenceVaultPromotion,
  type JournalEvidenceVaultTestHooks,
} from "./journal-evidence-vault";
import { JournalImportRepository } from "./journal-import-repository";
import {
  createJournalPrivacyDigester,
  JournalImportService,
  loadJournalPrivacyHmacConfiguration,
} from "./journal-import-service";
import {
  type JournalImportSourceEvidence,
  type JournalImportSourceReadOptions,
  withPrivateJournalImportSource,
} from "./journal-import-source-preview";

export const JOURNAL_SOURCE_IMPORT_ENABLE_ENV =
  "TRADERLINK_PLATFORM_ALLOW_JOURNAL_SOURCE_IMPORT" as const;
export const JOURNAL_SOURCE_IMPORT_ACTION = "import_journal_source" as const;

const REQUIRED_MIGRATION_IDS = Object.freeze(
  platformMigrationManifest.map((migration) => migration.migrationId),
);

export const ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE = Object.freeze({
  preservedRowCount: 2_284,
  mappedExecutionCount: 1_072,
  mappedPositionSourceRowCount: 116,
  mappedPositionFactCount: 231,
  unsupportedRowCount: 542,
});

export type TraderLinkJournalSourceImportResult = Readonly<{
  status:
    | "journal_source_import_committed_verification_required"
    | "journal_source_already_imported";
  identifiersRedacted: true;
  evidence: JournalImportSourceEvidence & Readonly<{
    evidenceObjectKey: string;
    scopedPreviewSha256: string;
  }>;
  vaultObjectStatus: "created" | "already_present";
  migrationCount: number;
  workspaceId: string;
  accountId: string;
  importBatchId: string;
  importEventId: string;
  preservedRowCount: number;
  createdExecutionCount: number;
  matchedExecutionCount: number;
  pendingSourceDecisionCount: number;
  relatedDecisionCount: number;
  rebuildCount: number;
  roundTripProjectionCounts: Readonly<{
    readyClosed: number;
    legitimateOpen: number;
    needsDecision: number;
  }>;
  postImportVerification: "required";
}>;

export type TraderLinkJournalSourceImportOptions =
  JournalImportSourceReadOptions & Readonly<{
    confirmationAction: typeof JOURNAL_SOURCE_IMPORT_ACTION;
    expectedEvidence: JournalImportSourceEvidence;
    environment?: NodeJS.ProcessEnv;
    databasePath?: string;
    forbiddenRepositoryRoots?: readonly string[];
    protectedStorageRoots?: readonly string[];
    now?: () => Date;
    vaultTestHooks?: JournalEvidenceVaultTestHooks;
    testHooks?: Readonly<{
      afterVaultPromotion?: () => void;
      afterDatabaseMutationBeforeCommit?: () => void;
    }>;
  }>;

function sha256Json(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("hex");
}

function authorizeImport(
  environment: NodeJS.ProcessEnv,
  confirmationAction: string,
): void {
  if (
    confirmationAction !== JOURNAL_SOURCE_IMPORT_ACTION ||
    environment[JOURNAL_SOURCE_IMPORT_ENABLE_ENV] !== "1" ||
    environment.NODE_ENV !== "development" ||
    environment.VERCEL_ENV === "production"
  ) {
    platformFailure("TRADERLINK_JOURNAL_SOURCE_IMPORT_AUTHORIZATION_REQUIRED");
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
      check: "journal_source_import_migration_boundary",
    });
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
      check: "confirmed_import_evidence",
    });
  }
}

function requireScopedPreviewConsistency(
  preview: ReturnType<JournalImportService["previewIbkrForWorkspace"]>,
): void {
  const classificationTotal = Object.values(preview.rowsByClassification)
    .reduce((total, count) => total + count, 0);
  const plannedExecutionTotal =
    preview.plannedNewExecutionCount + preview.plannedMatchedExecutionCount;
  if (
    !preview.canCommit ||
    preview.preservedRowCount !==
      ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE.preservedRowCount ||
    preview.mappedExecutionCount !==
      ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE.mappedExecutionCount ||
    preview.mappedPositionFactCount !==
      ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE.mappedPositionFactCount ||
    preview.rowsByClassification.mapped_position_fact !==
      ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE.mappedPositionSourceRowCount ||
    preview.unsupportedRowCount !==
      ACCEPTED_DEVELOPMENT_OWNER_SOURCE_BASELINE.unsupportedRowCount ||
    classificationTotal !== preview.preservedRowCount ||
    preview.rowsByClassification.mapped_execution !== preview.mappedExecutionCount ||
    (!preview.exactReimport && plannedExecutionTotal !== preview.mappedExecutionCount) ||
    (preview.exactReimport &&
      (preview.existingImportBatchId === null ||
        preview.plannedNewExecutionCount !== 0 ||
        preview.plannedAmbiguousExecutionCount !== 0))
  ) {
    platformFailure("TRADERLINK_JOURNAL_SOURCE_IMPORT_PRECONDITION_FAILED", {
      check: "scoped_preview_count_gate",
    });
  }
}

function normalizedSectionName(value: string | null): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/gu, "");
}

export function verifyAcceptedDevelopmentOwnerSourceBaseline(
  preview: IbkrActivityStatementPreview,
): void {
  const markToMarketRows = preview.rows.filter((row) =>
    normalizedSectionName(row.sectionName) ===
      "marktomarketperformancesummary" &&
    row.classification === "mapped_position_fact");
  const openPositionRows = preview.rows.filter((row) =>
    normalizedSectionName(row.sectionName) === "openpositions" &&
    row.classification === "mapped_position_fact");
  const duplicateOccurrences = preview.rows.filter((row) =>
    row.occurrenceOrdinal > 1);
  const stockPositionSymbols = new Set(preview.positionFacts.map((fact) =>
    fact.normalizedSymbol));
  if (
    preview.rows.length !== 2_284 ||
    preview.executions.length !== 1_072 ||
    preview.rows.filter((row) => row.classification === "unsupported").length !==
      542 ||
    preview.rows.length - preview.executions.length - 542 !== 670 ||
    markToMarketRows.length !== 115 ||
    openPositionRows.length !== 1 ||
    preview.positionFacts.filter((fact) => fact.factKind === "opening_balance")
      .length !== 115 ||
    preview.positionFacts.filter((fact) => fact.factKind === "closing_balance")
      .length !== 115 ||
    preview.positionFacts.filter((fact) => fact.factKind === "open_position")
      .length !== 1 ||
    stockPositionSymbols.size !== 113 ||
    duplicateOccurrences.length !== 1 ||
    duplicateOccurrences[0]?.occurrenceOrdinal !== 2
  ) {
    platformFailure("TRADERLINK_JOURNAL_SOURCE_IMPORT_PRECONDITION_FAILED", {
      check: "accepted_private_source_parse_baseline",
    });
  }
}

function createCommandBoundary(
  database: Database.Database,
  environment: NodeJS.ProcessEnv,
): Readonly<{
  accounts: JournalAccountService;
  imports: JournalImportRepository;
  importService: JournalImportService;
  command: JournalIntegrityCommandService;
}> {
  const accountRepository = new JournalAccountRepository(database);
  const accounts = new JournalAccountService(
    accountRepository,
    loadAccountIdentityConfiguration(
      environment,
      IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
      IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
    ),
  );
  const imports = new JournalImportRepository(database);
  const executions = new JournalExecutionRepository(database);
  const importService = new JournalImportService(
    imports,
    executions,
    accounts,
    createJournalPrivacyDigester(
      loadJournalPrivacyHmacConfiguration(environment),
    ),
    new JournalExecutionReconciliationRepository(database),
  );
  const roundTrips = new JournalRoundTripService(
    new JournalRoundTripRepository(database),
  );
  const decisions = new JournalDataDecisionService(
    new JournalDataDecisionRepository(database),
    imports,
    importService,
    executions,
    new JournalExecutionService(executions),
    roundTrips,
    new JournalExecutionReconciliationRepository(database),
  );
  return Object.freeze({
    accounts,
    imports,
    importService,
    command: new JournalIntegrityCommandService(
      imports,
      importService,
      decisions,
      roundTrips,
    ),
  });
}

function importTraderLinkPlatformJournalSourceInternal(
  options: TraderLinkJournalSourceImportOptions,
): TraderLinkJournalSourceImportResult {
  const environment = options.environment ?? process.env;
  authorizeImport(environment, options.confirmationAction);
  const databasePath = options.databasePath ?? resolvePlatformDatabaseConfig({
    environment,
    forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
  }).databasePath;
  const vaultBoundary = resolveJournalEvidenceVaultBoundary({
    sourcePath: options.sourcePath,
    databasePath,
    environment,
    additionalForbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
    protectedStorageRoots: options.protectedStorageRoots,
  });
  let promotion: JournalEvidenceVaultPromotion | null = null;
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
      verifyAcceptedDevelopmentOwnerSourceBaseline(source.privatePreview);
      let database: Database.Database | null = null;
      try {
        database = openPlatformDatabase({
          mode: "runtime",
          databasePath,
          environment,
          forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
        });
        return database.transaction(() => {
          requireExactSixMigrationSchema(database as Database.Database);
          const boundary = createCommandBoundary(
            database as Database.Database,
            environment,
          );
          const owner = deriveSoleDevelopmentOwnerJournalScope(
            database as Database.Database,
          );
          const identities = new JournalAccountRepository(
            database as Database.Database,
          ).listNonSupersededSourceIdentities(owner.scope.workspaceId, "ibkr");
          if (
            identities.length !== 1 ||
            identities[0]?.accountId !== owner.accountId ||
            !source.privatePreview.rawSourceAccountId
          ) {
            platformFailure("TRADERLINK_JOURNAL_SOURCE_IMPORT_PRECONDITION_FAILED", {
              check: "prepared_source_identity_cardinality",
            });
          }
          const identityTarget = boundary.accounts.inspectSourceAccountIdentity(
            owner.scope,
            {
              sourceSystem: "ibkr",
              rawSourceAccountId: source.privatePreview.rawSourceAccountId,
            },
          );
          if (identityTarget.accountId !== owner.accountId) {
            platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
          }
          const scopedPreview = boundary.importService.previewIbkrForWorkspace(
            owner.scope,
            {
              sourceBytes: source.sourceBytes,
              sourceTimezone: options.sourceTimezone,
            },
          );
          requireScopedPreviewConsistency(scopedPreview);
          if (
            scopedPreview.accountId !== owner.accountId ||
            scopedPreview.sourceFileSha256 !== source.evidence.sourceFileSha256 ||
            scopedPreview.sourceFileSizeBytes !== source.evidence.sourceFileSizeBytes
          ) {
            platformFailure("TRADERLINK_JOURNAL_SOURCE_IMPORT_PRECONDITION_FAILED", {
              check: "scoped_preview_identity",
            });
          }
          const scopedPreviewSha256 = sha256Json(scopedPreview);
          promotion = promoteJournalEvidenceObject(vaultBoundary, {
            sourceBytes: source.sourceBytes,
            sourceFileSha256: source.evidence.sourceFileSha256,
            sourceFileSizeBytes: source.evidence.sourceFileSizeBytes,
            testHooks: options.vaultTestHooks,
          });
          options.testHooks?.afterVaultPromotion?.();
          const committed = boundary.command.commitIbkrStatement(owner.scope, {
            sourceBytes: source.sourceBytes,
            sourceTimezone: options.sourceTimezone,
            privacySafeAccountDisplay: "Broker account",
            sourceDisplayLabel: "Imported broker statement",
            evidenceObjectKey: promotion.evidenceObjectKey,
            now: options.now?.(),
          });
          options.testHooks?.afterDatabaseMutationBeforeCommit?.();
          const projectionCounts = committed.rebuilds.reduce(
            (counts, rebuild) => ({
              readyClosed: counts.readyClosed + rebuild.readyClosedCount,
              legitimateOpen:
                counts.legitimateOpen + rebuild.legitimateOpenCount,
              needsDecision: counts.needsDecision + rebuild.needsDecisionCount,
            }),
            { readyClosed: 0, legitimateOpen: 0, needsDecision: 0 },
          );
          return Object.freeze({
            status: committed.status === "already_imported"
              ? "journal_source_already_imported" as const
              : "journal_source_import_committed_verification_required" as const,
            identifiersRedacted: true as const,
            evidence: Object.freeze({
              ...source.evidence,
              evidenceObjectKey: promotion.evidenceObjectKey,
              scopedPreviewSha256,
            }),
            vaultObjectStatus: promotion.status,
            migrationCount: REQUIRED_MIGRATION_IDS.length,
            workspaceId: owner.scope.workspaceId,
            accountId: owner.accountId,
            importBatchId: committed.importBatchId,
            importEventId: committed.importEventId,
            preservedRowCount: committed.preservedRowCount,
            createdExecutionCount: committed.createdExecutionCount,
            matchedExecutionCount: committed.matchedExecutionCount,
            pendingSourceDecisionCount: committed.pendingSourceDecisionCount,
            relatedDecisionCount: committed.relatedDecisionIds.length,
            rebuildCount: committed.rebuilds.length,
            roundTripProjectionCounts: Object.freeze(projectionCounts),
            postImportVerification: "required" as const,
          });
        }).immediate();
      } catch (error) {
        if (
          promotion &&
          (!isTraderLinkPlatformError(error) ||
            error.code !== "TRADERLINK_JOURNAL_SOURCE_IMPORT_ORPHANED_EVIDENCE")
        ) {
          platformFailure(
            "TRADERLINK_JOURNAL_SOURCE_IMPORT_ORPHANED_EVIDENCE",
            {
              evidenceObjectKey: promotion.evidenceObjectKey,
              orphanState: promotion.status === "created"
                ? "vault_object_unreferenced"
                : "vault_object_reference_unverified",
            },
            error,
          );
        }
        if (isTraderLinkPlatformError(error)) throw error;
        platformFailure("TRADERLINK_JOURNAL_SOURCE_IMPORT_FAILED", {}, error);
      } finally {
        database?.close();
      }
    },
  );
}

export function importTraderLinkPlatformJournalSource(
  options: TraderLinkJournalSourceImportOptions,
): TraderLinkJournalSourceImportResult {
  try {
    return importTraderLinkPlatformJournalSourceInternal(options);
  } catch (error) {
    if (isTraderLinkPlatformError(error)) throw error;
    platformFailure("TRADERLINK_JOURNAL_SOURCE_IMPORT_FAILED", {}, error);
  }
}
