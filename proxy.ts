import { COMMUNITY_HISTORY_HEADER, classifyCommunityHistoryEntry } from "@/src/modules/communities/contracts/community-history-entry";
import { NextResponse, type NextRequest } from "next/server";

import { areTraderLinkPlatformAiFeaturesEnabled } from
  "@/src/modules/platform/contracts/platform-ai-launch-state";

const AI_PAGE_ROOTS = ["/ai-chat", "/ai-reviews", "/account/ai"] as const;
const dashboardHostname = "app.traderslink.pro";
const publicHostname = "traderslink.pro";

function requestHostname(request: NextRequest): string | undefined {
  return (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))
    ?.split(",")[0]
    ?.trim()
    .split(":")[0]
    ?.toLowerCase();
}

function isPageRoot(pathname: string): boolean {
  return AI_PAGE_ROOTS.some((root) => pathname === root || pathname === `${root}/`);
}

function continueRequest(request: NextRequest, proxyEntryEpochMs: number): NextResponse {
  const headers = new Headers(request.headers);
  headers.set("x-traderlink-page-path", request.nextUrl.pathname);
  // The browser cannot select a trusted history context through request headers.
  headers.delete(COMMUNITY_HISTORY_HEADER);
  const history = classifyCommunityHistoryEntry(request.nextUrl.pathname, request.nextUrl.searchParams, request.method);
  if (history) headers.set(COMMUNITY_HISTORY_HEADER, history === "invalid" ? "invalid" : JSON.stringify(history));
  const returnUrl = request.nextUrl.clone();
  if (returnUrl.searchParams.has("_rsc")) returnUrl.searchParams.delete("_rsc");
  headers.set("x-traderlink-page-return-to", returnUrl.pathname + returnUrl.search);
  // Never trust a browser-supplied diagnostic ID on any route.
  headers.delete("x-traderlink-speed-id");
  headers.delete("x-traderlink-speed-start-ms");
  if (
    request.method === "GET" &&
    (
      request.nextUrl.pathname === "/workspace" || request.nextUrl.pathname === "/workspace/" ||
      request.nextUrl.pathname === "/analytics/trade-explorer" ||
      request.nextUrl.pathname === "/analytics/trade-explorer/"
    )
  ) {
    const traceId = globalThis.crypto.randomUUID();
    headers.set("x-traderlink-speed-id", traceId);
    headers.set("x-traderlink-speed-start-ms", String(proxyEntryEpochMs));
    const response = NextResponse.next({ request: { headers } });
    response.headers.set("x-traderlink-speed-id", traceId);
    return response;
  }
  return NextResponse.next({ request: { headers } });
}

/** Classification only. The route still verifies the real installed staging
 * image, native session and selected Discord subject before OAuth or linking.
 * No AI page, webhook, live flow or billing entitlement is enabled here.
 */
function isIsolatedStagingWhopIdentityRequest(request: NextRequest): boolean {
  const env = process.env;
  const selected = (env.TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT ?? "")
    .split(",").map(value => value.trim());
  return request.method === "GET"
    && ["/api/billing/whop/connect", "/api/billing/whop/callback"].includes(request.nextUrl.pathname)
    && env.NODE_ENV === "production"
    && env.TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE === "disabled_isolated_staging"
    && env.RAILWAY_PROJECT_ID === "49fc9197-07c9-45c7-b528-57d0393c2cca"
    && env.RAILWAY_ENVIRONMENT_ID === "9e079dd4-f3f3-4872-9b00-adbd3000c485"
    && env.RAILWAY_SERVICE_ID === "4d264aca-510c-4f5e-bc28-e89e526b8008"
    && env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN === "https://traderlink-platform-staging-staging.up.railway.app"
    && selected.length === 2 && new Set(selected).size === 2
    && selected.every(value => /^\d{5,22}$/.test(value));
}

function comingSoonResponse(): NextResponse {
  return NextResponse.json(
    Object.freeze({
      message: "This feature is coming soon.",
      ok: false,
      state: "coming_soon",
    }),
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Retry-After": "86400",
      },
      status: 503,
    },
  );
}

export function proxy(request: NextRequest): NextResponse {
  const proxyEntryEpochMs = Date.now();
  const { pathname } = request.nextUrl;

  if (
    (request.method === "GET" || request.method === "HEAD") &&
    requestHostname(request) === dashboardHostname &&
    (pathname === "/news" || pathname.startsWith("/news/"))
  ) {
    const destination = request.nextUrl.clone();
    destination.protocol = "https:";
    destination.host = publicHostname;
    destination.port = "";
    return NextResponse.redirect(destination, 308);
  }

  if (
    request.method === "GET" && pathname === "/" &&
    requestHostname(request) === dashboardHostname &&
    Boolean(request.cookies.get(process.env.NODE_ENV === "production" ? "__Host-tl_platform_session" : "tl_platform_session")?.value)
  ) {
    const response = NextResponse.redirect(
      new URL("/dashboard-entry", `https://${dashboardHostname}`), 307,
    );
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  }

  const guarded = ["/ai-chat", "/ai-reviews", "/account/ai", "/help", "/api/coach/chat", "/api/coach/latest", "/api/cron/ai-reviews", "/api/cron/ai-review-calendar", "/api/billing/whop", "/api/webhooks/whop"]
    .some(root => pathname === root || pathname.startsWith(root + "/"));
  if (!guarded) return continueRequest(request, proxyEntryEpochMs);

  if (pathname === "/help" || pathname.startsWith("/help/")) {
    if (requestHostname(request) === dashboardHostname) {
      const destination = request.nextUrl.clone();
      destination.protocol = "https:";
      destination.host = publicHostname;
      destination.port = "";
      return NextResponse.redirect(destination, 308);
    }
    return continueRequest(request, proxyEntryEpochMs);
  }

  if (isIsolatedStagingWhopIdentityRequest(request) || areTraderLinkPlatformAiFeaturesEnabled()) {
    return continueRequest(request, proxyEntryEpochMs);
  }

  const readRequest = request.method === "GET" || request.method === "HEAD";

  if (readRequest && isPageRoot(pathname)) {
    return continueRequest(request, proxyEntryEpochMs);
  }

  if (readRequest && pathname.startsWith("/ai-chat/")) {
    return NextResponse.redirect(new URL("/ai-chat", request.url));
  }
  if (readRequest && pathname.startsWith("/ai-reviews/")) {
    return NextResponse.redirect(new URL("/ai-reviews", request.url));
  }
  if (readRequest && pathname.startsWith("/account/ai/")) {
    return NextResponse.redirect(new URL("/account/ai", request.url));
  }

  return comingSoonResponse();
}

export const config = {
  matcher: ["/((?!(?:api/internal/stock-screeners-pack|api/internal/screening/v1/snapshot)/?$).*)"],
};
