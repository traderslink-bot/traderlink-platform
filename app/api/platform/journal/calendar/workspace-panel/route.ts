import { withCalendarDataRuntime } from "@/app/(dashboard)/calendar/calendar-data";
import type { CalendarData, CalendarFilterInput, CalendarView, CalendarWeekOption } from "@/app/(dashboard)/calendar/calendar-types";
import { journalScopeCurrentWeek, readJournalDemoScopeClock } from "@/src/modules/journal/server/demo/journal-demo-scope-clock";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "private, no-store, max-age=0" };

function monthStart(month: string): string { return `${month}-01`; }
function monthEnd(month: string): string { const [year, numericMonth] = month.split("-").map(Number); return new Date(Date.UTC(year, numericMonth, 0)).toISOString().slice(0, 10); }
function weekStart(date: string): string { const value = new Date(`${date}T12:00:00.000Z`); value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7)); return value.toISOString().slice(0, 10); }
function weekEnd(week: string): string { const value = new Date(`${week}T12:00:00.000Z`); value.setUTCDate(value.getUTCDate() + 4); return value.toISOString().slice(0, 10); }
function validMonth(value: string | null): string | null { return value && /^\d{4}-(0[1-9]|1[0-2])$/u.test(value) ? value : null; }
function validWeek(value: string | null): string | null { return value && /^\d{4}-\d{2}-\d{2}$/u.test(value) ? weekStart(value) : null; }

async function panelModel(scope: ReturnType<typeof requireTraderLinkPlatformRequestScope>, request: Request) {
  const query = new URL(request.url).searchParams;
  const requestedView: CalendarView = query.get("view") === "week" ? "week" : "month";
  const requestedMonth = validMonth(query.get("month"));
  const requestedWeek = validWeek(query.get("week"));
  if ((query.get("month") && !requestedMonth) || (query.get("week") && !requestedWeek)) {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "period" });
  }
  return await withCalendarDataRuntime(scope, (read) => {
    const unfiltered: CalendarFilterInput = { currency: "all", direction: "all", endDate: "", performance: "all", pnlRange: "all", session: "all", startDate: "", symbol: "all", tradeCount: "all" };
    const catalog = read(unfiltered);
    const currentWeek = journalScopeCurrentWeek(readJournalDemoScopeClock(scope), catalog.timezone ?? "America/New_York");
    const activityDates = catalog.days.filter((day) => day.tradeCount > 0 || day.hasSessionReview).map((day) => day.date);
    const selectedMonth = requestedMonth ?? currentWeek.slice(0, 7);
    const selectedWeek = requestedWeek ?? currentWeek;
    const availableMonths = [...new Set([...activityDates.map((date) => date.slice(0, 7)), selectedMonth])].sort();
    const availableWeeks = [...new Set([...activityDates.map(weekStart), selectedWeek])].sort();
    const availableWeekOptions: readonly CalendarWeekOption[] = availableWeeks.map((week) => Object.freeze({
      months: Object.freeze([...new Set(activityDates.filter((date) => weekStart(date) === week).map((date) => date.slice(0, 7)))]),
      week,
    }));
    const initialFilters: CalendarFilterInput = {
      ...unfiltered,
      currency: catalog.currency ?? "all",
      endDate: requestedView === "month" ? monthEnd(selectedMonth) : weekEnd(selectedWeek),
      startDate: requestedView === "month" ? monthStart(selectedMonth) : selectedWeek,
    };
    const initialData: CalendarData = read(initialFilters);
    return Object.freeze({ availableMonths, availableWeekOptions, availableWeeks, currentWeek, initialData, initialFilters, initialView: requestedView, selectedMonth, selectedWeek });
  });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    return Response.json({ data: await panelModel(scope, request), status: "ready" }, { headers: HEADERS });
  } catch (error) {
    return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 });
  }
}
