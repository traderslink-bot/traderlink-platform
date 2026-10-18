import { NextResponse, type NextRequest } from "next/server";
import { beginGoogleLogin } from "@/src/modules/platform/server/authentication/platform-google-oauth";
import { loginReturnTo } from "@/src/modules/platform/server/authentication/platform-login-http";
import { resolvePlatformPublicOrigin } from "@/src/modules/platform/server/authentication/platform-public-origin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const origin = resolvePlatformPublicOrigin(request);
  try {
    const { url, transaction } = await beginGoogleLogin(
      origin,
      loginReturnTo(request.nextUrl.searchParams.get("returnTo")),
    );
    transaction.linking =
      request.nextUrl.searchParams.get("connect") === "1" &&
      request.cookies.get("tl_provider_link_method")?.value === "google";
    const response = NextResponse.redirect(url);
    response.cookies.set("tl_google_oauth", JSON.stringify(transaction), {
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
