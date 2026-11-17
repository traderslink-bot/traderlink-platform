import "server-only";

import { createPartnerAlertReviewDiscordChannelCatalog as createPartnerAlertDiscordChannelCatalog } from "./partner-alert-review-discord";

import { openPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL } from "../../platform/server/membership/platform-premium-role-schema";
import { PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { PARTNER_ALERT_SCHEMA_STATEMENTS } from "./database/partner-alert-schema";
import { PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS } from "./partner-alert-current-context";

import { refreshPartnerAlertDiscordNamesPage } from "./partner-alert-discord-name-refresh";

const intervalMs = 60_000;
let started = false;

export function startPartnerAlertDiscordNameRefresh(): void {
  if (started || process.env.NODE_ENV !== "production"
    || process.env.PARTNER_ALERT_DISCORD_NAME_REFRESH_ENABLED !== "true") return;
  started = true;
  let running = false;
  let cursor: string | null = null;
  const run = async () => {
    if (running || process.env.PARTNER_ALERT_DISCORD_NAME_REFRESH_ENABLED !== "true") return;
    const profileCatalogSha256 = process.env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256;
    const botToken = process.env.PARTNER_ALERT_DISCORD_BOT_TOKEN;
    const botUserId = process.env.PARTNER_ALERT_DISCORD_BOT_USER_ID;
    if (!profileCatalogSha256 || !botToken || !botUserId) return;
    running = true;
    let database: ReturnType<typeof openPlatformDatabase> | undefined;
    try {
      database = openPlatformDatabase({ mode: "runtime" });
      const admission = PlatformErasureAdmission.bind(database, {
        nowUtc: () => new Date().toISOString(),
        maximumAdmissionMs: 30_000,
        participantStatements: [...PARTNER_ALERT_SCHEMA_STATEMENTS, ...PLATFORM_PREMIUM_ROLE_SCHEMA_SQL,
          ...PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS],
        profileCatalogSha256,
      });
      const catalog = createPartnerAlertDiscordChannelCatalog({
        botToken, botUserId, maximumDurationMs: 5_000,
        transport: (url, init) => fetch(url, init),
      });
      cursor = await refreshPartnerAlertDiscordNamesPage(database, admission, catalog, cursor,
        AbortSignal.timeout(intervalMs));
    } catch {
      console.error("Partner Channels Discord name refresh failed.");
    } finally {
      database?.close();
      running = false;
    }
  };
  setInterval(() => void run(), intervalMs).unref();
}
