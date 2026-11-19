import { setTimeout as delay } from "node:timers/promises";
import type Database from "better-sqlite3";

export function isSqliteBusyError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  try {
    const code: unknown = Object.getOwnPropertyDescriptor(error, "code")?.value;
    return typeof code === "string" && /^SQLITE_BUSY(?:_|$)/u.test(code);
  } catch { return false; }
}

type AttemptOptions = Readonly<{ revalidate?: () => void }>;
type WriteOptions = AttemptOptions & Readonly<{
  maximumWaitMs?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
}>;

/** Acquire the writer without blocking the Node thread. A busy result means
 * BEGIN IMMEDIATE failed: neither callback ran. After acquisition, callback or
 * commit failures propagate without replay. Callbacks must be synchronous; keep
 * provider effects outside the transaction and revalidate current scope inside.
 */
export function tryNonblockingSqliteWrite<T>(
  database: Database.Database, operation: () => T, options: AttemptOptions = {},
): Readonly<{ kind: "written"; value: T }> | Readonly<{ kind: "busy"; error: unknown }> {
  if (database.inTransaction) throw new Error("nonblocking_sqlite_nested_transaction");
  const originalTimeout = database.pragma("busy_timeout", { simple: true });
  if (typeof originalTimeout !== "number" || !Number.isSafeInteger(originalTimeout) || originalTimeout < 0) {
    throw new Error("nonblocking_sqlite_timeout_invalid");
  }
  let entered = false;
  database.pragma("busy_timeout=0");
  try {
    const value = database.transaction(() => {
      entered = true;
      options.revalidate?.();
      const result = operation();
      if (result !== null && (typeof result === "object" || typeof result === "function") && "then" in result) {
        throw new Error("nonblocking_sqlite_async_callback");
      }
      return result;
    }).immediate();
    return { kind: "written", value };
  } catch (error) {
    if (!entered && isSqliteBusyError(error)) return { kind: "busy", error };
    throw error;
  } finally {
    database.pragma(`busy_timeout=${originalTimeout}`);
  }
}

/** Bounded asynchronous writer acquisition, never a queue or a discarded-work
 * policy. The caller retains its payload when acquisition exhausts its budget.
 * The budget covers waiting for the lock, not execution of the SQL callback.
 */
export async function runNonblockingSqliteWrite<T>(
  database: Database.Database, operation: () => T, options: WriteOptions = {},
): Promise<T> {
  const maximumWaitMs = options.maximumWaitMs ?? 5_000;
  const retryDelayMs = options.retryDelayMs ?? 100;
  if (!Number.isSafeInteger(maximumWaitMs) || maximumWaitMs < 0 || maximumWaitMs > 30_000
    || !Number.isSafeInteger(retryDelayMs) || retryDelayMs < 1 || retryDelayMs > 1_000) {
    throw new Error("nonblocking_sqlite_wait_invalid");
  }
  const deadline = performance.now() + maximumWaitMs;
  let waiting: Readonly<{ error: unknown }> | undefined;
  for (;;) {
    options.signal?.throwIfAborted();
    if (waiting && performance.now() >= deadline) throw waiting.error;
    const attempt = tryNonblockingSqliteWrite(database, operation, options);
    if (attempt.kind === "written") return attempt.value;
    waiting = attempt;
    const remaining = deadline - performance.now();
    if (remaining <= 0) throw attempt.error;
    await delay(Math.min(retryDelayMs, remaining), undefined, { signal: options.signal });
  }
}
