// @vitest-environment node
import { existsSync, mkdtempSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { removePlatformDatabaseTestFixture } from "./platform-database-fixture";

type State = {
  version: number;
  generation: number;
  quickCheckTimer: ReturnType<typeof setTimeout> | null;
  dirtySinceForeignKeyCheck: boolean;
  dirtySinceQuickCheck: boolean;
  quickCheckInFlight: boolean;
  cancelWorker: (() => void) | null;
  foreignKeyCheckFailed: boolean;
  quickCheckFailed: boolean;
};
type ProcessState = typeof globalThis & {
  __traderlinkPlatformRuntimeDatabaseIntegrityFingerprints?: Map<string, State | string>;
};
const processState = globalThis as ProcessState;
let previous: ProcessState["__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints"];
let cache: Map<string, State | string>;
const roots: string[] = [];
const syntheticStates: State[] = [];

function root(): string {
  const path = mkdtempSync(join(tmpdir(), "platform-fixture-teardown-"));
  roots.push(path);
  return path;
}

function state(): State {
  const value: State = {
    version: 3, generation: 7, quickCheckTimer: null,
    dirtySinceForeignKeyCheck: true, dirtySinceQuickCheck: true,
    quickCheckInFlight: false, cancelWorker: null,
    foreignKeyCheckFailed: false, quickCheckFailed: false,
  };
  syntheticStates.push(value);
  return value;
}

beforeEach(() => {
  previous = processState.__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints;
  cache = new Map();
  processState.__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints = cache;
});

afterEach(async () => {
  // Reset only the deliberately injected fake failures, never a real reader.
  for (const value of syntheticStates.splice(0)) {
    if (value.quickCheckTimer) clearTimeout(value.quickCheckTimer);
    value.version = 3;
    value.foreignKeyCheckFailed = false;
    value.quickCheckFailed = false;
    value.quickCheckInFlight = false;
    value.cancelWorker = null;
  }
  try {
    for (const path of roots.splice(0)) {
      if (existsSync(path)) await removePlatformDatabaseTestFixture(path);
    }
  } finally {
    processState.__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints = previous;
  }
}, 20_000);

describe("owned Platform database fixture cleanup", () => {
  it("allows repeated cleanup after every owned verifier entry has retired", async () => {
    const directory = root();
    const path = join(directory, "fixture.sqlite");
    writeFileSync(path, "synthetic");
    const value = state();
    value.cancelWorker = vi.fn();
    const cancel = value.cancelWorker;
    cache.set(path, value);

    await removePlatformDatabaseTestFixture(directory);
    await expect(removePlatformDatabaseTestFixture(directory)).resolves.toBeUndefined();

    expect(cancel).toHaveBeenCalledOnce();
    expect(cache.has(path)).toBe(false);
    expect(existsSync(directory)).toBe(false);
  });

  it("rejects an absent root that still has a verifier entry", async () => {
    const directory = root();
    await removePlatformDatabaseTestFixture(directory);
    const path = join(directory, "orphaned.sqlite");
    const value = state();
    value.quickCheckInFlight = true;
    value.cancelWorker = vi.fn();
    cache.set(path, value);

    await expect(removePlatformDatabaseTestFixture(directory)).rejects.toThrow("root is missing");

    expect(value.cancelWorker).not.toHaveBeenCalled();
    expect(value.quickCheckInFlight).toBe(true);
    expect(cache.get(path)).toBe(value);
  });

  it("cancels queued work and keeps files until the reader actually releases its slot", async () => {
    const directory = root();
    const path = join(directory, "fixture.sqlite");
    writeFileSync(path, "synthetic");
    const value = state();
    const queued = vi.fn();
    value.quickCheckTimer = setTimeout(() => queued(), 0);
    value.quickCheckInFlight = true;
    let presentOnRelease = false;
    value.cancelWorker = vi.fn(() => {
      setTimeout(() => {
        presentOnRelease = existsSync(path);
        value.quickCheckInFlight = false;
        value.cancelWorker = null;
      }, 20);
    });
    const cancel = value.cancelWorker;
    cache.set(path, value);

    await removePlatformDatabaseTestFixture(directory);

    expect(cancel).toHaveBeenCalledOnce();
    expect(queued).not.toHaveBeenCalled();
    expect(presentOnRelease).toBe(true);
    expect(value.generation).toBe(7);
    expect(cache.has(path)).toBe(false);
    expect(existsSync(directory)).toBe(false);
  });

  it("drains every database in its root and leaves a similar-prefix sibling untouched", async () => {
    const directory = root();
    const sibling = mkdtempSync(directory + "-sibling-");
    roots.push(sibling);
    const otherPath = join(sibling, "other.sqlite");
    writeFileSync(otherPath, "other fixture");
    const unrelated = state();
    const unrelatedCancel = vi.fn();
    unrelated.cancelWorker = unrelatedCancel;
    cache.set(otherPath, unrelated);
    let presentOnLastRelease = false;
    for (const [name, wait] of [["one.sqlite", 1], ["two.sqlite", 30]] as const) {
      const path = join(directory, name);
      writeFileSync(path, name);
      const value = state();
      value.quickCheckInFlight = true;
      value.cancelWorker = () => {
        setTimeout(() => {
          if (wait === 30) presentOnLastRelease = existsSync(directory);
          value.quickCheckInFlight = false;
          value.cancelWorker = null;
        }, wait);
      };
      cache.set(path, value);
    }
    cache.set(join(directory, "legacy.sqlite"), "legacy-fingerprint");

    await removePlatformDatabaseTestFixture(directory);

    expect(presentOnLastRelease).toBe(true);
    expect([...cache.keys()]).toEqual([otherPath]);
    expect(unrelatedCancel).not.toHaveBeenCalled();
    expect(unrelated.dirtySinceForeignKeyCheck).toBe(true);
    expect(existsSync(otherPath)).toBe(true);
  });

  it.each(["foreignKeyCheckFailed", "quickCheckFailed"] as const)(
    "retains files and cache when %s arrives after cancellation",
    async failure => {
      const directory = root();
      const path = join(directory, "corrupt.sqlite");
      writeFileSync(path, "synthetic corruption evidence");
      const value = state();
      value.quickCheckInFlight = true;
      value.cancelWorker = () => {
        setTimeout(() => {
          value[failure] = true;
          value.quickCheckInFlight = false;
          value.cancelWorker = null;
        }, 10);
      };
      cache.set(path, value);

      await expect(removePlatformDatabaseTestFixture(directory)).rejects.toThrow("corruption");

      expect(value[failure]).toBe(true);
      expect(value.generation).toBe(7);
      expect(cache.get(path)).toBe(value);
      expect(existsSync(path)).toBe(true);
    },
  );

  it("retains evidence when cancellation itself fails", async () => {
    const directory = root();
    const path = join(directory, "fixture.sqlite");
    writeFileSync(path, "synthetic");
    const value = state();
    value.cancelWorker = () => { throw new Error("synthetic cancellation failure"); };
    cache.set(path, value);
    await expect(removePlatformDatabaseTestFixture(directory)).rejects.toThrow("synthetic cancellation failure");
    expect(cache.get(path)).toBe(value);
    expect(existsSync(path)).toBe(true);
  });

  it("does not treat a cancellation request as proof of exit", async () => {
    const directory = root();
    const path = join(directory, "fixture.sqlite");
    writeFileSync(path, "synthetic");
    const value = state();
    value.quickCheckInFlight = true;
    value.cancelWorker = vi.fn();
    cache.set(path, value);
    await expect(removePlatformDatabaseTestFixture(directory)).rejects.toThrow("reader did not exit");
    expect(value.quickCheckInFlight).toBe(true);
    expect(cache.get(path)).toBe(value);
    expect(existsSync(path)).toBe(true);
  }, 20_000);

  it("refuses an unknown verifier state without deleting files or canceling it", async () => {
    const directory = root();
    const path = join(directory, "fixture.sqlite");
    writeFileSync(path, "synthetic");
    const value = state();
    value.version = 4;
    value.cancelWorker = vi.fn();
    cache.set(path, value);
    await expect(removePlatformDatabaseTestFixture(directory)).rejects.toThrow("Unknown fixture verifier state");
    expect(value.cancelWorker).not.toHaveBeenCalled();
    expect(cache.get(path)).toBe(value);
    expect(existsSync(path)).toBe(true);
  });

  it("retains evidence if an owned state changes during cancellation", async () => {
    const directory = root();
    const path = join(directory, "fixture.sqlite");
    writeFileSync(path, "synthetic");
    const value = state();
    const replacement = state();
    value.cancelWorker = () => { cache.set(path, replacement); };
    cache.set(path, value);
    await expect(removePlatformDatabaseTestFixture(directory)).rejects.toThrow("state changed during teardown");
    expect(cache.get(path)).toBe(replacement);
    expect(existsSync(path)).toBe(true);
  });

  it("refuses broad, relative and symlink roots without touching their contents", async () => {
    await expect(removePlatformDatabaseTestFixture(tmpdir())).rejects.toThrow("non-temporary");
    await expect(removePlatformDatabaseTestFixture("relative-fixture")).rejects.toThrow("absolute");
    await expect(removePlatformDatabaseTestFixture(process.cwd())).rejects.toThrow("non-temporary");
    const directory = root();
    const path = join(directory, "keep.txt");
    writeFileSync(path, "keep");
    const link = directory + "-link";
    symlinkSync(directory, link, "dir");
    try {
      await expect(removePlatformDatabaseTestFixture(link)).rejects.toThrow("real fixture directory");
      expect(existsSync(path)).toBe(true);
    } finally { unlinkSync(link); }
  });

  it("retires the actual runtime's queued initial scan before removing its database", async () => {
    const directory = root();
    const path = join(directory, "actual.sqlite");
    const initialized = openPlatformDatabase({ mode: "initializer", databasePath: path, forbiddenRepositoryRoots: [] });
    try { runPlatformMigrations(initialized); } finally { initialized.close(); }
    const runtime = openPlatformDatabase({ mode: "runtime", databasePath: path, forbiddenRepositoryRoots: [] });
    runtime.close();
    const value = cache.get(path);
    expect(value).toMatchObject({ version: 3, quickCheckInFlight: false });
    expect(typeof value === "object" && value.quickCheckTimer).toBeTruthy();

    await removePlatformDatabaseTestFixture(directory);

    expect(cache.has(path)).toBe(false);
    expect(existsSync(directory)).toBe(false);
  }, 20_000);
});
