import Database from "better-sqlite3";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { prepareAndPublishInitialDemo, publishPreparedDemo, type PreparedDemoPublication } from "./journal-demo-prepared-publication";
import { parentPort, workerData } from "node:worker_threads";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalDemoAccountActivationService } from "@/src/modules/journal/server/demo/journal-demo-account-activation-service";
import { JournalDemoAccountRepository } from "@/src/modules/journal/server/demo/journal-demo-account-repository";
import { withPlatformWorkerDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { JOURNAL_DEMO_CURRENT_VERSION_ID } from "@/src/modules/journal/server/demo/journal-demo-current-version";
import { JournalDemoMaterializer } from "@/src/modules/journal/server/demo/journal-demo-materializer";

function materializeDemo(database: Database.Database, scope: WorkspaceAccessScope, account: {
  accountId: string; baseCurrency: string; tradingTimezone: string;
}) {
  const demos = new JournalDemoAccountRepository(database);
  if (demos.findLifecycleForUser(scope)?.state === "cleared") {
    return { state: "cleared", accountId: null } as const;
  }
  if (demos.findAccountForUser(scope)) {
    return new JournalDemoAccountActivationService(database).activateForWorkspace({
      baseCurrency: account.baseCurrency, tradingTimezone: account.tradingTimezone,
      userId: scope.userId, workspaceId: scope.workspaceId,
    });
  }
  return prepareAndPublishInitialDemo(database, {
    userId: scope.userId, workspaceId: scope.workspaceId, activeAccountId: account.accountId,
    baseCurrency: account.baseCurrency, tradingTimezone: account.tradingTimezone,
  }, join(dirname(__filename), "journal-demo-schema.sqlite"), input => {
    // Node SQLite and better-sqlite3 must not open the same file in the same
    // PID. SQLite's POSIX file-lock bookkeeping is local to each library.
    const result = execFileSync(process.execPath, [__filename, "--publish-prepared-demo"], {
      input: JSON.stringify(input), encoding: "utf8", maxBuffer: 64 * 1024,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        NODE_PATH: process.env.NODE_PATH,
        TRADERLINK_PLATFORM_DB_PATH: process.env.TRADERLINK_PLATFORM_DB_PATH,
      },
    });
    return JSON.parse(result);
  });
}

function activate(scope: WorkspaceAccessScope, activeAccountId: string) {
  return withPlatformWorkerDatabase((database) => {
    const activeDemoAccount = new JournalDemoAccountRepository(database).findActiveAccount(scope);
    const activeAccount = new JournalAccountRepository(database).findActiveAccount(
      scope.workspaceId,
      activeAccountId,
    );
    if (!activeAccount) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    return Object.freeze({
      activeAccountIsDemo: activeDemoAccount !== null,
      result: materializeDemo(database, scope, activeAccount),
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
    const activation = materializeDemo(database, scope, account);
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


// Image build only: migrate an empty disposable database, then package its schema.
if (!parentPort && process.argv[2] === "--prepare-schema" && process.argv[3]) {
  const scratch = new Database(":memory:");
  try {
    scratch.pragma("foreign_keys=ON");
    runPlatformMigrations(scratch);
    writeFileSync(process.argv[3], scratch.serialize(), { mode: 0o600 });
  } finally {
    scratch.close();
  }
}


// Only a worker-owned child enters this path. The web process and its worker
// keep using better-sqlite3. This child is the only native handle on the file.
if (!parentPort && process.argv[2] === "--publish-prepared-demo") {
  const input = JSON.parse(readFileSync(0, "utf8")) as PreparedDemoPublication;
  if (input.databasePath !== process.env.TRADERLINK_PLATFORM_DB_PATH) {
    throw new Error("prepared_demo_database_path");
  }
  process.stdout.write(JSON.stringify(publishPreparedDemo(input)));
}
