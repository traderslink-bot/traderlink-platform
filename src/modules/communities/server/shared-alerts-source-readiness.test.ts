// @vitest-environment jsdom
import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SharedAlertsSourceClient } from "@/app/(dashboard)/communities/shared-alerts/shared-alerts-source-client";
import type { SharedSourceAlert } from "./shared-alerts-source-publication";
import { TRADERSLINK_APP_HELP_GUIDES } from "@/src/modules/help/traderslink-app-guides";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
type Props = Extract<ComponentProps<typeof SharedAlertsSourceClient>, { view: "publisher" }>;
const audience = "10000000-0000-4000-8000-000000000001", channel = "20000000-0000-4000-8000-000000000002";
const missingChannel = "30000000-0000-4000-8000-000000000003";
const initial: SharedSourceAlert = {
  alertId: "40000000-0000-4000-8000-000000000004", communityId: "50000000-0000-4000-8000-000000000005",
  slug: "saved-alert", authorUserId: "60000000-0000-4000-8000-000000000006", title: "Saved title", symbol: "TL",
  body: "Saved alert text", audienceId: audience, status: "draft", publishingMode: "tracked_page", publishedAtUtc: null,
  updatedAtUtc: "2026-11-20T06:00:00.000Z",
};
const base: Props = { view: "publisher", communitySlug: "source-community", audiences: [{ id: audience, name: "Members" }],
  destinations: [{ id: channel, name: "Source General" }], initialAlert: initial, initialDistribution: "website" };
let host: HTMLDivElement, root: Root, sent: FormData[], requests: string[];
let reply: (form: FormData) => Promise<Response>;
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }); }
async function render(props: Partial<Props> = {}) { await act(async () => root.render(createElement(SharedAlertsSourceClient, { ...base, ...props }))); }
function input(name: string) {
  const item = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
  if (!item) throw new Error(`Input missing: ${name}`);
  return item;
}
function button(value: string) {
  const item = host.querySelector<HTMLButtonElement>(`button[value="${value}"]`);
  if (!item) throw new Error(`Button missing: ${value}`);
  return item;
}
function checkbox(id: string) {
  const item = host.querySelector<HTMLInputElement>(`input[type="checkbox"][value="${id}"]`);
  if (!item) throw new Error("Source checkbox missing");
  return item;
}
async function text(name: string, value: string) {
  const target = input(name), prototype = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(target, value);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function select(name: string, value: string) {
  const target = input(name), combobox = target.parentElement!.querySelector<HTMLElement>('[role="combobox"]');
  if (!combobox) throw new Error("Mounted MUI combobox missing");
  vi.spyOn(combobox.parentElement!, "getBoundingClientRect").mockReturnValue({ width: 200, height: 40, top: 0, left: 0, right: 200, bottom: 40, x: 0, y: 0, toJSON() {} });
  await act(async () => { combobox.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })); });
  const option = document.querySelector<HTMLElement>(`[role="option"][data-value="${value}"]`);
  if (!option) throw new Error(`Mounted option missing: ${value}`);
  await act(async () => option.click());
}
async function clickChannel(id = channel) { await act(async () => checkbox(id).click()); }
async function submit(value: string) { await act(async () => button(value).click()); }
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div"); document.body.append(host); root = createRoot(host); sent = []; requests = [];
  router.refresh.mockReset();
  reply = async () => json({ status: "error", message: "Server permission changed. Your text is retained." }, 400);
  vi.stubGlobal("fetch", vi.fn(async (url: unknown, init?: RequestInit) => {
    requests.push(String(url));
    if (init?.method !== "POST" || !(init.body instanceof FormData)) throw new Error("Unexpected automatic/read request");
    sent.push(init.body); return reply(init.body);
  }));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Mounted Shared source delivery/readiness", () => {
  it("distinguishes Website only from Discord and preserves deliberate channels/content across real mode controls", async () => {
    await render();
    expect(host.textContent).toContain("Website only requests no Discord posts");
    expect(host.textContent).toContain("Source channels for private-page access");
    expect(button("published").disabled).toBe(true); expect(button("draft").disabled).toBe(false);
    await clickChannel(); await text("body", "Edited content kept across modes");
    expect(button("published").disabled).toBe(false);
    await select("distribution", "discord"); await select("publishingMode", "discord_post");
    expect(host.textContent).toContain("receiving community's channel and approval settings");
    await select("distribution", "website");
    expect(input("publishingMode").value).toBe("tracked_page");
    expect(host.querySelector('input[type="hidden"][name="publishingMode"]')?.getAttribute("value")).toBe("tracked_page");
    await select("distribution", "discord");
    expect(input("publishingMode").value).toBe("tracked_page");
    expect(checkbox(channel).checked).toBe(true); expect(input("body").value).toBe("Edited content kept across modes");
    expect(requests).toEqual([]);
    await submit("published");
    expect(sent).toHaveLength(1); expect(sent[0].getAll("destinationId")).toEqual([channel]);
    expect(sent[0].get("distribution")).toBe("discord"); expect(sent[0].getAll("publishingMode")).toEqual(["tracked_page"]);
  });
  it("saves a valid new draft without channels and never describes the preview as a delivery receipt", async () => {
    const savedAt = "2026-11-20T06:00:01.000Z";
    reply = async () => json({ status: "success", message: "Draft saved.", alert: { ...initial, updatedAtUtc: savedAt } });
    await render({ destinations: [] });
    expect(host.textContent).toContain("You can save a draft without selecting source channels");
    expect(host.textContent).toContain("Alert content preview"); expect(host.textContent).toContain("authored content");
    expect(button("published").disabled).toBe(true); await submit("draft");
    expect(sent[0].get("status")).toBe("draft"); expect(sent[0].getAll("destinationId")).toEqual([]);
    expect(sent[0].getAll("publishingMode")).toEqual(["tracked_page"]);
    expect(host.textContent).toContain("Draft saved."); expect(input("expectedUpdatedAtUtc").value).toBe(savedAt);
    expect(router.refresh).toHaveBeenCalledOnce(); expect(sent).toHaveLength(1);
  });
  it.each([undefined, false, true])("forwards only the supplied owner presentation fact (%s) through the publisher composition", async isOwner => {
    await render({ destinations: [], isOwner });
    const link = host.querySelector('a[href="/communities/source-community/manage/shared-alerts/source-channels"]');
    expect(Boolean(link)).toBe(isOwner === true);
    expect(host.textContent).toContain(isOwner ? "Check individual publisher assignments" : "Ask your server owner");
    expect(requests).toEqual([]);
  });
  it("does not offer draft or publish readiness without an available audience, even after incoming choices change", async () => {
    await render({ audiences: [] });
    expect(host.textContent).toContain("A current source audience is required");
    expect(host.textContent).not.toContain("You can save a draft without selecting source channels");
    expect(button("draft").disabled).toBe(true); expect(button("published").disabled).toBe(true);
    await render({ audiences: [{ id: "70000000-0000-4000-8000-000000000007", name: "Different audience" }] });
    expect(button("draft").disabled).toBe(true); expect(input("audienceId").value).toBe(audience);
    expect(requests).toEqual([]);
  });
  it("keeps invalid content from appearing ready, then restores a valid draft without making a send", async () => {
    await render();
    for (const [name, value] of [["title", "   "], ["body", "x".repeat(501)], ["symbol", "invalid symbol"]]) {
      await text(name, value); expect(button("draft").disabled).toBe(true);
      expect(host.textContent).not.toContain("You can save a draft without selecting source channels");
      await text(name, name === "title" ? initial.title : name === "body" ? initial.body : initial.symbol!);
      expect(button("draft").disabled).toBe(false);
    }
    await text("title", "\tPadded title\t");
    expect(button("draft").disabled).toBe(false);
    expect(requests).toEqual([]);
  });
  it("retains unavailable previous selections across props/mode changes and requires explicit removal even for a draft", async () => {
    await render({ initialDestinationIds: [channel, missingChannel] });
    expect(host.textContent).toContain("Unavailable previous source channel"); expect(host.textContent).not.toContain(missingChannel);
    expect(button("draft").disabled).toBe(true); expect(button("published").disabled).toBe(true);
    await render({ initialDestinationIds: [], destinations: [] });
    expect(checkbox(channel).checked).toBe(true); expect(checkbox(missingChannel).checked).toBe(true);
    await select("distribution", "discord"); expect(checkbox(missingChannel).checked).toBe(true);
    await clickChannel(missingChannel); expect(button("draft").disabled).toBe(true);
    await clickChannel(channel); expect(button("draft").disabled).toBe(false); expect(button("published").disabled).toBe(true);
    expect(requests).toEqual([]); await submit("draft"); expect(sent[0].getAll("destinationId")).toEqual([]);
  });
  it("retains chosen channels/text and the original request identity through a rejected or unknown save without automatic retry", async () => {
    await render(); await clickChannel(); await text("body", "Keep this draft text");
    await submit("draft"); const requestId = sent[0].get("requestId");
    expect(host.textContent).toContain("Server permission changed");
    reply = async () => { throw new Error("Unknown network result"); };
    await submit("draft");
    expect(sent).toHaveLength(2); expect(sent[1].get("requestId")).toBe(requestId);
    expect(checkbox(channel).checked).toBe(true); expect(input("body").value).toBe("Keep this draft text");
    expect(input("expectedUpdatedAtUtc").value).toBe(initial.updatedAtUtc); expect(router.refresh).not.toHaveBeenCalled();
    await select("distribution", "discord"); await select("distribution", "website");
    expect(sent).toHaveLength(2); expect(host.textContent).toContain("Your text is still here");
  });
  it("locks editing while a deliberate save is pending and retains the editor after its rejected response", async () => {
    let settle!: (value: Response) => void;
    reply = () => new Promise(resolve => { settle = resolve; });
    await render({ initialDestinationIds: [channel] });
    await submit("draft");
    expect(host.querySelector('form')?.getAttribute("aria-busy")).toBe("true");
    expect(input("title").closest("fieldset")?.disabled).toBe(true);
    expect(sent).toHaveLength(1);
    await act(async () => settle(json({ status: "error", message: "Review current permission before saving." }, 400)));
    expect(input("title").closest("fieldset")?.disabled).toBe(false); expect(checkbox(channel).checked).toBe(true);
    expect(sent).toHaveLength(1);
  });
  it("withdraws the captured original despite invalid dirty text, missing audience/choices and no selected channel", async () => {
    const published = { ...initial, status: "published" as const, publishedAtUtc: initial.updatedAtUtc };
    reply = async () => json({ status: "success", message: "Alert withdrawn.", alert: { ...published, status: "archived", updatedAtUtc: "2026-11-20T06:00:02.000Z" } });
    await render({ initialAlert: published, audiences: [], destinations: [] });
    await text("title", ""); await text("body", "x".repeat(501)); await text("symbol", "bad symbol");
    expect(button("published").disabled).toBe(true); expect(button("archived").disabled).toBe(false);
    expect(button("archived").formNoValidate).toBe(true);
    expect(host.textContent).toContain("Changing Delivery does not recall previous posts");
    // JSDOM requestSubmit validates even when the submitter has formNoValidate.
    // Exercise the mounted React handler with the native event a browser emits;
    // real-browser validation behavior remains a separate acceptance boundary.
    await act(async () => button("archived").form!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true, submitter: button("archived") })));
    expect(sent).toHaveLength(1);
    expect(Object.fromEntries(["title", "body", "symbol", "audienceId", "publishingMode"].map(name => [name, sent[0].get(name)]))).toEqual({ title: initial.title, body: initial.body, symbol: initial.symbol, audienceId: audience, publishingMode: initial.publishingMode });
    expect(sent[0].get("status")).toBe("archived"); expect(sent[0].get("expectedUpdatedAtUtc")).toBe(initial.updatedAtUtc);
    expect(host.textContent).toContain("This alert has been withdrawn.");
    expect(input("title").closest("fieldset")?.disabled).toBe(true); expect(sent).toHaveLength(1);
  });
  it("keeps the Shared Help aligned with new mode/readiness guidance and preserves separate branded/Stats access", () => {
    const shared = JSON.stringify(TRADERSLINK_APP_HELP_GUIDES.find(guide => guide.slug === "shared-alerts"));
    expect(shared).toContain("Website only requests no new Discord posts");
    expect(shared).toContain("does not grant Stats access");
    expect(shared).toContain("Withdrawal concerns the saved publication");
    expect(shared).toContain("A new draft can be saved without selecting channels");
  });
});
