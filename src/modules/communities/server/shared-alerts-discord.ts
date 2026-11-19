import { isCommunityReviewDiscordGuild } from "./community-review-discord-guild";
import type { SharedAlertChannel } from "../contracts/shared-alerts-contracts";
import { SharedAlertError } from "./shared-alerts-errors";
import { createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";
import type Database from "better-sqlite3";
import {assertCommunityStagingQaSharedTarget,type CommunityStagingQaCapability} from "./community-staging-qa-capability";

type Overwrite = { id: string; type: number; allow: string; deny: string };
type Channel = { id: string; guild_id?: string; name: string; type: number; permission_overwrites?: Overwrite[] };
type Role = { id: string; permissions: string };
type Member = { roles: string[]; communication_disabled_until?: string | null };
export type VerifiedSharedAlertChannel = SharedAlertChannel & Readonly<{ guildId: string; verifiedAtUtc: string }>;
const SNOWFLAKE = /^[0-9]{1,32}$/u;
const VIEW = BigInt(1024), SEND = BigInt(2048), HISTORY = BigInt(65536), ADMIN = BigInt(8);

/** Read-only verification. Message sending belongs exclusively to the gated worker. */
export class SharedAlertsDiscord {
  private botId: string | undefined;
  constructor(private readonly token: string, private readonly request: typeof fetch = fetch, private readonly now: () => string = createCanonicalUtcTimestamp,private readonly staging?:Readonly<{database:Database.Database;capability:CommunityStagingQaCapability}>) {}

  private allowed(guildId:string,channelId?:string):void{
    if(this.staging){try{assertCommunityStagingQaSharedTarget(this.staging.capability,this.staging.database,guildId,channelId);return;}catch{throw new SharedAlertError("unavailable");}}
    if(!isCommunityReviewDiscordGuild(guildId))throw new SharedAlertError("unavailable");
  }

  private async get<T>(path: string): Promise<T> {
    if (!this.token) throw new SharedAlertError("discord_unavailable");
    try {
      const response = await this.request(`https://discord.com/api/v10${path}`, {
        headers: { Authorization: `Bot ${this.token}` }, cache: "no-store", signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new SharedAlertError("discord_unavailable");
      return await response.json() as T;
    } catch { throw new SharedAlertError("discord_unavailable"); }
  }

  async verifyOwner(guildId: string, discordUserId: string): Promise<boolean> {
    this.allowed(guildId);
    if (!SNOWFLAKE.test(guildId) || !SNOWFLAKE.test(discordUserId)) throw new SharedAlertError("invalid");
    const guild = await this.get<{ id: string; owner_id: string }>(`/guilds/${guildId}`);
    if (guild.id !== guildId) throw new SharedAlertError("discord_unavailable");
    return guild.owner_id === discordUserId;
  }

  async channels(guildId: string): Promise<readonly SharedAlertChannel[]> {
    this.allowed(guildId);
    if (!SNOWFLAKE.test(guildId)) throw new SharedAlertError("invalid");
    if (!this.botId) this.botId = (await this.get<{ id: string }>("/users/@me")).id;
    const botId = this.botId;
    if (!SNOWFLAKE.test(botId)) throw new SharedAlertError("discord_unavailable");
    const [channels, roles, member] = await Promise.all([
      this.get<Channel[]>(`/guilds/${guildId}/channels`),
      this.get<Role[]>(`/guilds/${guildId}/roles`),
      this.get<Member>(`/guilds/${guildId}/members/${botId}`),
    ]);
    if (!Array.isArray(channels) || !Array.isArray(roles) || !Array.isArray(member.roles)) throw new SharedAlertError("discord_unavailable");
    if (member.communication_disabled_until && Date.parse(member.communication_disabled_until) > Date.parse(this.now())) return [];
    const roleIds = new Set([guildId, ...member.roles]);
    let base = BigInt(0);
    for (const role of roles) if (roleIds.has(role.id)) base |= BigInt(role.permissions);
    return channels.filter(channel => {
      if (![0, 5].includes(channel.type) || !SNOWFLAKE.test(channel.id) || (channel.guild_id && channel.guild_id !== guildId)) return false;
      if ((base & ADMIN) !== BigInt(0)) return true;
      let permissions = base;
      const overwrites = channel.permission_overwrites ?? [];
      const everyone = overwrites.find(item => item.id === guildId && item.type === 0);
      if (everyone) permissions = (permissions & ~BigInt(everyone.deny)) | BigInt(everyone.allow);
      let deny = BigInt(0), allow = BigInt(0);
      for (const item of overwrites) if (item.type === 0 && item.id !== guildId && roleIds.has(item.id)) { deny |= BigInt(item.deny); allow |= BigInt(item.allow); }
      permissions = (permissions & ~deny) | allow;
      const own = overwrites.find(item => item.id === botId && item.type === 1);
      if (own) permissions = (permissions & ~BigInt(own.deny)) | BigInt(own.allow);
      return (permissions & (VIEW | SEND | HISTORY)) === (VIEW | SEND | HISTORY);
    }).map(channel => ({ channelId: channel.id, name: channel.name.slice(0, 100) })).sort((a, b) => a.name.localeCompare(b.name));
  }

  async verifyChannel(guildId: string, channelId: string): Promise<VerifiedSharedAlertChannel> {
    this.allowed(guildId,channelId);
    const channel = (await this.channels(guildId)).find(item => item.channelId === channelId);
    if (!channel) throw new SharedAlertError("channel_unavailable");
    return { ...channel, guildId, verifiedAtUtc: this.now() };
  }
}
