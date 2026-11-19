import type { PartnerAlertResourceReceipt } from "./partner-alert-authority";
import type { PartnerAlertResourceVerificationTarget } from "./partner-alert-provider-verification";

export type PartnerAlertDiscordTransport = (url: string, init: RequestInit) => Promise<Response>;

export type PartnerAlertDiscordVerificationConfiguration = Readonly<{
  botToken: string;
  botUserId: string;
  messageContentIntentEnabled: true;
  maximumEvidenceAgeMs: number;
  nowUtc: () => string;
  transport: PartnerAlertDiscordTransport;
  /** Discord exposes no creator for unmanaged roles. This registry is the
   * separate server-owned proof that no Whop or other writer controls the role. */
  isDestinationRoleExclusive: (target: PartnerAlertResourceVerificationTarget) => boolean | Promise<boolean>;
}>;

type DiscordRole = Readonly<{ id: string; position: number; permissions: string; managed: boolean }>;
type DiscordOverwrite = Readonly<{ id: string; type: number; allow: string; deny: string }>;
type DiscordChannel = Readonly<{
  id: string; guild_id: string; type: number; permission_overwrites: readonly DiscordOverwrite[];
}>;
type DiscordMember = Readonly<{ roles: readonly string[]; user: Readonly<{ id: string }> }>;

const API = "https://discord.com/api/v10";
const SNOWFLAKE = /^[1-9][0-9]{0,19}$/u;
const DECIMAL = /^(0|[1-9][0-9]{0,19})$/u;
const MAX_PERMISSION = (BigInt(1) << BigInt(64)) - BigInt(1);
const bit = (position: number) => BigInt(1) << BigInt(position);
const ADMINISTRATOR = bit(3);
const ADD_REACTIONS = bit(6);
const VIEW_CHANNEL = bit(10);
const SEND_MESSAGES = bit(11);
const SEND_TTS_MESSAGES = bit(12);
const EMBED_LINKS = bit(14);
const ATTACH_FILES = bit(15);
const READ_MESSAGE_HISTORY = bit(16);
const MENTION_EVERYONE = bit(17);
const MANAGE_ROLES = bit(28);
const CREATE_PUBLIC_THREADS = bit(35);
const CREATE_PRIVATE_THREADS = bit(36);
const SEND_MESSAGES_IN_THREADS = bit(38);
const USE_EXTERNAL_SOUNDS = bit(45);
const SEND_VOICE_MESSAGES = bit(46);
const SUBSCRIBER_WRITES = ADD_REACTIONS | SEND_MESSAGES | SEND_TTS_MESSAGES | EMBED_LINKS | ATTACH_FILES
  | MENTION_EVERYONE | CREATE_PUBLIC_THREADS | CREATE_PRIVATE_THREADS | SEND_MESSAGES_IN_THREADS
  | USE_EXTERNAL_SOUNDS | SEND_VOICE_MESSAGES;

function unavailable(): Error {
  return new Error("Partner Channel Discord verification is unavailable.");
}

function snowflake(value: unknown): value is string {
  return typeof value === "string" && SNOWFLAKE.test(value)
    && (value.length < 20 || value <= "18446744073709551615");
}

function permissions(value: unknown): bigint {
  if (typeof value !== "string" || !DECIMAL.test(value)) throw unavailable();
  const parsed = BigInt(value);
  if (parsed > MAX_PERMISSION) throw unavailable();
  return parsed;
}

function parseRole(value: unknown): DiscordRole {
  if (!value || typeof value !== "object") throw unavailable();
  const role = value as Record<string, unknown>;
  if (!snowflake(role.id) || !Number.isSafeInteger(role.position) || Number(role.position) < 0
    || typeof role.managed !== "boolean") throw unavailable();
  permissions(role.permissions);
  return role as DiscordRole;
}

function parseMember(value: unknown, expectedUserId: string): DiscordMember {
  if (!value || typeof value !== "object") throw unavailable();
  const member = value as Record<string, unknown>; const user = member.user;
  if (!user || typeof user !== "object" || (user as Record<string, unknown>).id !== expectedUserId
    || !Array.isArray(member.roles) || !member.roles.every(snowflake)) throw unavailable();
  return member as DiscordMember;
}

function parseChannel(value: unknown, expectedGuildId: string, expectedChannelId: string): DiscordChannel {
  if (!value || typeof value !== "object") throw unavailable();
  const channel = value as Record<string, unknown>;
  if (channel.id !== expectedChannelId || channel.guild_id !== expectedGuildId || ![0, 5].includes(Number(channel.type))
    || !Array.isArray(channel.permission_overwrites)) throw unavailable();
  for (const value of channel.permission_overwrites) {
    if (!value || typeof value !== "object") throw unavailable();
    const overwrite = value as Record<string, unknown>;
    if (!snowflake(overwrite.id) || ![0, 1].includes(Number(overwrite.type))) throw unavailable();
    permissions(overwrite.allow); permissions(overwrite.deny);
  }
  return channel as DiscordChannel;
}

function guildPermissions(guildId: string, member: DiscordMember, roles: readonly DiscordRole[]): bigint {
  const roleIds = new Set(member.roles); let result = BigInt(0); let everyone = false;
  for (const role of roles) {
    if (role.id === guildId) { result |= permissions(role.permissions); everyone = true; }
    else if (roleIds.has(role.id)) result |= permissions(role.permissions);
  }
  if (!everyone || member.roles.some(roleId => !roles.some(role => role.id === roleId))) throw unavailable();
  return result;
}

function effectivePermissions(guildId: string, member: DiscordMember, roles: readonly DiscordRole[],
  channel: DiscordChannel): bigint {
  let result = guildPermissions(guildId, member, roles);
  if ((result & ADMINISTRATOR) !== BigInt(0)) return MAX_PERMISSION;
  const everyone = channel.permission_overwrites.find(value => value.type === 0 && value.id === guildId);
  if (everyone) result = (result & ~permissions(everyone.deny)) | permissions(everyone.allow);
  const roleIds = new Set(member.roles); let deny = BigInt(0); let allow = BigInt(0);
  for (const overwrite of channel.permission_overwrites) {
    if (overwrite.type === 0 && roleIds.has(overwrite.id)) {
      deny |= permissions(overwrite.deny); allow |= permissions(overwrite.allow);
    }
  }
  result = (result & ~deny) | allow;
  const memberOverwrite = channel.permission_overwrites.find(value => value.type === 1 && value.id === member.user.id);
  if (memberOverwrite) result = (result & ~permissions(memberOverwrite.deny)) | permissions(memberOverwrite.allow);
  return result;
}

function destinationIsPrivateAndReadOnly(channel: DiscordChannel, guildId: string, targetRoleId: string,
  botMember: DiscordMember): boolean {
  const everyone = channel.permission_overwrites.find(value => value.type === 0 && value.id === guildId);
  const target = channel.permission_overwrites.find(value => value.type === 0 && value.id === targetRoleId);
  if (!everyone || !target || (permissions(everyone.deny) & VIEW_CHANNEL) === BigInt(0)
    || (permissions(target.allow) & (VIEW_CHANNEL | READ_MESSAGE_HISTORY)) !== (VIEW_CHANNEL | READ_MESSAGE_HISTORY)
    || (permissions(target.deny) & SUBSCRIBER_WRITES) !== SUBSCRIBER_WRITES
    || (permissions(target.allow) & SUBSCRIBER_WRITES) !== BigInt(0)) return false;
  const botRoles = new Set(botMember.roles);
  return channel.permission_overwrites.every(overwrite => {
    if ((permissions(overwrite.allow) & VIEW_CHANNEL) === BigInt(0)) return true;
    if (overwrite.type === 0) return overwrite.id === targetRoleId || botRoles.has(overwrite.id);
    return overwrite.id === botMember.user.id;
  });
}

async function readJson(configuration: PartnerAlertDiscordVerificationConfiguration, path: string,
  signal: AbortSignal): Promise<unknown> {
  if (signal.aborted) throw new Error("Partner Channel Discord verification was cancelled.");
  const response = await configuration.transport(`${API}${path}`, Object.freeze({ method: "GET", redirect: "manual",
    cache: "no-store", signal, headers: Object.freeze({ authorization: `Bot ${configuration.botToken}`,
      accept: "application/json", "user-agent": "TradersLink Partner Channels/1.0" }) }));
  if (signal.aborted) throw new Error("Partner Channel Discord verification was cancelled.");
  const type = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  const length = response.headers.get("content-length");
  if (!response.ok || type !== "application/json" || (length !== null && (!/^\d+$/u.test(length) || Number(length) > 1_000_000))) {
    throw unavailable();
  }
  const text = await response.text();
  if (text.length > 1_000_000) throw unavailable();
  try { return JSON.parse(text) as unknown; } catch { throw unavailable(); }
}

/** Read-only exact Discord qualification. It never creates channels, roles,
 * messages or assignments and never follows redirects. */
export function createPartnerAlertDiscordResourceVerifier(configuration: PartnerAlertDiscordVerificationConfiguration) {
  if (!snowflake(configuration.botUserId) || typeof configuration.botToken !== "string"
    || configuration.botToken.length < 20 || configuration.botToken.length > 8192
    || /[\u0000-\u0020\u007f]/u.test(configuration.botToken)
    || configuration.messageContentIntentEnabled !== true || typeof configuration.nowUtc !== "function"
    || typeof configuration.transport !== "function" || typeof configuration.isDestinationRoleExclusive !== "function"
    || !Number.isSafeInteger(configuration.maximumEvidenceAgeMs) || configuration.maximumEvidenceAgeMs < 1
    || configuration.maximumEvidenceAgeMs > 300_000) throw unavailable();
  return async (target: PartnerAlertResourceVerificationTarget,
    signal: AbortSignal): Promise<PartnerAlertResourceReceipt> => {
    if (signal.aborted) throw new Error("Partner Channel Discord verification was cancelled.");
    if (!await configuration.isDestinationRoleExclusive(target) || signal.aborted) throw unavailable();
    // Keep credential use serial and stop before every later request on cancellation.
    const identityRaw = await readJson(configuration, "/users/@me", signal);
    const sourceMemberRaw = await readJson(configuration,
      `/guilds/${target.sourceGuildId}/members/${configuration.botUserId}`, signal);
    const sourceRolesRaw = await readJson(configuration, `/guilds/${target.sourceGuildId}/roles`, signal);
    const sourceChannelRaw = await readJson(configuration, `/channels/${target.sourceChannelId}`, signal);
    const destinationMemberRaw = await readJson(configuration,
      `/guilds/${target.destinationGuildId}/members/${configuration.botUserId}`, signal);
    const destinationRolesRaw = await readJson(configuration, `/guilds/${target.destinationGuildId}/roles`, signal);
    const destinationChannelRaw = await readJson(configuration, `/channels/${target.destinationChannelId}`, signal);
    const identity = identityRaw as Record<string, unknown>;
    if (!identity || identity.id !== configuration.botUserId || identity.bot !== true) throw unavailable();
    const sourceMember = parseMember(sourceMemberRaw, configuration.botUserId);
    const destinationMember = parseMember(destinationMemberRaw, configuration.botUserId);
    if (!Array.isArray(sourceRolesRaw) || !Array.isArray(destinationRolesRaw)) throw unavailable();
    const sourceRoles = sourceRolesRaw.map(parseRole); const destinationRoles = destinationRolesRaw.map(parseRole);
    const sourceChannel = parseChannel(sourceChannelRaw, target.sourceGuildId, target.sourceChannelId);
    const destinationChannel = parseChannel(destinationChannelRaw, target.destinationGuildId, target.destinationChannelId);
    const sourcePermissions = effectivePermissions(target.sourceGuildId, sourceMember, sourceRoles, sourceChannel);
    const destinationPermissions = effectivePermissions(target.destinationGuildId, destinationMember,
      destinationRoles, destinationChannel);
    const destinationRole = destinationRoles.find(role => role.id === target.destinationRoleId);
    const botHighest = destinationRoles.filter(role => destinationMember.roles.includes(role.id))
      .reduce((highest, role) => Math.max(highest, role.position), -1);
    const sourceReadable = (sourcePermissions & (VIEW_CHANNEL | READ_MESSAGE_HISTORY))
      === (VIEW_CHANNEL | READ_MESSAGE_HISTORY);
    const botCanWrite = (destinationPermissions & (VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY))
      === (VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY);
    const botCanManageRole = (guildPermissions(target.destinationGuildId, destinationMember, destinationRoles)
      & (MANAGE_ROLES | ADMINISTRATOR)) !== BigInt(0);
    if (!sourceReadable || !botCanWrite || !destinationRole || destinationRole.managed
      || permissions(destinationRole.permissions) !== BigInt(0) || botHighest <= destinationRole.position
      || !botCanManageRole || !destinationIsPrivateAndReadOnly(destinationChannel, target.destinationGuildId,
        target.destinationRoleId, destinationMember)) throw unavailable();
    const observedAtUtc = configuration.nowUtc(); const observed = Date.parse(observedAtUtc);
    if (!Number.isFinite(observed)) throw unavailable();
    return Object.freeze({ ...target, sourceTextChannel: true, sourceReadable: true,
      messageContentAvailable: true, destinationReadOnly: true, destinationPrivate: true,
      destinationRoleManageable: true, destinationRoleExclusiveToTradersLink: true,
      observedAtUtc, validUntilUtc: new Date(observed + configuration.maximumEvidenceAgeMs).toISOString() });
  };
}
