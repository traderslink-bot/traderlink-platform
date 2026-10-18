import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/app/login/login-form";
import { ConnectedMethods } from "@/app/(member)/account/login/connected-methods";
import type { LoginMethodDetails } from "./contracts/platform-login-method-details";

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.history.replaceState(null, "", "/login/verify");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

describe("connected login methods", () => {
  const availability = { googleAvailable: true, discordAvailable: true, emailAvailable: true };
  const details = (providers: string[]): LoginMethodDetails => ({
    signedInWith: "google",
    providers: providers.map(provider => ({ provider, connected: true, accountName: null, email: null })),
    email: { address: null, verified: false, connected: false, pendingAddress: null },
  });
  it("keeps the sole login method connected", async () => {
    await act(async () => root.render(createElement(ConnectedMethods, {
      ...availability, details: details(["google"]),
    })));
    const disconnect = [...container.querySelectorAll("button")]
      .find(button => button.textContent === "Disconnect Google")!;
    expect(disconnect.disabled).toBe(true);
    expect(container.textContent).not.toContain("Sign in again to make changes");
  });
  it("explains Discord benefit loss before requesting a disconnect", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await act(async () => root.render(createElement(ConnectedMethods, {
      ...availability, details: details(["google", "discord"]),
    })));
    const disconnect = [...container.querySelectorAll("button")]
      .find(button => button.textContent === "Disconnect Discord")!;
    await act(async () => disconnect.click());
    expect(fetch).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Linked Discord benefits will stop");
    const cancel = [...container.querySelectorAll("button")]
      .find(button => button.textContent === "Cancel")!;
    await act(async () => cancel.click());
    expect(container.textContent).not.toContain("Linked Discord benefits will stop");
    expect(fetch).not.toHaveBeenCalled();
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("email link confirmation screen", () => {
  it("shows the submitted email in bold in the confirmation message", async () => {
    const email = "member@example.test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: "Confirmation sent", confirmationEmail: email }) }));
    await act(async () => root.render(createElement(LoginForm, { mode: "link-email" })));
    const inputs = container.querySelectorAll<HTMLInputElement>("input");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => { ["Trader", email, "Eight123", "Eight123"].forEach((value, index) => {
      setter.call(inputs[index], value); inputs[index].dispatchEvent(new Event("input", { bubbles: true }));
    }); });
    await act(async () => { container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    const notice = container.querySelector('[role="status"]')!;
    expect(notice.textContent).toBe(`We sent a confirmation link to ${email}. Please click the link in that email to verify your account.`);
    expect(notice.querySelector("strong")?.textContent).toBe(email);
  });
  it("explains an empty gateway response and preserves entered email and password", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => { throw new SyntaxError("Unexpected end of JSON input"); } }));
    await act(async () => root.render(createElement(LoginForm, { mode: "link-email" })));
    const inputs = container.querySelectorAll<HTMLInputElement>("input");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => {
      ["Trader", "synthetic@example.test", "Eight123", "Eight123"].forEach((value, index) => {
        setter.call(inputs[index], value);
        inputs[index].dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
    await act(async () => { container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    expect(container.querySelector('[role="alert"]')?.textContent).toBe("The sign-in service did not respond. Please try again shortly.");
    expect(container.textContent).not.toContain("JSON");
    expect(container.textContent).not.toContain("Spaces are welcome");
    expect(inputs[1].value).toBe("synthetic@example.test");
    expect(inputs[2].value).toBe("Eight123");
  });
  it("keeps every email signup label above the field, including before autofill", async () => {
    await act(async () => root.render(createElement(LoginForm, { mode: "link-email" })));
    const labels = [...container.querySelectorAll("label")];
    expect(labels).toHaveLength(4);
    for (const label of labels) expect(label.getAttribute("data-shrink")).toBe("true");
    expect(container.textContent).toContain("at least 8 characters");
  });
  it("requests Discord consent when refreshing authentication for account changes", async () => {
    await act(async () => root.render(createElement(LoginForm, {
      mode: "login", discordAvailable: true, reauthenticate: true, returnTo: "/account/login",
    })));
    const discord = [...container.querySelectorAll("a")]
      .find(link => link.textContent === "Continue with Discord")!;
    const url = new URL(discord.href);
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("returnTo")).toBe("/account/login");
  });
  it("automatically verifies once without a password, including Strict Mode", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: "Email verified." }) });
    vi.stubGlobal("fetch", fetch);
    window.history.replaceState(null, "", "/login/verify#token=synthetic-token");
    await act(async () => root.render(createElement(StrictMode, null, createElement(LoginForm, { mode: "verify" }))));
    expect(window.location.hash).toBe("");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ action: "verify", token: "synthetic-token" });
    expect(container.querySelector('input[type="password"]')).toBeNull();
    expect(container.textContent).toContain("Email verified.");
    expect(container.textContent).not.toContain("recent sign-in");
  });

  it("explains an incomplete link and disables its confirmation", async () => {
    await act(async () => root.render(createElement(LoginForm, { mode: "reset" })));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("missing its verification code");
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  });

  it("does not submit mismatched replacement passwords", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    window.history.replaceState(null, "", "/login/reset#token=synthetic-token");
    await act(async () => root.render(createElement(LoginForm, { mode: "reset" })));
    const form = container.querySelector("form")!;
    const inputs = form.querySelectorAll<HTMLInputElement>('input[type="password"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => {
      setter.call(inputs[0], "a long synthetic password");
      inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      setter.call(inputs[1], "a different long password");
      inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Passwords do not match");
  });
});
