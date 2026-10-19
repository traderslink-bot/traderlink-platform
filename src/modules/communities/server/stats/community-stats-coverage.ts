import type {
  CommunityStatsActivityPoint, CommunityStatsCoverage, CommunityStatsMemberEvidence,
  CommunityStatsSource, CommunityStatsSurface, CommunityStatsWindow,
} from "../../contracts/community-stats-contracts";

export const COMMUNITY_STATS_DAY_MS = 86_400_000;
export const COMMUNITY_STATS_HISTORY_FROM = "2015-01-01";

export function statsUtcMs(value: string): number {
  const time = Date.parse(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
    || !Number.isFinite(time) || new Date(time).toISOString() !== value) {
    throw new Error("Stats requires a canonical UTC timestamp.");
  }
  return time;
}

export function statsDateMs(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) throw new Error("Invalid Stats date.");
  return statsUtcMs(`${value}T00:00:00.000Z`);
}

export function statsDateAt(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function resolveStatsWindow(window: CommunityStatsWindow) {
  const start = statsDateMs(window.fromDate);
  const through = statsDateMs(window.throughDate);
  const asOf = statsUtcMs(window.asOfUtc);
  if (window.timezone !== "UTC" || ![7, 14, 30].includes(window.quietDays)
    || !["calendar_days", "weekdays"].includes(window.calendar)
    || through < start
    || through > statsDateMs(statsDateAt(asOf))) throw new Error("Invalid Stats report window.");
  const end = Math.min(through + COMMUNITY_STATS_DAY_MS, asOf);
  const retainedFrom = statsDateMs(COMMUNITY_STATS_HISTORY_FROM);
  if (start < retainedFrom) throw new Error("Named Stats window exceeds retained history.");
  return Object.freeze({ start, end, asOf, retainedFrom });
}

export function statsDateRange(fromDate: string, throughDate: string): readonly string[] {
  const from = statsDateMs(fromDate), through = statsDateMs(throughDate);
  if (through < from) return Object.freeze([]);
  if ((through - from) / COMMUNITY_STATS_DAY_MS > 40000) throw new Error("Stats date range is not bounded.");
  const dates: string[] = [];
  for (let time = from; time <= through; time += COMMUNITY_STATS_DAY_MS) dates.push(statsDateAt(time));
  return Object.freeze(dates);
}

export function isStatsCalendarDate(date: string, window: CommunityStatsWindow): boolean {
  const weekday = new Date(statsDateMs(date)).getUTCDay();
  return window.calendar === "calendar_days" || (weekday !== 0 && weekday !== 6);
}

/** Half-open interval union; adjacency is continuous, an uncovered millisecond is not. */
export function statsRangeCovered(from: number, until: number, ranges: readonly (readonly [number, number])[]): boolean {
  if (until <= from) return false;
  let cursor = from;
  for (const [left, right] of [...ranges].sort((a, b) => a[0] - b[0])) {
    if (right < left) throw new Error("Invalid Stats observation interval.");
    if (right <= cursor) continue;
    if (left > cursor) return false;
    cursor = Math.max(cursor, right);
    if (cursor >= until) return true;
  }
  return false;
}

export function statsSourceObserved(
  coverage: readonly CommunityStatsCoverage[], communityId: string,
  source: CommunityStatsSource, from: number, until: number,
): boolean {
  const rows = coverage.filter(row => row.communityId === communityId && row.source === source);
  const observed: [number, number][] = [];
  for (const row of rows) {
    const left = statsUtcMs(row.fromUtc), right = statsUtcMs(row.untilUtc);
    if (right <= left) throw new Error("Invalid Stats source coverage.");
    if (row.state === "gap" && left < until && right > from) return false;
    if (row.state === "observed") observed.push([left, right]);
  }
  return statsRangeCovered(from, until, observed);
}

export function statsMemberEligible(
  evidence: CommunityStatsMemberEvidence, surface: CommunityStatsSurface,
  from: number, until: number,
): boolean {
  const ranges = evidence.eligibility.filter(row => row.communityId === evidence.communityId
    && row.discordUserId === evidence.discordUserId && row.surface === surface).map(row => {
    const left = statsUtcMs(row.fromUtc), right = row.untilUtc === null ? Number.POSITIVE_INFINITY : statsUtcMs(row.untilUtc);
    if (right <= left) throw new Error("Invalid Stats member eligibility.");
    return [left, right] as const;
  });
  return statsRangeCovered(from, until, ranges);
}

/** Filter before aggregation; never infer another tenant/person from a supplied name. */
export function statsMemberPoints(evidence: CommunityStatsMemberEvidence, window: CommunityStatsWindow): readonly CommunityStatsActivityPoint[] {
  const bounds = resolveStatsWindow(window);
  const points = new Map<string, CommunityStatsActivityPoint>();
  for (const point of evidence.activity) {
    if (point.communityId !== evidence.communityId || point.discordUserId !== evidence.discordUserId) continue;
    const at = statsUtcMs(point.occurredAtUtc);
    if (at < bounds.retainedFrom || at >= bounds.end) continue;
    if (!["web", "discord"].includes(point.surface) || !point.eventId
      || !["web_visit", "message", "reaction_add", "thread_reply", "forum_post", "voice_participation"].includes(point.kind)) {
      throw new Error("Invalid Stats contribution projection.");
    }
    if ((point.surface === "web") !== (point.kind === "web_visit")) throw new Error("Stats event surface mismatch.");
    if (point.surface === "web") {
      if (point.platformUserId === null) continue;
      const linkedAtEvent = evidence.eligibility.some(row => row.communityId === evidence.communityId
        && row.discordUserId === evidence.discordUserId && row.surface === "web"
        && row.platformUserId === point.platformUserId && statsUtcMs(row.fromUtc) <= at
        && (row.untilUtc === null || statsUtcMs(row.untilUtc) > at));
      if (!linkedAtEvent) continue;
    }
    // A surviving authored message proves this positive action, not continuous membership.
    if (!(point.surface==="discord"&&point.evidence==="imported_message")&&!statsMemberEligible(evidence, point.surface, at, at + 1)) continue;
    const key = `${point.surface}:${point.eventId}`;
    const previous = points.get(key);
    if (previous && (previous.occurredAtUtc !== point.occurredAtUtc || previous.kind !== point.kind
      || previous.platformUserId !== point.platformUserId)) throw new Error("Conflicting Stats event identity.");
    points.set(key, point);
  }
  return Object.freeze([...points.values()].sort((a, b) => a.occurredAtUtc.localeCompare(b.occurredAtUtc) || a.eventId.localeCompare(b.eventId)));
}

export function statsMedian(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
