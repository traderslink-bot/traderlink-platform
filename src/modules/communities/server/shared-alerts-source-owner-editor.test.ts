// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SharedAlertsSourceClient } from "@/app/(dashboard)/communities/shared-alerts/shared-alerts-source-client";
import type { SharedSourceAssignmentDestination, SharedSourceAssignmentPublisher } from "../contracts/shared-alerts-contracts";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const first = "10000000-0000-4000-8000-000000000001", second = "20000000-0000-4000-8000-000000000002";
const destinationId = "30000000-0000-4000-8000-000000000003", channelId = "1559172786176401410";
const oldToken = "a".repeat(64), newToken = "b".repeat(64);
const publishers = [{ id: first, name: "Analyst A", available: true }, { id: second, name: "Analyst B", available: true }];
const channels = [{ id: channelId, name: "Source" }];
let host: HTMLDivElement, root: Root;
let sent: FormData[];
let reads: string[];
let reply: (form: FormData | null) => Promise<Response>;

function destination(token = oldToken, ids: readonly string[] = [first]): SharedSourceAssignmentDestination {
  return { id: destinationId, destinationId, name: "Configured source", channelId, active: true, publisherIds: ids, assignmentStateToken: token, hasLegacyAssignments: true };
}
async function render(current: SharedSourceAssignmentDestination | readonly SharedSourceAssignmentDestination[], people: readonly SharedSourceAssignmentPublisher[] = publishers) {
  await act(async () => { root.render(createElement(SharedAlertsSourceClient, { view: "owner", communitySlug: "mounted-owner", destinations: "id" in current ? [current] : current, publishers: people, channels })); });
}
function assignmentForm(id = destinationId) {
  const form = [...host.querySelectorAll<HTMLFormElement>("form")].find(item => item.querySelector('input[name="command"]')?.getAttribute("value") === "assign_publishers" && item.querySelector('input[name="destinationId"]')?.getAttribute("value") === id);
  if (!(form instanceof HTMLFormElement)) throw new Error("Mounted owner assignment form missing");
  return form;
}
function publisherCheckbox(id: string, target = destinationId) {
  const input = assignmentForm(target).querySelector(`input[name="publisherId"][value="${id}"]`);
  if (!(input instanceof HTMLInputElement)) throw new Error("Publisher checkbox missing");
  return input;
}
async function chooseSecond() {
  await act(async () => { publisherCheckbox(first).click(); publisherCheckbox(second).click(); });
  expect(publisherCheckbox(first).checked).toBe(false); expect(publisherCheckbox(second).checked).toBe(true);
}
async function submitAssignments() {
  await act(async () => { assignmentForm().dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
}
function snapshotToken() { return assignmentForm().querySelector<HTMLInputElement>('input[name="expectedAssignmentState"]')?.value; }
function button(label: string) {
  const item = [...host.querySelectorAll("button")].find(item => item.textContent === label);
  if (!item) throw new Error(`Button missing: ${label}`);
  return item;
}
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }); }
function acknowledgement(token: string, ids: readonly string[], target = destinationId) { return json({ status: "success", message: "Assignments saved.", assignment: { destinationId: target, publisherIds: ids, assignmentStateToken: token, hasLegacyAssignments: true } }); }
function currentRead(token: string, ids: readonly string[], people = publishers) { return json({ community: { slug: "mounted-owner" }, destinations: [destination(token, ids)], publishers: people }); }
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div"); document.body.append(host); root = createRoot(host); sent = []; reads = []; router.refresh.mockReset();
  reply = async () => json({ status: "error", message: "Current server assignments changed." }, 400);
  vi.stubGlobal("fetch", vi.fn(async (url: unknown, init?: RequestInit) => {
    if (init?.method === "POST") {
      if (!(init.body instanceof FormData)) throw new Error("Expected actual mounted form data");
      sent.push(init.body); return reply(init.body);
    }
    reads.push(String(url)); return reply(null);
  }));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe("Mounted general-owner assignment editor snapshot", () => {
  it("keeps edited IDs bound to their original token across an incoming props refresh", async () => {
    await render(destination()); const original = publisherCheckbox(second);
    await chooseSecond();
    await render(destination(newToken, []));
    expect(publisherCheckbox(second)).toBe(original); expect(original.checked).toBe(true);
    await submitAssignments();
    expect(sent).toHaveLength(1); expect(sent[0].getAll("publisherId")).toEqual([second]);
    expect(sent[0].get("expectedAssignmentState")).toBe(oldToken);
  });
  it("advances the editor only from its matching acknowledgement, then binds the next edit to that token", async () => {
    await render(destination()); await chooseSecond();
    reply = async () => acknowledgement(newToken, [second]); await submitAssignments();
    expect(snapshotToken()).toBe(newToken); expect(router.refresh).toHaveBeenCalledOnce();
    await render(destination(newToken, [second]));
    await act(async () => { publisherCheckbox(second).click(); publisherCheckbox(first).click(); });
    reply = async () => acknowledgement("c".repeat(64), [first]); await submitAssignments();
    expect(sent).toHaveLength(2); expect(sent[1].getAll("publisherId")).toEqual([first]); expect(sent[1].get("expectedAssignmentState")).toBe(newToken);
  });
  it("retains an unknown save across props refresh and requires explicit read reconciliation without an automatic retry", async () => {
    await render(destination()); await chooseSecond();
    reply = async () => { throw new Error("Response lost after possible commit"); }; await submitAssignments();
    await render(destination(newToken, [])); await submitAssignments();
    expect(sent).toHaveLength(1); expect(publisherCheckbox(second).checked).toBe(true); expect(snapshotToken()).toBe(oldToken);
    reply = async () => currentRead(newToken, []);
    const reload = button("Reload current assignments"); reload.focus(); await act(async () => reload.click());
    expect(reads).toHaveLength(1); expect(reads[0]).toContain("view=owner_assignments"); expect(document.activeElement).toBe(reload);
    expect(sent).toHaveLength(1); expect(snapshotToken()).toBe(newToken); expect(publisherCheckbox(second).checked).toBe(true);
    expect(host.textContent).toContain("Saved individuals in this editor: None");
    expect(host.textContent).toContain("Your selections are retained; review them before saving");
    reply = async () => acknowledgement("c".repeat(64), [second]); await submitAssignments();
    expect(sent).toHaveLength(2); expect(sent[1].get("expectedAssignmentState")).toBe(newToken);
  });
  it("keeps selected IDs and the old base when a rejection is followed by a failed reload", async () => {
    await render(destination()); await chooseSecond(); await submitAssignments();
    reply = async () => json({ community: { slug: "foreign-community" }, destinations: [destination(newToken, [])], publishers });
    await act(async () => button("Reload current assignments").click()); await submitAssignments();
    expect(sent).toHaveLength(1); expect(reads).toHaveLength(1); expect(snapshotToken()).toBe(oldToken); expect(publisherCheckbox(second).checked).toBe(true);
    expect(host.textContent).toContain("Current assignments could not be loaded");
  });
  it.each(["foreign destination", "different selected IDs"])("refuses a %s acknowledgement without upgrading the editor", async kind => {
    await render(destination()); await chooseSecond();
    reply = async () => kind === "foreign destination" ? acknowledgement(newToken, [second], "40000000-0000-4000-8000-000000000004") : acknowledgement(newToken, [first]);
    await submitAssignments(); expect(snapshotToken()).toBe(oldToken); expect(publisherCheckbox(second).checked).toBe(true); expect(router.refresh).not.toHaveBeenCalled();
    await submitAssignments(); expect(sent).toHaveLength(1);
  });
  it("keeps unavailable selections removable and role assignments outside the individual payload", async () => {
    await render(destination(oldToken, [second]), publishers.map(person => ({ ...person, available: person.id !== second })));
    expect(publisherCheckbox(second).checked).toBe(true); expect(button("Save publisher assignments").disabled).toBe(true);
    await act(async () => publisherCheckbox(second).click()); expect(button("Save publisher assignments").disabled).toBe(false);
    reply = async () => acknowledgement(newToken, []); await submitAssignments();
    expect(sent[0].getAll("publisherId")).toEqual([]); expect([...sent[0].keys()].some(key => /role/i.test(key))).toBe(false);
    expect(host.textContent).toContain("Existing role assignments are retained");
  });
  it("preserves legitimate general-owner add/edit channel forms without adding assignment tokens", async () => {
    await render(destination());
    const forms = [...host.querySelectorAll<HTMLFormElement>("form")].filter(form => form.querySelector('input[name="command"]')?.getAttribute("value") === "save_destination");
    expect(forms).toHaveLength(2);
    reply = async () => json({ status: "success", message: "Source channel saved.", destinationId });
    for (const [index, form] of forms.entries()) {
      const name = form.querySelector<HTMLInputElement>('input[name="name"]')!; name.value = index ? "Renamed source" : "Added source";
      await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    }
    expect(sent).toHaveLength(2); expect(sent.map(form => form.get("command"))).toEqual(["save_destination", "save_destination"]);
    expect(sent.map(form => form.get("name"))).toEqual(["Added source", "Renamed source"]);
    expect(sent.every(form => form.get("channelId") === channelId && !form.has("expectedAssignmentState"))).toBe(true);
    expect(router.refresh).toHaveBeenCalledTimes(2); expect(snapshotToken()).toBe(oldToken);
  });
  it("opens newly returned channel rows with their own snapshot without replacing an existing dirty editor", async () => {
    await render(destination()); await chooseSecond();
    const added = { ...destination("d".repeat(64), [second]), id: "40000000-0000-4000-8000-000000000004", destinationId: "40000000-0000-4000-8000-000000000004", name: "Added channel" };
    await render([destination(newToken, []), added]);
    expect(snapshotToken()).toBe(oldToken); expect(publisherCheckbox(second).checked).toBe(true);
    expect(assignmentForm(added.id).querySelector<HTMLInputElement>('input[name="expectedAssignmentState"]')?.value).toBe(added.assignmentStateToken);
    expect(publisherCheckbox(second, added.id).checked).toBe(true);
  });
});
