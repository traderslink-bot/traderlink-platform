// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PartnerAlertRepositoryError } from "./partner-alert-repository";
import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { withPartnerAlertRequestRuntime } from "./partner-alert-request-runtime";
import { PartnerAlertPlatformAuthority } from "./partner-alert-platform-authority";
import { partnerAlertPrivateReadFailure } from "./partner-alert-http";

// Isolated request-composition checks. Native Auth/Core/writer are explicit
// synthetic ports; this is not an installed native or real Discord pass.
const state = vi.hoisted(() => ({
  close: vi.fn(), bind: vi.fn(), refresh: vi.fn(), catalog: vi.fn(), preauthorize: vi.fn(), revalidate: vi.fn(),
  operatorRefresh: vi.fn(),
  beforeSave: undefined as undefined | ((request: Request, command: {
    action: string; communityId: string; expectedRevision: number; displayName: string; sourceChannelId?: string;
  }) => Promise<void>),
}));
vi.mock("../../platform/server/database/open-platform-database", () => ({
  openPlatformDatabase: () => ({ close: state.close }),
}));
vi.mock("../../platform/server/privacy/platform-erasure-admission", () => ({ PlatformErasureAdmission: { bind: state.bind } }));
vi.mock("./partner-alert-admission", () => ({ PartnerAlertAdmission: { bind: () => ({}) } }));
vi.mock("./partner-alert-stripe-billing-runtime", () => ({ readPartnerAlertStripeBillingConfiguration: () => null }));
vi.mock("../../platform/server/authentication/platform-discord-configuration", () => ({ resolveTraderLinkDiscordGuildId: () => "1559172784813514803" }));
vi.mock("./partner-alert-request-writer", () => ({
  PartnerAlertRequestWriter: vi.fn(function () {
    return { preauthorizeSourceChannelCatalog: state.preauthorize, revalidateSourceChannelCatalog: state.revalidate };
  }),
}));
vi.mock("./partner-alert-owner-evidence-refresh", async original => ({
  ...await original<typeof import("./partner-alert-owner-evidence-refresh")>(), refreshPartnerAlertOwnerEvidence: state.refresh,
}));
vi.mock("./partner-alert-operator-evidence-refresh", async original => ({
  ...await original<typeof import("./partner-alert-operator-evidence-refresh")>(), refreshPartnerAlertOperatorEvidence: state.operatorRefresh,
}));
vi.mock("./partner-alert-review-discord", async original => {
  const actual = await original<typeof import("./partner-alert-review-discord")>();
  const { assertCommunityReviewDiscordGuild } = await import("../../communities/server/community-review-discord-guild");
  return { ...actual, createPartnerAlertReviewDiscordChannelCatalog: () => (guild: string, signal: AbortSignal) => {
    assertCommunityReviewDiscordGuild(guild);
    return state.catalog(guild, signal);
  } };
});
vi.mock("./partner-alert-http", async original => {
  const actual = await original<typeof import("./partner-alert-http")>();
  return { ...actual, PartnerAlertHttpAdapter: vi.fn(function (_settings: unknown, _boundary: unknown,
    _writer: unknown, _provider: unknown, beforeSave: NonNullable<typeof state.beforeSave>) {
    state.beforeSave = beforeSave;
    return {};
  }) };
});

const id = "20000000-0000-4000-8000-000000000002", bot = "600000000000000006";
const prefix = `/api/partner-channels/communities/${id}`;
const source = { guildName: "Observed test server", channels: [{ channelId: "700000000000000007", name: "Signals" }], unavailableChannels: [] };
const permit = { communityId: id, sourceGuildId: "1559172784813514803", partnerRevision: 0 };
function request(path = `${prefix}/source-channels`, signal?: AbortSignal, method = "GET") {
  return new NextRequest(`https://app.example.test${path}`, { method, signal, headers: { host: "app.example.test" } });
}
function read(req: NextRequest) {
  return withPartnerAlertRequestRuntime(req, runtime => runtime.readSourceChannels(req, id));
}
beforeEach(() => {
  vi.clearAllMocks();
  state.beforeSave = undefined;
  vi.stubEnv("PARTNER_ALERT_REQUEST_RUNTIME_ENABLED", "true");
  vi.stubEnv("PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256", "a".repeat(64));
  vi.stubEnv("PARTNER_ALERT_OUTPUT_BOT_USER_ID", bot);
  vi.stubEnv("PARTNER_ALERT_OUTPUT_CONFIGURATION_REF", "owner_discovery_v1");
  vi.stubEnv("PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED", "true");
  vi.stubEnv("PARTNER_ALERT_DISCORD_BOT_USER_ID", bot);
  vi.stubEnv("PARTNER_ALERT_DISCORD_BOT_TOKEN", "synthetic-discord-token-123456789");
  vi.stubEnv("PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS", "60000");
  vi.stubEnv("PARTNER_ALERT_CATALOG_CHECKOUT_ENABLED", "false");
  vi.stubEnv("PARTNER_ALERT_DISCORD_MESSAGE_CONTENT_INTENT_ENABLED", "false");
  vi.stubEnv("PARTNER_ALERT_OUTPUT_BINDINGS_JSON", undefined);
  vi.stubEnv("PARTNER_ALERT_WHOP_CREDENTIAL_KEYS_JSON", undefined);
  vi.stubEnv("PARTNER_ALERT_PUBLISHING_PRICING_CAPABILITIES_JSON", undefined);
  state.bind.mockImplementation(() => ({}));
  state.refresh.mockImplementation(async input => input.configurationIsCurrent() ? "verified" : "unavailable");
  state.operatorRefresh.mockImplementation(async input => input.configurationIsCurrent() ? "verified" : "unavailable");
  state.preauthorize.mockImplementation(() => permit);
  state.revalidate.mockImplementation(() => undefined);
  state.catalog.mockResolvedValue(source);
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("Unexpected network in isolated composition check"); }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("owner onboarding with Discord metadata but no financial configuration", () => {
  it.each([
    { setting: "PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED", value: "false", stale: false },
    { setting: "PARTNER_ALERT_DISCORD_BOT_TOKEN", value: undefined, stale: false },
    { setting: "PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED", value: "false", stale: true },
    { setting: "PARTNER_ALERT_DISCORD_BOT_TOKEN", value: undefined, stale: true },
  ])("preserves native operator freshness when $setting=$value (stale=$stale)", async ({ setting, value, stale }) => {
    vi.stubEnv(setting, value);
    const req = request("/api/admin/journal/partner-channels"), at = "2026-11-19T18:19:33.000Z";
    const userId = "10000000-0000-4000-8000-000000000001";
    const operation = vi.fn(async () => {
      // Real existing freshness evaluator and HTTP error mapping, with explicit
      // synthetic identity/admin ports. Actual Core/Auth coverage is separate.
      const authority = PartnerAlertPlatformAuthority.forRequest(req, {
        resolveIdentity: () => ({ mode: "platform_session", sessionId: "30000000-0000-4000-8000-000000000003",
          displayName: "Fixture operator", discord: { guildOwner: true, roleIds: [] }, scope: {
            userId, workspaceId: "40000000-0000-4000-8000-000000000004", workspaceRole: "owner",
            allowedAccountIds: [], activeAccountId: null,
          } }),
        identityOptions: { environment: process.env }, nowUtc: () => at,
        maximumActorAgeMs: 30_000, maximumDiscordEvidenceAgeMs: 300_000,
        destinationGuildId: "1433570740430573642", communities: {} as never, discordMemberships: {} as never,
        admin: { authorize: () => ({ userId, role: "journal_owner_admin", mode: "production_discord_owner",
          authorizedAtUtc: at, discordOwnerVerifiedAtUtc: stale ? "2026-11-19T09:58:03.466Z" : at, permissions: [] }) },
      });
      try { authority.requireOperator(); return Response.json({ ok: true, result: [] }); }
      catch (error) { return partnerAlertPrivateReadFailure(error); }
    });
    expect((await withPartnerAlertRequestRuntime(req, operation)).status).toBe(stale ? 403 : 200);
    expect(operation).toHaveBeenCalledOnce();
    expect(state.operatorRefresh).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });

  it("refreshes actual operator observation before normal admin handling without requiring payment or output configuration", async () => {
    const operation = vi.fn(async () => new Response(null, { status: 204 }));
    expect((await withPartnerAlertRequestRuntime(request("/api/admin/journal/partner-channels"), operation)).status).toBe(204);
    expect(state.operatorRefresh).toHaveBeenCalledOnce(); expect(operation).toHaveBeenCalledOnce();
    expect(state.refresh).not.toHaveBeenCalled(); expect(state.catalog).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves ordinary operator denial and refuses unavailable observation before admin handling", async () => {
    const denied = vi.fn(async () => new Response(null, { status: 403 }));
    state.operatorRefresh.mockResolvedValue("not_operator");
    expect((await withPartnerAlertRequestRuntime(request("/api/admin/journal/partner-channels"), denied)).status).toBe(403);
    state.operatorRefresh.mockResolvedValue("unavailable"); denied.mockClear();
    expect((await withPartnerAlertRequestRuntime(request("/api/admin/journal/partner-channels"), denied)).status).toBe(503);
    expect(denied).not.toHaveBeenCalled();
  });

  it("keeps invalid admin mutation security before Discord refresh", async () => {
    expect((await withPartnerAlertRequestRuntime(request("/api/admin/journal/partner-channels", undefined, "POST"),
      async () => new Response(null, { status: 204 }))).status).toBe(403);
    expect(state.operatorRefresh).not.toHaveBeenCalled();
  });

  it("refreshes ownership and reads/revalidates existing sources with payment and output configuration absent", async () => {
    const req = request(), response = await read(req);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, result: { communityId: id, ...source } });
    expect(state.refresh).toHaveBeenCalledOnce();
    expect(state.preauthorize).toHaveBeenCalledWith(req, id);
    expect(state.catalog).toHaveBeenCalledWith(permit.sourceGuildId, req.signal);
    expect(state.revalidate).toHaveBeenCalledWith(req, permit, undefined);
    expect(fetch).not.toHaveBeenCalled();
    expect(state.close).toHaveBeenCalledOnce();
  });

  it("retains real Discord names when validating owner and mapping drafts", async () => {
    const req = request(prefix);
    const response = await withPartnerAlertRequestRuntime(req, async () => {
      await state.beforeSave!(req, { action: "savePartnerDraft", communityId: id, expectedRevision: 0, displayName: source.guildName });
      await state.beforeSave!(req, { action: "saveMappingDraft", communityId: id, expectedRevision: 0,
        displayName: "Signals", sourceChannelId: source.channels[0]!.channelId });
      await expect(state.beforeSave!(req, { action: "savePartnerDraft", communityId: id, expectedRevision: 0,
        displayName: "Hidden server name" })).rejects.toThrow("Discord source name changed");
      return new Response(null, { status: 204 });
    });
    expect(response.status).toBe(204);
  });

  it.each([
    { label: "renamed server", action: "savePartnerDraft", displayName: "Previous server name" },
    { label: "renamed channel", action: "saveMappingDraft", displayName: "Previous channel name",
      sourceChannelId: source.channels[0]!.channelId },
    { label: "channel missing from current Discord inventory", action: "saveMappingDraft", displayName: "Signals",
      sourceChannelId: "100000000000000099" },
  ])("classifies $label as a reload conflict instead of provider unavailability", async command => {
    const req = request(prefix);
    const response = await withPartnerAlertRequestRuntime(req, async () => {
      const result = state.beforeSave!(req, { ...command, communityId: id, expectedRevision: 0 });
      await expect(result).rejects.toBeInstanceOf(PartnerAlertRepositoryError);
      await expect(result).rejects.toMatchObject({ kind: "conflict", message: "Discord source name changed" });
      return new Response(null, { status: 204 });
    });
    expect(response.status).toBe(204);
    expect(state.revalidate).toHaveBeenCalledWith(req, permit, undefined);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not turn missing paid verification into buyer Premium or seller readiness", async () => {
    const req = request();
    const response = await withPartnerAlertRequestRuntime(req, async runtime => {
      expect(await runtime.readStripeSeller(req, id, "synthetic-owner")).toBeNull();
      expect(await runtime.readUserPremium("synthetic-owner")).toMatchObject({ premium: "unknown", identity: "native_verification_needed" });
      return new Response(null, { status: 204 });
    });
    expect(response.status).toBe(204);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps genuine owner denial before channel discovery", async () => {
    state.preauthorize.mockImplementation(() => { throw new PartnerAlertValidationError("communityOwner"); });
    expect((await read(request())).status).toBe(403);
    expect(state.catalog).not.toHaveBeenCalled();
  });

  it("requires successful Core binding and current owner observation", async () => {
    state.refresh.mockResolvedValue("unavailable");
    expect((await read(request())).status).toBe(503);
    expect(state.catalog).not.toHaveBeenCalled();
    state.bind.mockImplementation(() => { throw Error("Unqualified Core"); });
    state.refresh.mockClear();
    expect((await read(request())).status).toBe(503);
    expect(state.refresh).not.toHaveBeenCalled();
  });

  it("does not offer discovery to catalog/subscriber paths or foreign guilds", async () => {
    expect((await read(request("/partner-channels"))).status).toBe(503);
    expect(state.refresh).not.toHaveBeenCalled();
    expect(state.catalog).not.toHaveBeenCalled();
    state.preauthorize.mockReturnValue({ ...permit, sourceGuildId: "1433570740430573642" });
    expect((await read(request())).status).toBe(401);
    expect(state.catalog).not.toHaveBeenCalled();
  });

  it.each(["PARTNER_ALERT_DISCORD_BOT_TOKEN", "PARTNER_ALERT_OUTPUT_CONFIGURATION_REF", "PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256", "PARTNER_ALERT_REQUEST_RUNTIME_ENABLED"])(
    "rejects changed %s after discovery I/O", async key => {
      state.catalog.mockImplementation(async () => { vi.stubEnv(key, "changed"); return source; });
      expect((await read(request())).status).toBe(503);
      expect(state.revalidate).not.toHaveBeenCalled();
    },
  );

  it("refuses cancellation and genuine Discord failure before a source result", async () => {
    const controller = new AbortController();
    state.catalog.mockImplementation(async () => { controller.abort(); return source; });
    expect((await read(request(undefined, controller.signal))).status).toBe(503);
    expect(state.revalidate).not.toHaveBeenCalled();
    state.catalog.mockRejectedValue(Error("Discord permissions unavailable"));
    expect((await read(request())).status).toBe(503);
  });

  it("retains owner mutation CSRF rejection before ownership/provider work", async () => {
    expect((await read(request(undefined, undefined, "POST"))).status).toBe(403);
    expect(state.refresh).not.toHaveBeenCalled();
    expect(state.catalog).not.toHaveBeenCalled();
  });

  it("uses the existing same-origin mutation contract for an explicit source-name refresh", async () => {
    const req = new NextRequest(`https://app.example.test${prefix}/source-channels`, {
      method: "POST", headers: { host: "app.example.test", origin: "https://app.example.test",
        "sec-fetch-site": "same-origin", "x-traderlink-platform-mutation": "1" },
    });
    expect((await read(req)).status).toBe(200);
    expect(state.revalidate).toHaveBeenCalledWith(req, permit, source);
    expect(fetch).not.toHaveBeenCalled();
  });
});
