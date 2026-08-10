"use server";

import { revalidatePath } from "next/cache";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";

export async function markNotificationRead(notificationRef: string): Promise<void> {
  const scope = await requireTraderLinkPlatformPageScope();
  withPlatformDatabase(
    { mode: "runtime" },
    (database) => new PlatformNotificationRepository(database).markRead(
      scope,
      notificationRef,
      createCanonicalUtcTimestamp(),
    ),
  );
  revalidatePath("/notifications");
  revalidatePath("/workspace");
}
