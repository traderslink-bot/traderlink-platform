import type { Metadata } from "next";

import { DashboardShell } from "../dashboard-shell";
import { OfflineAppearanceBoundary } from "../pwa/offline-appearance-boundary";
import { OfflineRouteContent } from "../pwa/offline-trade-entry-surface";

export const metadata: Metadata = {
  title: "Offline | TraderLink Platform",
};

export default function OfflinePage() {
  return (
    <OfflineAppearanceBoundary>
      <DashboardShell offline>
        <OfflineRouteContent />
      </DashboardShell>
    </OfflineAppearanceBoundary>
  );
}
