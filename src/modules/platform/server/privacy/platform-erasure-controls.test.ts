// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountErasureControls, ErasureViewerProvider, useAccountErasureRequest } from "@/app/(dashboard)/account/account-erasure-controls";
import { ClearDemoDataAction, DemoDataCallout } from "@/app/(dashboard)/demo-data-callout";
import { ERASURE_STATUS_PROTOCOL, erasureStorageKey, readErasureAttempt, type ErasureBody } from "../../contracts/account-erasure-status";

const viewer = `v1:${"a".repeat(64)}`, otherViewer = `v1:${"b".repeat(64)}`, selection = "c".repeat(64);
const body: ErasureBody = { action: "traderlink_account", confirmation: "DELETE MY TRADERLINK ACCOUNT", expectedAccountSelectionRef: null, expectedViewerRef: viewer };
const key = erasureStorageKey(viewer), roots: Root[] = [], hosts: HTMLElement[] = [];
let posts: string[], held: Set<string>, lockNames: string[], reply: (bytes: string) => Promise<Response>;
const originalLocks = Object.getOwnPropertyDescriptor(navigator, "locks");
function result(bytes: string, status: "deleted" | "known_not_submitted" = "known_not_submitted") {
  const parsed = JSON.parse(bytes) as ErasureBody;
  return Response.json({ protocol: ERASURE_STATUS_PROTOCOL, status, action: parsed.action,
    expectedViewerRef: parsed.expectedViewerRef, bodySha256: createHash("sha256").update(bytes).digest("hex") }, { status: status === "deleted" ? 200 : 409 });
}
beforeEach(() => {
  localStorage.clear(); posts = []; held = new Set(); lockNames = [];
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("crypto", webcrypto);
  // Explicit LockManager API port implements exclusive/ifAvailable semantics.
  // Real-browser multi-tab Web Locks qualification remains a separate gate.
  Object.defineProperty(navigator, "locks", { configurable: true, value: { request: async (
    name: string, options: { mode: string; ifAvailable: boolean }, callback: (lock: object | null) => Promise<unknown>,
  ) => {
    expect(options).toEqual({ mode: "exclusive", ifAvailable: true }); lockNames.push(name);
    if (held.has(name)) return callback(null);
    held.add(name); try { return await callback({ name }); } finally { held.delete(name); }
  } } });
  reply = async () => { throw new Error("Synthetic lost result"); };
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === "POST") { posts.push(String(init.body)); return reply(String(init.body)); }
    return Response.json({ protocol: ERASURE_STATUS_PROTOCOL, viewerRef: viewer, correlation: "recent_only", exact: null,
      currentPending: false, more: false, recent: [] });
  }));
  // jsdom records unsupported navigation; this is not browser/navigation proof.
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount());
  for (const host of hosts.splice(0)) host.remove();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
  if (originalLocks) Object.defineProperty(navigator, "locks", originalLocks); else Reflect.deleteProperty(navigator, "locks");
});
async function mount(node: ReturnType<typeof h>) {
  const host = document.createElement("div"); document.body.append(host); hosts.push(host);
  const root = createRoot(host); roots.push(root); await act(async () => root.render(node)); return { root, host };
}
async function until(check: () => void) {
  for (let i = 0; i < 60; i++) { try { check(); return; } catch { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); } }
  check();
}
function button(text: string, host: ParentNode = document): HTMLButtonElement {
  const found = [...host.querySelectorAll("button")].find(node => node.textContent === text);
  if (!found) throw new Error(`Missing ${text}`); return found;
}
async function click(node: HTMLElement) { await act(async () => node.click()); }
function Harness({ refValue = viewer, command = body }: { refValue?: string; command?: ErasureBody }) {
  const request = useAccountErasureRequest(refValue);
  return h("div", null,
    h("button", { disabled: !request.ready || request.working, onClick: () => void request.send(command) }, "Send"),
    h("button", { onClick: () => void request.check() }, "Check"),
    h("output", null, request.error, request.attempt?.phase));
}
async function harness(command = body, refValue = viewer) {
  const mounted = await mount(h(Harness, { command, refValue }));
  await until(() => expect(button("Send", mounted.host).disabled).toBe(false)); return mounted;
}
async function typeConfirmation(text: string) {
  const input = document.querySelector<HTMLInputElement>('[role=dialog] input')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
describe("actual mounted erasure coordinator with synthetic HTTP/storage/LockManager ports", () => {
  it("serializes already-ready privacy and demo roots across actions; lock release never releases UNKNOWN", async () => {
    await mount(h(AccountErasureControls, { viewerRef: viewer, journalAccountCount: 2, activeAccount: { displayName: "Original account", selectionRef: selection } }));
    await until(() => expect(button("Delete TraderLink account").disabled).toBe(false));
    await mount(h(ErasureViewerProvider, { viewerRef: viewer }, h(ClearDemoDataAction, { expectedAccountSelectionRef: selection })));
    await until(() => expect(button("Clear demo data and start fresh →").disabled).toBe(false));
    await click(button("Delete TraderLink account")); await typeConfirmation("DELETE MY TRADERLINK ACCOUNT");
    await click(button("Clear demo data and start fresh →"));
    // The most recently opened portal is the demo dialog.
    const inputs = [...document.querySelectorAll<HTMLInputElement>('[role=dialog] input')];
    await act(async () => { const input = inputs[inputs.length - 1]!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "DELETE ACCOUNT"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    let finish!: (response: Response) => void; reply = () => new Promise(resolve => { finish = resolve; });
    await click(button("Delete account")); await until(() => expect(posts).toHaveLength(1));
    await click(button("Clear demo data")); expect(posts).toHaveLength(1);
    await act(async () => finish(Response.json({ status: "unavailable" }, { status: 500 })));
    await until(() => expect(JSON.parse(localStorage.getItem(key)!).phase).toBe("outcome_unknown"));
    await click(button("Check saved request")); expect(button("Clear demo data and start fresh →").disabled).toBe(true);
    expect(new Set(lockNames).size).toBe(1); expect(posts).toHaveLength(1);
    expect(JSON.parse(posts[0])).toMatchObject({ action: "traderlink_account", expectedViewerRef: viewer });
  });
  it.each(["compact", "workspace"] as const)("keeps the normal %s demo body/selection and accepts only its matching result", async variant => {
    reply = async bytes => result(bytes, "deleted");
    await mount(h(ErasureViewerProvider, { viewerRef: viewer }, h(DemoDataCallout, { expectedAccountSelectionRef: selection, variant })));
    await until(() => expect(button("Clear demo data and start fresh →").disabled).toBe(false));
    await click(button("Clear demo data and start fresh →")); await typeConfirmation("DELETE ACCOUNT"); await click(button("Clear demo data"));
    await until(() => expect(JSON.parse(localStorage.getItem(key)!).phase).toBe("resolved"));
    expect(posts).toHaveLength(1); expect(JSON.parse(posts[0])).toEqual({ action: "demo_trade_tracker_account", confirmation: "DELETE ACCOUNT", expectedAccountSelectionRef: selection, expectedViewerRef: viewer });
  });
  it("fails closed outside genuine server-supplied demo context", async () => {
    await mount(h(ClearDemoDataAction, { expectedAccountSelectionRef: selection }));
    expect(button("Clear demo data and start fresh →").disabled).toBe(true); expect(posts).toHaveLength(0);
  });
  it.each([401, 403, 409, 429, 500])("retains original uncertainty for generic HTTP %i without another POST", async status => {
    reply = async () => Response.json({ status: "unavailable" }, { status });
    const { host } = await harness(); await click(button("Send", host));
    await until(() => expect(host.textContent).toContain("original request is retained"));
    const original = localStorage.getItem(key)!; await click(button("Check", host));
    expect(button("Send", host).disabled).toBe(true); expect(localStorage.getItem(key)).toBe(original); expect(posts).toHaveLength(1);
  });
  it.each(["malformed", "generic success", "foreign acknowledgement"])("retains UNKNOWN on %s", async kind => {
    reply = async () => kind === "malformed" ? new Response("{") : Response.json(kind === "generic success" ? { status: "deleted" }
      : { protocol: ERASURE_STATUS_PROTOCOL, status: "deleted", action: body.action, expectedViewerRef: otherViewer, bodySha256: "0".repeat(64) });
    const { host } = await harness(); await click(button("Send", host));
    await until(() => expect(JSON.parse(localStorage.getItem(key)!).phase).toBe("outcome_unknown")); expect(button("Send", host).disabled).toBe(true);
  });
  it("resolves only a matching response and retains the resolution instead of deleting the key", async () => {
    reply = async bytes => result(bytes);
    const { host } = await harness(); await click(button("Send", host));
    await until(() => expect(JSON.parse(localStorage.getItem(key)!).phase).toBe("resolved"));
    expect(posts).toHaveLength(1); expect(button("Send", host).disabled).toBe(false);
    await click(button("Send", host)); await until(() => expect(posts).toHaveLength(2));
  });
  it("reloads the original across changed action/selection and never adopts recent status as resolution", async () => {
    const original = await harness(); await click(button("Send", original.host));
    await until(() => expect(JSON.parse(localStorage.getItem(key)!).phase).toBe("outcome_unknown"));
    const bytes = localStorage.getItem(key)!;
    await act(async () => original.root.unmount()); roots.splice(roots.indexOf(original.root), 1);
    const other = await mount(h(Harness, { command: { ...body, action: "trade_tracker_account", confirmation: "DELETE ACCOUNT", expectedAccountSelectionRef: selection } }));
    await click(button("Check", other.host)); expect(button("Send", other.host).disabled).toBe(true);
    expect(localStorage.getItem(key)).toBe(bytes); expect(posts).toHaveLength(1);
  });
  it.each(["throw", "no-op", "readback differs"])("sends zero requests if storage %s", async mode => {
    const { host } = await harness();
    if (mode === "throw") vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("synthetic quota"); });
    if (mode === "no-op") vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
    if (mode === "readback differs") { const get = Storage.prototype.getItem; let writes = false;
      const set = Storage.prototype.setItem; vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) { writes = true; return set.call(this, k, v); });
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, k: string) { return writes && k === key ? "different" : get.call(this, k); }); }
    await click(button("Send", host)); await until(() => expect(host.querySelector("output")!.textContent).not.toBe(""));
    expect(posts).toHaveLength(0); expect(button("Send", host).disabled).toBe(true);
  });
  it.each(["read throws", "corrupt", "unsupported lock"])("refuses initialization when %s", async mode => {
    if (mode === "read throws") vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("synthetic security error"); });
    if (mode === "corrupt") localStorage.setItem(key, "{");
    if (mode === "unsupported lock") Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
    const { host } = await mount(h(Harness, {})); await click(button("Send", host));
    expect(posts).toHaveLength(0); expect(button("Send", host).disabled).toBe(true);
  });
  it("observed removal/clear cannot unlock UNKNOWN even after lock release", async () => {
    const { host } = await harness(); await click(button("Send", host));
    await until(() => expect(JSON.parse(localStorage.getItem(key)!).phase).toBe("outcome_unknown"));
    localStorage.removeItem(key);
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key, newValue: null })));
    await click(button("Check", host)); expect(button("Send", host).disabled).toBe(true); expect(posts).toHaveLength(1);
  });
  it("keeps viewer A original separate when a fresh B context mounts", async () => {
    const a = await harness(); await click(button("Send", a.host));
    await until(() => expect(JSON.parse(localStorage.getItem(key)!).phase).toBe("outcome_unknown"));
    const saved = localStorage.getItem(key)!;
    const b = await harness({ ...body, expectedViewerRef: otherViewer }, otherViewer);
    expect(b.host.textContent).not.toContain("outcome_unknown"); expect(localStorage.getItem(key)).toBe(saved); expect(posts).toHaveLength(1);
  });
  it("checks protocol and original-body integrity before restoring any saved record", async () => {
    const { host } = await harness(); await click(button("Send", host));
    await until(() => expect(localStorage.getItem(key)).not.toBeNull());
    const original = localStorage.getItem(key)!; expect((await readErasureAttempt(original, viewer)).body).toBe(posts[0]);
    const damaged = JSON.parse(original); damaged.body = JSON.stringify({ ...body, action: "demo_trade_tracker_account" });
    await expect(readErasureAttempt(JSON.stringify(damaged), viewer)).rejects.toThrow();
  });
  it.each(["-".repeat(36), "00000000-0000-0000-0000-000000000000"])("rejects a corrupt saved attempt locator (%s)", async attemptId => {
    const { host } = await harness(); await click(button("Send", host));
    await until(() => expect(JSON.parse(localStorage.getItem(key)!).phase).toBe("outcome_unknown"));
    const damaged = JSON.parse(localStorage.getItem(key)!); damaged.attemptId = attemptId;
    await expect(readErasureAttempt(JSON.stringify(damaged), viewer)).rejects.toThrow("Unreadable saved request");
  });

  it.each(["account", "demo"])("requires a fresh confirmation after viewer change in the mounted %s control", async kind => {
    const ui = (refValue: string) => kind === "account"
      ? h(AccountErasureControls, { viewerRef: refValue, journalAccountCount: 1, activeAccount: { displayName: "Selected", selectionRef: selection } })
      : h(ErasureViewerProvider, { viewerRef: refValue }, h(ClearDemoDataAction, { expectedAccountSelectionRef: selection }));
    const mounted = await mount(ui(viewer));
    const opener = kind === "account" ? "Delete TraderLink account" : "Clear demo data and start fresh →";
    await until(() => expect(button(opener).disabled).toBe(false)); await click(button(opener));
    await typeConfirmation(kind === "account" ? "DELETE MY TRADERLINK ACCOUNT" : "DELETE ACCOUNT");
    await act(async () => mounted.root.render(ui(otherViewer)));
    await until(() => expect(button(kind === "account" ? "Delete account" : "Clear demo data").disabled).toBe(false));
    await click(button(kind === "account" ? "Delete account" : "Clear demo data")); expect(posts).toHaveLength(0);
  });
  it("never retargets a confirmed selected-account deletion to a newly displayed selection", async () => {
    const ui = (refValue: string) => h(AccountErasureControls, { viewerRef: viewer, journalAccountCount: 2,
      activeAccount: { displayName: "Selected", selectionRef: refValue } });
    const mounted = await mount(ui(selection));
    await until(() => expect(button("Delete Trade Tracker account").disabled).toBe(false));
    await click(button("Delete Trade Tracker account")); await typeConfirmation("DELETE ACCOUNT");
    await act(async () => mounted.root.render(ui("d".repeat(64))));
    const dialog = document.querySelector('[role=dialog]')!;
    await click(button("Delete Trade Tracker account", dialog)); expect(posts).toHaveLength(0);
  });

  it("recent rollback records cannot clear the original UNKNOWN without its exact original receipt", async () => {
    const original = await harness(); await click(button("Send", original.host));
    await until(() => expect(JSON.parse(localStorage.getItem(key)!).phase).toBe("outcome_unknown"));
    const saved = localStorage.getItem(key)!;
    await act(async () => original.root.unmount()); roots.splice(roots.indexOf(original.root), 1);
    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      if (init?.method === "POST") { posts.push(String(init.body)); throw new Error("Unexpected replacement"); }
      return Response.json({ protocol: ERASURE_STATUS_PROTOCOL, viewerRef: viewer, correlation: "recent_only", exact: null,
        currentPending: false, more: false, recent: [{ receiptRef: "00000000-0000-4000-8000-000000000001", action: "traderlink_account", phase: "not_deleted", acceptedAtUtc: "2026-11-20T00:00:00.000Z", updatedAtUtc: "2026-11-20T00:00:00.000Z", committedAtUtc: null, finishedAtUtc: "2026-11-20T00:00:00.000Z", expiresAtUtc: "2026-12-20T00:00:00.000Z", failure: "transaction_rolled_back" }] });
    });
    await mount(h(AccountErasureControls, { viewerRef: viewer, journalAccountCount: 0, activeAccount: null }));
    await click(button("Check saved status")); await until(() => expect(document.body.textContent).toContain("informational"));
    expect(button("Delete TraderLink account").disabled).toBe(true); expect(posts).toHaveLength(1); expect(localStorage.getItem(key)).toBe(saved);
  });
  it("self-owned pending cleanup blocks a fresh confirmation without creating a local request", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ protocol: ERASURE_STATUS_PROTOCOL, viewerRef: viewer, correlation: "recent_only",
      exact: null, recent: [], more: false, currentPending: true }));
    await mount(h(AccountErasureControls, { viewerRef: viewer, journalAccountCount: 0, activeAccount: null }));
    await click(button("Check saved status")); await until(() => expect(document.body.textContent).toContain("operation still needs reconciliation"));
    expect(button("Delete TraderLink account").disabled).toBe(true); expect(posts).toHaveLength(0); expect(localStorage.getItem(key)).toBeNull();
  });
  it("a deferred old-viewer GET cannot replace the new viewer's pending-state guard", async () => {
    let finishA!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { finishA = resolve; }));
    const ui = (refValue: string) => h(AccountErasureControls, { viewerRef: refValue, journalAccountCount: 0, activeAccount: null });
    const mounted = await mount(ui(viewer));
    await until(() => expect(button("Delete TraderLink account").disabled).toBe(false));
    await click(button("Check saved status"));
    await act(async () => mounted.root.render(ui(otherViewer)));
    vi.mocked(fetch).mockResolvedValue(Response.json({ protocol: ERASURE_STATUS_PROTOCOL, viewerRef: otherViewer,
      correlation: "recent_only", exact: null, recent: [], more: false, currentPending: true }));
    await click(button("Check saved status"));
    await until(() => expect(document.body.textContent).toContain("operation still needs reconciliation"));
    await act(async () => finishA(Response.json({ protocol: ERASURE_STATUS_PROTOCOL, viewerRef: viewer,
      correlation: "recent_only", exact: null, recent: [], more: false, currentPending: false })));
    expect(document.body.textContent).toContain("operation still needs reconciliation");
    expect(button("Delete TraderLink account").disabled).toBe(true); expect(posts).toHaveLength(0);
  });
  it.each(["account", "demo"])("requires a fresh typed confirmation after a proven refusal in %s", async kind => {
    reply = async bytes => result(bytes);
    const node = kind === "account" ? h(AccountErasureControls, { viewerRef: viewer, journalAccountCount: 0, activeAccount: null })
      : h(ErasureViewerProvider, { viewerRef: viewer }, h(ClearDemoDataAction, { expectedAccountSelectionRef: selection }));
    await mount(node);
    const opener = kind === "account" ? "Delete TraderLink account" : "Clear demo data and start fresh →";
    await until(() => expect(button(opener).disabled).toBe(false)); await click(button(opener));
    await typeConfirmation(kind === "account" ? "DELETE MY TRADERLINK ACCOUNT" : "DELETE ACCOUNT");
    await click(button(kind === "account" ? "Delete account" : "Clear demo data"));
    await until(() => expect(document.querySelector('[role=dialog]')).toBeNull());
    await click(button(opener)); expect(button(kind === "account" ? "Delete account" : "Clear demo data").disabled).toBe(true);
    expect(posts).toHaveLength(1);
  });

});
