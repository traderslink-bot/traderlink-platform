import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

/** Recheck navigation when Next retains the shared layout after Workspace entry. */
export default async function DashboardAdmissionTemplate({ children }: { children: ReactNode }) {
  const path = (await headers()).get("x-traderlink-page-path");
  if (path !== "/workspace" && path !== "/workspace/") {
    try {
      await requireTraderLinkPlatformServerComponentPageIdentity();
    } catch (error) {
      if (isTraderLinkPlatformError(error)) {
        if (error.safeContext.reason === "membership_feature_required") redirect("/plans");
        if (error.code === "TRADERLINK_DASHBOARD_ACCESS_DENIED") redirect("/access-required");
        if (error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED") redirect(`/login?returnTo=${encodeURIComponent(path ?? "/workspace")}`);
      }
      throw error;
    }
  }
  return children;
}
