import Database from "better-sqlite3";
import { describe, expect, it, vi } from "vitest";
import type { TraderLinkPlatformRequestIdentity } from "../platform/server/authentication/require-platform-request-scope";
import { collectMarketPack, type BarCache } from "./collect-market";
import { DEFAULT_DEFINITION, parseDefinition, parseThreshold } from "./contracts";
import { marketWindows, sessionBounds, type ProviderBar } from "./market-metrics";
import { canReadPressReleaseRun, HOUR_MS, latestPressReleases, memberRecentArticles, memberScannerPressReleaseRecords } from "./press-releases";
import { matchesRule } from "./query";
import { relativeVolumeAtTime, relativeVolumeHistory, relativeVolumeSchedule } from "./relative-volume";

const newsAccess = vi.hoisted(() => ({ eligible: true, allowed: true, delay: 0, database: undefined as Database.Database | undefined }));
vi.mock("../news/server/press-release-dashboard-access", () => ({ hasPressReleaseDashboardAccess: () => newsAccess.eligible }));
vi.mock("../platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: (_: unknown, read: (database: unknown) => unknown) => read(newsAccess.database ?? {}),
}));
vi.mock("../platform/server/membership/platform-membership-access", () => ({
  assertMembershipFeature() { if (!newsAccess.allowed) throw Error("denied"); },
}));
vi.mock("../platform/server/membership/membership-news-delay", () => ({ readMembershipNewsDelaySeconds: () => newsAccess.delay }));

const DAY = 86_400_000;
const recent = Date.parse("2026-11-13T15:07:00Z");
const calendar = Array.from({ length: 480 }, (_, i) => new Date(recent - (479 - i) * DAY))
  .filter(day => day.getUTCDay() >= 1 && day.getUTCDay() <= 5)
  .map(day => ({ date: day.toISOString().slice(0, 10), open: "09:30", close: "16:00" }));

function bar(time: number, volume: number): ProviderBar {
  return { time: time / 1000, open: 10, high: 10, low: 10, close: 10, volume };
}

describe("same-time relative volume", () => {
  it("compares the same elapsed buckets across the DST change and ignores volume beyond the cutoff", () => {
    const { windows } = marketWindows(calendar, recent);
    const schedule = relativeVolumeSchedule(calendar, windows);
    const plan = schedule.plans.get("regular")!;
    const previous = calendar.slice(-11, -1).flatMap(day => {
      const open = sessionBounds(day, "regular").from;
      return [bar(open, 100), bar(open + HOUR_MS, 9_000)];
    });
    const history = relativeVolumeHistory(new Map([["AAA", new Map(previous.map(point => [point.time, point]))]]), new Set(), schedule.slots);
    const current = [bar(windows.regular.from, 250), bar(windows.regular.from + HOUR_MS / 2, 3000)];
    expect(new Date(plan.cutoff).toISOString()).toBe("2026-11-13T15:00:00.000Z");
    expect(relativeVolumeAtTime(windows.regular, plan, current, history.get("AAA")!)).toBe(2.5);

    const sparse = previous.slice(0, 14);
    const incomplete = relativeVolumeHistory(new Map([["AAA", new Map(sparse.map(point => [point.time, point]))]]), new Set(), schedule.slots);
    expect(relativeVolumeAtTime(windows.regular, plan, current, incomplete.get("AAA")!)).toBeUndefined();
    const knownZero = previous.filter((_, index) => index !== 0);
    const zeroHistory = relativeVolumeHistory(new Map([["AAA", new Map(knownZero.map(point => [point.time, point]))]]), new Set(), schedule.slots);
    expect(relativeVolumeAtTime(windows.regular, plan, current, zeroHistory.get("AAA")!)).toBeCloseTo(250 / 90);
  });

  it("does not compare after-hours starting at a holiday early close with ordinary 4 p.m. starts", () => {
    const day = { ...calendar.at(-1)!, close: "13:00" };
    const days = [...calendar.slice(0, -1), day];
    const { windows } = marketWindows(days, Date.parse("2026-11-13T19:07:00Z"));
    const plans = relativeVolumeSchedule(days, windows).plans;
    expect(plans.has("after_hours")).toBe(false);
    expect(plans.has("regular")).toBe(true);
  });

  it("uses one cache range before premarket and after the close on the same trading date", () => {
    const scheduleAt = (iso: string) => relativeVolumeSchedule(calendar, marketWindows(calendar, Date.parse(iso)).windows, "2026-11-13");
    const before = scheduleAt("2026-11-13T08:00:00Z");
    const after = scheduleAt("2026-11-13T22:00:00Z");
    expect([before.from, before.until]).toEqual([after.from, after.until]);
  });

  it("paginates SIP baselines, keeps them out of user requests, and reuses them on a warm collection", async () => {
    const cache: BarCache = { key: "", daily: new Map(), intraday: new Map() };
    const { windows } = marketWindows(calendar, recent);
    const providerBar = (point: ProviderBar, price = 10) => ({ t: new Date(point.time * 1000).toISOString(),
      o: price, h: price, l: price, c: price, v: point.volume });
    const historical = calendar.slice(-11, -1).map(day => providerBar(bar(sessionBounds(day, "regular").from, 100)));
    let historyRequests = 0;
    const source = {
      async get(path: string, params: URLSearchParams) {
        if (path === "/v2/stocks/snapshots") return {};
        const timeframe = params.get("timeframe");
        expect(params.get("feed")).toBe("sip");
        expect(params.get("adjustment")).toBe("split");
        if (timeframe === "15Min") {
          historyRequests++;
          const next = params.has("page_token");
          return { bars: { AAA: next ? historical.slice(5) : historical.slice(0, 5) }, next_page_token: next ? null : "more" };
        }
        return { bars: { AAA: timeframe === "5Min"
          ? [providerBar(bar(windows.last_regular.from - HOUR_MS, 50), 9), providerBar(bar(windows.last_regular.from, 150)),
            providerBar(bar(windows.regular.from - HOUR_MS, 50), 11), providerBar(bar(windows.regular.from, 300))]
          : [providerBar(bar(windows.last_regular.from - 9.5 * HOUR_MS, 100))] } };
      },
    };
    const input = { data: source, calendar, stocks: [{ symbol: "AAA", name: "Example", exchange: "NASDAQ" as const }], universeDate: calendar.at(-1)!.date, now: recent, cache };
    const { snapshots } = await collectMarketPack(input);
    expect(snapshots.regular.rows[0].values).toMatchObject({ relativeVolume: 3, recentVolume5: 0, recentVolume15: 0,
      gapFillStatus: -1, premarketHigh: 11, premarketHighBreak: 0 });
    expect(snapshots.last_regular.rows[0].values).toMatchObject({ premarketHigh: 9, premarketHighBreak: 1 });
    expect((await collectMarketPack(input)).snapshots).toEqual(snapshots);
    expect(historyRequests).toBe(2);
  });

  it("marks interrupted historical volume as partial and retries rejected baselines", async () => {
    const cache: BarCache = { key: "", daily: new Map(), intraday: new Map() };
    const { windows } = marketWindows(calendar, recent);
    const providerBar = (time: number, volume: number) => ({
      t: new Date(time).toISOString(), o: 10, h: 10, l: 10, c: 10, v: volume,
    });
    const history = calendar.slice(-11, -1).map(day => providerBar(sessionBounds(day, "regular").from, 100));
    let historyRequests = 0;
    const data = {
      async get(path: string, params: URLSearchParams) {
        if (path === "/v2/stocks/snapshots") return {};
        const timeframe = params.get("timeframe");
        if (timeframe === "15Min") {
          historyRequests++;
          if (historyRequests === 1) throw Error("temporary provider failure");
          const bars = { AAA: historyRequests === 2 ? [...history, { ...history[0], t: "invalid" }] : history, BBB: history };
          const requested = (params.get("symbols") ?? "").split(",") as (keyof typeof bars)[];
          return { bars: Object.fromEntries(requested.map(symbol => [symbol, bars[symbol]])) };
        }
        const bars = timeframe === "5Min"
          ? [providerBar(windows.last_regular.from, 150), providerBar(windows.regular.from, 300)]
          : [providerBar(windows.last_regular.from - 9.5 * HOUR_MS, 100)];
        return { bars: { AAA: bars, BBB: bars } };
      },
    };
    const stocks = ["AAA", "BBB"].map(symbol => ({ symbol, name: symbol, exchange: "NASDAQ" as const }));
    const input = { data, calendar, stocks,
      universeDate: calendar.at(-1)!.date, now: recent, cache };
    for (let i = 0; i < 2; i++) {
      const { regular } = (await collectMarketPack(input)).snapshots;
      expect.soft(regular).toMatchObject({ partial: true });
      expect(regular.rows[0].values.relativeVolume).toBeUndefined();
      expect(regular.rows[0].values.volume).toBe(300);
      expect(regular.rows[1].values.relativeVolume).toBe(i === 0 ? undefined : 3);
    }
    const recovered = (await collectMarketPack(input)).snapshots.regular;
    expect(recovered.partial).toBe(false);
    expect(recovered.rows[0].values.relativeVolume).toBe(3);
    expect(recovered.rows[1].values.relativeVolume).toBe(3);
    expect((await collectMarketPack(input)).snapshots.regular).toEqual(recovered);
    expect(historyRequests).toBe(3);
  });
});

describe("recent press releases", () => {
  it("uses publication time and requires visible creation and publication times, an eligible route, and a PR type", () => {
    const database = new Database(":memory:");
    try {
      database.exec(`CREATE TABLE news_articles (id TEXT PRIMARY KEY, ticker TEXT, published_at TEXT, created_at TEXT, route_tag TEXT, event_type TEXT, headline TEXT, slug TEXT);
        CREATE INDEX news_articles_ticker_published_idx ON news_articles(ticker, published_at DESC, id);`);
      const insert = database.prepare("INSERT INTO news_articles VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      function add(id: string, ticker: string, publishedHours: number, createdHours: number, tag: string, type: string) {
        insert.run(id, ticker, new Date(recent - publishedHours * HOUR_MS).toISOString(), new Date(recent - createdHours * HOUR_MS).toISOString(), tag, type, "Test release", id);
      }
      add("visible", "AAA", 3, 2, "default", "press_release");
      add("delayed-pub", "AAA", 0.1, 2, "default", "press_release");
      add("delayed-create", "AAA", 2, 0.1, "default", "press_release");
      add("filing", "AAA", 1, 1, "default", "sec_filing");
      add("private-channel", "AAA", 1, 1, "other", "press_release");
      add("too-old", "BBB", 48.1, 1, "default", "press_release");
      add("weekend-wire", "CCC", 10, 9, "market_cap_under_30m", "press_release_unreadable");
      const releases = latestPressReleases(database, ["AAA", "BBB", "CCC", "ZZZ"], recent, 3600);
      expect([...releases.keys()]).toEqual(["AAA", "CCC"]);
      expect(releases.get("AAA")).toEqual({ publishedAt: recent - 3 * HOUR_MS, headline: "Test release", url: "https://traderslink.pro/news/AAA/visible" });
      expect(releases.get("CCC")?.publishedAt).toBe(recent - 10 * HOUR_MS);
      expect(latestPressReleases(database, ["AAA"], recent, 49 * 3600).size).toBe(0);
      const noEvidence = { symbol: "BBB", exchange: "NASDAQ" as const, values: { price: 12 } };
      expect(matchesRule(noEvidence, { metric: "pressReleaseAge", operator: "lte", value: 24 })).toBeNull();
    } finally { database.close(); }
  });

  it("accepts trader-facing units and caps the PR rule at the covered lookback", () => {
    expect(parseThreshold("2x", "relativeVolume")).toBe(2);
    expect(parseThreshold("2.5×", "relativeVolume")).toBe(2.5);
    expect(parseThreshold("2%", "relativeVolume")).toBeNaN();
    expect(parseThreshold("24 h", "pressReleaseAge")).toBe(24);
    expect(() => parseDefinition({ ...DEFAULT_DEFINITION, rules: [{ metric: "pressReleaseAge", operator: "lte", value: 49 }] })).toThrow("invalid_rule");
  });

  it("keeps longer Scanner release lookbacks behind the same News access and delay", () => {
    const database = new Database(":memory:");
    const identity = { scope: { userId: "scanner-member" } } as TraderLinkPlatformRequestIdentity;
    newsAccess.database = database;
    newsAccess.delay = 3600;
    try {
      database.exec("CREATE TABLE news_articles(id TEXT PRIMARY KEY, ticker TEXT, published_at TEXT, created_at TEXT, route_tag TEXT, event_type TEXT, headline TEXT, slug TEXT)");
      const insert = database.prepare("INSERT INTO news_articles VALUES (?, 'AAA', ?, ?, ?, ?, ?, ?)");
      function add(id: string, publishedHours: number, createdHours: number, tag = "default", type = "press_release") {
        insert.run(id, new Date(recent - publishedHours * HOUR_MS).toISOString(),
          new Date(recent - createdHours * HOUR_MS).toISOString(), tag, type, id, id);
      }
      add("older-visible", 90, 89);
      add("delayed", 0.5, 0.2);
      add("new-filing", 4, 4, "default", "sec_filing");
      add("private", 6, 5, "other");
      expect(latestPressReleases(database, ["AAA"], recent, 3600).size).toBe(0);
      expect(memberScannerPressReleaseRecords(identity, ["AAA"], recent, 168)?.get("AAA")).toMatchObject({
        id: "older-visible", headline: "older-visible", publishedAt: recent - 90 * HOUR_MS,
      });
      expect(memberScannerPressReleaseRecords(identity, ["AAA"], recent, 168, recent + HOUR_MS)?.get("AAA")?.id)
        .toBe("delayed");
      expect(memberScannerPressReleaseRecords(identity, ["AAA"], recent - HOUR_MS, 168, recent + HOUR_MS)?.get("AAA")?.id)
        .toBe("older-visible");
      newsAccess.delay = 0;
      expect(memberScannerPressReleaseRecords(identity, ["AAA"], recent, 168)?.get("AAA")?.id).toBe("delayed");
      newsAccess.allowed = false;
      expect(memberScannerPressReleaseRecords(identity, ["AAA"], recent, 168)).toBeUndefined();
    } finally {
      newsAccess.allowed = true;
      newsAccess.delay = 0;
      newsAccess.database = undefined;
      database.close();
    }
  });

  it("applies member access, visibility delay and a rolling publication window to Recent News", () => {
    const database = new Database(":memory:");
    const now = Date.parse("2026-11-16T11:00:00.000Z");
    const identity = { scope: { userId: "test-member" } } as TraderLinkPlatformRequestIdentity;
    newsAccess.database = database;
    newsAccess.delay = 3600;
    try {
      database.exec("CREATE TABLE news_articles (id TEXT PRIMARY KEY, ticker TEXT, published_at TEXT, created_at TEXT, route_tag TEXT, event_type TEXT, headline TEXT, slug TEXT)");
      const insert = database.prepare("INSERT INTO news_articles VALUES (?, 'AAA', ?, ?, ?, ?, ?, ?)");
      function add(id: string, publishedHours: number, createdHours: number, tag = "default", type = "press_release") {
        insert.run(id, new Date(now - publishedHours * HOUR_MS).toISOString(),
          new Date(now - createdHours * HOUR_MS).toISOString(), tag, type, id, id);
      }
      add("weekend", 19, 18);
      add("filing", 3, 2, "spike", "sec_filing");
      add("delayed-publication", 0.5, 2);
      add("delayed-ingestion", 2, 0.5);
      add("private-route", 2, 2, "other");
      add("old-publication", 49, 2);
      expect(memberRecentArticles(identity, "AAA", now)?.map(article => article.headline)).toEqual(["filing", "weekend"]);
      expect(memberRecentArticles(identity, "BBB", now)).toEqual([]);
      newsAccess.eligible = false;
      expect(memberRecentArticles(identity, "AAA", now)).toBeUndefined();
      newsAccess.eligible = true;
      newsAccess.allowed = false;
      expect(memberRecentArticles(identity, "AAA", now)).toBeUndefined();
    } finally {
      newsAccess.eligible = true;
      newsAccess.allowed = true;
      newsAccess.delay = 0;
      newsAccess.database = undefined;
      database.close();
    }
  });

  it("requires a new screen run if the member loses visibility or their delay increases", () => {
    const identity = { scope: { userId: "test-member" } } as TraderLinkPlatformRequestIdentity;
    newsAccess.delay = 3_600;
    expect(canReadPressReleaseRun(identity, 0, recent)).toBe(false);
    expect(canReadPressReleaseRun(identity, 3_600, recent)).toBe(true);
    newsAccess.allowed = false;
    expect(canReadPressReleaseRun(identity, 3_600, recent)).toBe(false);
  });
});
