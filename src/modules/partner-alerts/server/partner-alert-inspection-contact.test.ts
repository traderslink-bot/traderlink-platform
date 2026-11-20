// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { readPartnerAlertInspectionContact } from "./partner-alert-inspection-contact";
import { PartnerAlertRepositoryError } from "./partner-alert-repository";
import { withPartnerAlertRequestRuntime } from "./partner-alert-request-runtime";
import { GET as inspectionGet } from "@/app/api/partner-channels/communities/[communityId]/inspection-contact/route";
// Explicit synthetic Auth/Core/storage ports for registered-route composition;
// actual native writer/identity coverage belongs to the separate native test.
const ports = vi.hoisted(() => ({ pre: vi.fn(), after: vi.fn(), outer: vi.fn(), close: vi.fn() }));
vi.mock("../../platform/server/database/open-platform-database", () => ({ openPlatformDatabase: () => ({ close: ports.close }) }));
vi.mock("../../platform/server/privacy/platform-erasure-admission", () => ({ PlatformErasureAdmission: { bind: () => ({}) } }));
vi.mock("./partner-alert-admission", () => ({ PartnerAlertAdmission: { bind: () => ({}) } }));
vi.mock("./partner-alert-stripe-billing-runtime", () => ({ readPartnerAlertStripeBillingConfiguration: () => null }));
vi.mock("./partner-alert-request-writer", () => ({ PartnerAlertRequestWriter: vi.fn(function () {
  return { preauthorizeMetadataRead: ports.pre, revalidateMetadataRead: ports.after };
}) }));
vi.mock("./partner-alert-owner-review-request", () => ({ partnerAlertOwnerReviewRequestDenied: ports.outer }));
const community = "20000000-0000-4000-8000-000000000002", bot = "600000000000000006", human = "700000000000000007";
const request = () => new NextRequest(`https://app.example.test/api/partner-channels/communities/${community}/inspection-contact`, { headers: { host: "app.example.test" } });
function fetchHuman(value: unknown = { id: human, username: "real_handle", global_name: "Human reviewer" }) {
  return vi.fn(async () => Response.json(value));
}
beforeEach(() => {
  vi.clearAllMocks();
  for (const [key, value] of Object.entries({ PARTNER_ALERT_REQUEST_RUNTIME_ENABLED: "true",
    PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256: "a".repeat(64), PARTNER_ALERT_OUTPUT_BOT_USER_ID: bot,
    PARTNER_ALERT_OUTPUT_CONFIGURATION_REF: "native_output", PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED: "true",
    PARTNER_ALERT_DISCORD_BOT_USER_ID: bot, PARTNER_ALERT_DISCORD_BOT_TOKEN: "x".repeat(40),
    PARTNER_ALERT_DISCORD_EVIDENCE_MAX_AGE_MS: "60000", PARTNER_ALERT_CATALOG_CHECKOUT_ENABLED: "false",
    PARTNER_ALERT_DISCORD_MESSAGE_CONTENT_INTENT_ENABLED: "false" })) vi.stubEnv(key, value);
  ports.outer.mockReturnValue(null); ports.pre.mockReturnValue({ communityId: community,
    sourceGuildId: "1559172784813514803", destinationGuildId: "1559172784813514803", partnerRevision: 1, reviewerDiscordUserId: human });
  ports.after.mockReturnValue(undefined); vi.stubGlobal("fetch", fetchHuman());
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("real selected human and original registered request", () => {
  it("returns only the expected real public identity/profile without sending a DM or granting inspection", async () => {
    const req = request(); const response = await inspectionGet(req, { params: Promise.resolve({ communityId: community }) });
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ ok: true, result: { communityId: community,
      contact: { discordUserId: human, displayName: "Human reviewer", profileUrl: `https://discord.com/users/${human}` } } });
    expect(ports.pre).toHaveBeenCalledWith(req, { kind: "inspection_contact", communityId: community });
    expect(ports.after.mock.calls[0][0]).toBe(req); expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(`https://discord.com/api/v10/users/${human}`);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ method: "GET", redirect: "manual", cache: "no-store" });
  });
  it("refuses the actual outer route before runtime or credential I/O", async () => {
    ports.outer.mockReturnValue(new Response(null, { status: 403 }));
    expect((await inspectionGet(request(), { params: Promise.resolve({ communityId: community }) })).status).toBe(403);
    expect(ports.pre).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it("refuses missing native ownership before metadata I/O", async () => {
    ports.pre.mockImplementation(() => { throw new PartnerAlertRepositoryError("forbidden", "lost owner"); });
    const req = request(); expect((await withPartnerAlertRequestRuntime(req, r => r.readInspectionContact(req, community))).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rechecks the original request after await and discloses no contact after revocation", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { await Promise.resolve();
      ports.after.mockImplementation(() => { throw new PartnerAlertRepositoryError("forbidden", "revoked session"); });
      return Response.json({ id: human, username: "reviewer" }); }));
    const response = await inspectionGet(request(), { params: Promise.resolve({ communityId: community }) });
    expect(response.status).toBe(403); expect(JSON.stringify(await response.json())).not.toContain(human);
  });
  it.each([{ id: bot, bot: true, username: "Bot" }, { id: "99999", username: "Other" }, { id: human, system: true, username: "System" }])("rejects bot/system/wrong selected metadata %j", async value => {
    await expect(readPartnerAlertInspectionContact({ discordUserId: human, botToken: "x".repeat(40),
      signal: new AbortController().signal, transport: fetchHuman(value) })).rejects.toThrow();
  });
  it("keeps missing optional metadata isolated to this panel, with no invented contact", async () => {
    vi.stubEnv("PARTNER_ALERT_PROVIDER_VERIFICATION_ENABLED", "false");
    const response = await inspectionGet(request(), { params: Promise.resolve({ communityId: community }) });
    expect(response.status).toBe(503); expect(fetch).not.toHaveBeenCalled(); expect(ports.pre).toHaveBeenCalledTimes(1);
  });
  it("refuses configuration drift and cancellation without revealing the returned identity", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { vi.stubEnv("PARTNER_ALERT_DISCORD_BOT_TOKEN", "y".repeat(40));
      return Response.json({ id: human, username: "reviewer" }); }));
    expect((await inspectionGet(request(), { params: Promise.resolve({ communityId: community }) })).status).toBe(503);
    const controller = new AbortController(); controller.abort(); const transport = fetchHuman();
    await expect(readPartnerAlertInspectionContact({ discordUserId: human, botToken: "x".repeat(40), signal: controller.signal, transport })).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
  });
});
