import "server-only";
import { COMMUNITY_INSTALLATION_MESSAGES, type CommunityInstallationStatus } from "../contracts/community-installation-status";
import { verifyCommunityOwner } from "./community-onboarding-service";

/** Only a complete bot guild inventory can establish absence. Failures never mean absent. */
export async function readCommunityInstallationStatus(guildId: string, ownerDiscordId: string, token: string, request: typeof fetch = fetch): Promise<CommunityInstallationStatus> {
  const result = (state: CommunityInstallationStatus["state"]): CommunityInstallationStatus => ({ state, message: COMMUNITY_INSTALLATION_MESSAGES[state] });
  if (!/^\d{1,32}$/u.test(guildId) || !/^\d{1,32}$/u.test(ownerDiscordId) || !token.trim()) return result("unavailable");
  try {
    let after = "0";
    // Bounded read-only requests. No retry loop, persistence or provider payload logging.
    for (let page = 0; page < 3; page++) {
      const response = await request(`https://discord.com/api/v10/users/@me/guilds?limit=200&after=${after}`, {
        headers: { Authorization: `Bot ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return result("unavailable");
      const guilds: unknown = await response.json();
      if (!Array.isArray(guilds) || guilds.length > 200 || guilds.some(guild => !guild || typeof guild.id !== "string" || !/^\d{1,32}$/u.test(guild.id))) return result("unavailable");
      if (guilds.some(guild => guild.id === guildId)) {
        // Uses the existing integration to verify current ownership, rather than trusting OAuth candidates.
        await verifyCommunityOwner(guildId, ownerDiscordId, token, request);
        return result("ready");
      }
      if (guilds.length < 200) return result("not_installed");
      const next = guilds.reduce((max, guild) => BigInt(guild.id) > BigInt(max) ? guild.id : max, after);
      if (BigInt(next) <= BigInt(after)) return result("unavailable");
      after = next;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Only the Discord server owner can connect this server.") return result("owner_required");
  }
  return result("unavailable");
}
