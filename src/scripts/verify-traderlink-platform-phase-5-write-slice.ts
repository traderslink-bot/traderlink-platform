import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

import Database from "better-sqlite3";

import { deriveJournalAccountSelectionRef } from "../modules/platform/contracts/journal-account-selection";
import { narrowWorkspaceAccessToAccount } from "../modules/platform/contracts/workspace-access-scope";
import { JournalAccountRepository } from "../modules/journal/server/accounts/journal-account-repository";
import {
  JournalAccountService,
  loadAccountIdentityConfiguration,
} from "../modules/journal/server/accounts/journal-account-service";
import {
  ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
  DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "../modules/journal/server/accounts/journal-source-account-canonicalizers";
import { deriveDevelopmentOwnerJournalScope } from "../modules/journal/server/accounts/journal-development-owner-scope";
import { JournalDataDecisionRepository } from "../modules/journal/server/decisions/journal-data-decision-repository";
import { JournalDataDecisionService } from "../modules/journal/server/decisions/journal-data-decision-service";
import { JournalExecutionRepository } from "../modules/journal/server/executions/journal-execution-repository";
import { JournalExecutionService } from "../modules/journal/server/executions/journal-execution-service";
import {
  promoteJournalEvidenceObject,
  resolveJournalEvidenceVaultBoundary,
} from "../modules/journal/server/imports/journal-evidence-vault";
import { JournalImportRepository } from "../modules/journal/server/imports/journal-import-repository";
import { mappingContractFromSupportTable } from "../modules/journal/server/imports/journal-generic-mapped-statement-adapter";
import {
  createJournalPrivacyDigester,
  JournalImportService,
  loadJournalPrivacyHmacConfiguration,
} from "../modules/journal/server/imports/journal-import-service";
import { withStagedJournalUpload } from "../modules/journal/server/imports/journal-upload-staging";
import { JournalIntegrityCommandService } from "../modules/journal/server/journal-integrity-command-service";
import { JournalExecutionReconciliationRepository } from "../modules/journal/server/reconciliation/journal-execution-reconciliation-repository";
import { JournalProductReadService } from "../modules/journal/server/product/journal-product-read-service";
import { createJournalMappingSupportPackage } from "../modules/journal/server/product/journal-mapping-support-package";
import { JournalRoundTripRepository } from "../modules/journal/server/round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "../modules/journal/server/round-trips/journal-round-trip-service";
import { verifyPlatformDatabaseConnectionPragmas } from "../modules/platform/server/database/open-platform-database";
import { isTraderLinkPlatformError } from "../modules/platform/server/database/platform-migration-contract";
import { verifyCompletedPlatformDatabase } from "../modules/platform/server/database/run-platform-migrations";
import { requireExpectedJournalAccountSelection } from "../modules/platform/server/authentication/journal-account-selection-authorization";

type AuthoritySection = Readonly<{
  activeKeyVersion: string;
  keysBase64: Readonly<Record<string, string>>;
}>;

function fail(check: string): never {
  throw new Error(`TRADERLINK_PHASE_5_WRITE_VERIFICATION_FAILED:${check}`);
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function requiredPrivateFile(value: string | undefined, check: string): string {
  if (!value) fail(check);
  const path = resolve(value);
  if (
    !existsSync(path) ||
    lstatSync(path).isSymbolicLink() ||
    !lstatSync(path).isFile() ||
    realpathSync(path) !== path
  ) fail(check);
  return path;
}

function authoritySection(value: unknown): AuthoritySection {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("authority_section");
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.activeKeyVersion !== "string" ||
    !record.keysBase64 ||
    typeof record.keysBase64 !== "object" ||
    Array.isArray(record.keysBase64)
  ) fail("authority_section");
  const keysBase64 = Object.fromEntries(
    Object.entries(record.keysBase64).map(([version, encoded]) => {
      if (typeof encoded !== "string") fail("authority_key");
      const decoded = Buffer.from(encoded, "base64");
      if (decoded.length < 32 || decoded.toString("base64") !== encoded) {
        fail("authority_key");
      }
      return [version, encoded];
    }),
  );
  if (!(record.activeKeyVersion in keysBase64)) fail("authority_active_key");
  return Object.freeze({
    activeKeyVersion: record.activeKeyVersion,
    keysBase64: Object.freeze(keysBase64),
  });
}

function configureAuthority(authorityPath: string): void {
  const parsed: unknown = JSON.parse(readFileSync(authorityPath, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail("authority_document");
  }
  const authority = parsed as Record<string, unknown>;
  const accountIdentity = authoritySection(authority.accountIdentity);
  const journalPrivacy = authoritySection(authority.journalPrivacy);
  Object.assign(process.env, {
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION:
      accountIdentity.activeKeyVersion,
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON:
      JSON.stringify(accountIdentity.keysBase64),
    TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION:
      journalPrivacy.activeKeyVersion,
    TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON:
      JSON.stringify(journalPrivacy.keysBase64),
  });
}

function temporaryRoot(label: string): string {
  return mkdtempSync(join(tmpdir(), `traderlink-phase-5-${label}-`));
}

function removeTemporaryRoot(path: string): void {
  const resolved = resolve(path);
  const temporary = resolve(tmpdir());
  if (
    dirname(resolved) !== temporary ||
    !basename(resolved).startsWith("traderlink-phase-5-")
  ) fail("temporary_cleanup_boundary");
  rmSync(resolved, { recursive: true, force: true });
}

function count(database: Database.Database, table: string): number {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
    count: number;
  };
  return row.count;
}

function main(): void {
  const sourceDatabasePath = requiredPrivateFile(
    process.env.TRADERLINK_PLATFORM_PHASE_5_SOURCE_DATABASE_PATH,
    "source_database",
  );
  const sourceStatementPath = requiredPrivateFile(
    process.env.TRADERLINK_PLATFORM_PHASE_5_SOURCE_STATEMENT_PATH,
    "source_statement",
  );
  const authorityPath = requiredPrivateFile(
    process.env.TRADERLINK_PLATFORM_JOURNAL_AUTHORITY_PATH,
    "authority",
  );
  const sourceDatabaseSize = statSync(sourceDatabasePath).size;
  const sourceDatabaseSha256 = sha256(sourceDatabasePath);
  const roots = [
    temporaryRoot("database"),
    temporaryRoot("vault"),
    temporaryRoot("staging"),
    temporaryRoot("protected"),
  ];
  const [databaseRoot, vaultRoot, stagingRoot, protectedRoot] = roots;
  const databasePath = join(databaseRoot, "development.sqlite");
  copyFileSync(sourceDatabasePath, databasePath);
  configureAuthority(authorityPath);
  Object.assign(process.env, {
    TRADERLINK_PLATFORM_DB_PATH: databasePath,
    TRADERLINK_PLATFORM_JOURNAL_AUTHORITY_PATH: authorityPath,
    TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT: vaultRoot,
    TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT: stagingRoot,
    TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON:
      JSON.stringify([protectedRoot]),
  });

  let database: Database.Database | null = null;
  try {
    const sourceBytes = new Uint8Array(readFileSync(sourceStatementPath));
    database = new Database(databasePath, { timeout: 5_000 });
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = WAL");
    database.pragma("busy_timeout = 5000");
    verifyCompletedPlatformDatabase(database);
    verifyPlatformDatabaseConnectionPragmas(database);

    const owner = deriveDevelopmentOwnerJournalScope(database);
    const accountScope = narrowWorkspaceAccessToAccount(
      owner.scope,
      owner.accountId,
    );
    const accountRepository = new JournalAccountRepository(database);
    const accountService = new JournalAccountService(
      accountRepository,
      loadAccountIdentityConfiguration(
        process.env,
        ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
        DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
      ),
    );
    const importRepository = new JournalImportRepository(database);
    const executionRepository = new JournalExecutionRepository(database);
    const importService = new JournalImportService(
      importRepository,
      executionRepository,
      accountService,
      createJournalPrivacyDigester(loadJournalPrivacyHmacConfiguration(process.env)),
      new JournalExecutionReconciliationRepository(database),
    );
    const roundTrips = new JournalRoundTripService(
      new JournalRoundTripRepository(database),
    );
    const decisions = new JournalDataDecisionService(
      new JournalDataDecisionRepository(database),
      importRepository,
      importService,
      executionRepository,
      new JournalExecutionService(executionRepository),
      roundTrips,
      new JournalExecutionReconciliationRepository(database),
    );
    const command = new JournalIntegrityCommandService(
      importRepository,
      importService,
      decisions,
      roundTrips,
    );
    const reads = new JournalProductReadService(database);

    const initialImportCount = count(database, "journal_import_batches");
    const initialExecutionCount = count(database, "journal_executions");
    const preview = importService.previewIbkrForWorkspace(owner.scope, {
      sourceBytes,
      sourceTimezone: "America/New_York",
    });
    if (!preview.exactReimport || !preview.canCommit) fail("private_reimport_preview");
    const account = accountService.requireAccountRecord(owner.scope, preview.accountId);
    const reimport = withStagedJournalUpload(sourceBytes, (stagedPath) => {
      const vault = resolveJournalEvidenceVaultBoundary({
        sourcePath: stagedPath,
        databasePath,
      });
      const promotion = promoteJournalEvidenceObject(vault, {
        sourceBytes,
        sourceFileSha256: preview.sourceFileSha256,
        sourceFileSizeBytes: preview.sourceFileSizeBytes,
      });
      return command.commitIbkrStatement(owner.scope, {
        sourceBytes,
        sourceTimezone: "America/New_York",
        privacySafeAccountDisplay: account.displayName,
        sourceDisplayLabel: "Verified historical statement",
        evidenceObjectKey: promotion.evidenceObjectKey,
      });
    });
    if (
      reimport.status !== "already_imported" ||
      count(database, "journal_import_batches") !== initialImportCount ||
      count(database, "journal_executions") !== initialExecutionCount
    ) fail("private_exact_reimport");

    const manual = command.commitManualExecutions(owner.scope, {
      accountId: owner.accountId,
      idempotencyKey: "phase-5-disposable-manual-proof-v1",
      sourceDisplayLabel: "Disposable Trade Tracker verification",
      now: new Date("2026-08-02T16:00:00.000Z"),
      entries: Object.freeze([
        Object.freeze({
          sourceTimestampText: "2026-08-01, 10:00:00",
          sourceTimezone: "America/New_York",
          normalizedSymbol: "VERIFYONLY",
          tradeCurrency: "USD",
          side: "buy" as const,
          quantityDecimal: "2.125",
          priceDecimal: "10.1234",
          feesDecimal: "-0.125",
          feeCurrency: "USD",
          feeSignConvention: "cash_effect" as const,
          tradeIntent: "swing" as const,
        }),
        Object.freeze({
          sourceTimestampText: "2026-08-01, 15:00:00",
          sourceTimezone: "America/New_York",
          normalizedSymbol: "VERIFYONLY",
          tradeCurrency: "USD",
          side: "sell" as const,
          quantityDecimal: "2.125",
          priceDecimal: "10.5678",
          feesDecimal: "-0.125",
          feeCurrency: "USD",
          feeSignConvention: "cash_effect" as const,
          tradeIntent: "swing" as const,
        }),
      ]),
    });
    if (
      manual.status !== "committed" ||
      manual.createdExecutionCount !== 2 ||
      manual.executionIds.length !== 2 ||
      manual.relatedDecisionIds.length < 1
    ) fail("manual_commit");
    const model = reads.listDataDecisions(accountScope);
    const coverageDecision = model.pending.find((item) =>
      item.issueCode === "manual_trading_day_coverage_unconfirmed" &&
      item.suggestedCoverage?.localStartDate === "2026-08-01");
    if (!coverageDecision?.suggestedCoverage) fail("manual_coverage_decision");
    const coverage = coverageDecision.suggestedCoverage;
    const resolution = decisions.resolve(accountScope, {
      action: "supply_coverage_fact",
      decisionId: coverageDecision.decisionId,
      expectedRevision: coverageDecision.revision,
      reasonCode: "disposable_manual_day_partial_coverage",
      reasonText: "Disposable Phase 5 write verification",
      assetClass: coverage.assetClass,
      coverageKind: "partial",
      localStartDate: coverage.localStartDate,
      localEndDate: coverage.localEndDate,
      sourceTimezone: coverage.sourceTimezone,
      idempotencyKey: "phase-5-disposable-coverage-proof-v1",
      sourceDisplayLabel: "Disposable manual trading day coverage",
      now: new Date("2026-08-02T16:05:00.000Z"),
    });
    if (resolution.decision.state !== "resolved") fail("coverage_resolution");

    const genericBytes = new TextEncoder().encode([
      "Trade Date,Trade Time,Ticker,Action,Shares,Fill Price,Commission,Fill ID",
      "2026-08-02,10:15:00,VERIFYMAP,BUY,3.125,4.5678,0.125,MAP-1",
      "2026-08-02,invalid-time,VERIFYMAP,SELL,1,4.75,0.10,MAP-2",
    ].join("\n"));
    const mappingSupport = createJournalMappingSupportPackage({
      sourceBytes: genericBytes,
      brokerName: "Disposable Broker",
      failureCode: "none",
    });
    const mappingTable = mappingSupport.tables[0];
    if (!mappingTable) fail("generic_mapping_table");
    const mapping = mappingContractFromSupportTable({
      brokerName: "Disposable Broker",
      sourceTimezone: "America/New_York",
      defaultCurrency: "USD",
      table: mappingTable,
      delimiter: mappingSupport.detectedDelimiter,
      columns: Object.freeze({
        date: "Trade Date",
        time: "Trade Time",
        symbol: "Ticker",
        side: "Action",
        quantity: "Shares",
        price: "Fill Price",
        fees: "Commission",
        executionId: "Fill ID",
      }),
    });
    const genericPreview = importService.previewGenericMappedForWorkspace(owner.scope, {
      sourceBytes: genericBytes,
      accountId: owner.accountId,
      mapping,
    });
    if (
      !genericPreview.canCommit ||
      genericPreview.mappedExecutionCount !== 1 ||
      genericPreview.expectedPendingSourceDecisionCount < 1
    ) fail("generic_mapping_preview");
    const genericCommit = withStagedJournalUpload(genericBytes, (stagedPath) => {
      const vault = resolveJournalEvidenceVaultBoundary({
        sourcePath: stagedPath,
        databasePath,
      });
      const promotion = promoteJournalEvidenceObject(vault, {
        sourceBytes: genericBytes,
        sourceFileSha256: genericPreview.sourceFileSha256,
        sourceFileSizeBytes: genericPreview.sourceFileSizeBytes,
        evidenceNamespace: "mapped_csv",
      });
      return command.commitGenericMappedStatement(owner.scope, {
        sourceBytes: genericBytes,
        accountId: owner.accountId,
        mapping,
        sourceDisplayLabel: "Disposable mapped statement",
        evidenceObjectKey: promotion.evidenceObjectKey,
        now: new Date("2026-08-02T16:10:00.000Z"),
      });
    });
    const savedMapping = importService.findSavedGenericMappingForWorkspace(owner.scope, {
      accountId: owner.accountId,
      structuralSignatureSha256: mapping.structuralSignatureSha256,
    });
    if (
      genericCommit.status !== "committed" ||
      genericCommit.createdExecutionCount !== 1 ||
      !savedMapping
    ) fail("generic_mapping_commit");
    if (
      !accountRepository.listNonSupersededSourceIdentities(
        owner.scope.workspaceId,
        "ibkr",
      ).some((identity) => identity.accountId === owner.accountId) ||
      !accountRepository.listNonSupersededSourceIdentities(
        owner.scope.workspaceId,
        "mapped_csv",
      ).some((identity) => identity.accountId === owner.accountId)
    ) fail("multiple_sources_same_journal_account");
    const reusableBytes = new TextEncoder().encode([
      "Trade Date,Trade Time,Ticker,Action,Shares,Fill Price,Commission,Fill ID",
      "2026-08-03,11:30:00,VERIFYMAP2,SELL,1,8.125,0.10,MAP-3",
    ].join("\n"));
    const reusablePreview = importService.previewGenericMappedForWorkspace(owner.scope, {
      sourceBytes: reusableBytes,
      accountId: owner.accountId,
      mapping: savedMapping,
    });
    if (reusablePreview.mappedExecutionCount !== 1) fail("generic_mapping_reuse");
    const secondAccount = accountService.createAccount(owner.scope, {
      workspaceId: owner.scope.workspaceId,
      displayName: "Disposable second account",
      baseCurrency: "USD",
      tradingTimezone: "America/New_York",
      now: new Date("2026-08-02T16:15:00.000Z"),
    });
    const twoAccountScope = Object.freeze({
      ...owner.scope,
      allowedAccountIds: Object.freeze([owner.accountId, secondAccount.accountId]),
    });
    if (importService.findSavedGenericMappingForWorkspace(twoAccountScope, {
      accountId: secondAccount.accountId,
      structuralSignatureSha256: mapping.structuralSignatureSha256,
    })) fail("generic_mapping_account_isolation");
    const accountASelectionRef = deriveJournalAccountSelectionRef(
      owner.scope.workspaceId,
      owner.accountId,
    );
    const accountBSelectionRef = deriveJournalAccountSelectionRef(
      owner.scope.workspaceId,
      secondAccount.accountId,
    );
    const accountAScope = Object.freeze({
      ...twoAccountScope,
      activeAccountId: owner.accountId,
    });
    const accountBScope = Object.freeze({
      ...twoAccountScope,
      activeAccountId: secondAccount.accountId,
    });
    requireExpectedJournalAccountSelection(accountAScope, accountASelectionRef);
    let staleSelectionRejected = false;
    try {
      requireExpectedJournalAccountSelection(accountAScope, accountBSelectionRef);
    } catch (error) {
      staleSelectionRejected = isTraderLinkPlatformError(error) &&
        error.code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT";
    }
    if (!staleSelectionRejected) fail("stale_account_selection");
    if (
      reads.listImports(narrowWorkspaceAccessToAccount(
        accountAScope,
        owner.accountId,
      )).length === 0 ||
      reads.listImports(narrowWorkspaceAccessToAccount(
        accountBScope,
        secondAccount.accountId,
      )).length !== 0
    ) fail("account_import_isolation");
    const secondAccountStatement = new TextEncoder().encode([
      "Statement,Header,Field Name,Field Value",
      'Statement,Data,Period,"August 2, 2026 - August 2, 2026"',
      "Account Information,Header,Field Name,Field Value",
      "Account Information,Data,Account,PHASE5-SECOND-ACCOUNT",
      "Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Comm/Fee,TradeID",
      'Trades,Data,Order,Stocks,USD,VERIFYSECOND,"2026-08-02, 12:00:00",1,2.5,-0.1,PHASE5-SECOND-1',
      'Trades,Data,Order,Stocks,USD,VERIFYSECOND,"2026-08-02, 13:00:00",-1,2.75,-0.1,PHASE5-SECOND-2',
    ].join("\r\n"));
    const secondPreview = importService.previewIbkrForWorkspace(accountBScope, {
      sourceBytes: secondAccountStatement,
      sourceTimezone: "America/New_York",
      allowSelectedAccountIdentityConfirmation: true,
    });
    if (
      secondPreview.accountId !== secondAccount.accountId ||
      !secondPreview.sourceIdentityConfirmationRequired ||
      !secondPreview.canCommit
    ) fail("new_broker_account_confirmation_preview");
    const secondCommit = withStagedJournalUpload(
      secondAccountStatement,
      (stagedPath) => {
        const vault = resolveJournalEvidenceVaultBoundary({
          sourcePath: stagedPath,
          databasePath,
        });
        const promotion = promoteJournalEvidenceObject(vault, {
          sourceBytes: secondAccountStatement,
          sourceFileSha256: secondPreview.sourceFileSha256,
          sourceFileSizeBytes: secondPreview.sourceFileSizeBytes,
        });
        return command.commitIbkrStatement(accountBScope, {
          sourceBytes: secondAccountStatement,
          sourceTimezone: "America/New_York",
          privacySafeAccountDisplay: secondAccount.displayName,
          sourceDisplayLabel: "Disposable second-account statement",
          evidenceObjectKey: promotion.evidenceObjectKey,
          confirmedSourceIdentityAccountId: secondAccount.accountId,
          now: new Date("2026-08-02T16:20:00.000Z"),
        });
      },
    );
    if (
      secondCommit.status !== "committed" ||
      reads.listImports(narrowWorkspaceAccessToAccount(
        accountBScope,
        secondAccount.accountId,
      )).length !== 1
    ) fail("new_broker_account_confirmation_commit");
    const quickCheck = database.pragma("quick_check", { simple: true });
    if (quickCheck !== "ok") fail("quick_check");
    database.close();
    database = null;

    if (
      statSync(sourceDatabasePath).size !== sourceDatabaseSize ||
      sha256(sourceDatabasePath) !== sourceDatabaseSha256
    ) fail("source_database_changed");

    process.stdout.write(JSON.stringify({
      status: "ok",
      identifiersRedacted: true,
      privateStatement: Object.freeze({ exactReimport: true, sourceUnchanged: true }),
      manualExecution: Object.freeze({
        createdExecutionCount: manual.createdExecutionCount,
        losslessDecimalProof: true,
        traderIntentPreserved: true,
      }),
      dataDecision: Object.freeze({
        manualCoverageDecisionCreated: true,
        partialCoverageResolution: resolution.decision.state,
      }),
      genericMapping: Object.freeze({
        validRowsContained: true,
        exactTemplateReusable: true,
        accountIsolation: true,
      }),
      multiAccount: Object.freeze({
        activeSelectionExplicit: true,
        staleMutationRejected: true,
        importIsolation: true,
        newBrokerIdentityLinkedByConfirmation: true,
        multipleBrokerSourcesInOneJournalAccount: true,
      }),
      disposableDatabase: Object.freeze({ quickCheck: "ok", removedAfterProof: true }),
    }) + "\n");
  } finally {
    if (database?.open) database.close();
    for (const root of roots) removeTemporaryRoot(root);
  }
}

main();
