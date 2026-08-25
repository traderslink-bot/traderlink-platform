import type { ReactNode } from "react";

import { TraderLinkPlatformDashboardFrame } from "@/app/dashboard-layout-frame";
import { DashboardPage } from "@/app/dashboard-template";

export function WatchlistDashboardFrame({ children }: { children: ReactNode }) {
  return (
    <TraderLinkPlatformDashboardFrame loginReturnTo="/watchlist">
      <DashboardPage>{children}</DashboardPage>
    </TraderLinkPlatformDashboardFrame>
  );
}
