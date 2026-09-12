import assert from "node:assert/strict";
import { IndicatorRequestCoordinator } from "../lib/live-watchlist/indicators/indicator-request-coordinator.ts";

let now = 1_000_000, serial = 0, calls = 0;
const events = [];
const coordinator = new IndicatorRequestCoordinator({ now: () => now, id: () => `request-${++serial}`,
  sleep: async ms => { now += ms; }, audit: e => events.push(e) });
const base = { provider: "moomoo", scope: "private-test-scope", consumer: "indicators", requestKey: "A:1m" };
let release;
const first = coordinator.request({ ...base, execute: async () => {
  calls++; return new Promise(done => { release = done; });
} });
const second = coordinator.request({ ...base, consumer: "other-consumer", execute: async () => { throw Error("must coalesce"); } });
release({ ok: true, data: [1], usable: true, requestAccepted: true });
assert.deepEqual(await first, await second);
assert.equal(calls, 1);
assert.equal(events.filter(e => e.kind === "started").length, 1);
assert.equal(events.filter(e => e.kind === "coalesced").length, 1);
assert.ok(!JSON.stringify(events).includes("private-test-scope"));

await coordinator.request({ ...base, requestKey: "A:limit", execute: async () => {
  calls++; return { ok: false, reason: "rate_limited", requestAccepted: false, retryAfterMs: 120_000 };
} });
const beforeDeferred = calls;
const blocked = await coordinator.request({ ...base, requestKey: "B:1m", execute: async () => {
  calls++; return { ok: true, data: [], usable: true, requestAccepted: true };
} });
assert.equal(blocked.kind, "deferred");
assert.equal(calls, beforeDeferred);
const fallback = await coordinator.request({ ...base, provider: "yahoo", requestKey: "B:1m", execute: async () => {
  calls++; return { ok: true, data: [2], usable: true, requestAccepted: true };
} });
assert.equal(fallback.kind, "completed");

now += 120_000;
const empty = await coordinator.request({ ...base, requestKey: "A:probe", execute: async () => ({
  ok: true, data: [], usable: false, requestAccepted: true,
}) });
assert.equal(empty.result.usable, false);
const healthyOther = await coordinator.request({ ...base, requestKey: "B:after-probe", execute: async () => ({
  ok: true, data: [3], usable: true, requestAccepted: true,
}) });
assert.equal(healthyOther.kind, "completed");
assert.equal(healthyOther.result.usable, true);

let retries = 0;
const retry = await coordinator.request({ ...base, requestKey: "retry", execute: async () => {
  retries++;
  return retries === 1 ? { ok: false, reason: "provider_error", requestAccepted: false }
    : { ok: true, data: [], usable: true, requestAccepted: true };
} });
assert.equal(retries, 2);
assert.equal(retry.transportIds.length, 2);
assert.notEqual(retry.transportIds[0], retry.transportIds[1]);

let simultaneous = 0, peak = 0;
const releases = [];
const queued = Array.from({ length: 5 }, (_, i) => coordinator.request({ ...base, requestKey: `pool-${i}`, execute: async () => {
  simultaneous++; peak = Math.max(peak, simultaneous);
  await new Promise(resolve => releases.push(() => { simultaneous--; resolve(); }));
  return { ok: true, data: [], usable: true, requestAccepted: true };
} }));
for (let i = 0; i < 5; i++) {
  while (!releases.length) await new Promise(resolve => setImmediate(resolve));
  releases.shift()();
}
await Promise.all(queued);
assert.equal(peak, 2);
const auditFailure = new IndicatorRequestCoordinator({ audit: () => { throw new Error("storage unavailable"); } });
const survived = await auditFailure.request({ ...base, execute: async () => ({ ok: true, data: [], usable: true, requestAccepted: true }) });
assert.equal(survived.kind, "completed");
assert.equal(auditFailure.status.auditFailures, 2);
console.log("PASS: offline request coalescing, unique attempt attribution, shared throttle, independent Yahoo scope, empty-probe recovery, bounded retry/concurrency and audit-failure isolation. No network calls.");
