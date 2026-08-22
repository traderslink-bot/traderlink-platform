import "server-only";

import type { NextRequest } from "next/server";

/**
 * Railway forwards a request to the container's bound host (`0.0.0.0:8080`).
 * Production redirects must instead use the configured public OAuth host.
 * The Discord callback is the existing canonical source for that shared host.
 */
export function resolvePlatformPublicOrigin(request: NextRequest): string {
  if (process.env.NODE_ENV !== "production") {
    return request.nextUrl.origin;
  }

  const configuredCallback = process.env.DISCORD_REDIRECT_URI;
  if (!configuredCallback) {
    return request.nextUrl.origin;
  }

  try {
    return new URL(configuredCallback).origin;
  } catch {
    return request.nextUrl.origin;
  }
}
