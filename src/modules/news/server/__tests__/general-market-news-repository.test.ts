// @vitest-environment node
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { generalMarketNewsSchema } from "../database/general-market-news-schema";
import { GeneralMarketNewsRepository } from "../general-market-news-repository";
import { normalizeGeneralNews } from "../general-market-news-normalizer";
const at = "2026-10-28T18:00:00.000Z";
const databases: Database.Database[] = [];
function setup() {
  const db = new Database(":memory:"); databases.push(db); db.pragma("foreign_keys=ON");
  generalMarketNewsSchema.statements.forEach(sql => db.exec(sql));
  return { db, repo: new GeneralMarketNewsRepository(db) };
}
const item = (n: number, collection = "general") => normalizeGeneralNews({
  title: `Story ${n}`, date: at, content: `Body ${n}`, link: `https://example.com/${n}`,
  symbols: n === 0 ? [] : ["AAPL.US", "MSFT.US"], collection,
}, at);
afterEach(() => databases.splice(0).forEach(db => db.close()));
describe("isolated general-news storage", () => {
  it("keeps unfiltered general coverage and multi-symbol ticker lookup distinct", () => {
    const { repo } = setup();
    repo.ingest("one", "hash1", [item(0), item(1)], at, at, "fresh");
    repo.ingest("two", "hash2", [item(2, "ticker")], at, at, "partial", "ticker");
    expect(repo.list().articles).toHaveLength(2);
    expect(repo.list({ ticker: "AAPL.US" }).articles).toHaveLength(2);
    expect(repo.list().status.state).toBe("fresh");
    expect(repo.find(item(0).id)?.symbols).toEqual([]);
    expect(repo.list().articles[0]).not.toHaveProperty("body");
  });
  it("is replay-idempotent, rejects conflicting batch ID and rolls back atomically", () => {
    const { repo, db } = setup();
    expect(repo.ingest("one", "hash", [item(1)], at, at, "fresh")).toBe("accepted");
    expect(repo.ingest("one", "hash", [item(1)], at, at, "fresh")).toBe("duplicate");
    expect(() => repo.ingest("one", "different", [], at, at, "fresh")).toThrow("delivery_conflict");
    expect(() => repo.ingest("broken", "hash", [item(2), { ...item(3), id: "bad" }], at, at, "fresh")).toThrow();
    expect(repo.find(item(2).id)).toBeNull();
    expect(db.prepare("SELECT count(*) n FROM news_general_revisions").get()).toEqual({ n: 1 });
  });
  it("paginates ties without missing or repeating articles and never emits bodies in list", () => {
    const { repo } = setup();
    repo.ingest("many", "hash", Array.from({ length: 60 }, (_, i) => item(i)), at, at, "fresh");
    const first = repo.list(), next = repo.list({ cursor: first.nextCursor! });
    expect(first.articles).toHaveLength(50); expect(next.articles).toHaveLength(10);
    expect(new Set([...first.articles, ...next.articles].map(a => a.id)).size).toBe(60);
    expect(first.articles.every(a => !("body" in a))).toBe(true);
  });
  it("preserves general provenance across revisions and does not replace with older retry", () => {
    const { repo, db } = setup(); const one = item(1);
    repo.ingest("one", "1", [one], at, at, "fresh");
    const later = "2026-10-28T18:01:00.000Z";
    repo.ingest("two", "2", [{ ...one, headline: "New title", contentHash: "new", receivedAt: later, collection: "ticker" }], later, later, "fresh", "ticker");
    repo.ingest("late", "3", [one], at, later, "fresh");
    expect(repo.list().articles[0].headline).toBe("New title");
    expect(db.prepare("SELECT count(*) n FROM news_general_revisions").get()).toEqual({ n: 2 });
  });
  it("prunes only new private data and cascades its indexes/history", () => {
    const { repo, db } = setup(); repo.ingest("old", "h", [item(1)], at, at, "fresh");
    repo.ingest("new", "h", [], "2026-11-06T18:00:00.000Z", "2026-11-06T18:00:00.000Z", "paused");
    expect(repo.list().articles).toEqual([]);
    expect(db.prepare("SELECT count(*) n FROM news_general_symbols").get()).toEqual({ n: 0 });
    expect(db.prepare("SELECT count(*) n FROM news_general_revisions").get()).toEqual({ n: 0 });
  });
  it("does not initialize an uninstalled schema", () => {
    const db = new Database(":memory:"); databases.push(db);
    expect(() => new GeneralMarketNewsRepository(db).list()).toThrow();
    expect(db.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table'").get()).toEqual({ n: 0 });
  });
});
