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

  appendAcademySetCookieHeader(response, name, value, options);

  if (options.domain) {
    appendAcademySetCookieHeader(
      response,
      name,
      "",
      buildHostOnlyOptions(options, 0),
    );
  }
}

export function deleteAcademyCookie(
  response: NextResponse,
  request: NextRequest,
  name: string,
): void {
  const options = buildAcademyCookieOptions(request, 0);

  if (options.domain) {
    appendAcademySetCookieHeader(response, name, "", options);
    appendAcademySetCookieHeader(
      response,
      name,
      "",
      buildHostOnlyOptions(options, 0),
    );
    return;
  }

  appendAcademySetCookieHeader(response, name, "", options);
}

function buildHostOnlyOptions(
  options: AcademyCookieOptions,
  maxAge: number,
): AcademyCookieOptions {
  return {
    httpOnly: options.httpOnly,
    maxAge,
    path: options.path,
    sameSite: options.sameSite,
    secure: options.secure,
  };
}

function appendAcademySetCookieHeader(
  response: NextResponse,
  name: string,
  value: string,
  options: AcademyCookieOptions,
): void {
  const cookieParts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
  ];

  if (options.domain) {
    cookieParts.push(`Domain=${options.domain}`);
  }

  if (options.secure) {
    cookieParts.push("Secure");
  }

  if (options.httpOnly) {
    cookieParts.push("HttpOnly");
  }

  cookieParts.push("SameSite=Lax");

  response.headers.append("Set-Cookie", cookieParts.join("; "));
}
