import "server-only";

import { partnerAlertInteger, partnerAlertRef, partnerAlertSnowflake } from "../contracts/partner-alert-validation";

/** Metadata credentials only. This cannot authorize output resources, prices,
 * subscriptions, delivery or role changes. The caller still verifies the owner
 * through the normal request writer and the Tests-only Discord catalog. */
export type PartnerAlertOwnerDiscordDiscoveryConfiguration = Readonly<{
  discordBotToken: string;
  discordBotUserId: string;
  discordMaximumEvidenceAgeMs: number;
  outputConfigurationRef: string;
}>;

export function readPartnerAlertOwnerDiscordDiscoveryConfiguration(
  environment: NodeJS.ProcessEnv, expectedBotUserId: string, expectedConfigurationRef: string,
): PartnerAlertOwnerDiscordDiscoveryConfiguration | null {
  if (environment.PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED !== "true"
    || environment.PARTNER_ALERT_OUTPUT_BOT_USER_ID !== expectedBotUserId
    || environment.PARTNER_ALERT_OUTPUT_CONFIGURATION_REF !== expectedConfigurationRef) return null;
  try {
    const botUserId = partnerAlertSnowflake(environment.PARTNER_ALERT_DISCORD_BOT_USER_ID, "discordBotUserId");
    if (botUserId !== partnerAlertSnowflake(expectedBotUserId, "outputBotUserId")) return null;
    const outputConfigurationRef = partnerAlertRef(expectedConfigurationRef, "outputConfigurationRef");
    const token = environment.PARTNER_ALERT_DISCORD_BOT_TOKEN;
    const age = environment.PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS;
    // Same credential bounds as the full provider reader. No payment vault or
    // output binding is constructed merely to list existing Discord channels.
    if (!token || !/^[^\u0000-\u0020\u007f]{20,8192}$/u.test(token)
      || !age || !/^[1-9][0-9]{0,7}$/u.test(age)) return null;
    return Object.freeze({ discordBotToken: token, discordBotUserId: botUserId, outputConfigurationRef,
      discordMaximumEvidenceAgeMs: partnerAlertInteger(Number(age), "discordMaximumEvidenceAgeMs", 1, 300_000) });
  } catch { return null; }
}
