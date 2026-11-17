import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isPlatformSignedInLandingPath, PLATFORM_ENTRY_PATH } from "@/src/modules/platform/contracts/platform-home-page";
import { loginReturnTo } from "@/src/modules/platform/server/authentication/platform-login-http";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

/** Recheck product access when Next retains the shared layout during navigation. */
export default async function DashboardAdmissionTemplate({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  if (!isPlatformSignedInLandingPath(requestHeaders.get("x-traderlink-page-path"))) {
    try {
      await requireTraderLinkPlatformServerComponentPageIdentity();
    } catch (error) {
      if (isTraderLinkPlatformError(error)) {
        if (error.safeContext.reason === "membership_feature_required") redirect("/plans");
        const returnTo = encodeURIComponent(loginReturnTo(requestHeaders.get("x-traderlink-page-return-to"), PLATFORM_ENTRY_PATH));
        if (error.code === "TRADERLINK_DASHBOARD_ACCESS_DENIED" || error.safeContext.reason === "dashboard_membership_required") {
          redirect(`/access-required?returnTo=${returnTo}`);
        }
        if (error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED") redirect(`/login?returnTo=${returnTo}`);
      }
      throw error;
    }
  }
  return children;
}
