import type { NextRequest } from "next/server";
import { PartnerAlertValidationError } from "@/src/modules/partner-alerts/contracts/partner-alert-contracts";
import { partnerAlertId } from "@/src/modules/partner-alerts/contracts/partner-alert-validation";
import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";
import { PARTNER_ALERT_WHOP_API_VERSION } from "@/src/modules/partner-alerts/server/partner-alert-whop-client";

export const runtime = "nodejs";

const maximumBytes = 256_000;

async function readBody(request: Request): Promise<Buffer | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return Buffer.concat(chunks, size);
      size += value.byteLength;
      if (size > maximumBytes) {
        void reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
}

export async function POST(request: NextRequest): Promise<Response> {
  const respond = (status: number) => Response.json({ ok: status === 200 }, {
    status, headers: { "cache-control": "private, no-store" },
  });
  const settings = process.env;
  const accountId = settings.PARTNER_ALERT_WHOP_WEBHOOK_ACCOUNT_ID;
  const environment = settings.PARTNER_ALERT_WHOP_WEBHOOK_ENVIRONMENT;
  const secret = settings.PARTNER_ALERT_WHOP_WEBHOOK_SECRET;
  const encoding = settings.PARTNER_ALERT_WHOP_WEBHOOK_KEY_ENCODING;
  if (settings.PARTNER_ALERT_WHOP_WEBHOOK_ENABLED !== "true" || !accountId
    || !/^biz_[A-Za-z0-9_]{1,124}$/u.test(accountId)
    || (environment !== "sandbox" && environment !== "live")
    || !secret || !/^ws_[A-Za-z0-9+/_=-]{16,2000}$/u.test(secret)
    || (encoding !== "raw_utf8" && encoding !== "base64_after_prefix")) return respond(503);
  let communityId: string;
  try { communityId = partnerAlertId(settings.PARTNER_ALERT_WHOP_WEBHOOK_COMMUNITY_ID, "communityId"); }
  catch { return respond(503); }

  const webhookId = request.headers.get("webhook-id");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  const webhookSignature = request.headers.get("webhook-signature");
  if (!webhookId || !webhookTimestamp || !webhookSignature) return respond(400);
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/u.test(length) || Number(length) > maximumBytes)) return respond(413);

  let rawBody: Buffer | null;
  try { rawBody = await readBody(request); }
  catch { return respond(400); }
  if (!rawBody) return respond(413);
  if (request.signal.aborted) return respond(400);

  return withPartnerAlertRequestRuntime(request, async services => {
    try {
      services.receiveWhopEvent({ communityId, accountId, environment, apiVersionDate: PARTNER_ALERT_WHOP_API_VERSION },
        { rawBody, webhookId, webhookTimestamp, webhookSignature, signingKey: { secret, encoding } });
      return respond(200);
    } catch (error) {
      return respond(error instanceof PartnerAlertValidationError && error.field === "whopWebhook" ? 400 : 503);
    }
  });
}
