"use server";
import { revalidatePath } from "next/cache";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { hasReverseSplitReviewAccess } from "@/src/modules/news/server/reverse-splits/access";
import { ReverseSplitNotificationStore } from "@/src/modules/news/server/reverse-splits/notification-store";
import { readReverseSplitNotificationSettings } from "@/src/modules/news/server/reverse-splits/notification-settings";

export async function saveReverseSplitNotification(channel: "web_push" | "email", enabled: boolean) {
  try {
    const identity = await requireTraderLinkPlatformServerComponentPageIdentity();
    if (!hasReverseSplitReviewAccess(identity) || typeof enabled !== "boolean" || !["web_push", "email"].includes(channel)) throw new Error("access_denied");
    const settings = withPlatformDatabase({ mode: "runtime" }, (database) => database.transaction(() => {
      const current = readReverseSplitNotificationSettings(database, identity.scope.userId);
      if (!current.available) throw new Error("settings_unavailable");
      if (enabled && !(channel === "web_push" ? current.pushReady : current.emailReady)) return null;
      new ReverseSplitNotificationStore(database).savePreferences(identity.scope.userId,
        { webPushEnabled: channel === "web_push" ? enabled : current.webPushEnabled,
          emailEnabled: channel === "email" ? enabled : current.emailEnabled }, new Date().toISOString());
      return readReverseSplitNotificationSettings(database, identity.scope.userId);
    }).immediate());
    if (!settings) return { ok: false as const, message: channel === "web_push" ? "Enable push on your device in Account → Preferences first." : "Confirm your notification email in Account → Preferences first." };
    revalidatePath("/reverse-splits");
    revalidatePath("/account/preferences");
    return { ok: true as const, settings };
  } catch { return { ok: false as const, message: "Reverse-split notification settings could not be saved. Try again." }; }
}
