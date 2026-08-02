import { Suspense, type ReactNode } from "react";

import { TraderLinkPlatformDashboardTemplate } from "../dashboard-template";
import { requireDevelopmentDashboardPageScope } from "@/src/modules/platform/server/authentication/require-development-dashboard-scope";

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
  await requireDevelopmentDashboardPageScope();

  return (
    <Suspense
      fallback={<DashboardFrameFallback>{children}</DashboardFrameFallback>}
    >
      <TraderLinkPlatformDashboardTemplate>
        {children}
      </TraderLinkPlatformDashboardTemplate>
    </Suspense>
  );
}
