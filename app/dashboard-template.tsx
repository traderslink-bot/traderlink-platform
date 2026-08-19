import type { ReactNode } from "react";

import { DashboardShell } from "./dashboard-shell";
import type { PlatformNotification } from "@/src/modules/platform/contracts/platform-notification-contracts";
import { OfflineProjectionCapture } from "./pwa/offline-projection-capture";

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
  DASHBOARD_HOME_ITEM,
  DASHBOARD_MAIN_NAVIGATION_GROUPS,
  DASHBOARD_NAVIGATION_HREFS,
  DASHBOARD_ROUTE_TITLES,
  DASHBOARD_STANDALONE_ITEMS,
} from "./dashboard-navigation";

export function TraderLinkPlatformDashboardTemplate({
  accountSelectionRef,
  children,
  notifications = [],
  offlineScopeRef,
}: {
  accountSelectionRef: string | null;
  children: ReactNode;
  notifications?: readonly PlatformNotification[];
  offlineScopeRef: string;
}) {
  return (
    <DashboardShell notifications={notifications}>
      <OfflineProjectionCapture
        accountSelectionRef={accountSelectionRef}
        offlineScopeRef={offlineScopeRef}
      >
        {children}
      </OfflineProjectionCapture>
    </DashboardShell>
  );
}
