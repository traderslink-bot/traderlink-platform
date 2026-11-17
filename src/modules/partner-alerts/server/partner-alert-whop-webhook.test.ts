// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PARTNER_ALERT_WHOP_API_VERSION } from "./partner-alert-whop-client";
import { parsePartnerAlertWhopWebhook } from "./partner-alert-whop-webhook";

const at = "2026-11-14T22:00:00.000Z";
const scope = {
  communityId: "11111111-1111-4111-8111-111111111111",
  accountId: "biz_fixture",
  environment: "sandbox",
  apiVersionDate: PARTNER_ALERT_WHOP_API_VERSION,
} as const;

function signedEvent(type: string, data: object, accountId = scope.accountId as string) {
  const webhookId = "evt_fixture";
  const webhookTimestamp = String(Date.parse(at) / 1000);
  const signingKey = { secret: "ws_synthetic_test_key_only", encoding: "raw_utf8" } as const;
  const rawBody = Buffer.from(JSON.stringify({
    id: webhookId, api_version: "v1", api_version_date: scope.apiVersionDate, account_id: accountId,
    type, timestamp: at, data,
  }));
  const signature = createHmac("sha256", signingKey.secret)
    .update(`${webhookId}.${webhookTimestamp}.`).update(rawBody).digest("base64");
  return { rawBody, webhookId, webhookTimestamp, webhookSignature: `v1,${signature}`, scope, signingKey, nowUtc: at };
}

describe("Partner Channel lifecycle webhook intake", () => {
  it.each([
    ["membership.updated", { id: "mem_fixture", status: "cancelled" }, "membership", "mem_fixture"],
    ["payment.canceled", { id: "pay_fixture" }, "payment", "pay_fixture"],
    ["refund.updated", { payment: { id: "pay_fixture" } }, "payment", "pay_fixture"],
    ["account.updated", { id: scope.accountId }, "account", scope.accountId],
  ] as const)("routes a signed %s event to its exact resource", (type, data, resourceKind, resourceId) => {
    const result = parsePartnerAlertWhopWebhook(signedEvent(type, data));
    expect(result).toMatchObject({ eventType: type, accountId: scope.accountId, resourceKind, resourceId });
    expect(result).not.toHaveProperty("data");
  });

  it("rejects a correctly signed refund from another merchant", () => {
    expect(() => parsePartnerAlertWhopWebhook(signedEvent("refund.updated", { payment: { id: "pay_fixture" } },
      "biz_unrelated"))).toThrow();
  });
});
