import "server-only";

import { createHash, createHmac } from "node:crypto";

import type {
  JournalAdminPermission,
  JournalAdminScope,
} from "../../contracts/journal-admin-scope";
import {
  JOURNAL_ADMIN_IDEMPOTENCY_HEADER,
  JOURNAL_ADMIN_REQUEST_HEADER,
} from "../../contracts/journal-admin-request";
import { platformFailure } from "../database/platform-migration-contract";

export {
  JOURNAL_ADMIN_IDEMPOTENCY_HEADER,
  JOURNAL_ADMIN_REQUEST_HEADER,
} from "../../contracts/journal-admin-request";
export const JOURNAL_ADMIN_RATE_LIMIT_SECRET_ENV =
  "TRADERLINK_PLATFORM_ADMIN_RATE_LIMIT_SECRET" as const;

type RateCategory = "access" | "sensitive";
type WindowEntry = { count: number; startedAtMs: number };

const RATE_WINDOW_MS = 60_000;
const RATE_LIMITS: Readonly<Record<RateCategory, number>> = Object.freeze({
  access: 120,
  sensitive: 12,
});
const MAX_RATE_KEYS = 2_048;
const windows = new Map<string, WindowEntry>();

function secret(environment: NodeJS.ProcessEnv): string {
  const configured = environment[JOURNAL_ADMIN_RATE_LIMIT_SECRET_ENV];
  if (configured && configured.length >= 32 && configured.length <= 512) {
    return configured;
  }
  const localToken = environment.TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN;
  if (
    environment.NODE_ENV === "development" &&
    environment.VERCEL_ENV === undefined &&
    localToken &&
    /^[A-Za-z0-9_-]{43}$/u.test(localToken)
  ) {
    return localToken;
  }
  platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
}

function remoteAddressClass(headers: Headers): string {
  const host = headers.get("host")?.toLowerCase() ?? "";
  if (
    /^(?:localhost|127\.0\.0\.1)(?::[0-9]{1,5})?$/u.test(host) ||
    /^\[::1\](?::[0-9]{1,5})?$/u.test(host)
  ) return "loopback";
  const supplied = headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ??
    "unavailable";
  if (
    supplied.length > 64 ||
    !/^(?:[0-9]{1,3}(?:\.[0-9]{1,3}){3}|[0-9a-f:]+|unavailable)$/iu.test(supplied)
  ) return "unavailable";
  return supplied.toLowerCase();
}

function keyedDigest(secretValue: string, value: string): string {
  return createHmac("sha256", secretValue).update(value, "utf8").digest("hex");
}

function removeExpired(nowMs: number): void {
  for (const [key, entry] of windows) {
    if (nowMs - entry.startedAtMs >= RATE_WINDOW_MS) windows.delete(key);
  }
  while (windows.size >= MAX_RATE_KEYS) {
    const oldest = windows.keys().next().value as string | undefined;
    if (!oldest) break;
    windows.delete(oldest);
  }
}

export function consumeJournalAdminRateLimit(input: Readonly<{
  category: RateCategory;
  environment?: NodeJS.ProcessEnv;
  headers: Headers;
  now?: () => Date;
  userId: string;
}>): void {
  const environment = input.environment ?? process.env;
  const nowMs = (input.now?.() ?? new Date()).getTime();
  const secretValue = secret(environment);
  const day = new Date(nowMs).toISOString().slice(0, 10);
  const addressDigest = keyedDigest(
    secretValue,
    `traderlink-admin-address-v1\u001f${day}\u001f${remoteAddressClass(input.headers)}`,
  );
  const key = keyedDigest(
    secretValue,
    `traderlink-admin-rate-v1\u001f${input.category}\u001f${input.userId}\u001f${addressDigest}`,
  );
  const current = windows.get(key);
  if (!current || nowMs - current.startedAtMs >= RATE_WINDOW_MS) {
    removeExpired(nowMs);
    windows.set(key, { count: 1, startedAtMs: nowMs });
    return;
  }
  if (current.count >= RATE_LIMITS[input.category]) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_RATE_LIMITED");
  }
  current.count += 1;
}

export function requireJournalAdminPermission(
  scope: JournalAdminScope,
  permission: JournalAdminPermission,
): void {
  if (!scope.permissions.includes(permission)) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  }
}

export function requireJournalAdminMutationRequest(request: Request): void {
  if (request.method !== "POST" && request.method !== "DELETE") {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  if (
    request.headers.get("sec-fetch-site") !== "same-origin" ||
    request.headers.get(JOURNAL_ADMIN_REQUEST_HEADER) !== "1"
  ) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  }
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  }
  if (
    parsed.username ||
    parsed.password ||
    parsed.host.toLowerCase() !== host.toLowerCase() ||
    !["http:", "https:"].includes(parsed.protocol)
  ) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  }
}

export function journalAdminMutationCorrelation(input: Readonly<{
  requestHeaders: Headers;
  scope: JournalAdminScope;
  action: string;
  targetKind: string;
  internalTargetId: string;
}>): string {
  const key = input.requestHeaders.get(JOURNAL_ADMIN_IDEMPOTENCY_HEADER);
  if (!key ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
      .test(key)) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  return createHash("sha256").update([
    "traderlink-journal-admin-mutation-v1",
    input.scope.userId,
    input.scope.mode,
    input.action,
    input.targetKind,
    input.internalTargetId,
    key,
  ].join("\u001f"), "utf8").digest("hex");
}

export function journalAdminPrivateHeaders(
  additions: HeadersInit = {},
): Headers {
  const headers = new Headers(additions);
  headers.set("cache-control", "private, no-store, max-age=0");
  headers.set("pragma", "no-cache");
  headers.set("x-content-type-options", "nosniff");
  headers.append("vary", "Cookie");
  return headers;
}

export function resetJournalAdminRateLimitsForTests(): void {
  if (process.env.NODE_ENV !== "test") {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  }
  windows.clear();
}
