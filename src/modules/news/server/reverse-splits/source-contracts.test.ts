import { describe, expect, it } from "vitest";
import type { ReverseSplitEvent, SplitSource } from "./contracts";
import { parseReverseSplit } from "./parsing";
import { paginateSplitEvents, resolveSplitEvents, splitCatalogue, watchlistSplitStatus } from "./read-model";
import { reverseSplitClose, reverseSplitQuantity } from "../../contracts/reverse-split-dashboard-contracts";
import { buildDigest, latestRegularCloseDate, selectDigestEvents, splitMessage, type DigestSchedule, type SplitCalendar } from "./messages";
import { relatedSecSources } from "./sources";
import { getSplitMarketData } from "./market-data";

const source: SplitSource = {
  url: "https://www.sec.gov/Archives/edgar/data/1234/000000123426000001/example.htm",
  kind: "sec", ticker: "DEMO", company: "Example Company", title: "8-K", publishedDate: "2026-09-24",
};
const approved: ReverseSplitEvent = {
  ticker: "DEMO", company: "Example Company", status: "approved", ratio: null,
  authorizedRatio: "1-for-10 to 1-for-50", effectiveDate: null, approvalDate: "2026-09-01", source, evidence: "Synthetic example",
};
const confirmed: ReverseSplitEvent = { ...approved, status: "confirmed", ratio: 20, effectiveDate: "2026-09-28" };
const schedule: DigestSchedule = { date: "2026-09-27", due: true, weekly: true, nextSession: "2026-09-28", endDate: "2026-10-02", closeDate: "2026-09-25" };

describe("reverse-split source and presentation contracts", () => {
  it("separates an explicit Nasdaq ADS reverse split from depositary conversion ratios", () => {
    const notice: SplitSource = { ...source, kind: "nasdaq", ticker: null, company: null,
      title: "Information Regarding the Reverse Stock Split, Ratio Change and CUSIP Number Change for Synthetic Limited (DEMO)" };
    const body = '<div class="newscontentbox2"><p>Synthetic Limited (DEMO) will effect a one-for-twenty (1-20) reverse split of its American Depositary Shares and ratio change from one (1) American Depositary Share representing ten (10) Ordinary Shares (1:10) to one (1) American Depositary Share representing two hundred (200) Ordinary Shares (1:200).</p><p>The reverse stock split and ADS ratio change will become effective on Monday, September 28, 2026.</p><!-- Begin FooterHTAEmail';
    expect(parseReverseSplit(notice, body).event).toMatchObject({ status: "confirmed", ratio: 20, effectiveDate: "2026-09-28" });
  });
  it("recognizes a board-selected fixed ratio and a trading date separated from legal effectiveness", () => {
    const body = "The board of directors has approved a 1-for-25 reverse stock split. Stockholders approved future reverse stock splits and authorized the board to select the final ratio. The split becomes legally effective September 28, 2026 at 5:00 pm, and common stock is expected to begin trading on a reverse stock split-adjusted basis on The Nasdaq Capital Market under its existing ticker symbol at the opening of the regular session on September 29, 2026.";
    expect(parseReverseSplit({ ...source, publishedDate: "2026-09-25" }, body).event)
      .toMatchObject({ status: "confirmed", ratio: 25, effectiveDate: "2026-09-29", approvalDate: null });
    expect(parseReverseSplit(source, "The board of directors has approved a 1-for-25 reverse stock split subject to shareholder approval.").event).toBeNull();
  });
  it("uses only the dated regular close and reported float", async () => {
    const fetcher = (async (url) => new Response(JSON.stringify(String(url).includes("us-quote-delayed")
      ? { data: { "DEMO.US": { type: "STOCK", description: "Common stock", sharesFloat: 100_000, sharesOutstanding: 900_000 } } }
      : [{ date: "2026-09-25", close: 5.25, adjusted_close: 105 }]), { status: 200 })) as typeof fetch;
    const result = await getSplitMarketData({ ticker: "DEMO", token: "synthetic", expectedCloseDate: "2026-09-25", now: new Date("2026-09-25T23:00:00Z"), fetcher });
    expect(result).toMatchObject({ float: 100_000, close: 5.25, closeDate: "2026-09-25", eligibleSecurity: true });
  });
  it("withholds security eligibility if the quote provider is unavailable", async () => {
    const fetcher = (async () => new Response("Unavailable", { status: 503 })) as typeof fetch;
    const result = await getSplitMarketData({ ticker: "DEMO", token: "synthetic", expectedCloseDate: "2026-09-25", now: new Date("2026-09-25T23:00:00Z"), fetcher });
    expect(result).toMatchObject({ float: null, close: null, eligibleSecurity: false });
  });
  it("does not label a changed later trading date as the next session", () => {
    const pages = buildDigest({ schedule, events: [{ ...confirmed, effectiveDate: "2026-10-09" }], market: new Map(),
      coverageWarnings: [], dashboardUrl: "https://app.traderslink.pro/reverse-splits", update: true });
    expect(pages.join("\n").includes("Updated split information")).toBe(true);
    expect(pages.join("\n").includes("2026-10-09")).toBe(true);
    expect(pages.join("\n").includes("No confirmed splits found")).toBe(false);
  });
  it("does not promote a conditional trading date to confirmed", () => {
    expect(parseReverseSplit(source, "The company will effect a 1-for-20 reverse stock split. Shares will begin trading on a split-adjusted basis on September 28, 2026, subject to final approval.").event)
      .toMatchObject({ status: "announced", ratio: 20, effectiveDate: null });
  });
  it("recognizes trading-before-commence wording and a separately selected final ratio", () => {
    expect(parseReverseSplit(source, `<p>On September 1, 2026, stockholders approved a reverse stock split at a ratio of up to 1-for-30.</p>
      <p>The Board approved the final reverse stock split ratio of 1-for-25.</p>
      <p>Trading of common stock on a split-adjusted basis will commence at market open on September 28, 2026.</p>`).event)
      .toMatchObject({ status: "confirmed", ratio: 25, effectiveDate: "2026-09-28", authorizedRatio: "Up to 1-for-30" });
  });
  it("queues related SEC filing documents without leaving the accession", () => {
    const related = relatedSecSources(source, `<a href="ex99-1.htm">Press release</a><a href="https://evil.example/ex99.htm">Press release</a>
      <a href="../000000123426000099/ex99.htm">Press release</a><a href="/ix?doc=/Archives/edgar/data/1234/000000123426000001/form8-k.htm">8-K</a>`);
    expect(related.map((item) => item.url)).toEqual([
      "https://www.sec.gov/Archives/edgar/data/1234/000000123426000001/0000001234-26-000001-index.htm",
      "https://www.sec.gov/Archives/edgar/data/1234/000000123426000001/ex99-1.htm",
      "https://www.sec.gov/Archives/edgar/data/1234/000000123426000001/form8-k.htm",
    ]);
    expect(related.every((item) => item.relatedDepth === 1 && item.ticker === source.ticker)).toBe(true);
    expect(relatedSecSources({ ...source, relatedDepth: 2 }, '<a href="ex99.htm">Press release</a>')).toEqual([]);
  });
  it("does not interpret a filing document index as an announcement", () => {
    expect(parseReverseSplit({ ...source, url: source.url.replace("example.htm", "0000001234-26-000001-index.htm") }, "Reverse split document index").reason).toBe("related_filing_index");
  });
  it("uses the previous completed session before today's regular close", () => {
    const calendar: SplitCalendar = {
      marketDateAt: () => "2026-09-25", nextOpenSessionDate: () => "2026-09-28",
      easternWallClockAtUtc: (date, time) => `${date}T${Number(time.slice(0, 2)) + 4}:00:00.000Z`,
      session: () => ({ state: "open", sessionKind: "normal" }),
    };
    expect(latestRegularCloseDate(new Date("2026-09-25T19:59:00Z"), calendar)).toBe("2026-09-24");
    expect(latestRegularCloseDate(new Date("2026-09-25T20:01:00Z"), calendar)).toBe("2026-09-25");
  });
  it("separates an approved range from a selected ratio and trading date", () => {
    const parsed = parseReverseSplit(source, `<p>On September 1, 2026, stockholders approved a reverse stock split at a ratio between 1-for-10 and 1-for-50.</p>
      <p>The company will effect a 1-for-20 reverse stock split.</p>
      <p>The common stock will begin trading on a split-adjusted basis on September 28, 2026.</p>`);
    expect(parsed.event).toMatchObject({ status: "confirmed", ratio: 20, approvalDate: "2026-09-01", authorizedRatio: "1-for-10 to 1-for-50", effectiveDate: "2026-09-28" });
  });
  it("retains an actual approval without inventing its date", () => {
    expect(parseReverseSplit(source, "The shareholders approved a reverse stock split at a ratio of up to 1-for-50.").event)
      .toMatchObject({ status: "approved", approvalDate: null, authorizedRatio: "Up to 1-for-50" });
  });
  it("uses the meeting date, not the filing date or authority deadline", () => {
    expect(parseReverseSplit(source, "At the meeting of stockholders held on September 1, 2026, stockholders approved a reverse stock split at a ratio of up to 1-for-50, exercisable until December 31, 2027.").event)
      .toMatchObject({ approvalDate: "2026-09-01", approvalExpiresDate: "2027-12-31" });
  });
  it.each([
    "If the shareholders approved the reverse stock split, the board could proceed.",
    "The shareholders have not approved a reverse stock split.",
    "The Board approved the reverse stock split. Stockholder approval is not required.",
    "Shareholders will vote on a proposed reverse stock split.",
  ])("does not invent shareholder approval from conditional or board-only evidence: %s", (body) => {
    expect(parseReverseSplit(source, body).event).toBeNull();
  });
  it("does not use legal effectiveness as proof of the trading date", () => {
    expect(parseReverseSplit(source, "The company will effect a 1-for-20 reverse stock split. The certificate becomes effective at 4:30 p.m. on September 27, 2026.").event)
      .toMatchObject({ status: "announced", ratio: 20, effectiveDate: null });
  });
  it("accepts a fractional reverse ratio", () => {
    expect(parseReverseSplit(source, "The company will effect a 1-for-7.7 reverse stock split. Shares will begin trading on a split-adjusted basis on September 28, 2026.").event)
      .toMatchObject({ status: "confirmed", ratio: 7.7 });
  });
  it("defers contradictory final terms for automated follow-up", () => {
    expect(parseReverseSplit(source, "The company will effect a 1-for-20 reverse stock split. The company will implement a 1-for-30 reverse stock split.").outcome).toBe("deferred");
  });
  it("does not downgrade confirmed terms when a later filing repeats the approval", () => {
    const repeated = { ...approved, source: { ...source, publishedDate: "2026-09-25", url: `${source.url}?synthetic-repeat` } };
    expect(resolveSplitEvents([confirmed, repeated]).events[0]).toMatchObject({ status: "confirmed", ratio: 20 });
  });
  it("withholds and reports conflicting same-day announcements", () => {
    const result = resolveSplitEvents([confirmed, { ...confirmed, ratio: 30 }]);
    expect(result.events).toEqual([]);
    expect(result.conflicts).toHaveLength(1);
  });
  it("shows only the approved positive watchlist labels", () => {
    expect(watchlistSplitStatus(approved, "2026-09-24")?.label).toBe("Reverse split approved");
    expect(watchlistSplitStatus(confirmed, "2026-09-24")?.label).toBe("Reverse split announced");
    expect(watchlistSplitStatus(null, "2026-09-24")).toBeNull();
    expect(watchlistSplitStatus({ ...confirmed, status: "cancelled" }, "2026-09-24")).toBeNull();
    expect(watchlistSplitStatus(confirmed, "2026-09-29")).toBeNull();
  });
  it("does not show expired authorization as a current approval", () => {
    expect(watchlistSplitStatus({ ...approved, approvalExpiresDate: "2026-09-23" }, "2026-09-24")).toBeNull();
  });
  it("keeps approval-only entries out of the nightly scheduled-split selection", () => {
    expect(selectDigestEvents([approved], schedule)).toEqual([]);
    expect(selectDigestEvents([confirmed], schedule)).toMatchObject([confirmed]);
    expect(/not scheduled/iu.test(splitMessage(approved, undefined, "2026-09-24"))).toBe(false);
  });
  it("paginates deterministically without mutating the input", () => {
    const input = [confirmed, { ...confirmed, ticker: "ABCD" }];
    expect(paginateSplitEvents({ events: input, filter: "upcoming", marketDate: "2026-09-24", page: 1, pageSize: 1 }))
      .toMatchObject({ total: 2, pageCount: 2, items: [{ ticker: "ABCD" }] });
    expect(input[0].ticker).toBe("DEMO");
  });
  it("retains a distinct past announced date alongside a later split", () => {
    const previous = { ...confirmed, effectiveDate: "2026-06-01", source: { ...source, publishedDate: "2026-05-28" } };
    expect(splitCatalogue([previous, confirmed], "2026-09-24").events).toHaveLength(2);
  });
  it("does not turn a cancelled future date into a past completed split", () => {
    const cancelled: ReverseSplitEvent = { ...confirmed, status: "cancelled", effectiveDate: null, ratio: null,
      source: { ...source, publishedDate: "2026-09-25" } };
    expect(splitCatalogue([confirmed, cancelled], "2026-09-30").events).toMatchObject([{ status: "cancelled" }]);
  });
  it("keeps missing values distinct from zero and tiny prices", () => {
    expect(reverseSplitQuantity(null)).toBe("—");
    expect(reverseSplitClose(null)).toBe("—");
    expect(reverseSplitClose(0.005)).toBe("<$0.01");
  });
});
