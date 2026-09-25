import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { newsReverseSplitAlertsMigration } from "../database/migrations/0142_news_reverse_split_alerts";
import { ReverseSplitDigestPlanner } from "./digest";
import { ReverseSplitNotificationStore } from "./notification-store";
import type { ReverseSplitRepository } from "./repository";
import type { ReverseSplitEvent, SplitMarketData } from "./contracts";
import type { SplitCalendar } from "./messages";

const at = new Date("2026-09-25T23:00:00.000Z");
const calendar: SplitCalendar = { marketDateAt: () => "2026-09-25",
  easternWallClockAtUtc: (date, time) => `${date}T${String(Number(time.slice(0, 2)) + 4).padStart(2, "0")}:${time.slice(3)}:00.000Z`,
  nextOpenSessionDate: () => "2026-09-28", session: () => ({ state: "open" }) };
const event: ReverseSplitEvent = { ticker: "TEST", company: "Synthetic", status: "confirmed", ratio: 50, authorizedRatio: null,
  effectiveDate: "2026-09-28", approvalDate: null, evidence: "Synthetic fixture",
  source: { kind: "nasdaq", url: "https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2026-100", title: "Synthetic", publishedDate: "2026-09-25", ticker: "TEST", company: "Synthetic" } };
let events: ReverseSplitEvent[];
let snapshot: SplitMarketData;
let fresh: boolean;
let database: Database.Database;
let store: ReverseSplitNotificationStore;
let planner: ReverseSplitDigestPlanner;
beforeEach(() => {
  events = [event];
  fresh = true;
  snapshot = { float: 500_000, floatRetrievedAt: at.toISOString(), close: 2.5, closeDate: "2026-09-25",
    expectedCloseDate: "2026-09-25", eligibleSecurity: true, issues: [] };
  database = new Database(":memory:");
  database.exec(newsReverseSplitAlertsMigration.statements.join("\n"));
  store = new ReverseSplitNotificationStore(database, { NODE_ENV: "test" });
  const repository = { readRuntimeState: (key: string) => key === "sec_backfill" ? { complete: true } : { lastSuccess: fresh ? at.toISOString() : "2026-09-24T00:00:00.000Z" },
    readObservations: () => events.map(event => ({ event, fetchedAt: at.toISOString() })),
    marketSnapshots: () => new Map([["TEST", snapshot]]), sourceCoverage: () => ({}) } as unknown as ReverseSplitRepository;
  planner = new ReverseSplitDigestPlanner(repository, store, calendar, "https://app.traderslink.pro/reverse-splits");
});
afterEach(() => database.close());

describe("canonical reverse-split digest preparation", () => {
  it("previews without writes and never schedules before 7 PM Eastern", () => {
    const earlier = new Date("2026-09-25T22:30:00.000Z");
    expect(planner.plan(earlier).reason).toBe("before_schedule");
    expect(planner.preview(at).parts?.join("\n")).toContain("1-for-50");
    expect(store.latest("2026-09-25")).toBeNull();
  });
  it("creates one shared digest independently of Discord and ignores quote-only refreshes", () => {
    expect(planner.plan(at).queued).toBe(true);
    const first = store.latest("2026-09-25")!;
    snapshot = { ...snapshot, float: 600_000, close: 2.6 };
    expect(planner.plan(at).reason).toBe("unchanged");
    expect(store.latest("2026-09-25")?.id).toBe(first.id);
    expect(database.prepare("SELECT count(*) n FROM news_reverse_split_discord_deliveries").get()).toEqual({ n: 0 });
  });
  it("emits material corrections even when a changed trading date leaves the original window", () => {
    planner.plan(at);
    events = [{ ...event, effectiveDate: "2026-10-01" }];
    expect(planner.plan(at).queued).toBe(true);
    const correction = store.latest("2026-09-25")!;
    expect(correction.revision).toBe(1);
    expect(correction.parts.join("\n")).toContain("Updated split information");
    expect(correction.parts.join("\n")).toContain("2026-10-01");
  });
  it("withholds stale-source and unresolved previous-event updates without inventing cancellation", () => {
    planner.plan(at);
    fresh = false;
    expect(planner.plan(at).reason).toBe("source_discovery_stale");
    fresh = true;
    events = [];
    expect(planner.plan(at).reason).toBe("previous_event_unresolved");
    expect(store.latest("2026-09-25")?.revision).toBe(0);
  });
});
