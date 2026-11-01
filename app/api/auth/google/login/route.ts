import { platformAuthCookieName } from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { NextResponse, type NextRequest } from "next/server";
import { beginGoogleLogin } from "@/src/modules/platform/server/authentication/platform-google-oauth";
import { loginReturnTo } from "@/src/modules/platform/server/authentication/platform-login-http";
import { resolvePlatformPublicOrigin } from "@/src/modules/platform/server/authentication/platform-public-origin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const origin = resolvePlatformPublicOrigin(request);
  // Forwarded host is used only for canonical routing, never for link origins or authority.
  const incomingHost = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host).split(",")[0].trim().toLowerCase();
  if (process.env.NODE_ENV === "production" && incomingHost !== new URL(origin).host) {
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, origin));
  }
  try {
    const { url, transaction } = await beginGoogleLogin(
      origin,
      loginReturnTo(request.nextUrl.searchParams.get("returnTo")),
    );
    transaction.linking =
      request.nextUrl.searchParams.get("connect") === "1" &&
      request.cookies.get(platformAuthCookieName("tl_provider_link_method"))?.value === "google";
    const response = NextResponse.redirect(url);
    response.cookies.set(platformAuthCookieName("tl_google_oauth"), JSON.stringify(transaction), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=google-unavailable", origin),
    );
  }
}
