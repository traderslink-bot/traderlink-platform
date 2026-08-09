import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import {
  createWhopPrivacyReference,
} from "./whop-ai-review-identity";
import type { WhopAiReviewEntitlementConfiguration } from
  "./whop-ai-review-configuration";
import type {
  WhopMembershipProjectionEvent,
  WhopOperationalEvent,
} from "./whop-ai-review-entitlement-repository";

const MAX_SIGNATURE_AGE_SECONDS = 300;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("TRADERLINK_WHOP_WEBHOOK_INVALID");
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 512) {
    throw new Error("TRADERLINK_WHOP_WEBHOOK_INVALID");
  }
  return value;
}

function optionalTimestamp(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const parsed = new Date(requiredString(value));
  if (!Number.isFinite(parsed.getTime())) throw new Error("TRADERLINK_WHOP_WEBHOOK_INVALID");
  return parsed.toISOString();
}

function secureEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyWhopWebhookSignature(input: Readonly<{
  rawBody: string;
  webhookId: string;
  webhookTimestamp: string;
  webhookSignature: string;
  secret: string;
  now?: Date;
}>): void {
  if (!/^\d{10}$/u.test(input.webhookTimestamp)) {
    throw new Error("TRADERLINK_WHOP_WEBHOOK_SIGNATURE_INVALID");
  }
  const deliveredAt = Number(input.webhookTimestamp);
  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1_000);
  if (!Number.isSafeInteger(deliveredAt) ||
      Math.abs(nowSeconds - deliveredAt) > MAX_SIGNATURE_AGE_SECONDS) {
    throw new Error("TRADERLINK_WHOP_WEBHOOK_SIGNATURE_STALE");
  }
  const expected = createHmac("sha256", Buffer.from(input.secret, "utf8"))
    .update(`${input.webhookId}.${input.webhookTimestamp}.${input.rawBody}`, "utf8")
    .digest("base64");
  const candidates = input.webhookSignature.split(/\s+/u)
    .map((signature) => signature.trim())
    .filter((signature) => signature.startsWith("v1,"))
    .map((signature) => signature.slice(3));
  if (!candidates.some((candidate) => secureEqual(candidate, expected))) {
    throw new Error("TRADERLINK_WHOP_WEBHOOK_SIGNATURE_INVALID");
  }
}

export function parseWhopAiReviewWebhook(input: Readonly<{
  rawBody: string;
  webhookId: string;
  configuration: WhopAiReviewEntitlementConfiguration;
}>): WhopMembershipProjectionEvent | WhopOperationalEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.rawBody);
  } catch {
    throw new Error("TRADERLINK_WHOP_WEBHOOK_INVALID");
  }
  const event = record(parsed);
  const eventId = requiredString(event.id);
  if (eventId !== input.webhookId || event.api_version !== "v1" ||
      event.api_version_date !== input.configuration.apiVersionDate) {
    throw new Error("TRADERLINK_WHOP_WEBHOOK_INVALID");
  }
  const companyId = requiredString(event.company_id);
  if (companyId !== input.configuration.companyId) {
    throw new Error("TRADERLINK_WHOP_WEBHOOK_SCOPE_INVALID");
  }
  const eventType = requiredString(event.type);
  const supported = [
    "membership.activated",
    "membership.deactivated",
    "membership.cancel_at_period_end_changed",
    "payment.failed",
  ] as const;
  if (!supported.includes(eventType as (typeof supported)[number])) {
    throw new Error("TRADERLINK_WHOP_WEBHOOK_EVENT_UNSUPPORTED");
  }
  const supportedEventType = eventType as (typeof supported)[number];
  const eventAtUtc = optionalTimestamp(event.timestamp);
  if (!eventAtUtc) throw new Error("TRADERLINK_WHOP_WEBHOOK_INVALID");
  const data = record(event.data);
  const productId = requiredString(record(data.product).id);
  if (!input.configuration.productIds.has(productId)) {
    throw new Error("TRADERLINK_WHOP_WEBHOOK_SCOPE_INVALID");
  }
  const key = input.configuration.identityHmacKey;
  const common = Object.freeze({
    webhookIdSha256: createHash("sha256").update(input.webhookId, "utf8").digest("hex"),
    payloadSha256: createHash("sha256").update(input.rawBody, "utf8").digest("hex"),
    eventAtUtc,
  });
  if (supportedEventType === "payment.failed") {
    const membership = data.membership === null || data.membership === undefined
      ? null : record(data.membership);
    return Object.freeze({
      ...common,
      eventType: supportedEventType,
      membershipRefHmac: membership
        ? createWhopPrivacyReference(requiredString(membership.id), "membership", key)
        : null,
    });
  }
  const status = typeof data.status === "string" ? data.status : null;
  const membershipState = supportedEventType === "membership.activated"
    ? "active" as const
    : supportedEventType === "membership.deactivated"
      ? "deactivated" as const
      : status === "active" || status === "trialing"
        ? "active" as const
        : "deactivated" as const;
  return Object.freeze({
    ...common,
    eventType: supportedEventType,
    membershipRefHmac: createWhopPrivacyReference(
      requiredString(data.id), "membership", key,
    ),
    whopUserRefHmac: createWhopPrivacyReference(
      requiredString(record(data.user).id), "user", key,
    ),
    companyRefHmac: createWhopPrivacyReference(companyId, "company", key),
    productRefHmac: createWhopPrivacyReference(productId, "product", key),
    membershipState,
    cancelAtPeriodEnd: data.cancel_at_period_end === true,
    renewalPeriodStartUtc: optionalTimestamp(data.renewal_period_start),
    renewalPeriodEndUtc: optionalTimestamp(data.renewal_period_end),
  });
}
