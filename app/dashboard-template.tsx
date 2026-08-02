import type { ReactNode } from "react";

import { DashboardShell } from "./dashboard-shell";
import type { DashboardJournalAccountOption } from "./dashboard-account-switcher";

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
  journalAccounts,
}: {
  children: ReactNode;
  journalAccounts: readonly DashboardJournalAccountOption[];
}) {
  return <DashboardShell journalAccounts={journalAccounts}>{children}</DashboardShell>;
}
