// @vitest-environment node
import { expect, it } from "vitest";
import { createPartnerAlertManagedRoleTransport } from "./partner-alert-managed-role-transport";

const guildId = "810000000000000001";
const discordUserId = "810000000000000002";
const roleId = "810000000000000003";
const botUserId = "810000000000000004";
const botRole = "810000000000000005";
const channelId = "810000000000000006";
const otherRole = "810000000000000007";
const mappingId = "11111111-1111-4111-8111-111111111111";

it.each([false, true])("revalidates the registry after native Discord checks (changed %s)", async changed => {
  let binding = { guildId, mappingId, roleId, channelId, guildPermissions: "0", allowGrant: true };
  const roles = new Set([roleId, otherRole]);
  const writes: string[] = [];
  const transport = createPartnerAlertManagedRoleTransport({
    botUserId, forbiddenRoleIds: [otherRole], readBinding: () => binding,
    createRest: () => ({
      async request(input) {
        if (input.path === "/users/@me") return { status: 200, body: { id: botUserId, bot: true } };
        if (input.path === `/guilds/${guildId}/roles`) return { status: 200, body: [
          { id: guildId, managed: false, permissions: "0", position: 0 },
          { id: roleId, managed: false, permissions: "0", position: 1 },
          { id: botRole, managed: false, permissions: String(1 << 28), position: 2 },
        ] };
        if (input.path === `/guilds/${guildId}/members/${botUserId}`) {
          return { status: 200, body: { user: { id: botUserId }, roles: [botRole] } };
        }
        if (input.path === `/guilds/${guildId}/channels`) {
          if (changed) binding = { ...binding, channelId: otherRole };
          return { status: 200, body: [{ id: channelId, guild_id: guildId, permission_overwrites: [] }] };
        }
        expect(input.method).toBe("DELETE");
        expect(input.path).toBe(`/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`);
        writes.push(input.path);
        roles.delete(roleId);
        return { status: 204, body: null };
      },
    }),
  });
  expect(await transport.verifyManagedRole({ guildId, mappingId, roleId: otherRole, adding: false })).toBe(false);
  const result = await transport.setRole({ mappingId, guildId, discordUserId, roleId, present: false,
    authorityKey: "authority", operationId: "operation", stillCurrent: () => true });
  expect(result.kind).toBe(changed ? "not_written" : "confirmed");
  expect(writes).toHaveLength(changed ? 0 : 1);
  expect([...roles]).toEqual(changed ? [roleId, otherRole] : [otherRole]);
});
