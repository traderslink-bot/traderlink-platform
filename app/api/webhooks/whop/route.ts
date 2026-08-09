import { NextResponse, type NextRequest } from "next/server";

import { loadWhopAiReviewEntitlementConfiguration } from
  "@/src/modules/platform/server/billing/whop-ai-review-configuration";
import { WhopAiReviewEntitlementRepository } from
  "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import {
  parseWhopAiReviewWebhook,
  verifyWhopWebhookSignature,
} from "@/src/modules/platform/server/billing/whop-ai-review-webhook";
import { withPlatformDatabase } from
  "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const configuration = loadWhopAiReviewEntitlementConfiguration();
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 1_000_000) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }
    const webhookId = request.headers.get("webhook-id") ?? "";
    const webhookTimestamp = request.headers.get("webhook-timestamp") ?? "";
    const webhookSignature = request.headers.get("webhook-signature") ?? "";
    verifyWhopWebhookSignature({
      rawBody, webhookId, webhookTimestamp, webhookSignature,
      secret: configuration.webhookSecret,
    });
    const event = parseWhopAiReviewWebhook({ rawBody, webhookId, configuration });
    const result = withPlatformDatabase({ mode: "runtime" }, (database) => {
      const repository = new WhopAiReviewEntitlementRepository(database);
      return event.eventType === "payment.failed"
        ? repository.recordOperationalEvent(event)
        : repository.applyMembershipEvent(event);
    });
    return NextResponse.json({ ok: true, accepted: result !== "conflict" }, {
      status: result === "conflict" ? 202 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ ok: false }, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
