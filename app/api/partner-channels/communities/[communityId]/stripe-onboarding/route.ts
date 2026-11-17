import type { NextRequest } from "next/server";
import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { readPartnerAlertStripeBillingConfiguration } from "@/src/modules/partner-alerts/server/partner-alert-stripe-billing-runtime";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { stripeOnboardingConfiguration, withStripeOnboarding } from "@/src/modules/partner-alerts/server/partner-alert-stripe-onboarding-runtime";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ communityId: string }> }) {
  const native = readPartnerAlertStripeBillingConfiguration();
  const preview = !native && !process.env.PARTNER_STRIPE_NATIVE_SANDBOX_SIGNING_SECRET ? stripeOnboardingConfiguration() : null;
  const configuration = native ?? preview;
  const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
  if (!configuration) return new Response(null, { status: 404, headers });
  try {
    requirePlatformMutationRequest(request);
    if (request.headers.get("origin") !== configuration.origin) throw new Error("Unexpected seller request origin.");
  } catch { return new Response(null, { status: 403, headers }); }
  const { communityId } = await context.params;
  function readOwner() {
    const userId = requireTraderLinkPlatformRequestScope(request.headers, { environment: process.env }).userId;
    const slug = withReadonlyPlatformDatabase({}, db => db.prepare<[string, string], { slug: string }>(
      "SELECT slug FROM traderlink_communities WHERE community_id=? AND owner_user_id=? AND status!='removed'",
    ).get(communityId, userId)?.slug);
    return slug ? { slug, userId } : null;
  }
  let owner: ReturnType<typeof readOwner> = null;
  try { owner = readOwner(); } catch { /* Authentication failure */ }
  if (!owner) return new Response(null, { status: 403, headers });
  const { slug, userId } = owner;
  const page = new URL(`/communities/${encodeURIComponent(slug)}/partner-channels`, configuration.origin);
  try {
    const body = await request.text();
    if (Buffer.byteLength(body) > 256) return new Response(null, { status: 413, headers });
    const data = new URLSearchParams(body);
    const country = (data.get("country") ?? "").trim().toUpperCase();
    const existing = data.get("method") === "existing";
    let link: string | null;
    if (native) {
      const result = await withPartnerAlertRequestRuntime(request,
        runtime => runtime.startStripeSellerSetup(request, communityId, userId, existing ? "oauth" : "hosted", country, page.href),
        undefined, () => null);
      if (!result) throw new Error("Stripe seller setup is unavailable.");
      if (result.kind === "connected") return new Response(null, { status: 409, headers });
      link = result.url;
    } else if (preview) {
      link = await withStripeOnboarding(preview, async (service, oauth) => {
        if (existing) {
          if (!oauth || await service.status(communityId, userId) !== "unconnected") throw new Error("Existing seller link unavailable.");
          return oauth.start(communityId, userId, slug);
        }
        return service.start(communityId, userId, country, page.href, `${page.href}?stripe=refresh`, () => {
          const current = readOwner();
          return current?.slug === slug && current.userId === userId;
        });
      });
    } else throw new Error("Stripe seller setup is unavailable.");
    return Response.json({ url: link ?? page.href }, { headers });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
