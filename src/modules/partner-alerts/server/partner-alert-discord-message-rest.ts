import { partnerAlertRecord, partnerAlertSnowflake } from "../contracts/partner-alert-validation";
import { cancelPartnerAlertDiscordBody, readPartnerAlertDiscordJson, validatePartnerAlertDiscordConfiguration,
  type PartnerAlertDiscordChannelCatalogConfiguration } from "./partner-alert-discord-channel-catalog";
import type { PartnerAlertDiscordDeliveryTransport, PartnerAlertDiscordWriteOutcome } from "./partner-alert-delivery-worker";
import type { PartnerAlertHydratedMessage } from "./partner-alert-ingress-service";
import type { PartnerAlertResourceVerificationTarget } from "./partner-alert-provider-verification";

const api = "https://discord.com/api/v10";
const temporary = { kind: "retry", delayMs: 5_000, reason: "temporary" } as const;
const uncertain = { kind: "uncertain" } as const;
const permission = { kind: "rejected", reason: "permission_required" } as const;
const missing = { kind: "rejected", reason: "destination_missing" } as const;
const invalidContent = { kind: "rejected", reason: "content_rejected" } as const;
const paused = { kind: "not_written", reason: "publishing_paused" } as const;

type Scope = Readonly<{
  canReadSource: (guildId: string, channelId: string) => boolean;
  readDestination: (mappingId: string, channelId: string, action: "create" | "edit" | "delete") => PartnerAlertResourceVerificationTarget | null;
  verifyPrivateDestination: (target: PartnerAlertResourceVerificationTarget, signal: AbortSignal) => Promise<void>;
}>;

/** The bot can read only registered sources and mutate only the exact approved
 * destination. A Discord write has an unknown outcome until a scoped receipt
 * confirms it, including when the connection fails after sending the request. */
export function createPartnerAlertDiscordMessageRest(
  configuration: PartnerAlertDiscordChannelCatalogConfiguration,
  scope: Scope,
): PartnerAlertDiscordDeliveryTransport & Readonly<{
  hydrate: (guildId: string, channelId: string, messageId: string, stillCurrent: () => boolean) => Promise<PartnerAlertHydratedMessage>;
}> {
  const botUserId = validatePartnerAlertDiscordConfiguration(configuration);
  const deadline = () => AbortSignal.timeout(configuration.maximumDurationMs);
  const messagePath = (channel: string, id?: string) => `/channels/${partnerAlertSnowflake(channel, "channelId")}/messages`
    + (id === undefined ? "" : `/${partnerAlertSnowflake(id, "messageId")}`);
  const request = (method: "GET" | "POST" | "PATCH" | "DELETE", path: string, signal: AbortSignal, body?: string) =>
    configuration.transport(`${api}${path}`, { method, signal, redirect: "manual", cache: "no-store", body,
      headers: { authorization: `Bot ${configuration.botToken}`, accept: "application/json",
        "user-agent": "TradersLink Partner Channels/1.0", ...(body ? { "content-type": "application/json" } : {}) } });

  async function failure(response: Response, signal: AbortSignal, sent: boolean): Promise<PartnerAlertDiscordWriteOutcome> {
    if (response.status === 429) {
      const seconds = Number(response.headers.get("retry-after"));
      let bodySeconds = 0;
      try {
        const body = partnerAlertRecord(await readPartnerAlertDiscordJson(response, signal), "discordRateLimit");
        if (typeof body.retry_after === "number") bodySeconds = body.retry_after;
      } catch { /* A valid Retry-After header can still determine the wait. */ }
      const delayMs = Math.ceil(Math.max(seconds, bodySeconds) * 1_000);
      return Number.isSafeInteger(delayMs) && delayMs > 0 && delayMs <= 86_400_000
        ? { kind: "retry", delayMs: Math.max(1_000, delayMs), reason: "rate_limited" } : uncertain;
    }
    cancelPartnerAlertDiscordBody(response.body);
    if (response.status === 401 || response.status === 403) return permission;
    if (response.status === 400) return invalidContent;
    return sent ? uncertain : temporary;
  }

  async function deletedMessage(response: Response, signal: AbortSignal): Promise<boolean> {
    if (response.status !== 404) return false;
    const body = partnerAlertRecord(await readPartnerAlertDiscordJson(response, signal), "discordMissingMessage");
    return body.code === 10008;
  }

  function ownMessage(raw: unknown, channelId: string, expectedId?: string, nonce?: string): string | null {
    const data = partnerAlertRecord(raw, "discordMessage");
    if (data.channel_id !== channelId || (expectedId !== undefined && data.id !== expectedId)
      || (nonce !== undefined && data.nonce !== undefined && data.nonce !== nonce)
      || data.webhook_id != null || partnerAlertRecord(data.author, "discordAuthor").id !== botUserId) return null;
    return partnerAlertSnowflake(data.id, "messageId");
  }

  async function write(input: Readonly<{ mappingId: string; channelId: string; stillCurrent: () => boolean }>,
    method: "POST" | "PATCH" | "DELETE", id?: string, body?: string, nonce?: string): Promise<PartnerAlertDiscordWriteOutcome> {
    let sent = false;
    try {
      const action = method === "POST" ? "create" : method === "PATCH" ? "edit" : "delete";
      const initial = scope.readDestination(input.mappingId, input.channelId, action);
      if (!initial || initial.destinationChannelId !== input.channelId || !input.stillCurrent()) return paused;
      const path = messagePath(input.channelId, id);
      const signal = deadline();
      const confirmed = (messageId: string): PartnerAlertDiscordWriteOutcome =>
        ({ kind: "confirmed", channelId: input.channelId, messageId });
      const current = () => !signal.aborted && input.stillCurrent()
        && JSON.stringify(scope.readDestination(input.mappingId, input.channelId, action)) === JSON.stringify(initial);
      if (id !== undefined) {
        const before = await request("GET", path, signal);
        if (before.status === 404) {
          const gone = await deletedMessage(before, signal);
          if (!current()) return paused;
          return method === "DELETE" && gone ? confirmed(id) : missing;
        }
        if (before.status !== 200) return failure(before, signal, false);
        if (ownMessage(await readPartnerAlertDiscordJson(before, signal), input.channelId, id) !== id) return permission;
      }
      // Recheck after the awaited ownership read and immediately before Discord I/O.
      if (!current()) return paused;
      sent = true;
      const response = await request(method, path, signal, body);
      if (signal.aborted) { cancelPartnerAlertDiscordBody(response.body); return uncertain; }
      if (method === "DELETE" && id !== undefined) {
        if (response.status === 204 || (response.status === 404 && await deletedMessage(response, signal))) return confirmed(id);
        if (response.status === 404) return missing;
      } else if (response.status === 200) {
        const created = ownMessage(await readPartnerAlertDiscordJson(response, signal), input.channelId, id, nonce);
        return created ? confirmed(created) : uncertain;
      }
      return failure(response, signal, true);
    } catch { return sent ? uncertain : temporary; }
  }

  function payload(content: string, suppressMentions: boolean, nonce?: string) {
    if (!content || content.length > 2000 || suppressMentions !== true
      || (nonce !== undefined && !/^[a-f0-9]{25}$/u.test(nonce))) return null;
    return JSON.stringify({ content, allowed_mentions: { parse: [] }, flags: 4,
      ...(nonce ? { nonce, enforce_nonce: true } : {}) });
  }

  return {
    async hydrate(guildId, channelId, messageId, stillCurrent) {
      try {
        if (!scope.canReadSource(guildId, channelId) || !stillCurrent()) return { kind: "unavailable" };
        const signal = deadline();
        const response = await request("GET", messagePath(channelId, messageId), signal);
        if (response.status === 200) {
          const message = await readPartnerAlertDiscordJson(response, signal);
          return stillCurrent() && scope.canReadSource(guildId, channelId) ? { kind: "found", message } : { kind: "unavailable" };
        }
        if (response.status === 404 && await deletedMessage(response, signal) && stillCurrent()
          && scope.canReadSource(guildId, channelId)) return { kind: "deleted" };
        cancelPartnerAlertDiscordBody(response.body);
      } catch { /* Discord did not provide a verified current source. */ }
      return { kind: "unavailable" };
    },
    async verifyDestination(mappingId, channelId, action) {
      const initial = scope.readDestination(mappingId, channelId, action);
      if (!initial || initial.destinationChannelId !== channelId) return false;
      const signal = deadline();
      if (action === "delete") {
        const response = await request("GET", `/channels/${partnerAlertSnowflake(channelId, "channelId")}`, signal);
        if (response.status === 403 || response.status === 404) { cancelPartnerAlertDiscordBody(response.body); return false; }
        if (response.status !== 200) {
          cancelPartnerAlertDiscordBody(response.body);
          throw new Error("Discord destination verification unavailable.");
        }
        const data = partnerAlertRecord(await readPartnerAlertDiscordJson(response, signal), "discordChannel");
        if (data.id !== channelId || data.guild_id !== initial.destinationGuildId || data.type !== 0) return false;
      } else {
        await scope.verifyPrivateDestination(initial, signal);
      }
      return !signal.aborted && JSON.stringify(scope.readDestination(mappingId, channelId, action)) === JSON.stringify(initial);
    },
    async create(input) {
      const body = payload(input.content, input.suppressMentions, input.nonce);
      return body ? write(input, "POST", undefined, body, input.nonce) : invalidContent;
    },
    async edit(input) {
      const body = payload(input.content, input.suppressMentions);
      return body ? write(input, "PATCH", input.messageId, body) : invalidContent;
    },
    delete(input) { return write(input, "DELETE", input.messageId); },
  };
}
