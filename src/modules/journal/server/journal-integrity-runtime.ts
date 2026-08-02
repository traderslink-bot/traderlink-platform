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
import { JournalProductReadService } from "./product/journal-product-read-service";
import { JournalRoundTripRepository } from "./round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "./round-trips/journal-round-trip-service";

export type JournalIntegrityRuntime = Readonly<{
  accounts: JournalAccountService;
  command: JournalIntegrityCommandService;
  decisions: JournalDataDecisionService;
  imports: JournalImportService;
  reads: JournalProductReadService;
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
  const imports = new JournalImportService(
    importRepository,
    executionRepository,
    accounts,
    createJournalPrivacyDigester(loadJournalPrivacyHmacConfiguration(environment)),
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
    reads: new JournalProductReadService(database),
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
  return withReadonlyPlatformDatabase({}, (database) => {
    const runtime = createJournalIntegrityRuntime(database);
    assertScope(runtime, scope);
    return operation(runtime);
  });
}

export function withWritableJournalIntegrityRuntime<T>(
  scope: WorkspaceAccessScope,
  operation: (runtime: JournalIntegrityRuntime, database: Database.Database) => T,
): T {
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    const runtime = createJournalIntegrityRuntime(database);
    assertScope(runtime, scope);
    return operation(runtime, database);
  });
}
