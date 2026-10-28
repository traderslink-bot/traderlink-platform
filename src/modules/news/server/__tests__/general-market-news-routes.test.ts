// @vitest-environment node
import Database from "better-sqlite3";
import { describe, expect, it, vi } from "vitest";
import { generalMarketNewsSchema } from "../database/general-market-news-schema";
import { generalNewsFeedResponse, generalNewsArticleResponse, generalNewsIngestResponse, type GeneralNewsHttpDependencies } from "../general-market-news-http";
import { generalNewsSignature } from "../general-market-news-ingest";
const first = "11111111-1111-4111-8111-111111111111", second = "22222222-2222-4222-8222-222222222222";
const now = new Date("2026-10-28T18:00:00.000Z"), secret = "synthetic-delivery-secret-never-real-credentials";
function syntheticIdentity(userId: string): ReturnType<GeneralNewsHttpDependencies["identity"]> {
  return { mode: "platform_session", sessionId: first, displayName: "Synthetic test user",
    scope: { userId, workspaceId: first, workspaceRole: "owner", allowedAccountIds: [], activeAccountId: null },
    discord: { guildOwner: false, roleIds: [] } };
}
describe("personal-news route boundary", () => {
  it("denies a third user before any database lookup", () => {
    const read = vi.fn();
    const deps = { identity: () => ({ scope: { userId: "33333333-3333-4333-8333-333333333333" } }), environment: { TRADERLINK_GENERAL_NEWS_USER_IDS: `${first},${second}` }, read } as unknown as GeneralNewsHttpDependencies;
    expect(generalNewsFeedResponse(new Request("https://example.com/api"), deps).status).toBe(403);
    expect(generalNewsArticleResponse(new Request("https://example.com/api"), "a".repeat(64), deps).status).toBe(403);
    expect(read).not.toHaveBeenCalled();
  });
  it("delivers signed fixture and lets both authorized users read list/detail with private headers", async () => {
    const db = new Database(":memory:"); db.pragma("foreign_keys=ON");
    generalMarketNewsSchema.statements.forEach(sql => db.exec(sql));
    let userId = first;
    const deps: GeneralNewsHttpDependencies = { identity: () => syntheticIdentity(userId), now: () => now,
      environment: { NODE_ENV: "test", TRADERLINK_GENERAL_NEWS_USER_IDS: `${first},${second}`, TRADERLINK_GENERAL_NEWS_INGEST_SECRET: secret },
      read: operation => operation(db), write: operation => operation(db) };
    try {
      const timestamp = String(now.getTime() / 1000), id = "fixture-batch";
      const body = JSON.stringify({ version: 1, state: "fresh", collection: "general", collectedAt: now.toISOString(), articles: [{ title: "Fixture story", content: "Fixture body", date: now.toISOString(), link: "https://example.com/story", collection: "general", symbols: [] }] });
      const response = await generalNewsIngestResponse(new Request("https://example.com/ingest", { method: "POST", body,
        headers: { "x-news-timestamp": timestamp, "x-news-delivery-id": id, "x-news-signature": generalNewsSignature(secret, timestamp, id, body) } }), deps);
      expect(response.status).toBe(200);
      for (userId of [first, second]) {
        const feed = generalNewsFeedResponse(new Request("https://example.com/api"), deps);
        expect(feed.status).toBe(200); expect(feed.headers.get("cache-control")).toContain("no-store");
        const payload = await feed.json(); expect(payload.articles).toHaveLength(1);
        const detail = generalNewsArticleResponse(new Request("https://example.com/api"), payload.articles[0].id, deps);
        expect((await detail.json()).article.body).toBe("Fixture body");
      }
      expect(generalNewsFeedResponse(new Request("https://example.com/api?from=2026-02-30"), deps).status).toBe(400);
      expect(generalNewsFeedResponse(new Request("https://example.com/api?cursor=invalid"), deps).status).toBe(400);
    } finally { db.close(); }
  });
});
