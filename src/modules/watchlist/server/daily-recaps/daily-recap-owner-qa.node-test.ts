import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import Database from "better-sqlite3";
import ts from "typescript";
import { platformWatchlistDailyRecapsMigration } from "@/src/modules/platform/server/database/migrations/0133_platform_watchlist_daily_recaps";
import type * as Service from "./daily-recap-owner-service";

function fixture() {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys = ON; CREATE TABLE platform_users(user_id TEXT PRIMARY KEY);");
  for (const statement of platformWatchlistDailyRecapsMigration.statements) db.exec(statement);
  const userId = randomUUID();
  db.prepare("INSERT INTO platform_users VALUES (?)").run(userId);
  const nativeRequire = createRequire(resolve(process.cwd(), "package.json"));
  const openDb = new Proxy(db, { get(target, key) {
    if (key === "close") return () => {};
    const value = Reflect.get(target, key);
    return typeof value === "function" ? value.bind(target) : value;
  } });
  let complete: (() => void) | undefined;
  function load<T>(file: string): T {
    const mod = { exports: {} };
    const stub = (name: string): unknown => {
      if (name === "server-only") return {};
      if (name.endsWith("open-platform-database")) return { openPlatformDatabase: () => openDb };
      if (name.endsWith("platform-migration-contract")) return { createCanonicalUuidV4: randomUUID };
      if (name.endsWith("traderslink-ai-read")) return { parseTradersLinkAiRead: () => null };
      if (name === "./daily-analysis-recap-builder") return { buildDailyWatchlistAnalysisRecap: () => "Generated recap" };
      if (name.endsWith("watchlist-runtime-admin-client")) return { requestWatchlistRuntimeRaw: (input: { body: string }) => new Promise((resolveRequest) => {
        const { idempotencyKey } = JSON.parse(input.body);
        complete = () => resolveRequest({ ok: true, body: JSON.stringify({ posted: true, receipt: { idempotencyKey, discordMessageId: "123", discordChannelId: "456" } }) });
      }) };
      return nativeRequire(name);
    };
    new Function("exports", "require", "module", ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText)(mod.exports, stub, mod);
    return mod.exports as T;
  }
  const service = load<typeof Service>("src/modules/watchlist/server/daily-recaps/daily-recap-owner-service.ts");
  const recorder = load<{ recordWatchlistDailyRecapEvidence: (value: unknown) => void }>("src/modules/watchlist/server/daily-recaps/watchlist-daily-recap-evidence-recorder.ts");
  const at = Date.parse("2026-09-08T13:30:00Z");
  recorder.recordWatchlistDailyRecapEvidence({ symbol: "PDSB", firstPostedAt: at, latestPrice: 0.65, latestPriceObservedAt: at + 1000, updatedAt: at + 1000, status: "active", cards: {}, potentialGain: { startingPrice: 0.5 } });
  const candidateId = (db.prepare("SELECT candidate_id FROM platform_watchlist_recap_candidates").get() as { candidate_id: string }).candidate_id;
  return { db, service, userId, candidateId, record: recorder.recordWatchlistDailyRecapEvidence, complete: () => { assert.ok(complete); complete(); } };
}

test("final body survives service reads, preserves revisions, and never posts on save", () => {
  const f = fixture();
  try {
    const input = { userId: f.userId, newYorkDate: "2026-09-08", bodyText: "Owner final body" };
    f.service.saveDailyRecapFinalDraft(input);
    f.service.saveDailyRecapFinalDraft({ ...input, bodyText: "Corrected final body" });
    assert.equal(f.service.readDailyRecapFinalDraft(input.newYorkDate, f.userId), "Corrected final body");
    assert.equal(f.service.readDailyRecapFinalDraft("2026-09-09", f.userId), null);
    assert.equal(f.service.readDailyRecapFinalDraft(input.newYorkDate, randomUUID()), null);
    assert.equal((f.db.prepare("SELECT COUNT(*) n FROM platform_watchlist_recap_composition_revisions").get() as { n: number }).n, 2);
    assert.deepEqual(f.service.readDailyRecapPostHistory(input.newYorkDate, f.userId), []);
  } finally { f.db.close(); }
});

test("saved body keeps original ticker associations when selections change", async () => {
  const f = fixture();
  try {
    const date = "2026-09-08";
    f.service.generateDailyRecapCandidate(f.candidateId, f.userId);
    f.service.setDailyRecapSelection({ candidateId: f.candidateId, userId: f.userId, selected: true });
    f.service.saveDailyRecapFinalDraft({ userId: f.userId, newYorkDate: date, bodyText: "PDSB recap" });
    const items = f.service.readDailyRecapFinalItems(date, f.userId);
    assert.equal(items[0].candidateId, f.candidateId);
    f.service.setDailyRecapSelection({ candidateId: f.candidateId, userId: f.userId, selected: false });
    const at = Date.parse("2026-09-08T14:30:00Z");
    f.record({ symbol: "OTHER", firstPostedAt: at, latestPrice: 1.2, latestPriceObservedAt: at + 1, updatedAt: at + 1, status: "active", cards: {}, potentialGain: { startingPrice: 1 } });
    const other = f.service.readDailyRecapOwnerCandidates(date).find((candidate) => candidate.symbol === "OTHER")!;
    f.service.generateDailyRecapCandidate(other.candidateId, f.userId);
    f.service.setDailyRecapSelection({ candidateId: other.candidateId, userId: f.userId, selected: true });
    const posting = f.service.postDailyRecapComposition({ userId: f.userId, newYorkDate: date, bodyText: "PDSB owner-edited recap", items });
    f.complete();
    assert.equal((await posting).posted, true);
    const results = f.service.readDailyRecapOwnerCandidates(date);
    assert.equal(results.find((candidate) => candidate.symbol === "PDSB")!.reviewState, "posted");
    assert.equal(results.find((candidate) => candidate.symbol === "OTHER")!.reviewState, "add_to_recap");
    assert.deepEqual(f.service.readDailyRecapFinalItems(date, f.userId), items);
    assert.throws(() => f.service.saveDailyRecapFinalDraft({ userId: f.userId, newYorkDate: "2026-09-09", bodyText: "Wrong date", items }), /invalid_recap_items/);
  } finally { f.db.close(); }
});

for (const editDuringDelivery of [false, true]) test(`delivery marks only submitted revision: concurrent edit=${editDuringDelivery}`, async () => {
  const f = fixture();
  try {
    f.service.generateDailyRecapCandidate(f.candidateId, f.userId);
    f.service.setDailyRecapSelection({ candidateId: f.candidateId, userId: f.userId, selected: true });
    const posting = f.service.postDailyRecapComposition({ userId: f.userId, newYorkDate: "2026-09-08", bodyText: "Submitted body" });
    if (editDuringDelivery) {
      f.service.editDailyRecapCandidate({ candidateId: f.candidateId, userId: f.userId, recapText: "New unsent revision" });
      f.service.saveDailyRecapFinalDraft({ userId: f.userId, newYorkDate: "2026-09-08", bodyText: "New unsent final body" });
    }
    f.complete();
    assert.equal((await posting).posted, true);
    const candidate = f.service.readDailyRecapOwnerCandidates("2026-09-08")[0];
    assert.equal(candidate.reviewState, editDuringDelivery ? "add_to_recap" : "posted");
    assert.equal(candidate.recapText, editDuringDelivery ? "New unsent revision" : "Generated recap");
    assert.equal(f.service.readDailyRecapPostHistory("2026-09-08", f.userId)[0].bodyText, "Submitted body");
    assert.equal(f.service.readDailyRecapFinalDraft("2026-09-08", f.userId), editDuringDelivery ? "New unsent final body" : "Submitted body");
  } finally { f.db.close(); }
});
