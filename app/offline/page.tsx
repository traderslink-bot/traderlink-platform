import type { Metadata } from "next";

import { DashboardShell } from "../dashboard-shell";
import { OfflineAppearanceBoundary } from "../pwa/offline-appearance-boundary";
import { NavigationRecoveryNotice } from "../pwa/navigation-recovery-notice";
import { OfflineRouteContent } from "../pwa/offline-trade-entry-surface";

export const metadata: Metadata = {
  title: "Offline | TraderLink Platform",
};

export default function OfflinePage() {
  return (
    <OfflineAppearanceBoundary>
      <DashboardShell offline>
        <NavigationRecoveryNotice />
        <OfflineRouteContent />
      </DashboardShell>
    </OfflineAppearanceBoundary>
  );
}
