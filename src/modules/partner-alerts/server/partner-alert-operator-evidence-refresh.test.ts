// @vitest-environment node
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import type { TraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { PlatformDiscordMembershipRepository } from "../../platform/server/authentication/platform-discord-membership-repository";
import { PlatformAdminAuthorization } from "../../platform/server/administration/platform-admin-authorization";
import { resetJournalAdminRateLimitsForTests } from "../../platform/server/administration/platform-admin-request-security";
import { hashPlatformSessionToken, TRADERLINK_PLATFORM_SESSION_COOKIE } from "../../platform/server/authentication/platform-session-service";
import { platformAuthCookieName } from "../../platform/server/authentication/platform-auth-cookies";
import { PartnerAlertPlatformAuthority } from "./partner-alert-platform-authority";
import { partnerAlertOperatorEvidenceTarget, refreshPartnerAlertOperatorEvidence } from "./partner-alert-operator-evidence-refresh";

// Real SQLite, native admin policy/audit/grant/membership repositories and real
// Discord observation parser. Auth and Core admission are explicit fixture
// ports here; this is not hosted Core/profile or actual Discord evidence.
const state = vi.hoisted(() => ({ identity: null as unknown as TraderLinkPlatformRequestIdentity,
  session: null as Record<string, unknown> | null, admission: null as unknown as PlatformErasureAdmission,
  inWriter: false, phase: "live", suspended: false, lastAdmissionError: "" }));
vi.mock("../../platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformAuthenticatedRequestIdentity: () => {
    if (!state.session || state.suspended) throw Error("Fixture identity unavailable");
    return state.identity;
  },
}));
vi.mock("../../communities/server/community-owner-review-request-identity", () => ({
  requireCommunityOwnerReviewIdentity: (identity: TraderLinkPlatformRequestIdentity) => identity,
}));
vi.mock("../../platform/server/authentication/authenticated-user-journal-scope", () => ({
  deriveAuthenticatedUserJournalScope: () => state.identity.scope,
}));
vi.mock("../../platform/server/authentication/platform-session-repository", () => ({
  PlatformSessionRepository: class {
    findActiveByTokenDigest(digest: string) {
      return digest === hashPlatformSessionToken("s".repeat(43)) ? state.session : null;
    }
  },
}));
vi.mock("../../platform/server/privacy/platform-erasure-admission", () => ({
  requirePlatformErasureWriter: (_db: unknown, userId: string) => {
    if (!state.inWriter || userId !== state.identity.scope.userId) throw Error("Fixture Core writer missing");
    return state.admission;
  },
}));

const userId = "10000000-0000-4000-8000-000000000001", sessionId = "20000000-0000-4000-8000-000000000002";
const guild = "1433570740430573642", otherGuild = "1559172784813514803", subject = "600000000000000006";
let db: Database.Database, environment: NodeJS.ProcessEnv, admission: PlatformErasureAdmission;
const originalTime = "2026-11-19T09:58:03.466Z";
const endpoint = "/api/admin/journal/partner-channels";
function request(path = endpoint, method = "GET", validMutation = true, signal?: AbortSignal) {
  return new Request("https://app.example.test" + path, { method, signal, headers: {
    host: "app.example.test", cookie: `${platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)}=${"s".repeat(43)}`,
    ...(method === "POST" && validMutation ? { origin: "https://app.example.test", "sec-fetch-site": "same-origin",
      "x-traderlink-journal-admin-request": "1" } : {}),
  } });
}
function main() { return new PlatformDiscordMembershipRepository(db).findCurrent(userId, guild)!; }
function nativeOperator(req = request()) {
  return PartnerAlertPlatformAuthority.forRequest(req, {
    resolveIdentity: () => state.identity, identityOptions: { environment },
    admin: new PlatformAdminAuthorization(db, environment), communities: {} as never,
    discordMemberships: new PlatformDiscordMembershipRepository(db), nowUtc: () => new Date().toISOString(),
    maximumActorAgeMs: 30_000, maximumDiscordEvidenceAgeMs: 300_000, destinationGuildId: guild,
  }).requireOperator();
}
function transport(change?: () => void, options: { owner?: string; wrongMember?: boolean; failure?: boolean } = {}) {
  let changed = false;
  return vi.fn<typeof fetch>(async url => {
    expect(state.inWriter).toBe(false);
    expect(String(url)).toMatch(new RegExp(`^https://discord.com/api/v10/guilds/${guild}(?:/members/${subject})?$`));
    if (!changed) { changed = true; change?.(); }
    if (options.failure) return Response.json({}, { status: 503 });
    return String(url).includes("/members/") ? Response.json({ user: { id: options.wrongMember ? "777777777" : subject,
      username: "actual-observed-owner" }, roles: ["123456789"], joined_at: null })
      : Response.json({ id: guild, name: "Actual main server", owner_id: options.owner ?? subject });
  });
}
function refresh(fetcher: typeof fetch, req = request(), current = () => true) {
  return refreshPartnerAlertOperatorEvidence({ database: db, admission, request: req, environment,
    botToken: "synthetic-only-bot-token", transport: fetcher, configurationIsCurrent: current });
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime("2026-11-19T18:19:33.000Z");
  resetJournalAdminRateLimitsForTests();
  environment = { NODE_ENV: "production", DISCORD_GUILD_ID: guild,
    TRADERLINK_PLATFORM_ADMIN_RATE_LIMIT_SECRET: "synthetic-operator-refresh-rate-secret-123456" };
  state.identity = { mode: "platform_session", sessionId, displayName: "Fixture owner", discord: { guildOwner: true, roleIds: [] },
    scope: { userId, workspaceId: "30000000-0000-4000-8000-000000000003", workspaceRole: "owner",
      allowedAccountIds: [], activeAccountId: null } };
  state.session = { userId, sessionId, authProvider: "discord", expiresAtUtc: "2026-12-19T18:19:33.000Z" };
  state.inWriter = false; state.phase = "live"; state.suspended = false; state.lastAdmissionError = "";
  db = new Database(":memory:");
  db.exec(`CREATE TABLE platform_auth_identities(user_id TEXT,auth_provider TEXT,auth_subject TEXT,status TEXT,created_at_utc TEXT,updated_at_utc TEXT);
    CREATE TABLE platform_discord_memberships(user_id TEXT,guild_id TEXT,username TEXT,global_display_name TEXT,avatar_hash TEXT,
      role_ids_json TEXT,guild_owner INTEGER,joined_at_utc TEXT,first_verified_at_utc TEXT,last_verified_at_utc TEXT,PRIMARY KEY(user_id,guild_id));
    CREATE TABLE platform_operator_grants(operator_grant_id TEXT,user_id TEXT,authority_key TEXT,operator_role TEXT,grant_state TEXT,
      granted_by_kind TEXT,granted_by_user_id TEXT,grant_receipt_sha256 TEXT,recovery_of_grant_id TEXT,granted_at_utc TEXT,revoked_at_utc TEXT,updated_at_utc TEXT);
    CREATE TABLE platform_admin_audit_events(audit_event_id TEXT,actor_kind TEXT,actor_user_id TEXT,actor_role TEXT,action TEXT,target_kind TEXT,
      target_ref_sha256 TEXT,outcome TEXT,reason_code TEXT,correlation_ref_sha256 TEXT,preview_receipt_sha256 TEXT,details_json TEXT,created_at_utc TEXT);`);
  db.prepare("INSERT INTO platform_auth_identities VALUES(?,'discord',?,'active',?,?)").run(userId, subject, originalTime, originalTime);
  db.prepare("INSERT INTO platform_operator_grants VALUES(?,?,'journal_administration','journal_owner_admin','active','bootstrap_console',NULL,?,NULL,?,NULL,?)")
    .run("40000000-0000-4000-8000-000000000004", userId, "a".repeat(64), originalTime, originalTime);
  for (const guildId of [guild, otherGuild]) new PlatformDiscordMembershipRepository(db).upsertCurrent({ userId, guildId,
    username: "original", globalDisplayName: null, avatarHash: null, roleIds: ["987654321"], guildOwner: true,
    joinedAtUtc: null, verifiedAtUtc: originalTime });
  admission = state.admission = {
    runForUsers: (_ids: readonly string[], run: () => unknown) => db.transaction(() => {
      if (state.inWriter) throw Error("Nested fixture admission");
      state.inWriter = true; try { return run(); }
      catch (error) { state.lastAdmissionError = String(error); throw error; }
      finally { state.inWriter = false; }
    })(),
    assertLivePrincipal: () => { if (state.phase !== "live" || state.suspended) throw Error("Fixture erasure hold"); },
    lifecycle: () => ({ phase: state.phase, profile_generation: 1 }),
  } as unknown as PlatformErasureAdmission;
});
afterEach(() => { db.close(); vi.useRealTimers(); vi.unstubAllEnvs(); resetJournalAdminRateLimitsForTests(); });

describe("current native operator observation refresh", () => {
  it("repairs stale Main evidence through real observations then the unchanged native operator gate", async () => {
    expect(() => nativeOperator()).toThrow("Access must be verified again");
    const other = new PlatformDiscordMembershipRepository(db).findCurrent(userId, otherGuild), fetcher = transport();
    const outcome = await refresh(fetcher);
    expect(outcome, JSON.stringify({ calls: fetcher.mock.calls.length, admissionError: state.lastAdmissionError })).toBe("verified");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(main()).toMatchObject({ username: "actual-observed-owner", lastVerifiedAtUtc: new Date().toISOString() });
    expect(nativeOperator()).toMatchObject({ kind: "operator", userId });
    expect(new PlatformDiscordMembershipRepository(db).findCurrent(userId, otherGuild)).toEqual(other);
    expect(db.prepare("SELECT grant_state FROM platform_operator_grants").get()).toEqual({ grant_state: "active" });
  });
  it("preserves the configured-owner alternative with genuine current non-owner membership", async () => {
    environment.TRADERLINK_PLATFORM_INITIAL_OWNER_DISCORD_SUBJECT = subject;
    state.identity = { ...state.identity, discord: { guildOwner: false, roleIds: [] } };
    expect(await refresh(transport(undefined, { owner: "777777777" }))).toBe("verified");
    expect(main().guildOwner).toBe(false); expect(nativeOperator().userId).toBe(userId);
  });
  it("allows concurrent queue and role-review refresh without replacing newer native evidence", async () => {
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; }), actual = transport();
    const fetcher: typeof fetch = async (...args) => { await pending; return actual(...args); };
    const queue = refresh(fetcher), roles = refresh(fetcher, request(endpoint + "/role-review"));
    release(); expect(await Promise.all([queue, roles])).toEqual(["verified", "verified"]);
    expect(nativeOperator().userId).toBe(userId);
  });
  it("never opens Discord observation for a missing grant or suspended principal", async () => {
    const fetcher = transport(); db.prepare("UPDATE platform_operator_grants SET grant_state='revoked'").run();
    expect(await refresh(fetcher)).toBe("not_operator"); expect(fetcher).not.toHaveBeenCalled();
    db.prepare("UPDATE platform_operator_grants SET grant_state='active'").run(); state.suspended = true;
    expect(await refresh(fetcher)).toBe("unavailable"); expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["grant", "identity", "session", "lifecycle", "configuration", "cancel"])(
    "refuses changed %s during Discord I/O without renewing native evidence", async change => {
      const before = main(), controller = new AbortController(); let current = true;
      const fetcher = transport(() => {
        if (change === "grant") db.prepare("UPDATE platform_operator_grants SET grant_state='revoked'").run();
        if (change === "identity") db.prepare("UPDATE platform_auth_identities SET auth_subject='777777777'").run();
        if (change === "session") state.session = null;
        if (change === "lifecycle") state.phase = "erasing";
        if (change === "configuration") current = false;
        if (change === "cancel") controller.abort();
      });
      expect(await refresh(fetcher, request(endpoint, "GET", true, controller.signal), () => current)).toBe("unavailable");
      expect(main()).toEqual(before); expect(() => nativeOperator()).toThrow();
    },
  );
  it.each([{ failure: true }, { wrongMember: true }, { owner: "777777777" }])(
    "does not turn unavailable, mismatched or lost-owner evidence into operator access: %j", async options => {
      const before = main(); expect(await refresh(transport(undefined, options))).not.toBe("verified");
      expect(main()).toEqual(before); expect(() => nativeOperator()).toThrow();
    },
  );
  it("reuses fresh evidence after current native policy checks, and never bypasses lost grants", async () => {
    expect(await refresh(transport())).toBe("verified"); const fetcher = transport();
    expect(await refresh(fetcher)).toBe("verified"); expect(fetcher).not.toHaveBeenCalled();
    db.prepare("UPDATE platform_operator_grants SET grant_state='revoked'").run();
    expect(await refresh(fetcher)).toBe("not_operator"); expect(() => nativeOperator()).toThrow();
  });
  it("rejects invalid admin mutation security before observation", async () => {
    const fetcher = transport(); expect(await refresh(fetcher, request(endpoint, "POST", false))).toBe("not_operator");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("selects only real private admin routes, not public catalog, owner or provider endpoints", () => {
    for (const path of [endpoint, endpoint + "/role-review", endpoint + "/" + userId, endpoint + "/" + userId + "/stripe-role-review"])
      expect(partnerAlertOperatorEvidenceTarget(request(path))).toBe(true);
    for (const path of ["/partner-channels", "/api/partner-channels/stripe/webhook", "/api/partner-channels/communities/" + userId,
      endpoint + "/" + userId + "/unexpected"])
      expect(partnerAlertOperatorEvidenceTarget(request(path))).toBe(false);
  });
});
