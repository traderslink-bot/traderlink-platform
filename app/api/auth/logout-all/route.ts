import { NextResponse, type NextRequest } from "next/server";

import {
  deletePlatformAuthCookie,
} from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { LEGACY_ACADEMY_SESSION_COOKIE } from "@/src/modules/platform/server/authentication/platform-discord-oauth-cookies";
import { PlatformSessionRepository } from "@/src/modules/platform/server/authentication/platform-session-repository";
import {
  isSameOriginPlatformSignOutRequest,
  signOutRedirectUrl,
} from "@/src/modules/platform/server/authentication/platform-sign-out-request-security";
import {
  PlatformSessionService,
  TRADERLINK_PLATFORM_SESSION_COOKIE,
} from "@/src/modules/platform/server/authentication/platform-session-service";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginPlatformSignOutRequest(request)) {
    return NextResponse.json({ error: "Sign-out request denied." }, { status: 403 });
  }
  const token = request.cookies.get(TRADERLINK_PLATFORM_SESSION_COOKIE)?.value;
  try {
    withPlatformDatabase({ mode: "runtime" }, (database) => {
      const sessions = new PlatformSessionService(
        new PlatformSessionRepository(database),
      );
      const currentSession = sessions.resolve(token);
      if (currentSession) sessions.revokeAllForUser(currentSession.userId);
    });
  } catch {
    const response = NextResponse.redirect(
      signOutRedirectUrl(request, "/account/security?sessionAction=unavailable"),
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const response = NextResponse.redirect(
    signOutRedirectUrl(request, "/signed-out"),
  );
  response.headers.set("Cache-Control", "private, no-store");
  deletePlatformAuthCookie(response, request, TRADERLINK_PLATFORM_SESSION_COOKIE);
  deletePlatformAuthCookie(response, request, LEGACY_ACADEMY_SESSION_COOKIE);
  return response;
}
