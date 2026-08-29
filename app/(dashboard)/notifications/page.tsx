import type { Metadata } from "next";
import Typography from "@mui/material/Typography";

import {
  DashboardPage,
  DashboardPanel,
  DashboardSecondaryAction,
} from "../../dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { NotificationList } from "./notification-list";
import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  createPlatformOfflineNotificationsViewModel,
  PLATFORM_OFFLINE_NOTIFICATIONS_COVERAGE,
  PLATFORM_OFFLINE_NOTIFICATIONS_VIEW_KEY,
  PLATFORM_OFFLINE_SUPPORT_VIEW_VERSION,
} from "@/src/modules/platform/contracts/platform-offline-support-view-contracts";

export const metadata: Metadata = {
  description: "Review updates about your TraderLink Trade Tracker.",
  title: "Notifications | TraderLink Platform",
};

export default async function NotificationsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const notifications = withReadonlyPlatformDatabase(
    {},
    (database) => new PlatformNotificationRepository(database).list(scope),
  );
  return (
    <>
    <OfflineSavedViewCapture
      accountTimezone={null}
      calculationVersion="platform-notifications-v1"
      coverage={PLATFORM_OFFLINE_NOTIFICATIONS_COVERAGE}
      generatedAtUtc={new Date().toISOString()}
      model={createPlatformOfflineNotificationsViewModel(notifications)}
      pathname="/notifications"
      queryIdentity="current"
      reportingCurrency={null}
      routeViewVersion={PLATFORM_OFFLINE_SUPPORT_VIEW_VERSION}
      viewKey={PLATFORM_OFFLINE_NOTIFICATIONS_VIEW_KEY}
    />
    <DashboardPage>
      <Typography component="h1" variant="h1">Notifications</Typography>
      <DashboardPanel
        action={(
          <DashboardSecondaryAction href="/account/preferences">
            Notification settings
          </DashboardSecondaryAction>
        )}
        title="All notifications"
      >
        <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
          Turn push and Discord notification on and off.
        </Typography>
        <NotificationList notifications={notifications} />
      </DashboardPanel>
    </DashboardPage>
    </>
  );
}
