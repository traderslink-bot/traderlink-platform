import { NextResponse, type NextRequest } from "next/server";

import { resolvePlatformPublicOrigin } from "@/src/modules/platform/server/authentication/platform-public-origin";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";
import { PlatformNotificationEmailAddressRepository } from "@/src/modules/platform/server/notifications/platform-notification-email-address-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function redirectToPreferences(request: NextRequest, status: "confirmed" | "invalid"): NextResponse {
  const destination = new URL("/account/preferences", resolvePlatformPublicOrigin(request));
  destination.searchParams.set("emailConfirmation", status);
  return NextResponse.redirect(destination, 303);
}

/**
 * The opaque address reference and high-entropy token come only from the
 * confirmation email. This endpoint intentionally has no session requirement
 * so opening the link on a different device still confirms that address.
 */
export function GET(request: NextRequest): NextResponse {
  try {
    const searchParams = request.nextUrl.searchParams;
    const result = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PlatformNotificationEmailAddressRepository(
        database,
        loadPlatformNotificationEmailEncryptionConfiguration(),
      ).confirmLink({
        code: searchParams.get("token"),
        confirmedAtUtc: createCanonicalUtcTimestamp(),
        emailAddressRef: searchParams.get("email"),
      }),
    );
    return redirectToPreferences(request, result.status === "confirmed" ? "confirmed" : "invalid");
  } catch {
    return redirectToPreferences(request, "invalid");
  }
}
