import "server-only";

import { resolveTraderLinkDiscordGuildId } from "../../platform/server/authentication/platform-discord-configuration";
import { platformPaidStripeConnectBillingMigration } from "../../platform/server/database/migrations/0209_platform_paid_stripe_connect_billing";
import { openPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL } from "../../platform/server/membership/platform-premium-role-schema";
import { PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { PARTNER_ALERT_SCHEMA_STATEMENTS } from "./database/partner-alert-schema";
import { PartnerAlertAdmission } from "./partner-alert-admission";
import { PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS } from "./partner-alert-current-context";
import { bindPartnerAlertNativeSubscriber, resolvePartnerAlertRegisteredPremiumRole } from "./partner-alert-native-runtime";
import { resolvePartnerAlertWhopReadEnvironment } from "./partner-alert-catalog-runtime-configuration";
import { readPartnerAlertDiscordOutputConfiguration } from "./partner-alert-provider-runtime-configuration";
import { readPartnerAlertStripeBillingConfiguration } from "./partner-alert-stripe-billing-runtime";
import { createPartnerAlertStripeRolePorts } from "./partner-alert-stripe-role-ports";
import { startPartnerAlertStripeRoleReconciliation } from "./partner-alert-stripe-role-reconciliation";
import { createPartnerAlertDiscordRoleObserver } from "./partner-alert-discord-channel-catalog";

const slot = Symbol.for("traderlink.partner-alert.stripe-role-runtime");
const state = globalThis as typeof globalThis & { [slot]?: () => Promise<void> };

export function startPartnerAlertStripeSandboxRoleRuntime(): (() => Promise<void>) | null {
  return readPartnerAlertStripeBillingConfiguration()?.environment === "sandbox" ? startPartnerAlertStripeRoleRuntime() : null;
}

/** One worker per process over its reviewed Platform registry. Ordinary
 * previews and hosted processes without Stripe billing stay inactive. */
export function startPartnerAlertStripeRoleRuntime(): (() => Promise<void>) | null {
  const env = process.env;
  const billingEnvironment = readPartnerAlertStripeBillingConfiguration()?.environment;
  if (!billingEnvironment) return null;
  const whopEnvironment = resolvePartnerAlertWhopReadEnvironment(billingEnvironment, env);
  const enabled = () => readPartnerAlertStripeBillingConfiguration()?.environment === billingEnvironment
    && resolvePartnerAlertWhopReadEnvironment(billingEnvironment, env) === whopEnvironment
    && (billingEnvironment === "sandbox" ? env.PARTNER_STRIPE_NATIVE_SANDBOX_ROLE_WORKER_ENABLED === "true"
      : env.PARTNER_ALERT_LIFECYCLE_ENABLED === "true" && env.PARTNER_ALERT_REQUEST_RUNTIME_ENABLED === "true");
  if (!enabled()) return null;
  if (state[slot]) return state[slot];

  const guildId = resolveTraderLinkDiscordGuildId(env);
  const botUserId = env.PARTNER_ALERT_OUTPUT_BOT_USER_ID;
  const configurationRef = env.PARTNER_ALERT_OUTPUT_CONFIGURATION_REF;
  const profileCatalogSha256 = env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256;
  if ((billingEnvironment === "sandbox" && guildId !== env.PARTNER_STRIPE_DISCORD_GUILD_ID) || !botUserId || !configurationRef
    || !profileCatalogSha256 || !/^[a-f0-9]{64}$/u.test(profileCatalogSha256)) return null;
  const protectedRoleIds = (billingEnvironment === "sandbox" ? env.PARTNER_STRIPE_NATIVE_SANDBOX_PROTECTED_ROLE_IDS
    : env.PARTNER_STRIPE_NATIVE_LIVE_PROTECTED_ROLE_IDS)?.split(",").map(id => id.trim()).filter(Boolean) ?? [];
  const readOutput = () => enabled() ? readPartnerAlertDiscordOutputConfiguration(env, botUserId, configurationRef) : null;
  if (!readOutput()) return null;

  const db = openPlatformDatabase({ mode: "runtime", environment: env });
  try {
    const paidRoleId = resolvePartnerAlertRegisteredPremiumRole(db, guildId, env.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID);
    if (!paidRoleId || !protectedRoleIds.includes(paidRoleId)) {
      db.close();
      return null;
    }
    const nowUtc = () => new Date().toISOString();
    const core = PlatformErasureAdmission.bind(db, {
      nowUtc, maximumAdmissionMs: 30_000, profileCatalogSha256,
      participantStatements: [...PARTNER_ALERT_SCHEMA_STATEMENTS, ...PLATFORM_PREMIUM_ROLE_SCHEMA_SQL,
        ...PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS, ...platformPaidStripeConnectBillingMigration.statements],
    });
    PartnerAlertAdmission.bind(db);
    const reportFailure = () => console.error("Partner Channel Stripe role check did not complete.");
    const stop = startPartnerAlertStripeRoleReconciliation(db, { environment: billingEnvironment, nowUtc, reportFailure,
      existingWhopEnvironment: whopEnvironment,
      checkExistingWhopRoles: () => (billingEnvironment === "live" || whopEnvironment === "sandbox") && enabled(),
      bind: createPartnerAlertStripeRolePorts(db, { readOutput, protectedRoleIds, nowUtc, reportFailure,
        bindCurrentAuthority: target => bindPartnerAlertNativeSubscriber(db, core, target, guildId, billingEnvironment, paidRoleId, {
          async observeDiscord(member, signal) {
            const output = readOutput();
            if (!output) return null;
            const observe = createPartnerAlertDiscordRoleObserver({ botToken: output.discordBotToken,
              botUserId: output.discordBotUserId, maximumDurationMs: 5000, transport: (url, init) => fetch(url, init) }, nowUtc);
            const observation = await observe(member, signal);
            return JSON.stringify(readOutput()) === JSON.stringify(output) ? observation : null;
          },
        }),
      }),
    });
    let closing: Promise<void> | null = null;
    const close = () => closing ??= stop().finally(() => {
      db.close();
      if (state[slot] === close) delete state[slot];
    });
    state[slot] = close;
    return close;
  } catch (error) {
    db.close();
    throw error;
  }
}
