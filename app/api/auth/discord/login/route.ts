import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import {
  setPlatformAuthCookie,
} from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import {
  PLATFORM_DISCORD_OAUTH_PROMPT_COOKIE,
  PLATFORM_DISCORD_OAUTH_RETURN_TO_COOKIE,
  PLATFORM_DISCORD_OAUTH_STATE_COOKIE,
} from "@/src/modules/platform/server/authentication/platform-discord-oauth-cookies";
import {
  requireTraderLinkPlatformRequestIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  buildDiscordAuthResultUrl,
  isWatchlistAuthReturnTo,
  normalizeDiscordAuthReturnTo,
} from "@/src/lib/academy/discord-auth-return";
import {
  buildDiscordAuthorizeUrl,
  type DiscordOAuthPrompt,
  getDiscordOAuthConfig,
} from "@/src/lib/academy/discord-oauth";
import { hasPlatformDiscordPremiumAccess } from "@/src/modules/watchlist/server/access/platform-discord-watchlist-entitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = request.nextUrl.origin;
  const returnTo = normalizeDiscordAuthReturnTo(
    request.nextUrl.searchParams.get("returnTo"),
  );
  let currentIdentity: TraderLinkPlatformRequestIdentity | null = null;

  try {
    currentIdentity = requireTraderLinkPlatformRequestIdentity(request.headers);
  } catch {
    currentIdentity = null;
  }

  if (
    currentIdentity &&
    (!isWatchlistAuthReturnTo(returnTo) ||
      currentIdentity.mode === "local_development" ||
      (currentIdentity.discord !== null &&
        hasPlatformDiscordPremiumAccess(currentIdentity.discord)))
  ) {
    return NextResponse.redirect(new URL(returnTo, origin));
  }

  try {
    const config = getDiscordOAuthConfig(origin);
    const prompt =
      currentIdentity &&
      isWatchlistAuthReturnTo(returnTo) &&
      currentIdentity.mode === "platform_session" &&
      (currentIdentity.discord === null ||
        !hasPlatformDiscordPremiumAccess(currentIdentity.discord))
        ? "consent"
        : getDiscordOAuthPrompt(request);
    const state = randomBytes(24).toString("base64url");
    const response = NextResponse.redirect(
      buildDiscordAuthorizeUrl({ config, prompt, state }),
    );

    setPlatformAuthCookie(response, request, PLATFORM_DISCORD_OAUTH_STATE_COOKIE, state, 600);
    setPlatformAuthCookie(
      response,
      request,
      PLATFORM_DISCORD_OAUTH_PROMPT_COOKIE,
      prompt,
      600,
    );
    setPlatformAuthCookie(
      response,
      request,
      PLATFORM_DISCORD_OAUTH_RETURN_TO_COOKIE,
      returnTo,
      600,
    );

    return response;
  } catch {
    return NextResponse.redirect(
      buildDiscordAuthResultUrl({
        origin,
        returnTo,
        status: "missing-config",
      }),
    );
  }
}

function getDiscordOAuthPrompt(request: NextRequest): DiscordOAuthPrompt {
  return request.nextUrl.searchParams.get("prompt") === "consent"
    ? "consent"
    : "none";
}
