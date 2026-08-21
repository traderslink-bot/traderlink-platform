import type { ReactNode } from "react";

import { DashboardShell } from "./dashboard-shell";
import type { PlatformNotification } from "@/src/modules/platform/contracts/platform-notification-contracts";
import { OfflineProjectionCapture } from "./pwa/offline-projection-capture";
import type { PressReleaseUnreadCounts } from "@/src/modules/news/contracts/press-release-dashboard-contracts";

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
  accountCurrency,
  accountSelectionRef,
  accountTimezone,
  children,
  notifications = [],
  offlineScopeRef,
  pressReleaseUnreadCounts = null,
}: {
  accountCurrency: string | null;
  accountSelectionRef: string | null;
  accountTimezone: string | null;
  children: ReactNode;
  notifications?: readonly PlatformNotification[];
  offlineScopeRef: string;
  pressReleaseUnreadCounts?: PressReleaseUnreadCounts | null;
}) {
  return (
    <DashboardShell
      notifications={notifications}
      pressReleaseUnreadCounts={pressReleaseUnreadCounts}
    >
      <OfflineProjectionCapture
        accountCurrency={accountCurrency}
        accountSelectionRef={accountSelectionRef}
        accountTimezone={accountTimezone}
        offlineScopeRef={offlineScopeRef}
      >
        {children}
      </OfflineProjectionCapture>
    </DashboardShell>
  );
}
