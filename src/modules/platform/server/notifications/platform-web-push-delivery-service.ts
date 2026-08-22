import "server-only";

import * as webPush from "web-push";

import { createCanonicalUtcTimestamp } from "../database/platform-migration-contract";
import type { PlatformWebPushConfiguration } from "./platform-web-push-configuration";
import type { PlatformWebPushClaimedDelivery } from "./platform-web-push-repository";

export type PlatformWebPushDeliveryRepository = Readonly<{
  claimNext(nowUtc: string): PlatformWebPushClaimedDelivery | null;
  delivered(input: Readonly<{
    deliveryRef: string;
    subscriptionRef: string;
    timestamp: string;
  }>): void;
  unavailable(input: Readonly<{
    deliveryRef: string;
    expired: boolean;
    retryAtUtc: string | null;
    subscriptionRef: string;
    timestamp: string;
  }>): void;
}>;

function statusCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const value = (error as { statusCode?: unknown }).statusCode;
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

export class PlatformWebPushDeliveryService {
  constructor(
    private readonly repository: PlatformWebPushDeliveryRepository,
    private readonly configuration: PlatformWebPushConfiguration,
  ) {
    webPush.setVapidDetails(
      configuration.vapid.subject,
      configuration.vapid.publicKey,
      configuration.vapid.privateKey,
    );
  }

  async runOne(): Promise<boolean> {
    const claimedAtUtc = createCanonicalUtcTimestamp();
    const delivery = this.repository.claimNext(claimedAtUtc);
    if (!delivery) return false;
    if (
      delivery.subscription.expirationTime !== null &&
      delivery.subscription.expirationTime <= Date.now()
    ) {
      this.repository.unavailable({
        deliveryRef: delivery.deliveryRef,
        expired: true,
        retryAtUtc: null,
        subscriptionRef: delivery.subscriptionRef,
        timestamp: createCanonicalUtcTimestamp(),
      });
      return true;
    }
    try {
      await webPush.sendNotification(
        {
          endpoint: delivery.subscription.endpoint,
          expirationTime: delivery.subscription.expirationTime,
          keys: delivery.subscription.keys,
        },
        JSON.stringify(Object.freeze({
          destinationPath: delivery.destinationPath,
          notificationBody: delivery.notificationBody,
          notificationTag: delivery.notificationTag,
          notificationTitle: delivery.notificationTitle,
          version: 2,
        })),
        {
          TTL: 24 * 60 * 60,
          urgency: "normal",
        },
      );
      this.repository.delivered({
        deliveryRef: delivery.deliveryRef,
        subscriptionRef: delivery.subscriptionRef,
        timestamp: createCanonicalUtcTimestamp(),
      });
    } catch (error) {
      const code = statusCode(error);
      const expired = code === 404 || code === 410;
      const retryable = !expired && delivery.attemptCount < 5 &&
        (code === null || code === 408 || code === 429 || code >= 500);
      const delayMs = Math.min(15 * 60_000, 15_000 * (2 ** Math.max(0, delivery.attemptCount - 1)));
      this.repository.unavailable({
        deliveryRef: delivery.deliveryRef,
        expired,
        retryAtUtc: retryable
          ? new Date(Date.now() + delayMs).toISOString()
          : null,
        subscriptionRef: delivery.subscriptionRef,
        timestamp: createCanonicalUtcTimestamp(),
      });
    }
    return true;
  }

  async runAvailable(maximum: number): Promise<number> {
    const limit = Number.isInteger(maximum) ? Math.min(Math.max(maximum, 0), 100) : 0;
    let processed = 0;
    while (processed < limit && await this.runOne()) processed += 1;
    return processed;
  }
}
