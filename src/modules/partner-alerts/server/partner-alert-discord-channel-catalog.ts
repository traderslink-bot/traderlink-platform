import type { PartnerAlertSubscriberRoleObserver } from "./partner-alert-subscriber-access";
import { partnerAlertSnowflake, partnerAlertText } from "../contracts/partner-alert-validation";

const API = "https://discord.com/api/v10";
const VIEW_CHANNEL = BigInt(1) << BigInt(10);
const READ_MESSAGE_HISTORY = BigInt(1) << BigInt(16);
const ADMINISTRATOR = BigInt(1) << BigInt(3);

export type PartnerAlertDiscordSourceChannel = Readonly<{ channelId: string; name: string }>;
export type PartnerAlertUnavailableDiscordSourceChannel = PartnerAlertDiscordSourceChannel & Readonly<{
  reason: "unsupported_type" | "missing_bot_permissions" | "permissions_unverified";
}>;
export type PartnerAlertDiscordSourceCatalog = Readonly<{
  guildName: string;
  channels: readonly PartnerAlertDiscordSourceChannel[];
  unavailableChannels: readonly PartnerAlertUnavailableDiscordSourceChannel[];
}>;
export type PartnerAlertDiscordChannelCatalogConfiguration = Readonly<{
  botToken: string; botUserId: string;
  maximumDurationMs: number;
  transport: (url: string, init: RequestInit) => Promise<Response>;
}>;

function unavailable(): Error { return new Error("Partner Channel source channels are unavailable."); }
export function cancelPartnerAlertDiscordBody(body: ReadableStream<Uint8Array> | null): void {
  if (!body) return;
  try { void body.cancel().catch(() => undefined); } catch { /* cancellation is best-effort after refusal */ }
}
function bits(value: unknown): bigint {
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]*)$/u.test(value)) throw unavailable();
  try { return BigInt(value); } catch { throw unavailable(); }
}
async function read(configuration: PartnerAlertDiscordChannelCatalogConfiguration, path: string, signal: AbortSignal) {
  if (signal.aborted) throw unavailable();
  const response = await configuration.transport(`${API}${path}`, { method: "GET", redirect: "manual",
    cache: "no-store", signal, headers: { authorization: `Bot ${configuration.botToken}`,
      accept: "application/json", "user-agent": "TradersLink Partner Channels/1.0" } });
  if (!response.ok) { cancelPartnerAlertDiscordBody(response.body); throw unavailable(); }
  return readPartnerAlertDiscordJson(response, signal);
}

export async function readPartnerAlertDiscordJson(response: Response, signal: AbortSignal): Promise<unknown> {
  const length = response.headers.get("content-length");
  if (response.headers.get("content-type")?.split(";", 1)[0]?.trim() !== "application/json"
    || (length !== null && (!/^\d+$/u.test(length) || Number(length) > 1_000_000))) {
    cancelPartnerAlertDiscordBody(response.body);
    throw unavailable();
  }
  if (!response.body) throw unavailable();
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0; let complete = false;
  try {
    while (true) {
      if (signal.aborted) throw unavailable();
      const next = await new Promise<ReadableStreamReadResult<Uint8Array>>((resolve, reject) => {
        const aborted = () => reject(unavailable());
        signal.addEventListener("abort", aborted, { once: true });
        reader.read().then(resolve, reject).finally(() => signal.removeEventListener("abort", aborted));
      });
      if (next.done) { complete = true; break; }
      size += next.value.byteLength;
      if (size > 1_000_000) throw unavailable();
      chunks.push(next.value);
    }
  } finally {
    if (!complete) { try { void reader.cancel().catch(() => undefined); } catch { /* best-effort */ } }
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw unavailable(); }
  try { return JSON.parse(text) as unknown; } catch { throw unavailable(); }
}
function overwrite(value: unknown) {
  if (!value || typeof value !== "object") throw unavailable();
  const row = value as Record<string, unknown>;
  if (row.type !== 0 && row.type !== 1) throw unavailable();
  return { id: partnerAlertSnowflake(row.id, "overwriteId"), type: row.type,
    allow: bits(row.allow), deny: bits(row.deny) };
}

export function validatePartnerAlertDiscordConfiguration(configuration: PartnerAlertDiscordChannelCatalogConfiguration): string {
  if (typeof configuration.botToken !== "string" || configuration.botToken.length < 20
    || configuration.botToken.length > 8192 || /[\u0000-\u0020\u007f]/u.test(configuration.botToken)
    || typeof configuration.transport !== "function" || !Number.isSafeInteger(configuration.maximumDurationMs)
    || configuration.maximumDurationMs < 100 || configuration.maximumDurationMs > 30_000) throw unavailable();
  return partnerAlertSnowflake(configuration.botUserId, "botUserId");
}

/** Read the current roles of the exact linked Discord member, using the configured bot. */
export function createPartnerAlertDiscordRoleObserver(
  configuration: PartnerAlertDiscordChannelCatalogConfiguration,
  nowUtc: () => string,
): PartnerAlertSubscriberRoleObserver {
  const botUserId = validatePartnerAlertDiscordConfiguration(configuration);
  return async (target, callerSignal) => {
    const deadline = AbortSignal.timeout(configuration.maximumDurationMs);
    const signal = callerSignal ? AbortSignal.any([callerSignal, deadline]) : deadline;
    try {
      const guildId = partnerAlertSnowflake(target.guildId, "destinationGuildId");
      const discordUserId = partnerAlertSnowflake(target.discordUserId, "discordUserId");
      const identity = await read(configuration, "/users/@me", signal) as Record<string, unknown>;
      if (identity.id !== botUserId || identity.bot !== true) return null;
      const member = await read(configuration, `/guilds/${guildId}/members/${discordUserId}`, signal) as Record<string, unknown>;
      const subject = member.user as Record<string, unknown> | undefined;
      if (subject?.id !== discordUserId || subject.bot === true || member.pending === true
        || !Array.isArray(member.roles) || member.roles.length > 250 || signal.aborted) return null;
      const roleIds = member.roles.map(value => partnerAlertSnowflake(value, "memberRoleId"));
      if (new Set(roleIds).size !== roleIds.length || roleIds.includes(guildId)) return null;
      const observedAtUtc = nowUtc();
      return Object.freeze({ guildId, discordUserId, roleIds: Object.freeze(roleIds), observedAtUtc,
        validUntilUtc: new Date(Date.parse(observedAtUtc) + 15_000).toISOString() });
    } catch { return null; }
  };
}

/** Lists selectable source channels and why other channels are unavailable.
 * Uses GET requests and keeps raw Discord role, member and permission data private. */
export function createPartnerAlertDiscordChannelCatalog(configuration: PartnerAlertDiscordChannelCatalogConfiguration) {
  const botUserId = validatePartnerAlertDiscordConfiguration(configuration);
  return async (guildIdInput: string, signal: AbortSignal): Promise<PartnerAlertDiscordSourceCatalog> => {
    const guildId = partnerAlertSnowflake(guildIdInput, "sourceGuildId");
    const controller = new AbortController();
    const abort = () => controller.abort(signal.reason);
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", abort, { once: true });
    const deadline = Date.now() + configuration.maximumDurationMs;
    const timer = setTimeout(() => controller.abort(new Error("Partner Channel Discord catalog timed out.")),
      configuration.maximumDurationMs);
    try {
    const identity = await read(configuration, "/users/@me", controller.signal) as Record<string, unknown>;
    if (identity.id !== botUserId || identity.bot !== true) throw unavailable();
    const member = await read(configuration, `/guilds/${guildId}/members/${botUserId}`, controller.signal) as Record<string, unknown>;
    const memberUser = member.user as Record<string, unknown> | undefined;
    if (memberUser?.id !== botUserId || !Array.isArray(member.roles)) throw unavailable();
    const memberRoleIds = member.roles.map(value => partnerAlertSnowflake(value, "memberRoleId"));
    if (new Set(memberRoleIds).size !== memberRoleIds.length) throw unavailable();
    const rolesRaw = await read(configuration, `/guilds/${guildId}/roles`, controller.signal);
    if (!Array.isArray(rolesRaw)) throw unavailable();
    const roles = rolesRaw.map(value => {
      if (!value || typeof value !== "object") throw unavailable();
      const row = value as Record<string, unknown>;
      return { id: partnerAlertSnowflake(row.id, "roleId"), permissions: bits(row.permissions) };
    });
    if (new Set(roles.map(role => role.id)).size !== roles.length || !roles.some(role => role.id === guildId)
      || memberRoleIds.some(id => !roles.some(role => role.id === id))) throw unavailable();
    const channelsRaw = await read(configuration, `/guilds/${guildId}/channels`, controller.signal);
    if (!Array.isArray(channelsRaw) || channelsRaw.length > 500) throw unavailable();
    const roleIds = new Set(memberRoleIds);
    roleIds.add(guildId);
    let base = BigInt(0);
    for (const role of roles) if (roleIds.has(role.id)) base |= role.permissions;
    const administrator = (base & ADMINISTRATOR) !== BigInt(0);
    const channels: PartnerAlertDiscordSourceChannel[] = [];
    const unavailableChannels: PartnerAlertUnavailableDiscordSourceChannel[] = [];
    const channelIds = new Set<string>();
    for (const value of channelsRaw) {
      if (!value || typeof value !== "object") throw unavailable();
      const row = value as Record<string, unknown>;
      if (row.guild_id !== guildId || !Number.isInteger(row.type) || row.type === 4) continue;
      const channelId = partnerAlertSnowflake(row.id, "channelId");
      if (channelIds.has(channelId)) throw unavailable();
      channelIds.add(channelId);
      const channel = { channelId, name: partnerAlertText(row.name, "channelName") };
      if (row.type !== 0 && row.type !== 5) {
        unavailableChannels.push(Object.freeze({ ...channel, reason: "unsupported_type" }));
        continue;
      }
      if (!Array.isArray(row.permission_overwrites)) {
        unavailableChannels.push(Object.freeze({ ...channel, reason: "permissions_unverified" }));
        continue;
      }
      let effective = base;
      const overwrites = row.permission_overwrites.map(overwrite);
      if (new Set(overwrites.map(item => `${String(item.type)}:${item.id}`)).size !== overwrites.length
        || overwrites.some(item => item.type !== 0 && item.type !== 1)
        || overwrites.some(item => item.type === 0 && !roles.some(role => role.id === item.id))) throw unavailable();
      const everyone = overwrites.find(item => item.type === 0 && item.id === guildId);
      if (everyone) effective = (effective & ~everyone.deny) | everyone.allow;
      let roleAllow = BigInt(0); let roleDeny = BigInt(0);
      for (const item of overwrites) if (item.type === 0 && roleIds.has(item.id) && item.id !== guildId) {
        roleAllow |= item.allow; roleDeny |= item.deny;
      }
      effective = (effective & ~roleDeny) | roleAllow;
      const memberOverwrite = overwrites.find(item => item.type === 1 && item.id === botUserId);
      if (memberOverwrite) effective = (effective & ~memberOverwrite.deny) | memberOverwrite.allow;
      if (!administrator && (effective & (VIEW_CHANNEL | READ_MESSAGE_HISTORY)) !== (VIEW_CHANNEL | READ_MESSAGE_HISTORY)) {
        unavailableChannels.push(Object.freeze({ ...channel, reason: "missing_bot_permissions" }));
      } else {
        channels.push(Object.freeze(channel));
      }
    }
    const compareChannels = (a: PartnerAlertDiscordSourceChannel, b: PartnerAlertDiscordSourceChannel) =>
      a.name.localeCompare(b.name) || a.channelId.localeCompare(b.channelId);
    if (controller.signal.aborted || Date.now() >= deadline) throw unavailable();
    const guild = await read(configuration, `/guilds/${guildId}`, controller.signal) as Record<string, unknown> | null;
    if (guild?.id !== guildId || controller.signal.aborted || Date.now() >= deadline) throw unavailable();
    return Object.freeze({ guildName: partnerAlertText(guild.name, "guildName"),
      channels: Object.freeze(channels.sort(compareChannels)),
      unavailableChannels: Object.freeze(unavailableChannels.sort(compareChannels)) });
    } finally {
      controller.abort(new Error("Partner Channel Discord catalog request ended."));
      clearTimeout(timer); signal.removeEventListener("abort", abort);
    }
  };
}
