import { Suspense, type ReactNode } from "react";

import { V3DashboardTemplate } from "../dashboard-template";
import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

function DashboardFrameFallback({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "#f5f7fb",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireTraderIntelligenceOwnerPageAccess();

  return (
    <Suspense
      fallback={<DashboardFrameFallback>{children}</DashboardFrameFallback>}
    >
      <V3DashboardTemplate>{children}</V3DashboardTemplate>
    </Suspense>
  );
}
