import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { IndicatorRequestCoordinator } from "../lib/live-watchlist/indicators/indicator-request-coordinator.ts";
import { WatchlistMoomooAdmission } from "../lib/live-watchlist/setups/setup-admission.ts";
globalThis.fetch = async () => { throw Error("No network in recovery QA"); };
let now = 100000, executions = 0;
const coordinator = new IndicatorRequestCoordinator({ now: () => now, id: () => randomUUID() });
const request = { provider: "moomoo", scope: "offline-scope", requestKey: "initial", consumer: "offline", maxAttempts: 1,
  execute: async () => { executions++; return { ok: false, reason: "rate_limited", requestAccepted: true, retryAfterMs: 1000 }; } };
await coordinator.request(request);
now += 2000;
await assert.rejects(coordinator.request({ ...request, requestKey: "preflight-error", isCurrent: async () => { throw Error("offline eligibility read failure"); } }), /offline eligibility/u);
const successful = { ...request, requestKey: "recovery", isCurrent: async () => true,
  execute: async () => { executions++; return { ok: true, data: [], usable: true, requestAccepted: true }; } };
const firstRecovery = await coordinator.request(successful);
now += 120001;
const laterRecovery = await coordinator.request({ ...successful, requestKey: "later-recovery" });
assert.equal(firstRecovery.kind, "completed"); assert.equal(firstRecovery.result.ok, true);
assert.equal(laterRecovery.kind, "completed"); assert.equal(laterRecovery.result.ok, true);
assert.equal(executions, 3);
const cases = [];
// First check is outside the gate; later ones run inside admission, around
// spacing and persistence waits. Exercise synchronous and rejected exceptions.
for (const failAt of [1, 2, 3, 4]) for (const synchronous of [false, true]) {
  let clock = 500000, calls = 0, checks = 0;
  const events = [];
  const gate = new WatchlistMoomooAdmission({ now: () => clock, sleep: async ms => { clock += ms; },
    load: async () => ({ version: 1, starts: [], retryAt: 0, lastSeenAt: clock }), save: async () => {} });
  const runtime = new IndicatorRequestCoordinator({ now: () => clock, id: () => randomUUID(), admission: gate, audit: event => events.push(event) });
  const initial = { ...request, requestKey: `seed-${failAt}-${synchronous}`, execute: async () => {
    calls++; return { ok: false, reason: "rate_limited", requestAccepted: true, retryAfterMs: 1000 }; } };
  await runtime.request(initial);
  clock += 2000;
  const before = events.length;
  const eligibility = () => { if (++checks === failAt) {
    if (synchronous) throw Error("offline eligibility failure");
    return Promise.reject(Error("offline eligibility failure"));
  } return Promise.resolve(true); };
  const failed = runtime.request({ ...initial, requestKey: "eligibility-failure", isCurrent: eligibility });
  if (failAt === 1) await assert.rejects(failed, /eligibility failure/u);
  else { const value = await failed; assert.equal(value.kind, "completed"); assert.equal(value.transportIds.length, 0); }
  assert.equal(calls, 1); assert.equal(events.slice(before).some(event => event.kind === "started" || event.kind === "finished"), false);
  const valid = { ...initial, requestKey: "valid-recovery", isCurrent: async () => true, execute: async () => {
    calls++; return { ok: true, data: [], usable: true, requestAccepted: true }; } };
  const recovered = await runtime.request(valid);
  assert.equal(recovered.kind, "completed"); assert.equal(recovered.result.ok, true); assert.equal(calls, 2);
  cases.push({ failAt, synchronous, recovered: true, executions: calls });
}
// A failed attempt releases only its own ownership. While a real recovery probe
// is pending, another request is deferred; it cannot clear that active owner.
let ownerClock = 900000, ownerCalls = 0, releaseOwner, ownerEntered;
const ownerHeld = new Promise(resolve => { releaseOwner = resolve; });
const ownerChecking = new Promise(resolve => { ownerEntered = resolve; });
const ownership = new IndicatorRequestCoordinator({ now: () => ownerClock, id: () => randomUUID() });
await ownership.request({ ...request, requestKey: "ownership-seed", execute: async () => ({
  ok: false, reason: "rate_limited", requestAccepted: true, retryAfterMs: 1000,
}) });
ownerClock += 2000;
const recover = { ...request, requestKey: "owner", isCurrent: async () => { ownerEntered(); await ownerHeld; return true; },
  execute: async () => { ownerCalls++; return { ok: true, data: [], usable: true, requestAccepted: true }; } };
const activeOwner = ownership.request(recover);
await ownerChecking;
const other = await ownership.request({ ...recover, requestKey: "other" });
assert.equal(other.kind, "deferred"); assert.equal(other.reason, "recovery_probe"); assert.equal(ownerCalls, 0);
releaseOwner(); const ownerResult = await activeOwner;
assert.equal(ownerResult.result.ok, true); assert.equal(ownerCalls, 1);
const receipt = { networkCalls: 0, executions, firstRecovery, laterRecovery,
  cases, concurrentRecoveryExecutions: ownerCalls, findingResolved: true,
  source: "Actual coordinator/admission, virtual clock and HTTP/eligibility doubles. Recovery resumes with no service restart or duplicate requests." };
const directory = `data/watchlist-setup-validation/recovery-qa-${Date.now()}-${randomUUID().slice(0, 8)}`;
await mkdir(directory, { recursive: true }); await writeFile(`${directory}/results.json`, JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt, null, 2)); console.log(`Saved ${directory}/results.json`);
