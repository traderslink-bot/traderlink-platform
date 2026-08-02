import { NextResponse, type NextRequest } from "next/server";

import {
  deletePlatformAuthCookie,
} from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { LEGACY_ACADEMY_SESSION_COOKIE } from "@/src/modules/platform/server/authentication/platform-discord-oauth-cookies";
import { PlatformSessionRepository } from "@/src/modules/platform/server/authentication/platform-session-repository";
import {
  PlatformSessionService,
  TRADERLINK_PLATFORM_SESSION_COOKIE,
} from "@/src/modules/platform/server/authentication/platform-session-service";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(TRADERLINK_PLATFORM_SESSION_COOKIE)?.value;
  try {
    withPlatformDatabase({ mode: "runtime" }, (database) =>
      new PlatformSessionService(
        new PlatformSessionRepository(database),
      ).revoke(token));
  } catch {
    // Cookie clearing must still complete when storage is unavailable.
  }

  const response = NextResponse.redirect(
    new URL("/academy/", request.nextUrl.origin),
  );
  deletePlatformAuthCookie(response, request, TRADERLINK_PLATFORM_SESSION_COOKIE);
  deletePlatformAuthCookie(response, request, LEGACY_ACADEMY_SESSION_COOKIE);
  return response;
}
