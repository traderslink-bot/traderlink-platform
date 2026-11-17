import "server-only";

import { resolvePlatformBackgroundWorkerMode,
  PLATFORM_BACKGROUND_WORKER_MODE_ENV } from "../../platform/server/runtime/platform-background-worker-mode";
import { COMMUNITY_REVIEW_DISCORD_GUILD_ID } from "../../communities/server/community-review-discord-guild";

export const PARTNER_ALERT_STAGING_ORIGIN_ENV = "PARTNER_ALERT_ISOLATED_STAGING_ORIGIN";
const prefix = "TRADERLINK_PLATFORM_ISOLATED_STAGING_";

function refused(): never {
  throw Object.assign(new Error("Paid isolated staging configuration unavailable."), {
    code: "PARTNER_ALERT_ISOLATED_STAGING_INVALID",
  });
}

/** Classification only: Core verifies the exact compiled staging artifact.
 * This supplies no session, paid entitlement, worker or effect authority. */
export function readPartnerAlertIsolatedStaging(environment: NodeJS.ProcessEnv = process.env)
  : Readonly<{ origin: string; fingerprint: string }> | null {
  const selected = environment[PLATFORM_BACKGROUND_WORKER_MODE_ENV] === "disabled_isolated_staging";
  if (!selected) {
    if (environment[PARTNER_ALERT_STAGING_ORIGIN_ENV] !== undefined
      || Object.keys(environment).some(key => key.startsWith(prefix) && environment[key] !== undefined)) return refused();
    return null;
  }
  if (resolvePlatformBackgroundWorkerMode(environment) !== "disabled_isolated_staging") return refused();
  const origin = environment[PARTNER_ALERT_STAGING_ORIGIN_ENV];
  if (!origin || origin !== environment.TRADERLINK_PLATFORM_PUBLIC_ORIGIN
    || environment.DISCORD_GUILD_ID !== COMMUNITY_REVIEW_DISCORD_GUILD_ID
    || environment.PARTNER_STRIPE_DISCORD_GUILD_ID !== COMMUNITY_REVIEW_DISCORD_GUILD_ID
    || environment.PARTNER_ALERT_WHOP_READ_ENVIRONMENT !== "sandbox"
    || environment.PARTNER_STRIPE_NATIVE_LIVE_ENABLED === "true"
    || ["PARTNER_STRIPE_NATIVE_LIVE_SECRET_KEY", "PARTNER_STRIPE_NATIVE_LIVE_SIGNING_SECRET",
      "PARTNER_STRIPE_NATIVE_LIVE_CONNECT_CLIENT"].some(key => Boolean(environment[key]))) return refused();
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" || url.origin !== origin || url.username || url.password || url.port
      || !url.hostname.includes(".") || url.hostname === "localhost" || url.hostname.endsWith(".localhost")
      || ["traderslink.pro", "app.traderslink.pro", "www.traderslink.pro"].includes(url.hostname)) return refused();
  } catch { return refused(); }
  const pins = ["SOURCE_COMMIT", "SOURCE_VECTOR_SHA256", "SCHEMA_SHA256", "BUILD_ID", "ARTIFACT_SHA256"];
  return Object.freeze({ origin, fingerprint: JSON.stringify([origin, environment.RAILWAY_PROJECT_ID,
    environment.RAILWAY_ENVIRONMENT_ID, environment.RAILWAY_SERVICE_ID, environment.RAILWAY_DEPLOYMENT_ID,
    environment.TRADERLINK_PLATFORM_DB_PATH, COMMUNITY_REVIEW_DISCORD_GUILD_ID,
    ...pins.map(key => environment[prefix + key])]) });
}
