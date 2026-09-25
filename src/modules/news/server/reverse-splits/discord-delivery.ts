import "server-only";
import { record } from "./contracts";
import type { ReverseSplitConfiguration } from "./configuration";
import { ReverseSplitDiscordOutbox, type SplitDeliveryClaim, type SplitDeliveryResult } from "./discord-outbox";

type DiscordTarget = NonNullable<ReverseSplitConfiguration["discord"]>;
type DiscordResponse = Readonly<{ status: number; body: unknown }>;
const validId = (id: unknown): id is string => typeof id === "string" && /^\d{1,32}$/u.test(id);

async function request(target: DiscordTarget, path: string, fetcher: typeof fetch, payload?: unknown): Promise<DiscordResponse> {
  const response = await fetcher(`https://discord.com/api/v10${path}`, {
    method: payload === undefined ? "GET" : "POST", redirect: "error", cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Bot ${target.botToken}`, "Content-Type": "application/json" },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  const reader = response.body?.getReader();
  if (!reader) throw new Error("reverse_split_discord_response_empty");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      bytes += result.value.byteLength;
      if (bytes > 500_000) throw new Error("reverse_split_discord_response_large");
      chunks.push(result.value);
    }
  } finally { await reader.cancel().catch(() => undefined); }
  let body: unknown = null;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { body = null; }
  return { status: response.status, body };
}

export class ReverseSplitDiscordDelivery {
  constructor(
    private readonly outbox: ReverseSplitDiscordOutbox,
    private readonly target: DiscordTarget,
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => Date = () => new Date(),
  ) {
    if (!validId(target.channelId) || !validId(target.guildId)) throw new Error("reverse_split_discord_target_invalid");
  }

  private async reconcile(claim: SplitDeliveryClaim, botId: string): Promise<SplitDeliveryResult> {
    const response = await request(this.target, `/channels/${this.target.channelId}/messages?limit=100`, this.fetcher);
    if (response.status !== 200 || !Array.isArray(response.body)) return {
      state: "uncertain", code: "discord_receipt_lookup_failed", retryAfterMs: 15 * 60_000,
    };
    const matches = response.body.map(record).filter((message) => message?.content === claim.content &&
      record(message.author)?.id === botId && message.channel_id === this.target.channelId && validId(message.id));
    if (matches.length === 1) return { state: "delivered", messageId: String(matches[0]!.id) };
    const tooOld = claim.firstAttemptAt && this.now().getTime() - Date.parse(claim.firstAttemptAt) >= 24 * 60 * 60_000;
    return { state: tooOld || matches.length > 1 ? "failed" : "uncertain",
      code: matches.length > 1 ? "discord_multiple_receipts" : "discord_receipt_unconfirmed", retryAfterMs: 15 * 60_000 };
  }

  async runOne(): Promise<Readonly<{ processed: boolean; state?: string; code?: string }>> {
    const claim = this.outbox.claim(this.target.channelId, this.now().toISOString());
    if (!claim) return { processed: false };
    let attempted = claim.reconcileOnly;
    let result: SplitDeliveryResult;
    try {
      const channelResponse = await request(this.target, `/channels/${this.target.channelId}`, this.fetcher);
      const channel = record(channelResponse.body);
      const botResponse = await request(this.target, "/users/@me", this.fetcher);
      const bot = record(botResponse.body);
      if (channelResponse.status !== 200 || botResponse.status !== 200) {
        result = { state: attempted ? "uncertain" : "pending", code: "discord_target_check_failed", retryAfterMs: 15 * 60_000 };
      } else if (channel?.id !== this.target.channelId || channel.guild_id !== this.target.guildId ||
        ![0, 5].includes(Number(channel.type)) || bot?.bot !== true || !validId(bot.id)) {
        result = { state: "failed", code: "discord_target_mismatch" };
      } else if (claim.reconcileOnly) {
        result = await this.reconcile(claim, bot.id);
      } else if (!this.outbox.beginAttempt(claim, this.now().toISOString())) {
        result = { state: "failed", code: "discord_send_window_expired" };
      } else {
        attempted = true;
        const response = await request(this.target, `/channels/${this.target.channelId}/messages`, this.fetcher, {
          content: claim.content, allowed_mentions: { parse: [] }, nonce: claim.id.slice(0, 24), enforce_nonce: true,
        });
        const message = record(response.body);
        if (response.status === 200 && message?.channel_id === this.target.channelId && validId(message.id) &&
          record(message.author)?.id === bot.id && message.content === claim.content) {
          result = { state: "delivered", messageId: message.id };
        } else if (response.status === 429) {
          const retryAfter = Number(message?.retry_after);
          result = { state: "pending", code: "discord_rate_limited", retryAfterMs: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 60_000 };
        } else if ([400, 401, 403, 404, 405, 413].includes(response.status)) {
          result = { state: "failed", code: `discord_rejected_${response.status}` };
        } else {
          result = { state: "uncertain", code: "discord_send_unconfirmed" };
        }
      }
    } catch {
      result = { state: attempted ? "uncertain" : "pending", code: attempted ? "discord_send_unconfirmed" : "discord_preflight_unavailable" };
    }
    const saved = this.outbox.complete(claim, result, this.now().toISOString());
    return { processed: true, state: saved ? result.state : "uncertain", code: saved ? result.code : "discord_delivery_lease_expired" };
  }
}
