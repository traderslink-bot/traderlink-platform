import { CoachUsEquitiesReviewCalendarService } from "../../coach/server/market-calendar/coach-us-equities-review-calendar-service";

const calendar = new CoachUsEquitiesReviewCalendarService();
const dayMs = 86_400_000;
const isoDay = (at: number) => new Date(at).toISOString().slice(0, 10);

type ClosedStudySession = {
  basisFrom: string;
  close: number;
  weekFinished: boolean;
};
let cached: { date: string; session?: ClosedStudySession } | undefined;

/** On open or unverified dates, callers retain their exact-date split check. */
export function closedScannerStudySession(date: string): ClosedStudySession | undefined {
  if (cached?.date === date) return cached.session;
  cached = { date };
  try {
    if (calendar.session(date).state === "open") return;
    const today = Date.parse(date);
    for (let at = today - dayMs; ; at -= dayMs) {
      const basisFrom = isoDay(at);
      const previous = calendar.session(basisFrom);
      if (!previous.postMarketEndUtc) continue;

      // A Thursday before an open Friday is still a forming week. A Friday holiday
      // or a weekend can use the just-finished week, including a shortened session.
      const friday = at + (5 - new Date(at).getUTCDay()) * dayMs;
      cached.session = {
        basisFrom,
        close: Date.parse(previous.postMarketEndUtc) / 1000,
        weekFinished: today >= friday || calendar.nextOpenSessionDate(date) > isoDay(friday),
      };
      return cached.session;
    }
  } catch {
    // The calendar rejects dates outside its verified coverage.
    return;
  }
}
