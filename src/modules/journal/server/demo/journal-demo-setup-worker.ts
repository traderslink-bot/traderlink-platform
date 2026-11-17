import { parentPort, workerData } from "node:worker_threads";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalDemoAccountActivationService } from "@/src/modules/journal/server/demo/journal-demo-account-activation-service";
import { JournalDemoAccountRepository } from "@/src/modules/journal/server/demo/journal-demo-account-repository";
import { withPlatformWorkerDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { JOURNAL_DEMO_CURRENT_VERSION_ID } from "@/src/modules/journal/server/demo/journal-demo-current-version";
import { JournalDemoMaterializer } from "@/src/modules/journal/server/demo/journal-demo-materializer";

function activate(scope: WorkspaceAccessScope, activeAccountId: string) {
  return withPlatformWorkerDatabase((database) => {
    const demos = new JournalDemoAccountRepository(database);
    const activeAccountIsDemo = demos.findActiveAccount(scope) !== null;
    const activeAccount = new JournalAccountRepository(database).findActiveAccount(
      scope.workspaceId,
      activeAccountId,
    );
    if (!activeAccount) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const existingDemo = demos.findAccountForUser(scope);
    if (existingDemo && demos.findLifecycleForUser(scope)?.state !== "cleared") {
      if (!scope.allowedAccountIds.includes(existingDemo.accountId)) {
        platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      }
      // The existing samples are already usable. Upgrades run through ensure.
      return Object.freeze({
        activeAccountIsDemo,
        result: { accountId: existingDemo.accountId, state: "materialized" as const },
      });
    }
    return Object.freeze({
      activeAccountIsDemo,
      result: new JournalDemoAccountActivationService(database).activateForWorkspace({
        baseCurrency: activeAccount.baseCurrency,
        tradingTimezone: activeAccount.tradingTimezone,
        userId: scope.userId,
        workspaceId: scope.workspaceId,
      }),
    });
  });
}

export function ensureJournalDemo(scope: WorkspaceAccessScope, after: string | null) {
  return withPlatformWorkerDatabase((database) => {
    const demos = new JournalDemoAccountRepository(database);
    if (demos.findLifecycleForUser(scope)?.state === "cleared") return { status: "cleared", changed: false };
    const existing = demos.findAccountForUser(scope);
    if (existing && (existing.demoPackVersionId === JOURNAL_DEMO_CURRENT_VERSION_ID || demos.findPackApplication({
      accountId: existing.accountId, workspaceId: scope.workspaceId,
      demoPackVersionId: JOURNAL_DEMO_CURRENT_VERSION_ID,
    }))) return { status: "ready", ...new JournalDemoMaterializer(database).refreshExistingAnalysis(scope, after) };
    if (!scope.activeAccountId) return { status: "unavailable", changed: false };
    const account = new JournalAccountRepository(database).findActiveAccount(scope.workspaceId, scope.activeAccountId);
    if (!account) return { status: "unavailable", changed: false };
    const activation = new JournalDemoAccountActivationService(database).activateForWorkspace({
      baseCurrency: account.baseCurrency, tradingTimezone: account.tradingTimezone,
      userId: scope.userId, workspaceId: scope.workspaceId,
    });
    const refresh = activation.state === "materialized"
      ? new JournalDemoMaterializer(database).refreshExistingAnalysis(scope, after)
      : { nextAfter: null };
    return { status: activation.state === "materialized" ? "ready" : activation.state,
      changed: activation.state === "materialized", nextAfter: refresh.nextAfter };
  });
}

export type DemoSetupCommand =
  | { operation: "activate"; scope: WorkspaceAccessScope; activeAccountId: string }
  | { operation: "ensure"; scope: WorkspaceAccessScope; after: string | null };

export type DemoSetupResult = {
  activate: ReturnType<typeof activate>;
  ensure: ReturnType<typeof ensureJournalDemo>;
};

if (parentPort) {
  const command = workerData as DemoSetupCommand;
  const started = performance.now();
  try {
    const result = command.operation === "activate"
      ? activate(command.scope, command.activeAccountId)
      : ensureJournalDemo(command.scope, command.after);
    parentPort.postMessage(result);
    parentPort.close();
  } finally {
    console.info("journal_demo_setup_timing", {
      operation: command.operation, durationMs: Math.round(performance.now() - started),
    });
  }
}
