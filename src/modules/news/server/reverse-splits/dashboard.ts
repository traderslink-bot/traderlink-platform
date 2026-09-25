import "server-only";
import { createHash } from "node:crypto";
import type { ReverseSplitCoverage, ReverseSplitDashboard, ReverseSplitFilter, ReverseSplitRow, WatchlistReverseSplits } from "../../contracts/reverse-split-dashboard-contracts";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { record, validTicker, type ReverseSplitEvent, type SplitMarketData } from "./contracts";
import { paginateSplitEvents, resolveSplitEvents, splitCatalogue, watchlistSplitStatus } from "./read-model";
import { ReverseSplitRepository } from "./repository";
import { sourceUrl } from "./sources";
import { reverseSplitPrivatePreviewEnabled } from "./configuration";

const PAGE_SIZE = 25;
const MAX_OBSERVATIONS = 10_000;

function marketDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function recent(value: unknown, now: Date, maximumAge: number): value is string {
  if (typeof value !== "string") return false;
  const age = now.getTime() - Date.parse(value);
  return Number.isFinite(age) && age >= 0 && age <= maximumAge;
}

function enabled(): boolean {
  return reverseSplitPrivatePreviewEnabled();
}

function coverage(repository: ReverseSplitRepository, now: Date, limited: boolean, conflicts: number): ReverseSplitCoverage {
  const nasdaq = record(repository.readRuntimeState("nasdaq_discovery"));
  const sec = record(repository.readRuntimeState("sec_discovery"));
  const backfill = record(repository.readRuntimeState("sec_backfill"));
  const successes = [nasdaq?.lastSuccess, sec?.lastSuccess].filter((value): value is string => typeof value === "string" && Number.isFinite(Date.parse(value)));
  const checkedAt = successes.length === 2 && successes.every((value) => Date.parse(value) <= now.getTime()) ? successes.sort()[0] : null;
  if (!successes.length) return { state: "unavailable", note: "Reverse-split source updates are not available yet.", checkedAt };
  if (!recent(nasdaq?.lastSuccess, now, 60 * 60_000) || !recent(sec?.lastSuccess, now, 60 * 60_000)) return {
    state: "partial", note: "Source updates are delayed. The list may be missing recent changes.", checkedAt,
  };
  const counts = repository.sourceCoverage();
  if (limited || conflicts || counts.deferred || counts.failed || counts.pending || counts.fetching || counts.market_pending || sec?.completedUnresolved || backfill?.historicalUnresolved || backfill?.completedUnresolved) return {
    state: "partial", note: "Some source information is still being verified. This list may be incomplete.", checkedAt,
  };
  if (backfill?.complete !== true) return { state: "partial", note: "Older filings are still being collected. Verified entries appear as they become available.", checkedAt };
  return { state: "ready", note: null, checkedAt };
}

function row(event: ReverseSplitEvent, market: SplitMarketData | undefined, checkedAt: string | null, date: string, now: Date, feedFresh: boolean): ReverseSplitRow {
  const past = event.effectiveDate !== null && event.effectiveDate < date;
  const expired = event.status === "approved" && Boolean(event.approvalExpiresDate && event.approvalExpiresDate < date);
  const status: ReverseSplitRow["status"] = event.status === "cancelled" ? "Cancelled" : event.status === "postponed" ? "Postponed"
    : past ? "Past announcement" : expired ? "Approval expired" : event.status === "approved" ? "Approved" : "Announced";
  const marketFresh = market && recent(market.floatRetrievedAt, now, 30 * 60 * 60_000);
  const reportedFloat = marketFresh ? market.float : null;
  const estimated = reportedFloat && event.ratio && event.status === "confirmed" && event.effectiveDate && event.effectiveDate > date
    ? reportedFloat / event.ratio : null;
  const verified = feedFresh && recent(checkedAt, now, 30 * 60 * 60_000);
  return {
    id: createHash("sha256").update(`${event.ticker}:${event.status}:${event.effectiveDate ?? event.approvalDate ?? event.source.url}`).digest("hex").slice(0, 24),
    ticker: event.ticker, company: event.company, status,
    watchlistLabel: verified ? watchlistSplitStatus(event, date)?.label ?? null : null,
    approvedRatio: event.authorizedRatio, ratio: event.ratio, approvalDate: event.approvalDate,
    approvalExpiresDate: event.approvalExpiresDate ?? null, tradingDate: event.effectiveDate,
    float: reportedFloat ?? null, estimatedPostSplitFloat: estimated,
    floatRetrievedAt: marketFresh ? market.floatRetrievedAt : null,
    close: market?.close ?? null, closeDate: market?.closeDate ?? null,
    sourceUrl: sourceUrl(event.source.url, event.source.kind).toString(), sourceKind: event.source.kind,
    sourcePublishedDate: event.source.publishedDate, checkedAt,
  };
}

export function readReverseSplitDashboard(input: Readonly<{ ticker?: string; filter?: string; page?: string }>, now = new Date()): ReverseSplitDashboard {
  const ticker = (input.ticker ?? "").trim().toUpperCase();
  const filter: ReverseSplitFilter = input.filter === "approved" || input.filter === "announced" || input.filter === "history" ? input.filter : "all";
  const requestedPage = input.page && /^\d{1,6}$/u.test(input.page) ? Math.max(1, Number(input.page)) : 1;
  const date = marketDate(now);
  const empty = (info: ReverseSplitCoverage): ReverseSplitDashboard => ({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE, pageCount: 0, ticker, filter, marketDate: date, coverage: info });
  if (ticker && !validTicker(ticker)) return empty({ state: "unavailable", note: "Enter a ticker of up to four characters.", checkedAt: null });
  if (!enabled()) return empty({ state: "disabled", note: "Owner preview: live reverse-split data is not enabled yet.", checkedAt: null });
  try {
    return withReadonlyPlatformDatabase({}, (database) => {
      const repository = new ReverseSplitRepository(database);
      const observations = repository.readObservations(ticker ? [ticker] : undefined);
      const limited = observations.length > MAX_OBSERVATIONS;
      const included = observations.slice(0, MAX_OBSERVATIONS);
      const resolved = splitCatalogue(included.map((item) => item.event), date);
      const page = paginateSplitEvents({ events: resolved.events, marketDate: date, filter, ticker, page: requestedPage, pageSize: PAGE_SIZE });
      const state = coverage(repository, now, limited, resolved.conflicts.length);
      const quotes = repository.marketSnapshots([...new Set(page.items.map((event) => event.ticker))]);
      const dates = new Map(included.map((item) => [item.event.source.url, item.fetchedAt]));
      return { ...page, ticker, filter, marketDate: date, coverage: state,
        items: page.items.filter((event) => quotes.get(event.ticker)?.eligibleSecurity !== false)
          .map((event) => row(event, quotes.get(event.ticker), dates.get(event.source.url) ?? null, date, now, recent(state.checkedAt, now, 60 * 60_000))),
      };
    });
  } catch {
    return empty({ state: "unavailable", note: "Reverse-split information is temporarily unavailable. Try again shortly.", checkedAt: null });
  }
}

export function readWatchlistReverseSplits(tickers: readonly string[], now = new Date()): WatchlistReverseSplits {
  const empty: WatchlistReverseSplits = { items: [], generatedAt: now.toISOString() };
  if (tickers.length > 100 || tickers.some((ticker) => !validTicker(ticker))) throw new Error("reverse_split_tickers_invalid");
  if (!enabled() || !tickers.length) return empty;
  return withReadonlyPlatformDatabase({}, (database) => {
    const repository = new ReverseSplitRepository(database);
    const observations = repository.readObservations([...new Set(tickers)]);
    if (observations.length > MAX_OBSERVATIONS) return empty;
    const resolved = resolveSplitEvents(observations.map((item) => item.event));
    const state = coverage(repository, now, false, resolved.conflicts.length);
    if (!recent(state.checkedAt, now, 60 * 60_000)) return empty;
    const quotes = repository.marketSnapshots(tickers);
    const dates = new Map(observations.map((item) => [item.event.source.url, item.fetchedAt]));
    return { generatedAt: now.toISOString(), items: resolved.events
      .filter((event) => quotes.get(event.ticker)?.eligibleSecurity !== false)
      .map((event) => row(event, quotes.get(event.ticker), dates.get(event.source.url) ?? null, marketDate(now), now, true))
      .filter((item) => item.watchlistLabel !== null),
    };
  });
}
