import { createHash } from "node:crypto";
import { shiftDate, type ReverseSplitEvent, type SplitMarketData } from "./contracts";
import { resolveSplitEvents } from "./read-model";

export type SplitCalendar = Readonly<{
  marketDateAt(now: Date): string;
  easternWallClockAtUtc(date: string, time: string): string;
  nextOpenSessionDate(date: string): string;
  session(date: string): Readonly<{ state: "open" | "closed" }>;
}>;
export type DigestSchedule = Readonly<{ date: string; due: boolean; weekly: boolean; nextSession: string; endDate: string; closeDate: string }>;
export function digestSchedule(now: Date, calendar: SplitCalendar): DigestSchedule {
  const date = calendar.marketDateAt(now), deadline = calendar.easternWallClockAtUtc(date, "19:00");
  const weekly = new Date(`${date}T12:00:00Z`).getUTCDay() === 0;
  const nextSession = calendar.nextOpenSessionDate(date);
  let closeDate = date;
  for (let count = 0; calendar.session(closeDate).state !== "open"; count++) {
    if (count > 14) throw new Error("reverse_split_calendar_gap");
    closeDate = shiftDate(closeDate, -1);
  }
  return { date, due: now.toISOString() >= deadline, weekly, nextSession, endDate: weekly ? shiftDate(date, 5) : nextSession, closeDate };
}

export function latestSplitEvents(events: readonly ReverseSplitEvent[]): ReverseSplitEvent[] {
  return [...resolveSplitEvents(events).events];
}

export function selectDigestEvents(events: readonly ReverseSplitEvent[], schedule: DigestSchedule): ReverseSplitEvent[] {
  return latestSplitEvents(events).filter((event) => event.status === "confirmed" && event.effectiveDate !== null &&
    event.effectiveDate >= schedule.nextSession && event.effectiveDate <= schedule.endDate);
}

export function eventSignature(events: readonly ReverseSplitEvent[]): string {
  return createHash("sha256").update(JSON.stringify([...events].sort((a, b) => a.ticker.localeCompare(b.ticker)).map((event) => ({
    ticker: event.ticker, status: event.status, ratio: event.ratio, date: event.effectiveDate,
    approved: event.approvalDate, authorized: event.authorizedRatio,
  })))).digest("hex");
}

function safeText(value: string): string { return value.replace(/[@<>`*_~|\\]/gu, "").replace(/[\r\n]/gu, " "); }
const quantity = (value: number): string => Math.floor(value).toLocaleString("en-US");
export function splitMessage(event: ReverseSplitEvent, market: SplitMarketData | undefined, today: string): string {
  const lines = [`**$${event.ticker} — ${safeText(event.company)}**`];
  if (event.status === "confirmed") {
    lines.push(`Reverse split: **1-for-${event.ratio}**`, `Trading on split-adjusted basis: **${event.effectiveDate}**`);
  } else if (event.status === "approved") {
    lines.push("Reverse split approved");
    if (event.approvalDate) lines.push(`Shareholder approval: ${event.approvalDate}`);
    if (event.authorizedRatio) lines.push(`Authorized ratio: ${event.authorizedRatio}`);
  } else if (event.status === "announced") {
    lines.push("Reverse split announced");
    if (event.ratio) lines.push(`Reverse split: **1-for-${event.ratio}**`);
  } else lines.push(event.status === "cancelled" ? "Reverse split cancelled" : "Reverse split postponed — new date not confirmed");
  lines.push(`Float (EODHD reported): ${market?.float ? quantity(market.float) : "Unavailable"}`);
  if (market?.float && event.ratio && event.status === "confirmed" && event.effectiveDate! > today) {
    lines.push(`Estimated post-split float*: ${quantity(market.float / event.ratio)}`);
  }
  lines.push(market?.close && market.closeDate
    ? `Regular-session close (${market.closeDate}): $${market.close.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `Regular-session close${market?.expectedCloseDate ? ` (${market.expectedCloseDate})` : ""}: Unavailable`);
  lines.push(`<${event.source.url}>`);
  return lines.join("\n");
}

export function buildDigest(input: Readonly<{
  schedule: DigestSchedule; events: readonly ReverseSplitEvent[]; market: ReadonlyMap<string, SplitMarketData>;
  coverageWarnings: readonly string[]; dashboardUrl: string; update?: boolean;
}>): string[] {
  const { schedule } = input;
  const dashboard = new URL(input.dashboardUrl);
  if (dashboard.protocol !== "https:" || dashboard.username || dashboard.password || /[<>\s]/u.test(input.dashboardUrl)) throw new Error("reverse_split_dashboard_url_invalid");
  const title = `**Reverse Splits — ${input.update ? "Update" : schedule.weekly ? "Week Ahead" : "Next Trading Session"} — ${schedule.date}**`;
  const sections = [title];
  if (input.coverageWarnings.length) sections.push("Source coverage is incomplete. This is the confirmed information available; missing entries may be added later.");
  const resolution = resolveSplitEvents(input.events);
  if (resolution.conflicts.length) sections.push("Conflicting source details are being checked automatically; affected tickers are withheld from this post.");
  const events = resolution.events.filter((event) => input.market.get(event.ticker)?.eligibleSecurity !== false);
  const confirmed = events.filter((event) => event.status === "confirmed").sort((a, b) => a.effectiveDate!.localeCompare(b.effectiveDate!) || a.ticker.localeCompare(b.ticker));
  if (schedule.weekly) {
    const monday = shiftDate(schedule.date, 1);
    sections.push(`**Monday — ${monday}**`);
    const mondayEvents = confirmed.filter((event) => event.effectiveDate === monday);
    sections.push(...(mondayEvents.length ? mondayEvents.map((event) => splitMessage(event, input.market.get(event.ticker), schedule.date)) : [schedule.nextSession !== monday ? `Market closed. Next trading session: ${schedule.nextSession}.` : "No confirmed splits found for Monday."]));
    sections.push("**Later This Week**");
    const later = confirmed.filter((event) => event.effectiveDate !== monday);
    sections.push(...(later.length ? later.map((event) => splitMessage(event, input.market.get(event.ticker), schedule.date)) : ["No additional confirmed splits found."]));
  } else {
    sections.push(`**Next trading session — ${schedule.nextSession}**`);
    sections.push(...(confirmed.length ? confirmed.map((event) => splitMessage(event, input.market.get(event.ticker), schedule.date)) : ["No confirmed splits found for this session."]));
  }
  const changed = events.filter((event) => event.status === "postponed" || event.status === "cancelled");
  if (changed.length) sections.push("**Schedule Changes**", ...changed.map((event) => splitMessage(event, input.market.get(event.ticker), schedule.date)));
  sections.push(`Full list and shareholder approvals: <${dashboard.toString()}>`);
  if (events.some((event) => event.ratio && input.market.get(event.ticker)?.float)) sections.push("*Estimate assumes the reported float is pre-split; provider figures can lag. Float retrieved for this post. Prices and float: EODHD.");
  const pages: string[] = [];
  let current = "";
  for (const section of sections) {
    if (section.length + title.length + 16 > 1900) throw new Error("reverse_split_message_section_too_large");
    if (current.length + section.length + 2 > 1900) { if (current) pages.push(current); current = `${title} (continued)`; }
    current += `${current ? "\n\n" : ""}${section}`;
  }
  if (current) pages.push(current);
  return pages;
}
