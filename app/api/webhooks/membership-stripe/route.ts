import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { recordMembershipWebhookFailure } from "@/src/modules/platform/server/membership/platform-membership-webhook-health";
import { verifyMembershipStripeEvent, hydrateMembershipStripeEvent, applyMembershipStripeEvent } from "@/src/modules/platform/server/membership/platform-membership-stripe";

export const runtime = "nodejs";
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_MEMBERSHIP_WEBHOOK_SECRET;
  if (!secret) return Response.json({ ok: false }, { status: 503 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 1_000_000) return Response.json({ ok: false }, { status: 413 });
  let event: Record<string, unknown>;
  try { event = verifyMembershipStripeEvent(raw, request.headers.get("stripe-signature") ?? "", secret); }
  catch { return Response.json({ ok: false }, { status: 400 }); }
  try {
    const subscription = await hydrateMembershipStripeEvent(event);
    const result = withPlatformDatabase({ mode: "runtime" }, (database) => applyMembershipStripeEvent(database, event, subscription, raw));
    return Response.json({ ok: true, result });
  } catch {
    try {
      withPlatformDatabase({ mode: "runtime" }, (database) => recordMembershipWebhookFailure(database, "stripe", String(event.id ?? "unknown"), raw));
    } catch { /* Keep retrying even when the failure record cannot be written. */ }
    // Provider retries processing failures; do not acknowledge unapplied payments.
    return Response.json({ ok: false }, { status: 503 });
  }
}
