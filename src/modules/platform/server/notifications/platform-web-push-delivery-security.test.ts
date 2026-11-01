// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("web-push", () => ({ setVapidDetails: vi.fn(), sendNotification: vi.fn().mockResolvedValue({}) }));
import * as webPush from "web-push";
import { PlatformWebPushDeliveryService } from "./platform-web-push-delivery-service";
import type { PlatformWebPushConfiguration } from "./platform-web-push-configuration";
import type { PlatformWebPushClaimedDelivery } from "./platform-web-push-repository";
beforeEach(() => vi.clearAllMocks());
describe("persisted push egress checks", () => {
  it.each([false, true])("validates old subscriptions at send time (allowed=%s)", async (allowed) => {
    const repository = {
      claimNext: () => ({ deliveryRef: "synthetic", subscriptionRef: "synthetic", subscription: { endpoint: allowed ? "https://fcm.googleapis.com/fcm/send/token" : "https://127.0.0.1/private", expirationTime: null, keys: {} } }) as unknown as PlatformWebPushClaimedDelivery,
      delivered: vi.fn(), unavailable: vi.fn(),
    };
    const configuration = { vapid: { subject: "mailto:test@example.test", publicKey: "synthetic", privateKey: "synthetic" } } as PlatformWebPushConfiguration;
    await new PlatformWebPushDeliveryService(repository, configuration).runOne();
    expect(webPush.sendNotification).toHaveBeenCalledTimes(allowed ? 1 : 0);
    expect(repository.delivered).toHaveBeenCalledTimes(allowed ? 1 : 0);
    expect(repository.unavailable).toHaveBeenCalledTimes(allowed ? 0 : 1);
  });
});
