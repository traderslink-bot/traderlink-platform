import type Database from "better-sqlite3";
import type { DatabaseSync } from "node:sqlite";

/** Bridge only the synchronous database methods used during demo preparation. */
export function adaptDemoScratchDatabase(connection: DatabaseSync): Database.Database {
  let savepointSequence = 0;
  function execute<Result>(fn: () => Result, mode: "DEFERRED" | "IMMEDIATE" | "EXCLUSIVE"): Result {
    const nested = connection.isTransaction;
    const savepoint = "demo_prepare_" + savepointSequence++;
    connection.exec(nested ? "SAVEPOINT " + savepoint : "BEGIN " + mode);
    try {
      const result = fn();
      connection.exec(nested ? "RELEASE " + savepoint : "COMMIT");
      return result;
    } catch (error) {
      if (connection.isTransaction) {
        connection.exec(nested ? "ROLLBACK TO " + savepoint + "; RELEASE " + savepoint : "ROLLBACK");
      }
      throw error;
    }
  }
  return {
    exec(sql: string) { connection.exec(sql); return this; },
    pragma(sql: string, options?: { simple?: boolean }) {
      const results = connection.prepare("PRAGMA " + sql).all();
      return options?.simple && results[0] ? Object.values(results[0])[0] : results;
    },
    prepare: connection.prepare.bind(connection),
    get inTransaction() { return connection.isTransaction; },
    transaction(fn: () => unknown) {
      const deferred = () => execute(fn, "DEFERRED");
      return Object.assign(deferred, {
        deferred,
        immediate: () => execute(fn, "IMMEDIATE"),
        exclusive: () => execute(fn, "EXCLUSIVE"),
      });
    },
  } as unknown as Database.Database;
}
