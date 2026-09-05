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
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { TraderLinkCommunityAdminRepository } from "@/src/modules/communities/server/traderlink-community-admin-repository";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
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
import { hasPlatformDiscordPremiumAccess } from "@/src/modules/watchlist/server/access/platform-discord-watchlist-entitlement";

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
    const enrolledGuildIds = withPlatformDatabase({ mode: "runtime" }, (database) =>
      (database.prepare(`SELECT discord_guild_id FROM traderlink_communities WHERE status IN ('setup','active')`)
        .all() as readonly { discord_guild_id: string }[]).map((row) => row.discord_guild_id),
    );
    const partnerGuild = discordGuilds.find((guild) => enrolledGuildIds.includes(guild.id));
    const signInGuildId = configuredGuildMember ? config.guildId : partnerGuild?.id;
    const guildMember = configuredGuildMember ?? (signInGuildId
      ? await resolveDiscordCurrentGuildMembership({ accessToken: token.access_token, guildId: signInGuildId })
      : null);
    if (!guildMember || !signInGuildId) {
      const response = authRedirect(request, returnTo, "join-discord");
      clearDiscordOAuthCookies(response, request);
      return response;
    }

    let resolvedGuildMember = guildMember;
    try {
      const currentGuild = discordGuilds.find((guild) => guild.id === signInGuildId);
      if (currentGuild?.owner === true) {
        resolvedGuildMember = { ...guildMember, guild_owner: true };
      }
    } catch {
      // The member endpoint still provides the role-based access decision.
    }

    const watchlistReturn = isWatchlistAuthReturnTo(returnTo);
    const dashboardAccessAllowed = Boolean(partnerGuild) || watchlistReturn || withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PlatformDashboardMemberAccessRepository(database)
        .read().allowAllDiscordMembers || hasPlatformDiscordPremiumAccess({
          guildOwner: resolvedGuildMember.guild_owner === true,
          roleIds: resolvedGuildMember.roles ?? [],
        }),
    );
    if (!dashboardAccessAllowed) {
      const response = authRedirect(request, "/access-required", "dashboard-access-off");
      clearDiscordOAuthCookies(response, request);
      return response;
    }
    let sessionToken: string;
    let allowedAccountIds: readonly string[] = Object.freeze([]);
    let demoAccountId: string | null = null;
    let workspaceId: string | null = null;
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
            guildId: signInGuildId,
            joinedAtUtc: resolvedGuildMember.joined_at ?? null,
            roleIds: resolvedGuildMember.roles ?? [],
            guildOwner: resolvedGuildMember.guild_owner === true,
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

      // Refresh every onboarded community the person currently belongs to. The
      // OAuth token remains request-local; only verified membership and role IDs
      // are stored. Discord therefore remains the source of paid-role access.
      try {
        if (discordGuilds.length > 0) {
        const visibleGuilds = discordGuilds.filter((guild) =>
          enrolledGuildIds.includes(guild.id) || guild.owner === true,
        ).slice(0, 50);
        const verifiedAtUtc = createCanonicalUtcTimestamp();
        withPlatformDatabase({ mode: "runtime" }, (database) => {
          const save = database.prepare(`INSERT INTO traderlink_community_discord_guild_candidates (
  user_id, discord_guild_id, guild_name, guild_owner, can_manage_guild, verified_at_utc
) VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(user_id, discord_guild_id) DO UPDATE SET
  guild_name = excluded.guild_name, guild_owner = excluded.guild_owner,
  can_manage_guild = excluded.can_manage_guild, verified_at_utc = excluded.verified_at_utc`);
          for (const guild of discordGuilds) {
            const permissions = BigInt(guild.permissions ?? "0");
            const manageGuildPermission = BigInt(32);
            const canManageGuild = guild.owner === true || (permissions & manageGuildPermission) === manageGuildPermission;
            if (guild.owner === true || canManageGuild) {
              save.run(
                signInResult.userId,
                guild.id,
                guild.name?.trim() || `Discord server ${guild.id}`,
                guild.owner === true ? 1 : 0,
                canManageGuild ? 1 : 0,
                verifiedAtUtc,
              );
            }
          }
        });
        for (const guild of visibleGuilds) {
          const enrolled = enrolledGuildIds.includes(guild.id);
          const member = enrolled
            ? await resolveDiscordCurrentGuildMembership({
              accessToken: token.access_token,
              guildId: guild.id,
            })
            : null;
          if (enrolled && !member) continue;
          withPlatformDatabase({ mode: "runtime" }, (database) => {
            new PlatformDiscordMembershipRepository(database).upsertCurrent({
              userId: signInResult.userId,
              guildId: guild.id,
              username: discordUser.username,
              globalDisplayName: discordUser.global_name ?? null,
              avatarHash: discordUser.avatar ?? null,
              roleIds: member?.roles ?? [],
              guildOwner: guild.owner === true,
              joinedAtUtc: member?.joined_at ?? null,
              verifiedAtUtc,
            });
            const community = database.prepare(`SELECT community_id
FROM traderlink_communities WHERE discord_guild_id = ?`).get(guild.id) as
              | { community_id: string }
              | undefined;
            if (community) {
              new TraderLinkCommunityRepository(database).syncActiveMemberFromDiscord({
                communityId: community.community_id,
                userId: signInResult.userId,
                timestamp: verifiedAtUtc,
              });
              new TraderLinkCommunityAdminRepository(database).attributeMember({
                communityId: community.community_id,
                userId: signInResult.userId,
                atUtc: verifiedAtUtc,
              });
            }
          });
        }
        }
      } catch (error) {
        console.warn(
          "Discord community membership refresh failed",
          getSafeDiscordAuthErrorMessage(error),
        );
      }
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

    const response = authRedirect(request, returnTo, "connected");

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
