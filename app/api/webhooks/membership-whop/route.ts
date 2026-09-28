import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { recordMembershipWebhookFailure } from "@/src/modules/platform/server/membership/platform-membership-webhook-health";
import { verifyWhopWebhookSignature } from "@/src/modules/platform/server/billing/whop-ai-review-webhook";
import { applyMembershipWhopEvent, hydrateMembershipWhopPayment } from "@/src/modules/platform/server/membership/platform-membership-whop";

export const runtime = "nodejs";
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.WHOP_MEMBERSHIP_WEBHOOK_SECRET;
  const companyId = process.env.WHOP_COMPANY_ID;
  const identityKey = process.env.TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY;
  const apiVersionDate = process.env.WHOP_API_VERSION_DATE;
  if (!secret || !companyId || !identityKey || !apiVersionDate) return Response.json({ ok: false }, { status: 503 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 1_000_000) return Response.json({ ok: false }, { status: 413 });
  const webhookId = request.headers.get("webhook-id") ?? "";
  try {
    verifyWhopWebhookSignature({ rawBody: raw, webhookId, webhookTimestamp: request.headers.get("webhook-timestamp") ?? "",
      webhookSignature: request.headers.get("webhook-signature") ?? "", secret });
  } catch { return Response.json({ ok: false }, { status: 400 }); }
  try {
    const membership = await hydrateMembershipWhopPayment(raw, companyId);
    const result = withPlatformDatabase({ mode: "runtime" }, (database) => applyMembershipWhopEvent(database, raw, webhookId, { companyId, identityKey, apiVersionDate }, membership));
    return Response.json({ ok: true, result });
  } catch {
    try {
      withPlatformDatabase({ mode: "runtime" }, (database) => recordMembershipWebhookFailure(database, "whop", webhookId, raw));
    } catch { /* Keep retrying even when the failure record cannot be written. */ }
    return Response.json({ ok: false }, { status: 503 });
  }
}
