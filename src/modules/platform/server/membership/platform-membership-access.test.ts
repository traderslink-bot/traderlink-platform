// @vitest-environment node
import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  available: true,
  access: { booleanFeatures: [] as string[], limits: {} as Record<string, number | null> },
  read: vi.fn(),
}));
vi.mock("./platform-membership-catalog-repository", () => ({
  isPlatformMembershipCatalogAvailable: () => fixture.available,
}));
vi.mock("./platform-membership-repository", () => ({
  PlatformMembershipRepository: class {
    readEffectiveAccess = fixture.read;
  },
}));
import { assertMembershipNotification, canReceiveMembershipNotification } from "./membership-notification-access";
import { readMembershipCalendarViews } from "./platform-membership-calendar-access";
import { preferredMembershipCalendarView } from "../../contracts/membership-calendar-access";
import { evaluateMembershipFeature, hasPlatformMembershipFeature } from "./platform-membership-access";

beforeEach(() => {
  fixture.available = true;
  fixture.access = { booleanFeatures: [], limits: {} };
  fixture.read.mockReset().mockImplementation(() => fixture.access);
});

describe("member dashboard admission", () => {
  const database = {} as Database.Database;
  const at = "2026-10-15T12:00:00.000Z";
  it("admits an active Journal member without granting unrelated tools", () => {
    fixture.access.booleanFeatures = ["journal.access"];
    expect(hasPlatformMembershipFeature(database, "member", "dashboard.access", at)).toBe(true);
    expect(hasPlatformMembershipFeature(database, "member", "trade_analyzer.analysis", at)).toBe(false);
    expect(fixture.read).toHaveBeenCalledWith("member", at);
  });
  it("requires an actual product or positive allowance", () => {
    fixture.access.booleanFeatures = ["news.notifications"];
    fixture.access.limits = { "trade_analyzer.analyses": 0 };
    expect(hasPlatformMembershipFeature(database, "member", "dashboard.access", at)).toBe(false);
    fixture.access.limits["trade_analyzer.analyses"] = null;
    expect(hasPlatformMembershipFeature(database, "member", "dashboard.access", at)).toBe(true);
    fixture.access.limits["trade_analyzer.analyses"] = 3;
    expect(hasPlatformMembershipFeature(database, "member", "dashboard.access", at)).toBe(true);
  });
  it("does not invent access when the membership catalog is unavailable", () => {
    fixture.available = false;
    expect(hasPlatformMembershipFeature(database, "member", "dashboard.access", at)).toBe(false);
    expect(fixture.read).not.toHaveBeenCalled();
  });
});


describe("Analysis rollout and effective access", () => {
  const database = (mode?: string, owner = false) => ({ prepare: (sql: string) => ({ get: () =>
    sql.includes("sqlite_schema") ? {} : sql.includes("enforcement_mode") ? (mode ? { enforcement_mode: mode } : undefined) : sql.includes("platform_operator_grants") ? (owner ? {} : undefined) : undefined,
  }) }) as unknown as Database.Database;
  it("enforces the Analysis default and denies Analytics-only membership", () => {
    fixture.access.booleanFeatures = ["analytics.access"];
    expect(evaluateMembershipFeature(database(), "member", "trade_analyzer.analysis").allowed).toBe(false);
  });
  it("accepts effective Analysis access from a plan or composed add-on", () => {
    fixture.access.booleanFeatures = ["trade_analyzer.analysis"];
    expect(evaluateMembershipFeature(database(), "member", "trade_analyzer.analysis").allowed).toBe(true);
  });
  it("denies expired access and preserves the operator bypass", () => {
    expect(evaluateMembershipFeature(database(), "member", "trade_analyzer.analysis").allowed).toBe(false);
    expect(evaluateMembershipFeature(database(undefined, true), "owner", "trade_analyzer.analysis").ownerBypass).toBe(true);
  });
  it("respects explicit off and shadow rollout policies", () => {
    for (const mode of ["off", "shadow"]) expect(evaluateMembershipFeature(database(mode), "member", "trade_analyzer.analysis").allowed).toBe(true);
  });
});


describe("broker-statement import rollout", () => {
  const database = (mode?: string, owner = false) => ({ prepare: (sql: string) => ({ get: () =>
    sql.includes("sqlite_schema") ? {} : sql.includes("enforcement_mode") ? (mode ? { enforcement_mode: mode } : undefined) : sql.includes("platform_operator_grants") ? (owner ? {} : undefined) : undefined,
  }) }) as unknown as Database.Database;
  it("requires import permission independently of Journal and denies missing/expired access", () => {
    fixture.access.booleanFeatures = ["journal.access"];
    expect(evaluateMembershipFeature(database(), "member", "journal.imports").allowed).toBe(false);
    fixture.access.booleanFeatures.push("journal.imports");
    expect(evaluateMembershipFeature(database(), "member", "journal.imports").allowed).toBe(true);
    fixture.access.booleanFeatures = [];
    expect(evaluateMembershipFeature(database(), "member", "journal.imports").allowed).toBe(false);
  });
  it("preserves explicit rollout modes and the operator exemption", () => {
    for (const mode of ["off", "shadow"]) expect(evaluateMembershipFeature(database(mode), "member", "journal.imports").allowed).toBe(true);
    expect(evaluateMembershipFeature(database(undefined, true), "owner", "journal.imports").ownerBypass).toBe(true);
  });
});


describe("Calendar view permissions", () => {
  const database = (mode?: string, owner = false) => ({ prepare: (sql: string) => ({ get: () =>
    sql.includes("sqlite_schema") ? {} : sql.includes("enforcement_mode") ? (mode ? { enforcement_mode: mode } : undefined) : sql.includes("platform_operator_grants") ? (owner ? {} : undefined) : undefined,
  }) }) as unknown as Database.Database;
  it.each([
    [[], { month: false, week: false }],
    [["journal.calendar_month", "journal.calendar_week"], { month: false, week: false }],
    [["journal.calendar"], { month: false, week: false }],
    [["journal.calendar", "journal.calendar_month"], { month: true, week: false }],
    [["journal.calendar", "journal.calendar_week"], { month: false, week: true }],
    [["journal.calendar", "journal.calendar_month", "journal.calendar_week"], { month: true, week: true }],
  ])("requires the Calendar product and the selected view: %j", (features, views) => {
    fixture.access.booleanFeatures = features as string[];
    expect(readMembershipCalendarViews(database(), "member")).toEqual(views);
  });
  it("defaults to the permitted view but respects explicit restricted view requests", () => {
    const weekOnly = { month: false, week: true };
    expect(preferredMembershipCalendarView(weekOnly, undefined)).toBe("week");
    expect(preferredMembershipCalendarView(weekOnly, "month")).toBe("month");
    expect(preferredMembershipCalendarView({ month: true, week: false }, undefined)).toBe("month");
    expect(preferredMembershipCalendarView({ month: false, week: false }, undefined)).toBe("month");
  });
  it("retains explicit policy overrides and operator exemption", () => {
    expect(readMembershipCalendarViews(database("off"), "member")).toEqual({ month: true, week: true });
    expect(readMembershipCalendarViews(database("shadow"), "member")).toEqual({ month: true, week: true });
    expect(readMembershipCalendarViews(database(undefined, true), "owner")).toEqual({ month: true, week: true });
  });
});

describe("report/export rollout", () => {
  const database = (mode?: string, owner = false) => ({ prepare: (sql: string) => ({ get: () =>
    sql.includes("sqlite_schema") ? {} : sql.includes("enforcement_mode") ? (mode ? { enforcement_mode: mode } : undefined) : sql.includes("platform_operator_grants") ? (owner ? {} : undefined) : undefined,
  }) }) as unknown as Database.Database;
  it("requires export permission independently of Trade Explorer and denies missing/expired access", () => {
    fixture.access.booleanFeatures = ["analytics.trade_explorer"];
    expect(evaluateMembershipFeature(database(), "member", "analytics.exports").allowed).toBe(false);
    fixture.access.booleanFeatures.push("analytics.exports");
    expect(evaluateMembershipFeature(database(), "member", "analytics.exports").allowed).toBe(true);
    fixture.access.booleanFeatures = [];
    expect(evaluateMembershipFeature(database(), "member", "analytics.exports").allowed).toBe(false);
  });
  it("preserves explicit rollout modes and the operator exemption", () => {
    for (const mode of ["off", "shadow"]) expect(evaluateMembershipFeature(database(mode), "member", "analytics.exports").allowed).toBe(true);
    expect(evaluateMembershipFeature(database(undefined, true), "owner", "analytics.exports").ownerBypass).toBe(true);
  });
});

describe("Session Tracker rollout", () => {
  const database = (mode?: string, owner = false) => ({ prepare: (sql: string) => ({ get: () =>
    sql.includes("sqlite_schema") ? {} : sql.includes("enforcement_mode") ? (mode ? { enforcement_mode: mode } : undefined) : sql.includes("platform_operator_grants") ? (owner ? {} : undefined) : undefined,
  }) }) as unknown as Database.Database;
  it("requires Session Tracker independently of Journal and denies missing/expired access", () => {
    fixture.access.booleanFeatures = ["journal.access"];
    expect(evaluateMembershipFeature(database(), "member", "journal.session_tracker").allowed).toBe(false);
    fixture.access.booleanFeatures.push("journal.session_tracker");
    expect(evaluateMembershipFeature(database(), "member", "journal.session_tracker").allowed).toBe(true);
    fixture.access.booleanFeatures = [];
    expect(evaluateMembershipFeature(database(), "member", "journal.session_tracker").allowed).toBe(false);
  });
  it("preserves explicit rollout modes and the operator exemption", () => {
    for (const mode of ["off", "shadow"]) expect(evaluateMembershipFeature(database(mode), "member", "journal.session_tracker").allowed).toBe(true);
    expect(evaluateMembershipFeature(database(undefined, true), "owner", "journal.session_tracker").ownerBypass).toBe(true);
  });
});

describe("Stock Press Releases notification settings", () => {
  const database = { prepare: (sql: string) => ({ get: () => sql.includes("sqlite_schema") ? {} : undefined }) } as unknown as Database.Database;
  it("permits news without notifications, and requires news even with a notification grant", () => {
    fixture.access.booleanFeatures = ["news.access"];
    expect(evaluateMembershipFeature(database, "member", "news.access").allowed).toBe(true);
    expect(canReceiveMembershipNotification(database, "member", "press_release")).toBe(false);
    fixture.access.booleanFeatures.push("notifications.press_release");
    expect(canReceiveMembershipNotification(database, "member", "press_release")).toBe(true);
    fixture.access.booleanFeatures = ["notifications.press_release"];
    expect(canReceiveMembershipNotification(database, "member", "press_release")).toBe(false);
    fixture.access.booleanFeatures = [];
    expect(canReceiveMembershipNotification(database, "member", "market_news")).toBe(false);
    fixture.access.booleanFeatures = ["news.week_ahead"];
    expect(canReceiveMembershipNotification(database, "member", "market_news")).toBe(true);
  });
});

describe("Analytics and Explorer parent access", () => {
  const database = { prepare: (sql: string) => ({ get: () => sql.includes("sqlite_schema") ? {} : undefined }) } as unknown as Database.Database;
  it.each(["analytics.access", "analytics.trade_explorer", "watchlist.access"])("requires %s independently of Journal", feature => {
    fixture.access.booleanFeatures = ["journal.access"];
    expect(evaluateMembershipFeature(database,"member",feature).allowed).toBe(false);
    fixture.access.booleanFeatures.push(feature);
    expect(evaluateMembershipFeature(database,"member",feature).allowed).toBe(true);
  });
});


describe("Market halt notification access", () => {
  const database = (mode?: string, owner = false) => ({ prepare: (sql: string) => ({ get: () =>
    sql.includes("sqlite_schema") ? {} : sql.includes("enforcement_mode") ? (mode ? { enforcement_mode: mode } : undefined) : sql.includes("platform_operator_grants") ? (owner ? {} : undefined) : undefined,
  }) }) as unknown as Database.Database;
  it("requires the halt feature independently of news and other notifications", () => {
    fixture.access.booleanFeatures = ["news.access", "notifications.press_release"];
    expect(canReceiveMembershipNotification(database(), "member", "market_halt")).toBe(false);
    expect(() => assertMembershipNotification(database(), "member", "market_halt")).toThrow();
    fixture.access.booleanFeatures = ["notifications.market_halt"];
    expect(canReceiveMembershipNotification(database(), "member", "market_halt")).toBe(true);
    expect(() => assertMembershipNotification(database(), "member", "market_halt")).not.toThrow();
    fixture.access.booleanFeatures = [];
    expect(canReceiveMembershipNotification(database(), "member", "market_halt")).toBe(false);
  });
  it("preserves explicit off/shadow policies and operator access", () => {
    for (const mode of ["off", "shadow"]) expect(canReceiveMembershipNotification(database(mode), "member", "market_halt")).toBe(true);
    expect(canReceiveMembershipNotification(database(undefined, true), "owner", "market_halt")).toBe(true);
  });
});
