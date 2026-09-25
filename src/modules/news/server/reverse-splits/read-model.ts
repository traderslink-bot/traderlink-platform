import { isoDate, validTicker, type ReverseSplitEvent } from "./contracts";

export type SplitResolution = Readonly<{
  events: readonly ReverseSplitEvent[];
  conflicts: readonly Readonly<{ ticker: string; reason: string; sourceUrls: readonly string[] }>[];
}>;

function factualDate(event: ReverseSplitEvent): string {
  return event.status === "approved" ? event.approvalDate ?? event.source.publishedDate : event.source.publishedDate;
}

function termsMatch(a: ReverseSplitEvent, b: ReverseSplitEvent): boolean {
  return a.status === b.status && a.ratio === b.ratio && a.effectiveDate === b.effectiveDate;
}

export function resolveSplitEvents(input: readonly ReverseSplitEvent[]): SplitResolution {
  const groups = new Map<string, ReverseSplitEvent[]>();
  const conflicts: SplitResolution["conflicts"][number][] = [];
  const events: ReverseSplitEvent[] = [];
  for (const event of input) {
    if (!validTicker(event.ticker) || !isoDate(event.source.publishedDate)) continue;
    groups.set(event.ticker, [...(groups.get(event.ticker) ?? []), event]);
  }
  for (const [ticker, group] of groups) {
    const ordered = [...group].sort((a, b) => factualDate(a).localeCompare(factualDate(b)) ||
      Number(a.status !== "approved") - Number(b.status !== "approved") || a.source.url.localeCompare(b.source.url));
    let current: ReverseSplitEvent | undefined;
    let conflict = false;
    for (const candidate of ordered) {
      if (!current) { current = candidate; continue; }
      if (candidate.status === "approved" && current.status !== "approved") {
        const completedBeforeNewApproval = current.status === "confirmed" && current.effectiveDate && candidate.approvalDate && candidate.approvalDate > current.effectiveDate;
        const newApprovalAfterTerminal = (current.status === "cancelled" || current.status === "postponed") && candidate.approvalDate && candidate.approvalDate > current.source.publishedDate;
        if (!completedBeforeNewApproval && !newApprovalAfterTerminal) continue;
      }
      if (candidate.status === "announced" && current.status === "confirmed" && candidate.ratio === current.ratio &&
        (!candidate.approvalDate || !current.effectiveDate || candidate.approvalDate <= current.effectiveDate)) continue;
      const sameDay = factualDate(candidate) === factualDate(current);
      const bothSelected = candidate.status !== "approved" && current.status !== "approved";
      const approvalConflict = candidate.status === "approved" && current.status === "approved" &&
        candidate.authorizedRatio && current.authorizedRatio && candidate.authorizedRatio !== current.authorizedRatio;
      const agreesOnAnnouncedTerms = (candidate.status === "announced" || current.status === "announced") &&
        (candidate.status === "confirmed" || current.status === "confirmed") && candidate.ratio === current.ratio;
      if (sameDay && (approvalConflict || (bothSelected && !termsMatch(candidate, current) && !agreesOnAnnouncedTerms))) {
        conflict = true;
        continue;
      }
      if (!sameDay) conflict = false;
      const sameApproval = candidate.approvalDate !== null && candidate.approvalDate === current.approvalDate;
      current = {
        ...candidate,
        authorizedRatio: candidate.authorizedRatio ?? (sameApproval ? current.authorizedRatio : null),
        approvalExpiresDate: candidate.approvalExpiresDate ?? (sameApproval ? current.approvalExpiresDate : null),
      };
    }
    if (conflict) conflicts.push({ ticker, reason: "same_day_terms_conflict", sourceUrls: [...new Set(group.map((event) => event.source.url))] });
    else if (current) events.push(current);
  }
  return { events: events.sort((a, b) => a.ticker.localeCompare(b.ticker)), conflicts };
}

export type WatchlistSplitStatus = Readonly<{
  label: "Reverse split approved" | "Reverse split announced";
  ratio: number | null; authorizedRatio: string | null; effectiveDate: string | null;
  approvalDate: string | null; sourceUrl: string;
}>;

export function watchlistSplitStatus(event: ReverseSplitEvent | null, marketDate: string): WatchlistSplitStatus | null {
  if (!isoDate(marketDate)) throw new Error("reverse_split_market_date_invalid");
  if (!event || event.status === "cancelled" || event.status === "postponed" ||
    (event.effectiveDate && event.effectiveDate < marketDate) ||
    (event.status === "approved" && event.approvalExpiresDate && event.approvalExpiresDate < marketDate)) return null;
  return {
    label: event.status === "approved" ? "Reverse split approved" : "Reverse split announced",
    ratio: event.ratio, authorizedRatio: event.authorizedRatio, effectiveDate: event.effectiveDate,
    approvalDate: event.approvalDate, sourceUrl: event.source.url,
  };
}

export type SplitListFilter = "all" | "approved" | "announced" | "upcoming" | "history";

export function paginateSplitEvents(input: Readonly<{
  events: readonly ReverseSplitEvent[]; marketDate: string; filter: SplitListFilter;
  ticker?: string; page: number; pageSize: number;
}>): Readonly<{ items: readonly ReverseSplitEvent[]; total: number; page: number; pageSize: number; pageCount: number }> {
  if (!isoDate(input.marketDate) || !Number.isSafeInteger(input.page) || input.page < 1 ||
    !Number.isSafeInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > 100 ||
    !["all", "approved", "announced", "upcoming", "history"].includes(input.filter)) throw new Error("reverse_split_page_invalid");
  const ticker = input.ticker?.trim().toUpperCase();
  if (ticker && !validTicker(ticker)) throw new Error("reverse_split_ticker_invalid");
  const selected = input.events.filter((event) => {
    if (ticker && ticker !== event.ticker) return false;
    const historical = Boolean(event.effectiveDate && event.effectiveDate < input.marketDate) ||
      event.status === "cancelled" || event.status === "postponed" ||
      Boolean(event.status === "approved" && event.approvalExpiresDate && event.approvalExpiresDate < input.marketDate);
    if (input.filter === "all") return true;
    if (input.filter === "history") return historical;
    if (historical) return false;
    if (input.filter === "approved") return event.status === "approved";
    if (input.filter === "announced") return event.status === "announced" || event.status === "confirmed";
    return event.status === "confirmed" && event.effectiveDate !== null;
  }).sort((a, b) => (a.effectiveDate ?? "9999").localeCompare(b.effectiveDate ?? "9999") ||
    a.ticker.localeCompare(b.ticker) || b.source.publishedDate.localeCompare(a.source.publishedDate) || a.source.url.localeCompare(b.source.url));
  const pageCount = Math.ceil(selected.length / input.pageSize);
  const page = Math.min(input.page, Math.max(1, pageCount));
  return { items: selected.slice((page - 1) * input.pageSize, page * input.pageSize), total: selected.length, page, pageSize: input.pageSize, pageCount };
}
