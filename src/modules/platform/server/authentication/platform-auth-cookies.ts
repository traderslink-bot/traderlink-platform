import type { NextRequest, NextResponse } from "next/server";

const TRADERSLINK_COOKIE_DOMAIN = ".traderslink.pro";

type CookieOptions = Readonly<{
  domain?: string;
  maxAge: number;
  secure: boolean;
}>;

function cookieOptions(request: NextRequest, maxAge: number): CookieOptions {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const domain = hostname === "traderslink.pro" ||
      hostname.endsWith(".traderslink.pro")
    ? TRADERSLINK_COOKIE_DOMAIN
    : undefined;
  return Object.freeze({
    ...(domain ? { domain } : {}),
    maxAge,
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
    `Max-Age=${options.maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.secure) parts.push("Secure");
  response.headers.append("Set-Cookie", parts.join("; "));
}

export function setPlatformAuthCookie(
  response: NextResponse,
  request: NextRequest,
  name: string,
  value: string,
  maxAge: number,
): void {
  const options = cookieOptions(request, maxAge);
  appendCookie(response, name, value, options);
  if (options.domain) {
    appendCookie(response, name, "", {
      maxAge: 0,
      secure: options.secure,
    });
  }
}

export function deletePlatformAuthCookie(
  response: NextResponse,
  request: NextRequest,
  name: string,
): void {
  const options = cookieOptions(request, 0);
  appendCookie(response, name, "", options);
  if (options.domain) {
    appendCookie(response, name, "", {
      maxAge: 0,
      secure: options.secure,
    });
  }
}
