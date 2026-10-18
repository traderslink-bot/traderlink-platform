import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
let root: Root | undefined;
function render(element: ReturnType<typeof createElement>) {
  const container = document.createElement("div"); document.body.append(container);
  root = createRoot(container); act(() => root!.render(element));
}
function query(role: string, options?: { name: string }) {
  return [...document.querySelectorAll(role === "link" ? "a" : role === "button" ? "button" : '[role="alert"]')]
    .find(element => !options || element.textContent === options.name) ?? null;
}
const screen = { queryByRole: query, getByRole: (role: string, options?: { name: string }) => {
  const element = query(role, options); if (!element) throw Error("Missing " + role); return element;
} };
function cleanup() { if (root) act(() => root!.unmount()); root = undefined; document.body.replaceChildren(); }
const fireEvent = { click: (element: Element) => act(() => (element as HTMLElement).click()) };
import { afterEach, describe, expect, it, vi } from "vitest";
const { queryParameters } = vi.hoisted(() => ({ queryParameters: { connected: "" } }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(queryParameters) }));
import { DiscordConnectionNotice } from "../../../../../app/discord-connection-notice";
import { TRADERSLINK_COMMUNITY_INVITE_URL } from "../../contracts/discord-community";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); queryParameters.connected = ""; });
describe("Discord onboarding notice", () => {
  it("confirms existing server membership in Login methods with an open-server link", () => {
    render(createElement(DiscordConnectionNotice, { required: true, connected: true, joined: true, showJoined: true }));
    expect(screen.getByRole("alert").textContent).toContain("already a member");
    expect(screen.getByRole("link", { name: "Open Discord server" }).getAttribute("href")).toBe(TRADERSLINK_COMMUNITY_INVITE_URL);
    expect(screen.queryByRole("link", { name: "Join Discord server" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Check membership" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("confirms a Workspace connection but does not repeat the notice on ordinary visits", () => {
    render(createElement(DiscordConnectionNotice, { required: false, connected: true, joined: true }));
    expect(screen.queryByRole("alert")).toBeNull();
    cleanup();
    queryParameters.connected = "discord";
    render(createElement(DiscordConnectionNotice, { required: false, connected: true, joined: true }));
    expect(screen.getByRole("link", { name: "Open Discord server" })).toBeTruthy();
  });
  it("invites members without Discord benefits without assuming a plan", () => {
    render(createElement(DiscordConnectionNotice, { required: false, connected: false }));
    expect(screen.getByRole("alert").textContent).not.toContain("your plan");
    expect(screen.getByRole("link", { name: "Connect Discord" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Join Discord server" }).getAttribute("href")).toBe(TRADERSLINK_COMMUNITY_INVITE_URL);
    fireEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("keeps both setup steps visible for an unconnected required member", () => {
    render(createElement(DiscordConnectionNotice, { required: true, connected: false }));
    expect(screen.getByRole("link", { name: "Connect Discord" }).getAttribute("href")).toBe("/account/login");
    expect(screen.getByRole("link", { name: "Join Discord server" })).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("does not join the server");
    expect(screen.queryByRole("button", { name: "Later" })).toBeNull();
  });
  it("offers join and recheck after connection instead of repeating connection", () => {
    render(createElement(DiscordConnectionNotice, { required: true, connected: true }));
    expect(screen.queryByRole("link", { name: "Connect Discord" })).toBeNull();
    expect(screen.getByRole("button", { name: "Check membership" })).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("You can keep using the app");
  });
  it("starts an account-bound consent check and offers reauthentication on failure", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Sign in again before changing your login methods." }) });
    vi.stubGlobal("fetch", fetcher);
    render(createElement(DiscordConnectionNotice, { required: true, connected: true }));
    await act(async () => { (screen.getByRole("button", { name: "Check membership" }) as HTMLElement).click(); });
    expect(fetcher).toHaveBeenCalledWith("/api/auth/connections", expect.objectContaining({
      method: "POST", body: JSON.stringify({ action: "connect", provider: "discord", returnTo: "/workspace" }),
    }));
    expect(screen.getByRole("link", { name: "Sign in again" }).getAttribute("href")).toContain("returnTo=%2Fworkspace");
    expect((screen.getByRole("button", { name: "Check membership" }) as HTMLButtonElement).disabled).toBe(false);
  });

});
