import { createHash } from "node:crypto";
import { verifyWhopWebhookSignature } from "../../platform/server/billing/whop-ai-review-webhook";

export type CoachingWhopEvent = Readonly<{
  eventId: string; payloadSha256: string; merchantAccountId: string; type: string;
  occurredAtUtc: string; resourceKind: "payment" | "membership" | "account"; resourceId: string;
}>;
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid coaching payment event.");
  return value as Record<string, unknown>;
}

/** Reuses Platform's signature verifier; discards buyer/card data and client secrets. */
export function parseSignedCoachingWhopEvent(input: Readonly<{
  rawBody: string; webhookId: string; webhookTimestamp: string; webhookSignature: string;
  secret: string; allowedMerchantAccountIds: ReadonlySet<string>; now?: Date;
}>): CoachingWhopEvent | null {
  verifyWhopWebhookSignature(input);
  const event = record(JSON.parse(input.rawBody));
  if (event.id !== input.webhookId || event.api_version !== "v1" || event.api_version_date !== "2026-10-24" || typeof event.account_id !== "string" || !input.allowedMerchantAccountIds.has(event.account_id) || typeof event.type !== "string" || typeof event.timestamp !== "string" || !Number.isFinite(Date.parse(event.timestamp))) throw new Error("Coaching payment event scope/version requires reconciliation.");
  const data = record(event.data);
  let resourceKind: CoachingWhopEvent["resourceKind"], resourceId: unknown;
  if (/^payment\.(succeeded|failed|pending|authorized|canceled|created|requires_action)$/.test(event.type)) {
    resourceKind = "payment"; resourceId = data.id;
  } else if (/^(refund\.(created|updated)|dispute\.(created|updated)|dispute_alert\.created|resolution_center_case\.(created|updated|decided))$/.test(event.type)) {
    resourceKind = "payment"; resourceId = data.payment_id;
  } else if (/^membership\.(activated|updated|trial_ending_soon)$/.test(event.type)) {
    resourceKind = "membership"; resourceId = data.id;
  } else if (event.type === "account.updated") {
    resourceKind = "account"; resourceId = data.id;
  } else return null;
  const prefix = { payment: "pay_", membership: "mem_", account: "biz_" }[resourceKind];
  if (typeof resourceId !== "string" || !resourceId.startsWith(prefix) || !/^[A-Za-z0-9_]+$/.test(resourceId)) throw new Error("Coaching event lacks an authoritative resource reference.");
  if (resourceKind === "account" && resourceId !== event.account_id) throw new Error("Coaching account event scope mismatch.");
  return Object.freeze({ eventId: input.webhookId, payloadSha256: createHash("sha256").update(input.rawBody).digest("hex"), merchantAccountId: event.account_id, type: event.type, occurredAtUtc: new Date(event.timestamp).toISOString(), resourceKind, resourceId });
}
