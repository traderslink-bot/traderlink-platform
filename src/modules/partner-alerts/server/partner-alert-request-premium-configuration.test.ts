import { describe,expect,it,vi } from "vitest";
import { readPartnerAlertRequestPremiumConfiguration } from "./partner-alert-request-premium-configuration";
vi.mock("./partner-alert-isolated-staging",() => ({ readPartnerAlertIsolatedStaging: (env: NodeJS.ProcessEnv) =>
  env.UNIT_STAGE === "qualified" ? { origin: "https://stage.example.test",fingerprint: env.UNIT_BINDING ?? "original" } : null }));
const configured = (): NodeJS.ProcessEnv => ({ NODE_ENV: "test",UNIT_STAGE: "qualified",PARTNER_ALERT_PREMIUM_WHOP_SANDBOX_READ_TOKEN: "unit_read_secret",
  TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_COMMIT: "a".repeat(40),TRADERLINK_PLATFORM_ISOLATED_STAGING_SOURCE_VECTOR_SHA256: "b".repeat(64),
  TRADERLINK_PLATFORM_ISOLATED_STAGING_SCHEMA_SHA256: "c".repeat(64),TRADERLINK_PLATFORM_ISOLATED_STAGING_BUILD_ID: "unit_build",
  TRADERLINK_PLATFORM_ISOLATED_STAGING_ARTIFACT_SHA256: "d".repeat(64) });
describe("normal request Premium server configuration (classification fixtures)",() => {
  it("never selects a generic or live key outside staging",() => {
    const env = configured();delete env.UNIT_STAGE;env.WHOP_API_KEY = "unit_live_key";
    expect(readPartnerAlertRequestPremiumConfiguration(env)).toBeNull();
  });
  it.each([undefined,"","has space","has\nnewline","x".repeat(8193)])("refuses missing or invalid sandbox read credential %#",value => {
    const env = configured();env.PARTNER_ALERT_PREMIUM_WHOP_SANDBOX_READ_TOKEN = value;env.WHOP_API_KEY = "unit_fallback";
    expect(readPartnerAlertRequestPremiumConfiguration(env)).toBeNull();
  });
  it.each(["SOURCE_COMMIT","SOURCE_VECTOR_SHA256","SCHEMA_SHA256","BUILD_ID","ARTIFACT_SHA256"])("refuses an incomplete native %s pin",name => {
    const env = configured();delete env["TRADERLINK_PLATFORM_ISOLATED_STAGING_" + name];
    expect(readPartnerAlertRequestPremiumConfiguration(env)).toBeNull();
  });
  it("returns immutable pins and a non-secret rotation fingerprint, not an environment merchant",() => {
    const env = configured();env.PARTNER_ALERT_PREMIUM_ACCOUNT_ID = "biz_untrusted";
    const initial = readPartnerAlertRequestPremiumConfiguration(env)!;
    expect(initial.pins.origin).toBe("https://stage.example.test");expect(Object.isFrozen(initial.pins)).toBe(true);
    expect(initial.fingerprint).toMatch(/^[a-f0-9]{64}$/u);expect(initial.fingerprint).not.toContain(initial.readToken);
    expect(initial).not.toHaveProperty("accountId");expect(initial).not.toHaveProperty("offer");
    env.PARTNER_ALERT_PREMIUM_WHOP_SANDBOX_READ_TOKEN = "unit_rotated_secret";
    expect(readPartnerAlertRequestPremiumConfiguration(env)?.fingerprint).not.toBe(initial.fingerprint);
    env.UNIT_BINDING = "changed";
    expect(readPartnerAlertRequestPremiumConfiguration(env)?.fingerprint).not.toBe(initial.fingerprint);
  });
});
