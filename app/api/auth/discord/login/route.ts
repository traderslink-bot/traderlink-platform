import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { ACADEMY_OAUTH_STATE_COOKIE } from "@/src/lib/academy/academy-progress-store";
import {
  buildDiscordAuthorizeUrl,
  getDiscordOAuthConfig,
} from "@/src/lib/academy/discord-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = request.nextUrl.origin;

  try {
    const config = getDiscordOAuthConfig(origin);
    const state = randomBytes(24).toString("base64url");
    const response = NextResponse.redirect(
      buildDiscordAuthorizeUrl({ config, state }),
    );

    response.cookies.set(ACADEMY_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      maxAge: 60 * 10,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/academy/?auth=missing-config", origin),
    );
  }
}
