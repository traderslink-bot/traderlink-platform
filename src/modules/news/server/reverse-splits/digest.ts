import "server-only";
import { record, shiftDate, type ReverseSplitEvent, type SplitMarketData } from "./contracts";
import { buildDigest, digestSchedule, eventSignature, selectDigestEvents, type SplitCalendar } from "./messages";
import { resolveSplitEvents } from "./read-model";
import { ReverseSplitRepository } from "./repository";
import { ReverseSplitNotificationStore } from "./notification-store";

function fresh(value: unknown, now: Date, age: number): value is string {
  if (typeof value !== "string") return false;
  const elapsed = now.getTime() - Date.parse(value);
  return Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= age;
}

export class ReverseSplitDigestPlanner {
  constructor(
    private readonly repository: ReverseSplitRepository,
    private readonly store: ReverseSplitNotificationStore,
    private readonly calendar: SplitCalendar,
    private readonly dashboardUrl: string,
  ) {}

  plan(now: Date): Readonly<{ queued: boolean; reason: string }> {
    return this.prepare(now, false);
  }

  preview(now: Date): Readonly<{ reason: string; parts?: readonly string[] }> {
    return this.prepare(now, true);
  }

  private prepare(now: Date, preview: boolean): Readonly<{ queued: boolean; reason: string; parts?: readonly string[] }> {
    const schedule = digestSchedule(now, this.calendar);
    if (!preview && !schedule.due) return { queued: false, reason: "before_schedule" };
    const nasdaq = record(this.repository.readRuntimeState("nasdaq_discovery"));
    const sec = record(this.repository.readRuntimeState("sec_discovery"));
    if (!fresh(nasdaq?.lastSuccess, now, 60 * 60_000) || !fresh(sec?.lastSuccess, now, 60 * 60_000)) return {
      queued: false, reason: "source_discovery_stale",
    };
    const previous = this.store.latest(schedule.date);
    const sameDay = previous?.date === schedule.date;
    const previousEvents = sameDay && Array.isArray(previous?.events) ? previous.events as ReverseSplitEvent[] : [];
    const observations = this.repository.readObservations();
    if (observations.length > 10_000) return { queued: false, reason: "observation_limit" };
    const resolution = resolveSplitEvents(observations.filter((item) => fresh(item.fetchedAt, now, 30 * 60 * 60_000)).map((item) => item.event));
    const current = new Map(resolution.events.map((event) => [event.ticker, event]));
    const selected = new Map(selectDigestEvents(resolution.events, schedule).map((event) => [event.ticker, event]));
    for (const prior of previousEvents) {
      const event = current.get(prior.ticker);
      if (!event) return { queued: false, reason: "previous_event_unresolved" };
      selected.set(event.ticker, event);
    }
    if (selected.size > 100) return { queued: false, reason: "digest_limit" };
    const snapshots = this.repository.marketSnapshots([...selected.keys()]);
    const market = new Map<string, SplitMarketData>();
    let unverifiedSecurity = false;
    for (const [ticker, event] of selected) {
      const data = snapshots.get(ticker);
      const verified = data && data.eligibleSecurity &&
        !data.issues.some((issue) => issue === "security_type_unavailable" || issue === "float_source_unavailable") &&
        fresh(data.floatRetrievedAt, now, 30 * 60 * 60_000);
      if (!verified) {
        if (previousEvents.some((prior) => prior.ticker === event.ticker)) return { queued: false, reason: "previous_security_unverified" };
        selected.delete(ticker);
        unverifiedSecurity = true;
        continue;
      }
      market.set(ticker, { ...data, close: data.closeDate === schedule.closeDate ? data.close : null,
        closeDate: data.closeDate === schedule.closeDate ? data.closeDate : null, expectedCloseDate: schedule.closeDate });
    }
    const events = [...selected.values()];
    const signature = eventSignature(events);
    if (sameDay && previous?.signature === signature) return { queued: false, reason: "unchanged", parts: previous.parts };
    const counts = this.repository.sourceCoverage();
    const backfill = record(this.repository.readRuntimeState("sec_backfill"));
    const partial = unverifiedSecurity || resolution.conflicts.length || counts.pending || counts.failed || counts.deferred || counts.fetching || counts.market_pending ||
      sec?.completedUnresolved || backfill?.complete !== true || backfill?.historicalUnresolved;
    const changed = sameDay ? events.filter((event) => {
      const prior = previousEvents.find((item) => item.ticker === event.ticker);
      return !prior || eventSignature([prior]) !== eventSignature([event]);
    }) : events;
    const parts = buildDigest({ schedule, events: changed, market, coverageWarnings: partial ? ["partial"] : [],
      dashboardUrl: this.dashboardUrl, update: sameDay });
    if (preview) return { queued: false, reason: "preview", parts };
    const title = `Reverse Splits — ${sameDay ? "Update" : schedule.weekly ? "Week Ahead" : "Next Trading Session"}`;
    const summary = changed.length ? `${changed.map((event) => `$${event.ticker}${event.ratio ? ` 1-for-${event.ratio}` : ""}${event.effectiveDate ? ` (${event.effectiveDate})` : ` ${event.status}`}`).join("; ")}. Open Reverse Splits for sources and details.`.slice(0, 500)
      : "No confirmed reverse splits found for the selected period. Open the list for source coverage.";
    const queued = this.store.publish({ date: schedule.date, signature, parts, events, title, summary,
      createdAt: now.toISOString(), expiresAt: this.calendar.easternWallClockAtUtc(shiftDate(schedule.date, 1), "00:00") });
    return { queued, reason: queued ? "queued" : "delivery_pending" };
  }
}
