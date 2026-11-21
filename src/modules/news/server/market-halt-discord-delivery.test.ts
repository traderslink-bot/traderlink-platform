import Database from "better-sqlite3";
import { newsMarketHaltDiscordDeliveriesMigration } from "./database/migrations/0140_news_market_halt_discord_deliveries";
import { MarketHaltDiscordRepository } from "./market-halt-discord-repository";
import { MarketHaltDiscordDeliveryService } from "./market-halt-discord-delivery";

const channelId = "1552678787676774490";
const guildId = "1433570740430573642";
const haltId = "00000000-0000-4000-8000-000000000001";
const initialTime = "2026-09-24T14:21:00.000Z";
const configuration = { botToken: "synthetic-test-bot-token", channelId, guildId };

function fixture() {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  database.exec("CREATE TABLE news_market_halt_events (halt_id TEXT PRIMARY KEY) STRICT");
  database.prepare("INSERT INTO news_market_halt_events VALUES (?)").run(haltId);
  for (const sql of newsMarketHaltDiscordDeliveriesMigration.statements) database.exec(sql);
  const repository = new MarketHaltDiscordRepository(database);
  const enqueue = (stage: "initial" | "trade_time" = "initial", occurredAtUtc = initialTime) => repository.enqueue({
    channelId, haltId, stage, revision: stage === "initial" ? 0 : 1,
    title: "EXAM halted", body: "Nasdaq reports a volatility pause.", occurredAtUtc,
  });
  return { database, repository, enqueue };
}

describe("halt Discord durable delivery", () => {
  it("deduplicates enqueues, serializes updates and rejects completion by an abandoned claim", () => {
    const { database, repository, enqueue } = fixture();
    try {
      enqueue();
      enqueue();
      enqueue("trade_time", "2026-09-24T14:21:01.000Z");
      expect(database.prepare("SELECT COUNT(*) AS count FROM news_market_halt_discord_deliveries").get()).toEqual({ count: 2 });
      const first = repository.claimNext(channelId, initialTime)!;
      expect(repository.claimNext(channelId, "2026-09-24T14:21:02.000Z")).toBeNull();
      const retry = repository.claimNext(channelId, "2026-09-24T14:21:31.000Z")!;
      expect(retry.delivery_id).toBe(first.delivery_id);
      expect(retry.attempt_count).toBe(2);
      repository.complete(first, { code: "sent", messageId: "111" }, "2026-09-24T14:21:32.000Z");
      expect(repository.claimNext(channelId, "2026-09-24T14:21:33.000Z")).toBeNull();
      repository.complete(retry, { code: "sent", messageId: "111" }, "2026-09-24T14:21:34.000Z");
      expect(repository.claimNext(channelId, "2026-09-24T14:21:35.000Z")?.delivery_id).not.toBe(first.delivery_id);
    } finally { database.close(); }
  });

  it("preserves rate-limit cooldown across expiry and newly enqueued alerts", () => {
    const { database, repository, enqueue } = fixture();
    try {
      enqueue();
      repository.complete(repository.claimNext(channelId, initialTime)!, {
        code: "rate_limited", retryAfterMs: 180_000,
      }, initialTime);
      enqueue("trade_time", "2026-09-24T14:23:00.000Z");
      expect(repository.claimNext(channelId, "2026-09-24T14:23:01.000Z")).toBeNull();
      expect(repository.claimNext(channelId, "2026-09-24T14:24:00.000Z")).not.toBeNull();
    } finally { database.close(); }
  });

  it("expires a stale alert instead of sending it after an outage", () => {
    const { database, repository, enqueue } = fixture();
    try {
      enqueue();
      expect(repository.claimNext(channelId, "2026-09-24T14:23:00.000Z")).toBeNull();
      expect(database.prepare("SELECT state FROM news_market_halt_discord_deliveries").get()).toEqual({ state: "expired" });
    } finally { database.close(); }
  });

  it("retries an uncertain POST with the same enforced nonce and no mentions", async () => {
    const { database, repository, enqueue } = fixture();
    try {
      enqueue();
      let now = new Date(initialTime);
      const payloads: unknown[] = [];
      const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
        if (init?.method !== "POST") return Response.json({ id: channelId, guild_id: guildId, type: 0 });
        payloads.push(JSON.parse(String(init.body)));
        if (payloads.length === 1) throw new Error("uncertain network response");
        return Response.json({ id: "123456789" });
      });
      const service = new MarketHaltDiscordDeliveryService(repository, configuration, fetcher, () => now);
      expect((await service.runAvailable()).delivered).toBe(0);
      now = new Date("2026-09-24T14:21:16.000Z");
      expect((await service.runAvailable()).delivered).toBe(1);
      expect(payloads).toHaveLength(2);
      expect(payloads[1]).toEqual(payloads[0]);
      expect(payloads[0]).toMatchObject({ allowed_mentions: { parse: [] }, enforce_nonce: true });
      expect(database.prepare("SELECT state, discord_message_id FROM news_market_halt_discord_deliveries").get())
        .toEqual({ state: "delivered", discord_message_id: "123456789" });
    } finally { database.close(); }
  });

  it("does not post to a channel in another guild", async () => {
    const { database, repository, enqueue } = fixture();
    try {
      enqueue();
      const fetcher = vi.fn<typeof fetch>(async () => Response.json({ id: channelId, guild_id: "999", type: 0 }));
      const result = await new MarketHaltDiscordDeliveryService(repository, configuration, fetcher, () => new Date(initialTime)).runAvailable();
      expect(result.failureCode).toBe("invalid_destination");
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(fetcher.mock.calls[0]?.[1]?.method).not.toBe("POST");
    } finally { database.close(); }
  });
});
