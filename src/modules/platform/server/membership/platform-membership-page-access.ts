import "server-only";
import { redirect } from "next/navigation";
import { requireTraderLinkPlatformPageScope } from "../authentication/require-platform-request-scope";
import { isMembershipAccessDenied } from "./platform-membership-access";
import { withPlatformDatabase } from "../database/open-platform-database";

/** For server-rendered pages and redirect-based form actions, not JSON APIs. */
export const withMembershipPageDatabase: typeof withPlatformDatabase = (options, operation) => {
  try {
    return withPlatformDatabase(options, operation);
  } catch (error) {
    if (isMembershipAccessDenied(error)) redirect("/plans");
    throw error;
  }
};

/** Pages guide denied members to Plans; actions/APIs must return their own response. */
export async function requireMembershipPageScope(feature: string) {
  try {
    return await requireTraderLinkPlatformPageScope({ membershipFeatures: [feature] });
  } catch (error) {
    if (isMembershipAccessDenied(error)) redirect("/plans");
    throw error;
  }
}
