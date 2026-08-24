"use server";

import { revalidatePath } from "next/cache";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { openPlatformDatabase, withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";
import { loadPlatformNotificationEmailEncryptionConfiguration } from "@/src/modules/platform/server/notifications/platform-notification-email-configuration";
import {
  PlatformNotificationEmailAddressRepository,
} from "@/src/modules/platform/server/notifications/platform-notification-email-address-repository";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { MarketHaltAlertRepository } from "@/src/modules/news/server/market-halt-alert-repository";

export async function saveDiscordDmNotificationCategories(
  categories: readonly string[],
): Promise<Readonly<{ ok: true; categories: readonly string[] }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const preferences = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PlatformNotificationRepository(database)
        .replaceDiscordDmCategories({
          categories,
          scope,
          updatedAtUtc: createCanonicalUtcTimestamp(),
        }),
    );
    revalidatePath("/account");
    return Object.freeze({ ok: true as const, categories: preferences.discordDmCategories });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Choose notifications from the available categories."
        : "Your notification settings could not be saved. Try again.",
    });
  }
}

export async function saveWebPushNotificationCategories(
  categories: readonly string[],
): Promise<Readonly<{ ok: true; categories: readonly string[] }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const preferences = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PlatformNotificationRepository(database)
        .replaceWebPushCategories({
          categories,
          scope,
          updatedAtUtc: createCanonicalUtcTimestamp(),
        }),
    );
    revalidatePath("/account/preferences");
    return Object.freeze({ ok: true as const, categories: preferences.webPushCategories });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Choose notifications from the available categories."
        : "Your push notification choices could not be saved. Try again.",
    });
  }
}

export async function saveEmailNotificationCategories(
  categories: readonly string[],
): Promise<Readonly<{ ok: true; categories: readonly string[] }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const preferences = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PlatformNotificationRepository(database)
        .replaceEmailCategories({
          categories,
          scope,
          updatedAtUtc: createCanonicalUtcTimestamp(),
        }),
    );
    revalidatePath("/account/preferences");
    return Object.freeze({ ok: true as const, categories: preferences.emailCategories });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Choose notifications from the available categories."
        : "Your email notification choices could not be saved. Try again.",
    });
  }
}

export async function requestNotificationEmailConfirmation(
  emailAddress: string,
): Promise<Readonly<{ ok: true; message: string }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const database = openPlatformDatabase({ mode: "runtime" });
    const result = await (async () => {
      try {
        return await new PlatformNotificationEmailAddressRepository(
          database,
          loadPlatformNotificationEmailEncryptionConfiguration(),
        ).requestConfirmation({
          emailAddress,
          requestedAtUtc: createCanonicalUtcTimestamp(),
          scope,
        });
      } finally {
        database.close();
      }
    })();
    revalidatePath("/account/preferences");
    return result.delivery.ok
      ? Object.freeze({ ok: true as const, message: "Confirmation email sent." })
      : Object.freeze({ ok: false as const, message: "The confirmation email could not be sent. Try again." });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED" &&
      error.safeContext.field === "notificationEmailAddress";
    return Object.freeze({
      ok: false as const,
      message: invalid ? "Enter a valid email address." : "The confirmation email could not be sent. Try again.",
    });
  }
}

export async function confirmNotificationEmailAddress(
  code: string,
): Promise<Readonly<{ ok: true; message: string }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const result = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PlatformNotificationEmailAddressRepository(
        database,
        loadPlatformNotificationEmailEncryptionConfiguration(),
      ).confirmCode({
        code,
        confirmedAtUtc: createCanonicalUtcTimestamp(),
        scope,
      }),
    );
    revalidatePath("/account/preferences");
    return result.status === "confirmed"
      ? Object.freeze({ ok: true as const, message: "Email confirmed." })
      : Object.freeze({ ok: false as const, message: "That confirmation code is invalid or expired." });
  } catch {
    return Object.freeze({ ok: false as const, message: "That confirmation code could not be checked. Try again." });
  }
}

export async function savePressReleasePushChannels(
  channels: readonly string[],
): Promise<Readonly<{ ok: true; channels: readonly string[] }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const saved = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new PressReleaseDashboardRepository(database)
        .replacePushPreferences({
          channels,
          scope,
          updatedAtUtc: createCanonicalUtcTimestamp(),
        }),
    );
    revalidatePath("/account/preferences");
    return Object.freeze({ ok: true as const, channels: saved });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid
        ? "Choose press release alerts from the available channels."
        : "Your press release alert choices could not be saved. Try again.",
    });
  }
}

export async function saveMarketHaltAlertsEnabled(
  enabled: boolean,
): Promise<Readonly<{ ok: true; enabled: boolean }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const saved = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new MarketHaltAlertRepository(database).setEnabled({
        enabled,
        scope,
        updatedAtUtc: createCanonicalUtcTimestamp(),
      }),
    );
    revalidatePath("/account/preferences");
    return Object.freeze({ enabled: saved, ok: true as const });
  } catch {
    return Object.freeze({
      ok: false as const,
      message: "Your halt alert choice could not be saved. Try again.",
    });
  }
}

export async function muteMarketHaltTicker(
  ticker: string,
): Promise<Readonly<{ ok: true; ticker: string }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const saved = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new MarketHaltAlertRepository(database).muteForCurrentTradingDay({
        scope,
        ticker,
        updatedAtUtc: createCanonicalUtcTimestamp(),
      }),
    );
    revalidatePath("/account/preferences");
    return Object.freeze({ ok: true as const, ticker: saved });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid ? "That halt alert could not be muted." : "That halt alert could not be muted. Try again.",
    });
  }
}

export async function unmuteMarketHaltTicker(
  ticker: string,
): Promise<Readonly<{ ok: true; ticker: string }> | Readonly<{ ok: false; message: string }>> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const saved = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new MarketHaltAlertRepository(database).unmute({
        scope,
        ticker,
      }),
    );
    revalidatePath("/account/preferences");
    return Object.freeze({ ok: true as const, ticker: saved });
  } catch (error) {
    const invalid = isTraderLinkPlatformError(error) &&
      error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Object.freeze({
      ok: false as const,
      message: invalid ? "That halt ticker could not be unmuted." : "That halt ticker could not be unmuted. Try again.",
    });
  }
}
