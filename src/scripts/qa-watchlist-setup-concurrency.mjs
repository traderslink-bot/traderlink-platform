import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/u.test(specifier)) return next(`${specifier}.ts`, context);
    throw error;
  }
} });
const { WatchlistMoomooAdmission } = await import("../lib/live-watchlist/setups/setup-admission.ts");
const { IndicatorRequestCoordinator } = await import("../lib/live-watchlist/indicators/indicator-request-coordinator.ts");
globalThis.fetch = async () => { throw Error("No network in concurrency QA"); };
let now = 100000, ledger = { version: 1, starts: [], retryAt: 0, lastSeenAt: now };
const gate = new WatchlistMoomooAdmission({ now: () => now, sleep: async ms => { now += ms; },
  load: async () => ledger, save: async value => { ledger = structuredClone(value); } });
let release, entered;
const held = new Promise(resolve => { release = resolve; });
const checking = new Promise(resolve => { entered = resolve; });
const transportStarts = [], audit = [];
const coordinator = new IndicatorRequestCoordinator({ now: () => now, id: () => randomUUID(), admission: gate, audit: event => audit.push(event) });
const request = (name, isCurrent) => ({ provider: "moomoo", scope: "offline", requestKey: name, consumer: name, maxAttempts: 1,
  isCurrent, execute: async () => { transportStarts.push({ name, at: now }); return { ok: true, data: [], usable: true, requestAccepted: true }; } });
const a = coordinator.request(request("A", async () => { entered(); await held; return true; }));
await checking;
await coordinator.request(request("B", async () => true));
now += 50; release(); await a;
assert.equal(transportStarts.length, 2);
const observedSpacing = transportStarts[1].at - transportStarts[0].at;
assert.equal(ledger.starts[1] - ledger.starts[0], 750);
assert.ok(observedSpacing >= 750, "Spacing applies to actual dispatch, not an earlier reservation");
assert.deepEqual(ledger.starts, transportStarts.map(item => item.at));

// A provider cooldown arriving while the other eligibility check is pending
// must also be honored at dispatch, not only at the earlier reservation time.
let cooldownClock = 200000, releaseCooldown, enteredCooldown;
let cooldownLedger = { version: 1, starts: [], retryAt: 0, lastSeenAt: cooldownClock };
const cooldownGate = new WatchlistMoomooAdmission({ now: () => cooldownClock, sleep: async ms => { cooldownClock += ms; },
  load: async () => cooldownLedger, save: async value => { cooldownLedger = structuredClone(value); } });
const heldCooldown = new Promise(resolve => { releaseCooldown = resolve; });
const checkingCooldown = new Promise(resolve => { enteredCooldown = resolve; });
const cooldownStarts = [];
const cooldownCoordinator = new IndicatorRequestCoordinator({ now: () => cooldownClock, id: () => randomUUID(), admission: cooldownGate });
const heldRequest = cooldownCoordinator.request({ ...request("C", async () => { enteredCooldown(); await heldCooldown; return true; }),
  execute: async () => { cooldownStarts.push(cooldownClock); return { ok: true, data: [], usable: true, requestAccepted: true }; } });
await checkingCooldown;
await cooldownCoordinator.request({ ...request("D", async () => true), execute: async () => ({ ok: false, reason: "rate_limited",
  requestAccepted: true, httpStatus: 429, retryAfterMs: 30000 }) });
cooldownClock += 50; releaseCooldown(); const heldResult = await heldRequest;
assert.equal(cooldownLedger.retryAt, 230000);
assert.equal(cooldownStarts.length, 0);
assert.equal(heldResult.kind, "deferred");
const sentDuringKnownCooldown = cooldownStarts.some(at => at < cooldownLedger.retryAt);
assert.equal(sentDuringKnownCooldown, false);

// Same outbound request, with a delayed eligibility check, remains one transport.
let finish;
const pending = new Promise(resolve => { finish = resolve; });
let sharedCalls = 0;
const dedupe = new IndicatorRequestCoordinator({ id: () => randomUUID() });
const shared = { provider: "moomoo", scope: "offline", requestKey: "same", consumer: "setups", maxAttempts: 1,
  execute: async () => { sharedCalls++; await pending; return { ok: true, data: [], usable: true, requestAccepted: true }; } };
const one = dedupe.request(shared), two = dedupe.request({ ...shared, consumer: "indicators" });
finish(); const results = await Promise.all([one, two]);
assert.equal(sharedCalls, 1); assert.deepEqual(results[0].transportIds, results[1].transportIds);

let slowClock = 400000;
const slowGate = new WatchlistMoomooAdmission({ now: () => slowClock, sleep: async ms => { slowClock += ms; },
  load: async () => ({ version: 1, starts: [], retryAt: 0, lastSeenAt: slowClock }),
  save: async () => { slowClock += 300; } });
const slowStarts = [];
for (let index = 0; index < 2; index++) {
  const result = await slowGate.dispatch({ additionalDemand: false, isCurrent: async () => true, start: () => slowStarts.push(slowClock) });
  assert.equal(result.allowed, true);
}
assert.ok(slowStarts[1] - slowStarts[0] >= 750);

let persistEntered, persistRelease, writes = 0, duringPersistStarts = 0;
const persisting = new Promise(resolve => { persistEntered = resolve; });
const persistHold = new Promise(resolve => { persistRelease = resolve; });
const persistGate = new WatchlistMoomooAdmission({ now: () => 500000, sleep: async () => {},
  load: async () => ({ version: 1, starts: [], retryAt: 0, lastSeenAt: 500000 }),
  save: async () => { if (++writes === 1) { persistEntered(); await persistHold; } } });
const waiting = persistGate.dispatch({ additionalDemand: false, isCurrent: async () => true, start: () => { duringPersistStarts++; } });
await persisting; const providerCooldown = persistGate.rateLimited(30000); persistRelease();
const [notSent] = await Promise.all([waiting, providerCooldown]);
assert.equal(notSent.allowed, false); assert.equal(duringPersistStarts, 0);

let checks = 0, lateCancelStarts = 0, cancelLedger;
const cancelGate = new WatchlistMoomooAdmission({ now: () => 600000, sleep: async () => {},
  load: async () => ({ version: 1, starts: [], retryAt: 0, lastSeenAt: 600000 }), save: async value => { cancelLedger = value; } });
const cancelled = await cancelGate.dispatch({ additionalDemand: false, isCurrent: async () => ++checks < 3,
  start: () => { lateCancelStarts++; } });
assert.equal(cancelled.cancelled, true); assert.equal(lateCancelStarts, 0); assert.deepEqual(cancelLedger.starts, []);

let postLaunchWrites = 0, postLaunchCalls = 0;
const writeFailureGate = new WatchlistMoomooAdmission({ now: () => 700000, sleep: async () => {},
  load: async () => ({ version: 1, starts: [], retryAt: 0, lastSeenAt: 700000 }),
  save: async () => { if (++postLaunchWrites === 2) throw Error("offline post-launch persistence failure"); } });
const writeFailureCoordinator = new IndicatorRequestCoordinator({ now: () => 700000, id: () => randomUUID(), admission: writeFailureGate });
const launched = await writeFailureCoordinator.request({ ...request("post-launch-failure", async () => true), execute: async () => {
  postLaunchCalls++; return { ok: true, data: [], usable: true, requestAccepted: true }; } });
assert.equal(launched.kind, "completed"); assert.equal(launched.result.ok, true); assert.equal(postLaunchCalls, 1);
assert.equal(writeFailureGate.status().storageUnavailable, true);

// A 429 response can arrive while actual-start persistence still owns the gate.
let launchPersistEntered, launchPersistRelease, launchedWrites = 0, racedCalls = 0;
const launchPersisting = new Promise(resolve => { launchPersistEntered = resolve; });
const launchPersistHold = new Promise(resolve => { launchPersistRelease = resolve; });
const responseGate = new WatchlistMoomooAdmission({ now: () => 800000, sleep: async () => {},
  load: async () => ({ version: 1, starts: [], retryAt: 0, lastSeenAt: 800000 }),
  save: async () => { if (++launchedWrites === 2) { launchPersistEntered(); await launchPersistHold; } } });
const responseCoordinator = new IndicatorRequestCoordinator({ now: () => 800000, id: () => randomUUID(), admission: responseGate });
const limited = responseCoordinator.request({ ...request("response-429", async () => true), execute: async () => {
  racedCalls++; return { ok: false, reason: "rate_limited", requestAccepted: true, retryAfterMs: 30000 }; } });
await launchPersisting;
const queued = responseCoordinator.request({ ...request("response-other-scope", async () => true), scope: "another-offline-scope", execute: async () => {
  racedCalls++; return { ok: true, data: [], usable: true, requestAccepted: true }; } });
launchPersistRelease(); const [, deferred] = await Promise.all([limited, queued]);
assert.equal(deferred.kind, "deferred"); assert.equal(racedCalls, 1);
const receipt = { networkCalls: 0, transportStarts, reservationStarts: ledger.starts, observedSpacing,
  requiredSpacing: 750, spacingHeldAtActualDispatch: observedSpacing >= 750, sameRequestExecutions: sharedCalls,
  cooldown: { actualStart: cooldownStarts[0] ?? null, knownRetryAt: cooldownLedger.retryAt, sentDuringKnownCooldown },
  edgeCases: { slowPersistenceSpacing: slowStarts[1] - slowStarts[0], cooldownDuringPersistenceStarts: duringPersistStarts,
    lateCancellationStarts: lateCancelStarts, postLaunchFailureExecutions: postLaunchCalls, responseDuringPersistenceExecutions: racedCalls },
  source: "Actual coordinator/admission, virtual clock and in-memory persistence/HTTP doubles; not live requests." };
const directory = `data/watchlist-setup-validation/concurrency-qa-${Date.now()}-${randomUUID().slice(0, 8)}`;
await mkdir(directory, { recursive: true }); await writeFile(`${directory}/results.json`, JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt, null, 2)); console.log(`Saved ${directory}/results.json`);
