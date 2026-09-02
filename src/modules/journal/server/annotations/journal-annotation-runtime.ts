import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

import { JournalDemoAccountRepository } from "../demo/journal-demo-account-repository";
import { JournalAnnotationRepository } from "./journal-annotation-repository";
import { JournalAnnotationService } from "./journal-annotation-service";
import { JournalRuleRepository } from "./journal-rule-repository";

export function createJournalAnnotationService(
  database: Database.Database,
): JournalAnnotationService {
  return new JournalAnnotationService(
    new JournalAnnotationRepository(database),
    new JournalRuleRepository(database),
  );
}

function accountScope(scope: WorkspaceAccessScope) {
  if (!scope.activeAccountId) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
}

export function withReadonlyJournalAnnotations<T>(
  scope: WorkspaceAccessScope,
  operation: (
    service: JournalAnnotationService,
    account: ReturnType<typeof accountScope>,
  ) => T,
): T {
  return withReadonlyPlatformDatabase({}, (database) =>
    withScopedJournalAnnotations(database, scope, operation));
}

export function withScopedJournalAnnotations<T>(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  operation: (
    service: JournalAnnotationService,
    account: ReturnType<typeof accountScope>,
  ) => T,
): T {
  return operation(createJournalAnnotationService(database), accountScope(scope));
}

export function withWritableJournalAnnotations<T>(
  scope: WorkspaceAccessScope,
  operation: (
    service: JournalAnnotationService,
    account: ReturnType<typeof accountScope>,
  ) => T,
  options: Readonly<{ allowDemoAccountAnnotations?: boolean }> = {},
): T {
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    const account = accountScope(scope);
    if (!options.allowDemoAccountAnnotations) {
      new JournalDemoAccountRepository(database).requireActiveAccountIsNotDemo(scope);
    }
    return operation(createJournalAnnotationService(database), account);
  });
}
