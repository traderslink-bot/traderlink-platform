import "server-only";

export const PLATFORM_NOTIFICATION_DELIVERY_RESULT_CODES = [
  "sent",
  "invalid_destination",
  "not_configured",
  "provider_rejected",
  "provider_unavailable",
] as const;

export type PlatformNotificationDeliveryResultCode =
  (typeof PLATFORM_NOTIFICATION_DELIVERY_RESULT_CODES)[number];

/** The result is intentionally provider-safe: it never exposes credentials,
 * provider response bodies, recipient addresses, or transport errors. */
export type PlatformNotificationDeliveryResult = Readonly<{
  code: PlatformNotificationDeliveryResultCode;
  ok: boolean;
}>;

export type PlatformRemoteNotificationContent = Readonly<{
  destinationPath: string | null;
  summary: string;
  title: string;
}>;

export type PlatformPreparedRemoteNotificationContent = Readonly<{
  destinationUrl: string | null;
  summary: string;
  title: string;
}>;

const textControlCharacters = /[\u0000-\u001f\u007f]/gu;

export function deliveryResult(
  code: PlatformNotificationDeliveryResultCode,
): PlatformNotificationDeliveryResult {
  return Object.freeze({ code, ok: code === "sent" });
}

function boundedText(value: string, maximum: number): string | null {
  const normalized = value.replace(textControlCharacters, " ").replace(/\s+/gu, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, maximum);
}

function normalizeDestinationPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return null;
  }
  try {
    const parsed = new URL(trimmed, "https://notifications.invalid");
    if (parsed.origin !== "https://notifications.invalid") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

/**
 * Returns only a configured, HTTPS public dashboard origin. Railway's local
 * bind origin is deliberately never a notification destination.
 */
export function resolvePlatformNotificationPublicOrigin(
  environment: NodeJS.ProcessEnv = process.env,
): string | null {
  const configuredOrigin = environment.PLATFORM_PUBLIC_ORIGIN?.trim();
  const configuredDiscordRedirect = environment.DISCORD_REDIRECT_URI?.trim();
  const candidate = configuredOrigin || configuredDiscordRedirect;
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? parsed.origin : null;
  } catch {
    return null;
  }
}

/**
 * Normalizes notification copy and app-relative destinations once for each
 * remote channel. A caller may send a text-only notification without a link.
 */
export function preparePlatformRemoteNotificationContent(input: Readonly<{
  content: PlatformRemoteNotificationContent;
  publicOrigin: string | null;
}>): PlatformPreparedRemoteNotificationContent | null {
  const title = boundedText(input.content.title, 160);
  const summary = boundedText(input.content.summary, 1_000);
  if (!title || !summary) return null;

  if (input.content.destinationPath === null) {
    return Object.freeze({ destinationUrl: null, summary, title });
  }
  if (!input.publicOrigin) return null;
  const destinationPath = normalizeDestinationPath(input.content.destinationPath);
  if (!destinationPath) return null;
  try {
    const origin = new URL(input.publicOrigin);
    if (origin.protocol !== "https:") return null;
    const destination = new URL(destinationPath, origin);
    if (destination.origin !== origin.origin) return null;
    return Object.freeze({
      destinationUrl: destination.toString(),
      summary,
      title,
    });
  } catch {
    return null;
  }
}
