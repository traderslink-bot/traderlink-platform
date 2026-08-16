import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";

import { TraderLinkPlatformDashboardTemplate } from "../dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";

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
  let scope;
  try {
    scope = (await requireTraderLinkPlatformPageIdentity()).scope;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      redirect("/api/auth/discord/login?returnTo=%2Fworkspace");
    }
    throw error;
  }
  const notifications = withReadonlyPlatformDatabase({}, (database) =>
    new PlatformNotificationRepository(database).list(scope, 5));
  return (
    <Suspense
      fallback={<DashboardFrameFallback>{children}</DashboardFrameFallback>}
    >
      <TraderLinkPlatformDashboardTemplate notifications={notifications}>
        {children}
      </TraderLinkPlatformDashboardTemplate>
    </Suspense>
  );
}
