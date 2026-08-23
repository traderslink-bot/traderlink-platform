"use server";

import { revalidatePath } from "next/cache";

import type { CreateCommunityWatchlistInput } from "@/src/modules/community/contracts/community-watchlist-contracts";
import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";

type CommunityWatchlistActionResult =
  | Readonly<{ ok: true; href: string; message: string }>
  | Readonly<{ ok: false; message: string }>;

function configuredDiscordWebhook(): string | null {
  const value = process.env.DISCORD_COMMUNITY_WATCHLIST_WEBHOOK_URL;
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "discord.com" || url.hostname.endsWith(".discord.com"))
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function configuredPublicOrigin(): string | null {
  const value = process.env.DISCORD_REDIRECT_URI;
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

async function deliverDiscordAnnouncement(publicationId: string): Promise<boolean> {
  const timestamp = createCanonicalUtcTimestamp();
  const publication = withPlatformDatabase({ mode: "runtime" }, (database) =>
    new CommunityWatchlistRepository(database).claimDiscordPublication(publicationId, timestamp),
  );
  if (!publication) return true;
  const webhook = configuredDiscordWebhook();
  const origin = configuredPublicOrigin();
  if (!webhook || !origin) {
    withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CommunityWatchlistRepository(database).markDiscordFailure(
        publication.publication_id,
        createCanonicalUtcTimestamp(),
        "configuration_unavailable",
      ),
    );
    return false;
  }
  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        content: `@${publication.profile_handle} shared a watchlist\n\n${publication.watchlist_title}\n${publication.symbol_count} symbols\n\nView watchlist -> ${origin}/community/${publication.profile_handle}/watchlists/${publication.watchlist_slug}`,
      }),
    });
    if (!response.ok) throw new Error("discord_delivery_failed");
    withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CommunityWatchlistRepository(database).markDiscordDelivery(
        publication.publication_id,
        createCanonicalUtcTimestamp(),
      ),
    );
    return true;
  } catch {
    withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CommunityWatchlistRepository(database).markDiscordFailure(
        publication.publication_id,
        createCanonicalUtcTimestamp(),
        "delivery_failed",
      ),
    );
    return false;
  }
}

export async function createCommunityWatchlist(
  input: CreateCommunityWatchlistInput,
): Promise<CommunityWatchlistActionResult> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const created = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CommunityWatchlistRepository(database).create({
        userId: scope.userId,
        timestamp: createCanonicalUtcTimestamp(),
        watchlist: input,
      }),
    );
    const discordDelivered = created.publicationId
      ? await deliverDiscordAnnouncement(created.publicationId)
      : true;
    revalidatePath("/community/watchlists", "layout");
    return Object.freeze({
      ok: true as const,
      href: created.detailHref,
      message: input.publish
        ? input.sendDiscord && !discordDelivered
          ? "Your watchlist is published. Its Discord announcement could not be sent yet."
          : input.sendDiscord
            ? "Your watchlist is published and announced in Discord."
            : "Your watchlist is published."
        : "Your draft is saved.",
    });
  } catch (error) {
    const accessChanged = isTraderLinkPlatformError(error) && [
      "TRADERLINK_AUTH_SESSION_INVALID",
      "TRADERLINK_WORKSPACE_ACCESS_DENIED",
    ].includes(error.code);
    return Object.freeze({
      ok: false as const,
      message: accessChanged
        ? "Your sign-in changed. Refresh this page and try again."
        : "Your watchlist could not be saved. Check the title and ticker details, then try again.",
    });
  }
}

export async function replaceCommunityWatchlistTicker(input: Readonly<{
  handle: string;
  watchlistSlug: string;
  currentSymbol: string;
  nextSymbol: string;
}>): Promise<CommunityWatchlistActionResult> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CommunityWatchlistRepository(database).replaceTickerSymbol({
        ...input,
        userId: scope.userId,
        timestamp: createCanonicalUtcTimestamp(),
      }),
    );
    revalidatePath(`/community/${input.handle}/watchlists/${input.watchlistSlug}`);
    revalidatePath("/community/watchlists", "layout");
    return Object.freeze({
      ok: true as const,
      href: `/community/${input.handle}/watchlists/${input.watchlistSlug}`,
      message: "Ticker changed.",
    });
  } catch (error) {
    const accessChanged = isTraderLinkPlatformError(error) && [
      "TRADERLINK_AUTH_SESSION_INVALID",
      "TRADERLINK_WORKSPACE_ACCESS_DENIED",
    ].includes(error.code);
    return Object.freeze({
      ok: false as const,
      message: accessChanged
        ? "Your sign-in changed. Refresh this page and try again."
        : "That ticker could not be changed. Make sure it is unique in this watchlist.",
    });
  }
}
