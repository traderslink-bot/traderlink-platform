import { NextResponse, type NextRequest } from "next/server";

import {
  ACADEMY_OAUTH_STATE_COOKIE,
  ACADEMY_SESSION_COOKIE,
  ACADEMY_SESSION_TTL_MS,
  AcademyProgressStore,
} from "@/src/lib/academy/academy-progress-store";
import {
  exchangeDiscordCode,
  fetchDiscordCurrentGuildMember,
  fetchDiscordCurrentUser,
  getDiscordOAuthConfig,
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
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(ACADEMY_OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return academyRedirect(request, "?auth=invalid-state");
  }

  try {
    const config = getDiscordOAuthConfig(request.nextUrl.origin);
    const token = await exchangeDiscordCode({ config, code });
    const [discordUser, guildMember] = await Promise.all([
      fetchDiscordCurrentUser(token.access_token),
      fetchDiscordCurrentGuildMember({
        accessToken: token.access_token,
        guildId: config.guildId,
      }),
    ]);

    if (!guildMember) {
      const response = academyRedirect(request, "?auth=join-discord");
      response.cookies.delete(ACADEMY_OAUTH_STATE_COOKIE);
      return response;
    }

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
    const { token: sessionToken } = await store.createSession(discordUser.id);
    const response = academyRedirect(request, "?auth=connected");

    response.cookies.delete(ACADEMY_OAUTH_STATE_COOKIE);
    response.cookies.set(ACADEMY_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      maxAge: Math.floor(ACADEMY_SESSION_TTL_MS / 1000),
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Discord Academy login failed", error);
    }

    const response = academyRedirect(request, "?auth=failed");
    response.cookies.delete(ACADEMY_OAUTH_STATE_COOKIE);
    return response;
  }
}
