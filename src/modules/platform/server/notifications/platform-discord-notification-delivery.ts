import "server-only";

import { createHash } from "node:crypto";
import {
  deliveryResult,
  preparePlatformRemoteNotificationContent,
  resolvePlatformNotificationPublicOrigin,
  type PlatformNotificationDeliveryResult,
  type PlatformRemoteNotificationContent,
} from "./platform-remote-notification-delivery-contracts";

const DISCORD_API = "https://discord.com/api/v10";
const discordSnowflake = /^\d{1,32}$/u;
const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u;

function discordBotToken(environment: NodeJS.ProcessEnv): string | null {
  const value = environment.DISCORD_BOT_TOKEN?.trim();
  return value && value.length >= 20 ? value : null;
}

function providerResult(response: Response): PlatformNotificationDeliveryResult {
  if (response.ok) return deliveryResult("sent");
  return deliveryResult(response.status === 408 || response.status === 429 || response.status >= 500
    ? "provider_unavailable"
    : "provider_rejected");
}

function discordNonce(idempotencyKey: string): string | null {
  if (!idempotencyKeyPattern.test(idempotencyKey)) return null;
  // Discord accepts up to 25 nonce characters. Enforced nonces make a retry
  // return the original message instead of creating another DM.
  return createHash("sha256").update(idempotencyKey, "utf8").digest("hex").slice(0, 25);
}

/**
 * Sends an already-authorized app notification to the active Discord account.
 * The caller owns preference checks and durable retry/idempotency state.
 */
export async function deliverPlatformNotificationDiscordDirectMessage(input: Readonly<{
  content: PlatformRemoteNotificationContent;
  discordUserId: string;
  environment?: NodeJS.ProcessEnv;
  fetcher?: typeof fetch;
  idempotencyKey: string;
}>): Promise<PlatformNotificationDeliveryResult> {
  const environment = input.environment ?? process.env;
  const token = discordBotToken(environment);
  if (!token) return deliveryResult("not_configured");
  if (!discordSnowflake.test(input.discordUserId)) return deliveryResult("invalid_destination");

  const content = preparePlatformRemoteNotificationContent({
    content: input.content,
    publicOrigin: resolvePlatformNotificationPublicOrigin(environment),
  });
  const nonce = discordNonce(input.idempotencyKey);
  if (!content || !nonce) return deliveryResult("invalid_destination");

  const fetcher = input.fetcher ?? fetch;
  const headers = Object.freeze({
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  });
  const messageText = [
    content.title,
    content.summary,
    content.destinationUrl ? `Open: ${content.destinationUrl}` : null,
  ].filter((value): value is string => Boolean(value)).join("\n\n").slice(0, 2_000);

  try {
    const channel = await fetcher(`${DISCORD_API}/users/@me/channels`, {
      body: JSON.stringify({ recipient_id: input.discordUserId }),
      headers,
      method: "POST",
    });
    if (!channel.ok) return providerResult(channel);
    const body: unknown = await channel.json();
    const channelId = body && typeof body === "object" &&
      typeof (body as Readonly<{ id?: unknown }>).id === "string"
      ? (body as Readonly<{ id: string }>).id
      : null;
    if (!channelId || !discordSnowflake.test(channelId)) return deliveryResult("provider_rejected");

    const message = await fetcher(`${DISCORD_API}/channels/${channelId}/messages`, {
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        content: messageText,
        enforce_nonce: true,
        nonce,
      }),
      headers,
      method: "POST",
    });
    return providerResult(message);
  } catch {
    return deliveryResult("provider_unavailable");
  }
}
