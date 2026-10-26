import { Worker } from "node:worker_threads";
import { join } from "node:path";
import { platformFailure } from "../database/platform-migration-contract";
import type { ErasureCommand, ErasureCompletion } from "./platform-erasure-command";
import { resolvePlatformDatabaseConfig } from "../database/platform-database-config";

type Slot = { completion: Promise<ErasureCompletion> };
const key = Symbol.for("traderlink.platform.erasure.worker.v1");
const state = globalThis as typeof globalThis & { [key]?: Slot };
const housekeepingKey = Symbol.for("traderlink.platform.erasure.housekeeping.v1");
const housekeeping = globalThis as typeof globalThis & { [housekeepingKey]?: boolean };

/** One worker, no queue and no terminate/timeout policy for a writer. Keep
 * occupancy until actual exit, even after an error/result or client disconnect.
 */
export function runErasureWorker(databasePath: string, command: ErasureCommand | null): Promise<ErasureCompletion> {
  if (state[key]) platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFLICT");
  const worker = new Worker(join(process.cwd(), "workers/platform-erasure-worker.cjs"), {
    workerData: { databasePath, command },
  });
  const completion = new Promise<ErasureCompletion>((resolve, reject) => {
    let result: ErasureCompletion | undefined;
    let failure: string | undefined;
    let messages = 0;
    worker.on("message", (message: unknown) => {
      if (++messages !== 1) { failure = "TRADERLINK_ACCOUNT_ERASURE_FAILED"; return; }
      if (!message || typeof message !== "object" || !("status" in message)) { failure = "TRADERLINK_ACCOUNT_ERASURE_FAILED"; return; }
      if (message.status === "complete" && "result" in message && message.result && typeof message.result === "object"
        && "nextSelectionRef" in message.result && (message.result.nextSelectionRef === null
          || typeof message.result.nextSelectionRef === "string" && /^[0-9a-f]{64}$/u.test(message.result.nextSelectionRef))
        && (!("historyBatchFull" in message.result) || typeof message.result.historyBatchFull === "boolean")) {
        result = message.result as ErasureCompletion;
      }
      else if ("code" in message && typeof message.code === "string") failure = message.code;
      else failure = "TRADERLINK_ACCOUNT_ERASURE_FAILED";
    });
    worker.on("error", () => { failure = "TRADERLINK_ACCOUNT_ERASURE_FAILED"; });
    worker.once("exit", (code) => {
      delete state[key];
      if (code === 0 && result && !failure) resolve(result);
      else {
        // Known stable codes only. No worker exception details reach HTTP/logs.
        try { platformFailure((failure ?? "TRADERLINK_ACCOUNT_ERASURE_FAILED") as Parameters<typeof platformFailure>[0]); }
        catch (error) { reject(error); }
      }
    });
  });
  state[key] = { completion };
  return completion;
}

/** Bounded startup/periodic cleanup and history retention. Only committed file
 * obligations resume; no root deletion is reconstructed from a request, timeout
 * or display name. Failures keep durable state without retrying root writes.
 */
export function startCommittedErasureRecovery(): void {
  if (housekeeping[housekeepingKey]) return;
  housekeeping[housekeepingKey] = true;
  const run = () => {
    if (state[key]) return;
    try {
      void runErasureWorker(resolvePlatformDatabaseConfig({}).databasePath, null)
        .then((result) => {
          if (result.historyBatchFull) setTimeout(run, 2_000).unref();
        })
        .catch(() => console.error("[account-erasure] committed cleanup or history retention requires recovery"));
    } catch { console.error("[account-erasure] recovery worker could not start"); }
  };
  run();
  setInterval(run, 15 * 60_000).unref();
}
