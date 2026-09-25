import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlatformWebPushDeliveryRepository } from "@/src/modules/platform/server/notifications/platform-web-push-delivery-service";
import type { ReverseSplitNotificationStore, SplitNotificationClaim } from "./notification-store";
const mocks = vi.hoisted(() => ({ payload: vi.fn(), decrypt: vi.fn(), address: vi.fn(), email: vi.fn() }));
vi.mock("@/src/modules/platform/server/notifications/platform-web-push-configuration", () => ({ loadPlatformWebPushConfiguration: () => ({ encryption: {}, vapid: {} }) }));
vi.mock("@/src/modules/platform/server/notifications/platform-web-push-subscription-crypto", () => ({ decryptPlatformWebPushSubscription: mocks.decrypt }));
vi.mock("@/src/modules/platform/server/notifications/platform-notification-email-configuration", () => ({ loadPlatformNotificationEmailEncryptionConfiguration: () => ({}) }));
vi.mock("@/src/modules/platform/server/notifications/platform-notification-email-address-repository", () => ({
  PlatformNotificationEmailAddressRepository: class { resolveConfirmedAddress() { return mocks.address(); } },
}));
vi.mock("@/src/modules/platform/server/notifications/platform-resend-notification-email", () => ({ deliverPlatformNotificationEmail: mocks.email }));
vi.mock("@/src/modules/platform/server/notifications/platform-web-push-delivery-service", () => ({
  PlatformWebPushDeliveryService: class {
    constructor(private readonly repository: PlatformWebPushDeliveryRepository) {}
    async runOne() {
      const claimed = this.repository.claimNext(new Date().toISOString());
      if (!claimed) return false;
      mocks.payload(claimed);
      this.repository.delivered({ deliveryRef: claimed.deliveryRef, subscriptionRef: claimed.subscriptionRef, timestamp: new Date().toISOString() });
      return true;
    }
  },
}));
import { runReverseSplitNotifications } from "./notification-delivery";

let store: ReverseSplitNotificationStore;
let claim: ReturnType<typeof vi.fn>;
let complete: ReturnType<typeof vi.fn>;
let target: ReturnType<typeof vi.fn>;
const notification = (channel: "web_push" | "email"): SplitNotificationClaim => ({ id: "a".repeat(64), digestId: "b".repeat(64), userId: "owner",
  channel, targetRef: "target", token: "lease", attempt: 1, title: "Reverse Splits", summary: "Synthetic digest", expiresAt: "2026-09-26T04:00:00.000Z" });
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-25T23:00:00.000Z"));
  vi.stubEnv("REVERSE_SPLIT_ENABLED", "true");
  vi.stubEnv("REVERSE_SPLIT_PRIVATE_PREVIEW_ENABLED", "true");
  vi.stubEnv("REVERSE_SPLIT_NOTIFICATIONS_ENABLED", "true");
  claim = vi.fn(() => null);
  complete = vi.fn(() => true);
  target = vi.fn(() => ({ device_ref: "device", endpoint_hash: "hash", authentication_tag: "tag", ciphertext: "cipher", initialization_vector: "iv", key_version: "key" }));
  store = { claim, complete, database: { prepare: () => ({ get: target }) } } as unknown as ReverseSplitNotificationStore;
  mocks.decrypt.mockReturnValue({ endpoint: "https://push.example.invalid/subscription", expirationTime: null, keys: { auth: "synthetic", p256dh: "synthetic" } });
  mocks.address.mockReturnValue({ emailAddressRef: "target", emailAddress: "test@example.invalid" });
  mocks.email.mockResolvedValue({ ok: true, code: "sent" });
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("reverse-split existing transport adapters", () => {
  it("makes no claims or deliveries while private notification delivery is disabled", async () => {
    vi.stubEnv("REVERSE_SPLIT_NOTIFICATIONS_ENABLED", "false");
    expect(await runReverseSplitNotifications(store)).toEqual([]);
    expect(claim.mock.calls.length).toBe(0);
    expect(mocks.email.mock.calls.length).toBe(0);
  });
  it("uses the active owner target, stable push tag and digest-limited lifetime", async () => {
    claim.mockImplementation(channel => channel === "web_push" ? notification("web_push") : null);
    await runReverseSplitNotifications(store);
    expect(target).toHaveBeenCalledWith("target", "owner");
    expect(mocks.payload).toHaveBeenCalledWith(expect.objectContaining({ destinationPath: "/reverse-splits", notificationTag: `reverse-split:${"b".repeat(64)}`, timeToLiveSeconds: 18000 }));
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({ channel: "web_push" }), { sent: true, code: "sent", retryAt: null }, expect.any(String));
  });
  it("never sends when the captured push target is no longer active", async () => {
    claim.mockImplementation(channel => channel === "web_push" ? notification("web_push") : null);
    target.mockReturnValue(undefined);
    await runReverseSplitNotifications(store);
    expect(mocks.payload.mock.calls.length).toBe(0);
    expect(complete).toHaveBeenCalledWith(expect.anything(), { sent: false, code: "subscription_unavailable", retryAt: null }, expect.any(String));
  });
  it("does not redirect an old digest to a newly confirmed email address", async () => {
    claim.mockImplementation(channel => channel === "email" ? notification("email") : null);
    mocks.address.mockReturnValue({ emailAddressRef: "replacement", emailAddress: "replacement@example.invalid" });
    await runReverseSplitNotifications(store);
    expect(mocks.email.mock.calls.length).toBe(0);
    expect(complete).toHaveBeenCalledWith(expect.anything(), { sent: false, code: "confirmed_email_unavailable", retryAt: null }, expect.any(String));
  });
  it("uses a stable email provider key and retries only a retryable result", async () => {
    claim.mockImplementation(channel => channel === "email" ? notification("email") : null);
    mocks.email.mockResolvedValue({ ok: false, code: "provider_unavailable" });
    await runReverseSplitNotifications(store);
    expect(mocks.email).toHaveBeenCalledWith(expect.objectContaining({ emailAddress: "test@example.invalid", idempotencyKey: `reverse-split:${"a".repeat(64)}` }));
    expect(complete).toHaveBeenCalledWith(expect.anything(), { sent: false, code: "provider_unavailable", retryAt: "2026-09-25T23:01:00.000Z" }, expect.any(String));
  });
});
