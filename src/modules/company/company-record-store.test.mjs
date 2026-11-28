import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openCompanyRecordStore } from "./company-record-store.mjs";

const CLRO = { symbol: "CLRO", cik: "0000840715" };
const MEDS = { symbol: "MEDS", cik: "0002030763" };

test("deduplicates roster work, survives restart, and independently publishes source recovery", () => {
  const directory = mkdtempSync(join(tmpdir(), "traderlink-company-store-"));
  const path = join(directory, "company.sqlite");
  let store = openCompanyRecordStore(path);
  try {
    assert.equal(store.reconcileRoster(1, [CLRO], 1000), true);
    assert.equal(store.reconcileRoster(1, [CLRO], 1001), false);
    assert.equal(store.read(["UNKNOWN"]).companies[0].state, "pending");
    const originalRevision = store.read(["CLRO"]).revision;

    const jobs = Array.from({ length: 3 }, () => store.claim(1001, 100));
    const metrics = jobs.find(job => job.source === "metrics");
    const profile = jobs.find(job => job.source === "profile");
    const sec = jobs.find(job => job.source === "sec");
    assert.equal(store.defer(metrics, 1002, 2000), true);
    assert.equal(store.complete(profile, 1003, null, "unavailable"), true);
    assert.equal(store.complete(sec, 1004, { period: "2025-12-31", revenue: 0 }), true);
    assert.equal(store.claim(1005, 100), undefined);

    store.close();
    store = openCompanyRecordStore(path);
    const beforeRetry = store.read(["CLRO"]);
    assert.deepEqual(beforeRetry.companies[0].sec.value, { period: "2025-12-31", revenue: 0 });
    assert.equal(beforeRetry.companies[0].metrics.state, "retrying");
    assert.equal(beforeRetry.companies[0].metrics.retryAt, 2000);
    const lease = store.claim(2000, 100);
    assert.equal(lease.attempts, 2);
    assert.equal(store.claim(2099, 100), undefined);
    const replacement = store.claim(2100, 100);
    assert.equal(replacement.attempts, 3);
    assert.equal(store.complete(lease, 2101, { yield: 1 }), false);
    assert.equal(store.complete(replacement, 2102, { yield: 0 }), true);
    assert.equal(store.read(["CLRO"]).companies[0].metrics.value.yield, 0);
    assert.equal(store.read(["CLRO"], { revision: beforeRetry.revision }).companies[0].metrics.state, "retrying");
    assert.equal(store.read(["CLRO"], { asOf: 2101 }).companies[0].metrics.state, "retrying");
    assert.equal(store.read(["CLRO"], { revision: originalRevision }).companies[0].sec.state, "pending");
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("preserves old issuer identity while deduplicating SEC work across ticker aliases", () => {
  const store = openCompanyRecordStore(":memory:");
  try {
    const alias = { ...CLRO, symbol: "CLROB" };
    store.reconcileRoster(1, [CLRO, alias], 1000);
    const jobs = Array.from({ length: 5 }, () => store.claim(1001, 100));
    assert.equal(jobs.filter(job => job.source === "sec").length, 1);
    for (const job of jobs) store.complete(job, 1002, { issuer: CLRO.cik });
    const prior = store.read(["CLRO", "CLROB"]);
    assert.equal(prior.companies[1].sec.value.issuer, CLRO.cik);
    store.enqueue("CLROB/1", "metrics", "next-session", 1002);
    store.reconcileRoster(2, [{ ...MEDS, symbol: "CLRO" }], 1003);
    assert.equal(store.read(["CLRO", "CLROB"]).companies[0].sec.state, "pending");
    assert.equal(store.read(["CLRO", "CLROB"]).companies[1].tracked, false);
    assert.equal(store.read(["CLRO"], { revision: prior.revision }).companies[0].sec.value.issuer, CLRO.cik);
    const newJobs = Array.from({ length: 3 }, () => store.claim(1004, 100));
    assert.ok(newJobs.every(job => job && !job.subject.startsWith("CLROB")));
    assert.equal(store.claim(1004, 100), undefined);
  } finally {
    store.close();
  }
});


test("prioritizes Scanner jobs and preserves saved data when a background ticker moves onto the roster", () => {
  const store = openCompanyRecordStore(":memory:");
  try {
    const now = 1000;
    store.reconcileBackgroundRoster([MEDS], now);
    assert.deepEqual(store.listTracked(), []);
    assert.equal(store.listBackground()[0].symbol, MEDS.symbol);
    const secondary = store.read([MEDS.symbol]).companies[0];
    assert.equal(secondary.tracked, false);
    assert.equal(secondary.background, true);

    store.reconcileRoster(1, [CLRO], now + 1);
    assert.equal(store.claim(now + 2, 60_000, "sec", true), undefined);
    const main = store.claim(now + 2, 60_000, "sec");
    assert.equal(main.subject, CLRO.cik);
    store.complete(main, now + 3, { current: "Scanner" });
    const extra = store.claim(now + 4, 60_000, "sec", true);
    assert.equal(extra.subject, MEDS.cik);
    store.complete(extra, now + 5, { current: "Background" });

    store.reconcileRoster(2, [CLRO, MEDS], now + 6);
    const promoted = store.read([MEDS.symbol]).companies[0];
    assert.equal(promoted.tracked, true);
    assert.equal(promoted.background, undefined);
    assert.equal(promoted.sec.value.current, "Background");
    assert.deepEqual(store.listBackground(), []);
  } finally { store.close(); }
});
