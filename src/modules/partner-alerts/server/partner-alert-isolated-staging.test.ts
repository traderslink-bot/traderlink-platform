// @vitest-environment node
import Database from "better-sqlite3";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const core = vi.hoisted(() => ({ resolve: vi.fn<() => "enabled" | "disabled_private_acceptance" | "disabled_isolated_staging">() }));
vi.mock("../../platform/server/runtime/platform-background-worker-mode", () => ({
  PLATFORM_BACKGROUND_WORKER_MODE_ENV: "TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE",
  resolvePlatformBackgroundWorkerMode: core.resolve,
}));
import { readPartnerAlertIsolatedStaging, PARTNER_ALERT_STAGING_ORIGIN_ENV } from "./partner-alert-isolated-staging";
import { stripeSandboxCredentials } from "./partner-alert-stripe-onboarding-runtime";
import { readPartnerAlertStripeBillingConfiguration } from "./partner-alert-stripe-billing-runtime";
import { resolvePartnerAlertWhopReadEnvironment } from "./partner-alert-catalog-runtime-configuration";
import { PartnerAlertRequestWriter } from "./partner-alert-request-writer";

/** Paid consumer contracts only. Core's separate native guard tests qualify its
 * artifact reader; this stub never claims an actual staging artifact passed. */
function environment(): NodeJS.ProcessEnv {
  return { NODE_ENV: "production", TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE: "disabled_isolated_staging",
    PARTNER_ALERT_ISOLATED_STAGING_ORIGIN: "https://combined-staging.example.invalid",
    TRADERLINK_PLATFORM_PUBLIC_ORIGIN: "https://combined-staging.example.invalid",
    DISCORD_GUILD_ID: "1559172784813514803", PARTNER_STRIPE_DISCORD_GUILD_ID: "1559172784813514803",
    PARTNER_ALERT_WHOP_READ_ENVIRONMENT: "sandbox", TRADERLINK_PLATFORM_DB_PATH: "/synthetic/staging.sqlite",
    TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_COMMIT: "a".repeat(40),
    TRADERLINK_PLATFORM_ISOLATED_STAGING_ARTIFACT_SHA256: "b".repeat(64),
    PARTNER_STRIPE_ONBOARDING_SANDBOX_KEY: "rk_test_isolated_staging_fixture",
    PARTNER_STRIPE_ONBOARDING_SANDBOX_OAUTH_CLIENT: "ca_stagingfixture",
    PARTNER_STRIPE_NATIVE_SANDBOX_SIGNING_SECRET: "whsec_staging_fixture" };
}
function install(env: NodeJS.ProcessEnv) {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
}
beforeEach(() => { core.resolve.mockReturnValue("disabled_isolated_staging"); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it("requires Core's exact qualified staging disposition and retains its complete binding", () => {
  const env = environment();
  const staging = readPartnerAlertIsolatedStaging(env)!;
  expect(core.resolve).toHaveBeenCalledWith(env);
  expect(staging.origin).toBe(env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN);
  expect(staging.fingerprint).toContain(env.TRADERLINK_PLATFORM_ISOLATED_STAGING_ARTIFACT_SHA256);
  env.TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_COMMIT = "c".repeat(40);
  expect(readPartnerAlertIsolatedStaging(env)?.fingerprint).not.toBe(staging.fingerprint);
});
it.each(["enabled", "disabled_private_acceptance"] as const)("does not accept Core disposition %s as staging", mode => {
  core.resolve.mockReturnValue(mode);
  expect(() => readPartnerAlertIsolatedStaging(environment())).toThrow("staging");
});
it("propagates Core's refused/missing artifact before any sandbox credential can be returned", () => {
  install(environment());
  core.resolve.mockImplementation(() => { throw new Error("Isolated staging boundary refused."); });
  expect(stripeSandboxCredentials).toThrow("boundary refused");
  expect(readPartnerAlertStripeBillingConfiguration).toThrow("boundary refused");
});
it.each([undefined, "http://stage.example.invalid", "https://app.traderslink.pro", "https://traderslink.pro",
  "https://www.traderslink.pro", "https://user@stage.example.invalid", "https://stage.example.invalid/path",
  "https://stage.example.invalid:444", "https://localhost"])("refuses unqualified origin %s", origin => {
  const env = { ...environment(), [PARTNER_ALERT_STAGING_ORIGIN_ENV]: origin, TRADERLINK_PLATFORM_PUBLIC_ORIGIN: origin };
  expect(() => readPartnerAlertIsolatedStaging(env)).toThrow("staging");
});
it("refuses mismatched public origin", () => {
  expect(() => readPartnerAlertIsolatedStaging({ ...environment(), TRADERLINK_PLATFORM_PUBLIC_ORIGIN: "https://other.example.invalid" })).toThrow();
});
it.each(["DISCORD_GUILD_ID", "PARTNER_STRIPE_DISCORD_GUILD_ID", "PARTNER_ALERT_WHOP_READ_ENVIRONMENT"])("requires exact sandbox scope %s", key => {
  const env = environment(); env[key] = "wrong";
  expect(() => readPartnerAlertIsolatedStaging(env)).toThrow();
});
it.each(["PARTNER_STRIPE_NATIVE_LIVE_ENABLED", "PARTNER_STRIPE_NATIVE_LIVE_SECRET_KEY",
  "PARTNER_STRIPE_NATIVE_LIVE_SIGNING_SECRET", "PARTNER_STRIPE_NATIVE_LIVE_CONNECT_CLIENT"])("refuses live setting %s without fallback", key => {
  install({ ...environment(), [key]: key.endsWith("ENABLED") ? "true" : "synthetic_live_setting" });
  expect(readPartnerAlertStripeBillingConfiguration).toThrow("staging");
});
it.each([undefined, "enabled", "disabled_private_acceptance"])("refuses staging pins with missing/wrong selected mode %s", mode => {
  const env = environment(); env.TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE = mode;
  expect(() => readPartnerAlertIsolatedStaging(env)).toThrow();
});
it("keeps ordinary production and local preview classification unchanged", () => {
  expect(readPartnerAlertIsolatedStaging({ NODE_ENV: "production" })).toBeNull();
  expect(readPartnerAlertIsolatedStaging({ NODE_ENV: "development", TRADERLINK_PAID_OWNER_PREVIEW: "1" })).toBeNull();
  expect(resolvePartnerAlertWhopReadEnvironment(undefined, { NODE_ENV: "production" })).toBe("live");
  expect(resolvePartnerAlertWhopReadEnvironment("sandbox", { NODE_ENV: "development", TRADERLINK_PAID_OWNER_PREVIEW: "1",
    PARTNER_ALERT_WHOP_READ_ENVIRONMENT: "sandbox", PARTNER_STRIPE_DISCORD_GUILD_ID: "1559172784813514803",
    DISCORD_GUILD_ID: "1559172784813514803" })).toBe("sandbox");
});
it("selects sandbox onboarding, billing and Whop with production auth settings intact", () => {
  const env = environment(); install(env);
  expect(stripeSandboxCredentials()).toMatchObject({ origin: env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN,
    key: env.PARTNER_STRIPE_ONBOARDING_SANDBOX_KEY, clientId: "ca_stagingfixture" });
  expect(readPartnerAlertStripeBillingConfiguration()).toMatchObject({ environment: "sandbox",
    origin: env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN });
  expect(resolvePartnerAlertWhopReadEnvironment("sandbox", env)).toBe("sandbox");
  expect(process.env.NODE_ENV).toBe("production");
  expect(process.env.TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_SESSIONS).not.toBe("true");
});
it.each([undefined, "live"] as const)("does not select live Whop when staging Stripe mode is %s", mode => {
  expect(() => resolvePartnerAlertWhopReadEnvironment(mode, environment())).toThrow("sandbox billing");
});
it("returns no billing when the staging test key or signing secret is missing", () => {
  install({ ...environment(), PARTNER_STRIPE_ONBOARDING_SANDBOX_KEY: undefined });
  expect(readPartnerAlertStripeBillingConfiguration()).toBeNull();
  install({ ...environment(), PARTNER_STRIPE_NATIVE_SANDBOX_SIGNING_SECRET: undefined });
  expect(readPartnerAlertStripeBillingConfiguration()).toBeNull();
});
it("rejects a live key in the sandbox field and a malformed Connect client", () => {
  install({ ...environment(), PARTNER_STRIPE_ONBOARDING_SANDBOX_KEY: "sk_live_synthetic_fixture" });
  expect(readPartnerAlertStripeBillingConfiguration).toThrow("sandbox key");
  install({ ...environment(), PARTNER_STRIPE_ONBOARDING_SANDBOX_OAUTH_CLIENT: "wrong" });
  expect(stripeSandboxCredentials).toThrow("sandbox Connect");
});
it.each(["live_billing", "live_whop", "unauthenticated"])("does not let staging classification bypass request authority: %s", condition => {
  const db = new Database(":memory:");
  const operation = vi.fn();
  try {
    const writer = new PartnerAlertRequestWriter(db, { environment: environment(), now: () => new Date(),
      createId: () => "synthetic", destinationGuildId: "1559172784813514803",
      maximumActorAgeMs: 1000, maximumDiscordEvidenceAgeMs: 1000, outputBotUserId: "850000000000000006",
      outputConfigurationRef: "staging_fixture", stripeEnvironment: condition === "live_billing" ? "live" : "sandbox",
      whopEnvironment: condition === "live_whop" ? "live" : "sandbox" });
    expect(() => writer.run(new Request("https://combined-staging.example.invalid/partner-channels"), operation)).toThrow();
    expect(operation).not.toHaveBeenCalled();
    expect(db.inTransaction).toBe(false);
  } finally { db.close(); }
});
