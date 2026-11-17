import { PlatformPremiumError, premiumInteger, premiumRef, premiumSnowflake } from "../../contracts/platform-premium-access";
import type { PlatformPremiumRoleOutcome, PlatformPremiumRoleTarget } from "./platform-premium-role-repository";

export type PlatformPremiumDiscordResponse = Readonly<{ status: number; body: unknown }>;
/** Actual credential-bearing HTTP adapter is deliberately absent. It must enforce
 * fixed Discord origin, bounded response bytes/time, no redirects and no secrets in logs. */
export interface PlatformPremiumDiscordRest {
  request(input: Readonly<{ method: "GET" | "PUT" | "DELETE"; path: string; auditReason?: string }>): Promise<PlatformPremiumDiscordResponse>;
}
export type PlatformPremiumDiscordConfiguration = Readonly<{
  enabled: boolean;
  /** Independent explicit runtime clearance for member-list reads; defaults off. */
  censusReadEnabled?: boolean;
  guildId: string;
  botUserId: string;
  paidRoleId: string;
  /** Approved configured-role preimage; a changed permission mask requires requalification. */
  expectedGuildPermissions: string;
  complimentaryRoleId: string | null;
  forbiddenRoleIds: readonly string[];
  ordinaryChannelIds: readonly string[];
}>;
export type PlatformPremiumDiscordMemberPage = Readonly<{
  kind: "page"; roleHolderIds: readonly string[]; scannedCount: number; nextCursor: string | null; exhausted: boolean;
}> | Readonly<{ kind: "disabled" }>
  | Readonly<{ kind: "retry"; delayMs: number }>
  | Readonly<{ kind: "held"; reason: "permission" | "shape" | "rate_limit_unqualified" }>;
type Role = Readonly<{ id: string; position: number; permissions: string; managed: boolean }>;
class DiscordStop extends Error {
  constructor(readonly outcome: PlatformPremiumRoleOutcome) { super("Premium Discord role needs verification."); }
}
function record(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new PlatformPremiumError("invalid");
  return raw as Record<string, unknown>;
}
function bits(raw: unknown): bigint {
  if (typeof raw !== "string" || !/^(0|[1-9][0-9]{0,29})$/u.test(raw)) throw new PlatformPremiumError("invalid");
  return BigInt(raw);
}

/** Dedicated ordinary PAID role only; never widens the notification-role API.
 * No role creation/editing, member-list replacement, kick, message or token loading. */
export class PlatformPremiumDiscordClient {
  private readonly configuration: PlatformPremiumDiscordConfiguration;
  constructor(private readonly rest: PlatformPremiumDiscordRest, configuration: PlatformPremiumDiscordConfiguration) {
    [configuration.guildId, configuration.botUserId, configuration.paidRoleId].forEach(premiumSnowflake);
    if (configuration.complimentaryRoleId !== null) premiumSnowflake(configuration.complimentaryRoleId);
    if (!Array.isArray(configuration.forbiddenRoleIds) || configuration.forbiddenRoleIds.length > 250
      || !Array.isArray(configuration.ordinaryChannelIds) || configuration.ordinaryChannelIds.length < 1
      || configuration.ordinaryChannelIds.length > 500) throw new PlatformPremiumError("invalid");
    configuration.forbiddenRoleIds.forEach(premiumSnowflake); configuration.ordinaryChannelIds.forEach(premiumSnowflake);
    bits(configuration.expectedGuildPermissions);
    if (configuration.paidRoleId === configuration.guildId || configuration.paidRoleId === configuration.complimentaryRoleId
      || configuration.forbiddenRoleIds.includes(configuration.paidRoleId)) throw new PlatformPremiumError("invalid");
    this.configuration = Object.freeze({ ...configuration, forbiddenRoleIds: Object.freeze([...configuration.forbiddenRoleIds]),
      ordinaryChannelIds: Object.freeze([...new Set(configuration.ordinaryChannelIds)]) });
  }
  private async request(method: "GET" | "PUT" | "DELETE", path: string, auditReason?: string): Promise<PlatformPremiumDiscordResponse> {
    const response = await this.rest.request({ method, path, ...(auditReason ? { auditReason } : {}) });
    if (response.status === 429) {
      let delay: number | null = null;
      try {
        const retry = record(response.body).retry_after;
        if (typeof retry === "number" && Number.isFinite(retry) && retry >= 0 && retry <= 86_400) delay = Math.max(1000, Math.ceil(retry * 1000));
      } catch { /* Unqualified retry timing requires operator attention. */ }
      if (delay === null) throw new DiscordStop({ kind: "rejected", reason: "rate_limit_unqualified" });
      throw new DiscordStop({ kind: "retry", reason: "rate_limited", delayMs: delay });
    }
    if (response.status === 401 || response.status === 403) throw new DiscordStop({ kind: "rejected", reason: "permission" });
    return response;
  }
  private async get(path: string): Promise<unknown> {
    const response = await this.request("GET", path);
    if (response.status !== 200) throw new DiscordStop({ kind: "retry", reason: "temporary", delayMs: 5000 });
    return response.body;
  }
  private async verifySetup(): Promise<void> {
    const c = this.configuration;
    const bot = record(await this.get("/users/@me"));
    if (bot.id !== c.botUserId || bot.bot !== true) throw new PlatformPremiumError("invalid");
    const rawRoles = await this.get(`/guilds/${c.guildId}/roles`);
    if (!Array.isArray(rawRoles) || rawRoles.length > 250) throw new PlatformPremiumError("invalid");
    const roles: Role[] = rawRoles.map(raw => {
      const role = record(raw); const id = premiumSnowflake(role.id as string); bits(role.permissions);
      if (typeof role.managed !== "boolean") throw new PlatformPremiumError("invalid");
      return { id, permissions: role.permissions as string, managed: role.managed, position: premiumInteger(role.position as number, 0, 1000) };
    });
    if (new Set(roles.map(role => role.id)).size !== roles.length) throw new PlatformPremiumError("invalid");
    const me = record(await this.get(`/guilds/${c.guildId}/members/${c.botUserId}`));
    if (record(me.user).id !== c.botUserId || !Array.isArray(me.roles) || me.roles.length > 250) throw new PlatformPremiumError("invalid");
    me.roles.forEach(id => premiumSnowflake(id as string));
    if (me.roles.some(id => !roles.some(role => role.id === id))) throw new PlatformPremiumError("invalid");
    const owned = roles.filter(role => role.id === c.guildId || (me.roles as unknown[]).includes(role.id));
    const permissions = owned.reduce((value, role) => value | bits(role.permissions), BigInt(0));
    const highest = owned.filter(role => role.id !== c.guildId).sort((a, b) => b.position - a.position)[0];
    const target = roles.find(role => role.id === c.paidRoleId);
    // Equal positions are rejected conservatively; no snowflake tie assumption.
    if (!highest || !target || target.managed || target.position >= highest.position
      || target.permissions !== c.expectedGuildPermissions || !(permissions & ((BigInt(1) << BigInt(28)) | BigInt(8)))) {
      throw new DiscordStop({ kind: "rejected", reason: "permission" });
    }
    const elevated = [1, 2, 3, 4, 5, 7, 22, 23, 24, 27, 28, 29, 30, 34, 40, 41, 51, 52]
      .reduce((value, bit) => value | (BigInt(1) << BigInt(bit)), BigInt(0));
    if (bits(target.permissions) & elevated) throw new DiscordStop({ kind: "rejected", reason: "permission" });
    const channels = await this.get(`/guilds/${c.guildId}/channels`);
    if (!Array.isArray(channels) || channels.length > 500) throw new PlatformPremiumError("invalid");
    const found = new Set<string>();
    for (const raw of channels) {
      const channel = record(raw); const id = premiumSnowflake(channel.id as string);
      if (channel.guild_id !== c.guildId || found.has(id)) throw new PlatformPremiumError("invalid"); found.add(id);
      if (!Array.isArray(channel.permission_overwrites)) throw new PlatformPremiumError("invalid");
      for (const item of channel.permission_overwrites) {
        const overwrite = record(item); premiumSnowflake(overwrite.id as string); bits(overwrite.deny);
        const allow = bits(overwrite.allow);
        if (overwrite.id === c.paidRoleId && overwrite.type === 0
          && ((allow & elevated) || ((allow & BigInt(1024)) && !c.ordinaryChannelIds.includes(id)))) {
          throw new DiscordStop({ kind: "rejected", reason: "permission" });
        }
      }
    }
    if (c.ordinaryChannelIds.some(id => !found.has(id))) throw new DiscordStop({ kind: "rejected", reason: "permission" });
  }
  /** GET-only full guild pagination filtered AFTER reading each native page.
   * Do not use the notification directory, which filters out untagged holders.
   * This method needs Discord's GUILD_MEMBERS privileged intent; it never enables
   * that intent or treats a denied/partial read as an empty completed census. */
  async readPaidRoleMembersPage(input: Readonly<{ after: string | null; maximum: number }>): Promise<PlatformPremiumDiscordMemberPage> {
    const c = this.configuration;
    if (c.enabled !== true || c.censusReadEnabled !== true) return { kind: "disabled" };
    try {
      const maximum = premiumInteger(input.maximum, 1, 1000);
      if (input.after !== null) premiumSnowflake(input.after);
      const bot = record(await this.get("/users/@me"));
      if (bot.id !== c.botUserId || bot.bot !== true) throw new PlatformPremiumError("invalid");
      const roles = await this.get(`/guilds/${c.guildId}/roles`);
      if (!Array.isArray(roles) || roles.length > 250) throw new PlatformPremiumError("invalid");
      const paid = roles.map(record).filter(role => role.id === c.paidRoleId);
      if (!roles.some(role => record(role).id === c.guildId) || paid.length !== 1
        || paid[0]!.permissions !== c.expectedGuildPermissions || paid[0]!.managed !== false) {
        return { kind: "held", reason: "permission" };
      }
      const raw = await this.get(`/guilds/${c.guildId}/members?limit=${maximum}${input.after ? `&after=${input.after}` : ""}`);
      if (!Array.isArray(raw) || raw.length > maximum) throw new PlatformPremiumError("invalid");
      const holders: string[] = []; const seen = new Set<string>();
      let highest = input.after;
      for (const item of raw) {
        const member = record(item); const id = premiumSnowflake(record(member.user).id as string);
        if (seen.has(id) || (input.after !== null && BigInt(id) <= BigInt(input.after))
          || !Array.isArray(member.roles) || member.roles.length > 250) throw new PlatformPremiumError("invalid");
        seen.add(id); member.roles.forEach(role => premiumSnowflake(role as string));
        if (member.roles.includes(c.paidRoleId)) holders.push(id);
        if (highest === null || BigInt(id) > BigInt(highest)) highest = id;
      }
      const exhausted = raw.length < maximum;
      if (!exhausted && highest === input.after) throw new PlatformPremiumError("invalid");
      return Object.freeze({ kind: "page", roleHolderIds: Object.freeze(holders), scannedCount: raw.length,
        exhausted, nextCursor: exhausted ? null : highest });
    } catch (error) {
      if (error instanceof DiscordStop) {
        if (error.outcome.kind === "retry") return { kind: "retry", delayMs: error.outcome.delayMs };
        if (error.outcome.kind === "rejected") return { kind: "held", reason: error.outcome.reason };
      }
      return error instanceof PlatformPremiumError ? { kind: "held", reason: "shape" } : { kind: "retry", delayMs: 5000 };
    }
  }
  async setRole(target: PlatformPremiumRoleTarget, present: boolean, operationRef: string,
    stillCurrent: () => boolean): Promise<PlatformPremiumRoleOutcome> {
    if (this.configuration.enabled !== true) return { kind: "not_written", reason: "disabled" };
    let attempted = false;
    try {
      premiumRef(target.authorityKey); premiumSnowflake(target.discordUserId); premiumRef(operationRef);
      if (target.guildId !== this.configuration.guildId || target.roleId !== this.configuration.paidRoleId
        || typeof present !== "boolean") throw new PlatformPremiumError("invalid");
      await this.verifySetup();
      if (!stillCurrent()) return { kind: "not_written", reason: "authority_changed" };
      attempted = true;
      const path = `/guilds/${target.guildId}/members/${target.discordUserId}/roles/${target.roleId}`;
      const response = await this.request(present ? "PUT" : "DELETE", path, `Premium reconciliation ${operationRef}`);
      if (response.status === 404) {
        const body = record(response.body);
        // Discord Unknown Member specifically confirms absence; Unknown Role/Guild does not.
        if (body.code === 10007) return present ? { kind: "not_written", reason: "member_absent" }
          : { kind: "confirmed", target, present: false };
        return { kind: "rejected", reason: "permission" };
      }
      if (response.status !== 204) return { kind: "uncertain" };
      return { kind: "confirmed", target, present };
    } catch (error) {
      if (error instanceof DiscordStop) return error.outcome;
      return attempted ? { kind: "uncertain" } : { kind: "retry", reason: "temporary", delayMs: 5000 };
    }
  }
}
