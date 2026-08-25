import type { ReactNode } from "react";

import { TraderLinkPlatformDashboardFrame } from "../dashboard-layout-frame";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <TraderLinkPlatformDashboardFrame>{children}</TraderLinkPlatformDashboardFrame>;
}
