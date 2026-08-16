import type { ReactNode } from "react";

import { DashboardShell } from "./dashboard-shell";
import type { PlatformNotification } from "@/src/modules/platform/contracts/platform-notification-contracts";

export {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
  DashboardUnavailableState,
} from "./dashboard-ui";
export {
  DASHBOARD_DATA_NAVIGATION_GROUP,
  DASHBOARD_HOME_ITEM,
  DASHBOARD_MAIN_NAVIGATION_GROUPS,
  DASHBOARD_NAVIGATION_HREFS,
  DASHBOARD_ROUTE_TITLES,
  DASHBOARD_STANDALONE_ITEMS,
} from "./dashboard-navigation";

export function TraderLinkPlatformDashboardTemplate({
  children,
  notifications = [],
}: {
  children: ReactNode;
  notifications?: readonly PlatformNotification[];
}) {
  return (
    <DashboardShell notifications={notifications}>
      {children}
    </DashboardShell>
  );
}
