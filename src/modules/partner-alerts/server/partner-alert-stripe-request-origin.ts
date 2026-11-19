import "server-only";
import type { NextRequest } from "next/server";
import { resolvePlatformPublicOrigin } from "../../platform/server/authentication/platform-public-origin";

/** Select billing by the canonical public host behind Railway's internal URL.
 * Route authentication, mutation checks and webhook signatures still apply.
 */
export function partnerAlertStripeSandboxOriginMatches(request: NextRequest, billingOrigin: string): boolean {
  const origin = resolvePlatformPublicOrigin(request);
  return origin === billingOrigin || origin === "http://localhost:3039";
}
