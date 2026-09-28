import { NextResponse, type NextRequest } from "next/server";

import {
  deriveJournalAccountSelectionRef,
  resolveJournalAccountSelection,
} from "@/src/modules/platform/contracts/journal-account-selection";
import {
  deletePlatformAuthCookie,
  setPlatformAuthCookie,
} from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import {
  readJournalAccountSelectionCookie,
  serializeJournalAccountSelectionCookie,
  serializeJournalDemoReturnAccountSelectionCookie,
} from "@/src/modules/platform/server/authentication/journal-account-selection-cookie";
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
import { PlatformNewsletterContactRepository } from "@/src/modules/platform/server/newsletter/platform-newsletter-contact-repository";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";
import { resolvePlatformSessionClientLabel } from "@/src/modules/platform/server/authentication/platform-session-client-label";
import { PlatformDashboardMemberAccessRepository } from "@/src/modules/platform/server/authentication/platform-dashboard-member-access-repository";
import { PlatformDiscordMembershipRepository } from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import {
  TRADERLINK_PLATFORM_SESSION_COOKIE,
  TRADERLINK_PLATFORM_SESSION_TTL_MS,
} from "@/src/modules/platform/server/authentication/platform-session-service";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  buildDiscordAuthResultUrl,
  isWatchlistAuthReturnTo,
  isSwingIdeaAuthReturnTo,
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
import { hasPlatformDiscordPremiumAccess } from "@/src/modules/watchlist/server/access/platform-discord-watchlist-entitlement";
import {
  readMembershipDiscordGuildIds,
  recordMembershipDiscordAbsence,
} from "@/src/modules/platform/server/membership/platform-membership-discord";
import { hasPlatformMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";

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
    const [discordUser, configuredGuildMember, discordGuilds] = await Promise.all([
      fetchDiscordCurrentUser(token.access_token),
      resolveDiscordCurrentGuildMembership({
        accessToken: token.access_token,
        guildId: config.guildId,
      }),
      fetchDiscordCurrentUserGuilds(token.access_token).catch(() => []),
    ]);
    const membershipGuildIds = withPlatformDatabase(
      { mode: "runtime" },
      readMembershipDiscordGuildIds,
    );
    const membershipGuild = discordGuilds.find((guild) =>
      membershipGuildIds.includes(guild.id)
    );
    const signInGuildId = configuredGuildMember
      ? config.guildId
      : membershipGuild?.id ?? null;
    const guildMember = configuredGuildMember ?? (signInGuildId
      ? await resolveDiscordCurrentGuildMembership({
          accessToken: token.access_token,
          guildId: signInGuildId,
        })
      : null);
    let resolvedGuildMember = guildMember;
    if (guildMember && signInGuildId) {
      const currentGuild = discordGuilds.find((guild) => guild.id === signInGuildId);
      if (currentGuild?.owner === true) {
        resolvedGuildMember = { ...guildMember, guild_owner: true };
      }
    }

    const watchlistReturn = isWatchlistAuthReturnTo(returnTo);
    const dashboardAccessAllowed = Boolean(resolvedGuildMember) && (
      watchlistReturn || isSwingIdeaAuthReturnTo(returnTo) || withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PlatformDashboardMemberAccessRepository(database)
        .read().allowAllDiscordMembers || hasPlatformDiscordPremiumAccess({
          guildOwner: resolvedGuildMember?.guild_owner === true,
          roleIds: resolvedGuildMember?.roles ?? [],
        }),
    ));
    let sessionToken: string;
    let allowedAccountIds: readonly string[] = Object.freeze([]);
    let demoAccountId: string | null = null;
    let workspaceId: string | null = null;
    let membershipDashboardAccess = false;
    let membershipWatchlistAccess = false;
    try {
      const signInResult = withPlatformDatabase({ mode: "runtime" }, (database) => {
        let newsletterContacts: PlatformNewsletterContactRepository | null = null;
        try {
          newsletterContacts = new PlatformNewsletterContactRepository(
            database,
            loadPlatformNotificationEmailEncryptionConfiguration(),
          );
        } catch {
          newsletterContacts = null;
        }
        const signIn = new PlatformDiscordSignInService(database, {
          protectedInitialOwnerAuthSubject:
            readProtectedInitialOwnerDiscordSubject(),
          syncVerifiedDiscordEmail: newsletterContacts
            ? (input) => {
              try {
                newsletterContacts?.syncVerifiedDiscordEmail({
                  emailAddress: input.emailAddress,
                  updatedAtUtc: input.timestamp,
                  userId: input.userId,
                });
              } catch {
                // Newsletter capture is optional and must never deny sign-in.
              }
            }
            : undefined,
        }).signIn(
          {
            authSubject: discordUser.id,
            username: discordUser.username,
            globalDisplayName: discordUser.global_name ?? null,
            avatarHash: discordUser.avatar ?? null,
            emailAddress: discordUser.email ?? null,
            emailVerified: discordUser.verified === true,
            guildId: resolvedGuildMember && signInGuildId ? signInGuildId : null,
            joinedAtUtc: resolvedGuildMember?.joined_at ?? null,
            roleIds: resolvedGuildMember?.roles ?? [],
            guildOwner: resolvedGuildMember?.guild_owner === true,
            sessionClientLabel: resolvePlatformSessionClientLabel(
              request.headers.get("user-agent"),
            ),
          },
          { deferDemoActivation: true },
        );
        return signIn;
      });
      sessionToken = signInResult.session.token;
      allowedAccountIds = signInResult.allowedAccountIds;
      demoAccountId = signInResult.demoAccountId;
      workspaceId = signInResult.workspaceId;
      const verifiedAtUtc = createCanonicalUtcTimestamp();
      for (const guildId of membershipGuildIds) {
        try {
          const member = guildId === signInGuildId && resolvedGuildMember
            ? resolvedGuildMember
            : await resolveDiscordCurrentGuildMembership({
                accessToken: token.access_token,
                guildId,
              });
          withPlatformDatabase({ mode: "runtime" }, (database) => {
            if (!member) {
              recordMembershipDiscordAbsence(
                database,
                signInResult.userId,
                guildId,
                verifiedAtUtc,
              );
              return;
            }
            const listedGuild = discordGuilds.find((guild) => guild.id === guildId);
            new PlatformDiscordMembershipRepository(database).upsertCurrent({
              userId: signInResult.userId,
              guildId,
              username: discordUser.username,
              globalDisplayName: discordUser.global_name ?? null,
              avatarHash: discordUser.avatar ?? null,
              roleIds: member.roles ?? [],
              guildOwner: listedGuild?.owner === true || member.guild_owner === true,
              joinedAtUtc: member.joined_at ?? null,
              verifiedAtUtc,
            });
          });
        } catch {
          // One unavailable Discord server must not block account sign-in or
          // erase the last verified commercial membership snapshot.
          console.warn("Discord membership refresh failed");
        }
      }
      withPlatformDatabase({ mode: "runtime" }, (database) => {
        membershipDashboardAccess = hasPlatformMembershipFeature(
          database,
          signInResult.userId,
          "dashboard.access",
        );
        membershipWatchlistAccess = hasPlatformMembershipFeature(
          database,
          signInResult.userId,
          "watchlist.access",
        );
      });
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

    const billingReturn = returnTo === "/plans" || returnTo.startsWith("/plans/") ||
      returnTo.startsWith("/plans?") || returnTo === "/account/membership" ||
      returnTo.startsWith("/account/membership?");
    const academyReturn = returnTo === "/academy" || returnTo.startsWith("/academy/") ||
      returnTo.startsWith("/academy?");
    const membershipReturnAccess = membershipDashboardAccess ||
      (watchlistReturn && membershipWatchlistAccess);
    const destination = billingReturn || academyReturn || membershipReturnAccess || dashboardAccessAllowed
      ? returnTo
      : "/plans";
    const response = authRedirect(request, destination, "connected");

    clearDiscordOAuthCookies(response, request);
    setPlatformAuthCookie(
      response,
      request,
      TRADERLINK_PLATFORM_SESSION_COOKIE,
      sessionToken,
      Math.floor(TRADERLINK_PLATFORM_SESSION_TTL_MS / 1000),
    );
    if (demoAccountId && workspaceId) {
      try {
        const priorSelectionRef = readJournalAccountSelectionCookie(request.headers);
        if (priorSelectionRef) {
          const prior = resolveJournalAccountSelection(
            workspaceId,
            priorSelectionRef,
            allowedAccountIds.map((accountId) => Object.freeze({ accountId })),
          );
          if (prior.accountId !== demoAccountId) {
            response.headers.append(
              "set-cookie",
              serializeJournalDemoReturnAccountSelectionCookie(prior.selectionRef),
            );
          }
        }
      } catch {
        // A stale account selector must never prevent a valid completed sign-in.
      }
      response.headers.append(
        "set-cookie",
        serializeJournalAccountSelectionCookie(
          deriveJournalAccountSelectionRef(workspaceId, demoAccountId),
        ),
      );
    } else if (workspaceId && allowedAccountIds.length > 0) {
      try {
        const priorSelectionRef = readJournalAccountSelectionCookie(request.headers);
        const allowedAccounts = allowedAccountIds.map((accountId) => Object.freeze({ accountId }));
        let selection: ReturnType<typeof resolveJournalAccountSelection>;
        try {
          selection = resolveJournalAccountSelection(
            workspaceId,
            priorSelectionRef,
            allowedAccounts,
          );
        } catch {
          // The cookie was well-formed but no longer matches an active account.
          selection = resolveJournalAccountSelection(
            workspaceId,
            undefined,
            allowedAccounts,
          );
        }
        response.headers.append(
          "set-cookie",
          serializeJournalAccountSelectionCookie(selection.selectionRef),
        );
      } catch {
        // Malformed browser input remains fail-closed and is not rewritten here.
      }
    }

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
