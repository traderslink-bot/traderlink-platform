import assert from "node:assert/strict";
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { IndicatorAuditStore } from "../modules/watchlist/server/indicators/indicator-audit-store.ts";

const directory = await mkdtemp(join(tmpdir(), "traderlink-indicator-audit-check-"));
let now = Date.parse("2026-09-12T15:00:00Z"), assertions = 0;
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
const instanceId = randomUUID(), nextInstance = randomUUID();
const record = (outcome = "running", queuedAt = now) => ({ id: randomUUID(), instanceId, symbol: "TNON", activationId: "TNON:activation-1",
  queuedAt, startedAt: now, finishedAt: null, outcome, calculationId: null, attempts: [], timeframes: [] });
const store = new IndicatorAuditStore(directory, () => now);
const running = record(), completed = record("published", now - 1);
store.enqueue({ ...running, unexpectedSecret: "not-stored" }); store.enqueue(completed); await store.flush();
let page = await store.history({ limit: 1 });
equal(page.records.length, 1); equal(page.records[0].id, running.id);
equal(JSON.stringify(page).includes("not-stored"), false);
equal((await store.history({ before: page.nextCursor, limit: 1 })).records[0].id, completed.id);
const restarted = new IndicatorAuditStore(directory, () => now);
await restarted.reconcileRestart(nextInstance);
page = await restarted.history();
equal(page.records.find(row => row.id === running.id).outcome, "interrupted_unknown");
equal(page.records.find(row => row.id === completed.id).outcome, "published");
equal(page.coverage.bufferedEventsMayBeMissingAfterRestart, true);

const evidence = { id: randomUUID(), refreshId: completed.id, createdAt: now, symbol: "TNON", activationId: "TNON:activation-1",
  algorithmVersion: "indicators-v1", calendarId: "test-calendar", timeframes: [], vwap: null };
equal(await restarted.saveCalculation(evidence), true);
equal((await restarted.calculation(evidence.id)).evidence, evidence);
restarted.enqueue({ ...completed, calculationId: evidence.id }); await restarted.flush();
equal((await restarted.latestCalculation("TNON", "TNON:activation-1")).id, evidence.id);
equal(await restarted.latestCalculation("TNON", "TNON:old"), null);
equal((await new IndicatorAuditStore(directory, () => now).latestCalculation("TNON", "TNON:activation-1")).id, evidence.id);
equal(await restarted.saveCalculation({ ...evidence, symbol: "TRUG" }), false);
equal((await restarted.calculation(evidence.id)).evidence.symbol, "TNON");
equal((await restarted.calculation(randomUUID())).status, "expired_or_unavailable");
await assert.rejects(() => restarted.calculation("../../private")); assertions++;
await assert.rejects(() => restarted.history({ before: "../private" })); assertions++;
const burst = Array.from({ length: 70 }, () => record("published", now));
for (const item of burst) restarted.enqueue(item);
await restarted.flush();
equal((await restarted.history({ limit: 100 })).records.length, 66);
equal((await restarted.history()).coverage.droppedWrites >= 7, true);
now += 15 * 86_400_000;
restarted.enqueue(record("published", now)); await restarted.flush();
equal((await restarted.history()).records.length, 1);
equal((await restarted.calculation(evidence.id)).status, "expired_or_unavailable");
equal((await restarted.history()).coverage.expiredSnapshots, 1);
equal((await new IndicatorAuditStore(directory, () => now).history()).coverage.expiredSnapshots, 1);
equal((await readdir(directory)).some(name => name.endsWith(".tmp")), false);
// A few isolated fixture files remain in the OS temp directory; no private app data was opened or modified.
console.log(`PASS: ${assertions} bounded offline audit persistence/restart/pagination/immutable replay/expiry assertions. No live database, network, AI, server or migration.`);
