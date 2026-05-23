import type { NextRequest, NextResponse } from "next/server";

interface AcademyCookieOptions {
  domain?: string;
  httpOnly: true;
  maxAge: number;
  path: "/";
  sameSite: "lax";
  secure: boolean;
}

const TRADERSLINK_COOKIE_DOMAIN = ".traderslink.pro";

export function getAcademyCookieDomain(hostname: string): string | undefined {
  const normalizedHostname = hostname.toLowerCase();

  return normalizedHostname === "traderslink.pro" ||
    normalizedHostname.endsWith(".traderslink.pro")
    ? TRADERSLINK_COOKIE_DOMAIN
    : undefined;
}

export function buildAcademyCookieOptions(
  request: NextRequest,
  maxAge: number,
): AcademyCookieOptions {
  const domain = getAcademyCookieDomain(request.nextUrl.hostname);

  return {
    ...(domain ? { domain } : {}),
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

export function setAcademyCookie(
  response: NextResponse,
  request: NextRequest,
  name: string,
  value: string,
  maxAge: number,
): void {
  const options = buildAcademyCookieOptions(request, maxAge);

  if (options.domain) {
    expireAcademyHostCookie(response, name);
  }

  response.cookies.set(name, value, options);
}

export function deleteAcademyCookie(
  response: NextResponse,
  request: NextRequest,
  name: string,
): void {
  expireAcademyHostCookie(response, name);

  const options = buildAcademyCookieOptions(request, 0);

  if (options.domain) {
    response.cookies.set(name, "", options);
  }
}

function expireAcademyHostCookie(
  response: NextResponse,
  name: string,
): void {
  response.cookies.set(name, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
