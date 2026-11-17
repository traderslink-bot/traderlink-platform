import { partnerAlertStripeSandbox } from "@/src/modules/partner-alerts/server/partner-alert-stripe-sandbox-runtime";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sandbox = partnerAlertStripeSandbox(request);
  if (!sandbox) return new Response(null, { status: 404 });
  return sandbox.service.invoiceWebhook(request);
}
