import { describe, expect, it } from "vitest";
import type { ReverseSplitEvent, SplitSource } from "./contracts";
import { parseReverseSplit } from "./parsing";
import { paginateSplitEvents, resolveSplitEvents, splitCatalogue, watchlistSplitStatus } from "./read-model";
import { reverseSplitClose, reverseSplitQuantity } from "../../contracts/reverse-split-dashboard-contracts";
import { selectDigestEvents, splitMessage, type DigestSchedule } from "./messages";

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
