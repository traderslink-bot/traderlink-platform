import "server-only";

import type { NextRequest } from "next/server";

/**
 * Railway forwards a request to the container's bound host (`0.0.0.0:8080`).
 * Production redirects must instead use the configured public OAuth host.
 * The Discord callback is the existing canonical source for that shared host.
 */
export function resolvePlatformPublicOrigin(request: NextRequest): string {
  const configuredOrigin = process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN;
  if (configuredOrigin) {
    const parsed = new URL(configuredOrigin);
    const localHttp = process.env.NODE_ENV !== "production" && parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if ((!localHttp && parsed.protocol !== "https:") || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error("Invalid Platform public origin");
    return parsed.origin;
  }
  if (process.env.NODE_ENV !== "production") return request.nextUrl.origin;
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
