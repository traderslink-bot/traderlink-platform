import "server-only";

import { createCanonicalUtcTimestamp } from "../database/platform-migration-contract";
import {
  deliverPlatformNotificationDiscordDirectMessage,
} from "./platform-discord-notification-delivery";
import {
  loadPlatformNotificationEmailEncryptionConfiguration,
} from "./platform-notification-email-configuration";
import {
  PlatformNotificationEmailAddressRepository,
} from "./platform-notification-email-address-repository";
import {
  deliverPlatformNotificationEmail,
} from "./platform-resend-notification-email";
import {
  PlatformRemoteNotificationDeliveryRepository,
} from "./platform-remote-notification-delivery-repository";
import type { PlatformNotificationDeliveryResult } from "./platform-remote-notification-delivery-contracts";

export type PlatformRemoteNotificationDeliveryDependencies = Readonly<{
  deliverDiscord?: typeof deliverPlatformNotificationDiscordDirectMessage;
  deliverEmail?: typeof deliverPlatformNotificationEmail;
  emailAddresses?: PlatformNotificationEmailAddressRepository;
}>;

/** Claims selected Discord/email deliveries outside their event writers. */
export class PlatformRemoteNotificationDeliveryService {
  constructor(
    private readonly repository: PlatformRemoteNotificationDeliveryRepository,
    private readonly dependencies: PlatformRemoteNotificationDeliveryDependencies = Object.freeze({}),
  ) {}

  private emailAddresses(): PlatformNotificationEmailAddressRepository {
    if (this.dependencies.emailAddresses) return this.dependencies.emailAddresses;
    // The repository owns the same database handle as the delivery queue.
    return new PlatformNotificationEmailAddressRepository(
      this.repository.database,
      loadPlatformNotificationEmailEncryptionConfiguration(),
    );
  }

  async runOne(): Promise<boolean> {
    const claimedAtUtc = createCanonicalUtcTimestamp();
    const claimed = this.repository.claimNext(claimedAtUtc);
    if (!claimed) return false;
    let result: PlatformNotificationDeliveryResult;
    try {
      if (claimed.channel === "discord_dm") {
        const identity = this.emailAddressesForDiscord(claimed.recipientUserId);
        result = identity
          ? await (this.dependencies.deliverDiscord ?? deliverPlatformNotificationDiscordDirectMessage)({
            content: {
              destinationPath: claimed.destinationPath,
              summary: claimed.summary,
              title: claimed.title,
            },
            discordUserId: identity,
            idempotencyKey: `traderlink-notification-delivery:${claimed.deliveryRef}`,
          })
          : Object.freeze({ code: "invalid_destination", ok: false });
      } else {
        const email = this.emailAddresses().resolveConfirmedAddress(claimed.recipientUserId);
        result = email && email.emailAddressRef === claimed.targetRef
          ? await (this.dependencies.deliverEmail ?? deliverPlatformNotificationEmail)({
            content: {
              destinationPath: claimed.destinationPath,
              summary: claimed.summary,
              title: claimed.title,
            },
            emailAddress: email.emailAddress,
            idempotencyKey: `traderlink-notification-delivery:${claimed.deliveryRef}`,
          })
          : Object.freeze({ code: "invalid_destination", ok: false });
      }
    } catch {
      result = Object.freeze({ code: "provider_unavailable", ok: false });
    }
    this.repository.complete({
      deliveryRef: claimed.deliveryRef,
      resultCode: result.code,
      timestamp: createCanonicalUtcTimestamp(),
    });
    return true;
  }

  private emailAddressesForDiscord(userId: string): string | null {
    // Resolves Discord identity only on the server and never persists it in the queue.
    const identity = this.repository.database.prepare<[string], { auth_subject: string }>(`SELECT auth_subject
FROM platform_auth_identities
WHERE user_id = ? AND auth_provider = 'discord' AND status = 'active'`).get(userId);
    return identity?.auth_subject ?? null;
  }

  async runAvailable(maximum: number): Promise<number> {
    const limit = Number.isInteger(maximum) ? Math.min(Math.max(maximum, 0), 100) : 0;
    let processed = 0;
    while (processed < limit && await this.runOne()) processed += 1;
    return processed;
  }
}
