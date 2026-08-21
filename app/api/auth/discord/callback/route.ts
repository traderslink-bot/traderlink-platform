import { NextResponse, type NextRequest } from "next/server";

import {
  deletePlatformAuthCookie,
  setPlatformAuthCookie,
} from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import {
  readProtectedInitialOwnerDiscordSubject,
} from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import {
  PLATFORM_DISCORD_OAUTH_PROMPT_COOKIE,
  PLATFORM_DISCORD_OAUTH_RETURN_TO_COOKIE,
  PLATFORM_DISCORD_OAUTH_STATE_COOKIE,
} from "@/src/modules/platform/server/authentication/platform-discord-oauth-cookies";
import { resolvePlatformPublicOrigin } from "@/src/modules/platform/server/authentication/platform-public-origin";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import {
  TRADERLINK_PLATFORM_SESSION_COOKIE,
  TRADERLINK_PLATFORM_SESSION_TTL_MS,
} from "@/src/modules/platform/server/authentication/platform-session-service";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  buildDiscordAuthResultUrl,
  isWatchlistAuthReturnTo,
  normalizeDiscordAuthReturnTo,
} from "@/src/lib/academy/discord-auth-return";
import {
  exchangeDiscordCode,
  fetchDiscordCurrentUserGuilds,
  fetchDiscordCurrentUser,
  getSafeDiscordAuthErrorMessage,
  getDiscordOAuthConfig,
  resolveDiscordCurrentGuildMembership,
  shouldRetryDiscordOAuthWithConsent,
} from "@/src/lib/academy/discord-oauth";
import {
  hasPlatformDiscordPremiumAccess,
  isPremiumWatchlistRoleConfigured,
} from "@/src/modules/watchlist/server/access/platform-discord-watchlist-entitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authRedirect(
  request: NextRequest,
  returnTo: string,
  status: string,
): NextResponse {
  return NextResponse.redirect(
    buildDiscordAuthResultUrl({
      origin: resolvePlatformPublicOrigin(request),
      returnTo,
      status,
    }),
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(PLATFORM_DISCORD_OAUTH_STATE_COOKIE)?.value;
  const prompt = request.cookies.get(PLATFORM_DISCORD_OAUTH_PROMPT_COOKIE)?.value;
  const returnTo = normalizeDiscordAuthReturnTo(
    request.cookies.get(PLATFORM_DISCORD_OAUTH_RETURN_TO_COOKIE)?.value,
  );

  if (!state || !expectedState || state !== expectedState) {
    const response = authRedirect(request, returnTo, "invalid-state");
    clearDiscordOAuthCookies(response, request);
    return response;
  }

  if (oauthError) {
    if (shouldRetryDiscordOAuthWithConsent({ error: oauthError, prompt })) {
      const response = NextResponse.redirect(
        new URL(
          `/api/auth/discord/login?prompt=consent&returnTo=${encodeURIComponent(returnTo)}`,
          resolvePlatformPublicOrigin(request),
        ),
      );
      clearDiscordOAuthCookies(response, request);
      return response;
    }

    const response = authRedirect(request, returnTo, "failed");
    clearDiscordOAuthCookies(response, request);
    return response;
  }

  if (!code) {
    const response = authRedirect(request, returnTo, "invalid-state");
    clearDiscordOAuthCookies(response, request);
    return response;
  }

  try {
    const config = getDiscordOAuthConfig(resolvePlatformPublicOrigin(request));
    const token = await exchangeDiscordCode({ config, code });
    const [discordUser, guildMember] = await Promise.all([
      fetchDiscordCurrentUser(token.access_token),
      resolveDiscordCurrentGuildMembership({
        accessToken: token.access_token,
        guildId: config.guildId,
      }),
    ]);

    if (!guildMember) {
      const response = authRedirect(request, returnTo, "join-discord");
      clearDiscordOAuthCookies(response, request);
      return response;
    }

    let resolvedGuildMember = guildMember;
    try {
      const guilds = await fetchDiscordCurrentUserGuilds(token.access_token);
      const currentGuild = guilds.find((guild) => guild.id === config.guildId);
      if (currentGuild?.owner === true) {
        resolvedGuildMember = { ...guildMember, guild_owner: true };
      }
    } catch {
      // The member endpoint still provides the role-based access decision.
    }

    const watchlistReturn = isWatchlistAuthReturnTo(returnTo);
    let sessionToken: string;

    try {
      const signIn = withPlatformDatabase({ mode: "runtime" }, (database) =>
        new PlatformDiscordSignInService(database, {
          protectedInitialOwnerAuthSubject:
            readProtectedInitialOwnerDiscordSubject(),
        }).signIn({
        authSubject: discordUser.id,
        username: discordUser.username,
        globalDisplayName: discordUser.global_name ?? null,
        avatarHash: discordUser.avatar ?? null,
        guildId: config.guildId,
        joinedAtUtc: resolvedGuildMember.joined_at ?? null,
        roleIds: resolvedGuildMember.roles ?? [],
        guildOwner: resolvedGuildMember.guild_owner === true,
      }));
      sessionToken = signIn.session.token;
    } catch (error) {
      console.error(
        "Discord Platform session failed",
        getSafeDiscordAuthErrorMessage(error),
      );

      const response = authRedirect(
        request,
        returnTo,
        "progress-storage-failed",
      );
      clearDiscordOAuthCookies(response, request);
      return response;
    }

    let authStatus = "connected";
    if (
      watchlistReturn &&
      process.env.NODE_ENV === "production" &&
      !isPremiumWatchlistRoleConfigured()
    ) {
      authStatus = "premium-config";
    } else if (
      watchlistReturn &&
      !hasPlatformDiscordPremiumAccess({
        guildOwner: resolvedGuildMember.guild_owner === true,
        roleIds: resolvedGuildMember.roles ?? [],
      })
    ) {
      authStatus = "premium-required";
    }
    const response = authRedirect(request, returnTo, authStatus);

    clearDiscordOAuthCookies(response, request);
    setPlatformAuthCookie(
      response,
      request,
      TRADERLINK_PLATFORM_SESSION_COOKIE,
      sessionToken,
      Math.floor(TRADERLINK_PLATFORM_SESSION_TTL_MS / 1000),
    );

    return response;
  } catch (error) {
    console.error(
      "Discord Academy login failed",
      getSafeDiscordAuthErrorMessage(error),
    );

    const response = authRedirect(request, returnTo, "failed");
    clearDiscordOAuthCookies(response, request);
    return response;
  }
}

function clearDiscordOAuthCookies(
  response: NextResponse,
  request: NextRequest,
): void {
  deletePlatformAuthCookie(response, request, PLATFORM_DISCORD_OAUTH_STATE_COOKIE);
  deletePlatformAuthCookie(response, request, PLATFORM_DISCORD_OAUTH_PROMPT_COOKIE);
  deletePlatformAuthCookie(response, request, PLATFORM_DISCORD_OAUTH_RETURN_TO_COOKIE);
}
