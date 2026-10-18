// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  views: { month: false, week: false },
  prefetch: vi.fn(),
  denied: new Error("membership_required"),
}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({ requireTraderLinkPlatformRequestScope: () => ({ userId: "member" }) }));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({ withReadonlyPlatformDatabase: (_options: unknown, read: (db: object) => unknown) => read({}) }));
vi.mock("./platform-membership-calendar-access", () => ({ readMembershipCalendarViews: () => fixture.views }));
vi.mock("./platform-membership-access", () => ({
  assertMembershipFeature: (_db: unknown, _user: string, key: string) => {
    if (key === "journal.calendar" ? !fixture.views.month && !fixture.views.week : !fixture.views[key === "journal.calendar_week" ? "week" : "month"]) throw fixture.denied;
  },
  membershipFeatureDeniedResponse: (error: unknown) => error === fixture.denied ? Response.json({ code: "membership_required" }, { status: 403 }) : null,
}));
vi.mock("@/app/(dashboard)/calendar/calendar-data", () => ({ withCalendarDataRuntime: fixture.prefetch }));
vi.mock("@/app/(dashboard)/calendar/calendar-navigation", () => ({ calendarNavigationOptions: vi.fn(), readCalendarActivityDates: vi.fn() }));
vi.mock("@/src/modules/journal/server/demo/journal-demo-scope-clock", () => ({ journalScopeCurrentWeek: vi.fn(), readJournalDemoScopeClock: vi.fn() }));
import { GET } from "@/app/api/platform/journal/calendar/workspace-panel/route";

beforeEach(() => {
  fixture.views = { month: false, week: false };
  fixture.prefetch.mockReset().mockResolvedValue({ marker: "permitted" });
});
it.each(["month", "week"])("denies excluded %s before Calendar facts are prefetched", async view => {
  const response = await GET(new Request(`http://localhost/api/platform/journal/calendar/workspace-panel?view=${view}`));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ code: "membership_required" });
  expect(fixture.prefetch).not.toHaveBeenCalled();
});
it.each(["month", "week"] as const)("allows the default %s view but denies the other before prefetch", async view => {
  fixture.views[view] = true;
  expect((await GET(new Request("http://localhost/api/platform/journal/calendar/workspace-panel"))).status).toBe(200);
  expect(fixture.prefetch).toHaveBeenCalledTimes(1);
  fixture.prefetch.mockClear();
  const denied = view === "month" ? "week" : "month";
  expect((await GET(new Request(`http://localhost/api/platform/journal/calendar/workspace-panel?view=${denied}`))).status).toBe(403);
  expect(fixture.prefetch).not.toHaveBeenCalled();
});
