import type { ReactNode } from "react";

import { TraderLinkPlatformDashboardFrame } from "@/app/dashboard-layout-frame";

export function WatchlistDashboardFrame({ children }: { children: ReactNode }) {
  return (
    <TraderLinkPlatformDashboardFrame loginReturnTo="/watchlist">
      <div className="academy-shell" data-academy-theme="light">
        {children}
      </div>
    </TraderLinkPlatformDashboardFrame>
  );
}
