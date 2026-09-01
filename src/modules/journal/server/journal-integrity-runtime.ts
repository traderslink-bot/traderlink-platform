import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { JournalAccountRepository } from "./accounts/journal-account-repository";
import { JournalAccountService, loadAccountIdentityConfiguration } from "./accounts/journal-account-service";
import {
  ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
  DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "./accounts/journal-source-account-canonicalizers";
import { JournalDataDecisionRepository } from "./decisions/journal-data-decision-repository";
import { JournalDemoAccountRepository } from "./demo/journal-demo-account-repository";
import { JournalDataDecisionService } from "./decisions/journal-data-decision-service";
import { JournalExecutionRepository } from "./executions/journal-execution-repository";
import { JournalExecutionService } from "./executions/journal-execution-service";
import { JournalImportRepository } from "./imports/journal-import-repository";
import {
  createJournalPrivacyDigester,
  JournalImportService,
  loadJournalPrivacyHmacConfiguration,
} from "./imports/journal-import-service";
import { JournalIntegrityCommandService } from "./journal-integrity-command-service";
import { createJournalManualTradePreviewAuthority } from "./manual-trades/journal-manual-trade-preview-authority";
import { JournalManualTradePreviewRepository } from "./manual-trades/journal-manual-trade-preview-repository";
import { JournalManualTradePreviewService } from "./manual-trades/journal-manual-trade-preview-service";
import { JournalManualTradeCommandRepository } from "./manual-trades/journal-manual-trade-command-repository";
import { JournalManualTradeCommandService } from "./manual-trades/journal-manual-trade-command-service";
import { JournalManualExecutionEditService } from "./manual-trades/journal-manual-execution-edit-service";
import { JournalWorkspaceTradeEditService } from "./manual-trades/journal-workspace-trade-edit-service";
import { JournalProductReadService } from "./product/journal-product-read-service";
import { JournalTradeTrackerReadService } from "./product/journal-trade-tracker-read-service";
import { JournalExecutionReconciliationRepository } from "./reconciliation/journal-execution-reconciliation-repository";
import { JournalRoundTripRepository } from "./round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "./round-trips/journal-round-trip-service";
import { JournalSwingNoteRepository } from "./swing-notes/journal-swing-note-repository";
import { JournalSwingNoteService } from "./swing-notes/journal-swing-note-service";
import { JournalTradeStyleRepository } from "./trade-style/journal-trade-style-repository";
import { JournalTradeStyleService } from "./trade-style/journal-trade-style-service";
import { JournalTradingDayReviewService } from "./reviews/journal-trading-day-review-service";
import { DailyTradeAnalyzerRepository } from "@/src/modules/level-analysis/server/daily-trade-analyzer-repository";
import { DailyTradeMoomooAnalyzerService } from "@/src/modules/level-analysis/server/daily-trade-moomoo-analyzer-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";

export type JournalIntegrityRuntime = Readonly<{
  accounts: JournalAccountService;
  command: JournalIntegrityCommandService;
  decisions: JournalDataDecisionService;
  imports: JournalImportService;
  manualTrades: JournalManualTradeCommandService;
  manualExecutionEdits: JournalManualExecutionEditService;
  workspaceTradeEdits: JournalWorkspaceTradeEditService;
  manualTradePreviews: JournalManualTradePreviewService;
  reads: JournalProductReadService;
  swingNotes: JournalSwingNoteService;
  tradeStyles: JournalTradeStyleService;
  tradingDayReviews: JournalTradingDayReviewService;
  tradeTrackerReads: JournalTradeTrackerReadService;
}>;

export function createJournalIntegrityRuntime(
  database: Database.Database,
  environment: NodeJS.ProcessEnv = process.env,
): JournalIntegrityRuntime {
  const accountRepository = new JournalAccountRepository(database);
  const accounts = new JournalAccountService(
    accountRepository,
    loadAccountIdentityConfiguration(
      environment,
      ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
      DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
    ),
  );
  const importRepository = new JournalImportRepository(database);
  const executionRepository = new JournalExecutionRepository(database);
  const privacyConfiguration = loadJournalPrivacyHmacConfiguration(environment);
  const imports = new JournalImportService(
    importRepository,
    executionRepository,
    accounts,
    createJournalPrivacyDigester(privacyConfiguration),
    new JournalExecutionReconciliationRepository(database),
  );
  const roundTrips = new JournalRoundTripService(
    new JournalRoundTripRepository(database),
  );
  const decisions = new JournalDataDecisionService(
    new JournalDataDecisionRepository(database),
    importRepository,
    imports,
    executionRepository,
    new JournalExecutionService(executionRepository),
    roundTrips,
    new JournalExecutionReconciliationRepository(database),
  );
  const manualTradeAuthority = createJournalManualTradePreviewAuthority(
    privacyConfiguration,
  );
  const manualTradePreviews = new JournalManualTradePreviewService(
    new JournalManualTradePreviewRepository(database),
    accounts,
    manualTradeAuthority,
  );
  const tradeStyles = new JournalTradeStyleService(
    new JournalTradeStyleRepository(database),
    manualTradeAuthority,
  );
  const swingNotes = new JournalSwingNoteService(
    new JournalSwingNoteRepository(database),
    tradeStyles,
  );
  const tradingDayReviews = new JournalTradingDayReviewService(database);
  const dailyTradeAnalyzer = new DailyTradeMoomooAnalyzerService(
    new DailyTradeAnalyzerRepository(database),
    new MoomooConnectionRepository(database),
  );
  const manualExecutionEdits = new JournalManualExecutionEditService(
    new JournalExecutionReconciliationRepository(database),
    importRepository,
    decisions,
    manualTradeAuthority,
    dailyTradeAnalyzer,
  );
  return Object.freeze({
    accounts,
    command: new JournalIntegrityCommandService(
      importRepository,
      imports,
      decisions,
      roundTrips,
    ),
    decisions,
    imports,
    manualExecutionEdits,
    manualTrades: new JournalManualTradeCommandService(
      new JournalManualTradeCommandRepository(database),
      imports,
      decisions,
      roundTrips,
      manualTradePreviews,
      dailyTradeAnalyzer,
      new PlatformNotificationRepository(database),
    ),
    manualTradePreviews,
    workspaceTradeEdits: new JournalWorkspaceTradeEditService(
      database,
      manualExecutionEdits,
      decisions,
      imports,
      roundTrips,
      tradeStyles,
      manualTradeAuthority,
    ),
    reads: new JournalProductReadService(database),
    swingNotes,
    tradeStyles,
    tradingDayReviews,
    tradeTrackerReads: new JournalTradeTrackerReadService(
      database,
      tradeStyles,
      swingNotes,
    ),
  });
}

function assertScope(runtime: JournalIntegrityRuntime, scope: WorkspaceAccessScope): void {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  runtime.accounts.requireAccountRecord(scope, accountId);
}

export function withReadonlyJournalIntegrityRuntime<T>(
  scope: WorkspaceAccessScope,
  operation: (runtime: JournalIntegrityRuntime) => T,
): T {
  return withReadonlyPlatformDatabase({}, (database) =>
    withScopedJournalIntegrityRuntime(database, scope, operation));
}

export function withScopedJournalIntegrityRuntime<T>(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  operation: (runtime: JournalIntegrityRuntime) => T,
): T {
  const runtime = createJournalIntegrityRuntime(database);
  assertScope(runtime, scope);
  return operation(runtime);
}

export function withWritableJournalIntegrityRuntime<T>(
  scope: WorkspaceAccessScope,
  operation: (runtime: JournalIntegrityRuntime, database: Database.Database) => T,
  options: Readonly<{ allowNoActiveAccount?: boolean }> = {},
): T {
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    const runtime = createJournalIntegrityRuntime(database);
    if (!(options.allowNoActiveAccount && scope.allowedAccountIds.length === 0 && scope.activeAccountId === null)) {
      assertScope(runtime, scope);
      new JournalDemoAccountRepository(database).requireActiveAccountIsNotDemo(scope);
    }
    return operation(runtime, database);
  });
}
