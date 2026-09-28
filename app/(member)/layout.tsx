import type { ReactNode } from "react";
import { TraderLinkPlatformDashboardFrame } from "../dashboard-layout-frame";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function MemberLayout({ children }: { children: ReactNode }) {
  return <TraderLinkPlatformDashboardFrame billingMemberAccess loginReturnTo="/account/membership">{children}</TraderLinkPlatformDashboardFrame>;
}
