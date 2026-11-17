import { PlatformPremiumError, premiumInteger, premiumSnowflake } from "../../contracts/platform-premium-access";
import type { PlatformPremiumDiscordResponse, PlatformPremiumDiscordRest } from "./platform-premium-discord-client";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAXIMUM_RESPONSE_BYTES = 1_048_576;

export type NativePlatformPremiumDiscordConfiguration = Readonly<{
  enabled?: boolean;
  /** Separate runtime clearance for the privileged member-list read. */
  censusReadEnabled?: boolean;
  guildId: string;
  botUserId: string;
  paidRoleId: string;
  /** Supplied only by the server; never loaded or refreshed by this adapter. */
  botToken: string;
  timeoutMs?: number;
  maximumResponseBytes?: number;
}>;
type Configuration = Readonly<{
  enabled: boolean; censusReadEnabled: boolean;
  guildId: string; botUserId: string; paidRoleId: string; botToken: string;
  timeoutMs: number; maximumResponseBytes: number;
}>;
type RequestInput = Parameters<PlatformPremiumDiscordRest["request"]>[0];
type PreparedRequest = Readonly<{ method: "GET" | "PUT" | "DELETE"; url: string; headers: Headers }>;

function invalid(): never { throw new PlatformPremiumError("invalid"); }

/** Snapshot plain data only; extra fields cannot inject fetch options or headers. */
function dataRecord(value: unknown, required: readonly string[], optional: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return invalid();
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const result: Record<string, unknown> = Object.create(null);
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key !== "string" || (!required.includes(key) && !optional.includes(key))) return invalid();
    const descriptor = descriptors[key];
    if (!descriptor?.enumerable || !("value" in descriptor)) return invalid();
    result[key] = descriptor.value;
  }
  if (required.some(key => !Object.hasOwn(result, key))) return invalid();
  return result;
}
function flag(value: unknown): boolean {
  if (value === undefined) return false;
  if (typeof value !== "boolean") return invalid();
  return value;
}
function snowflake(value: unknown): string {
  if (typeof value !== "string" || /[^0-9]/u.test(value)) return invalid();
  return premiumSnowflake(value);
}
function integer(value: unknown, minimum: number, maximum: number): number {
  if (typeof value !== "number") return invalid();
  return premiumInteger(value, minimum, maximum);
}
function configuration(input: NativePlatformPremiumDiscordConfiguration): Configuration {
  try {
    const value = dataRecord(input, ["guildId", "botUserId", "paidRoleId", "botToken"],
      ["enabled", "censusReadEnabled", "timeoutMs", "maximumResponseBytes"]);
    const guildId = snowflake(value.guildId), botUserId = snowflake(value.botUserId), paidRoleId = snowflake(value.paidRoleId);
    if (paidRoleId === guildId || typeof value.botToken !== "string" || value.botToken.length < 1
      || value.botToken.length > 8192 || /[^A-Za-z0-9._-]/u.test(value.botToken)) return invalid();
    return Object.freeze({ enabled: flag(value.enabled), censusReadEnabled: flag(value.censusReadEnabled),
      guildId, botUserId, paidRoleId, botToken: value.botToken,
      timeoutMs: value.timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : integer(value.timeoutMs, 100, 30_000),
      maximumResponseBytes: value.maximumResponseBytes === undefined ? DEFAULT_MAXIMUM_RESPONSE_BYTES
        : integer(value.maximumResponseBytes, 1, 8_388_608) });
  } catch { return invalid(); }
}

function allowedPath(method: PreparedRequest["method"], path: string, selected: Configuration): boolean {
  const guild = `/guilds/${selected.guildId}`;
  if (method === "GET") {
    if (path === "/users/@me" || path === `${guild}/roles` || path === `${guild}/channels`) return true;
    const member = /^\/guilds\/([1-9][0-9]{0,19})\/members\/([1-9][0-9]{0,19})$/u.exec(path);
    if (member) return member[1] === selected.guildId && snowflake(member[2]) === selected.botUserId;
    const page = /^\/guilds\/([1-9][0-9]{0,19})\/members\?limit=([1-9][0-9]{0,3})(?:&after=([1-9][0-9]{0,19}))?$/u.exec(path);
    if (!page || !selected.censusReadEnabled || page[1] !== selected.guildId) return false;
    integer(Number(page[2]), 1, 1000);
    if (page[3] !== undefined) snowflake(page[3]);
    return true;
  }
  const role = /^\/guilds\/([1-9][0-9]{0,19})\/members\/([1-9][0-9]{0,19})\/roles\/([1-9][0-9]{0,19})$/u.exec(path);
  return Boolean(role && role[1] === selected.guildId && role[3] === selected.paidRoleId && snowflake(role[2]));
}
function prepare(input: RequestInput, selected: Configuration): PreparedRequest {
  try {
    const value = dataRecord(input, ["method", "path"], ["auditReason"]);
    const method = value.method, path = value.path;
    if ((method !== "GET" && method !== "PUT" && method !== "DELETE") || typeof path !== "string"
      || path.length > 256 || /[^\x21-\x7e]/u.test(path) || path.includes("%") || path.includes("\\")
      || !allowedPath(method, path, selected)) return invalid();
    const headers = new Headers({ authorization: `Bot ${selected.botToken}`, accept: "application/json",
      "cache-control": "no-store, private", pragma: "no-cache",
      "user-agent": "DiscordBot (https://traderslink.pro, 1.0)" });
    if (value.auditReason !== undefined) {
      // This is the existing client's exact server-generated audit format.
      if (method === "GET" || typeof value.auditReason !== "string"
        || /[^\x20-\x7e]/u.test(value.auditReason)
        || !/^Premium reconciliation [A-Za-z0-9_:-]{1,160}$/u.test(value.auditReason)) return invalid();
      headers.set("x-audit-log-reason", encodeURIComponent(value.auditReason));
    }
    return Object.freeze({ method, url: `${DISCORD_API_BASE}${path}`, headers });
  } catch { return invalid(); }
}
function requireTime(controller: AbortController, deadline: number): void {
  if (controller.signal.aborted || performance.now() >= deadline) throw new PlatformPremiumError("unavailable");
}

/** Concrete transport for the existing client, not a source of role authority.
 * Disabled by default. Import/construction read no environment, DB or credential
 * store and perform no I/O. There is no retry, queue, token refresh or startup.
 * This class is deliberately not installed in the dormant runtime factory. */
export class NativePlatformPremiumDiscordRest implements PlatformPremiumDiscordRest {
  readonly #configuration: Configuration;

  constructor(input: NativePlatformPremiumDiscordConfiguration) {
    this.#configuration = configuration(input);
  }

  async request(input: RequestInput): Promise<PlatformPremiumDiscordResponse> {
    const selected = this.#configuration;
    if (!selected.enabled) throw new PlatformPremiumError("unbound");
    const prepared = prepare(input, selected);
    const controller = new AbortController();
    const deadline = performance.now() + selected.timeoutMs;
    const timer = setTimeout(() => controller.abort(), selected.timeoutMs);
    let response: Response | null = null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let bodyComplete = false, completed = false;
    try {
      // All path/token/header preparation above is synchronous. This invokes
      // native fetch before the first await, preserving the caller's immediate
      // stillCurrent fence. Never insert an async limiter/refresh before it.
      response = await globalThis.fetch(prepared.url, { method: prepared.method, headers: prepared.headers,
        redirect: "error", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer",
        signal: controller.signal });
      requireTime(controller, deadline);
      if (response.redirected || response.url !== prepared.url || !Number.isInteger(response.status)
        || response.status < 200 || response.status > 599) throw new PlatformPremiumError("unavailable");
      const length = response.headers.get("content-length");
      if (length !== null && (length.length < 1 || length.length > 20 || /[^0-9]/u.test(length)
        || BigInt(length) > BigInt(selected.maximumResponseBytes))) throw new PlatformPremiumError("unavailable");
      let payload: Uint8Array | null = null; let bytes = 0;
      if (response.body !== null) {
        reader = response.body.getReader();
        // One bounded buffer also bounds overhead for arbitrarily small chunks.
        payload = new Uint8Array(selected.maximumResponseBytes);
        for (;;) {
          requireTime(controller, deadline);
          const item = await reader.read();
          requireTime(controller, deadline);
          if (item.done) break;
          if (!(item.value instanceof Uint8Array) || item.value.byteLength > selected.maximumResponseBytes - bytes) {
            throw new PlatformPremiumError("unavailable");
          }
          payload.set(item.value, bytes);
          bytes += item.value.byteLength;
        }
      }
      bodyComplete = true;
      let body: unknown = null;
      if (bytes) {
        if (!payload) throw new PlatformPremiumError("unavailable");
        const text = new TextDecoder("utf-8", { fatal: true }).decode(payload.subarray(0, bytes));
        // Preserve bounded native non-JSON error text as text, never an invented
        // JSON success/error object. The existing client validates every shape.
        try { body = JSON.parse(text); } catch { body = text; }
      }
      requireTime(controller, deadline);
      completed = true;
      // A real empty 204 remains {status:204,body:null}; no status is synthesized.
      return Object.freeze({ status: response.status, body });
    } catch {
      // No raw fetch/parser errors, URLs, provider bodies or credential causes.
      // Once I/O was attempted, the existing role client retains uncertainty.
      throw new PlatformPremiumError("unavailable");
    } finally {
      clearTimeout(timer);
      if (!completed) controller.abort();
      if (reader) {
        if (!bodyComplete) {
          // Aborting and observing cancel rejection must not extend the deadline.
          try { void reader.cancel().catch(() => undefined); } catch { /* Fixed error above. */ }
        }
        try { reader.releaseLock(); } catch { /* Never replace the bounded outcome. */ }
      } else if (!bodyComplete && response?.body) {
        try { void response.body.cancel().catch(() => undefined); } catch { /* Already aborted. */ }
      }
    }
  }
}
