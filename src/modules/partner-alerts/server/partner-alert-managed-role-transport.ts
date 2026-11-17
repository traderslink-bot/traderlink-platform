import {
  PlatformPremiumDiscordClient,
  type PlatformPremiumDiscordRest,
} from "../../platform/server/membership/platform-premium-discord-client";
import type { PartnerAlertRoleTransport } from "./partner-alert-role-worker";

type ManagedRole = Readonly<{
  mappingId: string;
  guildId: string;
  channelId: string;
  roleId: string;
  guildPermissions: string;
  allowGrant: boolean;
}>;

/** Writes only the exact registered role. The native client checks Discord
 * bot identity, hierarchy, role permissions and channel scope before writing. */
export function createPartnerAlertManagedRoleTransport(configuration: Readonly<{
  createRest: (scope: Readonly<{ guildId: string; roleId: string }>) => PlatformPremiumDiscordRest;
  botUserId: string;
  forbiddenRoleIds: readonly string[];
  readBinding: (mappingId: string) => ManagedRole | null;
}>): PartnerAlertRoleTransport {
  const currentBinding = (input: Readonly<{ mappingId: string; guildId: string; roleId: string }>, adding: boolean) => {
    const binding = configuration.readBinding(input.mappingId);
    return binding && binding.mappingId === input.mappingId && binding.guildId === input.guildId
      && binding.roleId === input.roleId && !configuration.forbiddenRoleIds.includes(input.roleId)
      && (!adding || binding.allowGrant) ? binding : null;
  };

  return {
    verifyManagedRole: async input => currentBinding(input, input.adding) !== null,
    setRole: async input => {
      const binding = currentBinding(input, input.present);
      if (!binding) return { kind: "rejected", reason: "permission_required" };
      const original = JSON.stringify(binding);
      const client = new PlatformPremiumDiscordClient(configuration.createRest(binding), {
        enabled: true, botUserId: configuration.botUserId, guildId: binding.guildId,
        paidRoleId: binding.roleId, expectedGuildPermissions: binding.guildPermissions,
        complimentaryRoleId: null, forbiddenRoleIds: configuration.forbiddenRoleIds,
        ordinaryChannelIds: [binding.channelId],
      });
      const outcome = await client.setRole({
        authorityKey: input.authorityKey, guildId: input.guildId, discordUserId: input.discordUserId, roleId: input.roleId,
      }, input.present, input.operationId, () => input.stillCurrent()
        && JSON.stringify(currentBinding(input, input.present)) === original);
      switch (outcome.kind) {
        case "confirmed": return { kind: "confirmed", guildId: outcome.target.guildId,
          discordUserId: outcome.target.discordUserId, roleId: outcome.target.roleId, present: outcome.present };
        case "retry": return outcome;
        case "not_written": return { kind: "not_written" };
        case "rejected": return { kind: "rejected", reason: "permission_required" };
        case "uncertain": return { kind: "uncertain" };
      }
    },
  };
}
