// @vitest-environment jsdom
import { act, createElement, StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTraderMaterialTheme } from "@/app/mui-theme";
import { CommunityPartnerChannelSetup } from "@/app/(dashboard)/communities/[communitySlug]/partner-channels/community-partner-channel-setup";
import { PartnerChannelCatalog, type PartnerChannelCatalogItem } from "@/app/(dashboard)/partner-channels/partner-channel-catalog";
import { PartnerChannelReviewDetail } from "@/app/admin/journal/partner-channels/[communityId]/partner-channel-review-detail";
import { PARTNER_ALERT_IDEMPOTENCY_HEADER } from "./partner-alert-request";

// Use the real client components and low-level design primitives. Transport is
// simulated solely for interaction regressions, never paid/backend acceptance.
vi.mock("@/app/dashboard-template", () => import("@/app/dashboard-ui"));
vi.mock("@/app/dashboard-page-help-link", () => ({ DashboardPageHelpLink: () => null }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: ReactNode }) => createElement("a", { href }, children) }));

const communityId = "11111111-1111-4111-8111-111111111111";
const mappings = ["Alpha", "Beta"].map((displayName, index) => ({
  mappingId: `22222222-2222-4222-8222-22222222222${index}`, displayName,
  sourceChannelId: `85000000000000001${index}`, revision: 1, reviewState: "draft",
  destinationChannelId: null, destinationRoleId: null,
}));
const view = { communityId, displayName: "Northstar", status: "draft", revision: 1,
  currentAgreementId: null, reviewRequested: false, latestAgreement: null, mappings, offers: [],
  contentPolicy: { blockedServerNames: ["Northstar Trading"], blockedPhrases: [], authorMode: "allowlist", allowedAuthorIds: ["850000000000000021"] } };
const adminView = { ...view, status: "awaiting_approval", reviewRequested: true,
  mappings: mappings.map(mapping => ({ ...mapping, reviewState: "awaiting_approval" })) };
const receivingPairs = [
  { channelId: "850000000000000051", channelName: "Receiving Alpha", roleId: "850000000000000052", roleName: "Dedicated Alpha", available: true, reason: null },
  { channelId: "850000000000000061", channelName: "Receiving Beta", roleId: "850000000000000062", roleName: "Dedicated Beta", available: true, reason: null },
];
let container: HTMLDivElement, root: Root;
const transport = vi.fn();
const posted: { body: Record<string, unknown>; headers: Record<string, string> }[] = [];
function button(text: string) {
  const found = [...container.querySelectorAll<HTMLElement>('button,[role="button"]')].find(node => node.textContent?.trim() === text);
  if (!found) throw new Error(`Missing button ${text}`);
  return found;
}
function field(text: string) {
  const label = [...container.querySelectorAll('label')].find(node => node.textContent?.replace(/\s*\*$/, '') === text);
  const input = label?.htmlFor ? document.getElementById(label.htmlFor) as HTMLInputElement : null;
  if (!input) throw new Error(`Missing field ${text}`);
  return input;
}
async function type(label: string, value: string) {
  await act(async () => {
    const input = field(label);
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function click(node: HTMLElement) { await act(async () => { node.click(); }); }
async function chooseReceivingPair(name: string) {
  const combo = container.querySelector<HTMLElement>('[role="combobox"]');
  expect(combo).not.toBeNull();
  await act(async () => combo!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
  const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(node => node.textContent?.includes(name));
  expect(option).toBeDefined();
  await click(option!);
}
async function mount(admin = false, stripeReady = true) {
  await act(async () => root.render(createElement(StrictMode, null,
    createElement(ThemeProvider, { theme: createTraderMaterialTheme("light") },
      admin ? createElement(PartnerChannelReviewDetail, { communityId })
        : createElement(CommunityPartnerChannelSetup, { communityId, stripeOfferDrafts: stripeReady,
          stripeStatus: stripeReady ? "ready" : "unconnected" })))));
}
beforeEach(() => {
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  posted.length = 0; transport.mockReset();
  transport.mockImplementation(async (_url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      posted.push({ body: JSON.parse(String(init.body)), headers: init.headers as Record<string, string> });
      return Response.json({ ok: false }, { status: 503 });
    }
    if (_url.endsWith("/source-channels")) {
      return Response.json({ ok: true, result: { guildName: "Northstar Trading", channels: [] } });
    }
    if (_url.includes("/resources?")) {
      const mappingId = new URL(_url, "https://synthetic.example.com").searchParams.get("mappingId");
      const mapping = adminView.mappings.find(row => row.mappingId === mappingId);
      if (!mapping) return Response.json({ ok: false }, { status: 404 });
      return Response.json({ ok: true, result: { communityId, mappingId, partnerRevision: adminView.revision,
        mappingRevision: mapping.revision, destinationGuildId: "850000000000000001", options: receivingPairs } });
    }
    return Response.json({ ok: true, result: _url.startsWith("/api/admin/") ? adminView : view });
  });
  vi.stubGlobal("fetch", transport);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

describe("Partner owner and review interaction regressions", () => {
  it("warns on unsaved details, protects unloading and keeps the draft on step changes", async () => {
    await mount(); await type("Additional blocked phrases", "My draft");
    expect(container.textContent).toContain("You have unsaved changes");
    const unload = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    await click(button("5. Content rules")); await click(button("1. Community details"));
    expect(field("Additional blocked phrases").value).toBe("My draft");
  });
  it("preserves author restrictions and the frozen request through an explicit retry after an unconfirmed save", async () => {
    await mount(); await type("Additional blocked phrases", "My draft");
    await click(button("Save changes"));
    expect(posted).toHaveLength(1);
    expect(button("Save changes").hasAttribute("disabled")).toBe(true);
    expect(field("Additional blocked phrases").disabled).toBe(true);
    expect(container.textContent).toContain("The save outcome could not be confirmed");
    expect(container.textContent).not.toContain("No publishing change was made");
    await click(button("Save changes"));
    expect(posted).toHaveLength(1);
    await click(button("Retry same save"));
    expect(posted).toHaveLength(2);
    expect(posted[0].body.displayName).toBe("Northstar Trading");
    expect(posted[0].body.expectedRevision).toBe(view.revision);
    expect(posted[0].body.contentPolicy).toMatchObject({ blockedServerNames: [], blockedPhrases: ["My draft"],
      authorMode: "allowlist", allowedAuthorIds: view.contentPolicy.allowedAuthorIds });
    expect(posted[0].headers[PARTNER_ALERT_IDEMPOTENCY_HEADER]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
    expect(posted[1].body).toEqual(posted[0].body);
    expect(posted[1].headers).toEqual(posted[0].headers);
    expect(field("Additional blocked phrases").value).toBe("My draft");
    expect(field("Additional blocked phrases").disabled).toBe(true);
    expect(button("Save changes").hasAttribute("disabled")).toBe(true);
    expect(container.textContent).toContain("You have unsaved changes");
    expect(container.textContent).toContain("The save outcome could not be confirmed");
    expect(container.textContent).not.toContain("No publishing change was made");
  });
  it("keeps Strict Mode channel selections matched to the clicked checkbox", async () => {
    await mount(); await click(button("4. Channel access and pricing"));
    const boxes = [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    expect(boxes).toHaveLength(2);
    await click(boxes[0]); await click(boxes[1]); await click(boxes[0]);
    expect(boxes[0].checked).toBe(false); expect(boxes[1].checked).toBe(true);
  });
  it("waits for a connected Stripe account before showing the paid offer form", async () => {
    await mount(false, false); await click(button("4. Channel access and pricing"));
    expect(container.textContent).toContain("Connect your Stripe account above to add paid offers.");
    expect(container.textContent).not.toContain("Whop account ID");
    expect(container.textContent).not.toContain("Save paid offer");
  });
  it("prefills an approved offer and sends its changed terms as the next version", async () => {
    const offer = { offerId: "33333333-3333-4333-8333-333333333333", version: 3, title: "Morning alerts",
      mappingIds: [mappings[0].mappingId], amountMinor: 1050, currency: { code: "USD", minorUnitDigits: 2 },
      cadence: { unit: "calendar_month", count: 2 }, billingProvider: "stripe" };
    const ordinary = transport.getMockImplementation()!;
    transport.mockImplementation(async (url, init) => init?.method === "POST" || url.endsWith("/source-channels")
      ? ordinary(url, init) : Response.json({ ok: true, result: { ...view, offers: [{ offer, reviewState: "approved" }] } }));
    await mount(); await click(button("4. Channel access and pricing"));
    await click(button("Edit offer"));
    expect(field("Offer name").value).toBe(offer.title);
    expect(field("Price").value).toBe("10.50");
    expect(field("Bill every").value).toBe("2");
    expect(button("Save offer changes").hasAttribute("disabled")).toBe(true);
    await type("Price", "11.75");
    await click(button("Save offer changes"));
    expect(posted[0]?.body).toMatchObject({ action: "saveOfferVersion", offer: {
      offerId: offer.offerId, version: 4, title: offer.title, amountMinor: 1175, mappingIds: offer.mappingIds, cadence: offer.cadence,
    } });
  });
  it("keeps a verified channel and its dedicated role together in Strict Mode", async () => {
    await mount(true);
    expect(container.textContent).not.toContain("Destination channel ID");
    await click(button("Choose receiving channel"));
    await chooseReceivingPair("Receiving Alpha");
    await chooseReceivingPair("Receiving Beta");
    const combo = container.querySelector<HTMLElement>('[role="combobox"]');
    expect(combo?.textContent).toContain("Receiving Beta");
    expect(combo?.textContent).toContain("Dedicated Beta");
    expect(posted).toHaveLength(0);
    await click(button("Approve channel"));
    expect(posted).toHaveLength(1);
    expect(posted[0].body).toMatchObject({ action: "approveMapping", communityId,
      mappingId: adminView.mappings[0].mappingId, expectedRevision: adminView.revision,
      expectedMappingRevision: adminView.mappings[0].revision,
      destinationChannelId: receivingPairs[1].channelId, destinationRoleId: receivingPairs[1].roleId });
  });
  it("does not claim rollback after a lost approval response and reuses the unchanged reference", async () => {
    await mount(true);
    await click(button("Choose receiving channel"));
    await chooseReceivingPair("Receiving Alpha");
    transport.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method !== "POST") return Response.json({ ok: true, result: adminView });
      posted.push({ body: JSON.parse(String(init.body)), headers: init.headers as Record<string, string> });
      if (posted.length === 1) throw new Error("Synthetic response loss after possible commit");
      return Response.json({ ok: false }, { status: 403 });
    });
    await click(button("Approve channel"));
    expect(container.textContent).toContain("original review outcome is unconfirmed");
    expect(container.textContent).not.toContain("Nothing was approved");
    expect(button("Approve channel").hasAttribute("disabled")).toBe(true);
    await click(button("Approve channel"));
    expect(posted).toHaveLength(1);
    await click(button("Retry same review action"));
    expect(posted).toHaveLength(2);
    expect(posted[1].body).toEqual(posted[0].body);
    expect(posted[1].headers).toEqual(posted[0].headers);
    expect(container.textContent).toContain("original review outcome is unconfirmed");
    expect(container.textContent).not.toContain("The review action was saved.");
  });
});

describe("Partner checkout eligibility presentation", () => {
  it("cancels a pending Stripe redirect when the selected offer pauses", async () => {
    let finishCheckout!: (response: Response) => void;
    transport.mockReturnValue(new Promise<Response>(resolve => { finishCheckout = resolve; }));
    const item: PartnerChannelCatalogItem = { communityId, offerKey: "offer:1", communityName: "Northstar",
      channels: ["Alpha"], price: "$25", cadence: "month", access: "available",
      billingProvider: "stripe", stripeCheckout: true, checkoutHref: null };
    const render = (offer: PartnerChannelCatalogItem) => act(async () =>
      root.render(createElement(ThemeProvider, { theme: createTraderMaterialTheme("light") },
        createElement(PartnerChannelCatalog, { catalogStatus: "ready", premiumStatus: "active", items: [offer] }))));
    await render(item);
    await click(button("View channels"));
    const checkout = [...document.body.querySelectorAll("button")].find(node => node.textContent === "Continue to Stripe");
    expect(checkout).toBeDefined();
    await click(checkout!);
    const signal = transport.mock.calls[0]?.[1]?.signal as AbortSignal;
    expect(signal?.aborted).toBe(false);
    await render({ ...item, saleState: "paused", access: "attention", stripeCheckout: false });
    expect(signal.aborted).toBe(true);
    await act(async () => finishCheckout(Response.json({ url: "https://checkout.stripe.com/c/pay/fixture" })));
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain("Check access");
    expect(dialog?.textContent).not.toContain("Stripe checkout is temporarily unavailable");
  });

  it("shows which package channels are already covered before continuing to Stripe", async () => {
    await act(async () => root.render(createElement(ThemeProvider, { theme: createTraderMaterialTheme("dark") },
      createElement(PartnerChannelCatalog, { catalogStatus: "ready", premiumStatus: "active", items: [{
        communityId, offerKey: "offer:1", communityName: "Northstar", channels: ["Alpha", "Beta"],
        coveredChannels: ["Alpha"], price: "$25", cadence: "month", access: "available",
        billingProvider: "stripe", stripeCheckout: true, checkoutHref: null,
      }] }))));
    await click(button("View channels"));
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog?.querySelector('[role="alert"]')?.textContent).toContain("already cover Alpha.");
    expect(dialog?.querySelector('[role="alert"]')?.textContent).not.toContain("Beta");
    expect([...dialog?.querySelectorAll("button") ?? []].some(item => item.textContent === "Continue to Stripe" && !item.disabled)).toBe(true);
    expect(transport).not.toHaveBeenCalled();
  });

  it.each(["unavailable", "checking", "attention", "active"] as const)(
    "only offers checkout with verified active Premium (%s)", async premiumStatus => {
      await act(async () => root.render(createElement(ThemeProvider, { theme: createTraderMaterialTheme("light") },
        createElement(PartnerChannelCatalog, { catalogStatus: "ready", premiumStatus, items: [{
          communityId, offerKey: "offer:1", communityName: "Northstar", channels: ["Alpha"],
          price: "$25", cadence: "month", access: "available",
          checkoutHref: "https://whop.com/synthetic/checkout/plan_test",
        }] }))));
      await click(button("View channels"));
      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(Boolean(dialog?.querySelector('a[href^="https://whop.com/"]'))).toBe(premiumStatus === "active");
    },
  );
});

describe("Partner access check presentation", () => {
  it.each([
    ["paused", "Publishing paused", true],
    ["previous", "Previous offer", true],
    ["closed", "Sales closed", false],
  ] as const)("keeps a %s purchase visible and blocks checkout", async (saleState, label, canCheckAccess) => {
    await act(async () => root.render(createElement(ThemeProvider, { theme: createTraderMaterialTheme("dark") },
      createElement(PartnerChannelCatalog, { catalogStatus: "ready", premiumStatus: "active", items: [{
        communityId, offerKey: "offer:1", communityName: "Northstar", channels: ["Alpha"],
        price: "$25", cadence: "month", access: "attention", saleState, billingProvider: "stripe",
        stripeCheckout: true, checkoutHref: "https://whop.com/synthetic/checkout/plan_test",
      }] }))));
    expect(container.textContent).toContain(label);
    await click(button("View channels"));
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain("Alpha");
    expect(dialog?.textContent).not.toContain("Continue to Stripe");
    expect(dialog?.querySelector('a[href^="https://whop.com/"]')).toBeNull();
    expect([...dialog?.querySelectorAll("button") ?? []].some(item => item.textContent === "Check access")).toBe(canCheckAccess);
    expect(transport).not.toHaveBeenCalled();
  });

  it.each([
    [200, "eligible", "Your paid subscriptions were verified."],
    [403, "subscription_required", "You need paid TraderLink Premium"],
    [503, "verification_unavailable", "Access could not be verified"],
  ] as const)("shows the result of HTTP %s without claiming a role grant", async (status, code, message) => {
    transport.mockResolvedValue(Response.json({ ok: status === 200, code }, { status }));
    await act(async () => root.render(createElement(ThemeProvider, { theme: createTraderMaterialTheme("light") },
      createElement(PartnerChannelCatalog, { catalogStatus: "ready", premiumStatus: "unavailable", items: [{
        communityId, offerKey: "offer:1", communityName: "Northstar", channels: ["Alpha"],
        price: "$25", cadence: "month", access: "attention", checkoutHref: null,
      }] }))));
    await click(button("View channels"));
    const check = [...document.body.querySelectorAll("button")].find(item => item.textContent === "Check access");
    expect(check).toBeDefined();
    await click(check!);
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain(message);
    expect(dialog?.textContent).not.toContain("Access active");
    expect(transport).toHaveBeenCalledWith(
      `/api/partner-channels/communities/${communityId}/offers/offer%3A1/access`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});
