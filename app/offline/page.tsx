import type { Metadata } from "next";

import { DashboardShell } from "../dashboard-shell";
import { OfflineRouteContent } from "../pwa/offline-trade-entry-surface";

export const metadata: Metadata = {
  title: "Offline | TraderLink Platform",
};

export default function OfflinePage() {
  return (
    <DashboardShell offline>
      <OfflineRouteContent />
    </DashboardShell>
  );
}
