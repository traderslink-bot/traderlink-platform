import type { createPartnerAlertStripeSandboxCheckout } from "./partner-alert-stripe-checkout";

import type { PartnerAlertCatalogItem } from "./partner-alert-catalog-read";

type Service = Pick<ReturnType<typeof createPartnerAlertStripeSandboxCheckout>, "checkout" | "invoiceWebhook">;
type Binding = Readonly<{
  origin: string;
  service: Service;
  readCatalog?: (userId: string) => readonly PartnerAlertCatalogItem[] | null | Promise<readonly PartnerAlertCatalogItem[] | null>;
  canOfferCheckout: (userId: string, communityId: string, offerKey: string) => boolean;
}>;

const key = Symbol.for("traderlink.partner-alerts.stripe-sandbox");
const runtime = globalThis as typeof globalThis & { [key]?: Binding };

/** Process-local sandbox composition. The ordinary catalog and Whop routes
 * continue to use their normal providers unless an isolated test binds this. */
export function bindPartnerAlertStripeSandbox(binding: Binding): () => void {
  const origin = new URL(binding.origin);
  if (runtime[key] || origin.origin !== binding.origin || origin.protocol !== "http:"
    || !["127.0.0.1", "localhost"].includes(origin.hostname)) throw new Error("Invalid isolated catalog binding.");
  const installed = Object.freeze({ ...binding });
  runtime[key] = installed;
  return () => { if (runtime[key] === installed) delete runtime[key]; };
}

function developmentBinding(): Binding | undefined {
  const environment = process.env;
  if (environment.NODE_ENV !== "development" || environment.TRADERLINK_PAID_OWNER_PREVIEW !== "1"
    || environment.TRADERLINK_PLATFORM_PUBLIC_ORIGIN !== "http://127.0.0.1:3039") return undefined;
  const backend = new URL(environment.PAID_STRIPE_CATALOG_BACKEND ?? "http://127.0.0.1");
  const userId = environment.PAID_STRIPE_CATALOG_BUYER;
  const session = environment.PAID_STRIPE_CATALOG_SESSION;
  const bridgeKey = environment.PAID_STRIPE_CATALOG_BRIDGE_KEY;
  if (backend.protocol !== "http:" || backend.hostname !== "127.0.0.1" || !backend.port
    || !userId || !session || !bridgeKey || !environment.PAID_STRIPE_CATALOG_ITEMS) return undefined;
  const items = JSON.parse(environment.PAID_STRIPE_CATALOG_ITEMS) as readonly PartnerAlertCatalogItem[];
  const allowed = (buyer: string, communityId: string, offerKey: string) => buyer === userId
    && items.some(item => item.communityId === communityId && item.offerKey === offerKey);
  const relay = async (request: Request, path: string) => {
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("content-length");
    const body = await request.text();
    return fetch(new URL(path, backend.origin), { method: "POST", headers, redirect: "error",
      ...(body ? { body } : {}) });
  };
  return {
    origin: environment.TRADERLINK_PLATFORM_PUBLIC_ORIGIN, canOfferCheckout: allowed,
    async readCatalog(buyer) {
      if (buyer !== userId) return null;
      const response = await fetch(new URL("/__stripe-catalog-state", backend.origin), {
        headers: { "x-partner-qa-session": bridgeKey }, cache: "no-store", redirect: "error",
      });
      if (!response.ok) return null;
      const active = await response.json() as readonly string[];
      return items.map(item => ({ ...item, access: active.includes(item.offerKey) ? "subscribed" : "available" }));
    },
    service: {
      async checkout(request, communityId, offerKey) {
        const signedIn = (request.headers.get("cookie") ?? "").split(";").some(part => part.trim() === `tl_platform_session=${session}`);
        if (!signedIn || !allowed(userId, communityId, offerKey)) return new Response(null, { status: 403 });
        return relay(request, new URL(request.url).pathname);
      },
      invoiceWebhook: request => relay(request, "/api/partner-channels/stripe-sandbox/webhook"),
    },
  };
}

export function partnerAlertStripeSandbox(request: Request) {
  const origin = new URL(request.url).origin;
  const installed = runtime[key];
  if (installed?.origin === origin) return installed;
  const preview = developmentBinding();
  return preview && (origin === preview.origin || origin === "http://localhost:3039") ? preview : undefined;
}
