// @vitest-environment node
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { hasWatchlistDashboardNavigationAccessInDatabase } from "./watchlist-dashboard-navigation-access";

const admitted = [
  { userId: "10000000-0000-4000-8000-000000000001", subject: "101" },
  { userId: "10000000-0000-4000-8000-000000000002", subject: "202" },
] as const;
const ordinary = { userId: "10000000-0000-4000-8000-000000000003", subject: "303" } as const;
const environment = {
  NODE_ENV: "production",
  TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT: admitted.map(({ subject }) => subject).join(","),
} as NodeJS.ProcessEnv;
const identity = (userId: string) => ({
  mode: "platform_session" as const,
  sessionId: `session-${userId}`,
  scope: {
    userId,
    workspaceId: "20000000-0000-4000-8000-000000000001",
    workspaceRole: "owner" as const,
    allowedAccountIds: [] as readonly string[],
    activeAccountId: null,
  },
  displayName: null,
  discord: null,
});

let database: Database.Database;

beforeEach(() => {
  database = new Database(":memory:");
  database.exec("CREATE TABLE platform_auth_identities(user_id TEXT, auth_provider TEXT, auth_subject TEXT, status TEXT)");
  const insert = database.prepare("INSERT INTO platform_auth_identities VALUES (?,'discord',?,'active')");
  for (const fixture of [...admitted, ordinary]) insert.run(fixture.userId, fixture.subject);
});

afterEach(() => database.close());

describe("Private Watchlist owner pilot", () => {
  it.each(admitted)("admits configured active account $userId", ({ userId }) => {
    expect(hasWatchlistDashboardNavigationAccessInDatabase(database, identity(userId), environment)).toBe(true);
  });

  it("denies an ordinary signed-in account and a revoked configured identity", () => {
    expect(hasWatchlistDashboardNavigationAccessInDatabase(database, identity(ordinary.userId), environment)).toBe(false);
    database.prepare("UPDATE platform_auth_identities SET status='revoked' WHERE user_id=?").run(admitted[0].userId);
    expect(hasWatchlistDashboardNavigationAccessInDatabase(database, identity(admitted[0].userId), environment)).toBe(false);
  });

  it("gates the page and both mutations after authentication but before watchlist reads or writes", () => {
    const page = readFileSync(resolve(process.cwd(), "app/(dashboard)/private-watchlist/page.tsx"), "utf8");
    const actions = readFileSync(resolve(process.cwd(), "app/(dashboard)/private-watchlist/actions.ts"), "utf8");
    const pageBody = page.slice(page.indexOf("export default async function PrivateWatchlistPage"));
    const actionBody = actions.slice(actions.indexOf("export async function generatePrivateWatchlist"));
    expect(pageBody).toContain("const identity = await readPrivateWatchlistPilotPageIdentity()");
    expect(pageBody).toContain("if (!identity) notFound()");
    expect(pageBody.indexOf("readPrivateWatchlistPilotPageIdentity()"))
      .toBeLessThan(pageBody.indexOf("withReadonlyPlatformDatabase"));
    expect(actionBody.match(/if \(!identity\) return PILOT_UNAVAILABLE;/gu)).toHaveLength(2);
    expect(actionBody.indexOf("readPrivateWatchlistPilotPageIdentity()"))
      .toBeLessThan(actionBody.indexOf("withPlatformDatabase({ mode: \"runtime\" }"));
  });

  it("hides Private Watchlist navigation outside the same gate", () => {
    const shell = readFileSync(resolve(process.cwd(), "app/dashboard-shell.tsx"), "utf8");
    expect(shell).toContain('(item.href !== "/private-watchlist" || watchlistAdminNavigationAccess)');
  });
});
