import type { NextRequest, NextResponse } from "next/server";

import { resolvePlatformPublicOrigin } from "./platform-public-origin";

const TRADERSLINK_COOKIE_DOMAIN = ".traderslink.pro";

type CookieOptions = Readonly<{
  domain?: string;
  maxAge?: number;
  secure: boolean;
}>;

function cookieOptions(maxAge?: number): CookieOptions {
  return Object.freeze({
    ...(maxAge === undefined ? {} : { maxAge }),
    secure: process.env.NODE_ENV === "production",
  });
}

function appendCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: CookieOptions,
): void {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (options.maxAge !== undefined) parts.splice(2, 0, `Max-Age=${options.maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.secure) parts.push("Secure");
  response.headers.append("Set-Cookie", parts.join("; "));
}

export function setPlatformSessionAuthCookie(
  response: NextResponse,
  request: NextRequest,
  name: string,
  value: string,
): void {
  const options = cookieOptions();
  appendCookie(response, platformAuthCookieName(name), value, options);
  clearLegacyCookie(response, request, name, options.secure);
}

export function setPlatformAuthCookie(
  response: NextResponse,
  request: NextRequest,
  name: string,
  value: string,
  maxAge: number,
): void {
  const options = cookieOptions(maxAge);
  appendCookie(response, platformAuthCookieName(name), value, options);
  clearLegacyCookie(response, request, name, options.secure);
}

export function deletePlatformAuthCookie(
  response: NextResponse,
  request: NextRequest,
  name: string,
): void {
  const options = cookieOptions(0);
  appendCookie(response, platformAuthCookieName(name), "", options);
  clearLegacyCookie(response, request, name, options.secure);
}

export function platformAuthCookieName(name: string): string {
  return process.env.NODE_ENV === "production" && !name.startsWith("__Host-") ? `__Host-${name}` : name;
}

function clearLegacyCookie(response: NextResponse, request: NextRequest, name: string, secure: boolean): void {
  if (process.env.NODE_ENV !== "production") return;
  const legacy = name.replace(/^__Host-/u, "");
  appendCookie(response, legacy, "", { maxAge: 0, secure });
  const hostname = new URL(resolvePlatformPublicOrigin(request)).hostname.toLowerCase();
  if (hostname === "traderslink.pro" || hostname.endsWith(".traderslink.pro")) {
    appendCookie(response, legacy, "", { maxAge: 0, secure, domain: TRADERSLINK_COOKIE_DOMAIN });
  }
}
