import { describe, expect, it } from "vitest";

import { partnerAlertOutputBindingMatches,
  readPartnerAlertProviderRuntimeConfiguration } from "./partner-alert-provider-runtime-configuration";

const bot = "600000000000000006";
const ref = "partner_alert_output_v1";
const binding = Object.freeze({ communityId: "20000000-0000-4000-8000-000000000002",
  sourceGuildId: "200000000000000002", sourceChannelId: "300000000000000003",
  destinationGuildId: "100000000000000001", destinationChannelId: "400000000000000004",
  destinationRoleId: "500000000000000005" });
const key = Buffer.alloc(32, 7).toString("base64");
const valid = Object.freeze({
  NODE_ENV: "test",
  PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED: "true",
  PARTNER_ALERT_CATALOG_CHECKOUT_ENABLED: "true",
  PARTNER_ALERT_WHOP_CREDENTIAL_ACTIVE_KEY_VERSION: "current",
  PARTNER_ALERT_WHOP_CREDENTIAL_KEYS_JSON: JSON.stringify({ current: key }),
  PARTNER_ALERT_WHOP_EVIDENCE_MAX_AGE_MS: "60000",
  PARTNER_ALERT_DISCORD_MESSAGE_CONTENT_INTENT_ENABLED: "true",
  PARTNER_ALERT_DISCORD_BOT_USER_ID: bot,
  PARTNER_ALERT_DISCORD_BOT_TOKEN: "test-discord-token-1234567890",
  PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS: "60000",
  PARTNER_ALERT_OUTPUT_BINDINGS_JSON: JSON.stringify({ configurationRef: ref, bindings: [binding] }),
  PARTNER_ALERT_PUBLISHING_PRICING_CAPABILITIES_JSON: JSON.stringify({
    currencies: [{ code: "USD", minorUnitDigits: 2 }], calendarMonthCadence: true,
  }),
} as NodeJS.ProcessEnv);

describe("Partner Channel provider runtime configuration", () => {
  it("accepts one complete exact disabled-by-default provider configuration", () => {
    const result = readPartnerAlertProviderRuntimeConfiguration(valid, bot, ref);
    expect(result).toMatchObject({ discordBotUserId: bot, discordMaximumEvidenceAgeMs: 60_000,
      outputConfigurationRef: ref, outputBindings: [binding],
      pricingCapabilities: { currencies: [{ code: "USD", minorUnitDigits: 2 }], calendarMonthCadence: true } });
    expect(result && partnerAlertOutputBindingMatches(result.outputBindings, binding)).toBe(true);
    expect(result && partnerAlertOutputBindingMatches(result.outputBindings,
      { ...binding, destinationRoleId: "700000000000000007" })).toBe(false);
  });

  it("fails closed when provider enablement is absent", () => {
    expect(readPartnerAlertProviderRuntimeConfiguration({ ...valid,
      PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED: undefined }, bot, ref)).toBeNull();
  });

  it("fails closed when the output registry ref does not match the persisted runtime ref", () => {
    expect(readPartnerAlertProviderRuntimeConfiguration({ ...valid,
      PARTNER_ALERT_OUTPUT_BINDINGS_JSON: JSON.stringify({ configurationRef: "different", bindings: [binding] }),
    }, bot, ref)).toBeNull();
  });

  it("rejects duplicate destination roles and malformed pricing capabilities", () => {
    expect(readPartnerAlertProviderRuntimeConfiguration({ ...valid,
      PARTNER_ALERT_OUTPUT_BINDINGS_JSON: JSON.stringify({ configurationRef: ref,
        bindings: [binding, { ...binding, sourceChannelId: "700000000000000007" }] }),
    }, bot, ref)).toBeNull();
    expect(readPartnerAlertProviderRuntimeConfiguration({ ...valid,
      PARTNER_ALERT_PUBLISHING_PRICING_CAPABILITIES_JSON: JSON.stringify({
        currencies: [{ code: "USD", minorUnitDigits: 2 }, { code: "USD", minorUnitDigits: 2 }],
        calendarMonthCadence: true,
      }),
    }, bot, ref)).toBeNull();
  });
});
