// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";

// Only the session/database adapters are replaced. Authority uses the actual
// active-identity SQL, rate limiter, CSRF guard and audit repository.
const adapters = vi.hoisted(() => ({
  identity: null as unknown,
  database: null as unknown,
}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformAuthenticatedRequestIdentity: () => {
    if (!adapters.identity) throw Error("Invalid or missing session");
    return adapters.identity;
  },
}));
vi.mock("@/src/modules/platform/server/database/open-platform-database", () => ({
  withPlatformDatabase: (_options: unknown, operation: (database: unknown) => unknown) => operation(adapters.database),
}));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: (_options: unknown, operation: (database: unknown) => unknown) => operation(adapters.database),
}));
vi.mock("./watchlist-plan-policy", () => ({ readWatchlistPlanDecisions: () => new Map() }));
vi.mock("@/src/modules/platform/server/membership/platform-membership-access", () => ({
  evaluateMembershipFeature: () => ({ allowed: true }),
}));

import { withWatchlistAdminDatabase } from "./watchlist-admin-authorization";
import { JOURNAL_ADMIN_REQUEST_HEADER, requireJournalAdminMutationRequest } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { canViewWatchlistTicker, canViewPrivateWatchlistTicker, canViewWatchlistAnalysisPrices } from "./watchlist-analysis-visibility";
import { canViewWatchlistLevels } from "./watchlist-levels-visibility";

const owners = ["10000000-0000-4000-8000-000000000001", "10000000-0000-4000-8000-000000000002"];
const member = "10000000-0000-4000-8000-000000000003";
const environment = {
  NODE_ENV: "production",
  TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT: "101,202",
  TRADERLINK_PLATFORM_ADMIN_RATE_LIMIT_SECRET: "synthetic_test_only_not_a_real_key_1234567890",
} as NodeJS.ProcessEnv;
const headers = new Headers({ host: "app.example.test", "x-request-id": "synthetic-owner-request" });
let db: Database.Database;
const identity = (userId: string) => ({ mode: "platform_session", sessionId: "synthetic", scope: { userId }, discord: null });
const run = (now = "2026-11-02T01:30:00.000Z") => withWatchlistAdminDatabase(headers, (_db, scope) => scope.userId, {
  environment, now: () => new Date(now),
});

beforeEach(() => {
  for (const [key, value] of Object.entries(environment)) vi.stubEnv(key, value);
  vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", "synthetic_premium");
  db = new Database(":memory:");
  adapters.database = db;
  adapters.identity = null;
  db.exec(`CREATE TABLE platform_auth_identities(user_id TEXT, auth_provider TEXT, auth_subject TEXT, status TEXT);
    CREATE TABLE platform_admin_audit_events(audit_event_id TEXT,actor_kind TEXT,actor_user_id TEXT,actor_role TEXT,action TEXT,target_kind TEXT,target_ref_sha256 TEXT,outcome TEXT,reason_code TEXT,correlation_ref_sha256 TEXT,preview_receipt_sha256 TEXT,details_json TEXT,created_at_utc TEXT);
    CREATE TABLE platform_watchlist_analysis_visibility(symbol TEXT,premium_only INTEGER,ticker_premium_only INTEGER);
    INSERT INTO platform_watchlist_analysis_visibility VALUES ('TEST',1,1);
    CREATE TABLE platform_watchlist_levels_visibility(symbol TEXT,premium_only INTEGER);
    INSERT INTO platform_watchlist_levels_visibility VALUES ('TEST',1);
    CREATE TABLE live_watchlist_symbols(symbol TEXT,state_json TEXT);
    INSERT INTO live_watchlist_symbols VALUES ('HIDDEN','{"watchlistGroup":"private"}');`);
  const insert = db.prepare("INSERT INTO platform_auth_identities VALUES (?,'discord',?,'active')");
  insert.run(owners[0], "101"); insert.run(owners[1], "202"); insert.run(member, "303");
});
afterEach(() => { db.close(); adapters.database = null; adapters.identity = null; vi.unstubAllEnvs(); });

describe("Watchlist-only owner authority", () => {
  it.each(owners)("allows configured owner %s without a Journal grant or five-minute freshness requirement", userId => {
    adapters.identity = identity(userId);
    expect(run()).toBe(userId);
    expect(run("2026-11-02T03:30:00.000Z")).toBe(userId);
    const rows = db.prepare("SELECT actor_role, outcome, details_json FROM platform_admin_audit_events").all();
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(expect.arrayContaining([expect.objectContaining({ actor_role: "authenticated_user", outcome: "success", details_json: '{"boundary":"watchlist_administration"}' })]));
  });
  it("rejects unlisted users even if client headers claim an owner actor", () => {
    adapters.identity = identity(member);
    headers.set("x-traderslink-review-actor", `platform-owner:${owners[0]}`);
    try { expect(() => run()).toThrow(); } finally { headers.delete("x-traderslink-review-actor"); }
    expect(db.prepare("SELECT outcome FROM platform_admin_audit_events").get()).toEqual({ outcome: "denied" });
  });
  it.each(owners)("rejects revoked configured identity %s", userId => {
    adapters.identity = identity(userId);
    db.prepare("UPDATE platform_auth_identities SET status='revoked' WHERE user_id=?").run(userId);
    expect(() => run()).toThrow();
  });
  it("never invokes an owner operation for an invalid/missing session", () => {
    const operation = vi.fn();
    expect(() => withWatchlistAdminDatabase(headers, operation, { environment })).toThrow("Invalid or missing session");
    expect(operation).not.toHaveBeenCalled();
  });
  it("does not treat a non-Discord identity as an allowlisted Discord identity", () => {
    adapters.identity = identity(owners[0]);
    db.prepare("UPDATE platform_auth_identities SET auth_provider='email' WHERE user_id=?").run(owners[0]);
    expect(() => run()).toThrow();
  });
  it("preserves same-origin/CSRF mutation checks", () => {
    const valid = { host: "app.example.test", origin: "https://app.example.test", "sec-fetch-site": "same-origin", [JOURNAL_ADMIN_REQUEST_HEADER]: "1" };
    expect(() => requireJournalAdminMutationRequest(new Request("https://app.example.test", { method: "POST", headers: valid }))).not.toThrow();
    expect(() => requireJournalAdminMutationRequest(new Request("https://app.example.test", { method: "POST" }))).toThrow();
    expect(() => requireJournalAdminMutationRequest(new Request("https://app.example.test", { method: "POST", headers: { ...valid, origin: "https://other.example.test" } }))).toThrow();
  });
  it("retains rate limiting rather than creating an unbounded owner endpoint", () => {
    adapters.identity = identity(owners[0]);
    const distinctTime = "2026-11-03T01:30:00.000Z";
    for (let index = 0; index < 120; index++) expect(run(distinctTime)).toBe(owners[0]);
    expect(() => run(distinctTime)).toThrow();
  });
});

describe("member privacy is unchanged", () => {
  it.each(owners)("allows configured owner %s to use private/Premium controls", userId => {
    adapters.identity = identity(userId);
    expect(canViewPrivateWatchlistTicker(headers, "HIDDEN")).toBe(true);
    expect(canViewWatchlistTicker(headers, "TEST")).toBe(true);
    expect(canViewWatchlistAnalysisPrices(headers, "TEST")).toBe(true);
    expect(canViewWatchlistLevels(headers, "TEST")).toBe(true);
  });
  it("keeps restricted tickers, analysis and levels hidden from a free member", () => {
    adapters.identity = { ...identity(member), discord: { guildOwner: false, roleIds: [] } };
    expect(canViewWatchlistTicker(headers, "TEST")).toBe(false);
    expect(canViewWatchlistAnalysisPrices(headers, "TEST")).toBe(false);
    expect(canViewWatchlistLevels(headers, "TEST")).toBe(false);
    expect(canViewPrivateWatchlistTicker(headers, "HIDDEN")).toBe(false);
  });
  it("retains Premium access without granting access to a private ticker", () => {
    adapters.identity = { ...identity(member), discord: { guildOwner: false, roleIds: ["synthetic_premium"] } };
    expect(canViewWatchlistTicker(headers, "TEST")).toBe(true);
    expect(canViewWatchlistAnalysisPrices(headers, "TEST")).toBe(true);
    expect(canViewWatchlistLevels(headers, "TEST")).toBe(true);
    expect(canViewPrivateWatchlistTicker(headers, "HIDDEN")).toBe(false);
  });
});

describe("Watchlist route boundaries", () => {
  const routes = ["analysis-visibility", "gain-starting-point", "manual-loss-post", "potential-gain-post", "runtime/[...path]", "setups", "setups/results"];
  it.each(routes)("%s uses Watchlist authority, not a single-account Journal grant", path => {
    const source = readFileSync(`app/api/admin/watchlist/${path}/route.ts`, "utf8");
    expect(source).toContain("withWatchlistAdminDatabase");
    expect(source).not.toContain("withJournalAdminDatabase");
    if (source.includes("function POST")) expect(source).toContain("requireJournalAdminMutationRequest");
  });
  it("retains the existing server-derived review actor, not a client actor", () => {
    const source = readFileSync("app/api/admin/watchlist/runtime/[...path]/route.ts", "utf8");
    expect(source).toContain('`platform-owner:${scope.userId}`');
    expect(source).toContain("requireJournalAdminMutationRequest(request)");
  });
});
