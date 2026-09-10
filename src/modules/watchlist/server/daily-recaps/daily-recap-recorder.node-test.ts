import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import Database from "better-sqlite3";
import ts from "typescript";
import { platformWatchlistDailyRecapsMigration } from "@/src/modules/platform/server/database/migrations/0133_platform_watchlist_daily_recaps";

function recorderFixture() {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys = ON; CREATE TABLE platform_users(user_id TEXT PRIMARY KEY);");
  for (const statement of platformWatchlistDailyRecapsMigration.statements) db.exec(statement);
  const nativeRequire = createRequire(resolve(process.cwd(), "package.json"));
  const source = readFileSync("src/modules/watchlist/server/daily-recaps/watchlist-daily-recap-evidence-recorder.ts", "utf8");
  const loadedModule = { exports: {} as { recordWatchlistDailyRecapEvidence: (state: unknown) => void } };
  const openDb = new Proxy(db, { get(target, key) {
    if (key === "close") return () => {};
    const value = Reflect.get(target, key);
    return typeof value === "function" ? value.bind(target) : value;
  } });
  const requireStub = (name: string): unknown => {
    if (name === "server-only") return {};
    if (name.endsWith("open-platform-database")) return { openPlatformDatabase: () => openDb };
    if (name.endsWith("platform-migration-contract")) return { createCanonicalUuidV4: randomUUID };
    if (name.endsWith("traderslink-ai-read")) return { parseTradersLinkAiRead: () => null };
    return nativeRequire(name);
  };
  new Function("exports", "require", "module", ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText)(loadedModule.exports, requireStub, loadedModule);
  return { db, record: loadedModule.exports.recordWatchlistDailyRecapEvidence };
}
const at = Date.parse("2026-09-08T13:30:00Z");
const state = { symbol: "PDSB", firstPostedAt: at, latestPrice: 0.65, latestPriceObservedAt: at + 1000, updatedAt: at + 1000, status: "active", cards: {} };

test("a new lower low clears the earlier recovery and preserves its price evidence", () => {
  const { db, record } = recorderFixture();
  const quote = (price: number, offset: number) => record({
    ...state, potentialGain: { startingPrice: 10 }, latestPrice: price,
    latestPriceObservedAt: at + offset, updatedAt: at + offset,
  });
  const recovery = () => db.prepare(`SELECT low_accepted_price_text, low_accepted_at_ms,
    high_after_low_price_text, high_after_low_at_ms FROM platform_watchlist_recap_candidates`).get();
  try {
    quote(10, 1000);
    quote(11, 2000);
    quote(9, 3000);
    assert.deepEqual(recovery(), {
      low_accepted_price_text: "9", low_accepted_at_ms: at + 3000,
      high_after_low_price_text: null, high_after_low_at_ms: null,
    });
    assert.equal((db.prepare(`SELECT COUNT(*) AS count FROM platform_watchlist_recap_evidence_revisions
      WHERE evidence_kind = 'price_snapshot'`).get() as { count: number }).count, 3);
    quote(10, 4000);
    assert.deepEqual(recovery(), {
      low_accepted_price_text: "9", low_accepted_at_ms: at + 3000,
      high_after_low_price_text: "10", high_after_low_at_ms: at + 4000,
    });
  } finally { db.close(); }
});

test("a later price cannot create a fabricated original publication baseline", () => {
  const { db, record } = recorderFixture();
  try {
    record(state);
    assert.equal((db.prepare("SELECT COUNT(*) AS count FROM platform_watchlist_recap_candidates").get() as { count: number }).count, 0);
  } finally { db.close(); }
});

test("known baseline survives missing later metadata and removal freezes evidence", () => {
  const { db, record } = recorderFixture();
  try {
    record({ ...state, potentialGain: { startingPrice: 0.5 } });
    record({ ...state, latestPrice: 0.6, latestPriceObservedAt: at + 2000, updatedAt: at + 2000 });
    assert.equal((db.prepare("SELECT first_posted_price_text FROM platform_watchlist_recap_candidates").get() as { first_posted_price_text: string }).first_posted_price_text, "0.5");
    record({ ...state, status: "deactivated", latestPriceObservedAt: at + 3000, updatedAt: at + 3000 });
    const count = db.prepare("SELECT COUNT(*) AS count FROM platform_watchlist_recap_evidence_revisions").get();
    record({ ...state, latestPrice: 0.9, latestPriceObservedAt: at + 4000, updatedAt: at + 4000 });
    assert.deepEqual(db.prepare("SELECT COUNT(*) AS count FROM platform_watchlist_recap_evidence_revisions").get(), count);
  } finally { db.close(); }
});
