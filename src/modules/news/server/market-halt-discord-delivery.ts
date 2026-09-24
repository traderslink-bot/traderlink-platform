import "server-only";

import { createHash } from "node:crypto";
import type { MarketHaltDiscordConfiguration } from "./market-halt-discord-configuration";
import {
  MarketHaltDiscordRepository,
  type ClaimedHaltDiscordDelivery,
  type HaltDiscordDeliveryResult,
} from "./market-halt-discord-repository";

const DISCORD_API = "https://discord.com/api/v10";

function secondsToMilliseconds(value: unknown): number | undefined {
  const seconds = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(seconds) && seconds >= 0 && seconds <= 31_536_000
    ? Math.max(1_000, Math.ceil(seconds * 1_000)) : undefined;
}

async function rejected(response: Response): Promise<HaltDiscordDeliveryResult> {
  if (response.status === 429) {
    const body: unknown = await response.json().catch(() => null);
    const retryAfterMs = secondsToMilliseconds(response.headers.get("Retry-After")) ??
      secondsToMilliseconds(body && typeof body === "object" && "retry_after" in body ? body.retry_after : undefined) ?? 60_000;
    return { code: "rate_limited", retryAfterMs };
  }
  return { code: response.status === 408 || response.status >= 500 ? "provider_unavailable" : "provider_rejected" };
}

/** A single run validates its destination once, then serially drains fresh alerts. */
export class MarketHaltDiscordDeliveryService {
  constructor(
    private readonly repository: MarketHaltDiscordRepository,
    private readonly configuration: MarketHaltDiscordConfiguration,
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private headers(): Readonly<Record<string, string>> {
    return { Authorization: `Bot ${this.configuration.botToken}`, "Content-Type": "application/json" };
  }

  private async validateChannel(): Promise<HaltDiscordDeliveryResult | null> {
    try {
      const response = await this.fetcher(`${DISCORD_API}/channels/${this.configuration.channelId}`, {
        headers: this.headers(), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) return rejected(response);
      const body: unknown = await response.json();
      return body && typeof body === "object" &&
        "id" in body && body.id === this.configuration.channelId &&
        "guild_id" in body && body.guild_id === this.configuration.guildId &&
        "type" in body && (body.type === 0 || body.type === 5)
        ? null : { code: "invalid_destination" };
    } catch {
      return { code: "provider_unavailable" };
    }
  }

  private async send(delivery: ClaimedHaltDiscordDelivery): Promise<HaltDiscordDeliveryResult> {
    if (this.now().toISOString() >= delivery.expires_at_utc) return { code: "provider_unavailable" };
    try {
      // All retries occur within two minutes, inside Discord's recent-nonce window.
      const nonce = createHash("sha256").update(`halt-discord:${delivery.delivery_id}`).digest("hex").slice(0, 25);
      const response = await this.fetcher(`${DISCORD_API}/channels/${delivery.channel_id}/messages`, {
        headers: this.headers(), method: "POST", redirect: "error", signal: AbortSignal.timeout(8_000),
        body: JSON.stringify({
          allowed_mentions: { parse: [] },
          content: `${delivery.notification_title}\n\n${delivery.notification_body}`,
          enforce_nonce: true,
          nonce,
        }),
      });
      if (!response.ok) return rejected(response);
      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || !("id" in body) ||
        typeof body.id !== "string" || !/^[0-9]{1,32}$/u.test(body.id)) return { code: "provider_unavailable" };
      return {
        code: "sent",
        messageId: body.id,
        retryAfterMs: response.headers.get("X-RateLimit-Remaining") === "0"
          ? secondsToMilliseconds(response.headers.get("X-RateLimit-Reset-After")) ?? 1_000 : undefined,
      };
    } catch {
      // An uncertain POST uses the same enforced nonce on its next attempt.
      return { code: "provider_unavailable" };
    }
  }

  async runAvailable(): Promise<Readonly<{ attempted: number; delivered: number; failureCode: string | null }>> {
    const deadline = Date.now() + 20_000;
    let channelValidated = false;
    let attempted = 0;
    let delivered = 0;
    let failureCode: string | null = null;
    while (attempted < 100 && Date.now() < deadline) {
      const claimed = this.repository.claimNext(this.configuration.channelId, this.now().toISOString());
      if (!claimed) break;
      attempted++;
      let result = channelValidated ? null : await this.validateChannel();
      if (!result) {
        channelValidated = true;
        result = await this.send(claimed);
      }
      this.repository.complete(claimed, result, this.now().toISOString());
      if (result.code === "sent") delivered++;
      else failureCode = result.code;
      if (result.code !== "sent" || result.retryAfterMs !== undefined) break;
    }
    return Object.freeze({ attempted, delivered, failureCode });
  }
}
