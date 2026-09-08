import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import type { PlatformWebPushEncryptionConfiguration } from "../../platform/server/notifications/platform-web-push-configuration";
import { encryptPlatformWebPushSubscription } from "../../platform/server/notifications/platform-web-push-subscription-crypto";
import { MarketHaltWebPushRepository } from "./market-halt-web-push-repository";

const timestamp = "2026-09-08T14:00:00.000Z";
const configuration: PlatformWebPushEncryptionConfiguration = Object.freeze({
  activeKeyVersion: "test",
  keysBase64: Object.freeze({ test: Buffer.alloc(32, 1).toString("base64") }),
});

function identifier(last: number): string {
  return `00000000-0000-4000-8000-${last.toString().padStart(12, "0")}`;
}

function fixture(): Readonly<{
  addDelivery(input: Readonly<{ deliveryId: string; haltId: string; subscriptionId: string }>): void;
  database: Database.Database;
  repository: MarketHaltWebPushRepository;
}> {
  const database = new Database(":memory:");
  database.exec(`CREATE TABLE platform_web_push_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_ref TEXT NOT NULL,
  endpoint_hash TEXT NOT NULL,
  key_version TEXT NOT NULL,
  initialization_vector TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  authentication_tag TEXT NOT NULL,
  state TEXT NOT NULL
) STRICT;
CREATE TABLE news_market_halt_preferences (
  user_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL
) STRICT;
CREATE TABLE news_market_halt_muted_tickers (
  user_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  expires_at_utc TEXT NOT NULL
) STRICT;
CREATE TABLE news_market_halt_events (
  halt_id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL
) STRICT;
CREATE TABLE news_market_halt_push_deliveries (
  delivery_id TEXT PRIMARY KEY,
  halt_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  notification_title TEXT NOT NULL,
  notification_body TEXT NOT NULL,
  state TEXT NOT NULL,
  attempt_count INTEGER NOT NULL,
  available_at_utc TEXT NOT NULL,
  last_attempt_at_utc TEXT,
  delivered_at_utc TEXT,
  failure_code TEXT,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL
) STRICT;`);
  const repository = new MarketHaltWebPushRepository(database, configuration);
  const addDelivery = (input: Readonly<{ deliveryId: string; haltId: string; subscriptionId: string }>) => {
    const userId = identifier(1);
    const deviceRef = "a".repeat(64);
    const endpointHash = "b".repeat(64);
    const encrypted = encryptPlatformWebPushSubscription({
      configuration,
      deviceRef,
      endpointHash,
      subscription: Object.freeze({
        endpoint: `https://push.example.test/${input.subscriptionId}`,
        expirationTime: null,
        keys: Object.freeze({
          auth: Buffer.alloc(16, 2).toString("base64url"),
          p256dh: Buffer.alloc(33, 3).toString("base64url"),
        }),
      }),
      userId,
    });
    database.prepare(`INSERT OR IGNORE INTO news_market_halt_preferences (user_id, enabled) VALUES (?, 1)`)
      .run(userId);
    database.prepare(`INSERT OR IGNORE INTO news_market_halt_events (halt_id, ticker) VALUES (?, 'FCUV')`)
      .run(input.haltId);
    database.prepare(`INSERT INTO platform_web_push_subscriptions (
  subscription_id, user_id, device_ref, endpoint_hash, key_version, initialization_vector,
  ciphertext, authentication_tag, state
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`).run(
      input.subscriptionId,
      userId,
      deviceRef,
      endpointHash,
      encrypted.keyVersion,
      encrypted.initializationVector,
      encrypted.ciphertext,
      encrypted.authenticationTag,
    );
    database.prepare(`INSERT INTO news_market_halt_push_deliveries (
  delivery_id, halt_id, subscription_id, notification_title, notification_body, state,
  attempt_count, available_at_utc, last_attempt_at_utc, delivered_at_utc, failure_code,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, 'FCUV halted', 'Trading is paused.', 'pending', 0, ?, NULL, NULL, NULL, ?, ?)`).run(
      input.deliveryId,
      input.haltId,
      input.subscriptionId,
      timestamp,
      timestamp,
      timestamp,
    );
  };
  return Object.freeze({ addDelivery, database, repository });
}

describe("MarketHaltWebPushRepository notification tags", () => {
  it("uses one tag for two delivery rows of the same factual halt", () => {
    const { addDelivery, database, repository } = fixture();
    try {
      const haltId = identifier(10);
      addDelivery({ deliveryId: identifier(11), haltId, subscriptionId: identifier(12) });
      addDelivery({ deliveryId: identifier(13), haltId, subscriptionId: identifier(14) });

      const first = repository.claimNext(timestamp);
      const second = repository.claimNext(timestamp);

      expect(first?.notificationTag).toBe(`market-halt:${haltId}`);
      expect(second?.notificationTag).toBe(first?.notificationTag);
      expect(first).not.toHaveProperty("haltId");
      expect(second).not.toHaveProperty("haltId");
    } finally {
      database.close();
    }
  });

  it("keeps the same tag when a delivery is retried", () => {
    const { addDelivery, database, repository } = fixture();
    try {
      const haltId = identifier(20);
      const deliveryId = identifier(21);
      addDelivery({ deliveryId, haltId, subscriptionId: identifier(22) });

      const first = repository.claimNext(timestamp);
      database.prepare(`UPDATE news_market_halt_push_deliveries
SET state = 'pending', available_at_utc = ? WHERE delivery_id = ?`).run(timestamp, deliveryId);
      const retry = repository.claimNext(timestamp);

      expect(retry?.attemptCount).toBe(2);
      expect(retry?.notificationTag).toBe(first?.notificationTag);
    } finally {
      database.close();
    }
  });

  it("keeps distinct tags for two separate same-day halts of one ticker", () => {
    const { addDelivery, database, repository } = fixture();
    try {
      const firstHaltId = identifier(30);
      const secondHaltId = identifier(31);
      addDelivery({ deliveryId: identifier(32), haltId: firstHaltId, subscriptionId: identifier(33) });
      addDelivery({ deliveryId: identifier(34), haltId: secondHaltId, subscriptionId: identifier(35) });

      const first = repository.claimNext(timestamp);
      const second = repository.claimNext(timestamp);

      expect(first?.notificationTag).toBe(`market-halt:${firstHaltId}`);
      expect(second?.notificationTag).toBe(`market-halt:${secondHaltId}`);
      expect(second?.notificationTag).not.toBe(first?.notificationTag);
    } finally {
      database.close();
    }
  });
});

describe("market-halt service worker notification contract", () => {
  it("replaces a same-tag alert silently and preserves the existing click destination handling", () => {
    const source = readFileSync(resolve(process.cwd(), "app/sw.ts"), "utf8");

    expect(source).toContain("renotify: false");
    expect(source).toContain("safeDestinationPath(event.notification.data?.path)");
  });
});
