// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({ database: null as Database.Database | null }));
vi.mock("../database/open-platform-database", async importOriginal => ({
  ...await importOriginal<typeof import("../database/open-platform-database")>(),
  withPlatformDatabase: (_options: unknown, operation: (db: Database.Database) => unknown) => operation(fixture.database!),
}));
vi.mock("./platform-login-mail-queue", async importOriginal => ({
  ...await importOriginal<typeof import("./platform-login-mail-queue")>(),
  startPlatformLoginMailWorker: vi.fn(),
}));
import { openPlatformDatabase } from "../database/open-platform-database";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { claimLoginMail, finishLoginMail } from "./platform-login-mail-queue";
import { PlatformLoginService } from "./platform-login-service";
import { PlatformSessionRepository } from "./platform-session-repository";
import { PlatformSessionService, TRADERLINK_PLATFORM_SESSION_COOKIE } from "./platform-session-service";
import { POST } from "@/app/api/auth/email/route";
import { POST as connections } from "@/app/api/auth/connections/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { POST as logoutAll } from "@/app/api/auth/logout-all/route";

const origin = "https://login.example.test";
const secret = "synthetic-route-test-secret-with-at-least-32-characters";
const roots: string[] = [];
afterEach(() => {
  fixture.database?.close();
  fixture.database = null;
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function request(body: Record<string, unknown>, cookie = "", source = origin) {
  return new NextRequest(`${origin}/api/auth/email`, {
    method: "POST", headers: { origin: source, cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("email HTTP route integration", () => {
  it("verifies, signs in, resets and revokes using actual handlers, hashes, cookies and encrypted mail", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", origin);
    vi.stubEnv("TRADERLINK_LOGIN_RATE_LIMIT_SECRET", secret);
    vi.stubEnv("RESEND_API_KEY", "synthetic-never-sent");
    vi.stubEnv("TRADERLINK_LOGIN_EMAIL_FROM", "login@example.test");
    const fetch = vi.fn(() => { throw new Error("External network is forbidden in this test"); });
    vi.stubGlobal("fetch", fetch);
    const root = mkdtempSync(join(tmpdir(), "login-route-qa-"));
    roots.push(root);
    const db = openPlatformDatabase({ mode: "initializer", databasePath: join(root, "qa.sqlite"), forbiddenRepositoryRoots: [] });
    fixture.database = db;
    runPlatformMigrations(db);
    const email = "member@example.test", password = "Eight123";
    const foreign = await POST(request({ action: "signup", email, password }, "", "https://foreign.example.test"));
    expect(foreign.status).toBe(400);
    expect(db.prepare("SELECT COUNT(*) n FROM platform_login_credentials").get()).toEqual({ n: 0 });

    const signup = await POST(request({ action: "signup", email, password, name: "Trader" }));
    expect(signup.status).toBe(200);
    expect(await signup.json()).toEqual({
      message: `We sent a verification link to ${email}. Open that email to verify your email address.`, confirmationEmail: email,
    });
    expect(signup.headers.get("set-cookie")).toBeNull();
    const mail = claimLoginMail(db, secret)!;
    expect(mail.mail.purpose).toBe("verify");
    finishLoginMail(db, mail.id, true);
    const pendingLogin = await POST(request({ action: "login", email, password }));
    expect(pendingLogin.status).toBe(400);
    expect((await pendingLogin.json()).error).toContain("Please verify your email before signing in");
    const verified = await POST(request({ action: "verify", token: mail.mail.token }));
    expect(verified.status).toBe(200);
    expect(verified.headers.get("set-cookie")).toBeNull();
    expect((await POST(request({ action: "verify", token: mail.mail.token }))).status).toBe(400);

    const login = await POST(request({ action: "login", email, password, returnTo: "https://foreign.example.test" }));
    expect(login.status).toBe(200);
    expect(await login.json()).toEqual({ redirect: "/workspace" });
    const setCookie = login.headers.get("set-cookie")!;
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Lax");
    const cookie = setCookie.split(";")[0];
    expect(cookie.startsWith(`${TRADERLINK_PLATFORM_SESSION_COOKIE}=`)).toBe(true);
    const token = decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1));
    const sessions = new PlatformSessionService(new PlatformSessionRepository(db));
    const member = sessions.resolve(token)!;
    expect(member.authProvider).toBe("email");
    const unlink = await connections(request({ action: "unlink", provider: "email" }, cookie));
    expect(unlink.status).toBe(400);
    expect(sessions.resolve(token)?.userId).toBe(member.userId);

    const forgot = await POST(request({ action: "forgot", email }));
    expect(forgot.status).toBe(200);
    const resetMail = claimLoginMail(db, secret)!;
    expect(resetMail.mail.purpose).toBe("reset");
    finishLoginMail(db, resetMail.id, true);
    const reset = await POST(request({ action: "reset", token: resetMail.mail.token, password: "Reset123" }));
    expect(reset.status).toBe(200);
    expect(reset.headers.get("set-cookie")).toBeNull();
    expect(sessions.resolve(token)).toBeNull();
    expect((await POST(request({ action: "reset", token: resetMail.mail.token, password }))).status).toBe(400);
    expect((await POST(request({ action: "login", email, password }))).status).toBe(400);
    const renewed = await POST(request({ action: "login", email, password: "Reset123" }));
    expect(renewed.status).toBe(200);
    const renewedCookie = renewed.headers.get("set-cookie")!.split(";")[0];
    const renewedToken = decodeURIComponent(renewedCookie.slice(renewedCookie.indexOf("=") + 1));
    const second = await POST(request({ action: "login", email, password: "Reset123" }));
    const secondCookie = second.headers.get("set-cookie")!.split(";")[0];
    const secondToken = decodeURIComponent(secondCookie.slice(secondCookie.indexOf("=") + 1));
    expect((await logout(request({}, renewedCookie, "https://foreign.example.test"))).status).toBe(403);
    expect(sessions.resolve(renewedToken)?.userId).toBe(member.userId);
    const signedOut = await logout(request({}, renewedCookie));
    expect(signedOut.status).toBe(303);
    expect(signedOut.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(sessions.resolve(renewedToken)).toBeNull();
    expect(sessions.resolve(secondToken)?.userId).toBe(member.userId);
    expect((await logoutAll(request({}, secondCookie))).status).toBe(303);
    expect(sessions.resolve(secondToken)).toBeNull();
    expect(db.prepare("SELECT COUNT(*) n FROM platform_users").get()).toEqual({ n: 1 });
    expect(fetch).not.toHaveBeenCalled();
  }, 60000);
  it("adds and verifies email on an existing Google account without replacing ownership", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", origin);
    vi.stubEnv("TRADERLINK_LOGIN_RATE_LIMIT_SECRET", secret);
    vi.stubEnv("RESEND_API_KEY", "synthetic-never-sent");
    vi.stubEnv("TRADERLINK_LOGIN_EMAIL_FROM", "login@example.test");
    const fetch = vi.fn(() => { throw Error("External network forbidden"); }); vi.stubGlobal("fetch", fetch);
    const root = mkdtempSync(join(tmpdir(), "login-email-link-qa-")); roots.push(root);
    const db = openPlatformDatabase({ mode: "initializer", databasePath: join(root, "qa.sqlite"), forbiddenRepositoryRoots: [] }); fixture.database = db;
    runPlatformMigrations(db);
    const signed = new PlatformLoginService(db).signInOAuth({ provider: "google", subject: "synthetic-google-subject", displayName: "Trader" });
    db.prepare("UPDATE platform_auth_sessions SET created_at_utc=? WHERE session_id=?").run(new Date(Date.now() - 3600000).toISOString(), signed.session.sessionId);
    const cookie = `${TRADERLINK_PLATFORM_SESSION_COOKIE}=${signed.token}`;
    const email = "google-member@example.test", password = "Eight123";
    const linked = await POST(request({ action: "link-email", email, password, name: "Trader" }, cookie));
    expect(linked.status).toBe(200);
    expect(await linked.json()).toEqual({
      message: `We sent a verification link to ${email}. Open that email to verify your email address.`, confirmationEmail: email,
    });
    const mail = claimLoginMail(db, secret)!; expect(mail.mail.purpose).toBe("verify"); expect(mail.mail.verificationContext).toBe("add-email"); finishLoginMail(db, mail.id, true);
    expect((await POST(request({ action: "login", email, password }))).status).toBe(400);
    // Repeating Add email sends a new, account-bound confirmation.
    const retry = await POST(request({ action: "link-email", email, password, name: "Trader" }, cookie));
    expect(retry.status).toBe(200);
    const renewed = claimLoginMail(db, secret)!;
    expect(renewed.mail.purpose).toBe("verify");
    expect(renewed.mail.token).not.toBe(mail.mail.token);
    finishLoginMail(db, renewed.id, true);
    expect((await POST(request({ action: "verify", token: mail.mail.token }, cookie))).status).toBe(400);
    const verified = await POST(request({ action: "verify", token: renewed.mail.token }));
    expect(verified.status).toBe(200);
    expect(verified.headers.get("set-cookie")).toBeNull();
    const login = await POST(request({ action: "login", email, password })); expect(login.status).toBe(200);
    const token = login.headers.get("set-cookie")!.match(/tl_platform_session=([^; ,]+)/)![1];
    expect(new PlatformSessionService(new PlatformSessionRepository(db)).resolve(token)?.userId).toBe(signed.session.userId);
    expect(new PlatformLoginService(db).connected(token).map(item => item.provider).sort()).toEqual(["email", "google"]);
    expect(db.prepare("SELECT count(*) n FROM platform_users").get()).toEqual({ n: 1 });
    expect(fetch).not.toHaveBeenCalled();
  }, 60000);

});
