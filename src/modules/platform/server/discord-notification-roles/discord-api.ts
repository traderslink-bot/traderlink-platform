import { notificationRoles, type NotificationRoleKey } from "./catalog";
import { isDiscordId, type NotificationRoleConfiguration } from "./configuration";
import { discordNotificationUserAgent } from "./http-client";

const apiOrigin = "https://discord.com/api/v10";
type DiscordRole = { id: string; name: string; position: number; permissions: string; managed: boolean };
type DiscordMember = { roles: string[]; user: { id: string } };
type DiscordChannel = { id: string; guild_id: string; type: number; permission_overwrites?: { id: string; type: number; allow: string; deny: string }[] };

export class NotificationRoleApiError extends Error {
  constructor() { super("Discord notification roles are unavailable"); }
}

/** Bounded REST calls; never surface Discord bodies, URLs or credentials in errors/logs. */
export class NotificationRoleDiscordApi {
  constructor(private readonly config: NotificationRoleConfiguration, private readonly deadline = Date.now() + 25_000) {}

  private async request(path: string, method = "GET", payload?: unknown, authenticated = true): Promise<unknown> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const remaining = this.deadline - Date.now();
      if (remaining <= 0) throw new NotificationRoleApiError();
      let response: Response;
      try {
        response = await fetch(`${apiOrigin}${path}`, {
          method, cache: "no-store", signal: AbortSignal.timeout(Math.min(remaining, 5_000)),
          headers: {
            ...(authenticated ? { Authorization: `Bot ${this.config.botToken}` } : {}),
            "Content-Type": "application/json",
            "User-Agent": discordNotificationUserAgent,
          },
          ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
        });
      } catch { throw new NotificationRoleApiError(); }
      if (response.status === 429) {
        const limit = await response.json().catch(() => null) as { retry_after?: unknown } | null;
        const seconds = limit?.retry_after;
        if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0
          || seconds > 3 || Date.now() + seconds * 1_000 >= this.deadline) throw new NotificationRoleApiError();
        await new Promise(resolve => setTimeout(resolve, Math.max(50, Math.ceil(seconds * 1_000))));
        continue;
      }
      if (!response.ok) throw new NotificationRoleApiError();
      return response.status === 204 ? null : response.json().catch(() => { throw new NotificationRoleApiError(); });
    }
    throw new NotificationRoleApiError();
  }

  async memberRoles(memberId: string): Promise<string[]> {
    if (!isDiscordId(memberId)) throw new NotificationRoleApiError();
    const member = await this.request(`/guilds/${this.config.guildId}/members/${memberId}`) as DiscordMember;
    if (!member || member.user?.id !== memberId || !Array.isArray(member.roles) || !member.roles.every(isDiscordId)) {
      throw new NotificationRoleApiError();
    }
    return member.roles;
  }

  /** Revalidate safety before every Save; role names/hierarchy/overwrites may change at any time. */
  async verifySetup(): Promise<void> {
    const bot = await this.request("/users/@me") as { id?: unknown; bot?: unknown };
    if (!bot || bot.id !== this.config.applicationId || bot.bot !== true) throw new NotificationRoleApiError();
    const roles = await this.request(`/guilds/${this.config.guildId}/roles`) as DiscordRole[];
    if (!Array.isArray(roles) || !roles.every(role => role && isDiscordId(role.id)
      && typeof role.name === "string" && Number.isInteger(role.position)
      && typeof role.managed === "boolean" && typeof role.permissions === "string"
      && /^\d+$/u.test(role.permissions))) throw new NotificationRoleApiError();
    const botRoles = await this.memberRoles(this.config.applicationId);
    const owned = roles.filter(role => botRoles.includes(role.id) || role.id === this.config.guildId);
    const permissions = owned.reduce((bits, role) => bits | BigInt(role.permissions), BigInt(0));
    if ((permissions & (BigInt(1) << BigInt(28))) === BigInt(0)
      && (permissions & BigInt(8)) === BigInt(0)) throw new NotificationRoleApiError();
    const highest = [...owned].sort((a, b) => b.position - a.position || (BigInt(a.id) < BigInt(b.id) ? -1 : 1))[0];
    if (!highest) throw new NotificationRoleApiError();
    for (const entry of notificationRoles) {
      const role = roles.find(item => item.id === this.config.roleIds[entry.key]);
      if (!role || role.managed || role.name !== entry.label.slice(1) || BigInt(role.permissions) !== BigInt(0)
        || role.position > highest.position || (role.position === highest.position && BigInt(role.id) <= BigInt(highest.id))) {
        throw new NotificationRoleApiError();
      }
    }
    const channels = await this.request(`/guilds/${this.config.guildId}/channels`) as DiscordChannel[];
    if (!Array.isArray(channels)) throw new NotificationRoleApiError();
    const panelChannel = channels.find(channel => channel.id === this.config.channelId);
    if (!panelChannel || panelChannel.guild_id !== this.config.guildId || ![0, 5].includes(panelChannel.type)) {
      throw new NotificationRoleApiError();
    }
    const approvedIds = new Set(Object.values(this.config.roleIds));
    for (const channel of channels) {
      if (channel.permission_overwrites !== undefined && !Array.isArray(channel.permission_overwrites)) throw new NotificationRoleApiError();
      for (const overwrite of channel.permission_overwrites ?? []) {
        if (overwrite.type === 0 && approvedIds.has(overwrite.id)
          && (typeof overwrite.allow !== "string" || !/^\d+$/u.test(overwrite.allow) || BigInt(overwrite.allow) !== BigInt(0))) {
          throw new NotificationRoleApiError();
        }
      }
    }
  }

  async setRole(memberId: string, key: NotificationRoleKey, present: boolean): Promise<void> {
    const roleId = this.config.roleIds[key];
    if (!isDiscordId(memberId) || !isDiscordId(roleId)) throw new NotificationRoleApiError();
    // Dedicated per-role endpoints preserve all unrelated membership and staff roles.
    await this.request(`/guilds/${this.config.guildId}/members/${memberId}/roles/${roleId}`, present ? "PUT" : "DELETE");
  }

  async editInteraction(token: string, payload: unknown): Promise<void> {
    if (!/^[A-Za-z0-9._-]{20,2048}$/u.test(token)) throw new NotificationRoleApiError();
    await this.request(`/webhooks/${this.config.applicationId}/${token}/messages/@original`, "PATCH", payload, false);
  }

  async publishPanel(payload: unknown): Promise<string> {
    const message = await this.request(`/channels/${this.config.channelId}/messages`, "POST", payload) as { id?: unknown };
    if (!message || !isDiscordId(message.id)) throw new NotificationRoleApiError();
    return message.id;
  }

  async updatePanel(payload: unknown): Promise<void> {
    if (!this.config.panelMessageId) throw new NotificationRoleApiError();
    const path = `/channels/${this.config.channelId}/messages/${this.config.panelMessageId}`;
    const current = await this.request(path) as { author?: { id?: unknown }; application_id?: unknown };
    if (!current || current.author?.id !== this.config.applicationId) throw new NotificationRoleApiError();
    await this.request(path, "PATCH", payload);
  }
}
