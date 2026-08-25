"use server";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformNewsletterContactRepository } from "@/src/modules/platform/server/newsletter/platform-newsletter-contact-repository";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";

export async function recordNewsletterSignupChoice(
  subscribe: boolean,
): Promise<void> {
  const scope = await requireTraderLinkPlatformPageScope();
  withPlatformDatabase(
    { mode: "runtime" },
    (database) => new PlatformNewsletterContactRepository(
      database,
      loadPlatformNotificationEmailEncryptionConfiguration(),
    ).recordSignupChoice({
      subscribe,
      updatedAtUtc: createCanonicalUtcTimestamp(),
      userId: scope.userId,
    }),
  );
}
