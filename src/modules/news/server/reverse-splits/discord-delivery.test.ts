import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newsReverseSplitAlertsMigration } from "../database/migrations/0142_news_reverse_split_alerts";
import { ReverseSplitDiscordOutbox } from "./discord-outbox";
import { ReverseSplitDiscordDelivery } from "./discord-delivery";
import { ReverseSplitNotificationStore } from "./notification-store";

const target = { channelId: "123456789012345678", guildId: "223456789012345678", botToken: "synthetic-test-token" };
const botId = "323456789012345678";
const at = "2026-09-25T23:00:00.000Z";
const later = (seconds: number) => new Date(Date.parse(at) + seconds * 1000).toISOString();
const signature = "a".repeat(64);
let database: Database.Database;
let outbox: ReverseSplitDiscordOutbox;

beforeEach(() => {
  database = new Database(":memory:");
  database.exec(newsReverseSplitAlertsMigration.statements.join("\n"));
  outbox = new ReverseSplitDiscordOutbox(database);
});
afterEach(() => database.close());

function queue(parts = ["Synthetic reverse-split digest"], eventSignature = signature) {
  const store = new ReverseSplitNotificationStore(database, { NODE_ENV: "test" });
  store.publish({ date: "2026-09-25", signature: eventSignature, parts, events: [], title: "Reverse Splits", summary: "Synthetic digest",
    createdAt: at, expiresAt: later(3600) });
  const digest = store.latest("2026-09-25")!;
  return outbox.enqueue({ channelId: target.channelId, digestId: digest.id, revision: digest.revision, date: digest.date, signature: eventSignature, parts,
    now: at, expiresAt: later(3600) });
}
function row() { return database.prepare("SELECT * FROM news_reverse_split_discord_deliveries ORDER BY part_index LIMIT 1").get() as Record<string, unknown>; }
function response(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status }); }
function client(post: (body: Record<string, unknown>) => Promise<Response>, history: unknown[] = []) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const path = String(url);
    if (path.endsWith("/users/@me")) return response({ id: botId, bot: true });
    if (path.endsWith(`/channels/${target.channelId}`)) return response({ id: target.channelId, guild_id: target.guildId, type: 0 });
    if (init?.method === "POST") return post(JSON.parse(String(init.body)) as Record<string, unknown>);
    return response(history);
  }) as ReturnType<typeof vi.fn> & typeof fetch;
}

describe("reverse-split immutable Discord outbox", () => {
  it("deduplicates a canonical digest and its channel outbox", () => {
    expect(queue()).toBe(true);
    expect(queue()).toBe(false);
    expect(database.prepare("SELECT count(*) n FROM news_reverse_split_discord_deliveries").get()).toEqual({ n: 1 });
    expect(database.prepare("SELECT events_json FROM news_reverse_split_digests").get()).toEqual({
      events_json: "[]",
    });
  });
  it("blocks later parts and revisions until earlier receipts are confirmed", () => {
    queue(["Part one", "Part two"]);
    const claimed = outbox.claim(target.channelId, at)!;
    expect(outbox.claim(target.channelId, later(1))).toBeNull();
    expect(queue(["Changed ratio"], "b".repeat(64))).toBe(true);
    outbox.complete(claimed, { state: "delivered", messageId: "999" }, later(2));
    expect(outbox.claim(target.channelId, later(3))?.content).toContain("Part two");
  });
  it("recovers a pre-send claim safely and fences the expired worker", () => {
    queue();
    const first = outbox.claim(target.channelId, at)!;
    const second = outbox.claim(target.channelId, later(61))!;
    expect(second.reconcileOnly).toBe(false);
    expect(outbox.beginAttempt(first, later(62))).toBe(false);
    expect(outbox.complete(first, { state: "delivered", messageId: "999" }, later(62))).toBe(false);
    expect(outbox.beginAttempt(second, later(62))).toBe(true);
  });
  it("requires receipt reconciliation after a crash in the POST window", () => {
    queue();
    const first = outbox.claim(target.channelId, at)!;
    outbox.beginAttempt(first, later(1));
    const reclaimed = outbox.claim(target.channelId, later(61))!;
    expect(reclaimed.reconcileOnly).toBe(true);
    expect(reclaimed.firstAttemptAt).toBe(later(1));
    expect(outbox.beginAttempt(reclaimed, later(62))).toBe(false);
  });
  it("expires an unsent old digest without making a late morning post", () => {
    queue();
    expect(outbox.claim(target.channelId, later(3601))).toBeNull();
    expect(row().state).toBe("expired");
  });
});

describe("reverse-split Discord transport", () => {
  it("verifies the guild and bot, disables mentions and saves a returned receipt", async () => {
    queue();
    const fetcher = client(async (body) => {
      expect(body.allowed_mentions).toEqual({ parse: [] });
      expect(body.enforce_nonce).toBe(true);
      expect(String(body.nonce)).toHaveLength(24);
      return response({ id: "999", channel_id: target.channelId, content: body.content, author: { id: botId } });
    });
    expect(await new ReverseSplitDiscordDelivery(outbox, target, fetcher, () => new Date(at)).runOne()).toMatchObject({ state: "delivered" });
    expect(row().discord_message_id).toBe("999");
  });
  it("does not resend an uncertain POST and reconciles an existing exact receipt", async () => {
    queue();
    const fetcher = client(async () => { throw new Error("Synthetic connection loss"); });
    await new ReverseSplitDiscordDelivery(outbox, target, fetcher, () => new Date(at)).runOne();
    expect(row().state).toBe("uncertain");
    const post = vi.fn(async () => response({}));
    const receipt = { id: "888", channel_id: target.channelId, content: row().content, author: { id: botId } };
    const retry = client(post, [receipt]);
    await new ReverseSplitDiscordDelivery(outbox, target, retry, () => new Date(later(301))).runOne();
    expect(post).toHaveBeenCalledTimes(0);
    expect(row().state).toBe("delivered");
    expect(row().discord_message_id).toBe("888");
  });
  it("keeps missing receipts uncertain instead of blindly resending", async () => {
    queue();
    const claimed = outbox.claim(target.channelId, at)!;
    outbox.beginAttempt(claimed, at);
    const post = vi.fn(async () => response({}));
    await new ReverseSplitDiscordDelivery(outbox, target, client(post), () => new Date(later(61))).runOne();
    expect(post).toHaveBeenCalledTimes(0);
    expect(row().state).toBe("uncertain");
  });
  it("treats a definitive rate limit as retryable without an uncertain-send receipt", async () => {
    queue();
    const fetcher = client(async () => response({ retry_after: 60 }, 429));
    await new ReverseSplitDiscordDelivery(outbox, target, fetcher, () => new Date(at)).runOne();
    expect(row()).toMatchObject({ state: "pending", first_attempt_at_utc: null, available_at_utc: later(60) });
    expect(outbox.claim(target.channelId, later(30))).toBeNull();
    expect(outbox.claim(target.channelId, later(61))?.reconcileOnly).toBe(false);
  });
  it("never sends to a channel in the wrong guild", async () => {
    queue();
    const fetcher = vi.fn(async (url: string | URL | Request) => String(url).endsWith("/users/@me")
      ? response({ id: botId, bot: true }) : response({ id: target.channelId, guild_id: "555", type: 0 })) as typeof fetch;
    await new ReverseSplitDiscordDelivery(outbox, target, fetcher, () => new Date(at)).runOne();
    expect(row()).toMatchObject({ state: "failed", failure_code: "discord_target_mismatch", first_attempt_at_utc: null });
  });
});
