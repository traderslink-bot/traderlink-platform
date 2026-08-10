import type { Metadata } from "next";

import { DashboardPage, DashboardPanel } from "../../dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { NotificationList } from "./notification-list";

export const metadata: Metadata = {
  description: "Review updates about your TraderLink journal.",
  title: "Notifications | TraderLink Platform",
};

export default async function NotificationsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const notifications = withReadonlyPlatformDatabase(
    {},
    (database) => new PlatformNotificationRepository(database).list(scope),
  );
  return (
    <DashboardPage>
      <DashboardPanel title="Notifications">
        <NotificationList notifications={notifications} />
      </DashboardPanel>
    </DashboardPage>
  );
}
