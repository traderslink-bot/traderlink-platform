import { parentPort, workerData } from "node:worker_threads";
import { statSync } from "node:fs";
import Database from "better-sqlite3";
import { configurePlatformDatabaseConnection, verifyPlatformDatabaseConnectionPragmas } from "../database/open-platform-database";
import { validatePlatformDatabasePath } from "../database/platform-database-config";
import { verifyPlatformDatabaseStructureAfterDataChange } from "../database/run-platform-migrations";
import { isTraderLinkPlatformError, platformFailure } from "../database/platform-migration-contract";
import { createErasureObjectStore } from "./platform-erasure-object-store";
import { executeErasureCommand, type ErasureCommand } from "./platform-erasure-command";
import { PlatformErasureRecovery } from "./platform-erasure-recovery";
import { observeErasurePhase } from "./platform-erasure-observability";
import { PlatformErasureHistory } from "./platform-erasure-history";

const data = workerData as { databasePath: string; command: ErasureCommand | null };
let database: Database.Database | null = null;
let message: unknown;
try {
  database = observeErasurePhase("database_open", () => {
    const databasePath = validatePlatformDatabasePath(data.databasePath);
    const before = statSync(databasePath);
    if (before.size === 0) platformFailure("TRADERLINK_PLATFORM_DATABASE_EMPTY");
    const opened = new Database(databasePath, { fileMustExist: true, timeout: 5000 });
    try {
      configurePlatformDatabaseConnection(opened, "runtime");
      verifyPlatformDatabaseConnectionPragmas(opened);
      // Same strict schema/registry structure admission as an ordinary runtime
      // open. Do not create a second isolate-local background integrity scanner:
      // the main runtime owns that lane; logical deletion retains its global FK
      // check inside the transaction before commit.
      verifyPlatformDatabaseStructureAfterDataChange(opened);
      const after = statSync(databasePath);
      if (before.dev !== after.dev || before.ino !== after.ino) {
        platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
      }
      return opened;
    } catch (error) { opened.close(); throw error; }
  });
  // Durability is specific to this writer; ordinary connections retain their
  // approved policy. Do not weaken existing runtime validation to accept it.
  database.pragma("synchronous=FULL");
  const store = createErasureObjectStore(data.databasePath);
  const history = new PlatformErasureHistory(database);
  const expiredRowsRemoved = history.purgeExpired();
  if (data.command) {
    message = { status: "complete", result: executeErasureCommand(database, store, data.command) };
  } else {
    const recovery = new PlatformErasureRecovery(database, store);
    const pending = recovery.pending();
    if (pending) {
      try { recovery.finish(pending); }
      catch (error) { try { history.failed(pending); } catch { /* Preserve last durable phase. */ } throw error; }
    }
    const reconciled = history.reconcileInterrupted();
    message = { status: "complete", result: { nextSelectionRef: null,
      historyBatchFull: expiredRowsRemoved === 128 || reconciled === 128 } };
  }
} catch (error) {
  // Never transfer driver messages, paths, identities, source keys or stacks.
  message = { status: "failed", code: isTraderLinkPlatformError(error) ? error.code : "TRADERLINK_ACCOUNT_ERASURE_FAILED" };
} finally {
  database?.close();
}
parentPort?.postMessage(message);
parentPort?.close();
