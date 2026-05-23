import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { setAcademyCookie } from "@/src/lib/academy/academy-auth-cookies";
import {
  ACADEMY_OAUTH_PROMPT_COOKIE,
  ACADEMY_OAUTH_STATE_COOKIE,
  ACADEMY_SESSION_COOKIE,
  AcademyProgressStore,
} from "@/src/lib/academy/academy-progress-store";
import {
  buildDiscordAuthorizeUrl,
  type DiscordOAuthPrompt,
  getDiscordOAuthConfig,
} from "@/src/lib/academy/discord-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = request.nextUrl.origin;
  let hasCurrentSession = false;

  try {
    const session = await new AcademyProgressStore().getSessionByToken(
      request.cookies.get(ACADEMY_SESSION_COOKIE)?.value,
    );
    hasCurrentSession = Boolean(session);
  } catch (error) {
    console.warn("Academy session reuse check failed", error);
  }

  if (hasCurrentSession) {
    return NextResponse.redirect(new URL("/academy/", origin));
  }

  try {
    const config = getDiscordOAuthConfig(origin);
    const prompt = getDiscordOAuthPrompt(request);
    const state = randomBytes(24).toString("base64url");
    const response = NextResponse.redirect(
      buildDiscordAuthorizeUrl({ config, prompt, state }),
    );

    setAcademyCookie(response, request, ACADEMY_OAUTH_STATE_COOKIE, state, 600);
    setAcademyCookie(
      response,
      request,
      ACADEMY_OAUTH_PROMPT_COOKIE,
      prompt,
      600,
    );

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/academy/?auth=missing-config", origin),
    );
  }
}

function getDiscordOAuthPrompt(request: NextRequest): DiscordOAuthPrompt {
  return request.nextUrl.searchParams.get("prompt") === "consent"
    ? "consent"
    : "none";
}
