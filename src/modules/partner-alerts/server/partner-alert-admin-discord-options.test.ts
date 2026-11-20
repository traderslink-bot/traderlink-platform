// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { readPartnerAlertAdminDiscordOptions } from "./partner-alert-admin-discord-options";
import { PartnerAlertRepositoryError } from "./partner-alert-repository";
import { GET as resourcesGet } from "@/app/api/admin/journal/partner-channels/[communityId]/resources/route";
const native = vi.hoisted(() => ({ pre: vi.fn(), after: vi.fn(), outer: vi.fn() }));
// Registered composition uses explicit synthetic Auth/Core/database ports. The
// metadata verifier below is the actual unchanged Discord pair verifier.
vi.mock("../../platform/server/database/open-platform-database", () => ({ openPlatformDatabase: () => ({ close: () => undefined }) }));
vi.mock("../../platform/server/privacy/platform-erasure-admission", () => ({ PlatformErasureAdmission: { bind: () => ({}) } }));
vi.mock("./partner-alert-admission", () => ({ PartnerAlertAdmission: { bind: () => ({}) } }));
vi.mock("./partner-alert-stripe-billing-runtime", () => ({ readPartnerAlertStripeBillingConfiguration: () => null }));
vi.mock("./partner-alert-request-writer", () => ({ PartnerAlertRequestWriter: vi.fn(function () {
  return { preauthorizeMetadataRead: native.pre, revalidateMetadataRead: native.after };
}) }));
vi.mock("./partner-alert-owner-review-request", () => ({ partnerAlertOwnerReviewRequestDenied: native.outer }));
const guild = "1559172784813514803", bot = "600000000000000006", botRole = "800000000000000008", role = "500000000000000005";
const communityId = "20000000-0000-4000-8000-000000000002", mappingId = "30000000-0000-4000-8000-000000000003";
const target = { communityId, sourceGuildId: guild, sourceChannelId: "40001", destinationGuildId: guild,
  destinationChannelId: "40002", destinationRoleId: role };
const permit = { communityId, partnerRevision: 7, mappingId, mappingRevision: 2,
  sourceGuildId: guild, sourceChannelId: "40001", destinationGuildId: guild };
const bit = (n: number) => BigInt(1) << BigInt(n);
const writes = [6, 11, 12, 14, 15, 17, 35, 36, 38, 45, 46].reduce((sum, n) => sum | bit(n), BigInt(0));
function fixture() {
  const roles = [{ id: guild, name: "Everyone", position: 0, permissions: "0", managed: false },
    { id: botRole, name: "Bot", position: 10, permissions: (bit(10) | bit(11) | bit(16) | bit(28)).toString(), managed: false },
    { id: role, name: "Partner access", position: 5, permissions: "0", managed: false }];
  const source = { id: "40001", name: "Source alerts", guild_id: guild, type: 0, permission_overwrites: [] };
  const destination = { id: "40002", name: "Receiving alerts", guild_id: guild, type: 0,
    permission_overwrites: [{ id: guild, type: 0, allow: "0", deny: bit(10).toString() },
      { id: role, type: 0, allow: (bit(10) | bit(16)).toString(), deny: writes.toString() },
      { id: botRole, type: 0, allow: (bit(10) | bit(11) | bit(16)).toString(), deny: "0" }] };
  const transport = vi.fn(async (url: string, init: RequestInit) => {
    expect(init.method).toBe("GET"); expect(init.redirect).toBe("manual");
    const path = new URL(url).pathname;
    if (path === "/api/v10/users/@me") return Response.json({ id: bot, bot: true });
    if (path === `/api/v10/guilds/${guild}/members/${bot}`) return Response.json({ user: { id: bot }, roles: [botRole] });
    if (path === `/api/v10/guilds/${guild}/roles`) return Response.json(roles);
    if (path === `/api/v10/guilds/${guild}/channels`) return Response.json([source, destination]);
    throw Error("Unadmitted metadata lookup");
  });
  const configuration = { discordBotToken: "x".repeat(40), discordBotUserId: bot, discordMaximumEvidenceAgeMs: 60000,
    outputConfigurationRef: "native_output", outputBindings: [target] };
  return { roles, source, destination, transport, configuration };
}
beforeEach(() => { vi.clearAllMocks(); native.outer.mockReturnValue(null); native.pre.mockReturnValue(permit); native.after.mockReturnValue(undefined); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("existing configured receiving pair uses actual verifier", () => {
  it("shows actual names only after full privacy/read-only/hierarchy/exclusivity verification", async () => {
    const f = fixture(); const result = await readPartnerAlertAdminDiscordOptions({ ...f, permit,
      signal: new AbortController().signal, messageContentEnabled: true });
    expect(result).toEqual([{ channelId: "40002", channelName: "Receiving alerts", roleId: role,
      roleName: "Partner access", available: true, reason: null }]);
    expect(f.transport).toHaveBeenCalledTimes(4); // actual shared JSON is read once, never synthetic permission receipts
  });
  it.each(["privacy", "writes", "hierarchy", "managed"])("keeps names and explains a refused %s pair", async reason => {
    const f = fixture();
    if (reason === "privacy") f.destination.permission_overwrites[0].deny = "0";
    if (reason === "writes") f.destination.permission_overwrites[1].allow = (bit(10) | bit(16) | bit(11)).toString();
    if (reason === "hierarchy") f.roles[2].position = 11;
    if (reason === "managed") f.roles[2].managed = true;
    const result = await readPartnerAlertAdminDiscordOptions({ ...f, permit, signal: new AbortController().signal, messageContentEnabled: true });
    expect(result[0]).toMatchObject({ available: false, channelName: "Receiving alerts", roleName: "Partner access" });
    expect(result[0].reason).toMatch(/privacy.*read-only.*hierarchy.*exclusive/);
  });
  it("never expands the server-owned registry or looks up a caller-selected foreign guild", async () => {
    const f = fixture(); const configuration = { ...f.configuration, outputBindings: [] };
    expect(await readPartnerAlertAdminDiscordOptions({ ...f, configuration, permit, signal: new AbortController().signal, messageContentEnabled: true })).toEqual([]);
    expect(f.transport).not.toHaveBeenCalled();
    await expect(readPartnerAlertAdminDiscordOptions({ ...f, permit: { ...permit, destinationGuildId: "99999" },
      signal: new AbortController().signal, messageContentEnabled: true })).rejects.toThrow();
    expect(f.transport).not.toHaveBeenCalled();
  });
  it("stops cancelled reads and never manufactures names from missing metadata", async () => {
    const f = fixture(), controller = new AbortController(); controller.abort();
    await expect(readPartnerAlertAdminDiscordOptions({ ...f, permit, signal: controller.signal, messageContentEnabled: true })).rejects.toThrow();
    expect(f.transport).not.toHaveBeenCalled();
    f.roles[2].name = "";
    expect((await readPartnerAlertAdminDiscordOptions({ ...f, permit, signal: new AbortController().signal, messageContentEnabled: true }))[0])
      .toMatchObject({ available: false, roleName: null });
  });
  it("runs the real registered metadata composition independently from payment configuration and refuses lost original operator after await", async () => {
    const f = fixture();
    for (const [key, value] of Object.entries({ PARTNER_ALERT_REQUEST_RUNTIME_ENABLED: "true",
      PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256: "a".repeat(64), PARTNER_ALERT_OUTPUT_BOT_USER_ID: bot,
      PARTNER_ALERT_OUTPUT_CONFIGURATION_REF: "native_output", PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED: "true",
      PARTNER_ALERT_DISCORD_BOT_USER_ID: bot, PARTNER_ALERT_DISCORD_BOT_TOKEN: "x".repeat(40),
      PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS: "60000", PARTNER_ALERT_CATALOG_CHECKOUT_ENABLED: "false",
      PARTNER_ALERT_DISCORD_MESSAGE_CONTENT_INTENT_ENABLED: "true",
      PARTNER_ALERT_OUTPUT_BINDINGS_JSON: JSON.stringify({ configurationRef: "native_output", bindings: [target] }) })) vi.stubEnv(key, value);
    vi.stubGlobal("fetch", f.transport);
    const req = new NextRequest(`https://app.example.test/api/admin/journal/partner-channels/${communityId}/resources?mappingId=${mappingId}`);
    const response = await resourcesGet(req, { params: Promise.resolve({ communityId }) });
    expect(response.status).toBe(200); expect((await response.json()).result).toMatchObject({ partnerRevision: 7, mappingRevision: 2,
      options: [{ available: true, channelName: "Receiving alerts" }] });
    expect(native.pre).toHaveBeenCalledWith(req, { kind: "operator_resources", communityId, mappingId });
    expect(native.after.mock.calls[0][0]).toBe(req);
    native.after.mockImplementation(() => { throw new PartnerAlertRepositoryError("forbidden", "original operator revoked"); });
    const refused = await resourcesGet(req, { params: Promise.resolve({ communityId }) });
    expect(refused.status).toBe(403); expect(JSON.stringify(await refused.json())).not.toContain("Receiving alerts");
  });
});
