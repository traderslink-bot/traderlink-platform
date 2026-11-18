import type { PlatformPremiumDiscordRest } from "../../platform/server/membership/platform-premium-discord-client";
import { partnerAlertSnowflake } from "../contracts/partner-alert-validation";
import {
  cancelPartnerAlertDiscordBody,
  readPartnerAlertDiscordJson,
  validatePartnerAlertDiscordConfiguration,
  type PartnerAlertDiscordChannelCatalogConfiguration,
} from "./partner-alert-discord-channel-catalog";

export function createPartnerAlertDiscordRoleRest(
  configuration: PartnerAlertDiscordChannelCatalogConfiguration,
  scope: Readonly<{ guildId: string; roleId: string }>,
): PlatformPremiumDiscordRest {
  validatePartnerAlertDiscordConfiguration(configuration);
  const { botToken, transport, maximumDurationMs } = configuration;
  const guild = partnerAlertSnowflake(scope.guildId, "destinationGuildId");
  const role = partnerAlertSnowflake(scope.roleId, "destinationRoleId");
  const memberPath = new RegExp(`^/guilds/${guild}/members/([1-9][0-9]{0,19})$`, "u");
  const rolePath = new RegExp(`^/guilds/${guild}/members/([1-9][0-9]{0,19})/roles/${role}$`, "u");
  const guildReads = new Set(["/users/@me", `/guilds/${guild}/roles`, `/guilds/${guild}/channels`]);
  const unavailable = () => new Error("Partner Channel Discord role request unavailable.");

  return {
    async request({ method, path, auditReason }) {
      const member = (method === "GET" ? memberPath : rolePath).exec(path)?.[1];
      const allowed = method === "GET" ? guildReads.has(path) || member !== undefined
        : (method === "PUT" || method === "DELETE") && member !== undefined;
      if (!allowed || /\s/u.test(path) || (auditReason !== undefined && (method === "GET" || auditReason.length > 120))) {
        throw unavailable();
      }
      try {
        if (member) partnerAlertSnowflake(member, "discordUserId");
        const signal = AbortSignal.timeout(maximumDurationMs);
        const response = await transport(`https://discord.com/api/v10${path}`, {
          method, signal, redirect: "manual", cache: "no-store",
          headers: {
            authorization: `Bot ${botToken}`, accept: "application/json", "user-agent": "TradersLink Partner Channels/1.0",
            ...(auditReason ? { "x-audit-log-reason": encodeURIComponent(auditReason) } : {}),
          },
        });
        if (signal.aborted || response.status < 200 || (response.status >= 300 && response.status < 400)) {
          cancelPartnerAlertDiscordBody(response.body);
          throw unavailable();
        }
        if (response.status !== 200 && response.status !== 404 && response.status !== 429) {
          cancelPartnerAlertDiscordBody(response.body);
          return { status: response.status, body: null };
        }
        return { status: response.status, body: await readPartnerAlertDiscordJson(response, signal) };
      } catch {
        throw unavailable();
      }
    },
  };
}
