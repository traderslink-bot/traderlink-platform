import { NextResponse, type NextRequest } from "next/server";
import {
  finishGoogleLogin,
  type GoogleLoginTransaction,
} from "@/src/modules/platform/server/authentication/platform-google-oauth";
import {
  loginOperation,
  loginReturnTo,
  loginSession,
} from "@/src/modules/platform/server/authentication/platform-login-http";
import { PlatformLoginError } from "@/src/modules/platform/server/authentication/platform-login-service";
import { resolvePlatformPublicOrigin } from "@/src/modules/platform/server/authentication/platform-public-origin";
import { deletePlatformAuthCookie, setPlatformAuthCookie } from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import {
  TRADERLINK_PLATFORM_SESSION_COOKIE,
  TRADERLINK_PLATFORM_SESSION_TTL_MS,
} from "@/src/modules/platform/server/authentication/platform-session-service";
import { resolvePlatformSessionClientLabel } from "@/src/modules/platform/server/authentication/platform-session-client-label";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const origin = resolvePlatformPublicOrigin(request);
  let response: NextResponse;
  try {
    const transaction = JSON.parse(
      request.cookies.get("tl_google_oauth")?.value ?? "null",
    ) as GoogleLoginTransaction;
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      origin,
    );
    const facts = await finishGoogleLogin(url, transaction);
    const linkIntent =
      transaction.linking === true &&
      request.cookies.get("tl_provider_link_method")?.value === "google"
        ? request.cookies.get("tl_provider_link")?.value
        : null;
    if (transaction.linking && !linkIntent)
      throw new PlatformLoginError("invalid");
    const signed = loginOperation((s) =>
      s.signInOAuth({
        ...facts,
        provider: "google",
        linkIntent,
        currentSession: loginSession(request),
        clientLabel: resolvePlatformSessionClientLabel(
          request.headers.get("user-agent"),
        ),
      }),
    );
    response = NextResponse.redirect(
      new URL(
        linkIntent
          ? "/account/login?connected=google"
          : loginReturnTo(transaction.returnTo),
        origin,
      ),
    );
    setPlatformAuthCookie(
      response,
      request,
      TRADERLINK_PLATFORM_SESSION_COOKIE,
      signed.token,
      TRADERLINK_PLATFORM_SESSION_TTL_MS / 1000,
    );
  } catch (error) {
    response = NextResponse.redirect(
      new URL(
        error instanceof PlatformLoginError && error.code === "conflict"
          ? "/login?error=account-conflict"
          : "/login?error=google-failed",
        origin,
      ),
    );
  }
  for (const name of [
    "tl_google_oauth",
    "tl_provider_link",
    "tl_provider_link_method",
  ])
    deletePlatformAuthCookie(response, request, name);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
