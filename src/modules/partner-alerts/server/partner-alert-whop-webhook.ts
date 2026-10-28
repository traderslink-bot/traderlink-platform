import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { PartnerAlertValidationError, type PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";
import { partnerAlertId, partnerAlertRecord, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { PARTNER_ALERT_WHOP_API_VERSION } from "./partner-alert-whop-client";

export type PartnerAlertWhopEvent = Readonly<{
  environment: PartnerAlertEnvironment;
  apiVersionDate: typeof PARTNER_ALERT_WHOP_API_VERSION;
  communityId: string;
  accountId: string;
  eventId: string;
  eventType: string;
  resourceKind: "membership" | "payment" | "account";
  resourceId: string;
  payloadSha256: string;
  occurredAtUtc: string;
}>;
export type PartnerAlertWhopWebhookScope = Readonly<{
  communityId: string;
  environment: PartnerAlertEnvironment;
  accountId: string;
  apiVersionDate: typeof PARTNER_ALERT_WHOP_API_VERSION;
}>;
export type PartnerAlertWhopSigningKey = Readonly<{
  secret: string;
  /** Explicit protocol selection; never try multiple encodings automatically. */
  encoding: "raw_utf8" | "base64_after_prefix";
}>;

function invalid(): never {
  throw new PartnerAlertValidationError("whopWebhook", "The Whop event could not be verified.");
}
function signingKey(configuration: PartnerAlertWhopSigningKey): Buffer {
  if (typeof configuration.secret !== "string" || !/^ws_[A-Za-z0-9+/_=-]{16,2000}$/u.test(configuration.secret)) return invalid();
  if (configuration.encoding === "raw_utf8") return Buffer.from(configuration.secret, "utf8");
  if (configuration.encoding !== "base64_after_prefix") return invalid();
  const encoded = configuration.secret.slice(3);
  const decoded = Buffer.from(encoded, "base64");
  if (decoded.length < 16 || decoded.length > 128 || decoded.toString("base64") !== encoded) return invalid();
  return decoded;
}

/** Raw bytes only. This verifies/enqueues no data and changes no entitlement. */
export function parsePartnerAlertWhopWebhook(input: Readonly<{
  rawBody: Uint8Array;
  webhookId: string;
  webhookTimestamp: string;
  webhookSignature: string;
  scope: PartnerAlertWhopWebhookScope;
  signingKey: PartnerAlertWhopSigningKey;
  nowUtc: string;
}>): PartnerAlertWhopEvent | null {
  const at = partnerAlertUtc(input.nowUtc, "nowUtc");
  const scope = input.scope;
  partnerAlertId(scope.communityId, "communityId");
  if (!["sandbox", "live"].includes(scope.environment) || !/^biz_[A-Za-z0-9_]{1,124}$/u.test(scope.accountId)
    || scope.apiVersionDate !== PARTNER_ALERT_WHOP_API_VERSION
    || !(input.rawBody instanceof Uint8Array) || input.rawBody.byteLength > 256_000
    || !/^[A-Za-z0-9_-]{1,128}$/u.test(input.webhookId) || !/^[1-9][0-9]{9}$/u.test(input.webhookTimestamp)
    || typeof input.webhookSignature !== "string" || input.webhookSignature.length > 1024) return invalid();
  const signedAt = Number(input.webhookTimestamp) * 1000;
  if (Math.abs(Date.parse(at) - signedAt) > 300_000) return invalid();
  const raw = Buffer.from(input.rawBody);
  const expected = createHmac("sha256", signingKey(input.signingKey))
    .update(`${input.webhookId}.${input.webhookTimestamp}.`, "utf8").update(raw).digest();
  const signatures = input.webhookSignature.trim().split(/\s+/u);
  if (signatures.length > 8 || !signatures.some(signature => {
    if (!/^v1,[A-Za-z0-9+/]{43}=$/u.test(signature)) return false;
    const candidate = Buffer.from(signature.slice(3), "base64");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  })) return invalid();
  let event: Record<string, unknown>;
  try {
    event = partnerAlertRecord(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)), "event");
  } catch { return invalid(); }
  if (event.id !== input.webhookId || event.api_version !== "v1" || event.api_version_date !== scope.apiVersionDate
    || event.account_id !== scope.accountId || typeof event.type !== "string") return invalid();
  const occurredAtUtc = partnerAlertUtc(event.timestamp, "eventTimestamp");
  if (Date.parse(occurredAtUtc) > Date.parse(at) + 300_000) return invalid();
  const data = partnerAlertRecord(event.data, "eventResource");
  let resourceKind: PartnerAlertWhopEvent["resourceKind"];
  let resourceId: unknown;
  if (["membership.activated", "membership.updated", "membership.trial_ending_soon"].includes(event.type)) {
    resourceKind = "membership"; resourceId = data.id;
  } else if (["payment.succeeded", "payment.failed", "payment.pending", "payment.authorized",
    "payment.canceled", "payment.created", "payment.requires_action"].includes(event.type)) {
    resourceKind = "payment"; resourceId = data.id;
  } else if (["refund.created", "refund.updated"].includes(event.type)) {
    // The pinned webhook uses RefundLegacy.payment, not REST Refund.payment_id.
    resourceKind = "payment";
    try { resourceId = partnerAlertRecord(data.payment, "refundPayment").id; }
    catch { return invalid(); }
  } else if (["dispute.created", "dispute.updated", "dispute_alert.created",
    "resolution_center_case.created", "resolution_center_case.updated", "resolution_center_case.decided"].includes(event.type)) {
    resourceKind = "payment"; resourceId = data.payment_id;
  } else if (event.type === "account.updated") {
    resourceKind = "account"; resourceId = data.id;
  } else return null;
  const prefix = { membership: "mem_", payment: "pay_", account: "biz_" }[resourceKind];
  if (typeof resourceId !== "string" || resourceId.length > 128 || !resourceId.startsWith(prefix)
    || resourceId.length <= prefix.length || !/^[A-Za-z0-9_]+$/u.test(resourceId)
    || (resourceKind === "account" && resourceId !== scope.accountId)) return invalid();
  return Object.freeze({ ...scope, eventId: input.webhookId, eventType: event.type,
    resourceKind, resourceId, occurredAtUtc, payloadSha256: createHash("sha256").update(raw).digest("hex") });
}
