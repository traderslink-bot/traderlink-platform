import type { PartnerAlertPricingCapabilities } from "../contracts/partner-alert-publishing-pricing";
import { parsePartnerAlertCurrency, partnerAlertExactKeys, partnerAlertId,
  partnerAlertInteger, partnerAlertRecord, partnerAlertSnowflake } from "../contracts/partner-alert-validation";
import type { PartnerAlertResourceVerificationTarget } from "./partner-alert-provider-verification";
import { readPartnerAlertCatalogRuntimeConfiguration,
  type PartnerAlertCatalogRuntimeConfiguration } from "./partner-alert-catalog-runtime-configuration";

export type PartnerAlertProviderOutputBinding = PartnerAlertResourceVerificationTarget;

export type PartnerAlertDiscordOutputConfiguration = Readonly<{
  discordBotToken: string;
  discordBotUserId: string;
  discordMaximumEvidenceAgeMs: number;
  outputConfigurationRef: string;
  outputBindings: readonly PartnerAlertProviderOutputBinding[];
}>;
export type PartnerAlertProviderRuntimeConfiguration = PartnerAlertCatalogRuntimeConfiguration & PartnerAlertDiscordOutputConfiguration
  & Readonly<{ pricingCapabilities: PartnerAlertPricingCapabilities }>;

const TOKEN = /^[^\u0000-\u0020\u007f]{20,8192}$/u;
const REF = /^[A-Za-z0-9_:-]{1,160}$/u;

function exactBinding(value: unknown): PartnerAlertProviderOutputBinding {
  const record = partnerAlertRecord(value, "outputBinding");
  partnerAlertExactKeys(record, ["communityId", "sourceGuildId", "sourceChannelId", "destinationGuildId",
    "destinationChannelId", "destinationRoleId"], "outputBinding");
  return Object.freeze({ communityId: partnerAlertId(record.communityId, "communityId"),
    sourceGuildId: partnerAlertSnowflake(record.sourceGuildId, "sourceGuildId"),
    sourceChannelId: partnerAlertSnowflake(record.sourceChannelId, "sourceChannelId"),
    destinationGuildId: partnerAlertSnowflake(record.destinationGuildId, "destinationGuildId"),
    destinationChannelId: partnerAlertSnowflake(record.destinationChannelId, "destinationChannelId"),
    destinationRoleId: partnerAlertSnowflake(record.destinationRoleId, "destinationRoleId") });
}

function bindingKey(value: PartnerAlertProviderOutputBinding): string {
  return [value.communityId, value.sourceGuildId, value.sourceChannelId, value.destinationGuildId,
    value.destinationChannelId, value.destinationRoleId].join(":");
}

/** No secrets, database, credentials or provider transport are touched unless
 * every gate is present and exact. The output registry is the independent proof
 * Discord cannot provide for ownership of an unmanaged destination role. */
export function readPartnerAlertDiscordOutputConfiguration(environment: NodeJS.ProcessEnv,
  expectedOutputBotUserId: string, expectedOutputConfigurationRef: string): PartnerAlertDiscordOutputConfiguration | null {
  if (environment.PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED !== "true") return null;
  let botUserId: string; let outputBotUserId: string;
  try {
    botUserId = partnerAlertSnowflake(environment.PARTNER_ALERT_DISCORD_BOT_USER_ID, "discordBotUserId");
    outputBotUserId = partnerAlertSnowflake(expectedOutputBotUserId, "outputBotUserId");
  } catch { return null; }
  const discordBotToken = environment.PARTNER_ALERT_DISCORD_BOT_TOKEN;
  const ageValue = environment.PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS;
  if (botUserId !== outputBotUserId || !discordBotToken || !TOKEN.test(discordBotToken)
    || !ageValue || !/^[1-9][0-9]{0,7}$/u.test(ageValue)
    || !REF.test(expectedOutputConfigurationRef)) return null;
  let discordMaximumEvidenceAgeMs: number;
  try { discordMaximumEvidenceAgeMs = partnerAlertInteger(Number(ageValue), "discordMaximumEvidenceAgeMs", 1, 300_000); }
  catch { return null; }
  let outputRaw: unknown;
  try {
    outputRaw = JSON.parse(environment.PARTNER_ALERT_OUTPUT_BINDINGS_JSON ?? "");
  } catch { return null; }
  try {
    const output = partnerAlertRecord(outputRaw, "outputBindings");
    partnerAlertExactKeys(output, ["configurationRef", "bindings"], "outputBindings");
    if (output.configurationRef !== expectedOutputConfigurationRef || !Array.isArray(output.bindings)
      || output.bindings.length < 1 || output.bindings.length > 250) return null;
    const outputBindings = Object.freeze(output.bindings.map(exactBinding));
    if (new Set(outputBindings.map(bindingKey)).size !== outputBindings.length
      || new Set(outputBindings.map(value => value.destinationChannelId)).size !== outputBindings.length
      || new Set(outputBindings.map(value => value.destinationRoleId)).size !== outputBindings.length) return null;
    return Object.freeze({ discordBotToken, discordBotUserId: botUserId,
      discordMaximumEvidenceAgeMs, outputConfigurationRef: expectedOutputConfigurationRef, outputBindings });
  } catch { return null; }
}

export function readPartnerAlertProviderRuntimeConfiguration(environment: NodeJS.ProcessEnv,
  expectedOutputBotUserId: string, expectedOutputConfigurationRef: string): PartnerAlertProviderRuntimeConfiguration | null {
  if (environment.PARTNER_ALERT_DISCORD_MESSAGE_CONTENT_INTENT_ENABLED !== "true") return null;
  const discord = readPartnerAlertDiscordOutputConfiguration(environment, expectedOutputBotUserId, expectedOutputConfigurationRef);
  if (!discord) return null;
  const catalog = readPartnerAlertCatalogRuntimeConfiguration(environment);
  const pricingCapabilities = readPartnerAlertPublishingPricingCapabilities(environment);
  return catalog && pricingCapabilities ? Object.freeze({ ...catalog, ...discord, pricingCapabilities }) : null;
}

export function readPartnerAlertPublishingPricingCapabilities(environment: NodeJS.ProcessEnv): PartnerAlertPricingCapabilities | null {
  try {
    const pricingRaw: unknown = JSON.parse(environment.PARTNER_ALERT_PUBLISHING_PRICING_CAPABILITIES_JSON ?? "");
    const pricing = partnerAlertRecord(pricingRaw, "pricingCapabilities");
    partnerAlertExactKeys(pricing, ["currencies", "calendarMonthCadence"], "pricingCapabilities");
    if (!Array.isArray(pricing.currencies) || pricing.currencies.length < 1 || pricing.currencies.length > 25
      || typeof pricing.calendarMonthCadence !== "boolean") return null;
    const currencies = Object.freeze(pricing.currencies.map(parsePartnerAlertCurrency));
    if (new Set(currencies.map(value => `${value.code}:${value.minorUnitDigits}`)).size !== currencies.length) return null;
    return Object.freeze({ currencies: Object.freeze(currencies), calendarMonthCadence: pricing.calendarMonthCadence });
  } catch { return null; }
}

export function partnerAlertOutputBindingMatches(bindings: readonly PartnerAlertProviderOutputBinding[],
  target: PartnerAlertResourceVerificationTarget): boolean {
  const key = bindingKey(target);
  return bindings.some(value => bindingKey(value) === key);
}
