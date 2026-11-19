// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readPartnerAlertOwnerDiscordDiscoveryConfiguration as read } from "./partner-alert-owner-discord-discovery";
import { readPartnerAlertDiscordOutputConfiguration, readPartnerAlertProviderRuntimeConfiguration } from "./partner-alert-provider-runtime-configuration";

const bot = "600000000000000006", reference = "owner_discovery_v1";
const valid: NodeJS.ProcessEnv = {
  NODE_ENV: "production", PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED: "true",
  PARTNER_ALERT_OUTPUT_BOT_USER_ID: bot, PARTNER_ALERT_OUTPUT_CONFIGURATION_REF: reference,
  PARTNER_ALERT_DISCORD_BOT_USER_ID: bot, PARTNER_ALERT_DISCORD_BOT_TOKEN: "synthetic-discord-token-123456789",
  PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS: "60000",
};

describe("owner-only Discord metadata configuration", () => {
  it("needs neither payment configuration nor output bindings and grants no output authority", () => {
    const result = read(valid, bot, reference);
    expect(result).toEqual({ discordBotUserId: bot, discordBotToken: valid.PARTNER_ALERT_DISCORD_BOT_TOKEN,
      discordMaximumEvidenceAgeMs: 60000, outputConfigurationRef: reference });
    expect(Object.isFrozen(result)).toBe(true);
    expect(result).not.toHaveProperty("outputBindings");
    expect(readPartnerAlertDiscordOutputConfiguration(valid, bot, reference)).toBeNull();
    expect(readPartnerAlertProviderRuntimeConfiguration(valid, bot, reference)).toBeNull();
  });

  it.each([
    ["PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED", undefined],
    ["PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED", "false"],
    ["PARTNER_ALERT_OUTPUT_BOT_USER_ID", "600000000000000007"],
    ["PARTNER_ALERT_DISCORD_BOT_USER_ID", "600000000000000007"],
    ["PARTNER_ALERT_DISCORD_BOT_USER_ID", "18446744073709551616"],
    ["PARTNER_ALERT_OUTPUT_CONFIGURATION_REF", "different"],
    ["PARTNER_ALERT_DISCORD_BOT_TOKEN", undefined],
    ["PARTNER_ALERT_DISCORD_BOT_TOKEN", "short"],
    ["PARTNER_ALERT_DISCORD_BOT_TOKEN", "synthetic-token-with whitespace"],
    ["PARTNER_ALERT_DISCORD_BOT_TOKEN", "a".repeat(8193)],
    ["PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS", undefined],
    ["PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS", "0"],
    ["PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS", "300001"],
    ["PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS", "1.5"],
    ["PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS", "060000"],
  ] as const)("refuses invalid or changed %s (%s)", (key, value) => {
    expect(read({ ...valid, [key]: value }, bot, reference)).toBeNull();
  });

  it("retains canonical identity/reference and evidence-age boundaries", () => {
    expect(read(valid, "not-a-snowflake", reference)).toBeNull();
    expect(read({ ...valid, PARTNER_ALERT_OUTPUT_CONFIGURATION_REF: "contains spaces" }, bot, "contains spaces")).toBeNull();
    expect(read({ ...valid, PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS: "300000" }, bot, reference)?.discordMaximumEvidenceAgeMs).toBe(300000);
    expect(read({ ...valid, PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS: "1" }, bot, reference)?.discordMaximumEvidenceAgeMs).toBe(1);
  });
});
