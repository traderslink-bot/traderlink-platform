import "server-only";
import { record, isoDate, shiftDate } from "./contracts";
import { parseReverseSplit } from "./parsing";
import { ReverseSplitRepository } from "./repository";
import { discoverNasdaqSplits, discoverSecSplits, relatedSecSources, retrieveSplitSource } from "./sources";

export class ReverseSplitAcquisitionService {
  constructor(
    private readonly repository: ReverseSplitRepository,
    private readonly secUserAgent: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async discoverNasdaq(): Promise<Readonly<{ discovered: number; failure: string | null }>> {
    const claimed = this.repository.claimRuntime("nasdaq_discovery", this.now().toISOString());
    if (!claimed) return { discovered: 0, failure: null };
    const previous = record(claimed.state);
    if (typeof previous?.nextAt === "string" && previous.nextAt > this.now().toISOString()) {
      this.repository.completeRuntime(claimed, claimed.state, this.now().toISOString());
      return { discovered: 0, failure: null };
    }
    if (!this.repository.reserveRequest(this.now().toISOString())) {
      this.repository.completeRuntime(claimed, claimed.state, this.now().toISOString());
      return { discovered: 0, failure: null };
    }
    try {
      const sources = await discoverNasdaqSplits(this.fetcher);
      const now = this.now();
      this.repository.discover(sources, now.toISOString());
      this.repository.completeRuntime(claimed, { nextAt: new Date(now.getTime() + 15 * 60_000).toISOString(), lastSuccess: now.toISOString(), count: sources.length }, now.toISOString());
      return { discovered: sources.length, failure: null };
    } catch {
      const now = this.now();
      this.repository.completeRuntime(claimed, { ...previous, nextAt: new Date(now.getTime() + 5 * 60_000).toISOString(), failure: "nasdaq_discovery_failed" }, now.toISOString());
      return { discovered: 0, failure: "nasdaq_discovery_failed" };
    }
  }

  async discoverSec(marketDate: string, mode: "recent" | "backfill" = "recent"): Promise<Readonly<{ discovered: number; unresolved: number; failure: string | null }>> {
    if (!isoDate(marketDate)) throw new Error("reverse_split_market_date_invalid");
    const claimed = this.repository.claimRuntime(mode === "backfill" ? "sec_backfill" : "sec_discovery", this.now().toISOString());
    if (!claimed) return { discovered: 0, unresolved: 0, failure: null };
    const previous = record(claimed.state);
    if (mode === "backfill" && previous?.complete === true) {
      this.repository.completeRuntime(claimed, claimed.state, this.now().toISOString());
      return { discovered: 0, unresolved: 0, failure: null };
    }
    if (typeof previous?.nextAt === "string" && previous.nextAt > this.now().toISOString()) {
      this.repository.completeRuntime(claimed, claimed.state, this.now().toISOString());
      return { discovered: 0, unresolved: 0, failure: null };
    }
    const lowerBound = typeof previous?.lowerBound === "string" && isoDate(previous.lowerBound) ? previous.lowerBound : shiftDate(marketDate, -365);
    const from = typeof previous?.from === "string" && isoDate(previous.from) ? previous.from : shiftDate(marketDate, mode === "backfill" ? -6 : -2);
    const to = typeof previous?.to === "string" && isoDate(previous.to) ? previous.to : marketDate;
    const offset = typeof previous?.offset === "number" && Number.isSafeInteger(previous.offset) ? previous.offset : 0;
    if (!this.repository.reserveRequest(this.now().toISOString())) {
      this.repository.completeRuntime(claimed, claimed.state, this.now().toISOString());
      return { discovered: 0, unresolved: 0, failure: null };
    }
    try {
      const page = await discoverSecSplits({ from, to, offset, userAgent: this.secUserAgent, fetcher: this.fetcher });
      const now = this.now();
      this.repository.discover(page.sources, now.toISOString());
      const unresolved = (offset ? Number(previous?.unresolved ?? 0) : 0) + page.unresolved;
      const finishedWindow = page.nextOffset === null;
      const nextTo = shiftDate(from, -1);
      const nextFrom = shiftDate(nextTo, -6) < lowerBound ? lowerBound : shiftDate(nextTo, -6);
      const completed = { lastSuccess: now.toISOString(), completedFrom: from, completedTo: to, completedUnresolved: unresolved,
        historicalUnresolved: Number(previous?.historicalUnresolved ?? 0) + (mode === "backfill" ? unresolved : 0) };
      const nextState = !finishedWindow
        ? { ...previous, from, to, offset: page.nextOffset, lowerBound, unresolved, nextAt: new Date(now.getTime() + 2_000).toISOString() }
        : mode === "backfill"
          ? { ...completed, lowerBound, from: nextFrom, to: nextTo, offset: 0, complete: from <= lowerBound, nextAt: new Date(now.getTime() + 2_000).toISOString() }
          : { ...completed, offset: 0, nextAt: new Date(now.getTime() + 15 * 60_000).toISOString() };
      this.repository.completeRuntime(claimed, nextState, now.toISOString());
      return { discovered: page.sources.length, unresolved: page.unresolved, failure: null };
    } catch {
      const now = this.now();
      this.repository.completeRuntime(claimed, { ...previous, from, to, offset, lowerBound,
        nextAt: new Date(now.getTime() + 5 * 60_000).toISOString(), failure: "sec_discovery_failed" }, now.toISOString());
      return { discovered: 0, unresolved: 0, failure: "sec_discovery_failed" };
    }
  }

  async processOneSource(): Promise<Readonly<{ outcome: string; reason: string }>> {
    if (!this.repository.hasDueSource(this.now().toISOString())) return { outcome: "idle", reason: "queue_empty" };
    if (!this.repository.reserveRequest(this.now().toISOString())) return { outcome: "idle", reason: "source_budget_wait" };
    const claimed = this.repository.claimSource(this.now().toISOString());
    if (!claimed) return { outcome: "idle", reason: "queue_empty" };
    try {
      const body = await retrieveSplitSource(claimed.source, this.secUserAgent, this.fetcher);
      const result = parseReverseSplit(claimed.source, body);
      this.repository.discover(relatedSecSources(claimed.source, body), this.now().toISOString());
      const stored = this.repository.completeSource(claimed, body, result, this.now().toISOString());
      return stored ? { outcome: result.outcome, reason: result.reason } : { outcome: "deferred", reason: "source_lease_expired" };
    } catch {
      this.repository.failSource(claimed, this.now().toISOString());
      return { outcome: "failed", reason: "source_processing_failed" };
    }
  }
}
