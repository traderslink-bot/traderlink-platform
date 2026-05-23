import { NextResponse, type NextRequest } from "next/server";

import {
  deleteAcademyCookie,
  setAcademyCookie,
} from "@/src/lib/academy/academy-auth-cookies";
import {
  ACADEMY_OAUTH_PROMPT_COOKIE,
  ACADEMY_OAUTH_STATE_COOKIE,
  ACADEMY_SESSION_COOKIE,
  ACADEMY_SESSION_TTL_MS,
  AcademyProgressStore,
} from "@/src/lib/academy/academy-progress-store";
import {
  exchangeDiscordCode,
  fetchDiscordCurrentUser,
  getSafeDiscordAuthErrorMessage,
  getDiscordOAuthConfig,
  resolveDiscordCurrentGuildMembership,
  shouldRetryDiscordOAuthWithConsent,
} from "@/src/lib/academy/discord-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function academyRedirect(request: NextRequest, search: string): NextResponse {
  return NextResponse.redirect(
    new URL(`/academy/${search}`, request.nextUrl.origin),
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(ACADEMY_OAUTH_STATE_COOKIE)?.value;
  const prompt = request.cookies.get(ACADEMY_OAUTH_PROMPT_COOKIE)?.value;

  if (!state || !expectedState || state !== expectedState) {
    return academyRedirect(request, "?auth=invalid-state");
  }

  if (oauthError) {
    if (shouldRetryDiscordOAuthWithConsent({ error: oauthError, prompt })) {
      const response = NextResponse.redirect(
        new URL("/api/auth/discord/login?prompt=consent", request.nextUrl.origin),
      );
      clearDiscordOAuthCookies(response, request);
      return response;
    }

    const response = academyRedirect(request, "?auth=failed");
    clearDiscordOAuthCookies(response, request);
    return response;
  }

  if (!code) {
    const response = academyRedirect(request, "?auth=invalid-state");
    clearDiscordOAuthCookies(response, request);
    return response;
  }

  try {
    const config = getDiscordOAuthConfig(request.nextUrl.origin);
    const token = await exchangeDiscordCode({ config, code });
    const [discordUser, guildMember] = await Promise.all([
      fetchDiscordCurrentUser(token.access_token),
      resolveDiscordCurrentGuildMembership({
        accessToken: token.access_token,
        guildId: config.guildId,
      }),
    ]);

    if (!guildMember) {
      const response = academyRedirect(request, "?auth=join-discord");
      clearDiscordOAuthCookies(response, request);
      return response;
    }

    let sessionToken: string;

    try {
      const store = new AcademyProgressStore();
      await store.upsertUser({
        discordUserId: discordUser.id,
        username: discordUser.username,
        globalName: discordUser.global_name ?? null,
        avatar: discordUser.avatar ?? null,
        guildId: config.guildId,
        joinedAt: guildMember.joined_at ?? null,
        rawUser: discordUser,
        rawMember: guildMember,
      });
      const session = await store.createSession(discordUser.id);
      sessionToken = session.token;
    } catch (error) {
      console.error(
        "Discord Academy progress session failed",
        getSafeDiscordAuthErrorMessage(error),
      );

      const response = academyRedirect(request, "?auth=progress-storage-failed");
      clearDiscordOAuthCookies(response, request);
      return response;
    }

    const response = academyRedirect(request, "?auth=connected");

    clearDiscordOAuthCookies(response, request);
    setAcademyCookie(
      response,
      request,
      ACADEMY_SESSION_COOKIE,
      sessionToken,
      Math.floor(ACADEMY_SESSION_TTL_MS / 1000),
    );

    return response;
  } catch (error) {
    console.error(
      "Discord Academy login failed",
      getSafeDiscordAuthErrorMessage(error),
    );

    const response = academyRedirect(request, "?auth=failed");
    clearDiscordOAuthCookies(response, request);
    return response;
  }
}

function clearDiscordOAuthCookies(
  response: NextResponse,
  request: NextRequest,
): void {
  deleteAcademyCookie(response, request, ACADEMY_OAUTH_STATE_COOKIE);
  deleteAcademyCookie(response, request, ACADEMY_OAUTH_PROMPT_COOKIE);
}
