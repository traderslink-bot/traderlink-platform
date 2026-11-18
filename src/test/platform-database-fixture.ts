import assert from "node:assert/strict";
import { lstatSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";

type FixtureIntegrityState = {
  version: number;
  quickCheckTimer: ReturnType<typeof setTimeout> | null;
  dirtySinceForeignKeyCheck: boolean;
  dirtySinceQuickCheck: boolean;
  quickCheckInFlight: boolean;
  cancelWorker: (() => void) | null;
  foreignKeyCheckFailed: boolean;
  quickCheckFailed: boolean;
};

type FixtureProcessState = typeof globalThis & {
  __traderlinkPlatformRuntimeDatabaseIntegrityFingerprints?: Map<
    string,
    FixtureIntegrityState | string
  >;
};

function strictlyInside(root: string, path: string): boolean {
  const child = relative(root, path);
  return isAbsolute(path) && child !== "" && child !== ".." &&
    !child.startsWith(`..${sep}`) && !isAbsolute(child);
}

function clearQueuedScan(state: FixtureIntegrityState): void {
  if (state.quickCheckTimer) clearTimeout(state.quickCheckTimer);
  state.quickCheckTimer = null;
}

/** Call only after closing the test's database connections and other writers. */
export async function removePlatformDatabaseTestFixture(root: string): Promise<void> {
  assert(isAbsolute(root) && root === resolve(root), "Expected an absolute fixture root");
  assert(strictlyInside(resolve(tmpdir()), root), "Refusing a non-temporary fixture root");
  const original = lstatSync(root, { throwIfNoEntry: false });
  const processState = globalThis as FixtureProcessState;
  const cache = processState.__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints;
  // Ownership comes from this fixture's mkdtemp root, never a global cache sweep.
  const owned = [...(cache?.entries() ?? [])].filter(([path]) => strictlyInside(root, path));
  if (!original) {
    assert.equal(owned.length, 0,
      "Fixture root is missing while verifier entries remain; retaining cache evidence");
    return;
  }
  assert(original.isDirectory() && !original.isSymbolicLink(), "Expected a real fixture directory");
  const states = owned.flatMap(([, state]) => typeof state === "string" ? [] : [state]);
  for (const state of states) assert.equal(state.version, 3, "Unknown fixture verifier state");
  for (const state of states) {
    clearQueuedScan(state);
    // This fixture is retiring. Do not reschedule it when its current reader exits.
    state.dirtySinceForeignKeyCheck = false;
    state.dirtySinceQuickCheck = false;
    state.cancelWorker?.();
  }

  const deadline = performance.now() + 15_000;
  while (states.some(state => state.quickCheckInFlight)) {
    assert(performance.now() < deadline, "Fixture integrity reader did not exit; retaining evidence");
    await delay(10);
  }
  for (const state of states) {
    clearQueuedScan(state);
    // Cancellation must not change generation or erase a late corruption report.
    assert.equal(state.foreignKeyCheckFailed, false, "Fixture foreign-key corruption; retaining evidence");
    assert.equal(state.quickCheckFailed, false, "Fixture integrity corruption; retaining evidence");
  }
  assert.equal(processState.__traderlinkPlatformRuntimeDatabaseIntegrityFingerprints, cache,
    "Fixture integrity cache changed during teardown");
  for (const [path, state] of owned) assert.equal(cache?.get(path), state,
    "Fixture integrity state changed during teardown");
  assert.equal([...(cache?.keys() ?? [])].filter(path => strictlyInside(root, path)).length,
    owned.length, "Another fixture reader appeared during teardown");
  const current = lstatSync(root);
  assert(current.isDirectory() && !current.isSymbolicLink() &&
    current.dev === original.dev && current.ino === original.ino,
  "Fixture root changed during teardown");

  rmSync(root, { recursive: true, force: true });
  for (const [path] of owned) cache?.delete(path);
}
