import "server-only";

import type { NextRequest } from "next/server";

/**
 * Railway forwards a request to the container's bound host (`0.0.0.0:8080`).
 * Production redirects must instead use the configured public Discord callback
 * host, which is also the hostname registered with Discord.
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
