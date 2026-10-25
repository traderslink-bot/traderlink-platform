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
  // Never trust a browser-supplied diagnostic ID on any route.
  headers.delete("x-traderlink-speed-id");
  headers.delete("x-traderlink-speed-start-ms");
  if (
    request.method === "GET" &&
    (request.nextUrl.pathname === "/workspace" || request.nextUrl.pathname === "/workspace/")
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
    request.method === "GET" && pathname === "/" &&
    requestHostname(request) === dashboardHostname &&
    Boolean(request.cookies.get("tl_platform_session")?.value)
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
      return NextResponse.redirect(destination, 308);
    }
    return continueRequest(request, proxyEntryEpochMs);
  }

  if (areTraderLinkPlatformAiFeaturesEnabled()) {
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
  matcher: ["/:path*"],
};
