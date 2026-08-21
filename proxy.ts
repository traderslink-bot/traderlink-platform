import { NextResponse, type NextRequest } from "next/server";

import { areTraderLinkPlatformAiFeaturesEnabled } from
  "@/src/modules/platform/contracts/platform-ai-launch-state";

const AI_PAGE_ROOTS = ["/ai-chat", "/ai-reviews", "/account/ai"] as const;

function isPageRoot(pathname: string): boolean {
  return AI_PAGE_ROOTS.some((root) => pathname === root || pathname === `${root}/`);
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
  if (areTraderLinkPlatformAiFeaturesEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const readRequest = request.method === "GET" || request.method === "HEAD";

  if (readRequest && isPageRoot(pathname)) {
    return NextResponse.next();
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
  if (readRequest && pathname.startsWith("/help/ai-chat")) {
    return NextResponse.redirect(new URL("/ai-chat", request.url));
  }
  if (readRequest && pathname.startsWith("/help/ai-reviews")) {
    return NextResponse.redirect(new URL("/ai-reviews", request.url));
  }
  if (readRequest && pathname.startsWith("/help/paid-plan")) {
    return NextResponse.redirect(new URL("/account/ai", request.url));
  }

  return comingSoonResponse();
}

export const config = {
  matcher: [
    "/ai-chat/:path*",
    "/ai-reviews/:path*",
    "/account/ai/:path*",
    "/help/ai-chat/:path*",
    "/help/ai-reviews/:path*",
    "/help/paid-plan/:path*",
    "/api/coach/chat/:path*",
    "/api/coach/latest/:path*",
    "/api/cron/ai-reviews/:path*",
    "/api/cron/ai-review-calendar/:path*",
    "/api/billing/whop/:path*",
    "/api/webhooks/whop/:path*",
  ],
};
