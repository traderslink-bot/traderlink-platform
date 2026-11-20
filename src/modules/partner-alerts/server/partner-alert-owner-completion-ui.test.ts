// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommunityPartnerChannelSetup } from "@/app/(dashboard)/communities/[communitySlug]/partner-channels/community-partner-channel-setup";
import { PartnerChannelReviewDetail } from "@/app/admin/journal/partner-channels/[communityId]/partner-channel-review-detail";
import { PARTNER_ALERT_IDEMPOTENCY_HEADER } from "../contracts/partner-alert-request";
import { JOURNAL_ADMIN_IDEMPOTENCY_HEADER } from "../../platform/contracts/journal-admin-request";
// Only shell/navigation are rendering ports; mounted controls and fetch/body/key
// transitions are actual React/MUI, not native authorization/provider proof.
vi.mock("@/app/dashboard-template", async () => {
  const React = await import("react");
  return { DashboardPage: ({ children }: { children: ReactNode }) => React.createElement("section", null, children),
    DashboardPanel: ({ children, title }: { children: ReactNode; title: string }) => React.createElement("section", null, title, children) };
});
vi.mock("next/link", async () => {
  const React = await import("react"); return { default: ({ children, href }: { children: ReactNode; href: string }) => React.createElement("a", { href }, children) };
});
const cid = "20000000-0000-4000-8000-000000000002", mid = "30000000-0000-4000-8000-000000000003", oid = "40000000-0000-4000-8000-000000000004";
function dto() {
  return { communityId: cid, displayName: "Real test server", sourceGuildId: "1559172784813514803", status: "draft",
    revision: 7, currentAgreementId: null, approvedAtUtc: null, reviewRequested: false, initialDraftPublisher: true,
    personalInspectionConfirmed: false, latestAgreement: null,
    contentPolicy: { blockedServerNames: [], blockedPhrases: [], authorMode: "all_humans", allowedAuthorIds: [] },
    mappings: [{ mappingId: mid, sourceChannelId: "40001", displayName: "Source alerts", reviewState: "draft",
      revision: 2, everApproved: false, approvedRevision: null, destinationGuildId: null,
      destinationChannelId: null as string | null, destinationRoleId: null as string | null }],
    offers: [{ offer: { offerId: oid, communityId: cid, version: 2, title: "Unpublished package", kind: "channel", mappingIds: [mid],
      amountMinor: 1000, currency: { code: "USD", minorUnitDigits: 2 }, cadence: { unit: "calendar_month", count: 1 }, billingProvider: "stripe" }, reviewState: "draft" }] };
}
let root: Root, host: HTMLDivElement;
const writes: { url: string; body: Record<string, unknown>; key: string }[] = [];
let current: ReturnType<typeof dto>;
let responses: (() => Response)[];
let contactUnavailable: boolean;
let choicesRevision: number;
const pair = { channelId: "40002", channelName: "Receiving alerts", roleId: "50001", roleName: "Dedicated access", available: true, reason: null };
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); writes.length = 0; current = dto(); responses = []; contactUnavailable = false; choicesRevision = 7;
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)); const headers = new Headers(init.headers);
      writes.push({ url, body, key: headers.get(PARTNER_ALERT_IDEMPOTENCY_HEADER) ?? headers.get(JOURNAL_ADMIN_IDEMPOTENCY_HEADER) ?? "" });
      return responses.shift()?.() ?? Response.json({ ok: false }, { status: 503 });
    }
    if (url.includes("/inspection-contact")) return contactUnavailable ? Response.json({ ok: false }, { status: 503 })
      : Response.json({ ok: true, result: { communityId: cid, contact: { discordUserId: "12345", displayName: "Actual human reviewer", profileUrl: "https://discord.com/users/12345" } } });
    if (url.includes("/resources?")) return Response.json({ ok: true, result: { communityId: cid, mappingId: mid,
      partnerRevision: choicesRevision, mappingRevision: 2, destinationGuildId: "1559172784813514803", options: [pair] } });
    if (url.endsWith("/source-channels")) return Response.json({ ok: true, result: { guildName: "Real test server",
      channels: [{ channelId: "40001", name: "Source alerts" }], unavailableChannels: [] } });
    return Response.json({ ok: true, result: current });
  }));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function flush() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); }
function button(label: string): HTMLElement {
  const element = [...document.querySelectorAll<HTMLElement>("button,[role=button]")].find(el => el.textContent?.trim() === label);
  if (!element) throw Error("Missing actual control " + label); return element;
}
async function click(label: string) { await act(async () => button(label).click()); await flush(); }
async function mountOwner() { await act(async () => root.render(createElement(CommunityPartnerChannelSetup, { communityId: cid, stripeOfferDrafts: true }))); await flush(); }
async function mountAdmin() { current.status = "awaiting_approval"; current.reviewRequested = true; current.mappings[0].reviewState = "awaiting_approval";
  await act(async () => root.render(createElement(PartnerChannelReviewDetail, { communityId: cid }))); await flush(); }
async function choosePair() {
  const combo = host.querySelector<HTMLElement>("[role=combobox]")!; expect(combo).toBeTruthy();
  await act(async () => combo.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }))); await flush();
  const option = [...document.querySelectorAll<HTMLElement>("[role=option]")].find(el => el.textContent?.includes("Receiving alerts"))!;
  expect(option).toBeTruthy(); await act(async () => option.click()); await flush();
}
describe("owner nonfinancial completion", () => {
  it("shows the actual designated human/profile and leaves personal inspection pending", async () => {
    await mountOwner(); await click("2. Review access");
    expect(host.textContent).toContain("Actual human reviewer"); expect(host.querySelector('a[href="https://discord.com/users/12345"]')).not.toBeNull();
    expect(host.textContent).toContain("Inspection pending"); expect(writes).toHaveLength(0);
  });
  it("keeps contact failure local to its panel without blocking a normally complete pending application", async () => {
    contactUnavailable = true; await mountOwner(); await click("2. Review access");
    expect(host.textContent).toContain("You can continue preparing and submit"); await click("6. Review");
    await act(async () => host.querySelector<HTMLInputElement>('input[type=checkbox]')!.click());
    expect((button("Submit for review") as HTMLButtonElement).disabled).toBe(false); expect(writes).toHaveLength(0);
  });
  it("confirms the shown existing version and retains an UNKNOWN removal through a refused retry", async () => {
    responses = [() => Response.json({ ok: false }, { status: 503 }), () => Response.json({ ok: false }, { status: 403 })];
    await mountOwner(); await click("4. Channel access and pricing"); await click("Remove draft offer");
    expect(document.body.textContent).toContain("version 2"); expect(writes).toHaveLength(0);
    current.revision = 99;
    await click("Remove offer"); expect(writes[0].body).toMatchObject({ action: "removeDraftOffer", offerId: oid, expectedLatestOfferVersion: 2, expectedRevision: 7 });
    await click("Retry same save"); expect(writes).toHaveLength(2); expect(writes[1]).toEqual(writes[0]);
    expect((button("Remove draft offer") as HTMLButtonElement).disabled).toBe(true);
    expect(host.textContent).not.toContain("No publishing change was made"); expect(host.textContent).toContain("outcome could not be confirmed");
  });
  it("accepts only a matching typed native removal receipt and reloads retained source coverage", async () => {
    responses = [() => { current.offers = []; current.revision = 8; return Response.json({ ok: true, result: {
      communityId: cid, partnerRevision: 8, resourceId: oid, resourceVersion: 2, state: "withdrawn" } }); }];
    await mountOwner(); await click("4. Channel access and pricing"); await click("Remove draft offer"); await click("Remove offer");
    expect(writes).toHaveLength(1); expect(current.mappings[0].mappingId).toBe(mid); expect(host.textContent).not.toContain("Unpublished package");
  });
});
describe("operator receiving snapshot and original uncertain command", () => {
  it("retains a malformed successful acknowledgment as UNKNOWN through a denied retry", async () => {
    responses = [() => Response.json({ ok: true, result: null }), () => Response.json({ ok: false }, { status: 403 })];
    await mountAdmin(); await click("Choose receiving channel"); await choosePair(); await click("Approve channel");
    expect(host.textContent).toContain("original review outcome is unconfirmed");
    await click("Retry same review action"); expect(writes).toHaveLength(2); expect(writes[1]).toEqual(writes[0]);
    expect(host.textContent).not.toContain("The review action was saved.");
    expect((button("Approve channel") as HTMLButtonElement).disabled).toBe(true);
  });
  it("uses a controlled actual-name pair and preserves the exact original approval through saved read plus denied retry", async () => {
    await mountAdmin(); await click("Choose receiving channel"); await choosePair();
    await click("Approve channel"); expect(writes[0].body).toMatchObject({ expectedRevision: 7, expectedMappingRevision: 2, destinationChannelId: "40002", destinationRoleId: "50001" });
    current.revision = 20; await click("Check saved review"); responses = [() => Response.json({ ok: false }, { status: 403 })];
    await click("Retry same review action"); expect(writes).toHaveLength(2); expect(writes[1]).toEqual(writes[0]);
    expect(host.textContent).toContain("original review outcome is unconfirmed"); expect((button("Approve channel") as HTMLButtonElement).disabled).toBe(true);
  });
  it("refuses metadata carrying a later view revision instead of upgrading old choices", async () => {
    choicesRevision = 8; await mountAdmin(); await click("Choose receiving channel");
    expect(host.textContent).toContain("Receiving choices are unavailable or this review changed");
    expect(host.querySelector('[role=combobox]')).toBeNull(); expect(writes).toHaveLength(0);
  });
  it("preserves an unavailable stored selection until a deliberate replacement", async () => {
    current.mappings[0].destinationChannelId = "49999"; current.mappings[0].destinationRoleId = "59999";
    await mountAdmin(); await click("Choose receiving channel");
    expect(host.textContent).toContain("previously selected pair is unavailable"); expect((button("Approve channel") as HTMLButtonElement).disabled).toBe(true);
    await choosePair(); await click("Approve channel"); expect(writes[0].body.destinationRoleId).toBe("50001");
  });
  it("shows an approved binding read-only using actual metadata", async () => {
    await mountAdmin(); current.mappings[0].reviewState = "approved"; current.mappings[0].destinationChannelId = "40002"; current.mappings[0].destinationRoleId = "50001";
    await act(async () => root.unmount()); root = createRoot(host);
    await act(async () => root.render(createElement(PartnerChannelReviewDetail, { communityId: cid }))); await flush();
    await click("View receiving details"); expect(host.textContent).toContain("Receiving alerts"); expect(host.textContent).toContain("Approved bindings are read-only");
    expect(host.querySelector('[role=combobox]')).toBeNull(); expect(writes).toHaveLength(0);
  });
});
