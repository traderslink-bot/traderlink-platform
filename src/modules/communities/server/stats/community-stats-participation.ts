import type {
  CommunityStatsDay, CommunityStatsMemberEvidence, CommunityStatsParticipation,
  CommunityStatsSurface, CommunityStatsSurfaceParticipation, CommunityStatsWindow,
} from "../../contracts/community-stats-contracts";
import {
  COMMUNITY_STATS_DAY_MS, isStatsCalendarDate, resolveStatsWindow, statsDateAt,
  statsDateMs, statsDateRange, statsMedian, statsMemberEligible, statsMemberPoints, statsSourceObserved,
} from "./community-stats-coverage";

function surfaceParticipation(
  evidence: CommunityStatsMemberEvidence, window: CommunityStatsWindow, surface: CommunityStatsSurface,
): CommunityStatsSurfaceParticipation {
  const bounds = resolveStatsWindow(window);
  const points = statsMemberPoints(evidence, window).filter(point => point.surface === surface);
  const counts = new Map<string, number>();
  const lastByDate = new Map<string,(typeof points)[number]>();
  const firstByDate = new Map<string,(typeof points)[number]>();
  for (const point of points) {
    const date = point.occurredAtUtc.slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
    lastByDate.set(date,point);
    if(!firstByDate.has(date))firstByDate.set(date,point);
  }
  const days: CommunityStatsDay[] = [];
  const closedGaps: number[] = [], returns: string[] = [];
  let anchor = false, gap = 0, streak = 0, longestStreak = 0;
  let tailState:CommunityStatsDay["state"]="unknown";
  // Include positive activity on the first partial day; eligibility and coverage still gate quiet days.
  const firstComplete = Math.floor(Math.max(bounds.retainedFrom,Math.min(bounds.end,...evidence.eligibility.filter(row=>row.surface===surface).map(row=>Date.parse(row.fromUtc)),...points.map(point=>Date.parse(point.occurredAtUtc)))) / COMMUNITY_STATS_DAY_MS) * COMMUNITY_STATS_DAY_MS;
  const lastComplete = Math.floor(bounds.end / COMMUNITY_STATS_DAY_MS) * COMMUNITY_STATS_DAY_MS - COMMUNITY_STATS_DAY_MS;
  const retainedPartialAnchor = points.filter(point => Date.parse(point.occurredAtUtc) < firstComplete).at(-1);
  if (retainedPartialAnchor) {
    const at = Date.parse(retainedPartialAnchor.occurredAtUtc);
    anchor = statsMemberEligible(evidence, surface, at, firstComplete)
      && statsSourceObserved(evidence.coverage, evidence.communityId, surface, at, firstComplete);
  }
  for (const date of statsDateRange(statsDateAt(firstComplete), statsDateAt(lastComplete))) {
    const calendarEligible=isStatsCalendarDate(date,window);
    const left = statsDateMs(date), right = left + COMMUNITY_STATS_DAY_MS;
    const eligible = statsMemberEligible(evidence, surface, left, right);
    const observed = eligible && statsSourceObserved(evidence.coverage, evidence.communityId, surface, left, right);
    const count = counts.get(date) ?? 0;
    const state = !eligible&&count===0 ? "ineligible" : observed ? "observed" : "unknown";
    tailState=state;
    if(calendarEligible)days.push(Object.freeze({ date, state, eventCount: count }));
    if (count > 0) {
      const firstAt=Date.parse(firstByDate.get(date)!.occurredAtUtc),lastAt=Date.parse(lastByDate.get(date)!.occurredAtUtc);
      if (anchor && gap > 0 && statsMemberEligible(evidence,surface,left,firstAt+1)
        && statsSourceObserved(evidence.coverage,evidence.communityId,surface,left,firstAt+1)) {
        if(date>=window.fromDate)closedGaps.push(gap);
        if (gap >= window.quietDays && date >= window.fromDate) returns.push(date);
      }
      anchor=statsMemberEligible(evidence,surface,lastAt,right)&&statsSourceObserved(evidence.coverage,evidence.communityId,surface,lastAt,right);
      gap=0;
      if(calendarEligible){streak=state==="observed"&&date>=window.fromDate?streak+1:0;longestStreak=Math.max(longestStreak,streak);}
      else if(!anchor)streak=0;
    } else if(state!=="observed"){anchor=false;gap=0;streak=0;}
    else if(calendarEligible){if(anchor)gap+=1;streak=0;}
  }
  const reportDays = days.filter(day => day.date >= window.fromDate);
  let currentGapState: CommunityStatsSurfaceParticipation["currentGapState"] =
    anchor ? "observed" : tailState === "unknown" ? "unknown"
      : tailState === "ineligible" ? "ineligible" : "no_prior_observation";
  let currentGap = currentGapState === "observed" ? gap : null;
  const partialStart = Math.floor(bounds.end / COMMUNITY_STATS_DAY_MS) * COMMUNITY_STATS_DAY_MS;
  if (partialStart < bounds.end) {
    // Positive activity can end a gap today; today's absent activity cannot add a quiet day.
    const eligible = statsMemberEligible(evidence, surface, partialStart, bounds.end);
    const observed = eligible && statsSourceObserved(evidence.coverage, evidence.communityId, surface, partialStart, bounds.end);
    const lastPoint = lastByDate.get(statsDateAt(partialStart));
    const lastAt = lastPoint ? Date.parse(lastPoint.occurredAtUtc) : null;
    const positiveAnchorKnown = lastAt !== null && statsMemberEligible(evidence, surface, lastAt, bounds.end)
      && statsSourceObserved(evidence.coverage, evidence.communityId, surface, lastAt, bounds.end);
    const firstPoint=firstByDate.get(statsDateAt(partialStart)),firstAt=firstPoint?Date.parse(firstPoint.occurredAtUtc):null;
    if(firstAt!==null&&anchor&&gap>0&&statsMemberEligible(evidence,surface,partialStart,Math.min(bounds.end,firstAt+1))
      &&statsSourceObserved(evidence.coverage,evidence.communityId,surface,partialStart,Math.min(bounds.end,firstAt+1))){
      if(statsDateAt(partialStart)>=window.fromDate){closedGaps.push(gap);if(gap>=window.quietDays)returns.push(statsDateAt(partialStart));}
    }
    if (positiveAnchorKnown) {
      currentGapState = "observed"; currentGap = 0;
    } else if (!eligible || !observed) { currentGapState = eligible ? "unknown" : "ineligible"; currentGap = null; }
  }
  return Object.freeze({
    surface, firstObservedAtUtc: points[0]?.occurredAtUtc ?? null,
    lastObservedAtUtc: points.at(-1)?.occurredAtUtc ?? null,
    eventsInReport: points.filter(point => point.occurredAtUtc.slice(0, 10) >= window.fromDate).length,
    activeCompleteDates: reportDays.filter(day => day.eventCount > 0).length,
    observedCompleteDates: reportDays.filter(day => day.state === "observed").length,
    unknownCompleteDates: reportDays.filter(day => day.state === "unknown").length,
    currentGapDays: currentGap, currentGapState,
    measuredThroughUtc:new Date(bounds.end).toISOString(),
    closedGaps: Object.freeze(closedGaps),
    longestClosedGapDays: closedGaps.length ? Math.max(...closedGaps) : null,
    medianClosedGapDays: statsMedian(closedGaps),
    longestCompleteDateStreak: longestStreak,
    returnDatesInReport: Object.freeze(returns), days: Object.freeze(reportDays),
  });
}

/** No score, causal attribution or global 'inactive member' label is produced. */
export function calculateCommunityStatsParticipation(
  evidence: CommunityStatsMemberEvidence, window: CommunityStatsWindow,
): CommunityStatsParticipation {
  const discord = surfaceParticipation(evidence, window, "discord");
  const web = surfaceParticipation(evidence, window, "web");
  const bounds=resolveStatsWindow(window);
  const points=statsMemberPoints(evidence,window).filter(point=>Date.parse(point.occurredAtUtc)>=bounds.start);
  const discordActive=points.some(point=>point.surface==="discord");
  const webActive=points.some(point=>point.surface==="web");
  const complete=(surface:CommunityStatsSurface)=>statsMemberEligible(evidence,surface,bounds.start,bounds.end)
    &&statsSourceObserved(evidence.coverage,evidence.communityId,surface,bounds.start,bounds.end);
  const discordKnown=complete("discord"),webKnown=complete("web");
  // Positive actions stand on their own. Only a negative claim needs continuous tracking.
  const segment=discordActive&&webActive?"both"
    :discordActive?(webKnown?"discord_only":"discord_active")
    :webActive?(discordKnown?"web_only":"web_active")
    :discordKnown&&webKnown?"neither_observed"
    :evidence.webLinkState==="unlinked"?"unlinked":"insufficient_coverage";
  return Object.freeze({
    communityId: evidence.communityId, discordUserId: evidence.discordUserId, segment,
    quietWindowFromDate: window.fromDate,
    quietWindowThroughDate: statsDateAt(bounds.end-1),
    quietWindowCompleteDates: Math.max(0,Math.floor(bounds.end/COMMUNITY_STATS_DAY_MS)-Math.ceil(bounds.start/COMMUNITY_STATS_DAY_MS)), discord, web,
  });
}
