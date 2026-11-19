// @vitest-environment node
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { isSqliteBusyError, runNonblockingSqliteWrite, tryNonblockingSqliteWrite } from "./nonblocking-sqlite-write";

async function fixture(run: (db: Database.Database, writer: Database.Database) => Promise<void>) {
  const root = mkdtempSync(join(tmpdir(), "traderlink-nonblocking-write-"));
  const db = new Database(join(root, "synthetic.sqlite"));
  db.pragma("journal_mode=WAL");
  db.pragma("busy_timeout=5000");
  db.exec("CREATE TABLE facts(id INTEGER PRIMARY KEY); CREATE TABLE scope(active INTEGER); INSERT INTO scope VALUES(1)");
  const writer = new Database(db.name);
  try { await run(db, writer); }
  finally {
    if (writer.inTransaction) writer.exec("ROLLBACK");
    writer.close(); db.close(); rmSync(root, { recursive: true, force: true });
  }
}

it("yields while a second native connection owns the writer and commits the callback once", async () => {
  await fixture(async (db, writer) => {
    writer.exec("BEGIN IMMEDIATE");
    let heartbeats = 0;
    const timer = setInterval(() => heartbeats++, 2);
    const release = setTimeout(() => writer.exec("COMMIT"), 30);
    const callback = vi.fn(() => {
      expect(db.inTransaction).toBe(true);
      expect(db.pragma("busy_timeout", { simple: true })).toBe(0);
      db.prepare("INSERT INTO facts VALUES(1)").run();
      return "committed";
    });
    try {
      expect(await runNonblockingSqliteWrite(db, callback, { maximumWaitMs: 1000, retryDelayMs: 5 })).toBe("committed");
    } finally { clearInterval(timer); clearTimeout(release); }
    expect(heartbeats).toBeGreaterThan(0);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(db.pragma("busy_timeout", { simple: true })).toBe(5000);
    expect(db.prepare("SELECT * FROM facts").all()).toEqual([{ id: 1 }]);
  });
});

it("revalidates current authority after acquisition rather than reusing a pre-wait decision", async () => {
  await fixture(async (db, writer) => {
    writer.exec("BEGIN IMMEDIATE; UPDATE scope SET active=0");
    const release = setTimeout(() => writer.exec("COMMIT"), 20);
    const operation = vi.fn(() => db.prepare("INSERT INTO facts VALUES(1)").run());
    const validate = vi.fn(() => {
      const scope = db.prepare("SELECT active FROM scope").get() as { active: number };
      if (scope.active !== 1) throw new Error("scope_changed");
    });
    try {
      await expect(runNonblockingSqliteWrite(db, operation, { maximumWaitMs: 1000, retryDelayMs: 5, revalidate: validate })).rejects.toThrow("scope_changed");
    } finally { clearTimeout(release); }
    expect(validate).toHaveBeenCalledTimes(1);
    expect(operation).not.toHaveBeenCalled();
    expect(db.inTransaction).toBe(false);
    expect(db.pragma("busy_timeout", { simple: true })).toBe(5000);
  });
});

it("returns acquisition contention without running callbacks and exhausts only its asynchronous wait budget", async () => {
  await fixture(async (db, writer) => {
    writer.exec("BEGIN IMMEDIATE");
    const operation = vi.fn();
    const attempt = tryNonblockingSqliteWrite(db, operation);
    expect(attempt.kind).toBe("busy");
    const started = performance.now();
    let failure: unknown;
    try { await runNonblockingSqliteWrite(db, operation, { maximumWaitMs: 25, retryDelayMs: 5 }); }
    catch (error) { failure = error; }
    expect(isSqliteBusyError(failure)).toBe(true);
    expect(performance.now() - started).toBeLessThan(1000);
    expect(operation).not.toHaveBeenCalled();
    expect(db.pragma("busy_timeout", { simple: true })).toBe(5000);
    expect(writer.inTransaction).toBe(true);
  });
});

it("does not replay callback or commit failures, and rolls back partial SQL", async () => {
  await fixture(async db => {
    const error = Object.assign(new Error("callback_busy"), { code: "SQLITE_BUSY" });
    const operation = vi.fn(() => { db.prepare("INSERT INTO facts VALUES(1)").run(); throw error; });
    await expect(runNonblockingSqliteWrite(db, operation)).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(db.prepare("SELECT * FROM facts").all()).toEqual([]);
    expect(db.inTransaction).toBe(false);
    expect(db.pragma("busy_timeout", { simple: true })).toBe(5000);
    db.pragma("foreign_keys=ON");
    db.exec("CREATE TABLE child(id INTEGER REFERENCES facts(id) DEFERRABLE INITIALLY DEFERRED)");
    const invalid = vi.fn(() => db.prepare("INSERT INTO child VALUES(99)").run());
    await expect(runNonblockingSqliteWrite(db, invalid)).rejects.toMatchObject({ code: "SQLITE_CONSTRAINT_FOREIGNKEY" });
    expect(invalid).toHaveBeenCalledTimes(1);
    expect(db.prepare("SELECT * FROM child").all()).toEqual([]);
    expect(db.inTransaction).toBe(false);
    expect(db.pragma("busy_timeout", { simple: true })).toBe(5000);
  });
});

it("rejects nested and asynchronous callbacks without committing their SQL", async () => {
  await fixture(async db => {
    db.transaction(() => {
      expect(() => tryNonblockingSqliteWrite(db, () => undefined)).toThrow("nested_transaction");
    }).immediate();
    expect(() => tryNonblockingSqliteWrite(db, () => {
      db.prepare("INSERT INTO facts VALUES(1)").run();
      return Promise.resolve(1);
    })).toThrow("async_callback");
    expect(db.prepare("SELECT * FROM facts").all()).toEqual([]);
    expect(db.pragma("busy_timeout", { simple: true })).toBe(5000);
  });
});

it("aborts a waiting acquisition without executing or retaining a transaction", async () => {
  await fixture(async (db, writer) => {
    writer.exec("BEGIN IMMEDIATE");
    const controller = new AbortController();
    const operation = vi.fn();
    const abort = setTimeout(() => controller.abort(), 10);
    try {
      await expect(runNonblockingSqliteWrite(db, operation, { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    } finally { clearTimeout(abort); }
    expect(operation).not.toHaveBeenCalled();
    expect(db.inTransaction).toBe(false);
    expect(db.pragma("busy_timeout", { simple: true })).toBe(5000);
  });
});
