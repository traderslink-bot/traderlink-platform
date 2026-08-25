import "server-only";

import {
  deliveryResult,
  preparePlatformRemoteNotificationContent,
  resolvePlatformNotificationPublicOrigin,
  type PlatformNotificationDeliveryResult,
  type PlatformRemoteNotificationContent,
} from "./platform-remote-notification-delivery-contracts";

const RESEND_EMAILS_API = "https://api.resend.com/emails";
const NOTIFICATION_FROM = "TradersLink Notifications <notifications@traderslink.pro>";
const NOTIFICATION_REPLY_TO = "support@traderslink.pro";
const recipientEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function resendApiKey(environment: NodeJS.ProcessEnv): string | null {
  const value = environment.RESEND_API_KEY?.trim();
  return value && value.length >= 20 ? value : null;
}

function safeIdempotencyKey(value: string): string | null {
  const normalized = value.trim();
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(normalized) ? normalized : null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function emailHtml(input: Readonly<{
  actionLabel: string;
  destinationUrl: string | null;
  summary: string;
  title: string;
}>): string {
  const link = input.destinationUrl
    ? `<p><a href="${escapeHtml(input.destinationUrl)}">${escapeHtml(input.actionLabel)}</a></p>`
    : "";
  return `<!doctype html><html><body><h1>${escapeHtml(input.title)}</h1><p>${escapeHtml(input.summary)}</p>${link}</body></html>`;
}

function providerResult(response: Response): PlatformNotificationDeliveryResult {
  if (response.ok) return deliveryResult("sent");
  return deliveryResult(response.status === 408 || response.status === 429 || response.status >= 500
    ? "provider_unavailable"
    : "provider_rejected");
}

/**
 * Sends one notification email through Resend. The deterministic idempotency
 * key is owned by the durable delivery worker and prevents retry duplicates.
 */
export async function deliverPlatformNotificationEmail(input: Readonly<{
  actionLabel?: string;
  content: PlatformRemoteNotificationContent;
  emailAddress: string;
  environment?: NodeJS.ProcessEnv;
  fetcher?: typeof fetch;
  idempotencyKey: string;
}>): Promise<PlatformNotificationDeliveryResult> {
  const environment = input.environment ?? process.env;
  const apiKey = resendApiKey(environment);
  if (!apiKey) return deliveryResult("not_configured");

  const emailAddress = input.emailAddress.trim();
  const idempotencyKey = safeIdempotencyKey(input.idempotencyKey);
  if (!recipientEmail.test(emailAddress) || !idempotencyKey) {
    return deliveryResult("invalid_destination");
  }
  const content = preparePlatformRemoteNotificationContent({
    content: input.content,
    publicOrigin: resolvePlatformNotificationPublicOrigin(environment),
  });
  if (!content) return deliveryResult("invalid_destination");
  const actionLabel = input.actionLabel?.trim() || "Open TradersLink";
  if (actionLabel.length > 80 || /[\u0000-\u001f\u007f]/u.test(actionLabel)) {
    return deliveryResult("invalid_destination");
  }

  const text = [
    content.title,
    content.summary,
    content.destinationUrl ? `${actionLabel}: ${content.destinationUrl}` : null,
  ].filter((value): value is string => Boolean(value)).join("\n\n");

  try {
    const response = await (input.fetcher ?? fetch)(RESEND_EMAILS_API, {
      body: JSON.stringify({
        from: NOTIFICATION_FROM,
        html: emailHtml({ ...content, actionLabel }),
        reply_to: NOTIFICATION_REPLY_TO,
        subject: content.title,
        text,
        to: [emailAddress],
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "User-Agent": "TradersLink-Platform-Notifications/1.0",
      },
      method: "POST",
    });
    return providerResult(response);
  } catch {
    return deliveryResult("provider_unavailable");
  }
}
