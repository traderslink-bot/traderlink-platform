import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { newsReverseSplitAlertsMigration } from "../database/migrations/0142_news_reverse_split_alerts";
import { ReverseSplitNotificationStore } from "./notification-store";
import type { ReverseSplitEvent } from "./contracts";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const at = "2026-09-25T23:00:00.000Z";
const later = (seconds: number) => new Date(Date.parse(at) + seconds * 1000).toISOString();
const environment: NodeJS.ProcessEnv = { NODE_ENV: "test", REVERSE_SPLIT_ENABLED: "true", REVERSE_SPLIT_PRIVATE_PREVIEW_ENABLED: "true",
  REVERSE_SPLIT_NOTIFICATIONS_ENABLED: "true", TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT: "123,456" };
const event: ReverseSplitEvent = { ticker: "TEST", company: "Synthetic", status: "confirmed", ratio: 50, authorizedRatio: null,
  effectiveDate: "2026-09-28", approvalDate: null, evidence: "Synthetic fixture",
  source: { kind: "nasdaq", url: "https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2026-100", title: "Synthetic", publishedDate: "2026-09-25", ticker: "TEST", company: "Synthetic" } };
let database: Database.Database;
let store: ReverseSplitNotificationStore;
beforeEach(() => {
  database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  database.exec(`CREATE TABLE platform_users(user_id TEXT PRIMARY KEY, status TEXT);
    CREATE TABLE platform_auth_identities(user_id TEXT, auth_provider TEXT, auth_subject TEXT, status TEXT);
    CREATE TABLE platform_web_push_subscriptions(subscription_id TEXT PRIMARY KEY, user_id TEXT, state TEXT);
    CREATE TABLE platform_notification_email_addresses(email_address_id TEXT PRIMARY KEY, user_id TEXT, state TEXT, confirmed_at_utc TEXT);`);
  database.exec(newsReverseSplitAlertsMigration.statements.join("\n"));
  database.prepare("INSERT INTO platform_users VALUES (?, 'active'), (?, 'active')").run(owner, other);
  database.prepare("INSERT INTO platform_auth_identities VALUES (?, 'discord', '123', 'active'), (?, 'discord', '999', 'active')").run(owner, other);
  database.prepare("INSERT INTO platform_web_push_subscriptions VALUES ('device-owner', ?, 'active'), ('device-other', ?, 'active')").run(owner, other);
  database.prepare("INSERT INTO platform_notification_email_addresses VALUES ('email-owner', ?, 'confirmed', ?)").run(owner, at);
  store = new ReverseSplitNotificationStore(database, environment);
});
afterEach(() => database.close());
function publish(signature = "a".repeat(64)) {
  return store.publish({ date: "2026-09-25", signature, parts: ["Synthetic digest"], events: [event], title: "Reverse Splits", summary: "Synthetic",
    createdAt: at, expiresAt: later(3600) });
}

describe("private reverse-split preferences and recipient outbox", () => {
  it("defaults both options off and never enrolls a user retroactively", () => {
    expect(store.preferences(owner)).toEqual({ webPushEnabled: false, emailEnabled: false });
    publish();
    store.savePreferences(owner, { webPushEnabled: true, emailEnabled: true }, at);
    expect(publish()).toBe(false);
    expect(store.claim("web_push", at)).toBeNull();
    expect(store.claim("email", at)).toBeNull();
  });
  it("rejects non-owner preference writes and limits even manually inserted preferences to the owner", () => {
    expect(() => store.savePreferences(other, { webPushEnabled: true, emailEnabled: true }, at)).toThrow();
    database.prepare("INSERT INTO news_reverse_split_notification_preferences VALUES (?, 1, 1, ?)").run(other, at);
    store.savePreferences(owner, { webPushEnabled: true, emailEnabled: true }, at);
    publish();
    expect(database.prepare("SELECT DISTINCT user_id FROM news_reverse_split_notification_deliveries").all()).toEqual([{ user_id: owner }]);
    expect(store.claim("web_push", at)?.targetRef).toBe("device-owner");
    expect(store.claim("email", at)?.targetRef).toBe("email-owner");
  });
  it("rechecks opt-out and owner identity immediately before claiming", () => {
    store.savePreferences(owner, { webPushEnabled: true, emailEnabled: true }, at);
    publish();
    store.savePreferences(owner, { webPushEnabled: false, emailEnabled: true }, later(1));
    expect(store.claim("web_push", later(2))).toBeNull();
    database.prepare("UPDATE platform_auth_identities SET status = 'revoked' WHERE user_id = ?").run(owner);
    expect(store.claim("email", later(2))).toBeNull();
    expect(database.prepare("SELECT state FROM news_reverse_split_notification_deliveries ORDER BY channel").all()).toEqual([{ state: "inaccessible" }, { state: "opted_out" }]);
  });
  it("recovers durable claims, fences expired leases and deduplicates finished delivery", () => {
    store.savePreferences(owner, { webPushEnabled: true, emailEnabled: false }, at);
    publish();
    const first = store.claim("web_push", at)!;
    const restarted = new ReverseSplitNotificationStore(database, environment);
    expect(restarted.claim("web_push", later(1))).toBeNull();
    const second = restarted.claim("web_push", later(61))!;
    expect(second.id).toBe(first.id);
    expect(store.complete(first, { sent: true, code: "sent", retryAt: null }, later(62))).toBe(false);
    expect(restarted.complete(second, { sent: true, code: "sent", retryAt: null }, later(62))).toBe(true);
    expect(restarted.claim("web_push", later(63))).toBeNull();
  });
  it("does not send a later revision ahead of a retrying earlier one", () => {
    store.savePreferences(owner, { webPushEnabled: true, emailEnabled: false }, at);
    publish();
    const first = store.claim("web_push", at)!;
    store.complete(first, { sent: false, code: "retry", retryAt: later(120) }, later(1));
    publish("b".repeat(64));
    expect(store.claim("web_push", later(2))).toBeNull();
    const retry = store.claim("web_push", later(120))!;
    store.complete(retry, { sent: true, code: "sent", retryAt: null }, later(121));
    expect(store.claim("web_push", later(122))?.digestId === first.digestId).toBe(false);
  });
  it("expires old updates without morning replay and fails closed when disabled", () => {
    store.savePreferences(owner, { webPushEnabled: true, emailEnabled: true }, at);
    publish();
    expect(new ReverseSplitNotificationStore(database, { ...environment, REVERSE_SPLIT_PRIVATE_PREVIEW_ENABLED: "false" }).claim("web_push", at)).toBeNull();
    expect(store.claim("web_push", later(3601))).toBeNull();
    expect(store.claim("email", later(3601))).toBeNull();
    expect(database.prepare("SELECT DISTINCT state FROM news_reverse_split_notification_deliveries").all()).toEqual([{ state: "expired" }]);
  });
});
