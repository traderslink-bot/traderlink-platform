import {
  enqueueLoginMail,
  startPlatformLoginMailWorker,
} from "./platform-login-mail-queue";
import "server-only";
import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import {
  PlatformLoginError,
  PlatformLoginService,
} from "./platform-login-service";
import { withPlatformDatabase } from "../database/open-platform-database";
import { resolvePlatformPublicOrigin } from "./platform-public-origin";
import { TRADERLINK_PLATFORM_SESSION_COOKIE } from "./platform-session-service";
export function loginSession(request: NextRequest) {
  return request.cookies.get(TRADERLINK_PLATFORM_SESSION_COOKIE)?.value ?? null;
}
export function loginReturnTo(value: unknown, fallback = "/workspace") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/u.test(value)
  )
    return fallback;
  const parsed = new URL(value, "https://traderslink.pro");
  return parsed.origin === "https://traderslink.pro" &&
    !parsed.pathname.startsWith("/api/auth/")
    ? parsed.pathname + parsed.search
    : fallback;
}
export async function readLoginBody(
  request: NextRequest,
): Promise<Record<string, unknown>> {
  if (
    request.headers.get("origin") !== resolvePlatformPublicOrigin(request) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new PlatformLoginError("invalid");
  const reader = request.body?.getReader();
  if (!reader) throw new PlatformLoginError("invalid");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 8192) {
      await reader.cancel();
      throw new PlatformLoginError("invalid");
    }
    chunks.push(value);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  const content = request.headers.get("content-type")?.split(";")[0];
  if (content === "application/json") {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new PlatformLoginError("invalid");
    for (const field of [
      "action",
      "provider",
      "email",
      "password",
      "name",
      "token",
      "returnTo",
    ]) {
      if (Object.hasOwn(body, field) && typeof body[field] !== "string")
        throw new PlatformLoginError("invalid");
    }
    return body;
  }
  if (content === "application/x-www-form-urlencoded")
    return Object.fromEntries(new URLSearchParams(text));
  throw new PlatformLoginError("invalid");
}
export function loginOperation<T>(
  operation: (service: PlatformLoginService) => T,
  mailOrigin?: string,
): T {
  const result = withPlatformDatabase({ mode: "runtime" }, (db) =>
    operation(
      new PlatformLoginService(db, {
        usableProviders: [
          "email",
          ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? ["google" as const]
            : []),
          ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
            ? ["discord" as const]
            : []),
        ],
        queueMail: mailOrigin
          ? (mail) =>
              enqueueLoginMail(
                db,
                { ...mail, origin: mailOrigin },
                process.env.TRADERLINK_LOGIN_RATE_LIMIT_SECRET ?? "",
              )
          : undefined,
      }),
    ),
  );
  if (mailOrigin) startPlatformLoginMailWorker();
  return result;
}
export function throttleLogin(
  request: NextRequest,
  action: string,
  address = "",
) {
  const secret = process.env.TRADERLINK_LOGIN_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Login is not configured.");
  // Only deployment-trusted proxy headers may identify peers; fall back to a shared bucket.
  const trustedHeader = process.env.TRADERLINK_LOGIN_TRUSTED_IP_HEADER;
  const peer =
    trustedHeader && /^[a-z-]+$/.test(trustedHeader)
      ? (request.headers.get(trustedHeader) ?? "shared")
      : "shared";
  loginOperation((service) => {
    service.throttle(
      createHmac("sha256", secret)
        .update(action + ":" + peer)
        .digest("hex"),
      peer === "shared" ? 200 : 30,
    );
    if (address)
      service.throttle(
        createHmac("sha256", secret)
          .update(action + ":" + address.toLowerCase())
          .digest("hex"),
        10,
      );
  });
}
