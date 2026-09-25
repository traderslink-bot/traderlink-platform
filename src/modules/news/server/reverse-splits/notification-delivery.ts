import "server-only";
import { PlatformWebPushDeliveryService } from "@/src/modules/platform/server/notifications/platform-web-push-delivery-service";
import { loadPlatformWebPushConfiguration } from "@/src/modules/platform/server/notifications/platform-web-push-configuration";
import { decryptPlatformWebPushSubscription } from "@/src/modules/platform/server/notifications/platform-web-push-subscription-crypto";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";
import { PlatformNotificationEmailAddressRepository } from "@/src/modules/platform/server/notifications/platform-notification-email-address-repository";
import { deliverPlatformNotificationEmail } from "@/src/modules/platform/server/notifications/platform-resend-notification-email";
import { reverseSplitPrivatePreviewEnabled } from "./configuration";
import { ReverseSplitNotificationStore, type SplitNotificationClaim } from "./notification-store";

type SubscriptionRow = { device_ref: string; endpoint_hash: string; authentication_tag: string; ciphertext: string;
  initialization_vector: string; key_version: string };

export async function runReverseSplitNotifications(store: ReverseSplitNotificationStore): Promise<string[]> {
  if (!reverseSplitPrivatePreviewEnabled() || process.env.REVERSE_SPLIT_NOTIFICATIONS_ENABLED !== "true") return [];
  const failures: string[] = [];
  try {
    const configuration = loadPlatformWebPushConfiguration();
    let active: SplitNotificationClaim | null = null;
    const sender = new PlatformWebPushDeliveryService({
      claimNext(now) {
        const claim = store.claim("web_push", now);
        if (!claim) return null;
        active = claim;
        const row = store.database.prepare<[string, string], SubscriptionRow>(`SELECT device_ref, endpoint_hash, authentication_tag,
          ciphertext, initialization_vector, key_version FROM platform_web_push_subscriptions
          WHERE subscription_id = ? AND user_id = ? AND state = 'active'`).get(claim.targetRef, claim.userId);
        try {
          if (!row) throw new Error("subscription_unavailable");
          const subscription = decryptPlatformWebPushSubscription({ configuration: configuration.encryption,
            deviceRef: row.device_ref, endpointHash: row.endpoint_hash, userId: claim.userId,
            encrypted: { authenticationTag: row.authentication_tag, ciphertext: row.ciphertext,
              initializationVector: row.initialization_vector, keyVersion: row.key_version } });
          return { attemptCount: claim.attempt, deliveryRef: claim.id, destinationPath: "/reverse-splits",
            subscriptionRef: claim.targetRef, subscription, notificationBody: claim.summary,
            notificationTitle: claim.title, notificationTag: `reverse-split:${claim.digestId}`,
            timeToLiveSeconds: Math.max(1, Math.floor((Date.parse(claim.expiresAt) - Date.parse(now)) / 1000)), urgency: "normal" as const };
        } catch {
          store.complete(claim, { sent: false, code: "subscription_unavailable", retryAt: null }, now);
          failures.push("reverse_split_subscription_unavailable");
          return null;
        }
      },
      delivered(input) {
        if (active?.id === input.deliveryRef) store.complete(active, { sent: true, code: "sent", retryAt: null }, input.timestamp);
      },
      unavailable(input) {
        if (active?.id === input.deliveryRef) store.complete(active, { sent: false,
          code: input.failureCode ?? "subscription_expired", retryAt: input.expired ? null : input.retryAtUtc }, input.timestamp);
        failures.push("reverse_split_push_unavailable");
      },
    }, configuration);
    await sender.runOne();
  } catch { failures.push("reverse_split_push_configuration_unavailable"); }
  let claim: SplitNotificationClaim | null = null;
  try {
    const addresses = new PlatformNotificationEmailAddressRepository(store.database, loadPlatformNotificationEmailEncryptionConfiguration());
    claim = store.claim("email", new Date().toISOString());
    if (claim) {
      const address = addresses.resolveConfirmedAddress(claim.userId);
      if (!address || address.emailAddressRef !== claim.targetRef) {
        store.complete(claim, { sent: false, code: "confirmed_email_unavailable", retryAt: null }, new Date().toISOString());
      } else {
        const result = await deliverPlatformNotificationEmail({ emailAddress: address.emailAddress, timeoutMs: 10_000,
          idempotencyKey: `reverse-split:${claim.id}`, actionLabel: "Open Reverse Splits",
          content: { title: claim.title, summary: claim.summary, destinationPath: "/reverse-splits" },
          additionalLinks: [{ label: "Manage notifications", path: "/account/preferences" }] });
        store.complete(claim, { sent: result.ok, code: result.code,
          retryAt: result.code === "provider_unavailable" || result.code === "not_configured" ? new Date(Date.now() + 60_000).toISOString() : null }, new Date().toISOString());
        if (!result.ok) failures.push(`reverse_split_email_${result.code}`);
      }
    }
  } catch {
    if (claim) store.complete(claim, { sent: false, code: "email_unavailable", retryAt: new Date(Date.now() + 60_000).toISOString() }, new Date().toISOString());
    failures.push("reverse_split_email_unavailable");
  }
  return failures;
}
